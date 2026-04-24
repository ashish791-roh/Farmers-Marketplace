"use client";

import Image from "next/image";

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
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
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
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80",
  },
];

// Side mini banners for desktop Flipkart-style layout
const SIDE_BANNERS = [
  {
    id: "s1",
    title: "100% Organic",
    sub: "Certified farms only",
    href: "/products?category=Organic",
    bg: "from-emerald-600 to-green-800",
    emoji: "🌿",
    badge: "New",
  },
  {
    id: "s2",
    title: "Daily Dairy",
    sub: "Before 7 AM delivery",
    href: "/products?category=Dairy",
    bg: "from-blue-500 to-indigo-700",
    emoji: "🥛",
    badge: "Fresh",
  },
];

const AUTOPLAY_MS = 4200;

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const banner = BANNERS[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="flex gap-3">
      {/* ── MAIN CAROUSEL ── */}
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-2xl select-none flex-1 min-w-0"
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
            style={{ background: `linear-gradient(135deg, ${banner.bgFrom} 0%, ${banner.bgTo} 100%)` }}
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
                      style={{ background: banner.accentColor + "30", color: banner.accentColor, border: `1px solid ${banner.accentColor}50` }}
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
                <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: banner.accentColor }} />
                <div className="relative z-10 h-[80%] w-full rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 80vw"
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Diagonal pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
                backgroundSize: "12px 12px",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next arrows (desktop) */}
        <button onClick={prev} className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white items-center justify-center transition backdrop-blur-sm" aria-label="Previous">
          <ChevronLeft size={18} />
        </button>
        <button onClick={next} className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white items-center justify-center transition backdrop-blur-sm" aria-label="Next">
          <ChevronRight size={18} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Go to slide ${i + 1}`} className="transition-all duration-300">
              <div className={`rounded-full bg-white transition-all duration-300 ${i === current ? "w-5 h-1.5 opacity-100" : "w-1.5 h-1.5 opacity-50"}`} />
            </button>
          ))}
        </div>

        {/* Progress bar */}
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

      {/* ── SIDE MINI BANNERS (desktop only, Flipkart-style) ── */}
      <div className="hidden md:flex flex-col gap-3 w-[200px] shrink-0">
        {SIDE_BANNERS.map((sb) => (
          <Link
            key={sb.id}
            href={sb.href}
            className={`relative flex-1 bg-gradient-to-br ${sb.bg} rounded-2xl p-4 flex flex-col justify-between overflow-hidden group hover:shadow-lg transition-shadow`}
          >
            {/* Badge */}
            <span className="inline-flex self-start text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
              {sb.badge}
            </span>

            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-white font-extrabold text-sm leading-tight">{sb.title}</p>
                <p className="text-white/70 text-[10px] mt-0.5 leading-tight">{sb.sub}</p>
                <span className="inline-flex items-center gap-0.5 mt-2 text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-lg">
                  Shop now →
                </span>
              </div>
              <span className="text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300 ml-2">
                {sb.emoji}
              </span>
            </div>

            {/* Decorative circle */}
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />
          </Link>
        ))}
      </div>
    </div>
  );
}
