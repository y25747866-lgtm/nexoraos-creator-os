import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title = 'Untitled Ebook', subtitle = '', topic = '' } = req.body;

    // Premium cover: clean blue-to-purple gradient, big centered title, subtitle below, NexoraOS bottom
    let svg = `<svg width="600" height="900" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e40af"/> <!-- deep blue -->
      <stop offset="100%" stop-color="#6b21a8"/> <!-- purple -->
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#grad)"/>

  <!-- Big centered main title -->
  <text x="300" y="380" text-anchor="middle" fill="#ffffff" font-size="52" font-weight="bold" font-family="Arial, Helvetica, sans-serif" letter-spacing="1">
    ${title}
  </text>

  <!-- Subtitle below -->
  <text x="300" y="460" text-anchor="middle" fill="#e0e7ff" font-size="26" font-family="Arial, Helvetica, sans-serif">
    ${subtitle || 'Your Premium Guide'}
  </text>

  <!-- NexoraOS at bottom -->
  <text x="300" y="820" text-anchor="middle" fill="#c4b5fd" font-size="22" font-family="Arial, Helvetica, sans-serif">
    NexoraOS
  </text>
</svg>`;

    // Optional subtle accent for money/wealth topics
    if (topic.toLowerCase().includes('money') || topic.toLowerCase().includes('wealth') || topic.toLowerCase().includes('profit')) {
      svg = svg.replace('</svg>', `
  <!-- Subtle gold $ + glow -->
  <circle cx="300" cy="600" r="70" fill="none" stroke="#fbbf24" stroke-width="5" opacity="0.6"/>
  <text x="300" y="625" text-anchor="middle" fill="#fbbf24" font-size="90" font-weight="bold">$</text>
</svg>`);
    }

    // Convert to base64 data URL (always works, no external link)
    const base64 = btoa(unescape(encodeURIComponent(svg)));

    res.status(200).json({
      imageUrl: `data:image/svg+xml;base64,${base64}`
    });
  } catch (error) {
    console.error('Cover generation error:', error);
    res.status(500).json({ error: 'Failed to generate cover' });
  }
        }
