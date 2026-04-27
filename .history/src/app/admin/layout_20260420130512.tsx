"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth is fully resolved
    if (loading) return;

    // If not logged in
    if (!user) {
      router.push("/login");
      return;
    }

    // If not admin
    if (role !== "admin") {
      router.push("/");
      return;
    }
  }, [user, role, loading, router]);

  // Show loading until auth is ready
  if (loading) {
    return <div>Loading...</div>;
  }

  // Don't render children until role is confirmed as admin
  if (role !== "admin") {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}