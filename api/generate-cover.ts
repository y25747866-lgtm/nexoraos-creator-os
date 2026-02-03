import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { title, topic } = req.body;
    if (!title || !topic) return res.status(400).json({ error: "Missing title or topic" });

    const prompt = `
You are a professional ebook cover designer.

Design a premium ebook cover for:
Title: "${title}"
Topic: "${topic}"

Style rules:
- Dark background
- Cinematic lighting
- Central glowing object
- Amazon-style typography
- High contrast
- No clutter
- No emojis

If topic involves:
- Money → gold coins, charts, glow
- Tech → futuristic circuits, holograms
- Growth → arrows, stairs, light beams

Output ONLY valid SVG code. No markdown. No explanations.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://localhost",
        "X-Title": process.env.SITE_NAME || "NexoraOS",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });

    const data = await response.json();
    const svg = data.choices?.[0]?.message?.content || "";

    const base64 = Buffer.from(svg).toString("base64");

    res.json({
      imageUrl: `data:image/svg+xml;base64,${base64}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cover generation failed" });
  }
      }
