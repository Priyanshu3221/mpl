import axios from "axios";

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 8000,
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setApiClientTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

api.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    if (tokenGetter) {
      token = await tokenGetter();
    } else if (typeof window !== "undefined" && window.Clerk?.session) {
      token = await window.Clerk.session.getToken();
    }
    if (token) {
      if (config.headers && typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {
    // Non-blocking token retrieval fallback
  }
  return config;
});
