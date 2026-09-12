import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { can, landingFor, normalizeRole, type Permission, type Role, ROLE_LABELS } from "@/constants/permissions";

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export function ClerkConfigurationNotice() {
  return <main className="min-h-screen bg-[#f6f8fb] px-6 py-16 text-[#152536]"><div className="mx-auto max-w-xl rounded-lg border border-[#dce5ee] bg-white p-8 shadow-sm"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#b27b00]">Configuration required</p><h1 className="text-2xl font-semibold">Clerk authentication is not configured</h1><p className="mt-4 text-sm leading-6 text-[#607387]">Add <code className="rounded bg-[#eef3f7] px-1.5 py-0.5 text-[#102a43]">VITE_CLERK_PUBLISHABLE_KEY</code> to the project environment to enable sign-in, sessions, and protected routes.</p></div></main>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkPublishableKey) return <ClerkConfigurationNotice />;
  return <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>;
}

function AuthLoading() {
  return <div className="flex min-h-[40vh] items-center justify-center p-6"><div className="w-full max-w-md space-y-4"><div className="h-3 w-24 animate-pulse rounded bg-[#dce5ee]"/><div className="h-10 w-3/4 animate-pulse rounded bg-[#dce5ee]"/><div className="h-24 animate-pulse rounded bg-[#e9eff4]"/></div></div>;
}

export function useCurrentRole(): Role | null {
  const { user } = useUser();
  return normalizeRole(user?.publicMetadata?.role);
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (isLoaded && !isSignedIn) setLocation(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`); }, [isLoaded, isSignedIn, setLocation]);
  if (!isLoaded || !isSignedIn) return <AuthLoading />;
  return <>{children}</>;
}

export function RoleProtectedRoute({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const role = useCurrentRole();
  const [, setLocation] = useLocation();
  useEffect(() => { if (role && !can(role, permission)) setLocation("/access-denied"); }, [role, permission, setLocation]);
  if (!role) return <AuthLoading />;
  if (!can(role, permission)) return <AuthLoading />;
  return <>{children}</>;
}

export function RedirectSignedIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const role = useCurrentRole();
  const [, setLocation] = useLocation();
  useEffect(() => { if (isLoaded && isSignedIn && role) setLocation(landingFor(role)); }, [isLoaded, isSignedIn, role, setLocation]);
  if (!isLoaded || isSignedIn) return <AuthLoading />;
  return null;
}

export function UserIdentity() {
  const { user } = useUser();
  const role = useCurrentRole();
  return { user, role, roleLabel: role ? ROLE_LABELS[role] : "Role not assigned" };
}

export function useCan(permission: Permission) { return can(useCurrentRole(), permission); }
