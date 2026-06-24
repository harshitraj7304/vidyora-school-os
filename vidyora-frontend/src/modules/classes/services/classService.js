import { supabase } from "../../../services/supabase";
import { createNotification } from "../../../services/notificationService";

// Realistic fallback mock data when classes table doesn't exist yet in the database.
const MOCK_CLASSES = [
  {
    id: "class-1",
    class_name: "Grade 10 - Section A",
    class_code: "G10-A",
    status: "active",
    created_at: "2026-06-24T05:20:00.000Z",
    school_id: "a78b73ca-111c-46f6-8a14-213a056e284a",
    schools: {
      school_name: "Demo School"
    }
  },
  {
    id: "class-2",
    class_name: "Grade 10 - Section B",
    class_code: "G10-B",
    status: "active",
    created_at: "2026-06-24T05:21:00.000Z",
    school_id: "a78b73ca-111c-46f6-8a14-213a056e284a",
    schools: {
      school_name: "Demo School"
    }
  },
  {
    id: "class-3",
    class_name: "Grade 9 - General",
    class_code: "G9-GEN",
    status: "active",
    created_at: "2026-06-24T05:22:00.000Z",
    school_id: "a78b73ca-111c-46f6-8a14-213a056e284a",
    schools: {
      school_name: "Demo School"
    }
  },
  {
    id: "class-4",
    class_name: "Grade 11 - Science A",
    class_code: "G11-SCI-A",
    status: "active",
    created_at: "2026-06-24T05:23:00.000Z",
    school_id: "a78b73ca-111c-46f6-8a14-213a056e284a",
    schools: {
      school_name: "Demo School"
    }
  },
  {
    id: "class-5",
    class_name: "Grade 11 - Science B",
    class_code: "G11-SCI-B",
    status: "inactive",
    created_at: "2026-06-24T05:24:00.000Z",
    school_id: "a78b73ca-111c-46f6-8a14-213a056e284a",
    schools: {
      school_name: "Demo School"
    }
  },
  {
    id: "class-6",
    class_name: "Grade 12 - Commerce A",
    class_code: "G12-COM-A",
    status: "active",
    created_at: "2026-06-24T05:25:00.000Z",
    school_id: "a78b73ca-111c-46f6-8a14-213a056e284a",
    schools: {
      school_name: "Demo School"
    }
  },
  {
    id: "class-7",
    class_name: "Grade 12 - Commerce B",
    class_code: "G12-COM-B",
    status: "inactive",
    created_at: "2026-06-24T05:26:00.000Z",
    school_id: "a78b73ca-111c-46f6-8a14-213a056e284a",
    schools: {
      school_name: "Demo School"
    }
  }
];

const MOCK_STORAGE_KEY = "vidyora_mock_classes";
let useMockFallback = false;

function getLocalClasses() {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(MOCK_CLASSES));
    return MOCK_CLASSES;
  }
  return JSON.parse(data);
}

function saveLocalClasses(list) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(list));
}

function isTableMissingError(error) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST116" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("schema cache")
  );
}

/**
 * Fetch all classes from the public.classes table.
 * Supports school-based tenant isolation.
 * Excludes soft-deleted ("archived") records.
 * @param {string|null} schoolId
 */
export async function getAllClasses(schoolId = null) {
  if (useMockFallback) {
    return getMockAllClasses(schoolId);
  }

  try {
    let query = supabase
      .from("classes")
      .select(`
        id,
        class_name,
        class_code,
        status,
        created_at,
        school_id,
        schools (
          school_name
        )
      `)
      .neq("status", "archived");

    if (schoolId) {
      query = query.eq("school_id", schoolId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn("Supabase public.classes table not found in schema cache. Using localStorage mock fallback.");
        useMockFallback = true;
        return getMockAllClasses(schoolId);
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (isTableMissingError(err)) {
      console.warn("Supabase public.classes connection failed. Using localStorage mock fallback.");
      useMockFallback = true;
      return getMockAllClasses(schoolId);
    }
    throw err;
  }
}

function getMockAllClasses(schoolId) {
  let list = getLocalClasses().filter((cls) => cls.status !== "archived");
  if (schoolId) {
    list = list.filter((cls) => cls.school_id === schoolId);
  }
  return list;
}

/**
 * Create a new class record.
 * @param {Object} classData
 */
export async function createClass(classData) {
  let result;
  if (useMockFallback) {
    result = createMockClass(classData);
  } else {
    try {
      const { data, error } = await supabase
        .from("classes")
        .insert([
          {
            class_name: classData.class_name.trim(),
            class_code: classData.class_code.trim().toUpperCase(),
            school_id: classData.school_id,
            status: classData.status || "active"
          }
        ])
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          useMockFallback = true;
          result = createMockClass(classData);
        } else {
          throw error;
        }
      } else {
        result = data;
      }
    } catch (err) {
      if (isTableMissingError(err)) {
        useMockFallback = true;
        result = createMockClass(classData);
      } else {
        throw err;
      }
    }
  }

  // Trigger Notification
  if (result) {
    await createNotification({
      school_id: result.school_id,
      type: "CLASS_CREATED",
      title: "Class Registered",
      message: `Class '${result.class_name}' (${result.class_code}) was registered successfully.`
    });
  }

  return result;
}

function createMockClass(classData) {
  const list = getLocalClasses();
  const newClass = {
    id: `class-${Date.now()}`,
    class_name: classData.class_name.trim(),
    class_code: classData.class_code.trim().toUpperCase(),
    school_id: classData.school_id,
    status: classData.status || "active",
    created_at: new Date().toISOString(),
    schools: {
      school_name: "Mock School"
    }
  };
  list.unshift(newClass);
  saveLocalClasses(list);
  return newClass;
}

/**
 * Update an existing class record.
 * @param {string} id
 * @param {Object} classData
 */
export async function updateClass(id, classData) {
  let result;
  if (useMockFallback) {
    result = updateMockClass(id, classData);
  } else {
    try {
      const { data, error } = await supabase
        .from("classes")
        .update({
          class_name: classData.class_name.trim(),
          class_code: classData.class_code.trim().toUpperCase(),
          school_id: classData.school_id,
          status: classData.status
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          useMockFallback = true;
          result = updateMockClass(id, classData);
        } else {
          throw error;
        }
      } else {
        result = data;
      }
    } catch (err) {
      if (isTableMissingError(err)) {
        useMockFallback = true;
        result = updateMockClass(id, classData);
      } else {
        throw err;
      }
    }
  }

  // Trigger Notification
  if (result) {
    await createNotification({
      school_id: result.school_id,
      type: "CLASS_UPDATED",
      title: "Class Updated",
      message: `Class '${result.class_name}' (${result.class_code}) has been updated.`
    });
  }

  return result;
}

function updateMockClass(id, classData) {
  const list = getLocalClasses();
  const idx = list.findIndex((c) => c.id === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      class_name: classData.class_name.trim(),
      class_code: classData.class_code.trim().toUpperCase(),
      school_id: classData.school_id,
      status: classData.status
    };
    saveLocalClasses(list);
    return list[idx];
  }
  throw new Error("Class not found in mock storage");
}

/**
 * Soft delete a class by marking its status as "archived".
 * @param {string} id
 */
export async function deleteClass(id) {
  if (useMockFallback) {
    return deleteMockClass(id);
  }

  try {
    const { error } = await supabase
      .from("classes")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) {
      if (isTableMissingError(error)) {
        useMockFallback = true;
        return deleteMockClass(id);
      }
      throw error;
    }
    return true;
  } catch (err) {
    if (isTableMissingError(err)) {
      useMockFallback = true;
      return deleteMockClass(id);
    }
    throw err;
  }
}

function deleteMockClass(id) {
  const list = getLocalClasses();
  const idx = list.findIndex((c) => c.id === id);
  if (idx !== -1) {
    list[idx].status = "archived";
    saveLocalClasses(list);
    return true;
  }
  return false;
}

/**
 * Verify if a class code is already in use by another non-archived class in the same school.
 * @param {string} classCode
 * @param {string} schoolId
 * @param {string|null} excludeId
 */
export async function checkDuplicateClassCode(classCode, schoolId, excludeId = null) {
  if (!classCode || !classCode.trim() || !schoolId) return false;

  if (useMockFallback) {
    return checkDuplicateMockClassCode(classCode, schoolId, excludeId);
  }

  try {
    let query = supabase
      .from("classes")
      .select("id")
      .eq("school_id", schoolId)
      .eq("class_code", classCode.trim().toUpperCase())
      .neq("status", "archived");

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;
    if (error) {
      if (isTableMissingError(error)) {
        useMockFallback = true;
        return checkDuplicateMockClassCode(classCode, schoolId, excludeId);
      }
      throw error;
    }
    return data.length > 0;
  } catch (err) {
    if (isTableMissingError(err)) {
      useMockFallback = true;
      return checkDuplicateMockClassCode(classCode, schoolId, excludeId);
    }
    throw err;
  }
}

function checkDuplicateMockClassCode(classCode, schoolId, excludeId) {
  const list = getLocalClasses().filter((c) => c.status !== "archived");
  const upperCode = classCode.trim().toUpperCase();
  return list.some(
    (c) =>
      c.school_id === schoolId &&
      c.class_code.toUpperCase() === upperCode &&
      c.id !== excludeId
  );
}
