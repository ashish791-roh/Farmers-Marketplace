"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const useRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;

      if (!user) {
        setRole(null);
        setRoleLoading(false);
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setRole(snap.data().role);
      } else {
        setRole("user");
      }

      setRoleLoading(false);
    };

    fetchRole();
  }, []);

  return { role, roleLoading };
};