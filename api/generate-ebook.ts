import type { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" };

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

async function callLLM(prompt: string, maxTokens = 900) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const topic = body.topic || body.title;
    if (!topic) return res.status(400).json({ error: "topic required" });

    let title = body.title;
    let subtitle = body.subtitle;

    // Auto title if missing
    if (!title || !subtitle) {
      const raw = await callLLM(`
Generate a premium nonfiction book title and subtitle for:
"${topic}"
Return JSON only:
{"title":"...","subtitle":"..."}
`, 200);
      const parsed = JSON.parse(raw);
      title = parsed.title;
      subtitle = parsed.subtitle;
    }

    const chapters = body.length === "long" ? 6 : body.length === "short" ? 2 : 4;

    let book = `${title}\n\n${subtitle}\n\nBy NexoraOS\n\n---\n\n`;

    book += `COPYRIGHT\n\nCopyright © ${new Date().getFullYear()} NexoraOS. All rights reserved.\n\n---\n\n`;

    book += `LETTER FROM THE AUTHOR\n\n`;
    book += await callLLM(`
Write a short, powerful opening letter for "${title}" about "${topic}".
Tone: mentor, authority, transformation-focused.
600–800 words.
`, 900);
    book += "\n\n---\n\n";

    book += `WHAT YOU WILL LEARN\n\n`;
    book += await callLLM(`
Create a bullet-point outcome list for "${title}" about "${topic}".
No fluff. Identity-based.
`, 600);
    book += "\n\n---\n\n";

    const toc = await callLLM(`
Generate ${chapters} chapter titles for "${title}" about "${topic}".
One per line.
`, 300);
    book += `TABLE OF CONTENTS\n\n${toc}\n\n---\n\n`;

    for (let i = 1; i <= chapters; i++) {
      book += `CHAPTER ${i}\n\n`;
      book += await callLLM(`
Write Chapter ${i} of "${title}" about "${topic}".

Structure:
- Hook
- Problem
- Truth
- Framework
- Example
- Action steps

900–1100 words.
`, 900);
      book += "\n\n---\n\n";
    }

    book += `SUMMARY\n\n`;
    book += await callLLM(`
Write a strong closing summary for "${title}" about "${topic}".
`, 600);

    const wordCount = book.split(/\s+/).length;
    const pages = Math.ceil(wordCount / 450);

    return res.status(200).json({
      title,
      subtitle,
      content: book,
      pages,
      wordCount,
    });
  } catch (err: any) {
    console.error("EBOOK ERROR:", err);
    return res.status(500).json({ error: "Ebook generation failed", detail: err?.message });
  }
    }
