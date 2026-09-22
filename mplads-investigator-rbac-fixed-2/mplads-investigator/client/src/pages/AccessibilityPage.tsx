import { Accessibility, Check, Eye, Keyboard, Type } from "lucide-react";
import { focusRing } from "@/constants/permissions";

export default function AccessibilityPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#b27b00]">
          <Accessibility size={14} /> WCAG 2.1 AA Standards
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
          Accessibility Statement & Controls
        </h1>
        <p className="mt-1 text-sm text-[#607387]">
          We are committed to ensuring equal access and usability for all investigators, district authorities, and citizens regardless of device or ability.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-md border border-[#dce5ee] bg-white p-5">
          <Keyboard className="text-[#277da1]" size={22} />
          <h2 className="mt-3 font-semibold text-[#102a43]">Keyboard Navigation</h2>
          <p className="mt-2 text-xs leading-5 text-[#607387]">
            Full keyboard accessibility. Use <kbd className="rounded bg-[#edf2f5] px-1.5 py-0.5 text-[#102a43]">Tab</kbd> to move focus, <kbd className="rounded bg-[#edf2f5] px-1.5 py-0.5 text-[#102a43]">Enter</kbd> or <kbd className="rounded bg-[#edf2f5] px-1.5 py-0.5 text-[#102a43]">Space</kbd> to activate buttons, and <kbd className="rounded bg-[#edf2f5] px-1.5 py-0.5 text-[#102a43]">Esc</kbd> to close modals.
          </p>
        </div>

        <div className="rounded-md border border-[#dce5ee] bg-white p-5">
          <Eye className="text-[#277da1]" size={22} />
          <h2 className="mt-3 font-semibold text-[#102a43]">High Contrast & Colors</h2>
          <p className="mt-2 text-xs leading-5 text-[#607387]">
            Carefully curated contrast ratios exceeding 4.5:1 for normal text and 3:1 for graphical elements, compliant with WCAG 2.1 AA benchmarks.
          </p>
        </div>

        <div className="rounded-md border border-[#dce5ee] bg-white p-5">
          <Type className="text-[#277da1]" size={22} />
          <h2 className="mt-3 font-semibold text-[#102a43]">Screen Reader Support</h2>
          <p className="mt-2 text-xs leading-5 text-[#607387]">
            Structured HTML5 semantic tags, explicit ARIA roles, descriptive table headers, and live region status updates for screen readers.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-[#dce5ee] bg-white p-6">
        <h2 className="text-base font-semibold text-[#102a43]">Keyboard Shortcuts Cheatsheet</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
          <div className="flex items-center justify-between rounded bg-[#f8fafc] p-3 border border-[#edf2f5]">
            <span className="text-[#607387]">Focus next interactive element</span>
            <kbd className="rounded bg-[#eaf2f7] px-2 py-1 font-bold text-[#102a43]">Tab</kbd>
          </div>
          <div className="flex items-center justify-between rounded bg-[#f8fafc] p-3 border border-[#edf2f5]">
            <span className="text-[#607387]">Focus previous element</span>
            <kbd className="rounded bg-[#eaf2f7] px-2 py-1 font-bold text-[#102a43]">Shift + Tab</kbd>
          </div>
          <div className="flex items-center justify-between rounded bg-[#f8fafc] p-3 border border-[#edf2f5]">
            <span className="text-[#607387]">Dismiss dialogs & overlays</span>
            <kbd className="rounded bg-[#eaf2f7] px-2 py-1 font-bold text-[#102a43]">Escape</kbd>
          </div>
          <div className="flex items-center justify-between rounded bg-[#f8fafc] p-3 border border-[#edf2f5]">
            <span className="text-[#607387]">Activate button / link</span>
            <kbd className="rounded bg-[#eaf2f7] px-2 py-1 font-bold text-[#102a43]">Enter / Space</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
