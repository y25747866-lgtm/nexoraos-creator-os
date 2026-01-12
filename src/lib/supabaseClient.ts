import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zprgfzoxlgaxbnnjvvir.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcmdmem94bGdheGJubmp2dmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Njg3NzksImV4cCI6MjA4MjM0NDc3OX0.UgZ-H3C80vZLmXwzKOiYYJpxWto39BzQuID7N0hp2Ts";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
