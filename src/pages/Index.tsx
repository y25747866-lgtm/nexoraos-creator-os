import { useState } from "react";
import { generateEbookTitle, generateEbookContent, generateEbookCover } from "@/lib/api";

const Index = () => {
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");

      const titleRes = await generateEbookTitle(topic);
      setTitle(titleRes.title);

      const contentRes = await generateEbookContent(titleRes.title);
      setContent(contentRes.content);

      const coverRes = await generateEbookCover(titleRes.title);
      setCover(coverRes.imageUrl);
    } catch (e: any) {
      setError(e.message || "Something failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center gap-4">
      <h1 className="text-3xl font-bold">AI Ebook Generator</h1>

      <input
        className="border rounded px-3 py-2 w-full max-w-md"
        placeholder="Enter ebook topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate Ebook"}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {title && (
        <div className="max-w-2xl w-full">
          <h2 className="text-xl font-bold mt-4">{title}</h2>
          {cover && <img src={cover} alt="Cover" className="mt-3 rounded" />}
          <pre className="whitespace-pre-wrap mt-3 text-sm bg-muted p-3 rounded">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Index;
