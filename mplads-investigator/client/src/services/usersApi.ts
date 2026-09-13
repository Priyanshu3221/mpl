import axios from "axios";
import { mockManagedUsers, type ManagedUser } from "@/services/mock/usersMock";
import { type Role } from "@/constants/permissions";
import { recordAuditAction } from "@/services/auditApi";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 8000,
});

const storageKey = "mplads.users.v1";

function readStoredUsers(): Record<string, Partial<ManagedUser>> {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

export async function getUsers(): Promise<ManagedUser[]> {
  if (!useMock) {
    const res = await api.get<ManagedUser[]>("/users");
    return res.data;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  const stored = readStoredUsers();
  return mockManagedUsers.map((u) => {
    if (stored[u.id]) {
      return { ...u, ...stored[u.id] };
    }
    return u;
  });
}

export async function updateUserRole(userId: string, newRole: Role, actorRole = "Admin"): Promise<ManagedUser> {
  const user = (await getUsers()).find((u) => u.id === userId);
  if (!user) throw new Error("User not found.");

  const oldRole = user.role;
  const updatedUser: ManagedUser = { ...user, role: newRole };

  const stored = readStoredUsers();
  stored[userId] = { ...stored[userId], role: newRole };
  window.localStorage.setItem(storageKey, JSON.stringify(stored));

  recordAuditAction({
    actor_email: "admin@mplads.gov.in",
    actor_role: actorRole,
    action: "user_role_updated",
    entity_type: "user",
    entity_id: userId,
    before: oldRole,
    after: newRole,
    remark: `User role changed from ${oldRole} to ${newRole} by Administrator.`,
  });

  return updatedUser;
}

export async function updateUserStatus(userId: string, newStatus: "Active" | "Inactive", actorRole = "Admin"): Promise<ManagedUser> {
  const user = (await getUsers()).find((u) => u.id === userId);
  if (!user) throw new Error("User not found.");

  const oldStatus = user.status;
  const updatedUser: ManagedUser = { ...user, status: newStatus };

  const stored = readStoredUsers();
  stored[userId] = { ...stored[userId], status: newStatus };
  window.localStorage.setItem(storageKey, JSON.stringify(stored));

  recordAuditAction({
    actor_email: "admin@mplads.gov.in",
    actor_role: actorRole,
    action: "user_status_changed",
    entity_type: "user",
    entity_id: userId,
    before: oldStatus,
    after: newStatus,
    remark: `User status changed to ${newStatus}.`,
  });

  return updatedUser;
}
