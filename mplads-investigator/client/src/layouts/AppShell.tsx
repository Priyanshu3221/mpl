import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/clerk-react";
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
import { useCurrentRole, UserIdentity, switchWorkspaceRole } from "@/contexts/AuthContext";
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
  const [location, setLocation] = useLocation();
  const role = useCurrentRole();
  const { roleLabel } = UserIdentity();
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

          {/* Prototype Workspace Switcher & Language Controls */}
          <div className="px-4 py-3 mx-3 my-3 rounded-md bg-[#071a2c]/70 border border-white/10 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-[#f0b323] tracking-wider">
                  Switch Workspace
                </p>
                <button
                  onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
                  className="flex items-center gap-1 rounded bg-[#277da1]/30 border border-[#277da1]/50 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#277da1]/50 transition-colors"
                  title="Toggle Language (English / हिंदी)"
                >
                  <Globe size={12} /> {language === "EN" ? "HI" : "EN"}
                </button>
              </div>

              <select
                value={role || ROLES.DISTRICT_AUTHORITY}
                onChange={(e) => switchWorkspaceRole(e.target.value as Role, location, setLocation)}
                className="w-full bg-[#071a2c] text-[#e2ecf5] border border-white/20 rounded px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#f0b323] cursor-pointer"
                title="Select prototype demo workspace role"
              >
                <option value={ROLES.CITIZEN}>Citizen (Public Portal)</option>
                <option value={ROLES.DISTRICT_AUTHORITY}>District Authority</option>
                <option value={ROLES.ADMIN}>System Administrator</option>
              </select>
              <p className="text-[10px] text-[#8ea5b8]">
                Current: <span className="font-semibold text-white">{role ? ROLE_LABELS[role] : roleLabel}</span>
              </p>
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

          <div className="flex items-center gap-3 overflow-hidden border-t border-white/10 pt-3">
            <UserButton showName={false} />
            <div className="truncate text-xs">
              <p className="font-semibold text-white truncate">User Workspace</p>
              <p className="text-[10px] text-[#8ea5b8] truncate">Connected via Clerk</p>
            </div>
          </div>
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
            <div className="flex items-center gap-2 border-l border-[#dce5ee] pl-4">
              <UserButton showName={false} />
              <span className="text-xs font-semibold text-[#102a43]">Workspace Account</span>
            </div>
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
