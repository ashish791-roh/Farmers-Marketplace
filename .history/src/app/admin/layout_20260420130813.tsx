"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth + role are fully resolved
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

  // Show loading while auth resolves
  if (loading) {
    return <div>Loading...</div>;
  }

  // Don't flash children while redirect is in progress
  if (!user || role !== "admin") {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}