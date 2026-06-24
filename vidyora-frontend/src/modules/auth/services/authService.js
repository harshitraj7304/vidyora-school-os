import { supabase } from "../../../services/supabase";

/**
 * Signs in a user with email and password.
 * @param {string} email 
 * @param {string} password 
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Logs out the current user session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Retrieves the current session details.
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Fetches user profile matching a profile ID.
 * @param {string} userId 
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, schools(*)")
    .eq("id", userId)
    .single();
    
  if (error) throw error;
  return data;
}
