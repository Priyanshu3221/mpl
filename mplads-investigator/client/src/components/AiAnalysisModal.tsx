import React, { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, Bot, X, ShieldAlert, Cpu } from "lucide-react";
import { explainRiskFlag, summarizeProjectAI } from "@/services/aiApi";
import { type AiRiskAnalysis, type AiProjectSummary } from "@/services/mock/aiMock";
import { focusRing } from "@/constants/permissions";

interface AiAnalysisModalProps {
  type: "flag" | "project";
  targetId: string;
  targetName?: string;
  onClose: () => void;
}

export default function AiAnalysisModal({ type, targetId, targetName = "", onClose }: AiAnalysisModalProps) {
  const [loading, setLoading] = useState(true);
  const [flagAnalysis, setFlagAnalysis] = useState<AiRiskAnalysis | null>(null);
  const [projectSummary, setProjectSummary] = useState<AiProjectSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    if (type === "flag") {
      explainRiskFlag(targetId)
        .then(setFlagAnalysis)
        .finally(() => setLoading(false));
    } else {
      summarizeProjectAI(targetId, targetName)
        .then(setProjectSummary)
        .finally(() => setLoading(false));
    }
  }, [type, targetId, targetName]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a2c]/60 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
    >
      <div className="w-full max-w-xl rounded-lg border border-[#dce5ee] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#edf2f5] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f0b323]/20 text-[#b27b00]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#b27b00]">
                  Demo AI-Assisted Insight
                </span>
                <span className="rounded bg-[#f0b323]/10 border border-[#f0b323]/30 px-2 py-0.5 text-[10px] font-extrabold text-[#b27b00]">
                  ADVISORY ONLY · MOCK MODEL
                </span>
              </div>
              <h2 id="ai-modal-title" className="text-lg font-semibold text-[#102a43]">
                {type === "flag" ? `AI Risk Analysis for ${targetId}` : `AI Project Summary for ${targetId}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI dialog"
            className={`rounded-md p-1.5 text-[#71859a] hover:bg-[#f1f5f8] ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Bot size={36} className="mx-auto text-[#277da1] animate-bounce" />
            <p className="text-sm font-semibold text-[#102a43]">Generating AI Investigation Insights…</p>
            <p className="text-xs text-[#71859a]">Analyzing eSAKSHI data rules, velocity, and procurement graphs</p>
          </div>
        ) : type === "flag" && flagAnalysis ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-md bg-[#fff4d8] p-3 border border-[#f5dfa5] text-xs">
              <span className="font-bold text-[#8a6200]">Category: {flagAnalysis.ruleCategory}</span>
              <span className="font-bold text-[#8c3636]">Severity: {flagAnalysis.severity}</span>
              <span className="text-[#607387]">Confidence: {flagAnalysis.confidenceScore}%</span>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#607387]">Summary of Risk Signal</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#152536] bg-[#f8fafc] p-3 rounded border border-[#edf2f5]">
                {flagAnalysis.summary}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#607387]">Key Risk Indicators</h3>
              <ul className="mt-1.5 space-y-1 text-xs text-[#152536]">
                {flagAnalysis.keyIndicators.map((ind, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#a34d4d] shrink-0" />
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-[#c4e0f0] bg-[#eaf2f7] p-3 text-xs">
              <h3 className="font-bold text-[#277da1] flex items-center gap-1">
                <CheckCircle2 size={14} /> Recommended Action
              </h3>
              <p className="mt-1 text-[#102a43]">{flagAnalysis.recommendedAction}</p>
            </div>

            <p className="text-[10px] text-[#8aa0b2] text-right">
              Model: {flagAnalysis.modelIdentifier}
            </p>
          </div>
        ) : type === "project" && projectSummary ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-md bg-[#eaf2f7] p-3 border border-[#c4e0f0] text-xs">
              <span className="font-bold text-[#102a43]">{projectSummary.projectName}</span>
              <span className="rounded bg-[#fbe7e7] px-2 py-0.5 font-bold text-[#8c3636]">
                {projectSummary.riskAssessment}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#607387]">Executive Overview</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#152536] bg-[#f8fafc] p-3 rounded border border-[#edf2f5]">
                {projectSummary.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded bg-[#f8fafc] p-3 border border-[#edf2f5]">
                <strong className="text-[#102a43] block mb-1">Physical Delivery Health</strong>
                <p className="text-[#607387]">{projectSummary.deliveryHealth}</p>
              </div>
              <div className="rounded bg-[#f8fafc] p-3 border border-[#edf2f5]">
                <strong className="text-[#102a43] block mb-1">Financial Integrity</strong>
                <p className="text-[#607387]">{projectSummary.financialIntegrity}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#607387]">Key Action Items</h3>
              <ul className="mt-1.5 space-y-1 text-xs text-[#152536]">
                {projectSummary.keyActionItems.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#277da1] shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[10px] text-[#8aa0b2] text-right">
              Model: {projectSummary.modelIdentifier}
            </p>
          </div>
        ) : null}

        {/* Footer Notice */}
        <div className="mt-6 flex items-center justify-between border-t border-[#edf2f5] pt-4">
          <span className="text-[11px] text-[#8aa0b2] flex items-center gap-1">
            <Cpu size={13} /> Demo AI insight — Advisory only (Non-authoritative decision support)
          </span>
          <button
            onClick={onClose}
            className={`rounded-md bg-[#102a43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#193c59] ${focusRing}`}
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
