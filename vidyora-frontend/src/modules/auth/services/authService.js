import { supabase } from "../../../services/supabase";

/**
 * Sign In
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
 * Sign Out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

/**
 * Get Session
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  return session;
}

/**
 * Get User Profile
 */
export async function getUserProfile(authUserId) {
  console.log("Searching profile for:", authUserId);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  console.log("Profile Result:", data);
  console.log("Profile Error:", error);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update user profile details in public.users.
 * @param {string} id - The primary key ID of the user row.
 * @param {Object} profileData
 */
export async function updateUserProfile(id, profileData) {
  const { data, error } = await supabase
    .from("users")
    .update({
      full_name: profileData.full_name.trim(),
      mobile: profileData.mobile?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Securely update the logged-in user's password.
 * @param {string} newPassword
 */
export async function updateUserPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Securely update the logged-in user's email and public.users row.
 * @param {string} id - The primary key ID of the user row in public.users.
 * @param {string} newEmail
 */
export async function updateUserEmail(id, newEmail) {
  const emailLower = newEmail.trim().toLowerCase();
  
  // 1. Update in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.updateUser({
    email: emailLower,
  });
  if (authError) throw authError;

  // 2. Update email column in public.users
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .update({
      email: emailLower,
    })
    .eq("id", id)
    .select()
    .single();

  if (profileError) throw profileError;
  return { authData, profileData };
}

/**
 * Get User Profile by primary key ID.
 * @param {string} id
 */
export async function getUserProfileById(id) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upload user profile photo to Supabase Storage, with fallback to Base64 data URL.
 * Updates the public.users record's profile_photo_url.
 * @param {string} id - The primary key ID of the user row in public.users.
 * @param {File} file
 */
export async function uploadAvatar(id, file) {
  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${id}-${Date.now()}.${fileExt}`;
  
  try {
    // 1. Try uploading to Supabase Storage avatars bucket
    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl || null;
    if (!publicUrl) throw new Error("Could not retrieve public URL");

    // 3. Update public.users
    const { data: profile, error: dbError } = await supabase
      .from("users")
      .update({ profile_photo_url: publicUrl })
      .eq("id", id)
      .select()
      .single();

    if (dbError) throw dbError;
    return publicUrl;

  } catch (storageError) {
    console.warn("Supabase Storage upload failed, falling back to Base64:", storageError.message);
    
    // Fallback: convert file to a Base64 data URL and save directly to users table
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Url = reader.result;
        try {
          const { data: profile, error: dbError } = await supabase
            .from("users")
            .update({ profile_photo_url: base64Url })
            .eq("id", id)
            .select()
            .single();

          if (dbError) throw dbError;
          resolve(base64Url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
    });
  }
}

/**
 * Send a secure password reset link to the user's email address.
 * @param {string} email
 */
export async function sendForgotPasswordEmail(email) {
  const emailLower = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.resetPasswordForEmail(emailLower, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return data;
}

/**
 * Reset password during active recovery session.
 * @param {string} newPassword
 */
export async function resetUserPasswordCredentials(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}