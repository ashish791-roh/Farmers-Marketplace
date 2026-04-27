"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { UserCheck, UserX, Clock, CheckCircle, XCircle, Users } from "lucide-react";

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "farmer"));
    const unsub = onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          if (a.farmerStatus === "pending" && b.farmerStatus !== "pending") return -1;
          if (b.farmerStatus === "pending" && a.farmerStatus !== "pending") return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
      setFarmers(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (farmer: any) => {
    setProcessingId(farmer.id);
    try {
      await updateDoc(doc(db, "users", farmer.id), {
        farmerStatus: "approved",
        approvedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "farmerNotifications"), {
        farmerId: farmer.id,
        type: "account_approved",
        title: "Account Approved! 🎉",
        message: "Your farmer account has been approved. You can now list products on the marketplace!",
        status: "unread",
        createdAt: serverTimestamp(),
      });
      toast.success(`${farmer.name || farmer.email} approved!`);
    } catch {
      toast.error("Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (farmer: any) => {
    const reason = prompt("Reason for rejection (will be sent to farmer):");
    if (!reason) return;
    setProcessingId(farmer.id);
    try {
      await updateDoc(doc(db, "users", farmer.id), {
        farmerStatus: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
      });
      await addDoc(collection(db, "farmerNotifications"), {
        farmerId: farmer.id,
        type: "account_rejected",
        title: "Account Not Approved",
        message: `Your farmer account application was not approved. Reason: ${reason}`,
        status: "unread",
        createdAt: serverTimestamp(),
      });
      toast.success("Rejection sent to farmer");
    } catch {
      toast.error("Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = filter === "all" ? farmers : farmers.filter((f) => f.farmerStatus === filter);
  const counts = {
    all: farmers.length,
    pending: farmers.filter((f) => f.farmerStatus === "pending").length,
    approved: farmers.filter((f) => f.farmerStatus === "approved").length,
    rejected: farmers.filter((f) => f.farmerStatus === "rejected").length,
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (status === "rejected") return "bg-red-500/20 text-red-400 border border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users size={28} className="text-green-400" />
            Farmer Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Approve or reject farmer account applications
          </p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
              filter === tab
                ? "bg-green-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {tab} ({counts[tab]})
            {tab === "pending" && counts.pending > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading farmers...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
          <UserCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-xl">No {filter === "all" ? "" : filter} farmers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((farmer, i) => (
            <motion.div
              key={farmer.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* AVATAR */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(farmer.name || farmer.email || "F")[0].toUpperCase()}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-white">{farmer.name || "No Name"}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusBadge(farmer.farmerStatus || "pending")}`}>
                      {farmer.farmerStatus === "approved" ? "✅ Approved"
                       : farmer.farmerStatus === "rejected" ? "❌ Rejected"
                       : "⏳ Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{farmer.email}</p>
                  {farmer.farmDetails && (
                    <p className="text-xs text-gray-500 mt-1">{farmer.farmDetails}</p>
                  )}
                  {farmer.rejectionReason && (
                    <p className="text-xs text-red-400 mt-1">Rejection reason: {farmer.rejectionReason}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Joined: {farmer.createdAt?.seconds
                      ? new Date(farmer.createdAt.seconds * 1000).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                {/* ACTIONS */}
                {farmer.farmerStatus !== "approved" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(farmer)}
                      disabled={processingId === farmer.id}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                    >
                      <UserCheck size={16} />
                      Approve
                    </button>
                    {farmer.farmerStatus !== "rejected" && (
                      <button
                        onClick={() => handleReject(farmer)}
                        disabled={processingId === farmer.id}
                        className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold transition"
                      >
                        <UserX size={16} />
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
