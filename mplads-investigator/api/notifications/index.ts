import { verifyToken, createClerkClient } from "@clerk/backend";

const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

async function verifyAndGetClerkEmail(req: any): Promise<string | null> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) return null;
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

const mockNotifications = [
  {
    id: "NOTIF-001",
    title: "New Anomaly Flag Triggered",
    message: "Financial cost outlier detected for District Hospital ICU Unit Upgrade (MPLADS-2024-001).",
    timestamp: "2026-03-30T10:15:30.000Z",
    read: false,
    type: "flag",
    link: "/flags",
  },
  {
    id: "NOTIF-002",
    title: "Project Milestone Approved",
    message: "Sanction stage approved for Community Solar Water Pumping System (MPLADS-2024-003).",
    timestamp: "2026-03-29T14:20:00.000Z",
    read: true,
    type: "project",
    link: "/projects/MPLADS-2024-003",
  },
  {
    id: "NOTIF-003",
    title: "AI Risk Summary Generated",
    message: "Gemini AI analysis report compiled for active SC/ST welfare projects in Varanasi.",
    timestamp: "2026-03-28T09:00:00.000Z",
    read: true,
    type: "system",
    link: "/reports",
  },
];

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const verifiedEmail = await verifyAndGetClerkEmail(req);
  if (!verifiedEmail) {
    return res.status(401).json({ error: "unauthorized", message: "Unauthenticated Clerk session token required." });
  }

  return res.json(mockNotifications);
}
