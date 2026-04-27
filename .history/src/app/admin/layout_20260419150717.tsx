"use client";

import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="p-10">
      {children}
    </div>
  );
}