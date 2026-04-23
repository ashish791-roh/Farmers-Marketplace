"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = {
  id: string;
  items: any[];
  total: number;
  status: string;
  createdAt: any;
  address?: any;
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode; step: number }
> = {
  pending: {
    label: "Order Placed",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Clock size={13} />,
    step: 0,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <CheckCircle2 size={13} />,
    step: 1,
  },
  paid: {
    label: "Payment Done",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle2 size={13} />,
    step: 1,
  },
  processing: {
    label: "Processing",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: <Package size={13} />,
    step: 1,
  },
  shipped: {
    label: "Shipped",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Truck size={13} />,
    step: 2,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: <Truck size={13} />,
    step: 3,
  },
  delivered: {
    label: "Delivered",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle2 size={13} />,
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <RotateCcw size={13} />,
    step: -1,
  },
};

const fallback = {
  label: "Processing",
  color: "text-gray-700",
  bg: "bg-gray-50",
  border: "border-gray-200",
  icon: <Clock size={13} />,
  step: 1,
};

// ─── Delivery Timeline ────────────────────────────────────────────────────────
function DeliveryTimeline({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? fallback;
  const currentStep = cfg.step;

  if (currentStep === -1) return null; // cancelled — don't show timeline

  const steps = [
    { label: "Order Placed", icon: <ShoppingBag size={14} /> },
    { label: "Processing", icon: <Package size={14} /> },
    { label: "Shipped", icon: <Truck size={14} /> },
    { label: "Out for Delivery", icon: <MapPin size={14} /> },
    { label: "Delivered", icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div className="mt-4 px-1">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-100 z-0" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-green-500 z-0 transition-all duration-700"
          style={{ width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%` }}
        />

        {steps.map((step, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <div key={i} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  done
                    ? active
                      ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-200"
                      : "bg-green-500 border-green-500 text-white"
                    : "bg-white border-gray-200 text-gray-300"
                }`}
              >
                {step.icon}
              </div>
              <p
                className={`text-[9px] mt-1.5 font-semibold text-center leading-tight max-w-[50px] ${
                  done ? "text-green-700" : "text-gray-300"
                } ${active ? "text-green-800 font-bold" : ""}`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? fallback;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold capitalize px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? fallback;

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

  // Show first item's image as the card hero
  const heroImage = order.items?.[0]?.image;
  const itemCount = order.items?.length ?? 0;
  const extraCount = itemCount - 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* ── Card Header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Order meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Order
              </span>
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

        {/* ── Items preview row ── */}
        <div className="flex items-center gap-3">
          {/* Image stack */}
          <div className="flex -space-x-2">
            {order.items?.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-xl border-2 border-white overflow-hidden bg-green-50 shrink-0"
                style={{ zIndex: 3 - i }}
              >
                <img
                  src={item.image || "https://placehold.co/48x48/e8f5e9/2e7d32?text=🌱"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/48x48/e8f5e9/2e7d32?text=🌱";
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

          {/* Summary */}
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

        {/* ── Delivery timeline (for non-cancelled) ── */}
        {cfg.step >= 0 && <DeliveryTimeline status={order.status} />}
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
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="divide-y divide-gray-50 mt-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-green-50 shrink-0">
                    <img
                      src={item.image || "https://placehold.co/40x40/e8f5e9/2e7d32?text=🌱"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/40x40/e8f5e9/2e7d32?text=🌱";
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

          {/* Total row */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
            <span className="text-sm font-bold text-gray-700">Order Total</span>
            <span className="text-base font-extrabold text-green-700">₹{order.total}</span>
          </div>

          {/* Address if available */}
          {order.address && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 flex items-start gap-2">
              <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                {typeof order.address === "string"
                  ? order.address
                  : [order.address.address, order.address.city, order.address.state, order.address.pincode]
                      .filter(Boolean)
                      .join(", ")}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            {order.status === "delivered" && (
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-green-600 text-green-600 text-xs font-bold hover:bg-green-50 transition-colors">
                <Star size={13} />
                Rate & Review
              </button>
            )}
            {(order.status === "pending" || order.status === "confirmed") && (
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-300 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
                <RotateCcw size={13} />
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
        </div>
      )}
    </div>
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
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <div className="w-12 h-12 rounded-xl bg-gray-200 border-2 border-white" />
          <div className="w-12 h-12 rounded-xl bg-gray-200 border-2 border-white" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="h-2 bg-gray-200 rounded w-8" />
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
    if (activeFilter === "active")
      return !["delivered", "cancelled"].includes(o.status);
    return true;
  });

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pb-10">
        {/* ── Sticky header ── */}
        <div className="sticky top-14 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            {/* Title row */}
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

            {/* Filter tabs */}
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

          {/* ── Not logged in ── */}
          {!user && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <PackageOpen size={40} className="text-green-300" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-2">
                Login to view your orders
              </h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Sign in to track your orders and manage your deliveries
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
              >
                Login to Continue
                <ChevronRight size={16} />
              </Link>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <OrderSkeleton key={i} />
              ))}
            </div>
          )}

          {/* ── No orders ── */}
          {!loading && user && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <PackageOpen size={40} className="text-green-300" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-2">No orders yet</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Place your first order and get fresh produce delivered to your door
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
              >
                <ShoppingBag size={16} />
                Start Shopping
              </Link>
            </div>
          )}

          {/* ── Filtered empty ── */}
          {!loading && user && orders.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16">
              <Circle size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-semibold">
                No {activeFilter} orders
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-3 text-sm text-green-600 hover:underline font-medium"
              >
                View all orders
              </button>
            </div>
          )}

          {/* ── Orders list ── */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} />
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