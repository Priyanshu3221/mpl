import { api } from "./apiClient";
import { activity, financialTrend, flags, projects, users, type MockFlag, type MockProject } from "@/services/mock/dashboardMock";

export type DashboardData = { projects: MockProject[]; flags: MockFlag[]; users: typeof users; activity: typeof activity; financialTrend: typeof financialTrend };
export type DashboardQuery = { fy?: string; state?: string; status?: string; severity?: string };

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export async function getDashboardData(query: DashboardQuery = {}): Promise<DashboardData> {
  if (!useMock) {
    const response = await api.get<DashboardData>("/dashboard", { params: query });
    return response.data;
  }
  await new Promise((resolve) => window.setTimeout(resolve, 300));
  return { projects, flags, users, activity, financialTrend };
}

export function filterDashboardData(data: DashboardData, query: DashboardQuery) {
  const filteredProjects = data.projects.filter((project) => (!query.fy || query.fy === "All" || project.fy === query.fy) && (!query.state || query.state === "All" || project.state === query.state) && (!query.status || query.status === "All" || project.status === query.status));
  const filteredFlags = data.flags.filter((flag) => (!query.fy || query.fy === "All" || flag.fy === query.fy) && (!query.state || query.state === "All" || flag.state === query.state) && (!query.severity || query.severity === "All" || flag.severity === query.severity));
  return { ...data, projects: filteredProjects, flags: filteredFlags };
}

export function dashboardDataSource() { return useMock ? "mock" : "api"; }
