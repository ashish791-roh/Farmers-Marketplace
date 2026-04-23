"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, ShoppingBag, Heart, Pencil, Check, X, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useWishlist } from "@/context/WishlistContext";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { wishlist } = useWishlist();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setProfile(snap.data());
        setNewName(snap.data().name || "");
      }
      const ordersSnap = await getDocs(query(collection(db, "orders"), where("userId", "==", user.uid)));
      setOrderCount(ordersSnap.size);
    };
    fetchProfile();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { name: newName.trim() }, { merge: true });
      setProfile((prev: any) => ({ ...prev, name: newName.trim() }));
      setEditingName(false);
      toast.success("Name updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64 text-gray-400">Loading...</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="max-w-md mx-auto p-10 text-center">
          <User size={56} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-500 mb-6">Please login to view your profile.</p>
          <Link href="/login" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition">Login</Link>
        </main>
      </>
    );
  }

  const initials = (profile?.name || user.email || "U")[0].toUpperCase();

  const statCards = [
    { label: "Orders Placed", value: orderCount, icon: <ShoppingBag size={20} />, href: "/orders", color: "bg-blue-50 text-blue-600" },
    { label: "Wishlist Items", value: wishlist.length, icon: <Heart size={20} />, href: "/wishlist", color: "bg-red-50 text-red-500" },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* AVATAR + NAME */}
          <div className="bg-white rounded-2xl shadow p-8 mb-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
              {initials}
            </div>

            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
                <button onClick={handleSaveName} disabled={saving} className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">
                  <Check size={16} />
                </button>
                <button onClick={() => { setEditingName(false); setNewName(profile?.name || ""); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{profile?.name || "No Name"}</h1>
                <button onClick={() => setEditingName(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                  <Pencil size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Mail size={14} />
              <span>{user.email}</span>
            </div>

            {profile?.role && (
              <span className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                profile.role === "admin" ? "bg-purple-100 text-purple-700" :
                profile.role === "farmer" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {profile.role}
              </span>
            )}

            {profile?.createdAt && (
              <p className="text-xs text-gray-400 mt-2">
                Member since {new Date(
                  profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt
                ).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
              </p>
            )}
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {statCards.map((s) => (
              <Link key={s.label} href={s.href}
                className="bg-white rounded-2xl shadow p-5 flex items-center gap-4 hover:shadow-md transition"
              >
                <div className={`p-3 rounded-xl ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* QUICK LINKS */}
          <div className="bg-white rounded-2xl shadow divide-y mb-6">
            {[
              { label: "My Orders", href: "/orders", icon: <ShoppingBag size={18} className="text-blue-500" /> },
              { label: "My Wishlist", href: "/wishlist", icon: <Heart size={18} className="text-red-400" /> },
              ...(profile?.role === "farmer" ? [{ label: "Farmer Dashboard", href: "/farmer/dashboard", icon: <span style={{fontSize:18}}>🌾</span> }] : []),
              ...(profile?.role === "admin" ? [{ label: "Admin Panel", href: "/admin", icon: <span style={{fontSize:18}}>👑</span> }] : []),
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
              >
                {link.icon}
                <span className="font-medium text-gray-700">{link.label}</span>
                <span className="ml-auto text-gray-300">›</span>
              </Link>
            ))}
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 font-semibold transition"
          >
            <LogOut size={18} /> Sign Out
          </button>

        </motion.div>
      </main>
    </>
  );
}