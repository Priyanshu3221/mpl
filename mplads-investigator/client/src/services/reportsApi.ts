import axios from "axios";
import { mockReportRows, type ReportRow } from "@/services/mock/reportsMock";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 8000,
});

export async function getReports(): Promise<ReportRow[]> {
  if (!useMock) {
    const res = await api.get<ReportRow[]>("/reports");
    return res.data;
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  return mockReportRows;
}

export function exportReportToCSV(data: ReportRow[], reportTitle = "MPLADS_Summary_Report") {
  if (!data || data.length === 0) return;

  const headers = [
    "Report ID",
    "District",
    "State",
    "Financial Year",
    "Implementing Agency",
    "Allocated Amount (INR)",
    "Utilized Amount (INR)",
    "Utilization %",
    "Total Projects",
    "Completed Projects",
    "Open Risk Flags",
    "Collusion Warnings",
  ];

  const rows = data.map((r) => [
    r.id,
    r.district,
    r.state,
    r.fy,
    `"${r.agencyName.replace(/"/g, '""')}"`,
    r.allocatedAmount,
    r.utilizedAmount,
    `${r.utilizationPercentage}%`,
    r.totalProjects,
    r.completedProjects,
    r.openFlagsCount,
    r.collusionRiskCount,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${reportTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
