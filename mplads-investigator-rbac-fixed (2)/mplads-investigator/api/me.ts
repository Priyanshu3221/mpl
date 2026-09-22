import { getPrincipal } from "../server/authz";

/**
 * Vercel equivalent of GET /api/me in server/index.ts.
 * Returns the role attached to the verified session token.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const principal = await getPrincipal(req);
    if (!principal) {
      return res.status(401).json({ error: "unauthenticated", message: "A valid session is required." });
    }
    return res.json({
      userId: principal.userId,
      email: principal.email,
      role: principal.role,
      permissions: principal.permissions,
      bootstrap: principal.bootstrap,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    if (message.includes("not configured")) {
      return res.status(503).json({ error: "authz_unconfigured", message: "Authorization is not configured." });
    }
    return res.status(401).json({ error: "invalid_session", message: "Session could not be verified." });
  }
}
