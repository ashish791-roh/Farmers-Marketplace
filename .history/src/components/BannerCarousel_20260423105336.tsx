"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const banners = [
  {
    id: 1,
    title: "Fresh from the Farm",
    subtitle: "Up to 40% off on vegetables",
    cta: "Shop Now",
    href: "/products?category=vegetables",
    bg: "from-green-600 to-emerald-400",
    badge: "🌿 MEGA SALE",
    img: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&q=80",
  },
  {
    id: 2,
    title: "Seasonal Fruits",
    subtitle: "Handpicked from local orchards",
    cta: "Explore Fruits",
    href: "/products?category=fruits",
    bg: "from-orange-500 to-yellow-400",
    badge: "🍊 NEW ARRIVALS",
    img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80",
  },
  {
    id: 3,
    title: "Pure Dairy Products",
    subtitle: "Farm-fresh milk & more",
    cta: "Order Dairy",
    href: "/products?category=dairy",
    bg: "from-sky-500 to-blue-400",
    badge: "🥛 DAILY FRESH",
    img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
  },
  {
    id: 4,
    title: "Organic Grains",
    subtitle: "Stone-ground, pesticide-free",
    cta: "Buy Grains",
    href: "/products?category=grains",
    bg: "from-amber-600 to-yellow-500",
    badge: "🌾 ORGANIC",
    img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80",
  },
];

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent(index);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [isAnimating]
  );

  const next = useCallback(() => {
    goTo((current + 1) % banners.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next]);

  const banner = banners[current];

  return (
    <div className="relative w-full overflow-hidden rounded-none md:rounded-2xl mx-auto">
      {/* Main Banner */}
      <div
        key={banner.id}
        className={`relative w-full h-44 md:h-64 bg-gradient-to-r ${banner.bg} flex items-center overflow-hidden`}
        style={{
          animation: "bannerFadeIn 0.4s ease-out",
        }}
      >
        {/* Text content */}
        <div className="relative z-10 px-5 md:px-10 flex flex-col gap-1 max-w-xs md:max-w-sm">
          <span className="text-white/90 text-[10px] md:text-xs font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-full w-fit">
            {banner.badge}
          </span>
          <h2 className="text-white text-xl md:text-3xl font-black leading-tight mt-1">
            {banner.title}
          </h2>
          <p className="text-white/85 text-xs md:text-sm font-medium">
            {banner.subtitle}
          </p>
          <Link
            href={banner.href}
            className="mt-2 bg-white text-green-700 font-bold text-xs md:text-sm px-4 py-1.5 rounded-full w-fit hover:bg-green-50 transition-all active:scale-95 shadow-md"
          >
            {banner.cta} →
          </Link>
        </div>

        {/* Product image */}
        <div className="absolute right-0 bottom-0 h-full w-2/5 md:w-1/3">
          <img
            src={banner.img}
            alt={banner.title}
            className="w-full h-full object-cover opacity-80 mix-blend-overlay"
            loading="lazy"
          />
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute right-12 -bottom-10 w-28 h-28 bg-white/10 rounded-full" />
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 h-2 bg-white"
                : "w-2 h-2 bg-white/50"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes bannerFadeIn {
          from { opacity: 0; transform: translateX(15px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}