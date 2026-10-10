function mapRuleCategory(ruleId) {
  if (ruleId.startsWith("SC_") || ruleId.startsWith("ST_")) return "SC/ST Compliance";
  if (ruleId.startsWith("TIME-")) return "Timeline Delay";
  if (ruleId.startsWith("INC-")) return "Prohibited Category";
  if (ruleId.startsWith("FIN-")) return "Financial Anomaly";
  return "Compliance Anomaly";
}

function mapRuleName(ruleId) {
  const titles = {
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

function mapSeverity(severity) {
  const lower = (severity || "").toLowerCase();
  if (lower === "high") return "High";
  if (lower === "medium") return "Medium";
  if (lower === "low") return "Low";
  return "Medium";
}

function adaptPythonFlagsToMockFlags(pyFlags) {
  return pyFlags.map((flag, index) => {
    const ruleId = flag.rule_id || "ANOMALY";
    return {
      id: `FLG-DET-${index + 100}`,
      projectId: flag.project_id || `P-${1000 + index}`,
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

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const pythonEngineUrl = process.env.DETECTION_ENGINE_URL || "https://mpl-xis5.onrender.com";

  try {
    const response = await fetch(`${pythonEngineUrl}/detect/demo`);
    if (response.ok) {
      const data = await response.json();
      const flags = adaptPythonFlagsToMockFlags(data.flags || []);
      return res.status(200).json(flags);
    }
  } catch {
    // Fallback if engine unreachable
  }
  return res.status(200).json([]);
};
