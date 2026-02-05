import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { title, topic, chapters = 6 } = req.body;
    if (!title || !topic) return res.status(400).json({ error: "title and topic required" });

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [
          {
            role: "user",
            content: `Generate ${chapters} professional ebook chapter titles for "${title}" about "${topic}". One per line.`,
          },
        ],
        max_tokens: 300,
      }),
    });

    const j = await r.json();
    const chaptersList = j.choices[0].message.content
      .split("\n")
      .map((c: string) => c.replace(/^\d+\.?\s*/, "").trim())
      .filter(Boolean);

    res.status(200).json({ chapters: chaptersList });
  } catch {
    res.status(500).json({ error: "Outline generation failed" });
  }
  }
