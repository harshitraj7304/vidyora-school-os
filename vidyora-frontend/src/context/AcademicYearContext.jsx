import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useTenant } from "./TenantContext";

const AcademicYearContext = createContext({
  activeYear: null,
  academicYears: [],
  loading: false,
  changeActiveYear: () => {},
  refreshAcademicYears: async () => {},
});

export function AcademicYearProvider({ children }) {
  const { school } = useTenant();
  const [activeYear, setActiveYear] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAcademicYears = useCallback(async (schoolId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("school_id", schoolId)
        .order("start_date", { ascending: false });

      if (error) {
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          console.warn("academic_years table not available yet.");
          setAcademicYears([]);
          setActiveYear(null);
          return;
        }
        throw error;
      }

      setAcademicYears(data);
      const currentActive = data.find((y) => y.is_active) || data[0] || null;
      setActiveYear(currentActive);
    } catch (err) {
      console.error("Error fetching academic years:", err.message);
      setAcademicYears([]);
      setActiveYear(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (school && school.id) {
      fetchAcademicYears(school.id);
    } else {
      setAcademicYears([]);
      setActiveYear(null);
    }
  }, [school, fetchAcademicYears]);

  const changeActiveYear = useCallback((year) => {
    setActiveYear(year);
  }, []);

  const refreshAcademicYears = useCallback(async () => {
    if (school && school.id) {
      await fetchAcademicYears(school.id);
    }
  }, [school, fetchAcademicYears]);

  const contextValue = useMemo(() => ({
    activeYear,
    academicYears,
    loading,
    changeActiveYear,
    refreshAcademicYears
  }), [activeYear, academicYears, loading, changeActiveYear, refreshAcademicYears]);

  return (
    <AcademicYearContext.Provider value={contextValue}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  return useContext(AcademicYearContext);
}
