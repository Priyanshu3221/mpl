import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ExternalLink,
  Filter,
  Network,
  RotateCcw,
  ShieldAlert,
  Search,
  X,
  FileText,
} from "lucide-react";
import { getCollusionPairs, reviewCollusionPair } from "@/services/collusionApi";
import { type CollusionPair, type CollusionStatus } from "@/services/mock/collusionMock";
import { focusRing } from "@/constants/permissions";
import { useCurrentRole } from "@/contexts/AuthContext";

const severityTone: Record<string, string> = {
  High: "bg-[#fbe7e7] text-[#8c3636] border-[#f3c1c1]",
  Medium: "bg-[#fff4d8] text-[#8a6200] border-[#f5dfa5]",
  Low: "bg-[#edf1f4] text-[#5b6d7d] border-[#d4de86]",
};

const statusTone: Record<CollusionStatus, string> = {
  Unreviewed: "bg-[#fff4d8] text-[#8a6200]",
  "Under Investigation": "bg-[#eaf2f7] text-[#277da1]",
  Confirmed: "bg-[#fbe7e7] text-[#8c3636]",
  Dismissed: "bg-[#edf1f4] text-[#5b6d7d]",
};

function ReviewModal({
  pair,
  onClose,
  onComplete,
}: {
  pair: CollusionPair;
  onClose: () => void;
  onComplete: (updated: CollusionPair) => void;
}) {
  const role = useCurrentRole();
  const [status, setStatus] = useState<CollusionStatus>("Under Investigation");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (remark.trim().length < 15) {
      setError("Please enter a detailed remark (minimum 15 characters) for the official audit trail.");
      return;
    }
    setSaving(true);
    try {
      const updated = await reviewCollusionPair(pair.id, status, remark, role || "District Authority");
      onComplete(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record decision.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a2c]/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collusion-review-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#dce5ee] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf2f5] pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#b27b00]">
              Official Reviewer Disposition
            </p>
            <h2 id="collusion-review-title" className="mt-1 text-xl font-semibold text-[#102a43]">
              Review {pair.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={`rounded-md p-2 text-[#607387] hover:bg-[#f1f5f8] ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#607387]">Decision Status</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["Under Investigation", "Confirmed", "Dismissed"] as CollusionStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`rounded-md border px-3 py-2 text-xs font-semibold transition-all ${
                    status === st
                      ? st === "Confirmed"
                        ? "border-[#a34d4d] bg-[#a34d4d] text-white"
                        : "border-[#102a43] bg-[#102a43] text-white"
                      : "border-[#dce5ee] text-[#607387] hover:border-[#8aa0b2]"
                  } ${focusRing}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#607387]">
              Investigator Remark <span className="text-[#a34d4d]">*</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              placeholder="Explain the findings, supporting evidence review, or justification for this decision..."
              className="mt-1 block w-full resize-none rounded-md border border-[#dce5ee] px-3 py-2.5 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-[#a34d4d]" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-[#edf2f5] pt-4">
          <button
            onClick={onClose}
            className={`rounded-md border border-[#dce5ee] px-4 py-2.5 text-sm font-semibold text-[#607387] ${focusRing}`}
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={submit}
            className={`rounded-md bg-[#102a43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#193c59] disabled:opacity-60 ${focusRing}`}
          >
            {saving ? "Recording Audit Entry…" : "Save & Record Audit Log"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CollusionPage() {
  const [pairs, setPairs] = useState<CollusionPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingPair, setReviewingPair] = useState<CollusionPair | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(false);
    getCollusionPairs()
      .then(setPairs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const filtered = useMemo(() => {
    return pairs.filter((item) => {
      const matchSearch =
        search === "" ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.entityA.name.toLowerCase().includes(search.toLowerCase()) ||
        item.entityB.name.toLowerCase().includes(search.toLowerCase()) ||
        item.relationshipType.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severity === "All" || item.severity === severity;
      const matchStatus = status === "All" || item.status === status;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [pairs, search, severity, status]);

  const highRiskCount = pairs.filter((p) => p.severity === "High").length;

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading collusion data">
        <div className="h-28 animate-pulse rounded-md bg-[#e4ebf1]" />
        <div className="h-96 animate-pulse rounded-md bg-[#e4ebf1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#e7c9c9] bg-[#fff9f9] p-12 text-center">
        <AlertTriangle className="mx-auto text-[#a34d4d]" size={32} />
        <h2 className="mt-4 text-lg font-semibold text-[#7c3030]">Collusion detection service error</h2>
        <p className="mt-2 text-sm text-[#8b5b5b]">Unable to retrieve network relationship analysis.</p>
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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#f0b323]/40 bg-[#f0b323]/10 px-2.5 py-0.5 text-xs font-bold text-[#b27b00]">
              <Network size={13} /> STEP 4 — Network Oversight
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
            Collusion & Vendor Linkage Detection
          </h1>
          <p className="mt-1 text-sm text-[#607387]">
            AI-assisted relationship graph detecting shared directors, common IP addresses, split orders, and bidding rings.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-[#607387]">
          <span className="rounded-md bg-[#fbe7e7] px-2.5 py-1.5 text-[#8c3636]">
            {highRiskCount} High Risk Collusion Flags
          </span>
          <span className="rounded-md bg-[#eaf2f7] px-2.5 py-1.5 text-[#277da1]">
            {pairs.length} Network Pairs Analyzed
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-md border border-[#dce5ee] bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#102a43]">
            <Filter size={16} /> Filter Suspicious Relationships
          </div>
          <button
            onClick={() => {
              setSearch("");
              setSeverity("All");
              setStatus("All");
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
              placeholder="Search entity, ID, or pattern..."
              className="w-full rounded-md border border-[#dce5ee] py-2 pl-9 pr-3 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            />
          </div>
          <div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-md border border-[#dce5ee] px-3 py-2 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            >
              <option value="All">All Risk Severities</option>
              <option value="High">High Severity (Score &gt; 80)</option>
              <option value="Medium">Medium Severity (Score 50-80)</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-[#dce5ee] px-3 py-2 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            >
              <option value="All">All Review Statuses</option>
              <option value="Unreviewed">Unreviewed</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Confirmed">Confirmed Collusion</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pairs List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#b8c8d5] bg-white p-12 text-center">
          <ShieldAlert className="mx-auto text-[#8aa0b2]" size={32} />
          <h2 className="mt-4 font-semibold text-[#102a43]">No collusion pairs match your query</h2>
          <p className="mt-1 text-sm text-[#607387]">Try broadening your search or resetting filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((pair) => {
            const isExpanded = expandedId === pair.id;
            return (
              <article
                key={pair.id}
                className="overflow-hidden rounded-md border border-[#dce5ee] bg-white shadow-sm transition-all hover:border-[#b8c8d5]"
              >
                {/* Main Card Header */}
                <div className="p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#b27b00]">
                          {pair.id}
                        </span>
                        <span className={`rounded border px-2 py-0.5 text-xs font-bold ${severityTone[pair.severity]}`}>
                          {pair.severity} Severity (Risk Score: {pair.riskScore}/100)
                        </span>
                        <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${statusTone[pair.status]}`}>
                          {pair.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-[#102a43]">
                        {pair.relationshipType}
                      </h3>

                      {/* Connected Entities */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#152536]">
                        <div className="flex items-center gap-1.5 font-semibold text-[#102a43]">
                          <Building2 size={16} className="text-[#277da1]" />
                          <span>{pair.entityA.name}</span>
                          <span className="text-xs text-[#71859a]">({pair.entityA.type})</span>
                        </div>
                        <span className="text-xs font-bold text-[#b27b00]">⇄ CONNECTED TO ⇄</span>
                        <div className="flex items-center gap-1.5 font-semibold text-[#102a43]">
                          <Building2 size={16} className="text-[#277da1]" />
                          <span>{pair.entityB.name}</span>
                          <span className="text-xs text-[#71859a]">({pair.entityB.type})</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setReviewingPair(pair)}
                        className={`rounded-md bg-[#102a43] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#193c59] ${focusRing}`}
                      >
                        Review Disposition
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : pair.id)}
                        className={`flex items-center gap-1 rounded-md border border-[#dce5ee] px-3 py-2 text-xs font-semibold text-[#607387] hover:bg-[#f1f5f8] ${focusRing}`}
                      >
                        {isExpanded ? "Hide Evidence" : "View Evidence"}
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Summary bar */}
                  <div className="mt-4 grid grid-cols-2 gap-4 rounded-md bg-[#f8fafc] p-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-[#71859a]">Shared Projects:</span>{" "}
                      <strong className="text-[#152536]">{pair.sharedProjectsCount} Projects</strong>
                    </div>
                    <div>
                      <span className="text-[#71859a]">Contract Exposure:</span>{" "}
                      <strong className="text-[#102a43]">
                        ₹{new Intl.NumberFormat("en-IN").format(pair.totalContractValue)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#71859a]">Detected Date:</span>{" "}
                      <strong className="text-[#152536]">{pair.detectedDate}</strong>
                    </div>
                    <div>
                      <span className="text-[#71859a]">Primary Linkage:</span>{" "}
                      <strong className="text-[#8c3636] truncate block">{pair.relationshipReason}</strong>
                    </div>
                  </div>
                </div>

                {/* Expanded Details / Plain Language Evidence */}
                {isExpanded && (
                  <div className="border-t border-[#edf2f5] bg-[#f8fafc] p-5">
                    <div className="space-y-4">
                      <div>
                        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#102a43]">
                          <CircleHelp size={15} className="text-[#277da1]" /> Plain-Language Analysis
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-[#152536]">{pair.explanation}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#607387]">
                          Empirical Evidence Collected
                        </h4>
                        <ul className="mt-2 space-y-1.5 text-xs text-[#152536]">
                          {pair.evidence.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#a34d4d] shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Linked Projects */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#607387]">
                          Linked Projects Under Review
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pair.projectIds.map((pid) => (
                            <Link
                              key={pid}
                              href={`/projects/${pid}`}
                              className={`inline-flex items-center gap-1 rounded border border-[#b8c8d5] bg-white px-2.5 py-1 text-xs font-semibold text-[#102a43] hover:border-[#102a43] ${focusRing}`}
                            >
                              <FileText size={13} /> {pid} <ExternalLink size={11} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      {reviewingPair && (
        <ReviewModal
          pair={reviewingPair}
          onClose={() => setReviewingPair(null)}
          onComplete={(updated) => {
            setPairs((curr) => curr.map((p) => (p.id === updated.id ? updated : p)));
            setReviewingPair(null);
          }}
        />
      )}
    </div>
  );
}
