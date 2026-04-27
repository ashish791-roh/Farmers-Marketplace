"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  Tractor,
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingFarmers, setPendingFarmers] = useState(0);

  // Live unread notification count
  useEffect(() => {
    const q = query(
      collection(db, "adminNotifications"),
      where("status", "==", "unread")
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadNotifications(snap.size);
    });
    return () => unsub();
  }, []);

  // Live pending farmer count
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "farmer"),
      where("farmerStatus", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPendingFarmers(snap.size);
    });
    return () => unsub();
  }, []);

  const navItems = [
    { label: "Dashboard",      href: "/admin",               icon: <LayoutDashboard size={18} /> },
    { label: "Products",       href: "/admin/products",      icon: <Package size={18} /> },
    { label: "Orders",         href: "/admin/orders",        icon: <ShoppingCart size={18} /> },
    { label: "Users",          href: "/admin/users",         icon: <Users size={18} /> },
    {
      label: "Farmers",
      href: "/admin/farmers",
      icon: <Tractor size={18} />,
      badge: pendingFarmers > 0 ? pendingFarmers : null,
      badgeColor: "bg-yellow-500 text-black",
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: <Bell size={18} />,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
      badgeColor: "bg-red-500 text-white",
    },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-bold text-green-400">🌱 Admin</h2>
        <button className="md:hidden text-white" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
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
              {item.badge != null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
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
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 min-h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-green-400">🌱 Admin</h2>
        <div className="flex items-center gap-3">
          {(unreadNotifications > 0 || pendingFarmers > 0) && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          <button onClick={() => setMobileOpen(true)} className="text-white">
            <Menu size={24} />
          </button>
        </div>
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
    </>
  );
}
