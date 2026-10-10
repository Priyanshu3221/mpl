import { getPrincipal } from "../../server/authz";
import { clerkAdminConfigured, listClerkUsers } from "../../server/clerkUsers";
import { can, PERMISSIONS } from "../../shared/roles";

/**
 * Vercel equivalent of GET /api/users in server/index.ts.
 * Returns the live Clerk user directory. Only reachable by a caller whose
 * own verified session token resolves to a role with MANAGE_USERS.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
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
      message: `Role '${principal.role ?? "unassigned"}' is not permitted to view the user directory.`,
      required: PERMISSIONS.MANAGE_USERS,
    });
  }

  if (!clerkAdminConfigured()) {
    return res.status(503).json({
      error: "clerk_admin_unconfigured",
      message: "CLERK_SECRET_KEY is not configured; the registered-user directory cannot be read from Clerk.",
    });
  }

  try {
    const users = await listClerkUsers();
    return res.json(users);
  } catch (error) {
    return res.status(502).json({
      error: "clerk_list_failed",
      message: error instanceof Error ? error.message : "Could not read the user directory from Clerk.",
    });
  }
}
