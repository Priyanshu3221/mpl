import "./env"; // MUST be the first import — populates process.env before ./authz and ./clerkUsers read it.
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, requirePermission, type AuthedRequest } from "./authz";
import { isValidPermission, normalizeRole, PERMISSIONS, TRANSITION_PERMISSIONS, can } from "../shared/roles";
import { clerkAdminConfigured, listClerkUsers, setUserActiveInClerk, setUserRoleInClerk } from "./clerkUsers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Serve static files from dist/public in production
const staticPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

app.use(express.json());
app.use(express.static(staticPath));

/* ----------------------------------------------------------------------
 * Core Data Mock Payloads for Serverless & Direct API Responses
 * -------------------------------------------------------------------- */
const sampleProjects = [
  {
    id: "MPLADS-2024-001",
    name: "Construction of Multi-Purpose Community Hall",
    category: "Infrastructure",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune Central",
    agency: "Public Works Department (PWD)",
    fy: "2024-25",
    status: "Approved",
    amount: 5000000,
    utilized: 3200000,
    progress: 65,
    submitted: "2024-01-15",
    updated: "2024-05-10"
  },
  {
    id: "MPLADS-2024-002",
    name: "Installation of Solar LED Street Lights in Rural Panchayats",
    category: "Infrastructure",
    state: "Maharashtra",
    district: "Nagpur",
    constituency: "Nagpur Urban",
    agency: "Nagpur Zilla Parishad",
    fy: "2024-25",
    status: "Under implementation",
    amount: 3500000,
    utilized: 2100000,
    progress: 50,
    submitted: "2024-02-01",
    updated: "2024-06-01"
  },
  {
    id: "MPLADS-2024-003",
    name: "Upgradation of High School Science Laboratories",
    category: "Education",
    state: "Odisha",
    district: "Khurda",
    constituency: "Bhubaneswar",
    agency: "District Education Office",
    fy: "2023-24",
    status: "Completed",
    amount: 2500000,
    utilized: 2500000,
    progress: 100,
    submitted: "2023-08-12",
    updated: "2024-03-20"
  }
];

const sampleReports = [
  {
    id: "REP-2024-001",
    district: "Pune",
    state: "Maharashtra",
    fy: "2024-25",
    agencyName: "Public Works Department (PWD)",
    allocatedAmount: 50000000,
    utilizedAmount: 38500000,
    utilizationPercentage: 77.0,
    totalProjects: 14,
    completedProjects: 9,
    openFlagsCount: 2,
    collusionRiskCount: 0
  }
];

const sampleNotifications = [
  {
    id: "NOTIF-001",
    title: "High-Priority Flag Raised",
    message: "Detection engine identified financial outlier on MPLADS-2024-001.",
    timestamp: "10 mins ago",
    read: false,
    type: "warning"
  }
];

/* ----------------------------------------------------------------------
 * Authorization endpoints.
 * -------------------------------------------------------------------- */

// Authoritative identity for the signed-in session.
app.get("/api/me", requireAuth as never, (req, res) => {
  const { principal } = req as AuthedRequest;
  res.json({
    userId: principal?.userId,
    email: principal?.email ?? null,
    role: principal?.role ?? null,
    permissions: principal?.permissions ?? [],
    bootstrap: principal?.bootstrap ?? false,
  });
});

// Generic pre-flight gate used by the client before any privileged action.
app.post("/api/authz/check", requireAuth as never, (req, res) => {
  const { principal } = req as AuthedRequest;
  const permission = (req.body ?? {}).permission;

  if (!isValidPermission(permission)) {
    return res.status(400).json({ error: "bad_request", message: "A known permission is required." });
  }
  if (!principal?.role) {
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
});

/* ----------------------------------------------------------------------
 * Core Feature Resource Endpoints
 * -------------------------------------------------------------------- */

app.get("/api/dashboard", (_req, res) => {
  res.json({
    projects: sampleProjects,
    flags: [],
    users: [],
    activity: [],
    financialTrend: []
  });
});

app.get("/api/projects", (_req, res) => {
  res.json(sampleProjects);
});

app.get("/api/projects/:id", (req, res) => {
  const item = sampleProjects.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: "not_found", message: "Project not found" });
  res.json(item);
});

app.post("/api/projects", (req, res) => {
  const payload = req.body || {};
  const newProject = {
    id: `MPLADS-${Date.now()}`,
    name: payload.projectName || "New Community Project",
    category: payload.category || "Infrastructure",
    state: payload.state || "Maharashtra",
    district: payload.district || "Pune",
    constituency: payload.constituency || "Pune Central",
    agency: payload.agencyName || "PWD",
    fy: "2024-25",
    status: "Submitted",
    amount: payload.estimatedCost || 1000000,
    utilized: 0,
    progress: 0,
    submitted: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  res.status(201).json(newProject);
});

app.get("/api/reports", (_req, res) => {
  res.json(sampleReports);
});

app.get("/api/notifications", (_req, res) => {
  res.json(sampleNotifications);
});

// Role-sensitive resources.
app.get("/api/users", requireAuth as never, requirePermission(PERMISSIONS.MANAGE_USERS) as never, async (_req, res) => {
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
});

app.patch(
  "/api/users/:id/role",
  requireAuth as never,
  requirePermission(PERMISSIONS.MANAGE_USERS) as never,
  async (req, res) => {
    const { principal } = req as AuthedRequest;
    const requestedRole = (req.body ?? {}).role;
    const role = normalizeRole(requestedRole);

    if (!role) {
      return res.status(400).json({ error: "bad_request", message: "A valid role is required." });
    }
    if (!clerkAdminConfigured()) {
      return res.status(503).json({
        error: "clerk_admin_unconfigured",
        message: "CLERK_SECRET_KEY is not configured; the role change was not persisted to the identity provider.",
      });
    }
    try {
      await setUserRoleInClerk(req.params.id, role);
    } catch (error) {
      return res.status(502).json({
        error: "clerk_update_failed",
        message: error instanceof Error ? error.message : "Could not update the user's role.",
      });
    }
    return res.json({ authorized: true, actorRole: principal?.role, userId: req.params.id, role });
  }
);

app.patch(
  "/api/users/:id/status",
  requireAuth as never,
  requirePermission(PERMISSIONS.MANAGE_USERS) as never,
  async (req, res) => {
    const { principal } = req as AuthedRequest;
    const requestedStatus = (req.body ?? {}).status;
    if (requestedStatus !== "Active" && requestedStatus !== "Inactive") {
      return res.status(400).json({ error: "bad_request", message: "status must be 'Active' or 'Inactive'." });
    }
    if (!clerkAdminConfigured()) {
      return res.status(503).json({
        error: "clerk_admin_unconfigured",
        message: "CLERK_SECRET_KEY is not configured; the status change was not persisted to the identity provider.",
      });
    }
    try {
      await setUserActiveInClerk(req.params.id, requestedStatus === "Active");
    } catch (error) {
      return res.status(502).json({
        error: "clerk_update_failed",
        message: error instanceof Error ? error.message : "Could not update the user's status.",
      });
    }
    return res.json({ authorized: true, actorRole: principal?.role, userId: req.params.id, status: requestedStatus });
  }
);

app.get("/api/audit", requireAuth as never, requirePermission(PERMISSIONS.VIEW_AUDIT) as never, (_req, res) => {
  res.json({ authorized: true, entries: [] });
});

app.get("/api/flags/collusion", requireAuth as never, requirePermission(PERMISSIONS.REVIEW_FLAGS) as never, (_req, res) => {
  res.json({ authorized: true, networks: [] });
});

/* ----------------------------------------------------------------------
 * Detection Engine Adapter & Proxy Endpoint
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
      message: `Could not connect to Python Detection Engine at ${pythonEngineUrl}. Ensure detection engine is running.`,
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/flags", requireAuth as never, requirePermission(PERMISSIONS.VIEW_FLAGS) as never, async (_req, res) => {
  const pythonEngineUrl = process.env.DETECTION_ENGINE_URL || "http://localhost:8000";
  try {
    const response = await fetch(`${pythonEngineUrl}/detect/demo`);
    if (response.ok) {
      const data = (await response.json()) as { flags?: PythonFlagItem[] };
      const transformedFlags = adaptPythonFlagsToMockFlags(data.flags || []);
      return res.json(transformedFlags);
    }
  } catch {
    // Fallback if python engine is not reachable
  }
  return res.json([]);
});

app.post("/api/reports/export", requireAuth as never, requirePermission(PERMISSIONS.EXPORT_REPORTS) as never, (_req, res) => {
  res.json({ authorized: true });
});

// Workflow transitions
app.post("/api/projects/:id/transition", requireAuth as never, (req, res) => {
  const { principal } = req as AuthedRequest;
  const target = (req.body ?? {}).to;
  const required = typeof target === "string" ? TRANSITION_PERMISSIONS[target] : undefined;

  if (!required) {
    return res.status(400).json({ error: "bad_request", message: "Unknown target status." });
  }
  if (!principal?.role || !can(principal.role, required)) {
    return res.status(403).json({
      error: "forbidden",
      message: `Role '${principal?.role ?? "unassigned"}' cannot move a project to '${target}'.`,
      required,
    });
  }
  return res.json({ authorized: true, projectId: req.params.id, to: target, actorRole: principal.role });
});

// Gemini Translation Endpoint
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

// Fallback response: All /api/* unhandled endpoints return JSON 404, non-API return index.html
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ error: "not_found", message: "API route not found." });
  }
  const indexHtml = path.join(staticPath, "index.html");
  res.sendFile(indexHtml, (err) => {
    if (err && !res.headersSent) {
      res
        .status(process.env.NODE_ENV === "production" ? 500 : 404)
        .type("text/plain")
        .send(
          process.env.NODE_ENV === "production"
            ? "Build not found. Run `npm run build` before starting this server in production."
            : "This is the API server (dev mode) — it only serves /api/*. Open the app itself at http://localhost:3000/."
        );
    }
  });
});
