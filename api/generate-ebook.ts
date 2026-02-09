import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, tone = 'clear, authoritative, practical', length = 'medium' } = req.body;

  if (!topic?.trim()) {
    return res.status(400).json({ error: 'topic is required' });
  }

  try {
    // Generate title
    const titleRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct:v0.1",
        messages: [{ role: "user", content: `Create title and subtitle for topic "\( {topic}" in tone " \){tone}". Output JSON: {"title":"...", "subtitle":"..."}` }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!titleRes.ok) throw new Error(`OpenRouter error: ${await titleRes.text()}`);

    const titleData = await titleRes.json();
    const titleText = titleData.choices[0].message.content.trim();
    let { title, subtitle } = JSON.parse(titleText);

    // Placeholder content (expand with real chapter generation later)
    const content = `# \( {title}\n\n \){subtitle}\n\nGenerated content for "${topic}" in ${tone} tone.\n\n(Full content generation placeholder - add real chapters here)`;

    const pages = Math.ceil(content.split(/\s+/).length / 450);

    return res.status(200).json({
      jobId: Date.now().toString(),
      title,
      subtitle,
      content,
      pages,
      status: 'complete'
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
      }
