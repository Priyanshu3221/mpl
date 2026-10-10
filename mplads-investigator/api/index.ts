export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ status: "ok", message: "Vercel API function operational" }));
}
