export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ status: "ok", path: req.url, message: "Vercel catch-all API function operational" }));
}
