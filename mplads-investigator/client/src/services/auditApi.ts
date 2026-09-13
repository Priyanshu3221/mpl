import axios from "axios";
import { mockAuditLogs, type AuditLogEntry } from "@/services/mock/auditMock";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 8000,
});

const auditKey = "mplads.audit.v1";

function readLocalStorageLogs(): AuditLogEntry[] {
  try {
    const raw = window.localStorage.getItem(auditKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export async function getAuditLogs(entityId?: string): Promise<AuditLogEntry[]> {
  let allLogs: AuditLogEntry[] = [];
  if (!useMock) {
    const url = entityId ? `/audit?entityId=${entityId}` : "/audit";
    const res = await api.get<AuditLogEntry[]>(url);
    allLogs = res.data;
  } else {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const localLogs = readLocalStorageLogs();
    // Deduplicate by ID
    const map = new Map<string, AuditLogEntry>();
    [...localLogs, ...mockAuditLogs].forEach((item) => {
      map.set(item.id, item);
    });
    allLogs = Array.from(map.values());
  }

  if (entityId) {
    allLogs = allLogs.filter((log) => log.entity_id.toLowerCase() === entityId.toLowerCase());
  }

  // Sort descending by timestamp
  return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function recordAuditAction(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  try {
    const existing = readLocalStorageLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    window.localStorage.setItem(auditKey, JSON.stringify([newEntry, ...existing]));
    return newEntry;
  } catch {
    return null;
  }
}
