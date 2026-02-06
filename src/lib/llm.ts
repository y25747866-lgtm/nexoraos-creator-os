export async function callLLM(
  prompt: string,
  maxTokens: number = 2000,
  model: string = "mistralai/mixtral-8x7b-instruct:v0.1"
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://your-app-domain.com", // optional but recommended
          "X-Title": "Ebook Generator",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.65,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("No content returned from LLM");

      return content;
    } catch (err) {
      console.error(`LLM attempt ${attempt} failed:`, err);
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }

  throw new Error("LLM retries exhausted");
                                   }
