"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (role !== "admin") {
      router.push("/");
    }
  }, [role, loading]);

  if (loading) {
    return <div className="p-10">Checking access...</div>;
  }

  if (role !== "admin") return null;

  return <>{children}</>;
}