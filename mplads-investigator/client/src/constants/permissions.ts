export const ROLES = {
  CITIZEN: "Citizen",
  DISTRICT_AUTHORITY: "District Authority",
  ADMIN: "Admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_PROJECTS: "VIEW_PROJECTS",
  CREATE_PROJECT: "CREATE_PROJECT",
  EDIT_PROJECT: "EDIT_PROJECT",
  SUBMIT_PROJECT: "SUBMIT_PROJECT",
  REVIEW_PROJECT: "REVIEW_PROJECT",
  APPROVE_PROJECT: "APPROVE_PROJECT",
  REJECT_PROJECT: "REJECT_PROJECT",
  VIEW_REPORTS: "VIEW_REPORTS",
  EXPORT_REPORTS: "EXPORT_REPORTS",
  VIEW_FLAGS: "VIEW_FLAGS",
  REVIEW_FLAGS: "REVIEW_FLAGS",
  MANAGE_USERS: "MANAGE_USERS",
  VIEW_AUDIT: "VIEW_AUDIT",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.CITIZEN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  [ROLES.DISTRICT_AUTHORITY]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.SUBMIT_PROJECT,
    PERMISSIONS.REVIEW_PROJECT,
    PERMISSIONS.APPROVE_PROJECT,
    PERMISSIONS.REJECT_PROJECT,
    PERMISSIONS.VIEW_FLAGS,
    PERMISSIONS.REVIEW_FLAGS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_AUDIT,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

export const ROLE_LANDING: Record<Role, string> = {
  [ROLES.CITIZEN]: "/dashboard",
  [ROLES.DISTRICT_AUTHORITY]: "/dashboard",
  [ROLES.ADMIN]: "/dashboard",
};

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.CITIZEN]: "Citizen Portal",
  [ROLES.DISTRICT_AUTHORITY]: "District Authority",
  [ROLES.ADMIN]: "System Administrator",
};

export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "citizen" || trimmed === "public") return ROLES.CITIZEN;
  if (trimmed === "admin" || trimmed === "system administrator" || trimmed === "administrator") return ROLES.ADMIN;
  if (trimmed.includes("district") || trimmed.includes("authority") || trimmed === "mp" || trimmed.includes("agency")) return ROLES.DISTRICT_AUTHORITY;
  return Object.values(ROLES).find((role) => role.toLowerCase() === trimmed) ?? null;
}

export function can(role: Role | null, permission: Permission) {
  return Boolean(role && ROLE_PERMISSIONS[role].includes(permission));
}

export function landingFor(role: Role | null) {
  return role ? ROLE_LANDING[role] : "/dashboard";
}

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

export const ROUTE_PERMISSIONS: Record<string, Permission | undefined> = {
  "/dashboard": PERMISSIONS.VIEW_DASHBOARD,
  "/projects": PERMISSIONS.VIEW_PROJECTS,
  "/projects/new": PERMISSIONS.CREATE_PROJECT,
  "/flags": PERMISSIONS.VIEW_FLAGS,
  "/flags/collusion": PERMISSIONS.REVIEW_FLAGS,
  "/reports": PERMISSIONS.VIEW_REPORTS,
  "/users": PERMISSIONS.MANAGE_USERS,
  "/audit": PERMISSIONS.VIEW_AUDIT,
};

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

export function routeMatches(route: string, pathname: string) {
  if (route.includes(":id")) return new RegExp(`^${route.replace("/:id", "/[^/]+")}(?:/.*)?$`).test(pathname);
  return route === pathname;
}

export function permissionForPath(pathname: string) {
  return Object.entries(ROUTE_PERMISSIONS).find(([route]) => routeMatches(route, pathname))?.[1];
}

export function roleFromMetadata(metadata: Record<string, unknown> | undefined) {
  return normalizeRole(metadata?.role);
}

export const isAdmin = (role: Role | null) => role === ROLES.ADMIN;
export const isAdminOrDistrictAuthority = (role: Role | null) => role === ROLES.ADMIN || role === ROLES.DISTRICT_AUTHORITY;
export const navGroups = [{ label: "Workspace", items: NAV_ITEMS.slice(0, 5) }, { label: "Administration", items: NAV_ITEMS.slice(5) }];
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b323] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f8fb]";
export const roleLandingCopy: Record<Role, string> = {
  [ROLES.CITIZEN]: "Public fund utilization, project tracking & transparency portal",
  [ROLES.DISTRICT_AUTHORITY]: "Review district projects, approvals, financial tracking & risk signals",
  [ROLES.ADMIN]: "System oversight, RBAC governance, user administration & platform control",
};

export const routeStubCopy = "This route is connected to the protected application shell and reserved for the next implementation phase.";
export const ACCESS_DENIED_REASON = "Your Clerk role does not include permission to view this module.";
export const roleMetadataHint = "Set publicMetadata.role in Clerk to MP, District Authority, Implementing Agency, or Admin.";
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
