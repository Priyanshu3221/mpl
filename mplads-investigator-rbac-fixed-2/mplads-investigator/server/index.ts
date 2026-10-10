import "./env.js"; // MUST be the first import — populates process.env before ./authz and ./clerkUsers read it.
import { createServer } from "http";
import { app } from "./app.js";

async function startServer() {
  const server = createServer(app);
  const port = process.env.PORT || 8080;

  server.listen(port, () => {
    console.log(`API server running on http://localhost:${port}/ (Vite dev server proxies /api here)`);
  });
}

startServer().catch(console.error);
