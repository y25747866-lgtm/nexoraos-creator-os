export const runtime = "nodejs";

const BRAND_NAME = process.env.BRAND_NAME || "NexoraOS";
const PRIMARY_COLOR = process.env.COVER_PRIMARY_COLOR || "#0f172a";
const SECONDARY_COLOR = process.env.COVER_SECONDARY_COLOR || "#1e293b";
const ACCENT_COLOR = process.env.COVER_ACCENT_COLOR || "#fbbf24";
const FONT_FAMILY = process.env.COVER_FONT_FAMILY || "Inter, Arial, sans-serif";
const SHOW_SUBTITLE = process.env.COVER_SHOW_SUBTITLE !== "false";

function generateSVG(title: string, subtitle: string | null) {
  return `
<svg width="1200" height="1600" viewBox="0 0 1200 1600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PRIMARY_COLOR}" />
      <stop offset="100%" stop-color="${SECONDARY_COLOR}" />
    </linearGradient>
  </defs>

  <rect width="1200" height="1600" fill="url(#bg)" />

  <line x1="150" y1="300" x2="1050" y2="300" stroke="${ACCENT_COLOR}" stroke-width="4" opacity="0.8"/>
  <line x1="150" y1="1300" x2="1050" y2="1300" stroke="${ACCENT_COLOR}" stroke-width="2" opacity="0.5"/>

  <text x="600" y="620" text-anchor="middle"
        font-size="88"
        font-weight="800"
        font-family="${FONT_FAMILY}"
        fill="#ffffff">
    ${title}
  </text>

  ${
    SHOW_SUBTITLE && subtitle
      ? `<text x="600" y="720" text-anchor="middle"
        font-size="38"
        font-weight="400"
        font-family="${FONT_FAMILY}"
        fill="${ACCENT_COLOR}">
        ${subtitle}
      </text>`
      : ""
  }

  <text x="600" y="1480" text-anchor="middle"
        font-size="26"
        font-weight="500"
        font-family="${FONT_FAMILY}"
        fill="#cbd5f5">
    ${BRAND_NAME}
  </text>
</svg>
`;
}

export async function POST(req: Request) {
  try {
    const { title, subtitle } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: "Missing title" }), { status: 400 });
    }

    const safeSubtitle = subtitle && subtitle.length < 80 ? subtitle : null;
    const svg = generateSVG(title, safeSubtitle);
    const base64 = Buffer.from(svg).toString("base64");

    return Response.json({
      imageUrl: `data:image/svg+xml;base64,${base64}`,
    });
  } catch (err) {
    console.error("generate-cover error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate cover" }), { status: 500 });
  }
  }
