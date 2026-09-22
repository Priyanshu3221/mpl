import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { getAuditLogs } from "@/services/auditApi";
import { type AuditLogEntry } from "@/services/mock/auditMock";
import { focusRing } from "@/constants/permissions";

const actionLabels: Record<string, string> = {
  project_status_submitted: "Project Submitted",
  project_status_under_review: "Review Started",
  project_status_approved: "Project Approved",
  project_status_rejected: "Project Rejected",
  project_status_sanctioned: "Sanction Issued",
  project_status_in_progress: "Implementation Started",
  project_status_completed: "Project Completed",
  project_status_closed: "Project Closed",
  flag_review_dismissed: "Flag Dismissed",
  flag_review_escalated: "Flag Escalated",
  flag_review_false_positive: "Flag False Positive",
  collusion_flag_under_investigation: "Collusion Under Investigation",
  collusion_flag_confirmed: "Collusion Confirmed",
  collusion_flag_dismissed: "Collusion Dismissed",
  user_role_updated: "User Role Updated",
  user_status_changed: "User Status Changed",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("All");
  const [actorRole, setActorRole] = useState("All");

  const loadLogs = () => {
    setLoading(true);
    setError(false);
    getAuditLogs()
      .then(setLogs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadLogs, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchSearch =
        search === "" ||
        log.id.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q) ||
        log.actor_email.toLowerCase().includes(q) ||
        (log.remark && log.remark.toLowerCase().includes(q)) ||
        log.action.toLowerCase().includes(q);
      const matchEntity = entityType === "All" || log.entity_type === entityType;
      const matchRole = actorRole === "All" || log.actor_role === actorRole;
      return matchSearch && matchEntity && matchRole;
    });
  }, [logs, search, entityType, actorRole]);

  const exportAuditCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["Audit ID", "Timestamp", "Actor Email", "Actor Role", "Action", "Entity Type", "Entity ID", "Before", "After", "Remark"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.actor_email,
      l.actor_role,
      actionLabels[l.action] || l.action,
      l.entity_type,
      l.entity_id,
      l.before || "",
      l.after || "",
      `"${(l.remark || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mplads_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading audit logs">
        <div className="h-24 animate-pulse rounded-md bg-[#e4ebf1]" />
        <div className="h-96 animate-pulse rounded-md bg-[#e4ebf1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#e7c9c9] bg-[#fff9f9] p-12 text-center">
        <AlertTriangle className="mx-auto text-[#a34d4d]" size={32} />
        <h2 className="mt-4 text-lg font-semibold text-[#7c3030]">Audit service error</h2>
        <p className="mt-2 text-sm text-[#8b5b5b]">Unable to fetch system audit logs.</p>
        <button
          onClick={loadLogs}
          className={`mt-5 rounded-md border border-[#a34d4d] px-4 py-2 text-sm font-semibold text-[#7c3030] ${focusRing}`}
        >
          Retry
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
            <ShieldCheck size={14} /> Immutable Governance Log
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
            System Audit Trail
          </h1>
          <p className="mt-1 text-sm text-[#607387]">
            Complete record of status transitions, reviewer dispositions, user role updates, and system decisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportAuditCSV}
            className={`inline-flex items-center gap-2 rounded-md bg-[#102a43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#193c59] ${focusRing}`}
          >
            <Download size={14} /> Export Audit Log (CSV)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-md border border-[#dce5ee] bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#102a43]">
            <Filter size={16} /> Filter Audit Records
          </div>
          <button
            onClick={() => {
              setSearch("");
              setEntityType("All");
              setActorRole("All");
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold text-[#607387] hover:text-[#102a43] ${focusRing}`}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#8aa0b2]" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, email, entity, or remark..."
              className="w-full rounded-md border border-[#dce5ee] py-2 pl-9 pr-3 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            />
          </div>
          <div>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full rounded-md border border-[#dce5ee] px-3 py-2 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            >
              <option value="All">All Entity Types</option>
              <option value="project">Project Records</option>
              <option value="flag">Fraud Risk Flags</option>
              <option value="collusion_pair">Collusion Networks</option>
              <option value="user">User & Roles</option>
            </select>
          </div>
          <div>
            <select
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value)}
              className="w-full rounded-md border border-[#dce5ee] px-3 py-2 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            >
              <option value="All">All Actor Roles</option>
              <option value="District Authority">District Authority</option>
              <option value="MP">Member of Parliament</option>
              <option value="Implementing Agency">Implementing Agency</option>
              <option value="Admin">System Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#b8c8d5] bg-white p-12 text-center">
          <Clock className="mx-auto text-[#8aa0b2]" size={32} />
          <h2 className="mt-4 font-semibold text-[#102a43]">No audit logs found</h2>
          <p className="mt-1 text-sm text-[#607387]">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#dce5ee] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-[#dce5ee] bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Audit ID & Time
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Actor
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Action
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Target Entity
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Transition / Details
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Remark / Justification
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2f5]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fbfcfd]">
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-bold text-[#102a43]">{log.id}</span>
                      <span className="mt-0.5 block text-[11px] text-[#71859a]">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#152536]">
                        <User size={13} className="text-[#277da1]" />
                        <span>{log.actor_email}</span>
                      </div>
                      <span className="mt-0.5 block text-[11px] text-[#71859a]">{log.actor_role}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <span className="inline-flex rounded-md bg-[#eaf2f7] px-2 py-1 font-semibold text-[#277da1]">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {log.entity_type === "project" || log.entity_id.startsWith("MPLADS-") ? (
                        <Link
                          href={`/projects/${log.entity_id}`}
                          className={`inline-flex items-center gap-1 font-semibold text-[#277da1] hover:text-[#102a43] ${focusRing}`}
                        >
                          {log.entity_id} <ExternalLink size={11} />
                        </Link>
                      ) : log.entity_type === "flag" || log.entity_id.startsWith("FLAG-") ? (
                        <Link
                          href="/flags"
                          className={`inline-flex items-center gap-1 font-semibold text-[#8c3636] hover:text-[#a34d4d] ${focusRing}`}
                        >
                          {log.entity_id} <ExternalLink size={11} />
                        </Link>
                      ) : log.entity_type === "collusion_pair" || log.entity_id.startsWith("COL-") ? (
                        <Link
                          href="/flags/collusion"
                          className={`inline-flex items-center gap-1 font-semibold text-[#b27b00] hover:text-[#d59a16] ${focusRing}`}
                        >
                          {log.entity_id} <ExternalLink size={11} />
                        </Link>
                      ) : log.entity_type === "user" || log.entity_id.startsWith("USR-") ? (
                        <Link
                          href="/users"
                          className={`inline-flex items-center gap-1 font-semibold text-[#102a43] hover:text-[#277da1] ${focusRing}`}
                        >
                          {log.entity_id} <ExternalLink size={11} />
                        </Link>
                      ) : (
                        <span className="font-semibold text-[#102a43]">{log.entity_id}</span>
                      )}
                      <span className="mt-0.5 block text-[11px] uppercase tracking-wider text-[#71859a]">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#607387]">
                      {log.before || log.after ? (
                        <span>
                          <strong className="text-[#71859a]">{log.before || "None"}</strong> →{" "}
                          <strong className="text-[#102a43]">{log.after || "Updated"}</strong>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#152536]">
                      <p className="max-w-xs leading-relaxed">{log.remark || "—"}</p>
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
