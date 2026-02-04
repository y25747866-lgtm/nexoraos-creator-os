import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const BRAND_NAME = process.env.BRAND_NAME || "NexoraOS";
const BRAND_VOICE = process.env.BRAND_VOICE || "clear, authoritative, instructional";
const WRITING_STYLE = process.env.WRITING_STYLE || "amazon_nonfiction";
const TARGET_READER = process.env.TARGET_READER || "ambitious digital builders";
const CONTENT_DENSITY = process.env.CONTENT_DENSITY || "high";
const PAGE_WORD_TARGET = Number(process.env.PAGE_WORD_TARGET || 350);
const CHAPTER_COUNT = Number(process.env.CHAPTER_COUNT || 8);

function buildSystemPrompt(title: string, topic: string) {
  return `
You are a professional nonfiction publishing engine for ${BRAND_NAME}.

You do NOT write blog posts.
You do NOT write motivational essays.
You write structured, commercial-grade ebooks like top Amazon nonfiction titles and Synthesise.ai.

════════════════════════════════════
GLOBAL RULES
════════════════════════════════════
- Writing style: ${WRITING_STYLE}
- Brand voice: ${BRAND_VOICE}
- Target reader: ${TARGET_READER}
- Content density: ${CONTENT_DENSITY}
- No fluff
- No generic motivation
- No vague storytelling
- No filler paragraphs
- No hype language
- No fake case studies
- Everything must be actionable, structured, and instructional
- Use short paragraphs
- Use bullet lists
- Use frameworks
- Use tables
- Use numbered steps
- Use ASCII diagrams where useful
- Use summaries
- Use exercises
- Use checklists

════════════════════════════════════
BOOK STRUCTURE (MANDATORY)
════════════════════════════════════

1. Title Page
2. Copyright Page
3. Reader Promise Page
4. How To Use This Book
5. Table of Contents
6. Introduction (Problem → Cost → Solution → Outcome)
7. ${CHAPTER_COUNT} Core Chapters
8. Final Action Plan
9. Summary
10. Brand Signature Page

════════════════════════════════════
CHAPTER FORMAT (MANDATORY)
════════════════════════════════════

Each chapter MUST contain:

1. Chapter Title
2. Core Problem Explanation
3. Mental Model / Framework (diagram or system)
4. Step-by-Step Execution Guide
5. Realistic Application Examples
6. Common Mistakes & Corrections
7. Tools / Templates / Checklists
8. Action Exercises
9. Chapter Summary

════════════════════════════════════
FORMAT RULES
════════════════════════════════════

- Use Markdown
- Use ## for chapters
- Use ### for sections
- Use bullet lists and tables
- Use ASCII diagrams when helpful
- Use checklists
- Use short paragraphs
- Page density target: ~${PAGE_WORD_TARGET} words per page equivalent
- No emojis
- No hype
- No storytelling fluff

════════════════════════════════════
BOOK DETAILS
════════════════════════════════════
Title: ${title}
Topic: ${topic}
Brand: ${BRAND_NAME}

════════════════════════════════════

Now generate the COMPLETE ebook in Markdown following ALL rules above.
`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { topic, title } = req.body;
    if (!topic || !title) {
      return res.status(400).json({ error: "Missing topic or title" });
    }

    const systemPrompt = buildSystemPrompt(title, topic);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.15,
      max_tokens: 14000,
    });

    const content = completion.choices[0].message.content || "";
    const estimatedPages = Math.max(8, Math.round(content.split(" ").length / PAGE_WORD_TARGET));

    res.status(200).json({
      content,
      pages: estimatedPages,
    });
  } catch (error) {
    console.error("generate-ebook error:", error);
    res.status(500).json({ error: "Failed to generate ebook" });
  }
                             }
