/**
 * Loads local development environment variables from `.env` / `.env.local`
 * into `process.env`, BEFORE any other server module is evaluated.
 *
 * This must be the FIRST import in `server/index.ts`. ES module imports are
 * evaluated in order, depth-first, so importing this file first guarantees
 * `process.env.CLERK_ISSUER`, `BOOTSTRAP_ADMIN_EMAIL`, `CLERK_SECRET_KEY`,
 * etc. are already populated by the time `./authz` and `./clerkUsers` read
 * them at module-load time (they read `process.env` directly into `const`s
 * at the top of those files, so loading env vars any later would be too late
 * and those values would silently stay `undefined`).
 *
 * Deliberately dependency-free: uses Node's built-in `process.loadEnvFile`
 * (stable since Node 20.6+) rather than adding the `dotenv` package.
 *
 * This file is intentionally NOT imported by anything under `api/` — Vercel
 * injects configured environment variables directly into `process.env` for
 * serverless functions, so there is no `.env` file to load there, and
 * `vercel dev` handles `.env.local` itself.
 */
type NodeProcessWithEnvFile = NodeJS.Process & { loadEnvFile?: (path?: string) => void };
const proc = process as NodeProcessWithEnvFile;

if (typeof proc.loadEnvFile === "function") {
  for (const file of [".env.local", ".env"]) {
    try {
      proc.loadEnvFile(file);
    } catch {
      // File doesn't exist, or vars were already supplied by the shell/CI —
      // both are fine. Never let a missing .env file crash local dev.
    }
  }
} else {
  console.warn(
    "[env] process.loadEnvFile is not available on this Node version (needs Node 20.6+). " +
      "Export CLERK_ISSUER / BOOTSTRAP_ADMIN_EMAIL / CLERK_SECRET_KEY etc. in your shell instead, " +
      "or upgrade Node."
  );
}
