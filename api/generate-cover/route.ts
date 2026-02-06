import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callLLM } from "@/lib/llm"; // ← shared LLM helper

export const maxDuration = 90; // covers slower models if needed

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      subtitle,
      topic, // optional – helps context
      jobId, // optional – save prompt or future image URL
      style = "modern minimalist professional ebook cover",
    } = body;

    if (!title || !subtitle) {
      return NextResponse.json(
        { error: "title and subtitle are required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert book cover designer specializing in high-converting nonfiction ebooks.

Book title: "${title}"
Subtitle: "${subtitle}"
Main topic: ${topic || "nonfiction self-improvement / business / technology"}

Create a **single, detailed image generation prompt** optimized for Flux.1, SD3 Medium, Midjourney v6, or DALL·E 3.

Style guidelines:
- ${style}
- Clean, modern, premium look
- Strong typography (bold sans-serif title, elegant subtitle)
- High contrast, professional color palette
- Symbolic / metaphorical imagery that matches the book's promise
- No people faces (unless very abstract / silhouette)
- Vertical composition (suitable for ebook thumbnail \~1600×2560)
- Include space for title & subtitle in the design

Output **ONLY** the final prompt text – no explanations, no JSON wrapper, nothing else.
    `.trim();

    const coverPrompt = await callLLM(prompt, 600);

    let result = {
      success: true,
      coverPrompt: coverPrompt.trim(),
    };

    // Optional: save to job record if jobId is provided
    if (jobId) {
      await supabase
        .from("ebook_jobs")
        .update({
          cover_prompt: coverPrompt.trim(), // ← add this column to your table if needed
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .catch((err) => console.error("Failed to save cover prompt:", err));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("generate-cover error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate cover prompt" },
      { status: 500 }
    );
  }
}
