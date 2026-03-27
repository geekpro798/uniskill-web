"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface UserContextType {
  credits: number | undefined;
  displayName: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/credits", {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setDisplayName(data.displayName || null);
      }
    } catch (e) {
      console.warn("[UserContext] Failed to fetch user data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  // Initial fetch on mount or auth change
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Expose manual refresh capability
  const refresh = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  return (
    <UserContext.Provider value={{ credits, displayName, isLoading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
