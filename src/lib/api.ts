const BASE = "https://zprgfzoxlgaxbnnjvvir.supabase.co/functions/v1";
const ANON = "YOUR_PUBLIC_ANON_KEY_FROM_SUPABASE";

async function post(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const generateEbookTitle = (topic: string) =>
  post(`${BASE}/generate-ebook-title`, { topic });

export const generateEbookContent = (title: string) =>
  post(`${BASE}/generate-ebook-content`, { title });

export const generateEbookCover = (title: string) =>
  post(`${BASE}/generate-ebook-cover`, { title });
