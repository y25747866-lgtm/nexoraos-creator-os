"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Sparkles, Download } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useEbookStore, Ebook } from "@/hooks/useEbookStore";
import { jsPDF } from "jspdf";

interface StatusData {
  status: string;
  progress: number;
  totalChapters: number;
  title: string;
  finalMarkdown?: string;
}

const EbookGenerator = () => {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("clear, authoritative, practical");
  const [ebookLength, setEbookLength] = useState<"short" | "medium" | "long">("medium");
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();
  const addEbook = useEbookStore((state) => state.addEbook);

  // Auto-generate title preview as user types
  const [generatedTitlePreview, setGeneratedTitlePreview] = useState("");
  useEffect(() => {
    if (topic.length > 3) {
      const timeout = setTimeout(async () => {
        try {
          const res = await fetch("/api/generate-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic }),
          });
          if (res.ok) {
            const data = await res.json();
            setGeneratedTitlePreview(data.title || "");
          }
        } catch {}
      }, 800);
      return () => clearTimeout(timeout);
    } else {
      setGeneratedTitlePreview("");
    }
  }, [topic]);

  // Start generation → create job
  const startGeneration = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic Required", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setJobId(null);
    setStatusData(null);

    try {
      const res = await fetch("/api/generate-ebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, length: ebookLength }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to start generation");
      }

      const data = await res.json();
      setJobId(data.jobId);
      toast({ title: "Started", description: "Ebook generation in progress..." });
    } catch (err: any) {
      setErrorMsg(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setIsGenerating(false);
    }
  };

  // Poll status + auto-trigger next chapter
  useEffect(() => {
    if (!jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ebook-status?jobId=${jobId}`);
        if (!res.ok) throw new Error("Status fetch failed");

        const data = await res.json();
        setStatusData(data);

        // Auto-trigger next chapter if ready
        if (
          data.status === "outline_done" &&
          data.progress < data.totalChapters
        ) {
          await fetch("/api/generate-chapter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId, chapterIndex: data.progress }),
          });
        }

        // When complete → save to store & show success
        if (data.status === "complete" && data.finalMarkdown) {
          const ebook: Ebook = {
            id: jobId!,
            title: data.title,
            topic,
            content: data.finalMarkdown,
            coverImageUrl: null, // update later if you add cover
            pages: Math.ceil(data.finalMarkdown.split(/\s+/).length / 450),
            createdAt: new Date().toISOString(),
          };
          addEbook(ebook);
          toast({
            title: "Success!",
            description: `Your \~${ebook.pages}-page ebook is ready!`,
          });
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    }, 5000); // every 5 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, topic, addEbook]);

  // PDF generation (fixed fallback for title)
  const generatePDF = (ebook: Ebook) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 60;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 18;
    let y = margin;

    doc.setFont("helvetica");

    // Cover page
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(48);
    doc.setTextColor(251, 191, 36);
    const titleLines = doc.splitTextToSize(ebook.title || "Untitled Ebook", maxWidth);
    doc.text(titleLines, pageWidth / 2, pageHeight / 2 - 80, { align: "center" });

    doc.setFontSize(24);
    doc.setTextColor(226, 232, 240);
    doc.text(ebook.topic, pageWidth / 2, pageHeight / 2 + 20, { align: "center" });

    doc.setFontSize(18);
    doc.text("NexoraOS", pageWidth / 2, pageHeight - 100, { align: "center" });

    // Content pages
    doc.addPage();
    y = margin;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0);

    const lines = ebook.content.split("\n");

    for (let line of lines) {
      if (y > pageHeight - margin - 40) {
        doc.addPage();
        y = margin;
      }

      const trimmed = line.trim();
      if (trimmed === "") {
        y += lineHeight;
        continue;
      }

      // Headings
      if (trimmed.startsWith("# ")) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text(trimmed.slice(2), margin, y);
        y += 35;
      } else if (trimmed.startsWith("## ")) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(trimmed.slice(3), margin, y);
        y += 28;
      } else if (trimmed.startsWith("### ")) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(trimmed.slice(4), margin, y);
        y += 22;
      } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("+ ")) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("• " + trimmed.slice(2), margin + 15, y);
        y += lineHeight;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const wrapped = doc.splitTextToSize(trimmed, maxWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * lineHeight;
      }
    }

    // Final page number
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 40, pageHeight - 30);

    doc.save(`${ebook.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  };

  const isComplete = statusData?.status === "complete";
  const currentProgress = statusData?.progress || 0;
  const total = statusData?.totalChapters || 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">AI Ebook Generator</h1>
          <p className="text-muted-foreground">Create a real, full ebook.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Topic</label>
                <Input
                  placeholder="e.g., Money making"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                  className="text-lg py-6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <Input
                  placeholder="e.g., clear, tactical, motivational"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={isGenerating}
                  style={{ width: "100%", padding: "0.8rem", margin: "0.5rem 0" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Length</label>
                <select
                  value={ebookLength}
                  onChange={(e) => setEbookLength(e.target.value as "short" | "medium" | "long")}
                  disabled={isGenerating}
                  style={{ width: "100%", padding: "0.8rem", margin: "0.5rem 0" }}
                >
                  <option value="short">Short (\~3 chapters)</option>
                  <option value="medium">Medium (\~5 chapters)</option>
                  <option value="long">Long (\~7 chapters)</option>
                </select>
              </div>

              {generatedTitlePreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-2 text-sm text-primary mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Generated Title</span>
                  </div>
                  <p className="font-semibold text-lg">{generatedTitlePreview}</p>
                </motion.div>
              )}

              {isGenerating && statusData && (
                <div className="space-y-3">
                  <Progress value={(currentProgress / total) * 100 || 0} className="h-2" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {statusData?.status === "complete"
                        ? "Done!"
                        : statusData?.status?.includes("writing")
                        ? `Writing chapter ${currentProgress + 1} of ${total}...`
                        : statusData?.status || "Processing..."
                      }
                    </span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <p style={{ color: "red", marginTop: "1rem" }}>{errorMsg}</p>
              )}

              <Button
                onClick={startGeneration}
                disabled={isGenerating || !topic.trim()}
                style={{
                  padding: "1rem 2rem",
                  background: "#0066ff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  marginTop: "1rem",
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Generate Ebook
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {isComplete && statusData?.finalMarkdown && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8">
              <h2 className="text-xl font-semibold mb-6">Your Ebook is Ready!</h2>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-48 shrink-0">
                  <div style={{ marginTop: "2rem" }}>
                    <h2>Done!</h2>
                    <p>You can now download or view the ebook.</p>
                    {/* Add download link or display markdown */}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold">{statusData.title}</h3>
                  <p className="text-muted-foreground">Topic: {topic}</p>
                  <p className="text-muted-foreground">
                    Pages: \~{Math.ceil(statusData.finalMarkdown.split(/\s+/).length / 450)}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <Button
                      onClick={() =>
                        generatePDF({
                          id: jobId!,
                          title: statusData.title,
                          topic,
                          content: statusData.finalMarkdown,
                          coverImageUrl: null,
                          pages: Math.ceil(statusData.finalMarkdown.split(/\s+/).length / 450),
                          createdAt: new Date().toISOString(),
                        })
                      }
                      className="flex-1 min-w-[150px]"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EbookGenerator;
