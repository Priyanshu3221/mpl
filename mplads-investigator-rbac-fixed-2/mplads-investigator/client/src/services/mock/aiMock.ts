export interface AiRiskAnalysis {
  flagId: string;
  ruleCategory: string;
  severity: string;
  summary: string;
  keyIndicators: string[];
  recommendedAction: string;
  confidenceScore: number;
  modelIdentifier: string;
}

export interface AiProjectSummary {
  projectId: string;
  projectName: string;
  riskAssessment: "High Risk" | "Medium Risk" | "Low Risk" | "Normal";
  summary: string;
  deliveryHealth: string;
  financialIntegrity: string;
  keyActionItems: string[];
  modelIdentifier: string;
}

export const mockAiRiskAnalyses: Record<string, AiRiskAnalysis> = {
  "FLAG-2024-001": {
    flagId: "FLAG-2024-001",
    ruleCategory: "Disbursement Velocity",
    severity: "High",
    summary:
      "Automated heuristics flagged rapid disbursement where 85% of total project funds were released within 48 hours of work order creation, prior to physical progress verification.",
    keyIndicators: [
      "85% fund tranche released on day 1 (Standard guideline target: 20-30% initial advance)",
      "Zero geo-tagged ground photos uploaded before second installment payout",
      "Vendor GSTIN registration date is under 30 days prior to tender award",
    ],
    recommendedAction:
      "Issue immediate stop-payment order to district treasury pending physical site inspection and geo-tagged milestone upload.",
    confidenceScore: 94,
    modelIdentifier: "MPLADS-AI-Heuristic-v1.4 (Simulated Model)",
  },
  "FLAG-2024-002": {
    flagId: "FLAG-2024-002",
    ruleCategory: "Cost Variance",
    severity: "Medium",
    summary:
      "Unit cost for solar high-mast lights is 38% higher than standard Public Works Department (PWD) schedule of rates for Rajasthan district.",
    keyIndicators: [
      "Bidding rate: ₹2,45,000 per unit (PWD Schedule Rate: ₹1,78,000 per unit)",
      "No technical exception justification recorded in sanction approval file",
    ],
    recommendedAction:
      "Request revised cost justification from executive engineer prior to releasing third installment.",
    confidenceScore: 88,
    modelIdentifier: "MPLADS-AI-Heuristic-v1.4 (Simulated Model)",
  },
};

export const mockAiProjectSummaries: Record<string, AiProjectSummary> = {
  "MPLADS-2024-001": {
    projectId: "MPLADS-2024-001",
    projectName: "Community Hall Construction, Malviya Nagar",
    riskAssessment: "High Risk",
    summary:
      "This project exhibits dual risk indicators: an open high-severity disbursement flag combined with a detected bidding ring between Apex Infrastructure and Zenith Construction.",
    deliveryHealth: "Physical progress is reported at 45%, but physical verification logs are missing for Foundation work.",
    financialIntegrity: "₹1,02,00,000 utilized against ₹1,20,00,000 estimate. Two cover bids detected from common director entities.",
    keyActionItems: [
      "Review linked Collusion Pair COL-2024-001 before authorizing milestone payment #3",
      "Verify MCA director filings for contractor Apex Infrastructure",
      "Require District Authority physical inspection report upload",
    ],
    modelIdentifier: "MPLADS-AI-Investigator-v2.0 (Simulated Model)",
  },
  "MPLADS-2024-002": {
    projectId: "MPLADS-2024-002",
    projectName: "Solar High-Mast Lighting System, Sangeet Colony",
    riskAssessment: "Medium Risk",
    summary:
      "Project implementation is progressing on schedule (70%), but pricing per unit exceeds standard PWD schedule rates by 38%. Vendor accounts share bank details with BrightPower Energy.",
    deliveryHealth: "Physical delivery targets met across 14 of 20 installations.",
    financialIntegrity: "₹38,00,000 utilized against ₹45,00,000 estimate. Financial velocity is within normal timeframe.",
    keyActionItems: [
      "Cross-check split procurement orders with BrightPower Energy Solutions",
      "Validate solar unit technical specifications against PWD schedule rates",
    ],
    modelIdentifier: "MPLADS-AI-Investigator-v2.0 (Simulated Model)",
  },
};
