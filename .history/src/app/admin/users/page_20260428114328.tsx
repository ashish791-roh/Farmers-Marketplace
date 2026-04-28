"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import type { AppUser } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.uid) {
      toast.error("You cannot change your own role");
      return;
    }
    setUpdating(userId);
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.uid) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm("Delete this user from Firestore? (Auth account stays)")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("User removed");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">👥 Manage Users</h1>

      {/* SEARCH */}
      <input
        placeholder="Search by email or role..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading users...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No users found.</p>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* TABLE HEADER */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Email</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-1">Del</div>
          </div>

          {/* ROWS */}
          <div className="divide-y divide-white/5">
            {filtered.map((user, i) => (
              <div
                key={user.id}
                className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/5 transition ${
                  user.id === currentUser?.uid ? "bg-green-500/5" : ""
                }`}
              >
                {/* INDEX */}
                <div className="col-span-1 text-gray-500 text-sm">{i + 1}</div>

                {/* EMAIL */}
                <div className="col-span-5">
                  <p className="text-sm text-white truncate">{user.email}</p>
                  {user.id === currentUser?.uid && (
                    <span className="text-xs text-green-400">(you)</span>
                  )}
                </div>

                {/* ROLE SELECT */}
                <div className="col-span-3">
                  <select
                    value={user.role || "user"}
                    disabled={updating === user.id || user.id === currentUser?.uid}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`w-full p-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50
                      ${user.role === "admin"
                        ? "bg-purple-900/50 border-purple-500/40 text-purple-300"
                        : "bg-gray-800 border-white/20 text-white"
                      }`}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>

                {/* JOINED DATE */}
                <div className="col-span-2 text-xs text-gray-500">
                  {user.createdAt?.seconds
                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                    : "—"}
                </div>

                {/* DELETE */}
                <div className="col-span-1">
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={user.id === currentUser?.uid}
                    className="text-red-400 hover:text-red-300 disabled:opacity-30 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-white/10 text-xs text-gray-500">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""} total
          </div>
        </div>
      )}
    </div>
  );
}