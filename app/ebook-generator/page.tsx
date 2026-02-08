"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Sparkles, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const EbookGeneratorPage = () => {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("clear, authoritative, practical");
  const [ebookLength, setEbookLength] = useState<"short" | "medium" | "long">("medium");
  const [titlePreview, setTitlePreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-generate title preview
  useEffect(() => {
    if (topic.length > 3) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch("/api/generate-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic }),
          });
          if (res.ok) {
            const data = await res.json();
            setTitlePreview(data.title || "");
          }
        } catch {}
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setTitlePreview("");
    }
  }, [topic]);

  const startGeneration = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic Required", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      // Generate title
      const titleRes = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone }),
      });
      if (!titleRes.ok) throw new Error("Title generation failed");
      const { title, subtitle } = await titleRes.json();

      // Generate cover
      const coverRes = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle, topic }),
      });
      if (!coverRes.ok) throw new Error("Cover generation failed");
      const { coverPrompt } = await coverRes.json();

      setTitlePreview(title);
      setCoverPreview(coverPrompt);

      toast({ title: "Success", description: "Title & cover ready" });
    } catch (err: any) {
      setErrorMsg(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-bold mb-4 text-center">Create Your Ebook</h1>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Professional ebooks in minutes — powered by AI
          </p>
        </motion.div>

        <Card className="p-8 shadow-xl">
          <div className="space-y-8">
            <div>
              <label className="block text-lg font-medium mb-3">Topic</label>
              <Input
                placeholder="e.g. Money making, Fitness, Productivity..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-lg py-6"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-lg font-medium mb-3">Tone</label>
              <Input
                placeholder="e.g. clear, authoritative, practical"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="text-lg py-6"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-lg font-medium mb-3">Length</label>
              <select
                value={ebookLength}
                onChange={(e) => setEbookLength(e.target.value as "short" | "medium" | "long")}
                className="w-full p-4 rounded-md border bg-background text-lg"
                disabled={isGenerating}
              >
                <option value="short">Short (5-10 pages)</option>
                <option value="medium">Medium (15-25 pages)</option>
                <option value="long">Long (40-50 pages)</option>
              </select>
            </div>

            {titlePreview && (
              <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">Generated Title</span>
                </div>
                <h3 className="text-2xl font-bold">{titlePreview}</h3>
              </div>
            )}

            {coverPreview && (
              <div className="p-6 rounded-xl bg-muted/50 border">
                <div className="text-lg font-medium mb-2">Cover Prompt</div>
                <p className="text-muted-foreground">{coverPreview}</p>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-4">
                <Progress value={60} className="h-3" />
                <p className="text-center text-muted-foreground">Generating your ebook...</p>
              </div>
            )}

            {errorMsg && <p className="text-red-500 text-center">{errorMsg}</p>}

            <Button
              onClick={startGeneration}
              disabled={isGenerating || !topic.trim()}
              className="w-full py-8 text-xl font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-6 h-6 mr-3" />
                  Generate Ebook
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EbookGeneratorPage;
