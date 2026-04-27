"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait until auth is fully resolved before checking
    if (!loading && mounted) {
      if (!user) {
        router.replace("/login");
      } else if (role !== null && role !== "admin") {
        // Role is loaded and is NOT admin → kick out
        router.replace("/");
      }
    }
  }, [user, loading, role, mounted, router]);

  // Still hydrating
  if (!mounted || loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading admin panel...
      </div>
    );
  }

  // Role not yet fetched from Firestore (null while async fetch is in-flight)
  if (role === null) {
    return (
      <div className="p-10 text-center text-gray-500">
        Verifying access...
      </div>
    );
  }

  // Not admin — render nothing while redirect fires
  if (role !== "admin") {
    return null;
  }

  return (
    <div className="p-10">
      {children}
    </div>
  );
}