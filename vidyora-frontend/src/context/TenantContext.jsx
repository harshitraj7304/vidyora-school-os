import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "./AuthContext";

const TenantContext = createContext({
  school: null,
  loading: false,
  error: null,
  fetchSchoolById: async () => {},
});

export function TenantProvider({ children }) {
  const { profile } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchoolById = useCallback(async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single();

      if (err) throw err;
      setSchool(data);
    } catch (err) {
      console.error("Error fetching school tenant:", err.message);
      setError(err.message);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile && profile.school_id) {
      fetchSchoolById(profile.school_id);
    } else {
      setSchool(null);
    }
  }, [profile, fetchSchoolById]);

  const contextValue = useMemo(() => ({
    school,
    loading,
    error,
    fetchSchoolById
  }), [school, loading, error, fetchSchoolById]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
