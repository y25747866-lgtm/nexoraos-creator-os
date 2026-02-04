import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, subtitle, topic } = req.body;

    const prompt = `
Generate a separate professional cover design prompt for book title "\( {title}" with subtitle " \){subtitle}" and author/brand "NexoraOS".
Include:
Emotional tone
Mood
Color palette
Visual symbolism
Typography style
Cover composition
The cover must feel Amazon bestseller-level.
Output only the prompt text.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const coverPrompt = data.choices[0].message.content.trim();

    res.status(200).json({ prompt: coverPrompt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
