import { verifyToken, createClerkClient } from "@clerk/backend";

const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const DISTRICT_AUTHORITY_EMAIL = (process.env.DISTRICT_AUTHORITY_EMAIL || "").trim().toLowerCase();

function getRoleForEmailServer(email: string | undefined | null): string {
  if (email && ADMIN_EMAIL) {
    const clean = email.trim().toLowerCase();
    if (clean === ADMIN_EMAIL) return "Admin";
    if (DISTRICT_AUTHORITY_EMAIL && clean === DISTRICT_AUTHORITY_EMAIL) return "District Authority";
  }
  return "Citizen";
}

async function verifyAndGetClerkEmail(req: any): Promise<string | null> {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const verified = await verifyToken(token, {
      secretKey: secretKey || undefined,
      jwtKey: process.env.CLERK_JWT_KEY || undefined,
    });
    if (!verified || !verified.sub) return null;

    if (secretKey) {
      try {
        const clerk = createClerkClient({ secretKey, publishableKey });
        const user = await clerk.users.getUser(verified.sub);
        const primaryEmail =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
          user.emailAddresses[0]?.emailAddress;
        if (primaryEmail) return primaryEmail;
      } catch {
        // Fallthrough
      }
    }
    const claims = verified as Record<string, any>;
    const emailFromClaims = claims.email || claims.email_address || claims.primary_email || claims.user_email;
    if (typeof emailFromClaims === "string" && emailFromClaims.includes("@")) return emailFromClaims;
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const verifiedEmail = await verifyAndGetClerkEmail(req);
  if (!verifiedEmail) {
    return res.status(401).json({ error: "unauthorized", message: "Unauthenticated Clerk session token required." });
  }

  const role = getRoleForEmailServer(verifiedEmail);
  if (role === "Citizen") {
    return res.status(403).json({ error: "forbidden", message: "User is not authorized to view audit logs." });
  }

  return res.json([]);
}
