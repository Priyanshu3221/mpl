import axios from "axios";
import { mockManagedUsers, type ManagedUser } from "@/services/mock/usersMock";
import { type Role } from "@/constants/permissions";
import { recordAuditAction } from "@/services/auditApi";
import { assertPermission, authHeaders } from "@/services/sessionApi";
import { PERMISSIONS } from "@/constants/permissions";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({
  // Relative, same-origin path — NOT an absolute "http://localhost:8080/..."
  // URL. The Express API server has no CORS headers configured, so an
  // absolute cross-origin URL gets silently blocked by the browser (axios
  // throws with no `.response` at all, which getUsers() below can't tell
  // apart from a real outage). A relative path goes through Vite's dev
  // proxy in dev (see vite.config.ts) and is same-origin for real in
  // production, where the client and /api are served together.
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 8000,
});

// Attach the session token to every request this instance makes, so the
// backend's requirePermission(MANAGE_USERS) has something to verify against.
api.interceptors.request.use(async (config) => {
  const headers = await authHeaders();
  config.headers = { ...(config.headers as Record<string, string> | undefined), ...headers };
  return config;
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
  // User administration is Admin-only and is verified by the backend.
  await assertPermission(PERMISSIONS.MANAGE_USERS);
  if (!useMock) {
    try {
      const res = await api.get<ManagedUser[]>("/users");
      return res.data;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status !== 503) {
        // A real failure (403, network error, Clerk rejected it) — surface it
        // rather than silently showing a stale/mock directory.
        const serverMessage = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
        throw new Error(serverMessage || "Could not load the user directory.");
      }
      // 503 = identity provider integration not configured in this
      // environment (no CLERK_SECRET_KEY). Fall through to the local demo
      // table so the UI is still explorable before Clerk admin is wired up.
    }
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
  // `actorRole` is an audit label only; authorization comes from the session.
  await assertPermission(PERMISSIONS.MANAGE_USERS);

  if (!useMock) {
    // Persist the official role to the identity provider. This is the only
    // step that changes what the TARGET user's own session actually resolves
    // to — everything below only updates what this Admin's screen displays.
    try {
      await api.patch(`/users/${encodeURIComponent(userId)}/role`, { role: newRole });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status !== 503) {
        // A real failure (403, network error, Clerk rejected it) — surface it
        // rather than silently recording a role change that never took effect.
        const serverMessage = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
        throw new Error(serverMessage || "Could not persist the role change to the identity provider.");
      }
      // 503 = identity provider integration not configured in this
      // environment (no CLERK_SECRET_KEY). Fall through so the local demo
      // table still reflects the change for UI purposes.
    }
  }

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
  // `actorRole` is an audit label only; authorization comes from the session.
  await assertPermission(PERMISSIONS.MANAGE_USERS);

  if (!useMock) {
    // Persist the activation state to the identity provider, the same way
    // updateUserRole does — this is the only step that changes whether the
    // TARGET user can actually sign in.
    try {
      await api.patch(`/users/${encodeURIComponent(userId)}/status`, { status: newStatus });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status !== 503) {
        const serverMessage = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
        throw new Error(serverMessage || "Could not persist the status change to the identity provider.");
      }
      // 503 = CLERK_SECRET_KEY not configured — fall through to the local
      // demo table for UI purposes, same as updateUserRole above.
    }
  }

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
