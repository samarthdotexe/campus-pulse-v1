"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/lib/data";
import { isApprovalAdmin, signInWithPassword, signUpWithPassword, SignUpInput } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/supabase/repository";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  canApproveRoleRequests: boolean;
  signUp: (input: SignUpInput) => Promise<{ requiresEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  canApproveRoleRequests: false,
  signUp: async () => ({ requiresEmailConfirmation: false }),
  signIn: async () => {},
  refreshUser: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canApproveRoleRequests, setCanApproveRoleRequests] = useState(false);

  const refreshUser = useCallback(async () => {
    const client = createClient();
    const { data: { user: authUser }, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!authUser?.email) {
      setUser(null);
      setCanApproveRoleRequests(false);
      return null;
    }
    const profile = await getCurrentProfile(authUser.id, authUser.email);
    setUser(profile);
    setCanApproveRoleRequests(await isApprovalAdmin().catch(() => false));
    return profile;
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const loadProfile = async (nextUser: { id: string; email?: string | null } | null | undefined) => {
      if (!nextUser?.email) {
        if (active) {
          setUser(null);
          setCanApproveRoleRequests(false);
          setLoading(false);
        }
        return;
      }
      try {
        const profile = await getCurrentProfile(nextUser.id, nextUser.email);
        if (active) {
          setUser(profile);
          setCanApproveRoleRequests(await isApprovalAdmin().catch(() => false));
          setLoading(false);
        }
      } catch (profileError) {
        if (active) {
          setError(profileError instanceof Error ? profileError.message : "Unable to load your account.");
          setLoading(false);
        }
      }
    };

    const syncSession = async () => {
      try {
        const client = createClient();
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!active) return;
        await loadProfile(session?.user);
        const listener = client.auth.onAuthStateChange((_event, nextSession) => {
          void loadProfile(nextSession?.user);
        });
        unsubscribe = () => listener.data.subscription.unsubscribe();
      } catch (sessionError) {
        if (active) {
          setError(sessionError instanceof Error ? sessionError.message : "Unable to initialize authentication.");
          setLoading(false);
        }
      }
    };

    void syncSession();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (input: SignUpInput) => {
    setError(null);
    try {
      return await signUpWithPassword(input);
    } catch (signUpError) {
      const message = signUpError instanceof Error ? signUpError.message : "Unable to create your account.";
      setError(message);
      throw new Error(message);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithPassword(email, password);
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : "Unable to log in.";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    const { error: signOutError } = await createClient().auth.signOut();
    if (signOutError) {
      const message = signOutError.message;
      setError(message);
      throw new Error(message);
    }
    setUser(null);
    setCanApproveRoleRequests(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, canApproveRoleRequests, signUp, signIn, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
