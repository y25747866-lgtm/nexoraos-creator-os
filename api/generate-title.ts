import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const prompt = `
You are a world-class ebook publishing strategist.

Generate a professional, premium ebook title and subtitle for this topic:
"${topic}"

Rules:
- Title must be bold, transformational, and Amazon-style
- Subtitle must explain the benefit clearly
- No emojis
- No quotes
- No explanations

Output format:
Title: ...
Subtitle: ...
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
    const text = data.choices?.[0]?.message?.content || "";

    const titleMatch = text.match(/Title:\s*(.+)/i);
    const subtitleMatch = text.match(/Subtitle:\s*(.+)/i);

    res.json({
      title: titleMatch?.[1]?.trim() || topic,
      subtitle: subtitleMatch?.[1]?.trim() || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Title generation failed" });
  }
      }
