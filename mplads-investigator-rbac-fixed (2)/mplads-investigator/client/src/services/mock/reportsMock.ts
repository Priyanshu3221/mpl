export interface ReportRow {
  id: string;
  district: string;
  state: string;
  fy: string;
  allocatedAmount: number;
  utilizedAmount: number;
  utilizationPercentage: number;
  totalProjects: number;
  completedProjects: number;
  openFlagsCount: number;
  collusionRiskCount: number;
  agencyName: string;
}

export const mockReportRows: ReportRow[] = [
  {
    id: "REP-01",
    district: "Jaipur",
    state: "Rajasthan",
    fy: "2024-25",
    allocatedAmount: 45000000,
    utilizedAmount: 38200000,
    utilizationPercentage: 85,
    totalProjects: 14,
    completedProjects: 9,
    openFlagsCount: 3,
    collusionRiskCount: 1,
    agencyName: "PWD Jaipur Division",
  },
  {
    id: "REP-02",
    district: "Udaipur",
    state: "Rajasthan",
    fy: "2024-25",
    allocatedAmount: 32000000,
    utilizedAmount: 28800000,
    utilizationPercentage: 90,
    totalProjects: 10,
    completedProjects: 8,
    openFlagsCount: 1,
    collusionRiskCount: 0,
    agencyName: "Rural Development Samiti",
  },
  {
    id: "REP-03",
    district: "Lucknow",
    state: "Uttar Pradesh",
    fy: "2024-25",
    allocatedAmount: 50000000,
    utilizedAmount: 31000000,
    utilizationPercentage: 62,
    totalProjects: 18,
    completedProjects: 7,
    openFlagsCount: 5,
    collusionRiskCount: 2,
    agencyName: "Uttar Pradesh Jal Nigam",
  },
  {
    id: "REP-04",
    district: "Varanasi",
    state: "Uttar Pradesh",
    fy: "2023-24",
    allocatedAmount: 40000000,
    utilizedAmount: 39000000,
    utilizationPercentage: 97,
    totalProjects: 12,
    completedProjects: 12,
    openFlagsCount: 0,
    collusionRiskCount: 0,
    agencyName: "Varanasi Urban Infrastructure",
  },
  {
    id: "REP-05",
    district: "Patna",
    state: "Bihar",
    fy: "2023-24",
    allocatedAmount: 35000000,
    utilizedAmount: 24500000,
    utilizationPercentage: 70,
    totalProjects: 11,
    completedProjects: 6,
    openFlagsCount: 2,
    collusionRiskCount: 1,
    agencyName: "Bihar State Construction Corp",
  },
];
