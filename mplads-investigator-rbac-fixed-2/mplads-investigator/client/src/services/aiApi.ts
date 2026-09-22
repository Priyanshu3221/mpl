import axios from "axios";
import {
  mockAiRiskAnalyses,
  mockAiProjectSummaries,
  type AiRiskAnalysis,
  type AiProjectSummary,
} from "@/services/mock/aiMock";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 8000,
});

export async function explainRiskFlag(flagId: string): Promise<AiRiskAnalysis> {
  if (!useMock) {
    const res = await api.get<AiRiskAnalysis>(`/ai/explain-flag/${flagId}`);
    return res.data;
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
  const result = mockAiRiskAnalyses[flagId];
  if (result) return result;

  // Fallback dynamic analysis for any flag ID
  return {
    flagId,
    ruleCategory: "Automated Heuristic Check",
    severity: "Medium",
    summary: `AI risk evaluation for ${flagId}: Identified deviation from baseline disbursement schedules and threshold parameters based on eSAKSHI historical benchmarks.`,
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
