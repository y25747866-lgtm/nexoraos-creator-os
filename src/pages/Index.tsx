async function generateEbook(title: string) {
  try {
    // 1️⃣ Generate ebook content
    const contentRes = await fetch(
      "https://zprgfzoxlgaxbnnjvvir.supabase.co/functions/v1/generate-ebook-content",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }
    );

    const contentData = await contentRes.json();
    if (!contentRes.ok) throw new Error(contentData.error || "Content failed");

    // 2️⃣ Generate cover
    const coverRes = await fetch(
      "https://zprgfzoxlgaxbnnjvvir.supabase.co/functions/v1/generate-ebook-cover",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }
    );

    const coverData = await coverRes.json();
    if (!coverRes.ok) throw new Error(coverData.error || "Cover failed");

    // 3️⃣ Download ebook text as file
    const ebookBlob = new Blob([contentData.content], { type: "text/plain" });
    const ebookUrl = URL.createObjectURL(ebookBlob);
    const ebookLink = document.createElement("a");
    ebookLink.href = ebookUrl;
    ebookLink.download = `${title}.txt`;
    ebookLink.click();

    // 4️⃣ Download cover image
    const coverLink = document.createElement("a");
    coverLink.href = coverData.imageUrl;
    coverLink.download = `${title}-cover.svg`;
    coverLink.click();

    alert("✅ Ebook & cover generated!");
  } catch (err) {
    console.error("❌ Generation failed:", err);
    alert("Generation failed. Check console.");
  }
}
