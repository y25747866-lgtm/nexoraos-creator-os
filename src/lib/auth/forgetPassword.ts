import { supabase } from "../supabaseClient";

export async function forgetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://nexoraos.vercel.app/reset-password",
  });

  if (error) throw error;
}
