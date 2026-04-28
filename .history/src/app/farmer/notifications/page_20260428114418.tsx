"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Bell, CheckCheck, CheckCircle, XCircle, User } from "lucide-react";
import type { AppNotification } from "@/types";

export default function FarmerNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "farmerNotifications"),
      where("farmerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "farmerNotifications", id), { status: "read" });
  };

  const markAllRead = async () => {
    if (!user) return;
    const q = query(
      collection(db, "farmerNotifications"),
      where("farmerId", "==", user.uid),
      where("status", "==", "unread")
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { status: "read" }));
    await batch.commit();
  };

  const getIcon = (type: string) => {
    if (type === "product_approved" || type === "account_approved")
      return <CheckCircle size={20} className="text-green-400" />;
    if (type === "product_rejected" || type === "account_rejected")
      return <XCircle size={20} className="text-red-400" />;
    return <Bell size={20} className="text-blue-400" />;
  };

  const getBg = (type: string, status: string) => {
    if (status === "read") return "bg-white/5 border-white/10";
    if (type.includes("approved")) return "bg-green-500/10 border-green-500/20";
    if (type.includes("rejected")) return "bg-red-500/10 border-red-500/20";
    return "bg-blue-500/10 border-blue-500/20";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell size={28} className="text-yellow-400" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-yellow-400 text-sm mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm transition"
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-xl">No notifications yet</p>
          <p className="text-sm mt-1">You'll be notified when your products are reviewed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => notif.status === "unread" && markRead(notif.id)}
              className={`p-4 rounded-xl border cursor-pointer transition ${getBg(notif.type, notif.status)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`font-semibold text-sm ${notif.status === "unread" ? "text-white" : "text-gray-300"}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {notif.createdAt?.seconds
                        ? new Date(notif.createdAt.seconds * 1000).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{notif.message}</p>
                  {notif.adminNote && (
                    <div className="mt-2 p-2 bg-black/20 rounded-lg">
                      <p className="text-xs text-yellow-300">
                        💬 <span className="font-medium">Admin note:</span> {notif.adminNote}
                      </p>
                    </div>
                  )}
                </div>
                {notif.status === "unread" && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
