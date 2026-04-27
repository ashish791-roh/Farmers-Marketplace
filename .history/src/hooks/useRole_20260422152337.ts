"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * useRole — reads the role that AuthContext already fetched.
 * This avoids a redundant Firestore read since AuthContext already
 * fetches the role on auth state change.
 */
export const useRole = () => {
  const { role, loading } = useAuth();
  return { role, roleLoading: loading };
};
