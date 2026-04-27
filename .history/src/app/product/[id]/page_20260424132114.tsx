"use client";

import { use, useEffect, useState, useRef, Suspense } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Package,
  Tag,
  Layers,
  ArrowLeft,
  Star,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";

type Props = {
  params: Promise<{ id: string }>;
};

// ── Star Rating Display ────────────────────────────────────────────────────────
function StarRating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const partial = !filled && rating > star - 1;
          return (
            <span key={star} className="relative inline-block">
              <Star size={18} className="text-gray-200" fill="currentColor" />
              {(filled || partial) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : `${(rating - (star - 1)) * 100}%` }}
                >
                  <Star size={18} className="text-yellow-400" fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-400">({reviewCount.toLocaleString()} reviews)</span>
      )}
    </div>
  );
}

// ── Farmer Verification Badge ─────────────────────────────────────────────────
function FarmerBadge({ farmerName, isVerified }: { farmerName: string; isVerified?: boolean }) {
  return (
    <div className="mt-5 flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <Package size={18} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">Sold by</p>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-800 text-sm truncate">{farmerName}</span>
          {isVerified && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium shrink-0">
              <BadgeCheck size={11} />
              Verified Farmer
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image Gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative group rounded-xl overflow-hidden bg-gray-50">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={images[activeIdx]}
            alt={`${productName} - image ${activeIdx + 1}`}
            className="w-full h-[340px] object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/600x400?text=Product";
            }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === activeIdx ? "bg-green-600 w-4" : "w-2 bg-white/70"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                i === activeIdx ? "border-green-500 shadow-md" : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt={`thumb ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80?text=img";
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Customers Also Bought ──────────────────────────────────────────────────────
function CustomersAlsoBought({
  currentProductId,
  category,
}: {
  currentProductId: string;
  category?: string;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        let q;
        if (category) {
          q = query(
            collection(db, "products"),
            where("category", "==", category),
            limit(8)
          );
        } else {
          q = query(collection(db, "products"), limit(8));
        }
        const snap = await getDocs(q);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.id !== currentProductId)
          .slice(0, 6);
        setProducts(items);
      } catch (err) {
        console.error("Failed to fetch related products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [currentProductId, category]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Customers Also Bought</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
            ))
          : products.map((p: any) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image}
                unit={p.unit}
                category={p.category}
                rating={p.rating}
                reviewCount={p.reviewCount}
                originalPrice={p.originalPrice}
                isFeatured={p.isFeatured}
                stock={p.stock}
              />
            ))}
      </div>
    </section>
  );
}

// ── Sticky Buy Bar (mobile) ───────────────────────────────────────────────────
function StickyBuyBar({
  product,
  onAddToCart,
  onWishlist,
  wishlisted,
  sentinelRef,
}: {
  product: any;
  onAddToCart: () => void;
  onWishlist: () => void;
  wishlisted: boolean;
  sentinelRef: React.RefObject<HTMLDivElement>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">{product.name}</p>
              <p className="text-green-600 font-bold text-lg leading-tight">
                ₹{product.price}
                {product.unit && (
                  <span className="text-xs font-normal text-gray-400"> /{product.unit}</span>
                )}
              </p>
            </div>
            <button
              onClick={onWishlist}
              className={`p-2.5 rounded-xl border transition ${
                wishlisted
                  ? "border-red-400 bg-red-50 text-red-500"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onAddToCart}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Inner component ────────────────────────────────────────────────────────────
function ProductDetailsContent({ id }: { id: string }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const wishlisted = isWishlisted(id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      localStorage.setItem(
        "pendingCartItem",
        JSON.stringify({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: qty })
      );
      setShowLoginModal(true);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
    });
    emitAddToCart({ image: product.image });
    toast.success(`${product.name} added to cart 🛒`);
  };

  const handleLoginSuccess = () => {
    const pending = localStorage.getItem("pendingCartItem");
    if (pending) {
      try {
        const item = JSON.parse(pending);
        addToCart(item);
        emitAddToCart({ image: item.image });
        localStorage.removeItem("pendingCartItem");
        toast.success(`${item.name} added to cart 🛒`);
      } catch (_) {
        localStorage.removeItem("pendingCartItem");
      }
    }
  };

  const handleWishlist = () => {
    if (!product) return;
    if (wishlisted) {
      removeFromWishlist(id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      toast.success("Added to wishlist ❤️");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-6xl mx-auto p-6 md:p-10">
          <div className="grid md:grid-cols-2 gap-10 bg-white p-6 rounded-2xl shadow animate-pulse">
            <div>
              <div className="bg-gray-200 h-[340px] rounded-xl mb-3" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 w-16 h-16 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-200 h-8 rounded w-3/4" />
              <div className="bg-gray-200 h-6 rounded w-1/3" />
              <div className="bg-gray-200 h-4 rounded w-full" />
              <div className="bg-gray-200 h-4 rounded w-5/6" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="max-w-6xl mx-auto p-6 md:p-10 text-center">
          <div className="py-20">
            <Package size={56} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Product not found</h2>
            <p className="text-gray-400 mb-6">
              This product may have been removed or doesn't exist.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              <ArrowLeft size={16} /> Browse Products
            </Link>
          </div>
        </main>
      </>
    );
  }

  const galleryImages: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || "https://via.placeholder.com/600x400?text=Product"];

  const rating = product.rating ?? 4.2;
  const reviewCount = product.reviewCount;
  const isVerifiedFarmer = product.isVerifiedFarmer ?? product.farmerVerified ?? false;

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 md:p-10 pb-24 md:pb-10">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-green-600 transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-green-600 transition">Products</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-10 bg-white p-5 md:p-8 rounded-2xl shadow"
        >
          {/* LEFT: IMAGE GALLERY */}
          <div className="relative">
            <ImageGallery images={galleryImages} productName={product.name} />
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition z-10 ${
                wishlisted
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-400 hover:text-red-500"
              }`}
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* RIGHT: DETAILS */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* RATING */}
            <StarRating rating={rating} reviewCount={reviewCount} />

            {/* PRICE */}
            <div className="flex items-baseline gap-3 mt-4">
              <p className="text-green-600 text-2xl font-bold">
                ₹{product.price}
                {product.unit && (
                  <span className="text-base font-normal text-gray-500"> / {product.unit}</span>
                )}
              </p>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-gray-400 line-through text-base">₹{product.originalPrice}</span>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* METADATA BADGES */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.category && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                  <Tag size={13} /> {product.category}
                </span>
              )}
              {product.stock !== undefined && product.stock !== null && product.stock > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200">
                  <Layers size={13} />
                  {product.stock} in stock
                </span>
              )}
            </div>

            <p className="mt-4 text-gray-600 text-sm leading-relaxed">
              {product.description || "Fresh product directly from verified farmers."}
            </p>

            {/* QUANTITY SELECTOR */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Qty:</span>
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock > 0 ? product.stock : 99, qty + 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
              >
                +
              </button>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                <ShoppingCart size={18} /> Add to Cart 🛒
              </button>
              <button
                onClick={handleWishlist}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`p-3 rounded-xl border-2 transition ${
                  wishlisted
                    ? "border-red-500 bg-red-50 text-red-500"
                    : "border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {/* SENTINEL for sticky bar */}
            <div ref={sentinelRef} className="h-1" />

            {/* FARMER BADGE */}
            {product.farmerName && (
              <FarmerBadge
                farmerName={product.farmerName}
                isVerified={isVerifiedFarmer}
              />
            )}

            {/* TRUST SIGNALS */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, label: "Quality\nAssured" },
                { icon: Truck, label: "Free\nDelivery" },
                { icon: RotateCcw, label: "Easy\nReturns" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center"
                >
                  <Icon size={20} className="text-green-600" />
                  <span className="text-xs text-gray-500 font-medium whitespace-pre-line leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CUSTOMERS ALSO BOUGHT */}
        <CustomersAlsoBought
          currentProductId={id}
          category={product.category}
        />
      </main>

      {/* STICKY BUY BAR (mobile) */}
      {product && (
        <StickyBuyBar
          product={product}
          onAddToCart={handleAddToCart}
          onWishlist={handleWishlist}
          wishlisted={wishlisted}
          sentinelRef={sentinelRef}
        />
      )}

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

function ProductDetailsWrapper({ params }: Props) {
  const { id } = use(params);
  return <ProductDetailsContent id={id} />;
}

export default function ProductDetails(props: Props) {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="max-w-6xl mx-auto p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-10 bg-white p-6 rounded-2xl shadow animate-pulse">
              <div className="bg-gray-200 h-[350px] rounded-xl" />
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded w-3/4" />
                <div className="bg-gray-200 h-6 rounded w-1/3" />
                <div className="bg-gray-200 h-4 rounded w-full" />
                <div className="bg-gray-200 h-4 rounded w-5/6" />
              </div>
            </div>
          </main>
        </>
      }
    >
      <ProductDetailsWrapper params={props.params} />
    </Suspense>
  );
}