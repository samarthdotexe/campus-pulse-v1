"use client";

import { createContext, useContext, useState, useSyncExternalStore, ReactNode } from "react";
import { User } from "@/lib/data";

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

let cachedStoredUser: User | null = null;
let cachedStoredUserRaw: string | null | undefined;

const subscribeToStoredUser = () => () => {};

// Return the same object until storage changes. useSyncExternalStore requires
// snapshots to be referentially stable between renders.
function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("campus_active_user");
    if (raw === cachedStoredUserRaw) return cachedStoredUser;
    cachedStoredUserRaw = raw;
    cachedStoredUser = raw ? JSON.parse(raw) : null;
    return cachedStoredUser;
  } catch {
    cachedStoredUserRaw = null;
    cachedStoredUser = null;
    return null;
  }
}

// Helper to persist active user
function saveUser(user: User | null): void {
  try {
    const raw = JSON.stringify(user || null);
    localStorage.setItem("campus_active_user", raw);
    cachedStoredUserRaw = raw;
    cachedStoredUser = user;
  } catch {}
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedUser = useSyncExternalStore(
    subscribeToStoredUser,
    getStoredUser,
    () => null
  );
  const [sessionUser, setSessionUser] = useState<User | null | undefined>(undefined);
  const user = sessionUser === undefined ? storedUser : sessionUser;

  const login = (u: User) => {
    saveUser(u);
    setSessionUser(u);
  };

  const logout = () => {
    saveUser(null);
    setSessionUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
