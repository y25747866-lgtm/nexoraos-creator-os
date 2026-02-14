import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // ← adjust path if different
import { Loader2 } from "lucide-react"; // or use your own spinner component

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1. Try to get current session (Supabase may have already processed it)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("getSession error:", sessionError);
          navigate("/auth?error=session_failed");
          return;
        }

        if (session) {
          console.log("Session found in callback → redirecting");
          navigate("/dashboard");
          return;
        }

        // 2. If no session yet → listen for the change (common in SPA + PKCE flow)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (event === "SIGNED_IN" && newSession) {
            console.log("Auth state changed → SIGNED_IN");
            navigate("/dashboard");
          }
        });

        // Cleanup listener when component unmounts
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/auth?error=callback_error");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold tracking-tight">
          Completing sign in...
        </h2>
        <p className="text-muted-foreground">
          Please wait a moment
        </p>
      </div>
    </div>
  );
        }
