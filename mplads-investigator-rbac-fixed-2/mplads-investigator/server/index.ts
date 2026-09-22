import "./env"; // MUST be the first import — populates process.env before ./authz and ./clerkUsers read it.
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth, requirePermission, type AuthedRequest } from "./authz";
import { isValidPermission, normalizeRole, PERMISSIONS, TRANSITION_PERMISSIONS, can } from "../shared/roles";
import { clerkAdminConfigured, listClerkUsers, setUserActiveInClerk, setUserRoleInClerk } from "./clerkUsers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  /* ----------------------------------------------------------------------
   * Authorization endpoints.
   *
   * The role always comes from the verified session token. A request body
   * claiming a role is ignored, so the UI cannot be used to escalate.
   * -------------------------------------------------------------------- */

  // Authoritative identity for the signed-in session. The client renders from
  // this rather than from anything it can set itself.
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

  // Role-sensitive resources. Each is guarded by the same permission the route
  // guard uses on the client, so a hand-crafted API call gains nothing.
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
        // requirePermission has already confirmed the CALLER is an Admin via
        // their own verified session token. This writes the role that the
        // TARGET user's next session token will carry.
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
        message: "Could not connect to Python Detection Engine at http://localhost:8000. Ensure 'uvicorn api:app --reload' is running.",
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

  // Workflow transitions: the permission required depends on the target status.
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

  // Server-side Gemini Translation Endpoint for Indian Languages
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

  // Handle client-side routing - serve index.html for all routes.
  // In dev, this Express process is API-only (Vite serves the actual app on
  // :3000 and proxies /api here) — there is no dist/public build to serve,
  // so hitting this server directly with a page request (e.g. a browser
  // pointed at :8080 by habit) used to crash with an ugly ENOENT trying to
  // sendFile a build that was never produced. Respond helpfully instead.
  app.get("*", (_req, res) => {
    const indexHtml = path.join(staticPath, "index.html");
    res.sendFile(indexHtml, (err) => {
      if (err) {
        res
          .status(process.env.NODE_ENV === "production" ? 500 : 404)
          .type("text/plain")
          .send(
            process.env.NODE_ENV === "production"
              ? "Build not found. Run `npm run build` before starting this server in production."
              : "This is the API server (dev mode) — it only serves /api/*. " +
                  "Open the app itself at http://localhost:3000/."
          );
      }
    });
  });

  // 8080, not 3000: the Vite dev server (client/index.html + HMR) already
  // owns :3000 (see vite.config.ts), and Vite's dev-server proxy sends /api
  // requests here. Production self-hosting can still override with PORT.
  const port = process.env.PORT || 8080;

  server.listen(port, () => {
    console.log(`API server running on http://localhost:${port}/ (Vite dev server proxies /api here)`);
  });
}

startServer().catch(console.error);
