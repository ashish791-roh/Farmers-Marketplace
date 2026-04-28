"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  ShoppingCart,
  PackageOpen,
  Trash2,
  Plus,
  Minus,
  Tag,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Leaf,
  Zap,
} from "lucide-react";

// ── Savings pill ───────────────────────────────────────────────────────────────
function SavingsPill({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Tag size={14} className="text-green-600" />
        <span className="text-green-700 text-sm font-semibold">
          You're saving ₹{amount} on this order!
        </span>
      </div>
      <span className="text-green-500 text-xs font-bold">🎉</span>
    </div>
  );
}

// ── Trust strip ────────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: <Truck size={14} className="text-green-600" />, text: "Free Delivery above ₹499" },
    { icon: <ShieldCheck size={14} className="text-blue-600" />, text: "100% Secure Checkout" },
    { icon: <RotateCcw size={14} className="text-orange-500" />, text: "7-Day Easy Returns" },
    { icon: <Leaf size={14} className="text-emerald-600" />, text: "Farm Direct Products" },
  ];

  return (
    <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-none">
      {items.map((item) => (
        <div
          key={item.text}
          className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 shrink-0 border border-gray-100"
        >
          {item.icon}
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Coupon section ─────────────────────────────────────────────────────────────
function CouponSection() {
  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const COUPONS: Record<string, string> = {
    FARM10: "10% off on your first order",
    FRESH20: "₹20 off on orders above ₹299",
    ORGANIC15: "15% off on organic products",
  };

  const handleApply = () => {
    const code = couponInput.trim().toUpperCase();
    if (COUPONS[code]) {
      setApplied(code);
      setOpen(false);
    } else {
      setApplied(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
            <Tag size={14} className="text-orange-500" />
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {applied ? (
              <span className="text-green-600">Coupon Applied: {applied}</span>
            ) : (
              "Apply Coupon / Promo Code"
            )}
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
            <button
              onClick={handleApply}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-400 font-medium">Available coupons:</p>
            {Object.entries(COUPONS).map(([code, desc]) => (
              <div
                key={code}
                className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2"
              >
                <div>
                  <span className="text-green-700 text-xs font-extrabold tracking-widest">
                    {code}
                  </span>
                  <p className="text-gray-500 text-[10px] mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => {
                    setCouponInput(code);
                    setApplied(code);
                    setOpen(false);
                  }}
                  className="text-green-600 text-xs font-bold hover:text-green-700"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cart Item Card ─────────────────────────────────────────────────────────────
function CartItem({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: any;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item.id), 300);
  };

  // CartItem type doesn't include originalPrice/unit, cast for extended fields
  const anyItem = item as any;
  const originalPrice = anyItem.originalPrice ?? Math.round(item.price * 1.2);
  const savings = originalPrice > item.price ? originalPrice - item.price : 0;

  return (
    <div
      className={`transition-all duration-300 ${
        removing ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      <div className="flex gap-3 py-4">
        {/* Image */}
        <Link href={`/product/${item.id}`} className="shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-gray-100 border border-gray-100">
            <img
              src={item.image || "https://placehold.co/96x96/e8f5e9/2e7d32?text=🌱"}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/96x96/e8f5e9/2e7d32?text=🌱";
              }}
            />
          </div>
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <Link href={`/product/${item.id}`}>
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-green-700 transition-colors">
              {item.name}
            </h3>
          </Link>

          {anyItem.unit && (
            <p className="text-xs text-gray-400 mt-0.5">Per {anyItem.unit}</p>
          )}

          {/* Price row */}
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-green-700 font-extrabold text-base">
              ₹{item.price}
            </span>
            {savings > 0 && (
              <>
                <span className="text-gray-400 text-xs line-through">
                  ₹{originalPrice}
                </span>
                <span className="text-orange-500 text-[10px] font-bold">
                  {Math.round((savings / originalPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* Subtotal */}
          <p className="text-xs text-gray-500 mt-0.5">
            Subtotal:{" "}
            <span className="font-semibold text-gray-700">
              ₹{item.price * item.quantity}
            </span>
          </p>

          {/* Controls row */}
          <div className="flex items-center justify-between mt-3">
            {/* Qty stepper */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                disabled={item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:text-gray-300 transition-colors"
              >
                <Minus size={13} />
              </button>
              <span className="w-9 h-8 flex items-center justify-center text-sm font-bold text-gray-800 border-x border-gray-200">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Remove */}
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium transition-colors px-2 py-1 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={13} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Price Breakdown ────────────────────────────────────────────────────────────
function PriceBreakdown({ cart }: { cart: any[] }) {
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.originalPrice ?? Math.round(item.price * 1.2)) * item.quantity,
    0
  );
  const discount = cart.reduce((sum, item) => {
    const original = item.originalPrice ?? Math.round(item.price * 1.2);
    return sum + (original - item.price) * item.quantity;
  }, 0);
  const delivery = subtotal - discount > 499 ? 0 : 49;
  const total = subtotal - discount + delivery;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
        Price Details
      </h3>

      <div className="space-y-2.5">
        {[
          {
            label: `Price (${cart.reduce((s, i) => s + i.quantity, 0)} items)`,
            value: `₹${subtotal}`,
            valueClass: "text-gray-700",
          },
          {
            label: "Discount",
            value: `−₹${Math.round(discount)}`,
            valueClass: "text-green-600 font-semibold",
          },
          {
            label: "Delivery Charges",
            value: delivery === 0 ? "FREE" : `₹${delivery}`,
            valueClass: delivery === 0 ? "text-green-600 font-semibold" : "text-gray-700",
            sub: delivery === 0 ? "🎉 Free delivery applied" : "Add ₹" + (499 - (subtotal - discount)) + " more for free delivery",
          },
        ].map((row) => (
          <div key={row.label} className="flex items-start justify-between">
            <div>
              <span className="text-sm text-gray-600">{row.label}</span>
              {row.sub && (
                <p className="text-[10px] text-green-600 mt-0.5">{row.sub}</p>
              )}
            </div>
            <span className={`text-sm ${row.valueClass}`}>{row.value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
        <span className="font-bold text-gray-900">Total Amount</span>
        <span className="text-lg font-extrabold text-gray-900">₹{Math.round(total)}</span>
      </div>

      {discount > 0 && (
        <div className="bg-green-50 rounded-xl px-3 py-2.5 text-center">
          <span className="text-green-700 text-sm font-semibold">
            You will save ₹{Math.round(discount)} on this order
          </span>
        </div>
      )}
    </div>
  );
}

// ── Empty Cart ─────────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-28 h-28 rounded-full bg-green-50 flex items-center justify-center mb-6">
        <PackageOpen size={48} className="text-green-300" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-800 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
        Looks like you haven't added anything yet. Explore fresh produce from local farmers!
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-2xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
      >
        <Zap size={16} />
        Shop Now
      </Link>
      <Link
        href="/"
        className="mt-3 text-green-600 text-sm font-medium hover:underline"
      >
        Back to Home
      </Link>
    </div>
  );
}

// ── Main Cart Page ─────────────────────────────────────────────────────────────
export default function CartPage() {
  const { cart, removeFromCart, updateQty } = useCart();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(false);
  }, []);

  const total =
    cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  const totalSavings = cart?.reduce((sum, item) => {
    const original = (item as any).originalPrice ?? Math.round(item.price * 1.2);
    return sum + (original - item.price) * item.quantity;
  }, 0) || 0;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-3 md:px-6 py-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pb-32 md:pb-10">
        {/* ── Mobile top bar ── */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-14 z-20">
          <button onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-gray-900 text-base flex-1">
            My Cart
            {cart && cart.length > 0 && (
              <span className="text-gray-400 font-normal text-sm ml-1.5">
                ({cart.length} {cart.length === 1 ? "item" : "items"})
              </span>
            )}
          </h1>
        </div>

        <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-6">
          {/* Desktop title */}
          <div className="hidden md:flex items-center gap-3 mb-6">
            <ShoppingCart size={24} className="text-green-600" />
            <h1 className="text-2xl font-extrabold text-gray-900">My Cart</h1>
            {cart && cart.length > 0 && (
              <span className="text-gray-400 font-normal text-lg">
                ({cart.length} {cart.length === 1 ? "item" : "items"})
              </span>
            )}
          </div>

          {!cart || cart.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="flex flex-col md:flex-row gap-4 items-start">

              {/* ── Left column: Items + Coupon ── */}
              <div className="flex-1 w-full space-y-3">

                {/* Trust strip */}
                <TrustStrip />

                {/* Cart items card */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Select all header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <span className="text-sm font-bold text-gray-700">
                      {cart.length} {cart.length === 1 ? "item" : "items"} in your cart
                    </span>
                    <Link
                      href="/products"
                      className="text-green-600 text-xs font-semibold hover:text-green-700 flex items-center gap-0.5"
                    >
                      Add more <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-gray-50 px-4">
                    {cart.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQty={updateQty}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                </div>

                {/* Savings pill */}
                <SavingsPill amount={Math.round(totalSavings)} />

                {/* Coupon */}
                <CouponSection />
              </div>

              {/* ── Right column: Price summary (desktop) ── */}
              <div className="hidden md:block w-80 shrink-0 sticky top-24 space-y-3">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <PriceBreakdown cart={cart} />
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white py-3.5 rounded-2xl font-extrabold text-base transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Proceed to Checkout
                  <ChevronRight size={18} />
                </button>

                <p className="text-center text-xs text-gray-400">
                  <ShieldCheck size={12} className="inline mr-1" />
                  Safe and Secure Payments. Easy returns.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      {cart && cart.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-2xl">
          {/* Mini price breakdown */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {cart.reduce((s, i) => s + i.quantity, 0)} items · Subtotal
              </p>
              <p className="text-lg font-extrabold text-gray-900">
                ₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
              </p>
            </div>
            {totalSavings > 0 && (
              <div className="bg-green-50 px-2.5 py-1 rounded-lg">
                <p className="text-green-600 text-xs font-bold">
                  Save ₹{Math.round(totalSavings)}
                </p>
              </div>
            )}
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={() => router.push("/checkout")}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white py-3.5 rounded-2xl font-extrabold text-base transition-all duration-200"
            >
              Proceed to Checkout
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}