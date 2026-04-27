"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import { ChevronRight, Zap, Leaf, Users } from "lucide-react";

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse min-w-[140px] w-[140px] md:w-auto">
      <div className="w-full pt-[75%] bg-gray-200" />
      <div className="p-2.5 space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-200 rounded w-1/2" />
        <div className="h-2 bg-gray-200 rounded w-2/3" />
        <div className="h-7 bg-gray-200 rounded-xl w-full mt-1" />
      </div>
    </div>
  );
}

function HorizontalSkeleton() {
  return (
    <div className="min-w-[260px] flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-2 bg-gray-200 rounded w-1/2" />
        <div className="h-2 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded-lg w-full mt-1" />
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 md:px-0 mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base md:text-lg font-bold text-gray-800">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-green-600 text-xs font-semibold hover:underline"
      >
        See all <ChevronRight size={14} />
      </Link>
    </div>
  );
}

// ─── Promo Strip ──────────────────────────────────────────────────────────────
function PromoStrip() {
  const perks = [
    { icon: "🚜", label: "Farm Direct" },
    { icon: "⚡", label: "Same Day" },
    { icon: "♻️", label: "Zero Waste" },
    { icon: "🔒", label: "Secure Pay" },
  ];
  return (
    <div className="flex items-center justify-around bg-green-700 py-2.5 px-3">
      {perks.map((p) => (
        <div key={p.label} className="flex items-center gap-1.5">
          <span className="text-base">{p.icon}</span>
          <span className="text-white text-[10px] font-semibold">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Top Farmer Card ──────────────────────────────────────────────────────────
function FarmerCard({ farmer }: { farmer: any }) {
  return (
    <Link href={`/products?farmer=${farmer.id}`} className="block">
      <div className="min-w-[120px] flex flex-col items-center gap-2 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-2xl shadow-inner overflow-hidden">
          {farmer.photoURL ? (
            <img src={farmer.photoURL} alt={farmer.name} className="w-full h-full object-cover" />
          ) : (
            "👨‍🌾"
          )}
        </div>
        <div>
          <p className="text-gray-800 text-xs font-bold leading-tight truncate max-w-[100px]">
            {farmer.name || "Local Farmer"}
          </p>
          <p className="text-green-600 text-[10px] font-medium">
            {farmer.productCount ?? "10"}+ products
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [dealProducts, setDealProducts] = useState<any[]>([]);
  const [freshProducts, setFreshProducts] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products for Best Deals (with discount / lower price sorted)
        const dealsSnap = await getDocs(
          query(collection(db, "products"), orderBy("price", "asc"), limit(10))
        );
        const deals = dealsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Simulate original price for demo if not present
          originalPrice: doc.data().originalPrice ?? Math.round(doc.data().price * 1.25),
        }));
        setDealProducts(deals);

        // Fetch fresh picks (most recent)
        const freshSnap = await getDocs(
          query(collection(db, "products"), orderBy("createdAt", "desc"), limit(8))
        );
        const fresh = freshSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          originalPrice: doc.data().originalPrice ?? Math.round(doc.data().price * 1.2),
        }));
        setFreshProducts(fresh);

        // Fetch top farmers (users with role=farmer)
        const farmersSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "farmer"), limit(8))
        );
        setFarmers(farmersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Navbar */}
      <Navbar />

      {/* Promo Strip */}
      <PromoStrip />

      {/* ── Banner Carousel ─────────────────────────── */}
      <div className="mt-0">
        <BannerCarousel />
      </div>

      <div className="max-w-5xl mx-auto px-0 md:px-4 space-y-7 mt-5">
        {/* ── Category Grid ───────────────────────────── */}
        <CategoryGrid />

        {/* ── Best Deals ──────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Zap size={18} className="text-orange-500" />}
            title="⚡ Best Deals"
            href="/products"
          />

          {/* Horizontal scrollable strip */}
          <div className="flex gap-3 overflow-x-auto pb-2 px-3 md:px-0 scrollbar-none snap-x snap-mandatory">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="snap-start flex-shrink-0 w-[140px] md:w-[160px]">
                    <ProductSkeleton />
                  </div>
                ))
              : dealProducts.map((product) => (
                  <div key={product.id} className="snap-start flex-shrink-0 w-[140px] md:w-[160px]">
                    <ProductCard
                      product={product}
                      onAddToCart={addToCart}
                      variant="grid"
                    />
                  </div>
                ))}
          </div>
        </section>

        {/* ── Flash Sale Banner ───────────────────────── */}
        <div className="mx-3 md:mx-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">
              Limited Time
            </p>
            <h3 className="text-white text-xl font-black mt-0.5">Flash Sale 🔥</h3>
            <p className="text-white/80 text-xs mt-0.5">Up to 60% off on fresh produce</p>
          </div>
          <Link
            href="/products"
            className="bg-white text-orange-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition-all active:scale-95 whitespace-nowrap"
          >
            Shop Now
          </Link>
        </div>

        {/* ── Fresh Picks ─────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Leaf size={18} className="text-green-600" />}
            title="🌿 Fresh Picks"
            href="/products"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 md:px-0">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              : freshProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    variant="grid"
                  />
                ))}
          </div>
        </section>

        {/* ── Top Farmers ─────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Users size={18} className="text-green-700" />}
            title="👨‍🌾 Top Farmers"
            href="/products"
          />

          <div className="flex gap-3 overflow-x-auto pb-2 px-3 md:px-0 scrollbar-none snap-x">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[120px] bg-white rounded-2xl p-3 border border-gray-100 animate-pulse"
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-200 mx-auto mb-2" />
                    <div className="h-2.5 bg-gray-200 rounded w-3/4 mx-auto" />
                    <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto mt-1.5" />
                  </div>
                ))
              : farmers.length > 0
              ? farmers.map((farmer) => (
                  <div key={farmer.id} className="snap-start flex-shrink-0">
                    <FarmerCard farmer={farmer} />
                  </div>
                ))
              : // Fallback demo farmers if none in DB
                [
                  { id: "1", name: "Ramu Kaka", productCount: 24 },
                  { id: "2", name: "Sunita Devi", productCount: 18 },
                  { id: "3", name: "Harish Yadav", productCount: 31 },
                  { id: "4", name: "Priya Farms", productCount: 15 },
                  { id: "5", name: "Green Valley", productCount: 42 },
                ].map((farmer) => (
                  <div key={farmer.id} className="snap-start flex-shrink-0">
                    <FarmerCard farmer={farmer} />
                  </div>
                ))}
          </div>
        </section>

        {/* ── Recently Added (Horizontal scroll) ──────── */}
        <section>
          <SectionHeader
            icon={<span className="text-base">🆕</span>}
            title="Just Arrived"
            href="/products"
          />

          <div className="flex gap-3 overflow-x-auto pb-2 px-3 md:px-0 scrollbar-none snap-x">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="snap-start flex-shrink-0">
                    <HorizontalSkeleton />
                  </div>
                ))
              : freshProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="snap-start flex-shrink-0">
                    <ProductCard
                      product={product}
                      onAddToCart={addToCart}
                      variant="horizontal"
                    />
                  </div>
                ))}
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────── */}
        <div className="mx-3 md:mx-0 text-center py-6 px-4 bg-green-50 rounded-2xl border border-green-100">
          <p className="text-green-800 font-bold text-lg mb-1">
            Are you a farmer? 🌾
          </p>
          <p className="text-green-600 text-sm mb-4">
            List your produce and reach thousands of buyers directly
          </p>
          <Link
            href="/farmer/dashboard"
            className="inline-block bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-800 transition-all active:scale-95"
          >
            Start Selling
          </Link>
        </div>
      </div>

      {/* Hide scrollbars */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}