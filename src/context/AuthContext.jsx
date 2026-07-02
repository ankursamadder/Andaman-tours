import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { displayNameFromEmail } from "../lib/contentHelpers.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const refreshAdminStatus = async () => {
    const { data, error } = await supabase.rpc("is_admin");
    if (!error) {
      setIsAdmin(Boolean(data));
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Pick up any existing session on first load (e.g. page refresh).
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      await refreshAdminStatus();
      setLoading(false);
    });

    // Keep the user in sync whenever they sign in, sign out, or the token refreshes.
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await refreshAdminStatus();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const displayName = user?.email ? displayNameFromEmail(user.email) : "";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        displayName,
        isAdmin,
        signUp,
        signIn,
        signOut,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
