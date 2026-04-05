// Auth state is managed by AuthContext — single subscription shared across all components.
// Re-export the hook so existing imports from "@/hooks/useAuth" keep working.
export { useAuth } from "@/contexts/AuthContext";

import { supabase } from "@/lib/supabase";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
