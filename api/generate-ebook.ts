import type { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" };

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

async function callAI(prompt: string, max = 3000) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistralai/mixtral-8x7b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
      max_tokens: max,
    }),
  });

  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { topic, length = "medium" } = req.body;
    if (!topic) return res.status(400).json({ error: "topic is required" });

    // 🔥 AUTO TITLE
    const t = await callAI(`
Generate a bestselling ebook title and subtitle for topic "${topic}".
Return ONLY JSON:
{"title":"...","subtitle":"..."}
`, 150);

    const parsed = JSON.parse(t.match(/\{[\s\S]*\}/)?.[0] || "{}");
    const title = parsed.title || `Mastering ${topic}`;
    const subtitle = parsed.subtitle || `The Complete Guide to ${topic}`;

    let chapters = 6;
    let words = "1200-1800";
    if (length === "short") { chapters = 3; words = "600-900"; }
    if (length === "long") { chapters = 10; words = "1800-2500"; }

    let content = `
${title}
${subtitle}

By NexoraOS

---

COPYRIGHT

Copyright © ${new Date().getFullYear()} NexoraOS.
All rights reserved. Educational purposes only.

---

LETTER FROM THE AUTHOR
`;

    content += await callAI(`
Write a powerful personal letter from the author of "${title}" about "${topic}".
Tone: confident, mentor-like, transformational.
Length: ${words}
`);

    content += `

WHAT YOU WILL LEARN
`;
    content += await callAI(`
Create a benefit-driven bullet list of outcomes readers gain from "${title}" about "${topic}".
10–15 bullets. No fluff.
`);

    content += `

HOW TO USE THIS BOOK
`;
    content += await callAI(`
Explain exactly how to read and apply "${title}" for real-world results.
System-based framing. Practical.
`);

    content += `

TABLE OF CONTENTS
`;
    content += await callAI(`
Generate ${chapters} professional, outcome-driven chapter titles for "${title}".
Return numbered list only.
`);

    for (let i = 1; i <= chapters; i++) {
      content += `

CHAPTER ${i}
`;
      content += await callAI(`
Write Chapter ${i} of "${title}" about "${topic}".

Structure:
1. Hook
2. Problem
3. Truth shift
4. Named framework
5. Deep explanation
6. Examples
7. Action steps
8. Identity shift

Length: ${words}
Human, premium, no filler.
`);
    }

    content += `

SUMMARY
`;
    content += await callAI(`
Summarize the key lessons of "${title}" in a powerful way.
`);

    content += `

FINAL MESSAGE
`;
    content += await callAI(`
Write a motivational closing message from the author encouraging real action.
`);

    const wordCount = content.split(/\s+/).length;
    const pages = Math.ceil(wordCount / 500);

    res.status(200).json({
      title,
      subtitle,
      topic,
      pages,
      wordCount,
      content,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ebook generation failed" });
  }
    }
