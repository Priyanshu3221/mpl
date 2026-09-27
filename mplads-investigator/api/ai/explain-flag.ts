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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Enforce Clerk authentication & RBAC check on Vercel backend handler
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
      message: `User '${verifiedEmail}' with role 'Citizen' is not authorized to access AI Explain functionality.`,
    });
  }

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
}
