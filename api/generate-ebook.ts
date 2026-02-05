import type { NextApiRequest, NextApiResponse } from "next";
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  try {
    const body = await req.json();
    const topic = body.topic || body.title;
    if (!topic) {
      return new Response(JSON.stringify({ error: "topic required" }), { status: 400 });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
    const headers = {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    };

    async function call(prompt: string, maxTokens = 700) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "mistralai/mixtral-8x7b-instruct",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });
      const json = await res.json();
      return json.choices[0].message.content.trim();
    }

    let book = "";

    const titleRaw = await call(`Generate a premium book title + subtitle for "${topic}". Output JSON.`);
    const { title, subtitle } = JSON.parse(titleRaw);

    book += `${title}\n\n${subtitle}\n\nBy NexoraOS\n\n---\n\n`;

    book += `LETTER FROM THE AUTHOR\n\n`;
    book += await call(`Write a powerful author letter for "${title}" about "${topic}".`, 600);
    book += "\n\n---\n\n";

    const toc = await call(`Generate 4 chapter titles for "${title}" about "${topic}". One per line.`, 200);
    book += `TABLE OF CONTENTS\n\n${toc}\n\n---\n\n`;

    for (let i = 1; i <= 4; i++) {
      book += `CHAPTER ${i}\n\n`;
      book += await call(`Write Chapter ${i} for "${title}" about "${topic}".`, 700);
      book += "\n\n---\n\n";
    }

    book += `SUMMARY\n\n`;
    book += await call(`Write a strong closing summary for "${title}" about "${topic}".`, 400);

    return new Response(
      JSON.stringify({
        title,
        subtitle,
        content: book,
        pages: Math.ceil(book.split(/\s+/).length / 450),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Ebook generation failed", detail: err?.message }),
      { status: 500 }
    );
  }
}
