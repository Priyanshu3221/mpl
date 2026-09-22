import { getPrincipal } from "../../../server/authz";
import { clerkAdminConfigured, setUserRoleInClerk } from "../../../server/clerkUsers";
import { can, normalizeRole, PERMISSIONS } from "../../../shared/roles";

/**
 * Vercel equivalent of PATCH /api/users/:id/role in server/index.ts.
 * Only an Admin's own verified session token can reach the Clerk write below;
 * nothing in the request body influences who the caller is.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let principal;
  try {
    principal = await getPrincipal(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    if (message.includes("not configured")) {
      return res.status(503).json({ error: "authz_unconfigured", message: "Authorization is not configured." });
    }
    return res.status(401).json({ error: "invalid_session", message: "Session could not be verified." });
  }

  if (!principal) {
    return res.status(401).json({ error: "unauthenticated", message: "A valid session is required." });
  }
  if (!principal.role || !can(principal.role, PERMISSIONS.MANAGE_USERS)) {
    return res.status(403).json({
      error: "forbidden",
      message: `Role '${principal.role ?? "unassigned"}' is not permitted to manage users.`,
      required: PERMISSIONS.MANAGE_USERS,
    });
  }

  const role = normalizeRole((req.body ?? {}).role);
  if (!role) {
    return res.status(400).json({ error: "bad_request", message: "A valid role is required." });
  }
  if (!clerkAdminConfigured()) {
    return res.status(503).json({
      error: "clerk_admin_unconfigured",
      message: "CLERK_SECRET_KEY is not configured; the role change was not persisted to the identity provider.",
    });
  }

  const targetUserId = req.query?.id;
  try {
    await setUserRoleInClerk(Array.isArray(targetUserId) ? targetUserId[0] : targetUserId, role);
  } catch (error) {
    return res.status(502).json({
      error: "clerk_update_failed",
      message: error instanceof Error ? error.message : "Could not update the user's role.",
    });
  }

  return res.json({ authorized: true, actorRole: principal.role, userId: targetUserId, role });
}
