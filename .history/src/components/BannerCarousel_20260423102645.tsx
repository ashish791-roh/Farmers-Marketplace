"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  bgFrom: string;
  bgTo: string;
  accentColor: string;
  badge?: string;
  image: string;
};

const BANNERS: Banner[] = [
  {
    id: "b1",
    title: "Farm Fresh\nVegetables",
    subtitle: "Straight from soil to your kitchen — no middleman",
    cta: "Shop Vegetables",
    ctaHref: "/products?category=Vegetables",
    bgFrom: "#134e22",
    bgTo: "#16a34a",
    accentColor: "#4ade80",
    badge: "Up to 40% OFF",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
  },
  {
    id: "b2",
    title: "Organic\nFruits",
    subtitle: "Handpicked seasonal fruits from certified farms",
    cta: "Explore Fruits",
    ctaHref: "/products?category=Fruits",
    bgFrom: "#7c2d12",
    bgTo: "#ea580c",
    accentColor: "#fdba74",
    badge: "New Arrivals",
    image:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80",
  },
  {
    id: "b3",
    title: "Pure Dairy\nProducts",
    subtitle: "Fresh milk, paneer & more — delivered daily",
    cta: "Shop Dairy",
    ctaHref: "/products?category=Dairy",
    bgFrom: "#1e3a5f",
    bgTo: "#2563eb",
    accentColor: "#93c5fd",
    badge: "Daily Fresh",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
  },
  {
    id: "b4",
    title: "Whole\nGrains",
    subtitle: "Premium quality grains from trusted farmers",
    cta: "Browse Grains",
    ctaHref: "/products?category=Grains",
    bgFrom: "#44331e",
    bgTo: "#a16207",
    accentColor: "#fde68a",
    badge: "Free Delivery",
    image:
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80",
  },
];

const AUTOPLAY_MS = 4200;

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number, dir?: number) => {
      setDirection(dir ?? (index > current ? 1 : -1));
      setCurrent((index + BANNERS.length) % BANNERS.length);
    },
    [current]
  );

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

  // Autoplay
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  const banner = BANNERS[current];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl md:rounded-3xl select-none"
      style={{ aspectRatio: "16/7" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={banner.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 flex items-center"
          style={{
            background: `linear-gradient(135deg, ${banner.bgFrom} 0%, ${banner.bgTo} 100%)`,
          }}
        >
          {/* Content */}
          <div className="relative z-10 flex items-center justify-between w-full h-full px-5 md:px-10 py-4 md:py-6">
            {/* Left text */}
            <div className="flex flex-col justify-center max-w-[55%] md:max-w-[45%]">
              {banner.badge && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex self-start items-center gap-1 mb-2 md:mb-3"
                >
                  <span
                    className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{
                      background: banner.accentColor + "30",
                      color: banner.accentColor,
                      border: `1px solid ${banner.accentColor}50`,
                    }}
                  >
                    {banner.badge}
                  </span>
                </motion.div>
              )}

              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-white font-extrabold leading-tight whitespace-pre-line"
                style={{ fontSize: "clamp(1.2rem, 4vw, 2.2rem)" }}
              >
                {banner.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: 0.2 }}
                className="text-white mt-1.5 md:mt-2 leading-snug"
                style={{ fontSize: "clamp(0.65rem, 1.8vw, 0.9rem)" }}
              >
                {banner.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-3 md:mt-5"
              >
                <Link
                  href={banner.ctaHref}
                  className="inline-flex items-center gap-1.5 font-bold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                  style={{
                    background: banner.accentColor,
                    color: banner.bgFrom,
                    padding: "clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 22px)",
                    fontSize: "clamp(0.65rem, 1.6vw, 0.85rem)",
                  }}
                >
                  {banner.cta} →
                </Link>
              </motion.div>
            </div>

            {/* Right image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="relative h-full flex items-center justify-end"
              style={{ width: "42%" }}
            >
              {/* Glow blob */}
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-30"
                style={{ background: banner.accentColor }}
              />
              <img
                src={banner.image}
                alt={banner.title}
                loading="eager"
                className="relative z-10 h-[80%] w-full object-cover rounded-xl md:rounded-2xl shadow-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </motion.div>
          </div>

          {/* Subtle diagonal pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "12px 12px",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Prev / Next arrows (desktop) ── */}
      <button
        onClick={prev}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white items-center justify-center transition backdrop-blur-sm"
        aria-label="Previous"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white items-center justify-center transition backdrop-blur-sm"
        aria-label="Next"
      >
        <ChevronRight size={18} />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all duration-300"
          >
            <div
              className={`rounded-full bg-white transition-all duration-300 ${
                i === current ? "w-5 h-1.5 opacity-100" : "w-1.5 h-1.5 opacity-50"
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── Progress bar ── */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20">
          <motion.div
            key={`${current}-progress`}
            className="h-full bg-white/60"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}