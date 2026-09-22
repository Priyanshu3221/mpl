export type NotificationType = "risk_flag" | "collusion" | "approval_pending" | "sanction_issued" | "system";

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: "High" | "Medium" | "Low" | "Info";
  linkHref?: string;
  linkLabel?: string;
}

export const mockNotifications: SystemNotification[] = [
  {
    id: "NOTIF-2024-001",
    type: "collusion",
    title: "High Risk Bidding Ring Detected",
    message: "Apex Infrastructure and Zenith Construction submitted synchronized bids for 4 community hall projects in Jaipur.",
    timestamp: "2024-11-04T09:30:00Z",
    read: false,
    severity: "High",
    linkHref: "/flags/collusion",
    linkLabel: "Review Collusion Pair",
  },
  {
    id: "NOTIF-2024-002",
    type: "risk_flag",
    title: "Disbursement Velocity Exceeded",
    message: "Project MPLADS-2024-003 triggered Rule #FLG-402: 80% disbursement occurred within 48 hours of work order creation.",
    timestamp: "2024-11-03T16:15:00Z",
    read: false,
    severity: "High",
    linkHref: "/flags?severity=High",
    linkLabel: "Review Risk Flag",
  },
  {
    id: "NOTIF-2024-003",
    type: "approval_pending",
    title: "Project Submitted for District Review",
    message: "MP Proposal MPLADS-2024-004 (Ambulance Procurement) submitted by MP office for District Authority approval.",
    timestamp: "2024-11-02T14:10:00Z",
    read: true,
    severity: "Medium",
    linkHref: "/projects/MPLADS-2024-004",
    linkLabel: "Open Project Workspace",
  },
  {
    id: "NOTIF-2024-004",
    type: "sanction_issued",
    title: "Administrative Sanction Recorded",
    message: "Sanction order #SANC-8831 recorded for Primary School Solarization Project (₹25,00,000).",
    timestamp: "2024-10-30T11:00:00Z",
    read: true,
    severity: "Info",
    linkHref: "/projects/MPLADS-2024-002",
    linkLabel: "View Sanction Details",
  },
];
