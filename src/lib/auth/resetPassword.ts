import { supabase } from "../supabaseClient";

export async function resetPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}
