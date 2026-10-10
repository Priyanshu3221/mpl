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

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(sampleReports);
}
