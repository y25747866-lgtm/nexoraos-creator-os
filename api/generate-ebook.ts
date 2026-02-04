import type { NextApiRequest, NextApiResponse } from "next";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

async function callAI(prompt: string) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistralai/mixtral-8x7b-instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3500,
      temperature: 0.7
    })
  });

  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return j.choices[0].message.content.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, subtitle, topic, length } = req.body;

    const chapters = length === "long" ? 8 : length === "short" ? 3 : 5;

    let book = "";

    // COVER PAGE
    book += `${title}\n\n${subtitle}\n\nNexoraOS\n\n`;

    // COPYRIGHT
    book += `Copyright © ${new Date().getFullYear()} NexoraOS\nAll rights reserved.\n\n`;

    // INTRO LETTER
    book += `INTRODUCTION\n\n`;
    book += await callAI(`Write a professional, inspiring introduction for an ebook titled "${title}" about "${topic}".`);

    // TOC
    book += `\n\nTABLE OF CONTENTS\n\n`;
    const toc = await callAI(`Generate ${chapters} professional chapter titles for an ebook about "${topic}". Output one per line.`);
    book += toc + "\n\n";

    // CHAPTERS
    for (let i = 1; i <= chapters; i++) {
      book += `CHAPTER ${i}\n\n`;
      book += await callAI(`Write a full, detailed, professional ebook chapter ${i} about "${topic}". Use clear headings, examples, and actionable advice.`);
      book += "\n\n";
    }

    // CLOSING
    book += `CONCLUSION\n\n`;
    book += await callAI(`Write a strong closing section for an ebook about "${topic}".`);

    const words = book.split(/\s+/).length;
    const pages = Math.ceil(words / 500);

    res.status(200).json({ content: book, pages });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Ebook generation failed" });
  }
                         }
