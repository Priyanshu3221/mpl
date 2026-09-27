import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken, createClerkClient } from "@clerk/backend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERMISSIONS = {
  VIEW_AUDIT: "VIEW_AUDIT",
  VIEW_FLAGS: "VIEW_FLAGS",
  REVIEW_FLAGS: "REVIEW_FLAGS",
  EXPORT_REPORTS: "EXPORT_REPORTS",
} as const;

const ROLES = {
  CITIZEN: "Citizen",
  DISTRICT_AUTHORITY: "District Authority",
  ADMIN: "Admin",
} as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.CITIZEN]: ["VIEW_DASHBOARD", "VIEW_PROJECTS", "VIEW_REPORTS"],
  [ROLES.DISTRICT_AUTHORITY]: [
    "VIEW_DASHBOARD",
    "VIEW_PROJECTS",
    "CREATE_PROJECT",
    "EDIT_PROJECT",
    "SUBMIT_PROJECT",
    "REVIEW_PROJECT",
    "APPROVE_PROJECT",
    "REJECT_PROJECT",
    "VIEW_FLAGS",
    "REVIEW_FLAGS",
    "VIEW_REPORTS",
    "EXPORT_REPORTS",
    "VIEW_AUDIT",
  ],
  [ROLES.ADMIN]: [
    "VIEW_DASHBOARD",
    "VIEW_PROJECTS",
    "CREATE_PROJECT",
    "EDIT_PROJECT",
    "SUBMIT_PROJECT",
    "REVIEW_PROJECT",
    "APPROVE_PROJECT",
    "REJECT_PROJECT",
    "VIEW_REPORTS",
    "EXPORT_REPORTS",
    "VIEW_FLAGS",
    "REVIEW_FLAGS",
    "MANAGE_USERS",
    "VIEW_AUDIT",
  ],
};

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const DISTRICT_AUTHORITY_EMAIL = (process.env.DISTRICT_AUTHORITY_EMAIL || "").trim().toLowerCase();

function normalizeRole(value: unknown): string {
  if (typeof value !== "string") return ROLES.CITIZEN;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "citizen" || trimmed === "public") return ROLES.CITIZEN;
  if (trimmed === "admin" || trimmed === "system administrator" || trimmed === "administrator") return ROLES.ADMIN;
  if (trimmed.includes("district") || trimmed.includes("authority") || trimmed === "mp" || trimmed.includes("agency")) return ROLES.DISTRICT_AUTHORITY;
  return ROLES.CITIZEN;
}

function getRoleForEmailServer(email: string | undefined | null): string {
  if (email && ADMIN_EMAIL) {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL) {
      return ROLES.ADMIN;
    }
    if (DISTRICT_AUTHORITY_EMAIL && cleanEmail === DISTRICT_AUTHORITY_EMAIL) {
      return ROLES.DISTRICT_AUTHORITY;
    }
  }
  return ROLES.CITIZEN;
}


const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

const clerkClient = secretKey ? createClerkClient({ secretKey, publishableKey }) : null;

async function verifyAndGetClerkEmail(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
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

    if (clerkClient) {
      try {
        const user = await clerkClient.users.getUser(verified.sub);
        const primaryEmail =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
          user.emailAddresses[0]?.emailAddress;
        if (primaryEmail) return primaryEmail;
      } catch (err) {
        console.warn("Clerk SDK user fetch warning:", err instanceof Error ? err.message : String(err));
      }
    }

    const claims = verified as Record<string, any>;
    const emailFromClaims =
      claims.email ||
      claims.email_address ||
      claims.primary_email ||
      claims.primaryEmail ||
      claims.user_email;

    if (typeof emailFromClaims === "string" && emailFromClaims.includes("@")) {
      return emailFromClaims;
    }

    return null;
  } catch (err) {
    console.warn("Clerk token verification failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const verifiedEmail = await verifyAndGetClerkEmail(req);
  if (!verifiedEmail) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Unauthenticated Clerk session token required.",
    });
  }
  (req as any).verifiedEmail = verifiedEmail;
  next();
};

const requirePermission = (perm: string) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const verifiedEmail = (req as any).verifiedEmail || (await verifyAndGetClerkEmail(req));

  if (!verifiedEmail) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Authentication failed. A valid, verified Clerk authentication token is required.",
    });
  }

  const role = getRoleForEmailServer(verifiedEmail);
  const allowedPermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.CITIZEN];

  if (!allowedPermissions.includes(perm)) {
    return res.status(403).json({
      error: "forbidden",
      message: `User '${verifiedEmail}' with assigned role '${role}' is not authorized to access this resource (requires permission '${perm}').`,
    });
  }

  (req as any).user = { email: verifiedEmail, role };
  next();
};

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.json());
  app.use(express.static(staticPath));

  app.get("/api/auth/me", async (req, res) => {
    const verifiedEmail = await verifyAndGetClerkEmail(req);
    if (!verifiedEmail) {
      return res.json({ authenticated: false, email: null, role: ROLES.CITIZEN });
    }
    const role = getRoleForEmailServer(verifiedEmail);
    return res.json({ authenticated: true, email: verifiedEmail, role });
  });

  // Server-side Gemini Translation Endpoint for Indian Languages
  app.get("/api/audit", requireAuth as never, requirePermission(PERMISSIONS.VIEW_AUDIT) as never, (_req, res) => {
    res.json({ authorized: true, entries: [] });
  });

  app.get("/api/flags/collusion", requireAuth as never, requirePermission(PERMISSIONS.REVIEW_FLAGS) as never, (_req, res) => {
    res.json({ authorized: true, networks: [] });
  });

  /* ----------------------------------------------------------------------
   * Detection Engine Adapter & Proxy Endpoint
   * Proxy to FastAPI Python Detection Engine (http://localhost:8000/detect)
   * Transforms raw Python output into frontend MockFlag format.
   * -------------------------------------------------------------------- */
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
      // Safely preserve MP_YEAR:* aggregate SC/ST flag project identifiers
      const projectId = rawProjectId;

      return {
        id: `FLG-DET-${index + 100}`,
        projectId,
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

  app.post("/api/flags/detect", requireAuth as never, requirePermission(PERMISSIONS.VIEW_FLAGS) as never, async (_req, res) => {
    const pythonEngineUrl = process.env.DETECTION_ENGINE_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${pythonEngineUrl}/detect/demo`);
      if (!response.ok) {
        return res.status(502).json({
          error: "detection_engine_error",
          message: `Python detection engine responded with HTTP status ${response.status}`,
        });
      }
      const data = (await response.json()) as { flags?: PythonFlagItem[]; projects_scanned?: number; total_flags?: number };
      const rawFlags = data.flags || [];
      const transformedFlags = adaptPythonFlagsToMockFlags(rawFlags);

      return res.json({
        authorized: true,
        source: "python_engine",
        projectsScanned: data.projects_scanned || 0,
        totalFlags: data.total_flags || transformedFlags.length,
        flags: transformedFlags,
      });
    } catch (error) {
      return res.status(503).json({
        error: "detection_engine_unreachable",
        message: `Could not connect to Python Detection Engine at ${pythonEngineUrl}. Ensure the detection service is running and accessible.`,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/flags", requireAuth as never, requirePermission(PERMISSIONS.VIEW_FLAGS) as never, async (_req, res) => {
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
  });

  app.post("/api/reports/export", requireAuth as never, requirePermission(PERMISSIONS.EXPORT_REPORTS) as never, (_req, res) => {
    res.json({ authorized: true });
  });

  app.post("/api/translate", async (req, res) => {
    const { text, targetLanguage } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text string is required" });
    }

    if (!apiKey) {
      return res.json({ translatedText: text, source: "fallback_no_key" });
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Translate the following user interface text into ${targetLanguage || "Hindi"}. Respond ONLY with the translation text, no preamble, explanation, or quotes.\n\nText: ${text}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        return res.json({ translatedText: text, source: "fallback_api_error" });
      }

      const result = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const translatedText =
        result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

      return res.json({ translatedText, source: "gemini" });
    } catch {
      return res.json({ translatedText: text, source: "fallback_exception" });
    }
  });

  app.post("/api/ai/explain-flag", requireAuth, requirePermission("VIEW_FLAGS"), async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "missing_api_key",
        message: "Server environment variable GEMINI_API_KEY is not configured.",
      });
    }

    const {
      flagId,
      projectId,
      category,
      ruleName,
      severity,
      observed,
      threshold,
      exceptionApplied,
      explanation,
      sourceVersion,
      timestamp,
    } = req.body || {};

    if (!flagId && !ruleName) {
      return res.status(400).json({ error: "Flag identifier or rule details required" });
    }

    const prompt = `You are an AI assistant helping an investigator reviewing an MPLADS (Members of Parliament Local Area Development Scheme) project risk flag.

Below are the details of the risk flag to analyze:
- Flag ID: ${flagId || "N/A"}
- Project ID: ${projectId || "N/A"}
- Rule Category: ${category || "N/A"}
- Rule Name / ID: ${ruleName || "N/A"}
- Severity: ${severity || "N/A"}
- Observed Value: ${observed || "N/A"}
- Threshold Value: ${threshold || "N/A"}
- Exception Applied: ${exceptionApplied ? "Yes" : "No"}
- Existing Flag Note / Explanation: ${explanation || "N/A"}
- Rule Source Version: ${sourceVersion || "SIH26102_Architecture_Rules_Roadmap_v1.0"}
- Trigger Timestamp: ${timestamp || new Date().toISOString()}

Requirements:
Produce a concise, factual explanation for the investigator covering:
1. What triggered the flag.
2. Why the observed value is relevant to the rule.
3. What the investigator should verify next.
4. Any important limitation or uncertainty.

Do not invent facts that are not present in the supplied data.

Respond ONLY with a valid JSON object matching this structure:
{
  "explanation": "Concise, factual explanation covering what triggered the flag, relevance of observed value, next verification steps, and limitations.",
  "ruleCategory": "${category || "Compliance Anomaly"}",
  "severity": "${severity || "Medium"}",
  "keyIndicators": ["Key indicator 1", "Key indicator 2", "Key indicator 3"],
  "recommendedAction": "Actionable verification steps for the investigator.",
  "confidenceScore": 90
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(502).json({
          error: "gemini_api_error",
          message: `Gemini API error (Status ${response.status}): ${errorText}`,
        });
      }

      const result = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      let cleanJson = rawText;
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(cleanJson);
      } catch {
        parsed = {
          explanation: rawText,
          ruleCategory: category || "Compliance Anomaly",
          severity: severity || "Medium",
          keyIndicators: [`Observed value (${observed}) vs threshold (${threshold})`],
          recommendedAction: "Review site documentation and verify sanction logs.",
          confidenceScore: 85,
        };
      }

      return res.json({
        flagId: flagId || "FLAG-AI",
        ruleCategory: parsed.ruleCategory || category || "Compliance Anomaly",
        severity: parsed.severity || severity || "Medium",
        summary: parsed.explanation || rawText || "Explanation generated by Gemini AI.",
        keyIndicators: parsed.keyIndicators && Array.isArray(parsed.keyIndicators)
          ? parsed.keyIndicators
          : [`Observed: ${observed}`, `Threshold: ${threshold}`],
        recommendedAction: parsed.recommendedAction || "Conduct district inspection.",
        confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 90,
        modelIdentifier: "Google Gemini 2.5 Flash",
      });
    } catch (error) {
      return res.status(500).json({
        error: "server_error",
        message: error instanceof Error ? error.message : "Failed to process AI explain request.",
      });
    }
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
