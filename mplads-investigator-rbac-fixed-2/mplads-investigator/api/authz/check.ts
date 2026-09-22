import { getPrincipal } from "../../server/authz";
import { can, isValidPermission } from "../../shared/roles";

/**
 * Vercel equivalent of POST /api/authz/check in server/index.ts.
 * Decides purely from the verified session token; the body only names the
 * permission being requested, never the caller's role.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const permission = (req.body ?? {}).permission;
  if (!isValidPermission(permission)) {
    return res.status(400).json({ error: "bad_request", message: "A known permission is required." });
  }

  try {
    const principal = await getPrincipal(req);
    if (!principal) {
      return res.status(401).json({ error: "unauthenticated", message: "A valid session is required." });
    }
    if (!principal.role) {
      return res.status(403).json({ error: "role_unassigned", message: "No role assigned to your account." });
    }
    if (!can(principal.role, permission)) {
      return res.status(403).json({
        error: "forbidden",
        message: `Role '${principal.role}' is not permitted to perform this action.`,
        required: permission,
      });
    }
    return res.json({ allowed: true, role: principal.role, permission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    if (message.includes("not configured")) {
      return res.status(503).json({ error: "authz_unconfigured", message: "Authorization is not configured." });
    }
    return res.status(401).json({ error: "invalid_session", message: "Session could not be verified." });
  }
}
