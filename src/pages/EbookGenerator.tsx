import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Sparkles, Download, Image } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useEbookStore, Ebook } from "@/hooks/useEbookStore";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from 'jspdf';

const EbookGenerator = () => {
  const [topic, setTopic] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [ebookLength, setEbookLength] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [generatedEbook, setGeneratedEbook] = useState<Ebook | null>(null);
  const { toast } = useToast();
  const addEbook = useEbookStore((state) => state.addEbook);

  useEffect(() => {
    if (topic.length > 3) {
      const timeout = setTimeout(() => {
        generateTitle(topic);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setGeneratedTitle("");
    }
  }, [topic]);

  const generateTitle = async (topicText: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-ebook-title", {
        body: { topic: topicText },
      });

      if (error) throw error;
      if (data?.title) {
        setGeneratedTitle(data.title);
      }
    } catch (error) {
      console.error("Error generating title:", error);
    }
  };

  const generateEbook = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your ebook.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus("Initializing AI...");
    setGeneratedEbook(null);

    try {
      setProgress(15);
      setStatus("Generating full ebook content...");

      const { data: contentData, error: contentError } = await supabase.functions.invoke(
        "generate-ebook-content",
        { body: { topic, title: generatedTitle || topic, length: ebookLength, author: "Yesh Malik", github: "yeshmalik__", twitter: "@yeshmalik__" } }
      );

      if (contentError) throw contentError;

      setProgress(50);
      setStatus("Content generated! Creating cover image...");

      const { data: coverData, error: coverError } = await supabase.functions.invoke(
        "generate-ebook-cover",
        { body: { title: generatedTitle || topic, topic, author: "Yesh Malik" } }
      );

      if (coverError) throw coverError;

      setProgress(85);
      setStatus("Compiling your professional ebook...");

      const ebook: Ebook = {
        id: crypto.randomUUID(),
        title: generatedTitle || topic,
        topic,
        content: contentData.content, // Filled template with real text
        coverImageUrl: coverData.imageUrl,
        pages: contentData.pages,
        createdAt: new Date().toISOString(),
      };

      addEbook(ebook);
      setGeneratedEbook(ebook);
      setProgress(100);
      setStatus("Complete!");

      toast({
        title: "Ebook Generated!",
        description: `Your ${ebook.pages}-page ebook is ready for download. Full content written!`,
      });
    } catch (error: unknown) {
      console.error("Error generating ebook:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred while generating your ebook.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = (ebook: Ebook) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Page 1: Cover with your picture (use a placeholder or your image URL)
    doc.addImage(ebook.coverImageUrl || 'https://via.placeholder.com/600x900?text=Cover', 'JPEG', 0, 0, pageWidth, pageHeight);
    doc.save('cover-only.pdf'); // First, save cover as separate if needed

    // New PDF for full book
    const fullDoc = new jsPDF();
    let y = 20;

    // Cover on first page
    fullDoc.addImage(ebook.coverImageUrl || 'https://via.placeholder.com/210x297?text=Cover', 'JPEG', 0, 0, 210, 297);
    y = 297 + 20;

    // Add content below cover
    const lines = ebook.content.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (y > pageHeight - 20) {
        fullDoc.addPage();
        y = 20;
      }

      if (line.startsWith('# ')) {
        fullDoc.setFontSize(20);
        fullDoc.setFont("helvetica", "bold");
        fullDoc.text(line.slice(2), 20, y);
        y += 25;
      } else if (line.startsWith('## ')) {
        fullDoc.setFontSize(16);
        fullDoc.setFont("helvetica", "bold");
        fullDoc.text(line.slice(3), 20, y);
        y += 20;
      } else if (line.startsWith('### ')) {
        fullDoc.setFontSize(14);
        fullDoc.setFont("helvetica", "bold");
        fullDoc.text(line.slice(4), 20, y);
        y += 15;
      } else if (line) {
        fullDoc.setFontSize(12);
        const split = fullDoc.splitTextToSize(line, 170);
        fullDoc.text(split, 20, y);
        y += split.length * 6;
      } else {
        y += 10;
      }
    }

    fullDoc.save(`${ebook.title}.pdf`);
  };

  const downloadCoverImage = (ebook: Ebook) => {
    if (!ebook.coverImageUrl) return;
    const a = document.createElement('a');
    a.href = ebook.coverImageUrl;
    a.download = `${ebook.title}_cover.png`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">AI Ebook Generator</h1>
          <p className="text-muted-foreground">
            Enter a topic and let AI create a professional ebook for you.
          </p>
        </motion.div>

        {/* Generator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="glass-panel p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What topic would you like your ebook about?
                </label>
                <Input
                  placeholder="e.g., How to Start a Successful Online Business"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                  className="text-lg py-6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ebook Length (Token-Based)
                </label>
                <select
                  value={ebookLength}
                  onChange={(e) => setEbookLength(e.target.value)}
                  className="w-full p-2 rounded border"
                >
                  <option value="short">Short (5-10 pages, fewer tokens)</option>
                  <option value="medium">Medium (10-20 pages)</option>
                  <option value="long">Long (40-50 pages, more tokens)</option>
                </select>
              </div>

              {generatedTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-center gap-2 text-sm text-primary mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Generated Title</span>
                  </div>
                  <p className="font-semibold text-lg">{generatedTitle}</p>
                </motion.div>
              )}

              {isGenerating && (
                <div className="space-y-3">
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{status}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={generateEbook}
                disabled={isGenerating || !topic.trim()}
                className="w-full py-6 text-lg"
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

        {/* Generated Ebook Preview */}
        {generatedEbook && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-panel p-8">
              <h2 className="text-xl font-semibold mb-6">Your Ebook is Ready!</h2>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Cover Preview */}
                <div className="w-full md:w-48 shrink-0">
                  {generatedEbook.coverImageUrl ? (
                    <img
                      src={generatedEbook.coverImageUrl}
                      alt={generatedEbook.title}
                      className="w-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4">
                      <span className="text-white text-center font-semibold">
                        {generatedEbook.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details & Actions */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold">{generatedEbook.title || generatedTitle}</h3>
                  <p className="text-muted-foreground">
                    Topic: {generatedEbook.topic}
                  </p>
                  <p className="text-muted-foreground">
                    Pages: ~{generatedEbook.pages}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <Button onClick={() => generatePDF(generatedEbook)} className="flex-1 min-w-[150px]">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF (Full Book with Cover on Page 1)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadCoverImage(generatedEbook)}
                      className="flex-1 min-w-[150px]"
                      disabled={!generatedEbook.coverImageUrl}
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Download Cover Image
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
