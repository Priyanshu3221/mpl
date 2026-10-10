export type ProjectStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Returned"
  | "Sanctioned"
  | "In Progress"
  | "Completed"
  | "Closed"
  | "Under implementation"
  | "Pending review";

export interface MockProject {
  id: string;
  name: string;
  category: string;
  state: string;
  district: string;
  constituency: string;
  agency: string;
  fy: string;
  status: ProjectStatus;
  amount: number;
  utilized: number;
  progress: number;
  submitted: string;
  updated: string;
}

export interface MockFlag {
  id: string;
  projectId: string;
  category: string;
  ruleName: string;
  severity: "High" | "Medium" | "Low";
  state: string;
  fy: string;
  status: string;
  observed: string;
  threshold: string;
  exceptionApplied?: boolean;
  explanation?: string;
  sourceVersion?: string;
  timestamp?: string;
}

export const users = [
  { id: "USR-001", name: "Ramesh Kumar", role: "District Authority", email: "ramesh.k@mplads.gov.in" },
  { id: "USR-002", name: "Priya Sharma", role: "MP", email: "priya.s@sansad.in" },
  { id: "USR-003", name: "Amitav Roy", role: "Implementing Agency", email: "amitav.roy@pwd.gov.in" },
  { id: "USR-004", name: "Sunita Verma", role: "Admin", email: "admin@mplads.gov.in" }
];

export const activity = [
  { id: "ACT-001", title: "Project Sanctioned", detail: "MPLADS-2024-001 sanctioned by District Collector", time: "10 mins ago", tone: "green" },
  { id: "ACT-002", title: "High Risk Flag Triggered", detail: "Cost over-allocation signal detected on MPLADS-2024-003", time: "1 hour ago", tone: "amber" },
  { id: "ACT-003", title: "Progress Update Submitted", detail: "PWD submitted 65% physical completion for MPLADS-2024-002", time: "3 hours ago", tone: "blue" },
  { id: "ACT-004", title: "Proposal Submitted", detail: "New Community Center proposal submitted for review", time: "5 hours ago", tone: "blue" }
];

export const financialTrend = [
  { fy: "2020-21", allocated: 45.0, utilized: 38.5 },
  { fy: "2021-22", allocated: 60.0, utilized: 52.0 },
  { fy: "2022-23", allocated: 75.0, utilized: 68.2 },
  { fy: "2023-24", allocated: 90.0, utilized: 79.4 },
  { fy: "2024-25", allocated: 110.0, utilized: 88.0 }
];

export const projects: MockProject[] = [
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
  },
  {
    id: "MPLADS-2024-004",
    name: "Drinking Water Borewell & Filtration System Setup",
    category: "Water & sanitation",
    state: "Karnataka",
    district: "Mysuru",
    constituency: "Mysuru Rural",
    agency: "Rural Water Supply & Sanitation Department",
    fy: "2024-25",
    status: "Pending review",
    amount: 1800000,
    utilized: 0,
    progress: 0,
    submitted: "2024-04-10",
    updated: "2024-04-10"
  },
  {
    id: "MPLADS-2024-005",
    name: "Supply of Mobile Medical Vans & Diagnostic Equipment",
    category: "Health",
    state: "Rajasthan",
    district: "Jaipur",
    constituency: "Jaipur City",
    agency: "Chief Medical & Health Officer (CMHO)",
    fy: "2023-24",
    status: "Approved",
    amount: 6000000,
    utilized: 4800000,
    progress: 80,
    submitted: "2023-11-05",
    updated: "2024-02-18"
  },
  {
    id: "MPLADS-2024-006",
    name: "Construction of Approach Road to Tribal Settlement",
    category: "Infrastructure",
    state: "Assam",
    district: "Kamrup",
    constituency: "Gauhati",
    agency: "Public Works Roads Department",
    fy: "2022-23",
    status: "Rejected",
    amount: 4200000,
    utilized: 0,
    progress: 0,
    submitted: "2022-10-14",
    updated: "2022-11-30"
  }
];

export const flags: MockFlag[] = [
  {
    id: "FLG-2024-101",
    projectId: "MPLADS-2024-001",
    category: "Financial Anomaly",
    ruleName: "High Cost Variance Against Standard Schedule of Rates",
    severity: "High",
    state: "Maharashtra",
    fy: "2024-25",
    status: "Open",
    observed: "₹50.0L estimated (+28% vs standard rate)",
    threshold: "Max +15% variance permitted",
    exceptionApplied: false,
    explanation: "Estimated unit costs for concrete foundations exceed standard PWD schedule of rates by 28%. Needs engineering verification.",
    sourceVersion: "v2.4",
    timestamp: "2024-05-11 10:30:00"
  },
  {
    id: "FLG-2024-102",
    projectId: "MPLADS-2024-002",
    category: "Agency Concentration",
    ruleName: "Single Agency Allocation Limit Exceeded",
    severity: "Medium",
    state: "Maharashtra",
    fy: "2024-25",
    status: "Open",
    observed: "4 active projects allocated to Zilla Parishad",
    threshold: "Max 3 concurrent projects per division",
    exceptionApplied: true,
    explanation: "The implementing agency has 4 ongoing projects across 2 sub-divisions. Monitor execution timelines closely.",
    sourceVersion: "v2.4",
    timestamp: "2024-05-05 14:15:00"
  },
  {
    id: "FLG-2024-103",
    projectId: "MPLADS-2024-005",
    category: "Procurement Delay",
    ruleName: "Sanction to Procurement Delay Signal",
    severity: "Low",
    state: "Rajasthan",
    fy: "2023-24",
    status: "Open",
    observed: "90 days post-sanction without PO issuance",
    threshold: "60 days benchmark",
    exceptionApplied: false,
    explanation: "Equipment procurement tender underwent revision. Purchase order issued on Day 92.",
    sourceVersion: "v2.1",
    timestamp: "2024-02-20 09:00:00"
  }
];

export function formatCompact(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

export function formatINR(val: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(val)}`;
}
