import { normalizeRole, type Role } from "../shared/roles";

/**
 * All reads and writes against Clerk's Backend API (the identity provider),
 * plus the mapping from a raw Clerk user object onto the shape the client's
 * User Management screen renders.
 *
 * This is the ONLY module that talks to Clerk's Backend API. Every function
 * here requires `CLERK_SECRET_KEY`, which is a server-only secret (never a
 * `VITE_`-prefixed variable, so Vite never bundles it into client code).
 *
 * `setUserRoleInClerk` is the only code path in the project that can move a
 * user above the Citizen default. It is only ever reached after a caller has
 * already passed `requirePermission(PERMISSIONS.MANAGE_USERS)`, i.e. after
 * the *caller's own* session token has been verified as belonging to an
 * Admin. The target user's new role takes effect the next time their session
 * is re-resolved by `getPrincipal` in `server/authz.ts` — never by anything
 * the target user's own browser can write.
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_BASE = (process.env.CLERK_API_BASE || "https://api.clerk.com/v1").replace(/\/$/, "");

export function clerkAdminConfigured() {
  return Boolean(CLERK_SECRET_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/* ------------------------------------------------------------ raw shape -- */

type ClerkEmailAddress = { id: string; email_address: string };
type ClerkUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  public_metadata?: { role?: unknown; department?: unknown; constituency?: unknown };
  banned?: boolean;
  locked?: boolean;
  last_sign_in_at?: number | null;
  created_at?: number | null;
};

export type ManagedUserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  constituencyOrDistrict: string;
  status: "Active" | "Inactive";
  lastLogin: string;
};

function primaryEmail(user: ClerkUser): string | null {
  const addresses = user.email_addresses ?? [];
  const primary = addresses.find((addr) => addr.id === user.primary_email_address_id);
  return primary?.email_address ?? addresses[0]?.email_address ?? null;
}

function formatTimestamp(ms: number | null | undefined): string {
  if (!ms) return "Never";
  try {
    return new Date(ms).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Never";
  }
}

/** Maps a raw Clerk user object onto the shape the User Management UI renders. */
function toManagedUser(user: ClerkUser): ManagedUserRecord {
  const email = primaryEmail(user);
  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.username ||
    email ||
    user.id;
  return {
    id: user.id,
    name,
    email: email ?? "",
    // A user with no role assignment yet is a Citizen by default — same
    // floor `shared/roles.ts#DEFAULT_ROLE` applies everywhere else.
    role: normalizeRole(user.public_metadata?.role) ?? "Citizen",
    department: typeof user.public_metadata?.department === "string" ? user.public_metadata.department : "—",
    constituencyOrDistrict:
      typeof user.public_metadata?.constituency === "string" ? user.public_metadata.constituency : "—",
    status: user.banned ? "Inactive" : "Active",
    lastLogin: formatTimestamp(user.last_sign_in_at),
  };
}

/* --------------------------------------------------------------- reads -- */

/** Admin-facing directory of every registered account. */
export async function listClerkUsers(): Promise<ManagedUserRecord[]> {
  if (!CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is not configured");

  const response = await fetch(`${CLERK_API_BASE}/users?limit=200&order_by=-created_at`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Clerk user list failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const body = (await response.json()) as ClerkUser[] | { data?: ClerkUser[] };
  const users = Array.isArray(body) ? body : (body.data ?? []);
  return users.map(toManagedUser);
}

/**
 * Short-lived cache for the fallback lookup `authz.ts` uses when a session
 * token does not itself carry a `role`/`email` claim (e.g. the Clerk
 * dashboard's session token template has not been customized yet). Keeping
 * this cache small and short (15s) means an Admin's role change is picked up
 * on the affected user's very next request without hammering Clerk's API on
 * every single authenticated request.
 */
const principalCache = new Map<string, { user: ClerkUser; fetchedAt: number }>();
const PRINCIPAL_CACHE_TTL_MS = 15 * 1000;

/**
 * Fetches a single user's role + email directly from Clerk, bypassing the
 * session token entirely. Used ONLY as a fallback in `getPrincipal` — never
 * as a substitute for verifying the token's signature — so that role
 * assignment and Admin bootstrap work correctly even when the Clerk Session
 * Token has not been customized to embed `role`/`email` claims.
 */
export async function getClerkUserById(
  userId: string
): Promise<{ role: Role | null; email: string | null } | null> {
  if (!CLERK_SECRET_KEY || !userId) return null;

  const cached = principalCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < PRINCIPAL_CACHE_TTL_MS) {
    return { role: normalizeRole(cached.user.public_metadata?.role), email: primaryEmail(cached.user) };
  }

  try {
    const response = await fetch(`${CLERK_API_BASE}/users/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return null;
    const user = (await response.json()) as ClerkUser;
    principalCache.set(userId, { user, fetchedAt: Date.now() });
    return { role: normalizeRole(user.public_metadata?.role), email: primaryEmail(user) };
  } catch {
    // Network/Clerk outage: callers treat null as "use the token's own claims".
    return null;
  }
}

/* -------------------------------------------------------------- writes -- */

export async function setUserRoleInClerk(targetUserId: string, role: Role): Promise<void> {
  if (!CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is not configured");
  if (!targetUserId) throw new Error("A target user id is required");

  const response = await fetch(`${CLERK_API_BASE}/users/${encodeURIComponent(targetUserId)}/metadata`, {
    method: "PATCH",
    headers: authHeaders(),
    // Clerk merge-patches public_metadata rather than replacing it, so this
    // does not clobber any other metadata fields the account may have.
    body: JSON.stringify({ public_metadata: { role } }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Clerk metadata update failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  // The cached copy (if any) is now stale — drop it so the very next
  // fallback lookup for this user re-fetches the new role.
  principalCache.delete(targetUserId);
}

/** Activates/deactivates a user account via Clerk's ban/unban endpoints. */
export async function setUserActiveInClerk(targetUserId: string, active: boolean): Promise<void> {
  if (!CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is not configured");
  if (!targetUserId) throw new Error("A target user id is required");

  const response = await fetch(
    `${CLERK_API_BASE}/users/${encodeURIComponent(targetUserId)}/${active ? "unban" : "ban"}`,
    { method: "POST", headers: authHeaders() }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Clerk ${active ? "unban" : "ban"} failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  principalCache.delete(targetUserId);
}
