import { SignIn, SignUp } from "@clerk/clerk-react";
import { ArrowRight, LockKeyhole, ShieldAlert, Network, FileText, CheckCircle2, ShieldCheck, Eye, Layers } from "lucide-react";
import { Link, useLocation } from "wouter";
import { RedirectSignedIn, useCurrentRole, switchWorkspaceRole } from "@/contexts/AuthContext";
import { AUTH_DISCLAIMER, APP_NAME, APP_TITLE, DATA_SOURCE_NOTE, DEFERRED_MODULES, ROLE_LABELS, roleLandingCopy, landingFor, ROLES, type Role, focusRing } from "@/constants/permissions";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#071a2c] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f0b323] font-extrabold text-[#071a2c]">
            M
          </span>
          <span className="text-sm font-bold tracking-wide">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className={`rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 ${focusRing}`}
          >
            Sign in <ArrowRight className="ml-1.5 inline" size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-10 lg:grid-cols-[1.08fr_.92fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f0b323]/35 bg-[#f0b323]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#f7ce70]">
            Official Oversight & Monitoring Platform
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-6xl">
            Transparent governance. <span className="text-[#f0b323]">Intelligent oversight.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#b7c7d5] sm:text-lg">
            An advanced investigator workspace for monitoring MPLADS fund utilization, identifying procurement collusion, analyzing fraud signals, and ensuring auditable public delivery.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className={`rounded-md bg-[#f0b323] px-6 py-3.5 text-center text-sm font-bold text-[#071a2c] hover:bg-[#f7ce70] transition-colors ${focusRing}`}
            >
              Get started <ArrowRight className="ml-2 inline" size={16} />
            </Link>
            <Link
              href="/sign-in"
              className={`rounded-md border border-white/25 px-6 py-3.5 text-center text-sm font-semibold text-white hover:bg-white/10 transition-colors ${focusRing}`}
            >
              Access secure workspace
            </Link>
          </div>

          <p className="mt-8 text-xs text-[#8ea5b8]">{DATA_SOURCE_NOTE}</p>
        </div>

        {/* Feature Overview Card */}
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#102a43] p-7 shadow-2xl sm:p-10">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#f0b323]/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[#8ea5b8]">System Capabilities</div>
                <div className="mt-1 text-xl font-semibold">MPLADS Intelligence Suite</div>
              </div>
              <ShieldAlert className="text-[#f0b323]" size={28} />
            </div>

            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="border-l-2 border-[#f0b323] pl-4">
                <div className="flex items-center gap-2 text-[#f0b323]">
                  <Network size={18} />
                  <span className="text-sm font-bold">Collusion Graph</span>
                </div>
                <div className="mt-1 text-xs text-[#b7c7d5]">Detect bidding rings & split orders</div>
              </div>

              <div className="border-l-2 border-[#4ea6c8] pl-4">
                <div className="flex items-center gap-2 text-[#4ea6c8]">
                  <ShieldCheck size={18} />
                  <span className="text-sm font-bold">Audit Trail</span>
                </div>
                <div className="mt-1 text-xs text-[#b7c7d5]">Immutable RBAC decision logs</div>
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-[#071a2c]/60 p-4 text-xs leading-6 text-[#c5d3df]">
              <span className="font-bold text-[#f0b323]">Role-Based Access:</span> Customized views tailored for Members of Parliament, District Authorities, Implementing Agencies, and System Administrators.
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="border-t border-white/10 bg-[#0a2238] px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0b323]">Investigator Modules</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Comprehensive Oversight Features</h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-white/10 bg-[#102a43] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#277da1]/20 text-[#277da1]">
                <ShieldAlert size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">Fraud Detection</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Automated rule checking for cost overruns, rapid disbursements, and statutory threshold violations.
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-[#102a43] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#f0b323]/20 text-[#f0b323]">
                <Network size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">Collusion Network</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Linkage analysis identifying shared directors, overlapping bank accounts, and synchronized cover bids.
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-[#102a43] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#45a879]/20 text-[#45a879]">
                <FileText size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">Reports & CSV</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Generate district fund utilization summaries, agency completion rates, and export data in CSV format.
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-[#102a43] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#9b5142]/20 text-[#f58e7b]">
                <Eye size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">System Audit</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Timestamped, actor-attributed logs for every status transition, review remark, and user action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#071a2c] px-5 py-8 text-center text-xs text-[#8ea5b8]">
        <p>Ministry of Statistics & Programme Implementation · MPLADS eSAKSHI Monitoring System</p>
        <p className="mt-2">GIGW 3.0-aligned · WCAG 2.1 AA Compliance Target</p>
      </footer>
    </main>
  );
}

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) { return <main className="min-h-screen bg-[#f6f8fb] px-4 py-10 text-[#152536]"><div className="mx-auto max-w-md"><Link href="/" className="mb-8 flex items-center justify-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#102a43] font-extrabold text-[#f0b323]">M</span><span className="text-sm font-bold tracking-wide">{APP_NAME}</span></Link><RedirectSignedIn/>{mode === "sign-in" ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={{ variables: { colorPrimary: "#102a43", borderRadius: "6px" }, elements: { card: "shadow-sm border border-[#dce5ee] rounded-md", formButtonPrimary: "bg-[#102a43] hover:bg-[#173d5b]" } }} /> : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={{ variables: { colorPrimary: "#102a43", borderRadius: "6px" }, elements: { card: "shadow-sm border border-[#dce5ee] rounded-md", formButtonPrimary: "bg-[#102a43] hover:bg-[#173d5b]" } }} />}<p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-[#71859a]">{AUTH_DISCLAIMER}</p></div></main>; }

export function RouteStub({ title }: { title: string }) { return <section className="max-w-3xl rounded-lg border border-[#dce5ee] bg-white p-7 shadow-sm sm:p-10"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#eaf2f7] text-[#102a43]"><LockKeyhole size={20}/></div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#b27b00]">Foundation complete</p><h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#607387]">This route is connected to the protected application shell and reserved for the next implementation phase.</p><div className="mt-7 rounded-md border border-[#e6edf2] bg-[#f8fafc] p-4 text-xs leading-5 text-[#607387]">{DEFERRED_MODULES}</div><Link href="/dashboard" className={`mt-7 inline-flex items-center rounded-md bg-[#102a43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173d5b] ${focusRing}`}>Return to workspace <ArrowRight className="ml-2" size={15}/></Link></section>; }

export function AccessDeniedPage() {
  const [, setLocation] = useLocation();
  const role = useCurrentRole();
  const isUnassigned = !role;
  const roleName = role ? ROLE_LABELS[role] : "Role Assignment Pending";
  const landingPath = landingFor(role);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-[#dce5ee] bg-white p-8 text-center shadow-md space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fcf4e3] mx-auto text-[#b27b00]">
          <ShieldAlert size={32} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-[#102a43]">
            {isUnassigned ? "Role Assignment Pending" : "Access restricted"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#607387]">
            {isUnassigned
              ? "Your account authentication succeeded, but an official role has not been assigned to your user metadata yet."
              : `You don't have permission to view this module with your current role (${roleName}).`}
          </p>
        </div>

        <div className="rounded-md border border-[#dce5ee] bg-[#f8fafc] p-4 text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#b27b00]">
            Switch Demo Workspace
          </p>
          <p className="text-xs text-[#607387]">
            Select a prototype role below to test access to application features:
          </p>
          <select
            value={role || ROLES.CITIZEN}
            onChange={(e) => {
              const newRole = e.target.value as Role;
              switchWorkspaceRole(newRole, window.location.pathname, setLocation);
            }}
            className="w-full rounded-md border border-[#dce5ee] bg-white px-3 py-2 text-xs font-semibold text-[#102a43] focus:outline-none focus:ring-2 focus:ring-[#f0b323] cursor-pointer"
          >
            <option value={ROLES.CITIZEN}>Citizen (Public Portal)</option>
            <option value={ROLES.DISTRICT_AUTHORITY}>District Authority</option>
            <option value={ROLES.ADMIN}>System Administrator</option>
          </select>
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              if (isUnassigned) {
                switchWorkspaceRole(ROLES.CITIZEN, "/dashboard", setLocation);
              } else {
                setLocation(landingPath);
              }
            }}
            className={`w-full rounded-md bg-[#102a43] px-4 py-3 text-sm font-semibold text-white hover:bg-[#193c59] transition-colors ${focusRing}`}
          >
            {isUnassigned ? "Explore Citizen Portal Workspace" : `Return to ${roleName} Workspace`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() { return <main className="min-h-screen bg-[#f6f8fb] px-5 py-16 text-[#152536]"><div className="mx-auto max-w-lg rounded-lg border border-[#dce5ee] bg-white p-8 text-center shadow-sm"><div className="text-6xl font-semibold text-[#102a43]">404</div><h1 className="mt-4 text-2xl font-semibold">Page not found</h1><p className="mt-3 text-sm leading-6 text-[#607387]">The page you requested does not exist or has moved.</p><Link href="/dashboard" className={`mt-7 inline-flex rounded-md bg-[#102a43] px-4 py-2.5 text-sm font-semibold text-white ${focusRing}`}>Go to dashboard</Link></div></main>; }

export function RoleLandingCard({ role }: { role: Role }) { return <div><p className="text-sm font-semibold text-[#102a43]">{ROLE_LABELS[role]}</p><p className="mt-1 text-sm text-[#607387]">{roleLandingCopy[role]}</p></div>; }

