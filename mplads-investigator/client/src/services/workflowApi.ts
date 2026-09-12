import axios from "axios";
import type { MockProject, ProjectStatus } from "@/services/mock/dashboardMock";

export type WorkflowAction = { to: ProjectStatus; label: string; permission: "SUBMIT_PROJECT" | "REVIEW_PROJECT" | "APPROVE_PROJECT" | "REJECT_PROJECT"; requiresRemark: boolean };
export type WorkflowTransition = { projectId: string; from: ProjectStatus; to: ProjectStatus; remark: string; actorRole: string; timestamp: string };
const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api", timeout: 8000 });
const stateKey = "mplads.workflow.v1";
const auditKey = "mplads.audit.v1";
const transitions: Partial<Record<ProjectStatus, WorkflowAction[]>> = {
  Draft: [{ to: "Submitted", label: "Submit for review", permission: "SUBMIT_PROJECT", requiresRemark: false }],
  Submitted: [{ to: "Under Review", label: "Start review", permission: "REVIEW_PROJECT", requiresRemark: false }],
  "Under Review": [{ to: "Approved", label: "Approve project", permission: "APPROVE_PROJECT", requiresRemark: true }, { to: "Rejected", label: "Reject project", permission: "REJECT_PROJECT", requiresRemark: true }, { to: "Returned", label: "Return for correction", permission: "REVIEW_PROJECT", requiresRemark: true }],
  Returned: [{ to: "Submitted", label: "Resubmit for review", permission: "SUBMIT_PROJECT", requiresRemark: false }],
  Approved: [{ to: "Sanctioned", label: "Record sanction", permission: "APPROVE_PROJECT", requiresRemark: true }],
  Sanctioned: [{ to: "In Progress", label: "Start implementation", permission: "REVIEW_PROJECT", requiresRemark: false }],
  "In Progress": [{ to: "Completed", label: "Mark completed", permission: "REVIEW_PROJECT", requiresRemark: true }],
  Completed: [{ to: "Closed", label: "Close project", permission: "REVIEW_PROJECT", requiresRemark: true }],
};
function readState() { try { return JSON.parse(window.localStorage.getItem(stateKey) || "{}") as Record<string, { status: ProjectStatus; updated: string }>; } catch { return {}; } }
function writeAudit(entry: WorkflowTransition) { const existing = JSON.parse(window.localStorage.getItem(auditKey) || "[]") as unknown[]; window.localStorage.setItem(auditKey, JSON.stringify([...existing, { id: `AUDIT-${Date.now()}`, timestamp: entry.timestamp, actor_email: "current-user@mplads.gov.in", actor_role: entry.actorRole, action: `project_status_${entry.to.toLowerCase().replaceAll(" ", "_")}`, entity_type: "project", entity_id: entry.projectId, before: entry.from, after: entry.to, remark: entry.remark, ip_placeholder: "server-recorded" }])); }
export function getWorkflowActions(status: ProjectStatus) { return transitions[status] || []; }
export async function transitionProject(project: MockProject, action: WorkflowAction, remark: string, actorRole: string) { if (action.requiresRemark && remark.trim().length < 20) throw new Error("A meaningful remark of at least 20 characters is required for this transition."); if (!useMock) return (await api.post<MockProject>(`/projects/${project.id}/transition`, { to: action.to, remark })).data; await new Promise((resolve) => window.setTimeout(resolve, 450)); const timestamp = new Date().toISOString(); const next = { ...project, status: action.to, updated: timestamp.slice(0, 10) }; const state = readState(); state[project.id] = { status: action.to, updated: timestamp }; window.localStorage.setItem(stateKey, JSON.stringify(state)); writeAudit({ projectId: project.id, from: project.status, to: action.to, remark, actorRole, timestamp }); return next;
}
export function applyWorkflowState(project: MockProject) { const state = readState()[project.id]; return state ? { ...project, status: state.status, updated: state.updated.slice(0, 10) } : project; }
