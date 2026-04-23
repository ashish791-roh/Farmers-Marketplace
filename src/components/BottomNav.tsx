"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Grid2X2, ShoppingCart, Package, User } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    matchExact: true,
  },
  {
    label: "Categories",
    href: "/products",
    icon: Grid2X2,
    matchExact: false,
  },
  {
    label: "Cart",
    href: "/cart",
    icon: ShoppingCart,
    matchExact: false,
    showBadge: true,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: Package,
    matchExact: false,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    matchExact: false,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Hide on admin/farmer pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/farmer")) {
    return null;
  }

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.matchExact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Spacer so content isn't hidden behind bottom nav on mobile */}
      <div className="h-16 md:hidden" />

      {/* Fixed bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
              >
                {/* Active indicator pill */}
                {active && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-green-600"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Icon container */}
                <div className="relative">
                  <motion.div
                    animate={active ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.2 : 1.7}
                      className={`transition-colors ${
                        active ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                  </motion.div>

                  {/* Cart badge */}
                  <AnimatePresence>
                    {item.showBadge && cartCount > 0 && (
                      <motion.span
                        key="cart-count"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
                      >
                        {cartCount > 9 ? "9+" : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-medium transition-colors leading-none ${
                    active ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* iOS safe-area bottom padding */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </>
  );
}