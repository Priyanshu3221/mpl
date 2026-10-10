import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, FileCheck, X } from "lucide-react";
import { focusRing } from "@/constants/permissions";

const consentKey = "mplads.consent.v1";

export default function ConsentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const hasConsented = localStorage.getItem(consentKey);
      if (!hasConsented) {
        setOpen(true);
      }
    } catch {
      // Fallback
    }
  }, []);

  const acceptConsent = () => {
    try {
      localStorage.setItem(consentKey, JSON.stringify({ acceptedAt: new Date().toISOString() }));
    } catch {
      // Fallback
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a2c]/65 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#dce5ee] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf2f5] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eaf2f7] text-[#277da1]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b27b00]">
                Official Governance Notice
              </p>
              <h2 id="consent-title" className="text-lg font-semibold text-[#102a43]">
                MPLADS eSAKSHI Terms & Privacy Policy
              </h2>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close consent dialog"
            className={`rounded-md p-1.5 text-[#71859a] hover:bg-[#f1f5f8] ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs leading-relaxed text-[#607387]">
          <p>
            Welcome to the <strong className="text-[#102a43]">MPLADS Investigator & Monitoring System</strong>. By accessing this operational workspace, you acknowledge and agree to the following governance standards:
          </p>

          <ul className="space-y-2 rounded-md bg-[#f8fafc] p-3 border border-[#edf2f5]">
            <li className="flex items-start gap-2 text-[#152536]">
              <CheckCircle2 size={15} className="text-[#277a57] shrink-0 mt-0.5" />
              <span>
                <strong>GIGW 3.0 Compliance:</strong> Designed according to Ministry of Electronics & IT guidelines for Indian Government applications.
              </span>
            </li>
            <li className="flex items-start gap-2 text-[#152536]">
              <CheckCircle2 size={15} className="text-[#277a57] shrink-0 mt-0.5" />
              <span>
                <strong>Auditable Actions:</strong> All status transitions, risk reviews, and role actions are recorded in an immutable system audit trail.
              </span>
            </li>
            <li className="flex items-start gap-2 text-[#152536]">
              <CheckCircle2 size={15} className="text-[#277a57] shrink-0 mt-0.5" />
              <span>
                <strong>Public Data Source:</strong> Project records are sourced from eSAKSHI MoSPI public data registries.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[#edf2f5] pt-4">
          <span className="text-[11px] text-[#8aa0b2]">MeitY & MoSPI Security Standard</span>
          <button
            onClick={acceptConsent}
            className={`rounded-md bg-[#102a43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#193c59] ${focusRing}`}
          >
            Acknowledge & Proceed to Portal
          </button>
        </div>
      </div>
    </div>
  );
}
