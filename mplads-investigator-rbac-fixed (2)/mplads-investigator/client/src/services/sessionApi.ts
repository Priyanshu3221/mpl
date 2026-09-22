import { can, isValidPermission, normalizeRole, type Permission, type Role } from "@/constants/permissions";

/**
 * Session + authorization service.
 *
 * The browser is never trusted to state its own role. This module asks the
 * backend (`/api/me`) which role the *session token* belongs to, and asks it
 * again (`/api/authz/check`) before any privileged action is carried out.
 */

export type SessionIdentity = {
  userId: string;
  email: string | null;
  role: Role | null;
  permissions: Permission[];
  /** True when this session's role came from the local-dev bootstrap, not an Admin assignment. */
  bootstrap: boolean;
};

/**
 * When true, a privileged action is refused if the backend cannot be reached.
 * Defaults to false so the mock/offline prototype still runs under `vite dev`
 * with no API server; set VITE_REQUIRE_SERVER_AUTHZ=true for any real deployment.
 */
const requireServerAuthz = import.meta.env.VITE_REQUIRE_SERVER_AUTHZ === "true";

type TokenProvider = (() => Promise<string | null>) | null;
let tokenProvider: TokenProvider = null;

/**
 * Snapshot of the role proven by the current session. Written only by
 * AuthContext from the verified identity, and used purely as an offline
 * fallback. Callers are never allowed to supply their own role for an
 * authorization decision.
 */
let sessionRole: Role | null = null;

/** Called by AuthContext so this module can attach the Clerk session token. */
export function registerTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

/** Called by AuthContext whenever the verified session role changes. */
export function setSessionRole(role: Role | null) {
  sessionRole = role;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = tokenProvider ? await tokenProvider() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* fall through unauthenticated; the server will reject */
  }
  return headers;
}

/** Resolves the role of the current session. Returns null if unavailable. */
export async function fetchSessionIdentity(): Promise<SessionIdentity | null> {
  try {
    const response = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
      headers: await authHeaders(),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<SessionIdentity> & { role?: unknown };
    return {
      userId: typeof data.userId === "string" ? data.userId : "",
      email: typeof data.email === "string" ? data.email : null,
      role: normalizeRole(data.role),
      permissions: Array.isArray(data.permissions) ? data.permissions.filter(isValidPermission) : [],
      bootstrap: data.bootstrap === true,
    };
  } catch {
    // No API server reachable (offline / mock-only prototype run).
    return null;
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Server-enforced permission gate. Call this at the top of any privileged
 * service function; hiding a button is not an authorization control.
 *
 * - 200 from the server  -> allowed
 * - 401/403 from server  -> refused, regardless of what the UI believes
 * - server unreachable   -> refused if VITE_REQUIRE_SERVER_AUTHZ=true,
 *                           otherwise falls back to the local check so the
 *                           offline prototype keeps working, using the role
 *                           from the verified session (not from the caller).
 */
export async function assertPermission(permission: Permission): Promise<void> {
  let reachable = false;
  try {
    const response = await fetch("/api/authz/check", {
      method: "POST",
      credentials: "include",
      headers: await authHeaders(),
      body: JSON.stringify({ permission }),
    });
    reachable = true;
    if (response.ok) return;
    if (response.status === 401) throw new AuthorizationError("Your session has expired. Please sign in again.");
    if (response.status === 403) {
      const body = await response.json().catch(() => ({}));
      throw new AuthorizationError(
        typeof body?.message === "string" ? body.message : "Your role does not permit this action."
      );
    }
    // Any other status (404 when the API is not deployed, 5xx) -> fall through.
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    reachable = false;
  }

  if (requireServerAuthz && !reachable) {
    throw new AuthorizationError("Authorization service is unavailable. Action refused.");
  }
  if (!can(sessionRole, permission)) {
    throw new AuthorizationError("Your role does not permit this action.");
  }
}
