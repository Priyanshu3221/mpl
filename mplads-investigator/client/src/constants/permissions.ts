/**
 * Client-side view of the RBAC model.
 *
 * The role/permission tables themselves live in `@shared/roles` so that the
 * Express + Vercel backend enforces exactly the same rules. Anything exported
 * from here that is not re-exported is presentation-only (labels, nav, copy).
 */
export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_LANDING,
  ROLE_LABELS,
  ROUTE_PERMISSIONS,
  TRANSITION_PERMISSIONS,
  DEFAULT_ROLE,
  normalizeRole,
  can,
  canAccessPath,
  permissionsFor,
  landingFor,
  isValidPermission,
  routeMatches,
  permissionForPath,
} from "@shared/roles";
export type { Role, Permission } from "@shared/roles";

import {
  ROLES,
  PERMISSIONS,
  ROLE_LANDING,
  normalizeRole,
  type Role,
} from "@shared/roles";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", permission: PERMISSIONS.VIEW_DASHBOARD, icon: "layout" },
  { label: "Projects", href: "/projects", permission: PERMISSIONS.VIEW_PROJECTS, icon: "projects" },
  { label: "New proposal", href: "/projects/new", permission: PERMISSIONS.CREATE_PROJECT, icon: "plus" },
  { label: "Flags", href: "/flags", permission: PERMISSIONS.VIEW_FLAGS, icon: "flag" },
  { label: "Reports", href: "/reports", permission: PERMISSIONS.VIEW_REPORTS, icon: "reports" },
  { label: "Users", href: "/users", permission: PERMISSIONS.MANAGE_USERS, icon: "users" },
  { label: "Audit trail", href: "/audit", permission: PERMISSIONS.VIEW_AUDIT, icon: "audit" },
] as const;

export const ROUTES = [
  "/dashboard", "/projects", "/projects/new", "/projects/:id", "/projects/:id/edit", "/projects/:id/track",
  "/flags", "/flags/collusion", "/reports", "/notifications", "/profile", "/users", "/audit", "/compliance", "/accessibility",
] as const;

export const breadcrumbs: Record<string, string> = {
  "/dashboard": "Dashboard", "/projects": "Projects", "/projects/new": "New proposal", "/flags": "Flags", "/reports": "Reports",
  "/notifications": "Notifications", "/profile": "Profile", "/users": "User management", "/audit": "Audit trail", "/compliance": "Compliance", "/accessibility": "Accessibility",
};

export const AUTH_DISCLAIMER = "Prototype auth via Clerk. Production deployment would migrate to NIC-hosted identity (Aadhaar/DigiLocker) per MeitY guidelines.";
export const APP_NAME = "MPLADS Investigator";
export const APP_TITLE = "MPLADS Investigator & Monitoring System";
export const CLERK_KEY_NAME = "VITE_CLERK_PUBLISHABLE_KEY";
export const DATA_SOURCE_NOTE = "Data source: public MPLADS eSAKSHI records · prototype interface";
export const DEFERRED_MODULES = "Dashboard analytics, detection, projects, reports, notifications, compliance, and user management are reserved for later phases.";

export function roleFromMetadata(metadata: Record<string, unknown> | undefined) {
  return normalizeRole(metadata?.role);
}

export const isAdmin = (role: Role | null) => role === ROLES.ADMIN;
export const isAdminOrDistrictAuthority = (role: Role | null) => role === ROLES.ADMIN || role === ROLES.DISTRICT_AUTHORITY;
export const navGroups = [{ label: "Workspace", items: NAV_ITEMS.slice(0, 5) }, { label: "Administration", items: NAV_ITEMS.slice(5) }];
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b323] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f8fb]";
export const roleLandingCopy: Record<Role, string> = {
  [ROLES.MP]: "Track recommended projects, fund utilization & constituency oversight",
  [ROLES.DISTRICT_AUTHORITY]: "Review district projects, approvals, financial tracking & risk signals",
  [ROLES.IMPLEMENTING_AGENCY]: "Submit progress updates, manage execution & track fund utilization",
  [ROLES.ADMIN]: "System oversight, RBAC governance, user administration & platform control",
  [ROLES.CITIZEN]: "View public MPLADS project status, fund utilization & transparency reports",
};

export const routeStubCopy = "This route is connected to the protected application shell and reserved for the next implementation phase.";
export const ACCESS_DENIED_REASON = "Your Clerk role does not include permission to view this module.";
export const roleMetadataHint = "Set publicMetadata.role in Clerk to MP, District Authority, Implementing Agency, Admin, or Citizen.";
export const securityCopy = "Clerk owns sign-in, sessions, and identity. Backend authorization remains authoritative in production.";
export const footerCopy = "MPLADS · GIGW 3.0-aligned · WCAG 2.1 AA target";
export const futureModules = DEFERRED_MODULES;
export const routeLabels = { "/": "Overview", "/access-denied": "Access denied", "/404": "Not found" };
export const allPermissions = Object.values(PERMISSIONS);
export const allowedRoles = Object.values(ROLES);
export const roleLandingPaths = Object.values(ROLE_LANDING);
export const adminOnlyRoutes = ["/users"];
export const adminAndDistrictAuthorityRoutes = ["/audit"];
export const supportedRoleMetadataKey = "role";
export const versionLabel = "Phase 1 · Auth & application shell";
export const legalAttribution = "Ministry of Statistics & Programme Implementation";
export const supportLabel = "Help & support";
export const searchLabel = "Search";
export const notificationsLabel = "Notifications";
export const noTokenCopy = "Authentication tokens are managed by Clerk and are never rendered in the interface.";
export const configMissingCopy = "Add VITE_CLERK_PUBLISHABLE_KEY to enable Clerk authentication for this environment.";
export const configMissingHint = "Create a Clerk application, copy its publishable key, and restart the dev server.";
export const authLoadingLabel = "Checking authentication";
export const roleLabel = "Current role";
export const notImplementedStatus = "Protected route stub";
export const appVersion = "0.1.0";
export const sourceOfTruth = "MPLADS_MASTER_PROMPT.md";
export const nextPhase = "Dashboard read-only mock data";
export const phaseOneScope = "Authentication, shell, navigation, breadcrumbs, user menu, responsive nav, RBAC, protected routes, role-aware nav, route stubs, access denied, and 404.";
export const doNotBuild = DEFERRED_MODULES;
