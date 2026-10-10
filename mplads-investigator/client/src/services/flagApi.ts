import axios from "axios";
import { flags, type MockFlag } from "@/services/mock/dashboardMock";

export type FlagReviewAction = "dismissed" | "escalated" | "false_positive";
export type FlagReviewPayload = { action: FlagReviewAction; remark: string; reason?: string };
const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", timeout: 8000 });

export async function getFlags() {
  if (!useMock) {
    try {
      const res = await api.get<MockFlag[]>("/flags");
      if (Array.isArray(res.data)) return res.data;
    } catch {
      /* Fallback to mock flags if API endpoint fails */
    }
  }
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  return flags;
}

export async function triggerDetectionEngine() {
  if (!useMock) {
    try {
      const response = await api.post<{ authorized: boolean; flags: MockFlag[] }>("/flags/detect");
      if (response.data && Array.isArray(response.data.flags)) {
        return response.data.flags;
      }
    } catch {
      /* Fallback to mock flags if engine trigger fails */
    }
  }
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  return flags;
}

export async function reviewFlag(flagId: string, payload: FlagReviewPayload) {
  if (payload.remark.trim().length < 20) throw new Error("Reviewer remarks must be at least 20 characters.");
  if (!useMock) return (await api.post<MockFlag>(`/flags/${flagId}/review`, payload)).data;
  const flag = flags.find((item) => item.id === flagId);
  if (!flag) throw new Error("Flag could not be found.");
  const status = payload.action === "dismissed" ? "Dismissed" : payload.action === "escalated" ? "Escalated" : "False positive";
  const audit = { id: `AUDIT-${Date.now()}`, timestamp: new Date().toISOString(), actor_role: "District Authority", action: payload.action, entity_type: "flag", entity_id: flagId, remark: payload.remark };
  const existing = JSON.parse(window.localStorage.getItem("mplads.audit.v1") || "[]") as unknown[];
  window.localStorage.setItem("mplads.audit.v1", JSON.stringify([...existing, audit]));
  return { ...flag, status } as MockFlag;
}

export const flagStatusLifecycle = ["open", "under_review", "dismissed", "escalated", "false_positive"] as const;
