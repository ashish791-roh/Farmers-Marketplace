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
    if (!loading && !user) {
      router.push("/login");
    }

    if (!roleLoading && role !== "admin") {
      router.push("/");
    }
  }, [user, role, loading, roleLoading]);

  if (loading || roleLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}