import { ShieldCheck, FileCheck, CheckCircle2, Lock, Scale, Building } from "lucide-react";
import { focusRing } from "@/constants/permissions";

export default function CompliancePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#b27b00]">
          <ShieldCheck size={14} /> Statutory & Regulatory Standards
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
          Governance & Compliance Framework
        </h1>
        <p className="mt-1 text-sm text-[#607387]">
          MPLADS Investigator adheres strictly to Central Government IT Guidelines, MeitY Cyber Security directives, and eSAKSHI data integrity standards.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <article className="rounded-md border border-[#dce5ee] bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#eaf2f7] text-[#277da1]">
            <FileCheck size={20} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[#102a43]">GIGW 3.0 Compliance</h2>
          <p className="mt-2 text-sm leading-6 text-[#607387]">
            Guidelines for Indian Government Websites (GIGW 3.0) compliance ensuring accessibility, mobile responsiveness, standardized design tokens, and clear plain-language content.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-[#152536]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#277a57]" /> Standard NIC/MeitY Header & Navigation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#277a57]" /> Plain-Language Legal Explanations
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#277a57]" /> High-Contrast Visual Ratios
            </li>
          </ul>
        </article>

        <article className="rounded-md border border-[#dce5ee] bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4d8] text-[#b27b00]">
            <Lock size={20} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[#102a43]">Data Security & Privacy</h2>
          <p className="mt-2 text-sm leading-6 text-[#607387]">
            Strict adherence to the Digital Personal Data Protection (DPDP) Act, 2023. Authentication managed via Clerk identity with backend authorization enforcement.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-[#152536]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#277a57]" /> Role-Based Access Control (RBAC)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#277a57]" /> Encrypted Session Storage
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#277a57]" /> Immutable Activity Audit Trail
            </li>
          </ul>
        </article>
      </div>

      <div className="rounded-md border border-[#dce5ee] bg-white p-6">
        <h2 className="text-base font-semibold text-[#102a43]">eSAKSHI Data Source Attribution</h2>
        <p className="mt-2 text-sm leading-6 text-[#607387]">
          All project records, financial allocations, and implementation progress data are harmonized with Ministry of Statistics & Programme Implementation (MoSPI) public records from the official eSAKSHI portal.
        </p>
      </div>
    </div>
  );
}
