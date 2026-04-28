"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Cancellation time window — must match the server-side constant
const CANCEL_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const CANCELLABLE_STATUSES = ["pending", "paid", "confirmed", "processing"];
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  PackageOpen,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  Star,
  RotateCcw,
  MapPin,
  Circle,
  BadgeCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Order } from "@/types";

// ─── Tracking steps definition ────────────────────────────────────────────────
// Each status maps to one of these 4 canonical steps (0-based)
const TRACKING_STEPS = [
  {
    key: "placed",
    label: "Order Placed",
    desc: "We've received your order and are getting it ready.",
    icon: ShoppingBag,
  },
  {
    key: "confirmed",
    label: "Confirmed",
    desc: "Your order has been confirmed and is being packed.",
    icon: Package,
  },
  {
    key: "dispatched",
    label: "Dispatched",
    desc: "Your order is on its way to you.",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    desc: "Order delivered successfully. Enjoy your fresh produce!",
    icon: BadgeCheck,
  },
];

// Maps raw Firestore status → step index (0-based). -1 = cancelled.
const STATUS_TO_STEP: Record<string, number> = {
  pending: 0,
  paid: 0,
  confirmed: 1,
  processing: 1,
  shipped: 2,
  out_for_delivery: 2,
  dispatched: 2,
  delivered: 3,
  cancelled: -1,
};

// ─── Status Badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Order Placed",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Clock size={13} />,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <CheckCircle2 size={13} />,
  },
  paid: {
    label: "Order Placed",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle2 size={13} />,
  },
  processing: {
    label: "Processing",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: <Package size={13} />,
  },
  shipped: {
    label: "Shipped",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Truck size={13} />,
  },
  dispatched: {
    label: "Dispatched",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Truck size={13} />,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: <Truck size={13} />,
  },
  delivered: {
    label: "Delivered",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle2 size={13} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <RotateCcw size={13} />,
  },
};

const fallbackConfig = {
  label: "Processing",
  color: "text-gray-700",
  bg: "bg-gray-50",
  border: "border-gray-200",
  icon: <Clock size={13} />,
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? fallbackConfig;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold capitalize px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Delivery Timeline ────────────────────────────────────────────────────────
function DeliveryTimeline({
  status,
  orderDate,
}: {
  status: string;
  orderDate?: number; // unix seconds
}) {
  const currentStep = STATUS_TO_STEP[status] ?? 0;
  if (currentStep === -1) return null; // cancelled

  // Estimate timestamps based on order date (illustrative, not from DB)
  const getStepDate = (stepIdx: number): string => {
    if (!orderDate) return "";
    const base = new Date(orderDate * 1000);
    const offsets = [0, 2, 24, 48]; // hours offset per step
    const d = new Date(base.getTime() + offsets[stepIdx] * 60 * 60 * 1000);
    if (stepIdx > currentStep) return ""; // future steps have no time
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-4">
      <div className="relative pl-8">
        {/* Vertical line behind icons */}
        <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-gray-100" />

        {TRACKING_STEPS.map((step, idx) => {
          const done = idx < currentStep;
          const active = idx === currentStep;
          const future = idx > currentStep;
          const Icon = step.icon;
          const dateLabel = getStepDate(idx);

          return (
            <div key={step.key} className="relative mb-5 last:mb-0 flex items-start gap-3">
              {/* Icon circle */}
              <div className="relative z-10 -ml-8 shrink-0">
                {active ? (
                  // Pulsing ring for active step
                  <span className="relative flex h-7 w-7">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
                    <span className="relative inline-flex h-7 w-7 rounded-full bg-green-600 items-center justify-center text-white shadow">
                      <Icon size={13} />
                    </span>
                  </span>
                ) : done ? (
                  <span className="flex h-7 w-7 rounded-full bg-green-500 items-center justify-center text-white">
                    <CheckCircle2 size={13} />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 rounded-full bg-gray-100 border border-gray-200 items-center justify-center text-gray-300">
                    <Icon size={13} />
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      active
                        ? "text-green-700"
                        : done
                        ? "text-gray-700"
                        : "text-gray-300"
                    }`}
                  >
                    {step.label}
                  </p>
                  {active && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                {(done || active) && (
                  <p className={`text-xs mt-0.5 ${active ? "text-green-600" : "text-gray-400"}`}>
                    {step.desc}
                  </p>
                )}
                {dateLabel && (
                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{dateLabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cancel Confirmation Dialog ───────────────────────────────────────────────
function CancelDialog({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-1">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">Cancel this order?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            This action cannot be undone. Any payment made will be refunded within{" "}
            <span className="font-semibold text-gray-700">5–7 business days</span>.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <XCircle size={15} />
            )}
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onCancelled }: { order: Order; onCancelled: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { user } = useAuth();
  const currentStep = STATUS_TO_STEP[order.status] ?? 0;

  // Compute whether the cancel button should be shown
  const isCancellable = (() => {
    if (!CANCELLABLE_STATUSES.includes(order.status)) return false;
    const createdSec: number = order.createdAt?.seconds ?? 0;
    return Date.now() - createdSec * 1000 <= CANCEL_WINDOW_MS;
  })();

  // How many minutes remain in the window (for display)
  const minutesLeft = (() => {
    const createdSec: number = order.createdAt?.seconds ?? 0;
    const remaining = CANCEL_WINDOW_MS - (Date.now() - createdSec * 1000);
    return Math.max(0, Math.ceil(remaining / 60000));
  })();

  const handleCancelConfirm = async () => {
    if (!user) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, userId: user.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCancelDialog(false);
        onCancelled(order.id);
      } else {
        setCancelError(data.message ?? "Could not cancel. Please try again.");
        setShowCancelDialog(false);
      }
    } catch {
      setCancelError("Network error. Please try again.");
      setShowCancelDialog(false);
    } finally {
      setCancelling(false);
    }
  };

  const dateStr = order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Processing...";

  const timeStr = order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const itemCount = order.items?.length ?? 0;
  const extraCount = itemCount - 1;

  return (
    <>
      {showCancelDialog && (
        <CancelDialog
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelDialog(false)}
          loading={cancelling}
        />
      )}
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* ── Card Header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order</span>
              <span className="text-xs font-bold text-gray-700 font-mono">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {dateStr} {timeStr && `· ${timeStr}`}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Items preview */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {order.items?.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-xl border-2 border-white overflow-hidden bg-green-50 shrink-0"
                style={{ zIndex: 3 - i }}
              >
                <Image
                  src={item.image || "https://placehold.co/48x48/e8f5e9/2e7d32?text=🌱"}
                  alt={item.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/48x48/e8f5e9/2e7d32?text=🌱";
                  }}
                />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-12 h-12 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center shrink-0 z-0">
                <span className="text-xs font-bold text-gray-500">+{extraCount}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {order.items?.[0]?.name ?? "Order items"}
              {itemCount > 1 && (
                <span className="text-gray-400 font-normal"> & {itemCount - 1} more</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
              <span className="font-bold text-green-700">₹{order.total}</span>
            </p>
          </div>
        </div>

        {/* ── Delivery Timeline (non-cancelled) ── */}
        {currentStep >= 0 && (
          <DeliveryTimeline
            status={order.status}
            orderDate={order.createdAt?.seconds}
          />
        )}

        {/* Cancelled banner */}
        {order.status === "cancelled" && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <RotateCcw size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-600 font-medium">
              This order was cancelled. Any payment will be refunded within 5-7 business days.
            </p>
          </div>
        )}
      </div>

      {/* ── Expand toggle ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <span>{expanded ? "Hide details" : "View order details"}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* ── Expanded details ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50">
              <div className="divide-y divide-gray-50 mt-2">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-green-50 shrink-0 relative">
                        <Image
                          src={item.image || "https://placehold.co/40x40/e8f5e9/2e7d32?text=🌱"}
                          alt={item.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/40x40/e8f5e9/2e7d32?text=🌱";
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 shrink-0">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
                <span className="text-sm font-bold text-gray-700">Order Total</span>
                <span className="text-base font-extrabold text-green-700">₹{order.total}</span>
              </div>

              {/* Address */}
              {order.address && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {typeof order.address === "string"
                      ? order.address
                      : [
                          order.address.address,
                          order.address.city,
                          order.address.state,
                          order.address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                  </p>
                </div>
              )}

              {/* Cancel error */}
              {cancelError && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <XCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{cancelError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex gap-2 flex-wrap">
                {order.status === "delivered" && (
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-green-600 text-green-600 text-xs font-bold hover:bg-green-50 transition-colors">
                    <Star size={13} />
                    Rate & Review
                  </button>
                )}

                {/* Cancel button — shown only within the time window */}
                {isCancellable && (
                  <button
                    onClick={() => { setCancelError(null); setShowCancelDialog(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-300 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={13} />
                    Cancel Order
                  </button>
                )}

                <Link
                  href="/products"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors"
                >
                  <ShoppingBag size={13} />
                  Reorder
                </Link>
              </div>

              {/* Time-window hint for cancellable orders */}
              {isCancellable && (
                <p className="text-[10px] text-amber-600 mt-2 text-center font-medium">
                  ⏱ You can cancel this order for the next {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function OrderSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-28" />
          <div className="h-2.5 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex -space-x-2">
          <div className="w-12 h-12 rounded-xl bg-gray-200 border-2 border-white" />
          <div className="w-12 h-12 rounded-xl bg-gray-200 border-2 border-white" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      {/* Timeline skeleton */}
      <div className="pl-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 -ml-8">
            <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-2 bg-gray-200 rounded w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  // Optimistically update the cancelled order's status in local state
  const handleOrderCancelled = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
    );
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.log("Orders fetch error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filtered = orders.filter((o) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "delivered") return o.status === "delivered";
    if (activeFilter === "cancelled") return o.status === "cancelled";
    if (activeFilter === "active") return !["delivered", "cancelled"].includes(o.status);
    return true;
  });

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pb-10">
        {/* Sticky header */}
        <div className="sticky top-14 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 py-3">
              <Link href="/profile" className="text-gray-500 hover:text-gray-800 transition-colors md:hidden">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex-1">
                <h1 className="text-lg font-extrabold text-gray-900">My Orders</h1>
                {!loading && orders.length > 0 && (
                  <p className="text-xs text-gray-400">{orders.length} total orders</p>
                )}
              </div>
              <Package size={20} className="text-green-600" />
            </div>

            <div className="flex gap-1 pb-3 overflow-x-auto scrollbar-none">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.value === "all"
                    ? orders.length
                    : orders.filter((o) =>
                        tab.value === "active"
                          ? !["delivered", "cancelled"].includes(o.status)
                          : o.status === tab.value
                      ).length;

                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveFilter(tab.value)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${
                      activeFilter === tab.value
                        ? "bg-green-600 text-white border-green-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          activeFilter === tab.value
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          {/* Not logged in */}
          {!user && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <PackageOpen size={40} className="text-green-300" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-2">Login to view your orders</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Sign in to track your orders and manage your deliveries
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
              >
                Login to Continue <ChevronRight size={16} />
              </Link>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}
            </div>
          )}

          {/* No orders */}
          {!loading && user && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {/* Illustration */}
              <div className="relative mb-8">
                <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="90" cy="85" r="70" fill="#f0fdf4" />
                  {/* Box body */}
                  <rect x="50" y="75" width="80" height="60" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
                  {/* Box lid left flap */}
                  <path d="M50 75 L50 60 L90 60 L90 75" fill="#bbf7d0" stroke="#86efac" strokeWidth="1.5"/>
                  {/* Box lid right flap */}
                  <path d="M90 75 L90 60 L130 60 L130 75" fill="#a7f3d0" stroke="#86efac" strokeWidth="1.5"/>
                  {/* Tape strip */}
                  <rect x="78" y="58" width="24" height="6" rx="2" fill="#34d399"/>
                  {/* Stars / sparkles floating */}
                  <circle cx="40" cy="58" r="3" fill="#fde68a"/>
                  <circle cx="142" cy="62" r="2.5" fill="#fca5a5"/>
                  <circle cx="38" cy="85" r="2" fill="#86efac"/>
                  <circle cx="145" cy="90" r="3" fill="#a7f3d0"/>
                  {/* Arrow/delivery icon inside box */}
                  <path d="M75 100 L90 115 L105 100" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="90" y1="85" x2="90" y2="115" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Star top left */}
                  <path d="M38 40 L39.5 44 L43 44 L40.5 46.5 L41.5 50 L38 48 L34.5 50 L35.5 46.5 L33 44 L36.5 44Z" fill="#fde68a"/>
                  <path d="M143 40 L144 43 L147 43 L144.5 45 L145.5 48 L143 46.5 L140.5 48 L141.5 45 L139 43 L142 43Z" fill="#bbf7d0"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
              <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                Place your first order and get fresh produce delivered straight to your door from verified farmers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                >
                  <ShoppingBag size={16} /> Start Shopping
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 px-8 py-3 rounded-2xl font-semibold transition-all"
                >
                  🌱 See Fresh Picks
                </Link>
              </div>
            </div>
          )}

          {/* Filter empty */}
          {!loading && user && orders.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16">
              <Circle size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-semibold">No {activeFilter} orders</p>
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-3 text-sm text-green-600 hover:underline font-medium"
              >
                View all orders
              </button>
            </div>
          )}

          {/* Orders list */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} onCancelled={handleOrderCancelled} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}