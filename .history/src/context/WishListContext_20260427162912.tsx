"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { notifyUser } from "@/lib/notifications";
import { showPushNotification } from "@/lib/fcm";

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
};

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isWishlisted: () => false,
});

// Track which product IDs we've already alerted to avoid repeat notifications
const alertedLowStock = new Set<string>();

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (loading || !user) {
      setWishlist([]);
      return;
    }
    const ref = doc(db, "wishlists", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setWishlist(snap.data().items || []);
      else setWishlist([]);
    });
    return () => unsub();
  }, [user, loading]);

  // ── Low-stock watcher ──────────────────────────────────────────────────────
  // Whenever the wishlist changes, check if any wishlisted product has stock ≤ 5
  useEffect(() => {
    if (!user || wishlist.length === 0) return;

    const ids = wishlist.map((w) => w.id);

    // Poll each wishlisted product (Firestore doesn't support "in" on subcollection
    // so we listen individually — batched in one query using "in" for up to 10 ids)
    const checkStock = async () => {
      try {
        // Firestore "in" supports up to 10 items; chunk if needed
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

        for (const chunk of chunks) {
          const q = query(collection(db, "products"), where("__name__", "in", chunk));
          const snap = await getDocs(q);
          snap.docs.forEach(async (d) => {
            const product = d.data();
            const stock: number = product.stock ?? Infinity;
            const productId = d.id;
            const productName = product.name ?? "A wishlisted item";

            if (stock > 0 && stock <= 5 && !alertedLowStock.has(productId)) {
              alertedLowStock.add(productId);

              // In-app notification
              await notifyUser(user.uid, {
                type: "low_stock_wishlist",
                title: "Hurry! Low Stock ⚠️",
                message: `"${productName}" in your wishlist has only ${stock} left. Order before it's gone!`,
                link: `/product/${productId}`,
              });

              // Browser push
              showPushNotification(
                "Low Stock Alert ⚠️",
                `"${productName}" in your wishlist is almost sold out! Only ${stock} left.`,
                { tag: `low-stock-${productId}`, url: `/product/${productId}` }
              );
            }

            // Reset alert if stock is replenished (> 5)
            if (stock > 5) alertedLowStock.delete(productId);
          });
        }
      } catch (err) {
        console.error("[WishlistContext] Stock check failed:", err);
      }
    };

    checkStock();
    // Re-check every 10 minutes while the app is open
    const interval = setInterval(checkStock, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, wishlist]);

  const save = async (items: WishlistItem[]) => {
    if (!user) return;
    await setDoc(doc(db, "wishlists", user.uid), { items }, { merge: true });
  };

  const addToWishlist = async (item: WishlistItem) => {
    if (!user) return;
    if (wishlist.find((w) => w.id === item.id)) return;
    const updated = [...wishlist, item];
    await save(updated);
  };

  const removeFromWishlist = async (id: string) => {
    if (!user) return;
    const updated = wishlist.filter((w) => w.id !== id);
    await save(updated);
    alertedLowStock.delete(id); // reset so it can alert again if re-added
  };

  const isWishlisted = (id: string) => wishlist.some((w) => w.id === id);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);