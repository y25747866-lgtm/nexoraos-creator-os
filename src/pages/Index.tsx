const Index = () => {
  const generateEbook = async () => {
    const res = await fetch(
      "https://zprgfzoxlgaxbnnjvvir.supabase.co/functions/v1/generate-ebook-content",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcmdmem94bGdheGJubmp2dmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Njg3NzksImV4cCI6MjA4MjM0NDc3OX0.UgZ-H3C80vZLmXwzKOiYYJpxWto39BzQuID7N0hp2Ts",
          "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcmdmem94bGdheGJubmp2dmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Njg3NzksImV4cCI6MjA4MjM0NDc3OX0.UgZ-H3C80vZLmXwzKOiYYJpxWto39BzQuID7N0hp2Ts",
        },
        body: JSON.stringify({ title: "AI Business Blueprint" }),
      }
    );

    const data = await res.json();
    alert("Success — check console");
    console.log(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        onClick={generateEbook}
        className="px-6 py-3 bg-black text-white rounded-lg"
      >
        Generate Ebook
      </button>
    </div>
  );
};

export default Index;
