import { verifyToken, createClerkClient } from "@clerk/backend";

const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

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

const mockProjects = [
  { id: "MPLADS-2024-001", name: "District Hospital ICU Unit Upgrade", category: "Healthcare", state: "Uttar Pradesh", district: "Varanasi", constituency: "Varanasi", agency: "Public Works Department", fy: "2024-25", status: "Sanctioned", amount: 4500000, utilized: 3800000, progress: 85, submitted: "2024-04-12", updated: "2024-09-15" },
  { id: "MPLADS-2024-002", name: "Government High School Smart Classrooms", category: "Education", state: "Uttar Pradesh", district: "Varanasi", constituency: "Varanasi", agency: "District Education Officer", fy: "2024-25", status: "In Progress", amount: 2500000, utilized: 1800000, progress: 72, submitted: "2024-05-01", updated: "2024-09-20" },
  { id: "MPLADS-2024-003", name: "Community Solar Water Pumping System", category: "Drinking Water", state: "Maharashtra", district: "Pune", constituency: "Pune", agency: "Rural Development Agency", fy: "2024-25", status: "Completed", amount: 1800000, utilized: 1800000, progress: 100, submitted: "2024-02-10", updated: "2024-08-30" },
  { id: "MPLADS-2024-004", name: "Rural Connectivity Concrete Road (KM 3-8)", category: "Roads & Bridges", state: "Bihar", district: "Patna", constituency: "Patna Sahib", agency: "Rural Works Department", fy: "2024-25", status: "Under Review", amount: 6000000, utilized: 0, progress: 0, submitted: "2024-08-14", updated: "2024-09-01" },
  { id: "MPLADS-2024-005", name: "SC Colony Community Hall Construction", category: "SC/ST Welfare", state: "Karnataka", district: "Mysuru", constituency: "Mysuru", agency: "Social Welfare Department", fy: "2024-25", status: "Approved", amount: 3200000, utilized: 1200000, progress: 40, submitted: "2024-06-20", updated: "2024-09-10" },
];

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const verifiedEmail = await verifyAndGetClerkEmail(req);
  if (!verifiedEmail) {
    return res.status(401).json({ error: "unauthorized", message: "Unauthenticated Clerk session token required." });
  }

  return res.json(mockProjects);
}
