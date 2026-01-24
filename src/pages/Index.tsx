// Example full handler
const handleGenerate = async () => {
  // ... your existing title/topic invoke ...

  // Invoke content for PDF
  const { data: contentData, error: contentError } = await supabase.functions.invoke('generate-ebook-content', {
    body: { title, topic }
  });

  if (contentError) {
    alert('Generation failed: ' + contentError.message);
    return;
  }

  // Invoke cover
  const { data: coverData, error: coverError } = await supabase.functions.invoke('generate-ebook-cover', {
    body: { title, topic }
  });

  if (coverError) {
    alert('Cover failed');
    return;
  }

  // Set for preview
  setPdfUrl(contentData.pdfUrl);
  setImageUrl(coverData.imageUrl);
  setPages(contentData.pages);

  // AUTO DOWNLOAD BOTH (or on button click)
  const downloadFile = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  downloadFile(contentData.pdfUrl, `${title}.pdf`);
  downloadFile(coverData.imageUrl, `${title}_cover.svg`);
};
