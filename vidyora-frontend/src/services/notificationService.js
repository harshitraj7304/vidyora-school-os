import { supabase } from "./supabase";

/**
 * Create a new notification row.
 * @param {Object} notificationData
 */
export async function createNotification(notificationData) {
  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: notificationData.user_id || null,
        school_id: notificationData.school_id || null,
        title: notificationData.title.trim(),
        message: notificationData.message.trim(),
        type: notificationData.type,
        metadata: notificationData.metadata || {},
        is_read: false,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification record in DB:", error.message);
  }
  return data;
}

/**
 * Fetch notifications visible to the user based on role and school.
 * @param {Object} userProfile - Logged in user profile details.
 */
export async function fetchNotifications(userProfile) {
  if (!userProfile) return [];

  let query = supabase
    .from("notifications")
    .select("*");

  // Filter based on user permissions
  if (userProfile.role === "SUPER_ADMIN") {
    // Super admins see all platform notifications
  } else if (userProfile.role === "SCHOOL_ADMIN") {
    // School admins see notifications targeting their school or their user ID
    if (userProfile.school_id) {
      query = query.or(`school_id.eq.${userProfile.school_id},user_id.eq.${userProfile.auth_user_id}`);
    } else {
      query = query.eq("user_id", userProfile.auth_user_id);
    }
  } else {
    // Other roles only see notifications targeting them directly
    query = query.eq("user_id", userProfile.auth_user_id);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Mark a single notification as read.
 * @param {string} id
 */
export async function markAsRead(id) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all visible unread notifications as read.
 * @param {Object} userProfile
 */
export async function markAllNotificationsAsRead(userProfile) {
  if (!userProfile) return [];

  try {
    // 1. Fetch unread notifications for the user
    let query = supabase
      .from("notifications")
      .select("id")
      .eq("is_read", false);

    if (userProfile.role === "SUPER_ADMIN") {
      // Fetch all unread
    } else if (userProfile.role === "SCHOOL_ADMIN") {
      if (userProfile.school_id) {
        query = query.or(`school_id.eq.${userProfile.school_id},user_id.eq.${userProfile.auth_user_id}`);
      } else {
        query = query.eq("user_id", userProfile.auth_user_id);
      }
    } else {
      query = query.eq("user_id", userProfile.auth_user_id);
    }

    const { data: unreadRows, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!unreadRows || unreadRows.length === 0) return [];

    const unreadIds = unreadRows.map((r) => r.id);

    // 2. Batch update matching IDs
    const { data, error: updateErr } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .select();

    if (updateErr) throw updateErr;
    return data || [];
  } catch (err) {
    console.error("Failed to mark notifications as read:", err.message);
    throw err;
  }
}
