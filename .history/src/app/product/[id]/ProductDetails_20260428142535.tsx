"use client";

import { use, useEffect, useState, useRef, Suspense } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
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
  ThumbsUp,
  MessageSquare,
  Send,
  ChevronDown,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Review = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
  helpful: number;
  helpfulBy?: string[];
  verifiedPurchase?: boolean;
};

// ── Star Rating Display ────────────────────────────────────────────────────────
function StarRating({
  rating,
  reviewCount,
  size = 18,
}: {
  rating: number;
  reviewCount?: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const partial = !filled && rating > star - 1;
          return (
            <span key={star} className="relative inline-block">
              <Star size={size} className="text-gray-200" fill="currentColor" />
              {(filled || partial) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    width: filled ? "100%" : `${(rating - (star - 1)) * 100}%`,
                  }}
                >
                  <Star size={size} className="text-yellow-400" fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-400">
          ({reviewCount.toLocaleString()} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

// ── Interactive Star Selector ──────────────────────────────────────────────────
function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={28}
            className={
              (hover || value) >= star ? "text-yellow-400" : "text-gray-200"
            }
            fill="currentColor"
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500 font-medium">
        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hover || value] || "Select rating"}
      </span>
    </div>
  );
}

// ── Rating Breakdown Bar ───────────────────────────────────────────────────────
function RatingBreakdown({
  reviews,
  avgRating,
}: {
  reviews: Review[];
  avgRating: number;
}) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 p-5 bg-amber-50 rounded-2xl border border-amber-100">
      {/* Big average */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-5xl font-extrabold text-gray-900">
          {avgRating.toFixed(1)}
        </span>
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={14}
              fill="currentColor"
              className={s <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-200"}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 mt-1">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Bars */}
      <div className="flex-1 w-full space-y-1.5">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-5 text-right">{star}</span>
            <Star size={11} fill="currentColor" className="text-yellow-400 shrink-0" />
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-yellow-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(count / max) * 100}%` }}
                transition={{ duration: 0.6, delay: (5 - star) * 0.07 }}
              />
            </div>
            <span className="text-xs text-gray-400 w-6">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Write a Review Form ────────────────────────────────────────────────────────
function WriteReviewForm({
  productId,
  user,
  existingReview,
  onSuccess,
}: {
  productId: string;
  user: any;
  existingReview: Review | null;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      // Check verified purchase
      const ordersSnap = await getDocs(
        query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          where("status", "in", ["delivered", "paid", "confirmed", "processing"])
        )
      );
      const isVerified = ordersSnap.docs.some((d) =>
        (d.data().items || []).some((item: any) => item.id === productId)
      );

      const reviewData = {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        helpful: existingReview?.helpful ?? 0,
        helpfulBy: existingReview?.helpfulBy ?? [],
        verifiedPurchase: isVerified,
      };

      if (existingReview) {
        await updateDoc(
          doc(db, "products", productId, "reviews", existingReview.id),
          reviewData
        );
        toast.success("Review updated ✅");
      } else {
        await addDoc(collection(db, "products", productId, "reviews"), reviewData);
        toast.success("Review submitted 🌟");
      }

      // ── Persist avg rating + count back to the product doc ──────────────
      // This lets ProductCard on the homepage/listing pages show real ratings
      // without having to fetch each product's reviews subcollection.
      try {
        const allReviewsSnap = await getDocs(
          collection(db, "products", productId, "reviews")
        );
        const allRatings = allReviewsSnap.docs.map((d) => (d.data().rating as number) || 0);
        const newCount = allRatings.length;
        const newAvg = newCount > 0
          ? Math.round((allRatings.reduce((s, r) => s + r, 0) / newCount) * 10) / 10
          : 0;
        await updateDoc(doc(db, "products", productId), {
          avgRating: newAvg,
          reviewCount: newCount,
        });
      } catch (_) {
        // Non-fatal — product listing will still compute live in detail page
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
    >
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare size={16} className="text-green-600" />
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">Your rating</label>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">Your review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience with this product…"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none transition"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
      >
        <Send size={14} />
        {submitting ? "Submitting…" : existingReview ? "Update Review" : "Submit Review"}
      </button>
    </motion.div>
  );
}

// ── Single Review Card ─────────────────────────────────────────────────────────
function ReviewCard({
  review,
  currentUserId,
  productId,
}: {
  review: Review;
  currentUserId?: string;
  productId: string;
}) {
  const [markingHelpful, setMarkingHelpful] = useState(false);
  const hasMarked = currentUserId
    ? (review.helpfulBy ?? []).includes(currentUserId)
    : false;

  const markHelpful = async () => {
    if (!currentUserId || hasMarked) return;
    setMarkingHelpful(true);
    try {
      await updateDoc(doc(db, "products", productId, "reviews", review.id), {
        helpful: (review.helpful ?? 0) + 1,
        helpfulBy: [...(review.helpfulBy ?? []), currentUserId],
      });
    } catch {
      toast.error("Could not mark as helpful");
    } finally {
      setMarkingHelpful(false);
    }
  };

  const initials = review.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const date = review.createdAt?.toDate
    ? review.createdAt.toDate().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-xs text-green-700 shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-800">
                {review.userName}
              </span>
              {review.verifiedPurchase && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck size={9} /> Verified Purchase
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        </div>
        {/* Stars */}
        <div className="flex gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={13}
              fill="currentColor"
              className={s <= review.rating ? "text-yellow-400" : "text-gray-200"}
            />
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{review.comment}</p>

      {/* Helpful */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={markHelpful}
          disabled={!currentUserId || hasMarked || markingHelpful}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
            hasMarked
              ? "border-green-400 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          <ThumbsUp size={11} />
          Helpful {review.helpful > 0 && `(${review.helpful})`}
        </button>
      </div>
    </motion.div>
  );
}

// ── Reviews Section ────────────────────────────────────────────────────────────
type SortOption = "newest" | "oldest" | "highest" | "lowest" | "most_helpful";

function ReviewsSection({
  productId,
  user,
}: {
  productId: string;
  user: any;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW = 3;

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, "products", productId, "reviews"),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        setReviews(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, [productId]);

  const myReview = user
    ? reviews.find((r) => r.userId === user.uid) ?? null
    : null;

  const sorted = [...reviews].sort((a, b) => {
    if (sortBy === "newest")
      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    if (sortBy === "oldest")
      return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    if (sortBy === "most_helpful") return (b.helpful ?? 0) - (a.helpful ?? 0);
    return 0;
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_SHOW);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star size={18} className="text-yellow-400" fill="currentColor" />
          Customer Reviews
          {reviews.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-1">
              ({reviews.length})
            </span>
          )}
        </h2>

        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-green-600 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-50 transition"
          >
            <MessageSquare size={14} />
            {myReview ? "Edit Review" : "Write Review"}
          </button>
        )}
      </div>

      {/* Rating breakdown */}
      {reviews.length > 0 && (
        <RatingBreakdown reviews={reviews} avgRating={avgRating} />
      )}

      {/* Write / Edit form */}
      <AnimatePresence>
        {showForm && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <WriteReviewForm
              productId={productId}
              user={user}
              existingReview={myReview}
              onSuccess={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!user && (
        <p className="mt-4 text-sm text-gray-500 italic bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          Please sign in to write a review.
        </p>
      )}

      {/* Sort controls */}
      {reviews.length > 1 && (
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Sort by:</span>
          {(
            [
              ["newest", "Newest"],
              ["highest", "Highest rated"],
              ["lowest", "Lowest rated"],
              ["most_helpful", "Most helpful"],
            ] as [SortOption, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSortBy(val)}
              className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                sortBy === val
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-200 text-gray-500 hover:border-green-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="mt-5 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-6 text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <Star size={32} className="mx-auto text-gray-300 mb-2" fill="currentColor" />
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {visible.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.uid}
              productId={productId}
            />
          ))}

          {sorted.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-green-600 border border-green-200 py-3 rounded-xl hover:bg-green-50 transition"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${showAll ? "rotate-180" : ""}`}
              />
              {showAll
                ? "Show fewer reviews"
                : `Show all ${sorted.length} reviews`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ── Farmer Verification Badge ─────────────────────────────────────────────────
function FarmerBadge({
  farmerName,
  isVerified,
}: {
  farmerName: string;
  isVerified?: boolean;
}) {
  return (
    <div className="mt-5 flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <Package size={18} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">Sold by</p>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-800 text-sm truncate">
            {farmerName}
          </span>
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
function ImageGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () =>
    setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () =>
    setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));

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
              e.currentTarget.src =
                "https://via.placeholder.com/600x400?text=Product";
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
                  className={`h-2 rounded-full transition-all ${
                    i === activeIdx ? "bg-green-600 w-4" : "w-2 bg-white/70"
                  }`}
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
                i === activeIdx
                  ? "border-green-500 shadow-md"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt={`thumb ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/80x80?text=img";
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
  const [products, setProducts] = useState<Product[]>([]);
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
          .map((d) => ({ id: d.id, ...d.data() } as Product))
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
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Customers Also Bought
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-52 animate-pulse"
              />
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
  sentinelRef: React.RefObject<HTMLDivElement | null>;
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
                  <span className="text-xs font-normal text-gray-400">
                    {" "}
                    /{product.unit}
                  </span>
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

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Real-time average rating from reviews subcollection
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [liveReviewCount, setLiveReviewCount] = useState<number>(0);

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

  // Listen to reviews for live avg rating
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "products", id, "reviews")),
      (snap) => {
        const reviews = snap.docs.map((d) => d.data() as Review);
        setLiveReviewCount(reviews.length);
        if (reviews.length > 0) {
          setLiveRating(
            reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          );
        } else {
          setLiveRating(null);
        }
      }
    );
    return () => unsub();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      localStorage.setItem(
        "pendingCartItem",
        JSON.stringify({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: qty,
        })
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
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              Product not found
            </h2>
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

  // Use live rating if available, fallback to product.rating
  const displayRating =
    liveRating !== null ? liveRating : product.rating ?? 4.2;
  const displayReviewCount =
    liveReviewCount > 0 ? liveReviewCount : product.reviewCount;
  const isVerifiedFarmer =
    product.isVerifiedFarmer ?? product.farmerVerified ?? false;

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 md:p-10 pb-24 md:pb-10">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-green-600 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-green-600 transition">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">
            {product.name}
          </span>
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
              aria-label={
                wishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* LIVE RATING */}
            <StarRating
              rating={displayRating}
              reviewCount={displayReviewCount}
            />

            {/* PRICE */}
            <div className="flex items-baseline gap-3 mt-4">
              <p className="text-green-600 text-2xl font-bold">
                ₹{product.price}
                {product.unit && (
                  <span className="text-base font-normal text-gray-500">
                    {" "}
                    / {product.unit}
                  </span>
                )}
              </p>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-gray-400 line-through text-base">
                    ₹{product.originalPrice}
                  </span>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100
                    )}
                    % OFF
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
              {product.stock !== undefined &&
                product.stock !== null &&
                product.stock > 0 && (
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
                onClick={() =>
                  setQty(
                    Math.min(
                      product.stock > 0 ? product.stock : 99,
                      qty + 1
                    )
                  )
                }
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
                aria-label={
                  wishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
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

        {/* ── REVIEWS SECTION (new) ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow p-5 md:p-8 mt-6">
          <ReviewsSection productId={id} user={user} />
        </div>

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

export function ProductDetails(props: Props) {
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