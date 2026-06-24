import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../services/supabase";
import { createNotification } from "../../../services/notificationService";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Fetch all users from the public.users table.
 * Supports school-based tenant isolation.
 * @param {string|null} schoolId
 */
export async function getAllUsers(schoolId = null) {
  let query = supabase
    .from("users")
    .select("id, user_code, full_name, email, mobile, role, status, created_at, school_id");

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Register a new user in Supabase Auth and insert profile into public.users.
 * Uses a non-persisting client so the administrator's active session is not cleared.
 * @param {Object} userData
 */
export async function createUser(userData) {
  // 1. Initialize temporary auth-isolated client
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  // 2. Sign up user in Supabase Auth with a standard temporary password
  const { data: authData, error: authError } = await authClient.auth.signUp({
    email: userData.email.trim().toLowerCase(),
    password: "VidyoraTempPassword123!",
    options: {
      data: {
        full_name: userData.full_name,
        role: userData.role
      }
    }
  });

  if (authError) throw authError;

  // 3. Write user profile row to public.users mapping auth_user_id
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .insert([
      {
        auth_user_id: authData.user?.id || null,
        user_code: userData.user_code.trim().toUpperCase(),
        full_name: userData.full_name.trim(),
        email: userData.email.trim().toLowerCase(),
        mobile: userData.mobile?.trim() || null,
        role: userData.role,
        school_id: userData.school_id || null,
        status: userData.status || "ACTIVE"
      }
    ])
    .select()
    .single();

  if (profileError) throw profileError;

  // Trigger Notification
  await createNotification({
    school_id: profile.school_id,
    user_id: profile.auth_user_id,
    type: "USER_CREATED",
    title: "User Onboarded",
    message: `User '${profile.full_name}' was onboarded as ${profile.role}.`
  });

  return profile;
}

/**
 * Update an existing user's profile details.
 * @param {string} id
 * @param {Object} userData
 */
export async function updateUser(id, userData) {
  const { data, error } = await supabase
    .from("users")
    .update({
      user_code: userData.user_code.trim().toUpperCase(),
      full_name: userData.full_name.trim(),
      mobile: userData.mobile?.trim() || null,
      role: userData.role,
      status: userData.status,
      school_id: userData.school_id || null
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Trigger Notification
  await createNotification({
    school_id: data.school_id,
    user_id: data.auth_user_id,
    type: "USER_UPDATED",
    title: "User Profile Updated",
    message: `User '${data.full_name}' details have been updated.`
  });

  return data;
}

/**
 * Verify if a user code is already in use.
 * @param {string} userCode
 * @param {string|null} excludeId
 */
export async function checkDuplicateUserCode(userCode, excludeId = null) {
  if (!userCode || !userCode.trim()) return false;

  let query = supabase
    .from("users")
    .select("id")
    .eq("user_code", userCode.trim().toUpperCase());

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.length > 0;
}

/**
 * Verify if a user email is already in use.
 * @param {string} email
 * @param {string|null} excludeId
 */
export async function checkDuplicateUserEmail(email, excludeId = null) {
  if (!email || !email.trim()) return false;

  let query = supabase
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase());

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.length > 0;
}

/**
 * Send password reset email to a user.
 * @param {string} email
 */
export async function resetUserPassword(email) {
  if (!email || !email.trim()) return null;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/login`
  });

  if (error) throw error;
  return data;
}
