import { createPublicKey, createVerify, timingSafeEqual } from "crypto";
import {
  can,
  normalizeRole,
  permissionsFor,
  DEFAULT_ROLE,
  ROLES,
  type Permission,
  type Role,
} from "../shared/roles";
import { clerkAdminConfigured, getClerkUserById } from "./clerkUsers";

/**
 * Server-side authentication + authorization.
 *
 * The role is derived from the signed Clerk session token ONLY. Nothing in the
 * request body, query string, headers or cookies (other than the signed token)
 * can influence it, so a client that lies about its role gets a 403.
 *
 * Verification is done with Node's built-in crypto against Clerk's JWKS, which
 * avoids adding a dependency to the project.
 *
 * Required environment:
 *   CLERK_ISSUER   e.g. https://your-app.clerk.accounts.dev
 * Optional:
 *   CLERK_JWKS_URL          defaults to `${CLERK_ISSUER}/.well-known/jwks.json`
 *   CLERK_AUTHORIZED_PARTY  expected `azp` claim (your site origin)
 *   ALLOW_INSECURE_DEV_AUTH set to "true" ONLY for local development
 *   BOOTSTRAP_ADMIN_EMAIL   local-dev-only Admin bootstrap, see below
 *
 * Clerk should be configured to put the role into the session token. In the
 * Clerk dashboard (Sessions -> Customize session token) add:
 *   { "role": "{{user.public_metadata.role}}", "email": "{{user.primary_email_address}}" }
 * This is the fast path (no extra network call). If it hasn't been done yet,
 * `resolveRoleAndEmail` below falls back to asking Clerk's Backend API for
 * that one user's role/email directly, as long as CLERK_SECRET_KEY is set —
 * so role assignment and Admin bootstrap still work correctly either way.
 *
 * -------------------------------------------------------------------------
 * Development bootstrap admin
 * -------------------------------------------------------------------------
 * A brand-new project has no Admin yet, and User Management can only assign
 * roles to users who already have `MANAGE_USERS` — a chicken-and-egg problem
 * for local development. `BOOTSTRAP_ADMIN_EMAIL` breaks that deadlock for ONE
 * named local developer account, and only outside production:
 *
 *   - It is read from `process.env`, so it is never bundled into client code
 *     (Vite only exposes `VITE_`-prefixed vars to the browser).
 *   - It is ignored whenever `NODE_ENV === "production"`, full stop — this
 *     also covers Vercel preview and production deployments, which both set
 *     NODE_ENV=production by default.
 *   - It only ever elevates the exact email address configured, never a
 *     class of users, and it is compared against the email of an
 *     ALREADY-VERIFIED TOKEN's subject — either the token's own `email`
 *     claim, or (fallback) Clerk's own record for that verified `sub`.
 *     Nothing the client sends unsigned can trigger it.
 *   - Once bootstrapped, use that Admin account's own User Management screen
 *     to assign real roles to everyone else; there is no need to keep relying
 *     on the bootstrap path afterwards.
 */

export type SessionPrincipal = {
  userId: string;
  email: string | null;
  role: Role | null;
  permissions: Permission[];
  /** True when this session's Admin role came from the dev bootstrap, not an assignment. */
  bootstrap: boolean;
};

const ISSUER = process.env.CLERK_ISSUER?.replace(/\/$/, "");
const JWKS_URL = process.env.CLERK_JWKS_URL || (ISSUER ? `${ISSUER}/.well-known/jwks.json` : undefined);
const AUTHORIZED_PARTY = process.env.CLERK_AUTHORIZED_PARTY;
const ALLOW_INSECURE_DEV_AUTH = process.env.ALLOW_INSECURE_DEV_AUTH === "true";
const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || undefined;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const CLOCK_SKEW_SECONDS = 30;

export function authzConfigured() {
  return Boolean(JWKS_URL);
}

/** True only when a bootstrap email is set AND we are not in production. */
export function bootstrapAdminConfigured() {
  return Boolean(BOOTSTRAP_ADMIN_EMAIL) && !IS_PRODUCTION;
}

if (BOOTSTRAP_ADMIN_EMAIL && IS_PRODUCTION) {
  // Loud and unmissable: the var is set but will be ignored. This should
  // never be silent, since a misconfigured prod env is exactly the case the
  // production gate exists to protect against.
  console.warn(
    "[authz] BOOTSTRAP_ADMIN_EMAIL is set but NODE_ENV=production — the development Admin bootstrap is DISABLED, as intended. Remove this variable from production configuration."
  );
} else if (BOOTSTRAP_ADMIN_EMAIL) {
  console.warn(
    `[authz] Development Admin bootstrap is ACTIVE for ${BOOTSTRAP_ADMIN_EMAIL}. This account will always resolve to Admin. Do not set BOOTSTRAP_ADMIN_EMAIL in production.`
  );
}

/**
 * Applies the local-dev bootstrap, if configured and applicable, to an
 * already-resolved role. Called only after the token's signature (or, in the
 * insecure-dev branch, at least its structure) and claims have been read —
 * this never substitutes for authentication, only adjusts the role of an
 * already-identified session.
 */
function applyBootstrapAdmin(role: Role, email: string | null): { role: Role; bootstrap: boolean } {
  if (!bootstrapAdminConfigured() || !email) return { role, bootstrap: false };
  if (email.trim().toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL) return { role, bootstrap: false };
  return { role: ROLES.ADMIN, bootstrap: true };
}

/* ------------------------------------------------------------------ JWKS -- */

type Jwk = { kid?: string; kty?: string; alg?: string; use?: string; n?: string; e?: string };
let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function getSigningKey(kid: string): Promise<Jwk | null> {
  const fresh = jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS;
  if (fresh) {
    const hit = jwksCache!.keys.find((key) => key.kid === kid);
    if (hit) return hit;
  }
  if (!JWKS_URL) return null;

  const response = await fetch(JWKS_URL);
  if (!response.ok) throw new Error(`Unable to fetch JWKS (${response.status})`);
  const body = (await response.json()) as { keys?: Jwk[] };
  jwksCache = { keys: body.keys ?? [], fetchedAt: Date.now() };
  return jwksCache.keys.find((key) => key.kid === kid) ?? null;
}

/* -------------------------------------------------------------- JWT util -- */

function base64UrlDecode(segment: string): Buffer {
  return Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function parseJson<T>(buffer: Buffer): T | null {
  try {
    return JSON.parse(buffer.toString("utf8")) as T;
  } catch {
    return null;
  }
}

type JwtHeader = { alg?: string; kid?: string; typ?: string };
type JwtClaims = {
  sub?: string;
  iss?: string;
  azp?: string;
  exp?: number;
  nbf?: number;
  role?: unknown;
  email?: unknown;
  public_metadata?: { role?: unknown };
  publicMetadata?: { role?: unknown };
  metadata?: { role?: unknown };
};

/** Verifies signature, algorithm, issuer and validity window. */
export async function verifySessionToken(token: string): Promise<JwtClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");

  const header = parseJson<JwtHeader>(base64UrlDecode(parts[0]));
  const claims = parseJson<JwtClaims>(base64UrlDecode(parts[1]));
  if (!header || !claims) throw new Error("Malformed token");

  // Pin the algorithm: never let the token choose "none" or a symmetric alg.
  if (header.alg !== "RS256") throw new Error("Unsupported token algorithm");
  if (!header.kid) throw new Error("Token has no key id");

  const jwk = await getSigningKey(header.kid);
  if (!jwk) throw new Error("Unknown signing key");

  const publicKey = createPublicKey({ key: jwk as never, format: "jwk" });
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  if (!verifier.verify(publicKey, base64UrlDecode(parts[2]))) {
    throw new Error("Invalid token signature");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === "number" && claims.exp + CLOCK_SKEW_SECONDS < now) throw new Error("Token expired");
  if (typeof claims.nbf === "number" && claims.nbf - CLOCK_SKEW_SECONDS > now) throw new Error("Token not yet valid");

  if (ISSUER) {
    const issuer = claims.iss?.replace(/\/$/, "") ?? "";
    const a = Buffer.from(issuer);
    const b = Buffer.from(ISSUER);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Unexpected token issuer");
  }
  if (AUTHORIZED_PARTY && claims.azp && claims.azp !== AUTHORIZED_PARTY) {
    throw new Error("Unexpected authorized party");
  }
  if (!claims.sub) throw new Error("Token has no subject");

  return claims;
}

/* --------------------------------------------------------- request utils -- */

type MinimalRequest = {
  headers: Record<string, unknown>;
  body?: unknown;
  method?: string;
  cookies?: Record<string, string>;
};

function headerValue(req: MinimalRequest, name: string): string | undefined {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return typeof raw === "string" ? raw : undefined;
}

function readToken(req: MinimalRequest): string | null {
  const authorization = headerValue(req, "authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();

  // Clerk also sets a __session cookie for same-origin requests.
  const fromCookieJar = req.cookies?.__session;
  if (fromCookieJar) return fromCookieJar;

  const cookieHeader = headerValue(req, "cookie");
  const match = cookieHeader?.match(/(?:^|;\s*)__session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Extracts the role claim, tolerating the different shapes Clerk can emit. */
function roleFromClaims(claims: JwtClaims): Role | null {
  return (
    normalizeRole(claims.role) ??
    normalizeRole(claims.public_metadata?.role) ??
    normalizeRole(claims.publicMetadata?.role) ??
    normalizeRole(claims.metadata?.role)
  );
}

/**
 * Resolves the role + email for a verified/decoded token.
 *
 * The Clerk session token is the fast path and needs no extra network call —
 * but it only carries `role`/`email` if the Clerk dashboard's "Customize
 * session token" step has been done (see the module doc comment above). That
 * is an easy step to miss, and missing it used to mean role assignment and
 * the Admin bootstrap silently never worked, even though every other part of
 * the flow was wired correctly.
 *
 * So whenever the token itself doesn't carry one of these two claims, and
 * `CLERK_SECRET_KEY` is configured (it already has to be, for role writes to
 * persist), fall back to asking Clerk directly for that one user's current
 * `public_metadata.role` / primary email. This never widens what a *client*
 * can claim about itself — `claims.sub` still comes from a cryptographically
 * verified (or, in the insecure-dev branch, at least structurally parsed)
 * token, and the extra lookup only fills in gaps the token left blank.
 */
async function resolveRoleAndEmail(claims: JwtClaims): Promise<{ role: Role | null; email: string | null }> {
  const claimRole = roleFromClaims(claims);
  const claimEmail = typeof claims.email === "string" ? claims.email : null;
  if ((claimRole && claimEmail) || !claims.sub || !clerkAdminConfigured()) {
    return { role: claimRole, email: claimEmail };
  }
  const fromClerk = await getClerkUserById(claims.sub).catch(() => null);
  return {
    role: claimRole ?? fromClerk?.role ?? null,
    email: claimEmail ?? fromClerk?.email ?? null,
  };
}

/**
 * Resolves the principal for a request, or null when unauthenticated.
 * Throws only on misconfiguration.
 */
export async function getPrincipal(req: MinimalRequest): Promise<SessionPrincipal | null> {
  const token = readToken(req);
  if (!token) return null;

  if (!authzConfigured()) {
    // Fail closed unless a developer has explicitly opted into insecure mode.
    if (!ALLOW_INSECURE_DEV_AUTH) throw new Error("CLERK_ISSUER is not configured");
    const claims = parseJson<JwtClaims>(base64UrlDecode(token.split(".")[1] ?? ""));
    if (!claims?.sub) return null;
    // A verified session with no explicit role claim is a new/unassigned
    // user, not an unauthenticated one: they get the Citizen floor, never
    // nothing. Anything higher can only come from an Admin's role assignment
    // (see setUserRoleInClerk), which writes the actual claim this reads —
    // or, in local development only, from BOOTSTRAP_ADMIN_EMAIL below.
    const resolved = await resolveRoleAndEmail(claims);
    const baseRole = resolved.role ?? DEFAULT_ROLE;
    const { role, bootstrap } = applyBootstrapAdmin(baseRole, resolved.email);
    return {
      userId: claims.sub,
      email: resolved.email,
      role,
      permissions: permissionsFor(role),
      bootstrap,
    };
  }

  const claims = await verifySessionToken(token);
  // Signature, issuer and expiry are already verified above. A genuinely
  // signed token with no role claim means "not yet assigned" -> Citizen,
  // the same floor every new sign-up gets, never a higher role — unless the
  // BOOTSTRAP_ADMIN_EMAIL dev override applies (see its doc comment above).
  const resolved = await resolveRoleAndEmail(claims);
  const baseRole = resolved.role ?? DEFAULT_ROLE;
  const { role, bootstrap } = applyBootstrapAdmin(baseRole, resolved.email);
  return {
    userId: claims.sub as string,
    email: resolved.email,
    role,
    permissions: permissionsFor(role),
    bootstrap,
  };
}

/* ------------------------------------------------------ express middleware - */

type MinimalResponse = {
  status: (code: number) => MinimalResponse;
  json: (body: unknown) => unknown;
};

export type AuthedRequest = MinimalRequest & { principal?: SessionPrincipal };

/** Rejects unauthenticated requests. */
export async function requireAuth(
  req: AuthedRequest,
  res: MinimalResponse,
  next: (error?: unknown) => void
) {
  try {
    const principal = await getPrincipal(req);
    if (!principal) {
      res.status(401).json({ error: "unauthenticated", message: "A valid session is required." });
      return;
    }
    req.principal = principal;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    if (message.includes("not configured")) {
      res.status(503).json({ error: "authz_unconfigured", message: "Authorization is not configured on this server." });
      return;
    }
    res.status(401).json({ error: "invalid_session", message: "Session could not be verified." });
  }
}

/**
 * Rejects requests whose *session role* lacks the permission.
 * Use after requireAuth.
 */
export function requirePermission(permission: Permission) {
  return (req: AuthedRequest, res: MinimalResponse, next: (error?: unknown) => void) => {
    const principal = req.principal;
    if (!principal) {
      res.status(401).json({ error: "unauthenticated", message: "A valid session is required." });
      return;
    }
    if (!principal.role) {
      res.status(403).json({
        error: "role_unassigned",
        message: "No role has been assigned to your account. Contact an administrator.",
      });
      return;
    }
    if (!can(principal.role, permission)) {
      res.status(403).json({
        error: "forbidden",
        message: `Role '${principal.role}' is not permitted to perform this action.`,
        required: permission,
      });
      return;
    }
    next();
  };
}
