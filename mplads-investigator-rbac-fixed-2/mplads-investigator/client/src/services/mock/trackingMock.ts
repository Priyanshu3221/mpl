import type { MockProject } from "@/services/mock/dashboardMock";

export interface ProjectTracking {
  id: string;
  projectId: string;
  physicalProgress: number;
  financialProgress: number;
  overallProgress: number;
  sanctionedAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
  lastUpdated: string;
  responsibleAgency: string;
  remarks: string[];
  milestones: Array<{
    name: string;
    targetDate: string;
    completedDate?: string;
    status: "Completed" | "In progress" | "Pending";
    progress: number;
  }>;
  events: Array<{
    id: string;
    date: string;
    title: string;
    detail: string;
    tone?: "green" | "amber" | "blue";
  }>;
  documents: Array<{
    name: string;
    type: string;
    date: string;
    status: "Available" | "Pending";
  }>;
}

export function trackingFor(project: MockProject): ProjectTracking {
  const financialPct = Math.min(
    100,
    Math.round((project.utilized / Math.max(project.amount, 1)) * 100)
  );
  const overall = Math.round((project.progress + financialPct) / 2);

  return {
    id: `TRK-${project.id}`,
    projectId: project.id,
    physicalProgress: project.progress,
    financialProgress: financialPct,
    overallProgress: overall,
    sanctionedAmount: project.amount,
    utilizedAmount: project.utilized,
    remainingAmount: Math.max(project.amount - project.utilized, 0),
    lastUpdated: project.updated,
    responsibleAgency: project.agency,
    remarks: [
      `Site inspection conducted. Physical progress is at ${project.progress}%.`,
      `Financial utilization recorded at ₹${new Intl.NumberFormat("en-IN").format(project.utilized)}.`
    ],
    milestones: [
      {
        name: "Site Survey & Architectural Plan Approval",
        targetDate: "2024-02-15",
        completedDate: "2024-02-10",
        status: "Completed",
        progress: 100
      },
      {
        name: "Foundation & Ground Structure Work",
        targetDate: "2024-04-30",
        completedDate: project.progress >= 50 ? "2024-04-25" : undefined,
        status: project.progress >= 50 ? "Completed" : "In progress",
        progress: Math.min(100, project.progress * 1.5)
      },
      {
        name: "Superstructure & Roofing Installation",
        targetDate: "2024-07-31",
        status: project.progress >= 80 ? "Completed" : project.progress >= 40 ? "In progress" : "Pending",
        progress: Math.max(0, Math.min(100, (project.progress - 40) * 2.5))
      },
      {
        name: "Finishing, Electrification & Handover",
        targetDate: "2024-10-15",
        status: project.progress >= 100 ? "Completed" : "Pending",
        progress: project.progress >= 100 ? 100 : 0
      }
    ],
    events: [
      {
        id: `EVT-${project.id}-01`,
        date: project.submitted,
        title: "Proposal Submitted",
        detail: "Initial project proposal submitted for administrative sanction",
        tone: "blue"
      },
      {
        id: `EVT-${project.id}-02`,
        date: project.updated,
        title: "Monitoring Record Updated",
        detail: `Physical progress reported at ${project.progress}% by ${project.agency}`,
        tone: project.progress >= 80 ? "green" : "amber"
      }
    ],
    documents: [
      {
        name: `${project.id}_Sanction_Order.pdf`,
        type: "Sanction letter",
        date: project.submitted,
        status: "Available"
      },
      {
        name: `${project.id}_Progress_Report_Q1.pdf`,
        type: "Monitoring report",
        date: project.updated,
        status: "Available"
      }
    ]
  };
}
