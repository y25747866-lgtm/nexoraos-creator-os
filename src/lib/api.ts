const BASE = "https://zprgfzoxlgaxbnnjvvir.supabase.co/functions/v1";

async function post(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Edge Function failed");
  }

  return res.json();
}

export const generateEbookTitle = (topic: string) =>
  post(`${BASE}/generate-ebook-title`, { topic });

export const generateEbookContent = (title: string) =>
  post(`${BASE}/generate-ebook-content`, { title });

export const generateEbookCover = (title: string) =>
  post(`${BASE}/generate-ebook-cover`, { title });
