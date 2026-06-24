import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../services/supabase";
import { getUserProfile } from "../modules/auth/services/authService";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch custom user profile from service layer
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err) {
      console.warn("Could not retrieve custom user profile:", err.message);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // 1. Check current session
    async function checkUserSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Error fetching session:", err.message);
      } finally {
        setLoading(false);
      }
    }

    checkUserSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (session) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      throw error;
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  // Memoize context value to prevent unneeded re-renders of consumer components
  const contextValue = useMemo(() => ({
    user,
    profile,
    loading,
    login,
    logout,
    refreshProfile
  }), [user, profile, loading, login, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
