import axios from "axios";
import { projects, type MockProject } from "@/services/mock/dashboardMock";
import { applyWorkflowState } from "@/services/workflowApi";

export type ProjectQuery = { search?: string; fy?: string; state?: string; status?: string };
export type ProposalPayload = { projectName: string; description: string; category: string; type: string; state: string; district: string; constituency: string; localBody: string; locality: string; address: string; latitude: string; longitude: string; estimatedCost: number; requestedAmount: number; sanctionedAmount: number; fundingDetails: string; agencyName: string; department: string; contactName: string; contactEmail: string; contactPhone: string; supportingInfo: string; documents: Array<{ name: string; size: number; type: string }> };
export type ProposalRecord = ProposalPayload & { id: string; status: "Draft" | "Submitted"; createdAt: string; updatedAt: string };
const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api", timeout: 8000 });
const proposalKey = "mplads.proposals.v1";

function readProposals() { try { return JSON.parse(window.localStorage.getItem(proposalKey) || "[]") as ProposalRecord[]; } catch { return []; } }
function writeProposals(records: ProposalRecord[]) { window.localStorage.setItem(proposalKey, JSON.stringify(records)); }
function proposalToProject(proposal: ProposalRecord): MockProject { return { id: proposal.id, name: proposal.projectName, category: proposal.category, state: proposal.state, district: proposal.district, constituency: proposal.constituency, agency: proposal.agencyName, fy: "2026-27", status: proposal.status, amount: proposal.estimatedCost, utilized: 0, progress: 0, submitted: proposal.createdAt, updated: proposal.updatedAt }; }

export async function getProjects(query: ProjectQuery = {}) { if (!useMock) return (await api.get<MockProject[]>("/projects", { params: query })).data; await new Promise((resolve) => window.setTimeout(resolve, 250)); return [...readProposals().map(proposalToProject), ...projects].map(applyWorkflowState); }
export async function getProjectById(id: string) { if (!useMock) return (await api.get<MockProject>(`/projects/${id}`)).data; await new Promise((resolve) => window.setTimeout(resolve, 300)); return (await getProjects()).find((project) => project.id === id) ?? null; }
export async function saveProjectDraft(payload: ProposalPayload, existingId?: string) { if (!useMock) return (await api.post<ProposalRecord>("/projects/drafts", { ...payload, id: existingId })).data; await new Promise((resolve) => window.setTimeout(resolve, 350)); const now = new Date().toISOString(); const records = readProposals(); const existing = existingId ? records.find((record) => record.id === existingId) : undefined; const record: ProposalRecord = { ...payload, id: existingId || `MPLADS-DRAFT-${Date.now()}`, status: "Draft", createdAt: existing?.createdAt || now, updatedAt: now }; writeProposals([...records.filter((item) => item.id !== record.id), record]); return record; }
export async function submitProject(payload: ProposalPayload, existingId?: string) { if (!useMock) return (await api.post<ProposalRecord>("/projects", { ...payload, id: existingId })).data; await new Promise((resolve) => window.setTimeout(resolve, 600)); const now = new Date().toISOString(); const records = readProposals(); const existing = existingId ? records.find((record) => record.id === existingId) : undefined; const record: ProposalRecord = { ...payload, id: existingId || `MPLADS-${Date.now()}`, status: "Submitted", createdAt: existing?.createdAt || now, updatedAt: now }; writeProposals([...records.filter((item) => item.id !== record.id), record]); return record; }
export function projectDataSource() { return useMock ? "mock" : "api"; }
