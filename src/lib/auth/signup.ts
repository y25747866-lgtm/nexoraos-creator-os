import { supabase } from "../supabaseClient";

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
}
