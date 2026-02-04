import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, subtitle, topic } = req.body;

    const prompt = `
Describe a professional Amazon bestseller ebook cover for:
Title: ${title}
Subtitle: ${subtitle}
Topic: ${topic}

Include:
- Mood
- Color palette
- Imagery
- Typography
- Layout
`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 250,
        temperature: 0.7
      })
    });

    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const coverPrompt = j.choices[0].message.content.trim();

    res.status(200).json({ prompt: coverPrompt });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Cover generation failed" });
  }
  }
