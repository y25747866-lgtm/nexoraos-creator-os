import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { title, topic, chapterTitle } = req.body;
    if (!title || !topic || !chapterTitle)
      return res.status(400).json({ error: "title, topic, and chapterTitle required" });

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
            content: `
Write a premium nonfiction ebook chapter titled "${chapterTitle}" for book "${title}" about "${topic}".

Structure:
- Hook
- Problem
- Truth
- Framework
- Example
- Action steps

900–1200 words. Professional, Amazon-bestseller quality. No fluff.
`,
          },
        ],
        max_tokens: 1200,
      }),
    });

    const j = await r.json();
    res.status(200).json({ content: j.choices[0].message.content });
  } catch {
    res.status(500).json({ error: "Section generation failed" });
  }
    }
