import axios from "axios";
import { mockCollusionPairs, type CollusionPair, type CollusionStatus } from "@/services/mock/collusionMock";
import { assertPermission } from "@/services/sessionApi";
import { PERMISSIONS } from "@/constants/permissions";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 8000,
});

const storageKey = "mplads.collusion.v1";
const auditKey = "mplads.audit.v1";

function readStoredPairs(): Record<string, { status: CollusionStatus; remark?: string; updated: string }> {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function writeAuditLog(entry: {
  pairId: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  remark: string;
  actorRole: string;
}) {
  try {
    const existing = JSON.parse(window.localStorage.getItem(auditKey) || "[]");
    const record = {
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor_email: "investigator@mplads.gov.in",
      actor_role: entry.actorRole,
      action: `collusion_flag_${entry.action}`,
      entity_type: "collusion_pair",
      entity_id: entry.pairId,
      before: entry.fromStatus,
      after: entry.toStatus,
      remark: entry.remark,
      ip_placeholder: "127.0.0.1",
    };
    window.localStorage.setItem(auditKey, JSON.stringify([...existing, record]));
  } catch {
    // LocalStorage fallback
  }
}

export async function getCollusionPairs(): Promise<CollusionPair[]> {
  if (!useMock) {
    const res = await api.get<CollusionPair[]>("/collusion/pairs");
    return res.data;
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  const stored = readStoredPairs();
  return mockCollusionPairs.map((pair) => {
    if (stored[pair.id]) {
      return { ...pair, status: stored[pair.id].status };
    }
    return pair;
  });
}

export async function reviewCollusionPair(
  pairId: string,
  newStatus: CollusionStatus,
  remark: string,
  actorRole = "District Authority"
): Promise<CollusionPair> {
  await assertPermission(PERMISSIONS.REVIEW_FLAGS);
  if (remark.trim().length < 15) {
    throw new Error("A reviewer remark of at least 15 characters is required for the audit trail.");
  }

  const stored = readStoredPairs();
  const currentPair = mockCollusionPairs.find((p) => p.id === pairId);
  const fromStatus = stored[pairId]?.status || currentPair?.status || "Unreviewed";

  stored[pairId] = {
    status: newStatus,
    remark,
    updated: new Date().toISOString(),
  };
  window.localStorage.setItem(storageKey, JSON.stringify(stored));

  writeAuditLog({
    pairId,
    action: newStatus.toLowerCase().replace(" ", "_"),
    fromStatus,
    toStatus: newStatus,
    remark,
    actorRole,
  });

  const updatedPair = currentPair ? { ...currentPair, status: newStatus } : null;
  if (!updatedPair) throw new Error("Collusion record not found.");
  return updatedPair;
}
