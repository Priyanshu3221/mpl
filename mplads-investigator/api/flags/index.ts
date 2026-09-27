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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const verified = await verifyToken(token, {
      secretKey: secretKey || undefined,
      jwtKey: process.env.CLERK_JWT_KEY || undefined,
    });

    if (!verified || !verified.sub) {
      return null;
    }

    if (secretKey) {
      try {
        const clerk = createClerkClient({ secretKey, publishableKey });
        const user = await clerk.users.getUser(verified.sub);
        const primaryEmail =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
          user.emailAddresses[0]?.emailAddress;
        if (primaryEmail) return primaryEmail;
      } catch {
        // Fallthrough to claims
      }
    }

    const claims = verified as Record<string, any>;
    const emailFromClaims =
      claims.email || claims.email_address || claims.primary_email || claims.user_email;
    if (typeof emailFromClaims === "string" && emailFromClaims.includes("@")) {
      return emailFromClaims;
    }

    return null;
  } catch {
    return null;
  }
}

interface PythonFlagItem {
  rule_id?: string;
  project_id?: string;
  triggered?: boolean;
  severity?: string;
  observed_value?: string | number;
  threshold?: string | number;
  exception_applied?: boolean;
  explanation?: string;
  source_version?: string;
  timestamp?: string;
}

function mapRuleCategory(ruleId: string): string {
  if (ruleId.startsWith("SC_") || ruleId.startsWith("ST_")) return "SC/ST Compliance";
  if (ruleId.startsWith("TIME-")) return "Timeline Delay";
  if (ruleId.startsWith("INC-")) return "Prohibited Category";
  if (ruleId.startsWith("FIN-")) return "Financial Anomaly";
  return "Compliance Anomaly";
}

function mapRuleName(ruleId: string): string {
  const titles: Record<string, string> = {
    "SC_001": "SC Allocation Below 15% Threshold",
    "ST_001": "ST Allocation Below 7.5% Threshold",
    "TIME-01": "Sanction Process Exceeds 45 Days",
    "TIME-02": "Sanctioned Project Exceeds 1-Year Milestone",
    "TIME-03": "Project Incomplete 18 Months Post MP Demit",
    "INC-01": "Operation and Maintenance Type Work Flagged",
    "INC-02": "Commercial/Private-Establishment Work Flagged",
    "INC-03": "Land Acquisition Expenditure Flagged",
    "INC-07": "Religious-Use Work Flagged",
    "INC-09": "Individual/Family Benefit Asset Flagged",
    "FIN-001": "Category Level Cost Deviation Outlier",
  };
  return titles[ruleId] ? `[${ruleId}] ${titles[ruleId]}` : `[${ruleId}] Compliance Signal`;
}

function mapSeverity(severity: string | undefined): "High" | "Medium" | "Low" {
  const lower = (severity || "").toLowerCase();
  if (lower === "high") return "High";
  if (lower === "medium") return "Medium";
  if (lower === "low") return "Low";
  return "Medium";
}

function adaptPythonFlagsToMockFlags(pyFlags: PythonFlagItem[]) {
  return pyFlags.map((flag, index) => {
    const ruleId = flag.rule_id || "ANOMALY";
    const rawProjectId = flag.project_id || `P-${1000 + index}`;
    return {
      id: `FLG-DET-${index + 100}`,
      projectId: rawProjectId,
      category: mapRuleCategory(ruleId),
      ruleName: mapRuleName(ruleId),
      severity: mapSeverity(flag.severity),
      state: "All",
      fy: "2024-25",
      status: "Open",
      observed: String(flag.observed_value ?? "N/A"),
      threshold: String(flag.threshold ?? "N/A"),
      exceptionApplied: Boolean(flag.exception_applied),
      explanation: flag.explanation || "Detection engine rule trigger.",
      sourceVersion: flag.source_version || "SIH26102_v1.0",
      timestamp: flag.timestamp || new Date().toISOString(),
    };
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const verifiedEmail = await verifyAndGetClerkEmail(req);
  if (!verifiedEmail) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Unauthenticated Clerk session token required.",
    });
  }

  const role = getRoleForEmailServer(verifiedEmail);
  if (role === "Citizen") {
    return res.status(403).json({
      error: "forbidden",
      message: `User '${verifiedEmail}' with role 'Citizen' is not authorized to view risk flags.`,
    });
  }

  const pythonEngineUrl = process.env.DETECTION_ENGINE_URL || "http://localhost:8000";
  try {
    const response = await fetch(`${pythonEngineUrl}/detect/demo`);
    if (!response.ok) {
      return res.status(502).json({
        error: "detection_engine_error",
        message: `Python detection engine responded with HTTP status ${response.status}`,
      });
    }
    const data = (await response.json()) as { flags?: PythonFlagItem[] };
    const transformedFlags = adaptPythonFlagsToMockFlags(data.flags || []);
    return res.json(transformedFlags);
  } catch (error) {
    return res.status(503).json({
      error: "detection_engine_unreachable",
      message: `Could not connect to Python Detection Engine at ${pythonEngineUrl}. Ensure the detection service is running and accessible.`,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
