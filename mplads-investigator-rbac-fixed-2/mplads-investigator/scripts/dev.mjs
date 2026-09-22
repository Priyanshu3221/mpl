// Runs the API server (server/index.ts, via tsx) and the Vite dev server
// side by side, and tears both down together on Ctrl+C or either one dying.
//
// Deliberately dependency-free (no `concurrently`) so this works right after
// `npm install` with nothing extra to add. Both children inherit this
// process's env, so anything exported in your shell (or loaded from .env by
// server/env.ts) reaches the API server; VITE_-prefixed vars reach Vite the
// same way `vite --host` already gets them today.
import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmExec = isWindows ? "npx.cmd" : "npx";

function run(name, command, args) {
  // Windows needs shell:true to resolve .cmd files (npx.cmd) at all, but
  // passing shell:true together with an args array is deprecated (DEP0190)
  // because the args aren't escaped, just concatenated. Since our args are
  // fixed literals we control (no user input), join them into one command
  // string ourselves on Windows instead, and skip the shell entirely on
  // POSIX where spawn can run "npx" directly.
  const child = isWindows
    ? spawn([command, ...args].join(" "), { stdio: "inherit", shell: true, env: process.env })
    : spawn(command, args, { stdio: "inherit", env: process.env });
  child.on("exit", (code) => {
    console.log(`[${name}] exited with code ${code}`);
    shutdown(code ?? 0);
  });
  return child;
}

const children = [];
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

children.push(run("api", npmExec, ["tsx", "watch", "server/index.ts"]));
children.push(run("web", npmExec, ["vite", "--host"]));
