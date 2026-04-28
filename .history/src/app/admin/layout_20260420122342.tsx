"use client";

import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { role, roleLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading || roleLoading) return;

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
  }, [user, role, loading, roleLoading, router]);

  // Show loading until everything is ready
  if (loading || roleLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}