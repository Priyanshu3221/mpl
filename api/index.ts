import { app } from "../mplads-investigator/server/app.js";

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "internal_server_error",
      message: message || "Serverless handler exception",
    });
  }
}
