import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserButton, useUser } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Flag,
  FileText,
  Users,
  ShieldCheck,
  Menu,
  X,
  Building2,
  Bell,
  Network,
  Globe,
  Scale,
  Accessibility,
} from "lucide-react";
import { useCurrentRole, UserIdentity, useRoleState, useSwitchWorkspaceRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ConsentModal from "@/components/ConsentModal";
import {
  can,
  focusRing,
  NAV_ITEMS,
  APP_NAME,
  ROLES,
  ROLE_LABELS,
  PERMISSIONS,
  type Permission,
  type Role,
} from "@/constants/permissions";

const iconMap: Record<string, typeof LayoutDashboard> = {
  layout: LayoutDashboard,
  projects: FolderKanban,
  plus: PlusCircle,
  flag: Flag,
  reports: FileText,
  users: Users,
  audit: ShieldCheck,
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const role = useCurrentRole();
  const { canImpersonate, impersonatedRole, isBootstrapAdmin } = useRoleState();
  const switchWorkspaceRole = useSwitchWorkspaceRole();
  const { roleLabel } = UserIdentity();
  const { user } = useUser();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.permission ? can(role, item.permission as Permission) : true
  );

  const canSeeCollusion = can(role, PERMISSIONS.REVIEW_FLAGS);

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith("/dashboard")) return "Dashboard Overview";
    if (pathname.startsWith("/projects/new")) return "New Project Proposal";
    if (pathname.startsWith("/projects/")) return "Project Workspace";
    if (pathname.startsWith("/projects")) return "Project Registry";
    if (pathname.startsWith("/flags/collusion")) return "Collusion & Network Linkages";
    if (pathname.startsWith("/flags")) return "Fraud Risk Signals";
    if (pathname.startsWith("/reports")) return "Investigation Reports";
    if (pathname.startsWith("/notifications")) return "System Notifications";
    if (pathname.startsWith("/profile")) return "My Profile";
    if (pathname.startsWith("/users")) return "User & Role Management";
    if (pathname.startsWith("/audit")) return "System Audit Trail";
    if (pathname.startsWith("/compliance")) return "Compliance Statement";
    if (pathname.startsWith("/accessibility")) return "Accessibility Declaration";
    return "MPLADS Workspace";
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#152536] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between border-b border-[#dce5ee] bg-[#102a43] px-4 py-3 text-white">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-[#f0b323] font-bold text-[#071a2c]">
            M
          </span>
          <span className="text-sm tracking-wide">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
            className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20"
          >
            <Globe size={13} /> {language === "EN" ? "हिंदी" : "EN"}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`rounded-md p-1.5 hover:bg-white/10 ${focusRing}`}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-[#102a43] text-white shrink-0 md:min-h-screen flex flex-col justify-between border-r border-[#1e3e5c]`}
      >
        <div>
          {/* Desktop Branding */}
          <div className="hidden md:flex items-center justify-between px-6 py-5 border-b border-[#1a3a54]">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded bg-[#f0b323] font-extrabold text-[#071a2c]">
                M
              </span>
              <div>
                <p className="text-sm font-bold tracking-wide">{APP_NAME}</p>
                <p className="text-[11px] text-[#b7c7d5]">{t("portalSubtitle")}</p>
              </div>
            </Link>
          </div>

          {/* Assigned Workspace & Language Controls */}
          <div className="px-4 py-3 mx-3 my-3 rounded-md bg-[#071a2c]/70 border border-white/10 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-[#f0b323] tracking-wider">
                  Assigned Workspace
                </p>
                <button
                  onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
                  className="flex items-center gap-1 rounded bg-[#277da1]/30 border border-[#277da1]/50 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#277da1]/50 transition-colors"
                  title="Toggle Language (English / हिंदी)"
                >
                  <Globe size={12} /> {language === "EN" ? "HI" : "EN"}
                </button>
              </div>

              {/*
                Read-only. The role comes from the authenticated session, so it
                is deliberately not selectable here. Admins running a demo build
                get the switcher below instead.
              */}
              <div className="flex items-center gap-2 rounded border border-white/20 bg-[#071a2c] px-2 py-1.5">
                <ShieldCheck size={13} className="shrink-0 text-[#f0b323]" />
                <span className="truncate text-xs font-semibold text-[#e2ecf5]">
                  {role ? ROLE_LABELS[role] : "Role not assigned"}
                </span>
                {isBootstrapAdmin && (
                  <span
                    className="ml-auto shrink-0 rounded bg-[#a34d4d]/30 border border-[#a34d4d]/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#ffb4b4]"
                    title="This Admin role comes from the local-dev BOOTSTRAP_ADMIN_EMAIL override, not an official assignment. It never applies in production."
                  >
                    Dev bootstrap
                  </span>
                )}
              </div>

              {canImpersonate ? (
                <div className="space-y-1 border-t border-white/10 pt-2">
                  <label
                    htmlFor="demo-role-select"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#8ea5b8]"
                  >
                    Admin demo view
                  </label>
                  <select
                    id="demo-role-select"
                    value={impersonatedRole ?? ""}
                    onChange={(e) => switchWorkspaceRole((e.target.value || null) as Role | null)}
                    className="w-full cursor-pointer rounded border border-white/20 bg-[#071a2c] px-2 py-1.5 text-xs font-semibold text-[#e2ecf5] focus:outline-none focus:ring-1 focus:ring-[#f0b323]"
                    title="Preview the workspace as another role (Admin only)"
                  >
                    <option value="">My role ({ROLE_LABELS[ROLES.ADMIN]})</option>
                    <option value={ROLES.MP}>Member of Parliament</option>
                    <option value={ROLES.DISTRICT_AUTHORITY}>District Authority</option>
                    <option value={ROLES.IMPLEMENTING_AGENCY}>Implementing Agency</option>
                    <option value={ROLES.CITIZEN}>Citizen</option>
                  </select>
                  <p className="text-[10px] leading-4 text-[#8ea5b8]">
                    Development build only. Preview only — the server still authorizes every action as {ROLE_LABELS[ROLES.ADMIN]}.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-[#8ea5b8]">{roleLabel} is set by your account.</p>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-2 space-y-1" aria-label="Main Navigation">
            {visibleNavItems.map((item) => {
              const Icon = iconMap[item.icon] || Building2;
              const isActive =
                location === item.href ||
                (item.href !== "/dashboard" && item.href !== "/flags" && location.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[#277da1] text-white"
                      : "text-[#b7c7d5] hover:bg-white/10 hover:text-white"
                  } ${focusRing}`}
                >
                  <Icon size={16} />
                  <span>{t(item.label.toLowerCase().replace(/ /g, "")) || item.label}</span>
                </Link>
              );
            })}

            {/* Additional Modules filtered by RBAC */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              {canSeeCollusion && (
                <Link
                  href="/flags/collusion"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    location === "/flags/collusion"
                      ? "bg-[#277da1] text-white"
                      : "text-[#b7c7d5] hover:bg-white/10 hover:text-white"
                  } ${focusRing}`}
                >
                  <Network size={16} />
                  <span>Collusion Graph</span>
                </Link>
              )}

              <Link
                href="/notifications"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  location === "/notifications"
                    ? "bg-[#277da1] text-white"
                    : "text-[#b7c7d5] hover:bg-white/10 hover:text-white"
                } ${focusRing}`}
              >
                <Bell size={16} />
                <span>Notifications</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer Links & User Profile */}
        <div className="p-4 border-t border-[#1a3a54] space-y-3 bg-[#071a2c]/40">
          <div className="flex items-center justify-around text-[11px] text-[#8ea5b8]">
            <Link href="/compliance" className="hover:text-white flex items-center gap-1">
              <Scale size={12} /> Compliance
            </Link>
            <span>·</span>
            <Link href="/accessibility" className="hover:text-white flex items-center gap-1">
              <Accessibility size={12} /> Accessibility
            </Link>
          </div>

          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 overflow-hidden rounded-md border-t border-white/10 pt-3 hover:bg-white/5 ${focusRing}`}
          >
            <UserButton showName={false} />
            <div className="truncate text-xs">
              <p className="font-semibold text-white truncate">{user?.fullName || user?.primaryEmailAddress?.emailAddress || "Workspace Account"}</p>
              <p className="text-[10px] text-[#8ea5b8] truncate">{role ? ROLE_LABELS[role] : roleLabel}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between border-b border-[#dce5ee] bg-white px-8 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-[#102a43]">{getPageTitle(location)}</h1>
            <span className="text-xs text-[#8aa0b2]">|</span>
            <span className="rounded bg-[#eaf2f7] px-2.5 py-0.5 text-xs font-semibold text-[#277da1]">
              {role ? ROLE_LABELS[role] : roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className={`relative rounded-md p-2 text-[#607387] hover:bg-[#f1f5f8] ${focusRing}`}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#f0b323]" />
            </Link>
            <Link href="/profile" className={`flex items-center gap-2 border-l border-[#dce5ee] pl-4 hover:opacity-80 ${focusRing}`}>
              <UserButton showName={false} />
              <span className="text-xs font-semibold text-[#102a43]">{user?.fullName || "Workspace Account"}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Compliance Consent Modal Banner */}
      <ConsentModal />
    </div>
  );
}
