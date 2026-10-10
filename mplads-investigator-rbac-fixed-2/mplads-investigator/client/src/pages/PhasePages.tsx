import { SignIn, SignUp, useAuth, UserButton } from "@clerk/clerk-react";
import { ArrowRight, LockKeyhole, ShieldAlert, Network, FileText, CheckCircle2, ShieldCheck, Eye, Layers, Database, Sparkles, ScanSearch, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RedirectSignedIn, useCurrentRole } from "@/contexts/AuthContext";
import { AUTH_DISCLAIMER, APP_NAME, APP_TITLE, DATA_SOURCE_NOTE, DEFERRED_MODULES, ROLE_LABELS, roleLandingCopy, landingFor, type Role, focusRing } from "@/constants/permissions";
import { projects as mockProjects, flags as mockFlags, financialTrend } from "@/services/mock/dashboardMock";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function CountUpStat({ value, label, prefix = "", suffix = "" }: { value: number; label: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.3,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <div>
      <p ref={ref} className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {prefix}{display.toLocaleString("en-IN")}{suffix}
      </p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b7c7d5]">{label}</p>
    </div>
  );
}

const howItWorksSteps = [
  {
    step: "01",
    title: "MPLADS Data",
    icon: Database,
    description: "Ingest project, financial, and beneficiary records from the public MPLADS eSAKSHI data source.",
  },
  {
    step: "02",
    title: "Data Cleaning & Standardisation",
    icon: Sparkles,
    description: "Normalize inconsistent formats, states, agencies, and financial fields into a consistent structured schema.",
  },
  {
    step: "03",
    title: "Rule / Anomaly Detection + Risk Scoring",
    icon: ScanSearch,
    description: "Apply fraud-detection rules and scoring models to flag cost overruns, procurement delays, and collusion signals.",
  },
  {
    step: "04",
    title: "Investigator Dashboard",
    icon: LayoutDashboard,
    description: "Surface prioritized, role-aware insights for MPs, District Authorities, Implementing Agencies, and Admins to act on.",
  },
];

export function LandingPage() {
  const { isSignedIn } = useAuth();
  const totalProjects = mockProjects.length;
  const totalFlags = mockFlags.length;
  const statesCovered = new Set(mockProjects.map((project) => project.state)).size;
  const totalFundsCr = Math.round(financialTrend.reduce((sum, item) => sum + item.allocated, 0));

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
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className={`rounded-md bg-[#f0b323] px-4 py-2 text-sm font-bold text-[#071a2c] hover:bg-[#f7ce70] transition-colors ${focusRing}`}
              >
                Go to Workspace <ArrowRight className="ml-1.5 inline" size={15} />
              </Link>
              <UserButton showName={false} />
            </div>
          ) : (
            <Link
              href="/sign-in"
              className={`rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 ${focusRing}`}
            >
              Sign in <ArrowRight className="ml-1.5 inline" size={15} />
            </Link>
          )}
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

          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            <CountUpStat value={totalProjects} label="Projects monitored" />
            <CountUpStat value={totalFlags} label="Fraud signals flagged" />
            <CountUpStat value={statesCovered} label="States covered" />
            <CountUpStat value={totalFundsCr} prefix="₹" suffix=" Cr" label="Funds tracked" />
          </div>
        </div>

        {/* Feature Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="relative overflow-hidden rounded-lg border border-white/10 bg-[#102a43] p-7 shadow-2xl sm:p-10">
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
              <span className="font-bold text-[#f0b323]">Role-Based Access:</span> Customized views tailored for Members of Parliament, District Authorities, Implementing Agencies, and Admins.
            </div>
          </div>
        </motion.div>
      </section>

      {/* Capabilities Grid */}
      <section className="border-t border-white/10 bg-[#0a2238] px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0b323]">Investigator Modules</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Comprehensive Oversight Features</h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal className="rounded-md border border-white/10 bg-[#102a43] p-6" delay={0}>
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#277da1]/20 text-[#277da1]">
                <ShieldAlert size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">Fraud Detection</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Automated rule checking for cost overruns, rapid disbursements, and statutory threshold violations.
              </p>
            </Reveal>

            <Reveal className="rounded-md border border-white/10 bg-[#102a43] p-6" delay={0.06}>
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#f0b323]/20 text-[#f0b323]">
                <Network size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">Collusion Network</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Linkage analysis identifying shared directors, overlapping bank accounts, and synchronized cover bids.
              </p>
            </Reveal>

            <Reveal className="rounded-md border border-white/10 bg-[#102a43] p-6" delay={0.12}>
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#45a879]/20 text-[#45a879]">
                <FileText size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">Reports & CSV</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Generate district fund utilization summaries, agency completion rates, and export data in CSV format.
              </p>
            </Reveal>

            <Reveal className="rounded-md border border-white/10 bg-[#102a43] p-6" delay={0.18}>
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#9b5142]/20 text-[#f58e7b]">
                <Eye size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold">System Audit</h3>
              <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">
                Timestamped, actor-attributed logs for every status transition, review remark, and user action.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/10 bg-[#071a2c] px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0b323]">Pipeline</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">How It Works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#b7c7d5]">
              From raw public records to prioritized, actionable oversight — in four stages.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((item, index) => (
              <Reveal key={item.step} delay={index * 0.08} className="relative rounded-md border border-white/10 bg-[#0a2238] p-6">
                <span className="text-xs font-bold tracking-[0.2em] text-[#f0b323]">{item.step}</span>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded bg-[#277da1]/20 text-[#277da1]">
                  <item.icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#b7c7d5]">{item.description}</p>
                {index < howItWorksSteps.length - 1 && (
                  <ArrowRight size={16} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-[#3a5670] lg:block" />
                )}
              </Reveal>
            ))}
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

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-10 text-[#152536]">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#102a43] font-extrabold text-[#f0b323]">M</span>
          <span className="text-sm font-bold tracking-wide">{APP_NAME}</span>
        </Link>
        <RedirectSignedIn />
        {mode === "sign-in" ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: { colorPrimary: "#102a43", borderRadius: "6px" },
              elements: { card: "shadow-sm border border-[#dce5ee] rounded-md", formButtonPrimary: "bg-[#102a43] hover:bg-[#173d5b]" }
            }}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: { colorPrimary: "#102a43", borderRadius: "6px" },
              elements: { card: "shadow-sm border border-[#dce5ee] rounded-md", formButtonPrimary: "bg-[#102a43] hover:bg-[#173d5b]" }
            }}
          />
        )}
        <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-[#71859a]">{AUTH_DISCLAIMER}</p>
      </div>
    </main>
  );
}

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
            {isUnassigned ? "Session role could not be resolved" : "Access restricted"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#607387]">
            {isUnassigned
              ? "Your account authentication succeeded, but this device could not confirm your role. New accounts are normally given Citizen access automatically — this usually clears up on retry."
              : `You don't have permission to view this module with your current role (${roleName}).`}
          </p>
        </div>

        {/*
          No role selector here. A user's role is assigned to their account and
          cannot be changed from this screen; offering a picker was the original
          privilege-escalation path.
        */}
        <div className="rounded-md border border-[#dce5ee] bg-[#f8fafc] p-4 text-left space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#b27b00]">
            {isUnassigned ? "What to do" : "Your assigned role"}
          </p>
          <p className="text-xs leading-5 text-[#607387]">
            {isUnassigned
              ? "Try reloading the page. If this keeps happening, an administrator can check your account in User Management."
              : `You are signed in as ${roleName}. Access to other workspaces is granted by an administrator, not selected here.`}
          </p>
        </div>

        {isUnassigned ? (
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className={`w-full rounded-md bg-[#102a43] px-4 py-3 text-sm font-semibold text-white hover:bg-[#193c59] transition-colors ${focusRing}`}
            >
              Reload
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={() => setLocation(landingPath)}
              className={`w-full rounded-md bg-[#102a43] px-4 py-3 text-sm font-semibold text-white hover:bg-[#193c59] transition-colors ${focusRing}`}
            >
              Return to {roleName} Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotFoundPage() { return <main className="min-h-screen bg-[#f6f8fb] px-5 py-16 text-[#152536]"><div className="mx-auto max-w-lg rounded-lg border border-[#dce5ee] bg-white p-8 text-center shadow-sm"><div className="text-6xl font-semibold text-[#102a43]">404</div><h1 className="mt-4 text-2xl font-semibold">Page not found</h1><p className="mt-3 text-sm leading-6 text-[#607387]">The page you requested does not exist or has moved.</p><Link href="/dashboard" className={`mt-7 inline-flex rounded-md bg-[#102a43] px-4 py-2.5 text-sm font-semibold text-white ${focusRing}`}>Go to dashboard</Link></div></main>; }

export function RoleLandingCard({ role }: { role: Role }) { return <div><p className="text-sm font-semibold text-[#102a43]">{ROLE_LABELS[role]}</p><p className="mt-1 text-sm text-[#607387]">{roleLandingCopy[role]}</p></div>; }

