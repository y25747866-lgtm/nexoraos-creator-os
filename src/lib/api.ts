const BASE_URL = "https://zprgfzoxlgaxbnnjvvir.supabase.co/functions/v1";

export async function generateEbookContent(title: string) {
  const res = await fetch(`${BASE_URL}/generate-ebook-content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Content generation failed");
  }

  return res.json();
}

export async function generateEbookTitle(topic: string) {
  const res = await fetch(`${BASE_URL}/generate-ebook-title`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Title generation failed");
  }

  return res.json();
}

export async function generateEbookCover(title: string) {
  const res = await fetch(`${BASE_URL}/generate-ebook-cover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Cover generation failed");
  }

  return res.json();
    }
