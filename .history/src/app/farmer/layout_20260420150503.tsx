"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  Package,
  Plus,
  LogOut,
  Menu,
  X,
  BarChart2,
  ShoppingBag,
  Bell,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const BASE_NAV = [
  { label: "Dashboard", href: "/farmer/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "My Products", href: "/farmer/products", icon: <Package size={18} /> },
  { label: "Add Product", href: "/farmer/products/add", icon: <Plus size={18} /> },
  { label: "My Orders", href: "/farmer/orders", icon: <ShoppingBag size={18} /> },
  { label: "Analytics", href: "/farmer/analytics", icon: <BarChart2 size={18} /> },
  { label: "Notifications", href: "/farmer/notifications", icon: <Bell size={18} /> },
];

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [farmerStatus, setFarmerStatus] = useState<string | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Live unread farmer notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "farmerNotifications"),
      where("farmerId", "==", user?.uid),
      where("status", "==", "unread")
    );
    const unsub = onSnapshot(q, (snap) => setUnreadNotifs(snap.size));
    return () => unsub();
  }, [user]);

  const navItems = BASE_NAV.map((item) =>
    item.href === "/farmer/notifications"
      ? { ...item, badge: unreadNotifs > 0 ? unreadNotifs : null }
      : item
  );

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (role !== "farmer") { router.push("/"); return; }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setFarmerStatus(snap.data().farmerStatus || "pending");
    };
    fetchStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  if (!user || role !== "farmer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Redirecting...
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-bold text-green-400">🌾 FarmX</h2>
        <button className="md:hidden text-white" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Farmer Status Badge */}
      {farmerStatus && (
        <div className={`mb-6 px-3 py-2 rounded-xl text-xs font-medium text-center ${
          farmerStatus === "approved"
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : farmerStatus === "rejected"
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
        }`}>
          {farmerStatus === "approved" ? "✅ Approved Seller" 
           : farmerStatus === "rejected" ? "❌ Account Rejected"
           : "⏳ Pending Approval"}
        </div>
      )}

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/farmer/dashboard"
              ? pathname === "/farmer/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm
                ${isActive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {(item as any).badge != null && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {(item as any).badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition text-sm mt-4"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 text-white">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 min-h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-green-400">🌾 FarmX</h2>
        <button onClick={() => setMobileOpen(true)} className="text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-gray-950 p-6 flex flex-col">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="flex-1 md:p-10 p-4 pt-16 md:pt-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
