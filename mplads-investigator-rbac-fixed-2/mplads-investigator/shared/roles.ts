/**
 * Single source of truth for roles, permissions and route guards.
 *
 * This module is imported by BOTH the React client (`@/constants/permissions`)
 * and the Express/Vercel backend (`server/authz.ts`). Keeping one table here is
 * what stops the frontend and backend authorization rules from drifting apart.
 *
 * It must stay free of browser- and node-specific APIs.
 */

export const ROLES = {
  MP: "MP",
  DISTRICT_AUTHORITY: "District Authority",
  IMPLEMENTING_AGENCY: "Implementing Agency",
  ADMIN: "Admin",
  CITIZEN: "Citizen",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * The safe floor every authenticated user gets until an Admin assigns
 * something higher. Never the result of anything the client can influence —
 * it is applied only after a session token's signature has been verified
 * (server) or a Clerk claim has genuinely resolved to nothing (client).
 */
export const DEFAULT_ROLE: Role = ROLES.CITIZEN;

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
  [ROLES.MP]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.SUBMIT_PROJECT,
    PERMISSIONS.VIEW_FLAGS,
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
  [ROLES.IMPLEMENTING_AGENCY]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.VIEW_FLAGS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.CITIZEN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_REPORTS,
  ],
};

/** Post-login destination per role. The dashboard itself renders role-aware content. */
export const ROLE_LANDING: Record<Role, string> = {
  [ROLES.MP]: "/dashboard",
  [ROLES.DISTRICT_AUTHORITY]: "/dashboard",
  [ROLES.IMPLEMENTING_AGENCY]: "/dashboard",
  [ROLES.ADMIN]: "/dashboard",
  [ROLES.CITIZEN]: "/dashboard",
};

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.MP]: "Member of Parliament",
  [ROLES.DISTRICT_AUTHORITY]: "District Authority",
  [ROLES.IMPLEMENTING_AGENCY]: "Implementing Agency",
  [ROLES.ADMIN]: "Admin",
  [ROLES.CITIZEN]: "Citizen",
};

/**
 * Maps an arbitrary string coming from identity metadata onto a known role.
 * Returns null for anything unrecognised: callers must treat null as "no
 * access", never as a default role.
 */
export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "admin" || trimmed === "system administrator" || trimmed === "administrator") return ROLES.ADMIN;
  if (trimmed === "mp" || trimmed.includes("member of parliament")) return ROLES.MP;
  if (trimmed.includes("implementing") || trimmed.includes("agency")) return ROLES.IMPLEMENTING_AGENCY;
  if (trimmed.includes("district") || trimmed.includes("authority")) return ROLES.DISTRICT_AUTHORITY;
  if (trimmed.includes("citizen") || trimmed.includes("public")) return ROLES.CITIZEN;
  return Object.values(ROLES).find((role) => role.toLowerCase() === trimmed) ?? null;
}

export function can(role: Role | null, permission: Permission) {
  return Boolean(role && ROLE_PERMISSIONS[role].includes(permission));
}

export function permissionsFor(role: Role | null): Permission[] {
  return role ? ROLE_PERMISSIONS[role] : [];
}

/**
 * `null` should now only occur for a broken/unresolved session (still
 * loading, or identity fetch failed) — a normally signed-in user without an
 * assigned role resolves to DEFAULT_ROLE (Citizen), not null. This remains
 * the fallback for that genuinely-unresolved case.
 */
export function landingFor(role: Role | null) {
  return role ? ROLE_LANDING[role] : "/access-denied";
}

export function isValidPermission(value: unknown): value is Permission {
  return typeof value === "string" && (Object.values(PERMISSIONS) as string[]).includes(value);
}

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

export function routeMatches(route: string, pathname: string) {
  if (route.includes(":id")) return new RegExp(`^${route.replace("/:id", "/[^/]+")}(?:/.*)?$`).test(pathname);
  return route === pathname;
}

export function permissionForPath(pathname: string) {
  return Object.entries(ROUTE_PERMISSIONS).find(([route]) => routeMatches(route, pathname))?.[1];
}

/**
 * True when `role` is allowed to open `pathname`.
 * Paths with no permission requirement (e.g. /profile) are open to any
 * signed-in user that has an assigned role.
 */
export function canAccessPath(role: Role | null, pathname: string) {
  if (!role) return false;
  const required = permissionForPath(pathname);
  return required ? can(role, required) : true;
}

/** Permission required to move a project into a given workflow status. */
export const TRANSITION_PERMISSIONS: Record<string, Permission> = {
  Submitted: PERMISSIONS.SUBMIT_PROJECT,
  "Under Review": PERMISSIONS.REVIEW_PROJECT,
  Approved: PERMISSIONS.APPROVE_PROJECT,
  Rejected: PERMISSIONS.REJECT_PROJECT,
  Returned: PERMISSIONS.REVIEW_PROJECT,
  Sanctioned: PERMISSIONS.APPROVE_PROJECT,
  "In Progress": PERMISSIONS.REVIEW_PROJECT,
  Completed: PERMISSIONS.REVIEW_PROJECT,
  Closed: PERMISSIONS.REVIEW_PROJECT,
};
