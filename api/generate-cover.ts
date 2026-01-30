import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      title = 'Untitled Ebook',
      topic = 'General',
      author = 'NexoraOS by Yesh Malik',
    } = req.body as {
      title?: string;
      topic?: string;
      author?: string;
    };

    const t = topic.toLowerCase();

    let bg = 'linear-gradient(135deg, #0f172a, #020617)';
    let accent = '#38bdf8';
    let icon = '📘';

    if (t.includes('money') || t.includes('business') || t.includes('wealth') || t.includes('finance')) {
      bg = 'linear-gradient(135deg, #064e3b, #022c22)';
      accent = '#facc15';
      icon = '💰';
    } else if (t.includes('ai') || t.includes('tech') || t.includes('code')) {
      bg = 'linear-gradient(135deg, #020617, #0f172a)';
      accent = '#22d3ee';
      icon = '🤖';
    } else if (t.includes('fitness') || t.includes('health')) {
      bg = 'linear-gradient(135deg, #052e16, #022c22)';
      accent = '#4ade80';
      icon = '💪';
    } else if (t.includes('love') || t.includes('relationship')) {
      bg = 'linear-gradient(135deg, #4c0519, #1f0008)';
      accent = '#fb7185';
      icon = '❤️';
    } else if (t.includes('study') || t.includes('education')) {
      bg = 'linear-gradient(135deg, #1e3a8a, #020617)';
      accent = '#60a5fa';
      icon = '🎓';
    } else if (t.includes('motivation') || t.includes('mindset')) {
      bg = 'linear-gradient(135deg, #020617, #020617)';
      accent = '#f97316';
      icon = '🔥';
    }

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <style>
      .title { font: 700 52px 'Segoe UI', Arial, sans-serif; fill: white; }
      .subtitle { font: 400 26px 'Segoe UI', Arial, sans-serif; fill: #cbd5f5; }
      .author { font: 400 20px 'Segoe UI', Arial, sans-serif; fill: #94a3b8; }
    </style>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg.split(',')[0].replace('linear-gradient(135deg, ', '')}"/>
      <stop offset="100%" stop-color="${bg.split(',')[1].replace(')', '')}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="900" fill="url(#bg)"/>

  <!-- Glow circle -->
  <circle cx="300" cy="360" r="200" fill="${accent}" opacity="0.08"/>

  <!-- Icon -->
  <text x="300" y="330" text-anchor="middle" font-size="120">${icon}</text>

  <!-- Title -->
  <foreignObject x="60" y="430" width="480" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml"
      style="color:white;font-size:48px;font-weight:700;font-family:Segoe UI,Arial,sans-serif;text-align:center;line-height:1.15;">
      ${title}
    </div>
  </foreignObject>

  <!-- Subtitle -->
  <text x="300" y="690" text-anchor="middle" class="subtitle">${topic}</text>

  <!-- Author -->
  <text x="300" y="840" text-anchor="middle" class="author">${author}</text>
</svg>
`;

    const base64 = Buffer.from(svg).toString('base64');

    res.status(200).json({
      imageUrl: `data:image/svg+xml;base64,${base64}`,
    });
  } catch (error) {
    console.error('Cover generation error:', error);
    res.status(500).json({ error: 'Failed to generate cover' });
  }
      }
