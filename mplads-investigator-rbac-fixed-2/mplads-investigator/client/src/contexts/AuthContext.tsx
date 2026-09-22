import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  can,
  canAccessPath,
  landingFor,
  normalizeRole,
  DEFAULT_ROLE,
  type Permission,
  type Role,
  ROLES,
  ROLE_LABELS,
} from "@/constants/permissions";
import { registerTokenProvider, setSessionRole, fetchSessionIdentity, type SessionIdentity } from "@/services/sessionApi";

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

/**
 * Demo role impersonation is OFF unless ALL of the following hold:
 *   - this is a development build (`import.meta.env.DEV`, set by Vite based
 *     on the build mode itself, not by any env var a deployment could flip),
 *   - VITE_ENABLE_ROLE_DEMO=true was set at build time, and
 *   - the signed-in user's REAL role (from the verified session) is Admin.
 * It never grants a permission the backend would not also grant, because the
 * backend derives the role from the session token and has no concept of
 * impersonation at all — `assertPermission`'s server call and every
 * `requirePermission` check on the backend always use the real token.
 */
const roleDemoEnabled = import.meta.env.VITE_ENABLE_ROLE_DEMO === "true";
const IMPERSONATION_KEY = "mplads.demo_impersonated_role";

export function ClerkConfigurationNotice() {
  return <main className="min-h-screen bg-[#f6f8fb] px-6 py-16 text-[#152536]"><div className="mx-auto max-w-xl rounded-lg border border-[#dce5ee] bg-white p-8 shadow-sm"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#b27b00]">Configuration required</p><h1 className="text-2xl font-semibold">Clerk authentication is not configured</h1><p className="mt-4 text-sm leading-6 text-[#607387]">Add <code className="rounded bg-[#eef3f7] px-1.5 py-0.5 text-[#102a43]">VITE_CLERK_PUBLISHABLE_KEY</code> to the project environment to enable sign-in, sessions, and protected routes.</p></div></main>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkPublishableKey) return <ClerkConfigurationNotice />;
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <RoleProvider>{children}</RoleProvider>
    </ClerkProvider>
  );
}

function AuthLoading() {
  return <div className="flex min-h-[40vh] items-center justify-center p-6"><div className="w-full max-w-md space-y-4"><div className="h-3 w-24 animate-pulse rounded bg-[#dce5ee]"/><div className="h-10 w-3/4 animate-pulse rounded bg-[#dce5ee]"/><div className="h-24 animate-pulse rounded bg-[#e9eff4]"/></div></div>;
}

type RoleState = {
  /** Role proven by the authenticated session. Never user-selectable. */
  realRole: Role | null;
  /** Role the UI renders with (equals realRole unless an Admin is demoing). */
  effectiveRole: Role | null;
  /** True once the session role has been resolved (from the server or Clerk). */
  resolved: boolean;
  /** True when the backend confirmed the role, rather than just the Clerk claim. */
  serverVerified: boolean;
  /** True when the backend granted Admin via the local-dev BOOTSTRAP_ADMIN_EMAIL path, not a real assignment. */
  isBootstrapAdmin: boolean;
  impersonatedRole: Role | null;
  canImpersonate: boolean;
  setImpersonatedRole: (role: Role | null) => void;
};

const RoleContext = createContext<RoleState>({
  realRole: null,
  effectiveRole: null,
  resolved: false,
  serverVerified: false,
  isBootstrapAdmin: false,
  impersonatedRole: null,
  canImpersonate: false,
  setImpersonatedRole: () => {},
});

function RoleProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [identity, setIdentity] = useState<SessionIdentity | null>(null);
  const [identityChecked, setIdentityChecked] = useState(false);
  const [impersonatedRole, setImpersonatedRoleState] = useState<Role | null>(null);

  // Let the service layer attach the Clerk session token to API calls.
  useEffect(() => {
    registerTokenProvider(isSignedIn ? getToken : null);
  }, [isSignedIn, getToken]);

  // The Clerk publicMetadata claim is the fast path; the server is authoritative.
  const claimRole = useMemo(
    () => (userLoaded && user ? normalizeRole(user.publicMetadata?.role) : null),
    [userLoaded, user]
  );

  useEffect(() => {
    let cancelled = false;
    if (!isLoaded || !isSignedIn) {
      setIdentity(null);
      setIdentityChecked(isLoaded && !isSignedIn);
      return;
    }
    setIdentityChecked(false);
    fetchSessionIdentity()
      .then((result) => {
        if (!cancelled) setIdentity(result);
      })
      .finally(() => {
        if (!cancelled) setIdentityChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  // The server answer wins over the client-side claim whenever it is available.
  const rawRole: Role | null = identity ? identity.role : claimRole;
  const resolved = isLoaded && userLoaded && (!isSignedIn || identityChecked);
  // A signed-in user with no explicit role claim is a new/unassigned account,
  // not an unauthenticated one: they get the Citizen floor immediately rather
  // than being stuck on the "role pending" screen. Anything above Citizen can
  // only come from an Admin's assignment (see UsersPage / setUserRoleInClerk),
  // which is what populates `identity.role` / `claimRole` in the first place —
  // this line never itself grants anything higher than DEFAULT_ROLE.
  const realRole: Role | null = resolved && isSignedIn ? rawRole ?? DEFAULT_ROLE : rawRole;
  const canImpersonate = import.meta.env.DEV && roleDemoEnabled && realRole === ROLES.ADMIN;

  // Privileged service calls fall back to this role when the API is offline.
  useEffect(() => {
    setSessionRole(realRole);
  }, [realRole]);

  // Restore a previous demo selection only for users who really are Admins.
  useEffect(() => {
    if (!canImpersonate) {
      setImpersonatedRoleState(null);
      return;
    }
    setImpersonatedRoleState(normalizeRole(window.localStorage.getItem(IMPERSONATION_KEY)));
  }, [canImpersonate]);

  const setImpersonatedRole = useCallback(
    (role: Role | null) => {
      if (!canImpersonate) return; // non-admins can never set this
      if (role) window.localStorage.setItem(IMPERSONATION_KEY, role);
      else window.localStorage.removeItem(IMPERSONATION_KEY);
      setImpersonatedRoleState(role);
    },
    [canImpersonate]
  );

  const value: RoleState = useMemo(
    () => ({
      realRole,
      effectiveRole: canImpersonate && impersonatedRole ? impersonatedRole : realRole,
      resolved,
      serverVerified: Boolean(identity),
      // Only the server-verified identity can say this — a stale/missing
      // identity fetch never implies bootstrap, it just implies "unknown".
      isBootstrapAdmin: identity?.bootstrap === true,
      impersonatedRole: canImpersonate ? impersonatedRole : null,
      canImpersonate,
      setImpersonatedRole,
    }),
    [realRole, canImpersonate, impersonatedRole, resolved, identity, setImpersonatedRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleState() {
  return useContext(RoleContext);
}

/** The role the UI renders with. Derived from the session, never from user input. */
export function useCurrentRole(): Role | null {
  return useRoleState().effectiveRole;
}

/** The role proven by the session, ignoring any Admin demo impersonation. */
export function useRealRole(): Role | null {
  return useRoleState().realRole;
}

/**
 * Admin-only demo workspace switch. Guarded here as well as at the call site so
 * that a non-admin invoking it directly from the console achieves nothing.
 */
export function useSwitchWorkspaceRole() {
  const { canImpersonate, setImpersonatedRole } = useRoleState();
  const [, setLocation] = useLocation();
  return useCallback(
    (newRole: Role | null) => {
      if (!canImpersonate) return;
      setImpersonatedRole(newRole);
      if (newRole && !canAccessPath(newRole, window.location.pathname)) {
        setLocation(landingFor(newRole));
      }
    },
    [canImpersonate, setImpersonatedRole, setLocation]
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const currentPath = window.location.pathname;
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || !isSignedIn) return <AuthLoading />;
  return <>{children}</>;
}

export function RoleProtectedRoute({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { effectiveRole: role, resolved } = useRoleState();
  const [, setLocation] = useLocation();

  const allowed = Boolean(role) && can(role, permission);

  useEffect(() => {
    // Decide only once the session role is known, so we neither flash protected
    // content nor bounce a legitimate user mid-load.
    if (isLoaded && isSignedIn && resolved && !allowed) {
      setLocation("/access-denied");
    }
  }, [isLoaded, isSignedIn, resolved, allowed, setLocation]);

  if (!isLoaded || !isSignedIn || !resolved) return <AuthLoading />;
  if (!allowed) return null;
  return <>{children}</>;
}

/** Only same-origin, in-app paths are acceptable as a post-login redirect. */
function safeRedirectPath(raw: string | null): string | null {
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  // Reject absolute URLs, protocol-relative URLs and anything not rooted at "/".
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function RedirectSignedIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const { effectiveRole: role, resolved } = useRoleState();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const path = window.location.pathname;
    const isVerificationRoute =
      path.includes("/sso-callback") ||
      path.includes("/factor-") ||
      path.includes("/verify");

    if (!isLoaded || !isSignedIn || isVerificationRoute || !resolved) return;

    // The role's landing page is the default. A requested redirect is honoured
    // only when it is an in-app path this role is actually allowed to open.
    const requested = safeRedirectPath(new URLSearchParams(window.location.search).get("redirect_url"));
    const target = requested && canAccessPath(role, requested) ? requested : landingFor(role);
    setLocation(target);
  }, [isLoaded, isSignedIn, role, resolved, setLocation]);

  if (!isLoaded || isSignedIn) return <AuthLoading />;
  return null;
}

export function UserIdentity() {
  const role = useCurrentRole();
  const { user } = useUser();
  return { user, role, roleLabel: role ? ROLE_LABELS[role] : "Role not assigned" };
}

export function useCan(permission: Permission) { return can(useCurrentRole(), permission); }
