"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import type { PendingProduct, AppNotification } from "@/types";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  ExternalLink,
  CheckCheck,
} from "lucide-react";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"notifications" | "pending">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<{ [key: string]: string }>({});

  // Listen to admin notifications
  useEffect(() => {
    const q = query(collection(db, "adminNotifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
    });
    return () => unsub();
  }, []);

  // Listen to pending products
  useEffect(() => {
    const q = query(
      collection(db, "pendingProducts"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPendingProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const pendingCount = pendingProducts.filter((p) => p.status === "pending").length;

  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifications
      .filter((n) => n.status === "unread")
      .forEach((n) => {
        batch.update(doc(db, "adminNotifications", n.id), { status: "read" });
      });
    await batch.commit();
    toast.success("All notifications marked as read");
  };

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "adminNotifications", id), { status: "read" });
  };

  const handleApprove = async (product: PendingProduct) => {
    setProcessingId(product.id);
    try {
      const note = adminNote[product.id] || "";

      // 1. Update pendingProduct status
      await updateDoc(doc(db, "pendingProducts", product.id), {
        status: "approved",
        adminNote: note,
        reviewedAt: serverTimestamp(),
      });

      // 2. Copy product to live products collection
      await addDoc(collection(db, "products"), {
        name: product.name,
        price: product.price,
        image: product.image || "",
        category: product.category || "",
        description: product.description || "",
        stock: product.stock || 0,
        unit: product.unit || "kg",
        farmerId: product.farmerId,
        farmerName: product.farmerName || "",
        farmerEmail: product.farmerEmail || "",
        createdAt: serverTimestamp(),
        approved: true,
        farmerVerified: true,
      });

      // 3. Create notification for farmer
      await addDoc(collection(db, "farmerNotifications"), {
        farmerId: product.farmerId,
        type: "product_approved",
        title: "Product Approved! 🎉",
        message: `Your product "${product.name}" has been approved and is now live on the marketplace!`,
        adminNote: note,
        productId: product.id,
        productName: product.name,
        status: "unread",
        createdAt: serverTimestamp(),
      });

      // 4. Update related admin notifications as resolved
      const relatedQ = query(
        collection(db, "adminNotifications"),
        where("productId", "==", product.id)
      );
      const relatedSnap = await getDocs(relatedQ);
      const batch = writeBatch(db);
      relatedSnap.docs.forEach((d) => {
        batch.update(d.ref, { status: "read", resolved: true });
      });
      await batch.commit();

      toast.success(`"${product.name}" approved and live! ✅`);
      setAdminNote((prev) => ({ ...prev, [product.id]: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve product");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (product: PendingProduct) => {
    const note = adminNote[product.id] || "";
    if (!note.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setProcessingId(product.id);
    try {
      // 1. Update pendingProduct status
      await updateDoc(doc(db, "pendingProducts", product.id), {
        status: "rejected",
        adminNote: note,
        reviewedAt: serverTimestamp(),
      });

      // 2. Create notification for farmer
      await addDoc(collection(db, "farmerNotifications"), {
        farmerId: product.farmerId,
        type: "product_rejected",
        title: "Product Not Approved",
        message: `Your product "${product.name}" was not approved.`,
        adminNote: note,
        productId: product.id,
        productName: product.name,
        status: "unread",
        createdAt: serverTimestamp(),
      });

      // 3. Update related admin notifications as resolved
      const relatedQ = query(
        collection(db, "adminNotifications"),
        where("productId", "==", product.id)
      );
      const relatedSnap = await getDocs(relatedQ);
      const batch = writeBatch(db);
      relatedSnap.docs.forEach((d) => {
        batch.update(d.ref, { status: "read", resolved: true });
      });
      await batch.commit();

      toast.success(`"${product.name}" rejected with feedback sent`);
      setAdminNote((prev) => ({ ...prev, [product.id]: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject product");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (status === "rejected") return "bg-red-500/20 text-red-400 border border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell size={28} className="text-yellow-400" />
            Notifications & Approvals
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and approve/reject farmer product submissions
          </p>
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

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === "pending"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          <Clock size={16} />
          Pending Review
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === "notifications"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          <Bell size={16} />
          All Notifications
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* PENDING PRODUCTS TAB */}
      {activeTab === "pending" && (
        <div>
          {loading ? (
            <p className="text-gray-400 text-center py-20">Loading...</p>
          ) : pendingProducts.filter((p) => p.status === "pending").length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
              <CheckCircle size={48} className="mx-auto mb-3 opacity-30 text-green-400" />
              <p className="text-xl font-medium">All caught up!</p>
              <p className="text-sm mt-1">No products awaiting review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProducts
                .filter((p) => p.status === "pending")
                .map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition"
                  >
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* PRODUCT IMAGE */}
                      <div className="relative w-full md:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={product.image || "https://via.placeholder.com/120x120?text=🌾"}
                          alt={product.name}
                          fill
                          sizes="128px"
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/120x120?text=🌾"; }}
                        />
                      </div>

                      {/* PRODUCT DETAILS */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-green-400 font-bold">₹{product.price}/{product.unit || "kg"}</span>
                              {product.category && (
                                <span className="text-xs bg-white/10 px-2 py-1 rounded-lg text-gray-300">
                                  {product.category}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">Stock: {product.stock || 0}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {product.createdAt?.seconds
                              ? new Date(product.createdAt.seconds * 1000).toLocaleString()
                              : "—"}
                          </span>
                        </div>

                        {/* DESCRIPTION */}
                        {product.description && (
                          <p className="text-sm text-gray-400 mt-2 line-clamp-2">{product.description}</p>
                        )}

                        {/* FARMER INFO */}
                        <div className="flex items-center gap-2 mt-3 p-2 bg-white/5 rounded-lg">
                          <User size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-300">
                            <span className="font-medium">{product.farmerName || "Unknown"}</span>
                            {" · "}
                            <span className="text-gray-500">{product.farmerEmail}</span>
                          </span>
                        </div>

                        {/* ADMIN NOTE INPUT */}
                        <div className="mt-3">
                          <label className="text-xs text-gray-400 mb-1 block">
                            Note to farmer (required for rejection)
                          </label>
                          <input
                            placeholder="e.g. Image quality needs improvement, price seems too high..."
                            value={adminNote[product.id] || ""}
                            onChange={(e) =>
                              setAdminNote((prev) => ({ ...prev, [product.id]: e.target.value }))
                            }
                            className="w-full p-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleApprove(product)}
                            disabled={processingId === product.id}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
                          >
                            <CheckCircle size={16} />
                            {processingId === product.id ? "Processing..." : "Approve & Publish"}
                          </button>
                          <button
                            onClick={() => handleReject(product)}
                            disabled={processingId === product.id}
                            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 disabled:opacity-50 text-red-400 px-5 py-2 rounded-xl text-sm font-semibold transition"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}

          {/* RECENTLY REVIEWED */}
          {pendingProducts.filter((p) => p.status !== "pending").length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Recently Reviewed</h2>
              <div className="space-y-3">
                {pendingProducts
                  .filter((p) => p.status !== "pending")
                  .slice(0, 5)
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={product.image || "https://via.placeholder.com/50x50?text=🌾"}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/50x50?text=🌾"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.farmerName} · ₹{product.price}</p>
                        {product.adminNote && (
                          <p className="text-xs text-yellow-400 mt-0.5">Note: {product.adminNote}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${getStatusBadge(product.status)}`}>
                        {product.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
              <Bell size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-xl">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => notif.status === "unread" && markRead(notif.id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  notif.status === "unread"
                    ? "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40"
                    : "bg-white/5 border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notif.status === "unread" ? "bg-blue-400" : "bg-gray-600"
                  }`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-white text-sm">{notif.title}</p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {notif.createdAt?.seconds
                          ? new Date(notif.createdAt.seconds * 1000).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{notif.message}</p>
                    {notif.resolved && (
                      <span className="text-xs text-green-400 mt-1 inline-block">✓ Resolved</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}