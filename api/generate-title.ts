import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, tone = 'clear, authoritative, practical' } = req.body;

  if (!topic?.trim()) {
    return res.status(400).json({ error: 'topic is required' });
  }

  try {
    const prompt = `
You are a world-class nonfiction book title strategist.

Topic: ${topic}
Tone: ${tone}

Create ONE high-conversion title + subtitle.
Output ONLY valid JSON:
{"title":"...", "subtitle":"..."}
    `.trim();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct:v0.1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { title: `Mastering ${topic}`, subtitle: 'A Practical Guide to Real Results' };
    }

    return res.status(200).json(json);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to generate title' });
  }
}
