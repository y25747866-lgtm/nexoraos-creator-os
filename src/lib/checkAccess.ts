import { supabase } from "@/integrations/supabase/client";

export async function checkAccess() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { hasAccess: false };

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return { hasAccess: false };
  }

  return { hasAccess: true, subscription: data };
}
