import type { VercelRequest, VercelResponse } from "@vercel/node";

const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { topic, title, length = "medium" } = req.body;
    if (!topic || !title) return res.status(400).json({ error: "Missing topic or title" });

    const chapterCount =
      length === "short" ? 7 :
      length === "long" ? 20 :
      12;

    // -------- STEP 1: Generate Outline --------
    const outlinePrompt = `
You are a professional ebook architect.

Create a complete ebook outline for the topic:
"${topic}"

Title: "${title}"

Rules:
- ${chapterCount} chapters
- Business / self-improvement / action-guide style
- Each chapter title must promise a result
- No fluff
- No emojis
- No commentary

Output format:
Chapter 1: ...
Chapter 2: ...
...
`;

    const outlineRes = await openRouter(outlinePrompt);
    const outlineText = outlineRes;
    const chapters = outlineText
      .split("\n")
      .map((l: string) => l.replace(/^Chapter\s*\d+:\s*/i, "").trim())
      .filter(Boolean);

    // -------- STEP 2: Generate Each Chapter --------
    let ebookText = "";

    for (let i = 0; i < chapters.length; i++) {
      const chapterTitle = chapters[i];

      const chapterPrompt = `
You are writing a premium, professional ebook chapter.

Topic: "${topic}"
Book Title: "${title}"
Chapter ${i + 1} Title: "${chapterTitle}"

Write this chapter using EXACTLY this structure:

### Chapter ${i + 1}: ${chapterTitle}

[Motivational opening paragraph]

#### What This Chapter Covers
[2–4 sentences]

#### Why This Matters
[2–4 sentences]

#### The Core Framework
[Clear explanation]

#### Step-by-Step System
1. ...
2. ...
3. ...

#### Tools & Resources
- ...
- ...

#### Common Mistakes
- ...
- ...

#### Action Task
[Clear actionable task]

Rules:
- Second-person voice
- Short paragraphs
- No emojis
- No fluff
- No meta commentary
- No references to AI
- Professional tone
`;

      const chapterText = await openRouter(chapterPrompt);
      ebookText += chapterText + "\n\n";
    }

    // -------- STEP 3: Front Matter --------
    const frontMatterPrompt = `
You are generating the front matter of a professional ebook.

Title: "${title}"
Topic: "${topic}"

Generate:

## COVER PAGE
[Title, Subtitle placeholder, Author]

## COPYRIGHT PAGE
[Professional copyright + disclaimer]

## DEDICATION
[Short motivational dedication]

## TABLE OF CONTENTS
[List all chapters]

## INTRODUCTION
[Professional introduction]

Rules:
- No emojis
- No fluff
- Professional publishing tone
`;

    const frontMatter = await openRouter(frontMatterPrompt);

    const fullEbook = `${frontMatter}\n\n${ebookText}`;

    const estimatedPages = Math.max(5, Math.round(fullEbook.split(" ").length / 300));

    res.json({
      content: fullEbook,
      pages: estimatedPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ebook generation failed" });
  }
}

// -------- OpenRouter Helper --------
async function openRouter(prompt: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.SITE_URL || "https://localhost",
      "X-Title": process.env.SITE_NAME || "NexoraOS",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
           }
