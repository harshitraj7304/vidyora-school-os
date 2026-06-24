import { supabase } from "../../../services/supabase";
import { createNotification } from "../../../services/notificationService";

/**
 * Fetch all active/inactive schools from the public.schools table.
 * Excludes soft-deleted ("archived") records.
 */
export async function getAllSchools() {
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create a new school record.
 * @param {Object} schoolData
 */
export async function createSchool(schoolData) {
  const { data, error } = await supabase
    .from("schools")
    .insert([schoolData])
    .select()
    .single();

  if (error) throw error;

  // Trigger Notification
  await createNotification({
    school_id: data.id,
    type: "SCHOOL_CREATED",
    title: "School Registered",
    message: `School '${data.school_name}' registered successfully.`
  });

  return data;
}

/**
 * Update an existing school record.
 * @param {string} id
 * @param {Object} schoolData
 */
export async function updateSchool(id, schoolData) {
  const { data, error } = await supabase
    .from("schools")
    .update(schoolData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Trigger Notification for Status Change
  if (schoolData.status) {
    await createNotification({
      school_id: data.id,
      type: "SCHOOL_STATUS_CHANGED",
      title: "School Status Changed",
      message: `School '${data.school_name}' status set to '${data.status}'.`
    });
  }

  return data;
}

/**
 * Soft delete a school record by updating its status to "archived".
 * @param {string} id
 */
export async function deleteSchool(id) {
  const { data, error } = await supabase
    .from("schools")
    .update({ status: "archived" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Trigger Status Change notification for archival
  await createNotification({
    school_id: id,
    type: "SCHOOL_STATUS_CHANGED",
    title: "School Archived",
    message: `School '${data.school_name}' has been archived.`
  });

  return true;
}

/**
 * Verify if a school code is already in use by another non-archived school.
 * @param {string} schoolCode
 * @param {string|null} excludeId
 */
export async function checkDuplicateCode(schoolCode, excludeId = null) {
  if (!schoolCode || !schoolCode.trim()) return false;
  
  let query = supabase
    .from("schools")
    .select("id")
    .eq("school_code", schoolCode.trim().toUpperCase())
    .neq("status", "archived");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.length > 0;
}

/**
 * Verify if an email address is already in use by another non-archived school.
 * @param {string} email
 * @param {string|null} excludeId
 */
export async function checkDuplicateEmail(email, excludeId = null) {
  if (!email || !email.trim()) return false;

  let query = supabase
    .from("schools")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .neq("status", "archived");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.length > 0;
}
