import { app } from "../mplads-investigator/server/app.js";

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    try {
      res.on("finish", resolve);
      res.on("close", resolve);
      res.on("error", (err: any) => {
        console.error("Vercel Response Error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "server_error", message: err?.message || String(err) });
        }
        resolve(null);
      });

      app(req, res);
    } catch (err: any) {
      console.error("Vercel Handler Exception:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "server_error", message: err?.message || String(err) });
      }
      resolve(null);
    }
  });
}
