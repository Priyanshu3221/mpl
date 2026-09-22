export interface ProjectMilestone {
  label: string;
  target: string;
  state: string;
  progress: number;
}

export interface TimelineEntry {
  id: string;
  title: string;
  detail: string;
  date: string;
  tone: "green" | "amber" | "blue";
}

export const milestones: ProjectMilestone[] = [
  {
    label: "Feasibility Study & Technical Sanction",
    target: "2024-01-31",
    state: "Completed",
    progress: 100
  },
  {
    label: "Tender Allocation & Contract Award",
    target: "2024-03-15",
    state: "Completed",
    progress: 100
  },
  {
    label: "Civil & Structural Construction",
    target: "2024-06-30",
    state: "In Progress",
    progress: 70
  },
  {
    label: "Equipment Supply & Interior Works",
    target: "2024-08-31",
    state: "Pending",
    progress: 15
  },
  {
    label: "Final Quality Audit & Handover",
    target: "2024-10-15",
    state: "Pending",
    progress: 0
  }
];

export const timeline: TimelineEntry[] = [
  {
    id: "TL-001",
    title: "Sanction Letter Issued",
    detail: "District Collector issued formal sanction of ₹50,00,000 for the project.",
    date: "2024-01-18",
    tone: "green"
  },
  {
    id: "TL-002",
    title: "Tender Awarded to Public Works Division",
    detail: "Implementing agency designated as PWD Division 2 Pune.",
    date: "2024-03-02",
    tone: "blue"
  },
  {
    id: "TL-003",
    title: "Cost Variance Flag Triggered",
    detail: "System flagged 28% variance in foundation concrete estimate against standard schedule of rates.",
    date: "2024-05-11",
    tone: "amber"
  },
  {
    id: "TL-004",
    title: "Progress Milestone Verified",
    detail: "Third-party technical inspector confirmed 65% physical completion.",
    date: "2024-05-10",
    tone: "green"
  }
];
