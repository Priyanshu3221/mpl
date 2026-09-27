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

// Sample metrics data matching DashboardData schema
const dashboardMock = {
  projects: [
    { id: "MPLADS-2024-001", name: "District Hospital ICU Unit Upgrade", category: "Healthcare", state: "Uttar Pradesh", district: "Varanasi", constituency: "Varanasi", agency: "Public Works Department", fy: "2024-25", status: "Sanctioned", amount: 4500000, utilized: 3800000, progress: 85, submitted: "2024-04-12", updated: "2024-09-15" },
    { id: "MPLADS-2024-002", name: "Government High School Smart Classrooms", category: "Education", state: "Uttar Pradesh", district: "Varanasi", constituency: "Varanasi", agency: "District Education Officer", fy: "2024-25", status: "In Progress", amount: 2500000, utilized: 1800000, progress: 72, submitted: "2024-05-01", updated: "2024-09-20" },
    { id: "MPLADS-2024-003", name: "Community Solar Water Pumping System", category: "Drinking Water", state: "Maharashtra", district: "Pune", constituency: "Pune", agency: "Rural Development Agency", fy: "2024-25", status: "Completed", amount: 1800000, utilized: 1800000, progress: 100, submitted: "2024-02-10", updated: "2024-08-30" },
    { id: "MPLADS-2024-004", name: "Rural Connectivity Concrete Road (KM 3-8)", category: "Roads & Bridges", state: "Bihar", district: "Patna", constituency: "Patna Sahib", agency: "Rural Works Department", fy: "2024-25", status: "Under Review", amount: 6000000, utilized: 0, progress: 0, submitted: "2024-08-14", updated: "2024-09-01" },
    { id: "MPLADS-2024-005", name: "SC Colony Community Hall Construction", category: "SC/ST Welfare", state: "Karnataka", district: "Mysuru", constituency: "Mysuru", agency: "Social Welfare Department", fy: "2024-25", status: "Approved", amount: 3200000, utilized: 1200000, progress: 40, submitted: "2024-06-20", updated: "2024-09-10" },
  ],
  flags: [
    { id: "FLG-DET-100", projectId: "MP-2024-001", category: "Financial Anomaly", ruleName: "[FIN-001] Category Level Cost Deviation Outlier", severity: "High", state: "Uttar Pradesh", fy: "2024-25", status: "Open", observed: "0.95", threshold: "0.8", exceptionApplied: false, explanation: "High similarity score detected across multiple project proposals", sourceVersion: "v1.0.0", timestamp: "2026-03-30T10:15:30.000Z" },
    { id: "FLG-DET-101", projectId: "MP-2024-002", category: "Timeline Delay", ruleName: "[TIME-01] Sanction Process Exceeds 45 Days", severity: "Medium", state: "Uttar Pradesh", fy: "2024-25", status: "Under Review", observed: "62 days", threshold: "45 days", exceptionApplied: false, explanation: "Sanction timeline exceeded baseline limit by 17 days", sourceVersion: "v1.0.0", timestamp: "2026-03-30T10:15:30.000Z" },
  ],
  users: [
    { id: "USR-001", name: "Priyanshu Singh Rathore", email: "priyanshusr322@gmail.com", role: "Admin", status: "Active", district: "National Level", lastActive: "Just now" },
    { id: "USR-002", name: "District Collector Varanasi", email: "dc.varanasi@mplads.gov.in", role: "District Authority", status: "Active", district: "Varanasi", lastActive: "10 mins ago" },
  ],
  activity: [
    { id: "ACT-001", user: "Priyanshu Singh Rathore", action: "Initiated AI anomaly scan across 5 active project proposals", timestamp: "Just now", type: "system" },
    { id: "ACT-002", user: "System Monitor", action: "FastAPI Detection Engine returned zero unhandled exceptions", timestamp: "5 mins ago", type: "flag" },
  ],
  financialTrend: [
    { month: "Apr", sanctioned: 12.4, utilized: 8.2 },
    { month: "May", sanctioned: 18.6, utilized: 12.1 },
    { month: "Jun", sanctioned: 24.2, utilized: 17.5 },
    { month: "Jul", sanctioned: 31.0, utilized: 22.8 },
    { month: "Aug", sanctioned: 38.5, utilized: 29.4 },
    { month: "Sep", sanctioned: 45.0, utilized: 35.8 },
  ],
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const verifiedEmail = await verifyAndGetClerkEmail(req);
  if (!verifiedEmail) {
    return res.status(401).json({ error: "unauthorized", message: "Unauthenticated Clerk session token required." });
  }

  const role = getRoleForEmailServer(verifiedEmail);
  if (role === "Citizen") {
    return res.status(403).json({ error: "forbidden", message: "User is not authorized to access investigator dashboard." });
  }

  // Fetch flags dynamically from Python detection engine if available
  const pythonEngineUrl = process.env.DETECTION_ENGINE_URL || "http://localhost:8000";
  let liveFlags = dashboardMock.flags;
  try {
    const pyResp = await fetch(`${pythonEngineUrl}/detect/demo`);
    if (pyResp.ok) {
      const pyData = (await pyResp.json()) as { flags?: any[] };
      if (pyData.flags && Array.isArray(pyData.flags)) {
        liveFlags = pyData.flags.map((flag: any, index: number) => ({
          id: `FLG-DET-${index + 100}`,
          projectId: flag.project_id || `MP-2024-${index + 1}`,
          category: flag.rule_id?.startsWith("FIN") ? "Financial Anomaly" : "Compliance Anomaly",
          ruleName: `[${flag.rule_id || "ANOMALY"}] ${flag.explanation || "Rule trigger"}`,
          severity: flag.severity === "CRITICAL" || flag.severity === "HIGH" ? "High" : flag.severity === "MEDIUM" ? "Medium" : "Low",
          state: "Uttar Pradesh",
          fy: "2024-25",
          status: "Open",
          observed: String(flag.observed_value ?? "N/A"),
          threshold: String(flag.threshold ?? "N/A"),
          exceptionApplied: Boolean(flag.exception_applied),
          explanation: flag.explanation || "Detection engine trigger.",
          sourceVersion: flag.source_version || "v1.0.0",
          timestamp: flag.timestamp || new Date().toISOString(),
        }));
      }
    }
  } catch {
    // Keep baseline flags
  }

  return res.json({ ...dashboardMock, flags: liveFlags });
}
