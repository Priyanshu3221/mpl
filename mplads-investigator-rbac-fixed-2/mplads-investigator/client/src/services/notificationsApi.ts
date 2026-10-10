import axios from "axios";
import { mockNotifications, type SystemNotification } from "@/services/mock/notificationsMock";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 8000,
});

const storageKey = "mplads.notifications.v1";

function readReadState(): Record<string, boolean> {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

export async function getNotifications(): Promise<SystemNotification[]> {
  if (!useMock) {
    try {
      const res = await api.get<SystemNotification[]>("/notifications");
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      /* API endpoint not implemented or returned fallback HTML */
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  const readMap = readReadState();
  return mockNotifications.map((n) => {
    if (readMap[n.id] !== undefined) {
      return { ...n, read: readMap[n.id] };
    }
    return n;
  });
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const readMap = readReadState();
  readMap[id] = true;
  window.localStorage.setItem(storageKey, JSON.stringify(readMap));
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const readMap = readReadState();
  mockNotifications.forEach((n) => {
    readMap[n.id] = true;
  });
  window.localStorage.setItem(storageKey, JSON.stringify(readMap));
}
