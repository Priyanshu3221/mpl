export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, targetLanguage } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text string is required" });
  }

  if (!apiKey) {
    return res.json({ translatedText: text, source: "fallback_no_key" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Translate the following user interface text into ${targetLanguage || "Hindi"}. Respond ONLY with the translation text, no preamble, explanation, or quotes.\n\nText: ${text}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      return res.json({ translatedText: text, source: "fallback_api_error" });
    }

    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const translatedText =
      result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    return res.json({ translatedText, source: "gemini" });
  } catch {
    return res.json({ translatedText: text, source: "fallback_exception" });
  }
}
