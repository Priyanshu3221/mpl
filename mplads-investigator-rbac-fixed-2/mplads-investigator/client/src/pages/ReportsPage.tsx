import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  PieChart as PieChartIcon,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react";
import { exportReportToCSV, getReports } from "@/services/reportsApi";
import { type ReportRow } from "@/services/mock/reportsMock";
import { focusRing } from "@/constants/permissions";

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [fy, setFy] = useState("All");
  const [state, setState] = useState("All");

  const loadData = () => {
    setLoading(true);
    setError(false);
    getReports()
      .then(setRows)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        search === "" ||
        row.district.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q) ||
        row.agencyName.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);
      const matchFy = fy === "All" || row.fy === fy;
      const matchState = state === "All" || row.state === state;
      return matchSearch && matchFy && matchState;
    });
  }, [rows, search, fy, state]);

  const totalAllocated = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.allocatedAmount, 0),
    [filteredRows]
  );
  const totalUtilized = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.utilizedAmount, 0),
    [filteredRows]
  );
  const overallUtilPercentage = totalAllocated > 0 ? Math.round((totalUtilized / totalAllocated) * 100) : 0;
  const totalProjects = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.totalProjects, 0),
    [filteredRows]
  );
  const totalOpenFlags = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.openFlagsCount, 0),
    [filteredRows]
  );

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading reports">
        <div className="h-28 animate-pulse rounded-md bg-[#e4ebf1]" />
        <div className="h-96 animate-pulse rounded-md bg-[#e4ebf1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#e7c9c9] bg-[#fff9f9] p-12 text-center">
        <AlertTriangle className="mx-auto text-[#a34d4d]" size={32} />
        <h2 className="mt-4 text-lg font-semibold text-[#7c3030]">Unable to generate report data</h2>
        <p className="mt-2 text-sm text-[#8b5b5b]">Service error while aggregating MPLADS records.</p>
        <button
          onClick={loadData}
          className={`mt-5 rounded-md border border-[#a34d4d] px-4 py-2 text-sm font-semibold text-[#7c3030] ${focusRing}`}
        >
          Retry Service
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#b27b00]">
            <FileText size={14} /> Official Analytics & Export
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
            MPLADS Investigation Reports
          </h1>
          <p className="mt-1 text-sm text-[#607387]">
            District fund utilization, implementing agency performance, and fraud risk breakdown.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportReportToCSV(filteredRows, "MPLADS_Investigation_Report")}
            className={`inline-flex items-center gap-2 rounded-md bg-[#102a43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#193c59] ${focusRing}`}
          >
            <Download size={15} /> Export Report (CSV)
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-[#dce5ee] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#71859a]">Total Allocation</p>
          <p className="mt-2 text-2xl font-semibold text-[#102a43]">
            ₹{new Intl.NumberFormat("en-IN").format(totalAllocated)}
          </p>
          <p className="mt-2 text-xs text-[#607387]">Across {filteredRows.length} district records</p>
        </div>

        <div className="rounded-md border border-[#dce5ee] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#71859a]">Total Utilized</p>
          <p className="mt-2 text-2xl font-semibold text-[#277da1]">
            ₹{new Intl.NumberFormat("en-IN").format(totalUtilized)}
          </p>
          <p className="mt-2 text-xs font-semibold text-[#277a57]">{overallUtilPercentage}% Utilization Rate</p>
        </div>

        <div className="rounded-md border border-[#dce5ee] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#71859a]">Monitored Works</p>
          <p className="mt-2 text-2xl font-semibold text-[#102a43]">{totalProjects}</p>
          <p className="mt-2 text-xs text-[#607387]">Physical delivery projects</p>
        </div>

        <div className="rounded-md border border-[#dce5ee] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#71859a]">Open Risk Flags</p>
          <p className="mt-2 text-2xl font-semibold text-[#a34d4d]">{totalOpenFlags}</p>
          <p className="mt-2 text-xs text-[#8c3636]">Requires district review</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-md border border-[#dce5ee] bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#102a43]">
            <Filter size={16} /> Filter Report Criteria
          </div>
          <button
            onClick={() => {
              setSearch("");
              setFy("All");
              setState("All");
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold text-[#607387] hover:text-[#102a43] ${focusRing}`}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#8aa0b2]" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search district, state, or agency..."
              className="w-full rounded-md border border-[#dce5ee] py-2 pl-9 pr-3 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            />
          </div>
          <div>
            <select
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="w-full rounded-md border border-[#dce5ee] px-3 py-2 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            >
              <option value="All">All Financial Years</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>
          </div>
          <div>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-md border border-[#dce5ee] px-3 py-2 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            >
              <option value="All">All States</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Bihar">Bihar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#b8c8d5] bg-white p-12 text-center">
          <BarChart3 className="mx-auto text-[#8aa0b2]" size={32} />
          <h2 className="mt-4 font-semibold text-[#102a43]">No report rows match criteria</h2>
          <p className="mt-1 text-sm text-[#607387]">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#dce5ee] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="border-b border-[#dce5ee] bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    District & State
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Implementing Agency
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    FY
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Allocated / Utilized
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Utilization %
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Works Delivery
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Risk Signals
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2f5]">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#fbfcfd]">
                    <td className="px-4 py-4 text-xs">
                      <span className="font-bold text-[#102a43]">{row.district}</span>
                      <span className="mt-0.5 block text-[11px] text-[#71859a]">{row.state}</span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#152536]">
                        <Building2 size={14} className="text-[#277da1]" />
                        <span>{row.agencyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#607387]">{row.fy}</td>
                    <td className="px-4 py-4 text-xs">
                      <span className="font-semibold text-[#102a43]">
                        ₹{new Intl.NumberFormat("en-IN").format(row.allocatedAmount)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#277da1]">
                        Utilized: ₹{new Intl.NumberFormat("en-IN").format(row.utilizedAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-[#e9eff3]">
                          <div
                            className={`h-full ${
                              row.utilizationPercentage >= 80
                                ? "bg-[#277a57]"
                                : row.utilizationPercentage >= 65
                                ? "bg-[#277da1]"
                                : "bg-[#b27b00]"
                            }`}
                            style={{ width: `${row.utilizationPercentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#102a43]">{row.utilizationPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#607387]">
                      <strong className="text-[#102a43]">{row.completedProjects}</strong> /{" "}
                      {row.totalProjects} Completed
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {row.openFlagsCount > 0 && (
                          <span className="rounded bg-[#fbe7e7] px-2 py-0.5 font-bold text-[#8c3636]">
                            {row.openFlagsCount} Flags
                          </span>
                        )}
                        {row.collusionRiskCount > 0 && (
                          <span className="rounded bg-[#fff4d8] px-2 py-0.5 font-bold text-[#8a6200]">
                            {row.collusionRiskCount} Collusion Alert
                          </span>
                        )}
                        {row.openFlagsCount === 0 && row.collusionRiskCount === 0 && (
                          <span className="rounded bg-[#e7f6ee] px-2 py-0.5 font-semibold text-[#277a57]">
                            Clear
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
