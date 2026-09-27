import { api } from "./apiClient";
import {
  mockAiRiskAnalyses,
  mockAiProjectSummaries,
  type AiRiskAnalysis,
  type AiProjectSummary,
} from "@/services/mock/aiMock";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export async function explainRiskFlag(
  flagId: string,
  flagData?: Record<string, any>
): Promise<AiRiskAnalysis> {
  if (import.meta.env.VITE_EXPLICIT_MOCK === "true") {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const result = mockAiRiskAnalyses[flagId];
    if (result) return result;
    return {
      flagId,
      ruleCategory: flagData?.category || "Automated Heuristic Check",
      severity: flagData?.severity || "Medium",
      summary: `[Mock Mode] AI risk evaluation for ${flagId}: Identified deviation from baseline disbursement schedules.`,
      keyIndicators: [
        `Deviation detected in milestone delivery timestamp for ${flagId}`,
        "Variance against standard district schedule of rates",
        "Requires formal District Authority reviewer sign-off",
      ],
      recommendedAction: "Perform manual file review and request verified completion certificate from implementing agency.",
      confidenceScore: 86,
      modelIdentifier: "MPLADS-AI-Heuristic-v1.4 (Simulated Model)",
    };
  }

  try {
    const res = await api.post<AiRiskAnalysis>("/ai/explain-flag", {
      flagId,
      ...flagData,
    });
    if (res.data) return res.data;
    throw new Error("Empty response received from AI Explain backend.");
  } catch (err: any) {
    const message =
      err.response?.data?.message || err.message || "Failed to generate AI explanation.";
    throw new Error(message);
  }
}

export async function summarizeProjectAI(projectId: string, projectName: string): Promise<AiProjectSummary> {
  if (!useMock) {
    const res = await api.get<AiProjectSummary>(`/ai/summarize-project/${projectId}`);
    return res.data;
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
  const result = mockAiProjectSummaries[projectId];
  if (result) return result;

  // Fallback dynamic summary for any project
  return {
    projectId,
    projectName,
    riskAssessment: "Low Risk",
    summary: `AI Investigation Summary for ${projectId} (${projectName}): Financial utilization aligns with reported physical delivery. No critical collusion signals detected in current procurement graph.`,
    deliveryHealth: "Physical progress timeline is consistent with standard implementation milestones.",
    financialIntegrity: "Fund releases follow approved district sanction stages.",
    keyActionItems: [
      "Monitor next quarterly physical progress report",
      "Ensure final utilization certificate is uploaded upon project completion",
    ],
    modelIdentifier: "MPLADS-AI-Investigator-v2.0 (Simulated Model)",
  };
}
