"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  getDocs,
  limit,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Package, Truck, BadgeCheck, Heart, Tag, X } from "lucide-react";
import Link from "next/link";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  status: "unread" | "read";
  link?: string;
  createdAt?: { seconds: number };
};

function notifIcon(type: string) {
  if (type.includes("order_confirmed")) return <Package size={14} className="text-green-500" />;
  if (type.includes("shipped") || type.includes("dispatched")) return <Truck size={14} className="text-blue-500" />;
  if (type.includes("delivered")) return <BadgeCheck size={14} className="text-emerald-500" />;
  if (type.includes("cancelled")) return <X size={14} className="text-red-500" />;
  if (type.includes("wishlist") || type.includes("stock")) return <Heart size={14} className="text-red-400" />;
  if (type.includes("coupon")) return <Tag size={14} className="text-orange-500" />;
  return <Bell size={14} className="text-gray-400" />;
}

function timeAgo(seconds?: number): string {
  if (!seconds) return "";
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Listen to current user's notifications (latest 20)
  useEffect(() => {
    if (!user) { setNotifs([]); return; }
    const q = query(
      collection(db, "userNotifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notif)));
    });
    return () => unsub();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter((n) => n.status === "unread").length;

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "userNotifications", id), { status: "read" });
  };

  const markAllRead = async () => {
    if (!user) return;
    const q = query(
      collection(db, "userNotifications"),
      where("userId", "==", user.uid),
      where("status", "==", "unread")
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { status: "read" }));
    await batch.commit();
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition"
        aria-label="Notifications"
      >
        <Bell size={21} className={unread > 0 ? "text-green-600" : "text-gray-500"} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="notif-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">
                Notifications {unread > 0 && <span className="text-green-600">({unread} new)</span>}
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.status === "unread") markRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition hover:bg-gray-50 ${
                      n.status === "unread" ? "bg-green-50/50" : ""
                    }`}
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {notifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight ${n.status === "unread" ? "text-gray-900" : "text-gray-600"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {timeAgo(n.createdAt?.seconds)}
                      </p>
                    </div>
                    {n.status === "unread" && (
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2.5">
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="text-xs text-green-600 hover:text-green-700 font-semibold transition"
              >
                View all orders →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}