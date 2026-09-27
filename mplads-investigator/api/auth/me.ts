import { verifyToken, createClerkClient } from "@clerk/backend";

const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const DISTRICT_AUTHORITY_EMAIL = (process.env.DISTRICT_AUTHORITY_EMAIL || "").trim().toLowerCase();

function getRoleForEmailServer(email: string | undefined | null): string {
  if (email && ADMIN_EMAIL) {
    const clean = email.trim().toLowerCase();
    if (clean === ADMIN_EMAIL) return "Admin";
    if (DISTRICT_AUTHORITY_EMAIL && clean === DISTRICT_AUTHORITY_EMAIL) return "District Authority";
  }
  return "Citizen";
}

async function verifyAndGetClerkEmail(req: any): Promise<{ email: string | null; sub: string | null; errorReason?: string }> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return { email: null, sub: null, errorReason: "missing_authorization_header" };
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return { email: null, sub: null, errorReason: "empty_bearer_token" };
  }

  try {
    const verified = await verifyToken(token, {
      secretKey: secretKey || undefined,
      jwtKey: process.env.CLERK_JWT_KEY || undefined,
    });

    if (!verified || !verified.sub) {
      return { email: null, sub: null, errorReason: "invalid_token_payload" };
    }

    const sub = verified.sub;

    if (secretKey) {
      try {
        const clerk = createClerkClient({ secretKey, publishableKey });
        const user = await clerk.users.getUser(sub);
        const primaryEmail =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
          user.emailAddresses[0]?.emailAddress;
        if (primaryEmail) {
          return { email: primaryEmail, sub };
        }
      } catch (sdkErr) {
        const sdkMsg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
        console.warn("[api/auth/me] Clerk SDK getUser warning:", sdkMsg);
      }
    }

    const claims = verified as Record<string, any>;
    const emailFromClaims =
      claims.email ||
      claims.email_address ||
      claims.primary_email ||
      claims.primaryEmail ||
      claims.user_email;

    if (typeof emailFromClaims === "string" && emailFromClaims.includes("@")) {
      return { email: emailFromClaims, sub };
    }

    return { email: null, sub, errorReason: "email_not_found_in_session" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[api/auth/me] verifyToken failed:", msg);
    return { email: null, sub: null, errorReason: `verify_token_failed: ${msg}` };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email: verifiedEmail, sub, errorReason } = await verifyAndGetClerkEmail(req);

  const authHeaderPresent = Boolean(req.headers?.authorization || req.headers?.Authorization);
  const secretKeyPresent = Boolean(secretKey);
  const adminEmailPresent = Boolean(ADMIN_EMAIL);
  const matched = Boolean(verifiedEmail && ADMIN_EMAIL && verifiedEmail.trim().toLowerCase() === ADMIN_EMAIL);
  const role = getRoleForEmailServer(verifiedEmail);

  const secretKeyPrefix = secretKey ? (secretKey.startsWith("sk_live_") ? "sk_live_" : secretKey.startsWith("sk_test_") ? "sk_test_" : "other") : "none";
  const publishableKeyPrefix = publishableKey ? (publishableKey.startsWith("pk_live_") ? "pk_live_" : publishableKey.startsWith("pk_test_") ? "pk_test_" : "other") : "none";
  const keyPairMismatch = (publishableKey?.startsWith("pk_test_") && secretKey?.startsWith("sk_live_")) || (publishableKey?.startsWith("pk_live_") && secretKey?.startsWith("sk_test_"));

  // Non-sensitive server-side diagnostic logging
  console.log(`[api/auth/me] AuthHeader: ${authHeaderPresent} | SecretKeyPrefix: ${secretKeyPrefix} | PubKeyPrefix: ${publishableKeyPrefix} | Mismatch: ${keyPairMismatch} | AdminEmailSet: ${adminEmailPresent} (${ADMIN_EMAIL}) | Sub: ${sub || "none"} | Email: ${verifiedEmail || "none"} | Match: ${matched} => Role: ${role} ${errorReason ? `| Reason: ${errorReason}` : ""}`);

  if (!verifiedEmail) {
    return res.json({
      authenticated: false,
      email: null,
      role: "Citizen",
      diagnostics: {
        authHeaderPresent,
        secretKeyPrefix,
        publishableKeyPrefix,
        keyPairMismatch,
        errorReason: errorReason || null,
      },
    });
  }

  return res.json({
    authenticated: true,
    email: verifiedEmail,
    role,
    diagnostics: {
      authHeaderPresent,
      secretKeyPrefix,
      publishableKeyPrefix,
      keyPairMismatch,
      emailMatched: matched,
    },
  });
}
