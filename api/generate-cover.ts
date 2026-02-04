import type { NextApiRequest, NextApiResponse } from "next";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, subtitle, topic } = req.body;
    if (!title || !subtitle || !topic) {
      return res.status(400).json({ error: "title, subtitle, and topic are required" });
    }

    const systemPrompt = `
You are NexoraOS Cover Design Engine.
Generate a professional Amazon bestseller-level book cover design prompt.

Include:
- Emotional tone
- Mood
- Color palette
- Visual symbolism
- Typography style
- Layout composition
- Market positioning

Rules:
- Must feel premium, modern, trustworthy, high-conversion
- No emojis
- No markdown
- No explanations
- Output only the cover prompt text
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Title: ${title}\nSubtitle: ${subtitle}\nTopic: ${topic}\nBrand: NexoraOS`,
          },
        ],
        temperature: 0.7,
        max_tokens: 350,
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const coverPrompt = data.choices[0].message.content.trim();

    res.status(200).json({ prompt: coverPrompt });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to generate cover prompt", details: e.message });
  }
                                   }
