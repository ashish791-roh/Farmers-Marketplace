"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onFlyToCart } from "@/lib/flyCartEvent";

export default function FlyToCartLayer() {
  const [item, setItem] = useState<null | {
    image: string;
    startRect: DOMRect;
  }>(null);

  useEffect(() => {
    const unsub = onFlyToCart((data) => {
      setItem(data);

      setTimeout(() => {
        setItem(null);
      }, 800);
    });

    return unsub;
  }, []);

  return (
    <AnimatePresence>
      {item && (
        <motion.img
          src={item.image}
          initial={{
            position: "fixed",
            left: item.startRect.left,
            top: item.startRect.top,
            width: item.startRect.width,
            height: item.startRect.height,
            zIndex: 9999,
            borderRadius: 12,
          }}
          animate={{
            top: 20,
            right: 20,
            left: "auto",
            width: 40,
            height: 40,
            opacity: 0.2,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  );
}