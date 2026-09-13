export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: "project" | "flag" | "collusion_pair" | "user" | "system";
  entity_id: string;
  before?: string;
  after?: string;
  remark?: string;
  ip_placeholder?: string;
}

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "AUDIT-1001",
    timestamp: "2024-11-04T10:15:30Z",
    actor_email: "district.authority@mplads.gov.in",
    actor_role: "District Authority",
    action: "project_status_approved",
    entity_type: "project",
    entity_id: "MPLADS-2024-001",
    before: "Under Review",
    after: "Approved",
    remark: "Verified technical feasibility, cost estimates, and NOC clearance from PWD.",
    ip_placeholder: "10.14.22.80",
  },
  {
    id: "AUDIT-1002",
    timestamp: "2024-11-03T14:22:10Z",
    actor_email: "investigator.officer@mplads.gov.in",
    actor_role: "District Authority",
    action: "flag_review_escalated",
    entity_type: "flag",
    entity_id: "FLAG-2024-003",
    before: "Open",
    after: "Escalated",
    remark: "Contractor bid time match requires technical forensics team verification.",
    ip_placeholder: "10.14.22.91",
  },
  {
    id: "AUDIT-1003",
    timestamp: "2024-11-02T16:45:00Z",
    actor_email: "mp.office.jaipur@mplads.gov.in",
    actor_role: "MP",
    action: "project_submitted",
    entity_type: "project",
    entity_id: "MPLADS-2024-004",
    before: "Draft",
    after: "Submitted",
    remark: "Proposal submitted for multi-specialty ambulance procurement.",
    ip_placeholder: "192.168.1.104",
  },
  {
    id: "AUDIT-1004",
    timestamp: "2024-10-29T11:05:40Z",
    actor_email: "admin@mplads.gov.in",
    actor_role: "Admin",
    action: "user_role_updated",
    entity_type: "user",
    entity_id: "USR-002",
    before: "Implementing Agency",
    after: "District Authority",
    remark: "Promoted user role following official ministry designation transfer order.",
    ip_placeholder: "127.0.0.1",
  },
  {
    id: "AUDIT-1005",
    timestamp: "2024-10-25T09:30:15Z",
    actor_email: "district.authority@mplads.gov.in",
    actor_role: "District Authority",
    action: "collusion_flag_under_investigation",
    entity_type: "collusion_pair",
    entity_id: "COL-2024-002",
    before: "Unreviewed",
    after: "Under Investigation",
    remark: "Requested bank account statement matching from treasury officer.",
    ip_placeholder: "10.14.22.80",
  },
];
