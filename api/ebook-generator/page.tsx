import { useState, useEffect } from "react";

export default function EbookGenerator() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("clear, authoritative, practical");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      const res = await fetch("/api/generate-ebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, length }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setJobId(data.jobId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ebook-status?jobId=${jobId}`);
        if (!res.ok) throw new Error("Status fetch failed");
        const data = await res.json();
        setStatus(data);

        // Auto-trigger next chapter if ready
        if (data.status === "outline_done" && data.progress < data.totalChapters) {
          await fetch("/api/generate-chapter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId, chapterIndex: data.progress }),
          });
        }
      } catch (err: any) {
        console.error(err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [jobId]);

  const isComplete = status?.status === "complete";

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {!jobId ? (
        <>
          <h1>Generate Ebook</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            <div>
              <label>Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Building a SaaS Product"
                required
                style={{ width: "100%", padding: "0.8rem", margin: "0.5rem 0" }}
              />
            </div>

            <div>
              <label>Tone</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g. clear, tactical, motivational"
                style={{ width: "100%", padding: "0.8rem", margin: "0.5rem 0" }}
              />
            </div>

            <div>
              <label>Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                style={{ width: "100%", padding: "0.8rem", margin: "0.5rem 0" }}
              >
                <option value="short">Short (\~3 chapters)</option>
                <option value="medium">Medium (\~5 chapters)</option>
                <option value="long">Long (\~7 chapters)</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                padding: "1rem 2rem",
                background: "#0066ff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                marginTop: "1rem",
              }}
            >
              Start Generation
            </button>

            {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
          </form>
        </>
      ) : (
        <>
          <h1>{status?.title || "Creating your ebook..."}</h1>
          {status?.subtitle && <h3>{status.subtitle}</h3>}

          <p>
            <strong>Status:</strong> {status?.status || "starting..."}
          </p>
          <p>
            <strong>Progress:</strong> {status?.progress || 0} /{" "}
            {status?.totalChapters || "?"}
          </p>

          <progress
            value={status?.progress || 0}
            max={status?.totalChapters || 1}
            style={{ width: "100%", height: "24px", margin: "1rem 0" }}
          />

          {isComplete && (
            <div style={{ marginTop: "2rem" }}>
              <h2>Done!</h2>
              <p>You can now download or view the ebook.</p>
              {/* Add download link or display markdown */}
            </div>
          )}

          {status?.errorMessage && (
            <p style={{ color: "red" }}>Error: {status.errorMessage}</p>
          )}
        </>
      )}
    </div>
  );
    }
