"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { CartItem } from "@/types";

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQty: () => {},
  clearCart: () => {},
});

// How long to wait after the last cart change before writing to Firestore.
// Multiple rapid adds (e.g. tapping 5 items) collapse into a single write.
const DEBOUNCE_MS = 800;

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // pendingCart holds the latest intended cart state between debounce ticks.
  // We use a ref so the debounce timer always closes over the freshest value
  // without needing to re-schedule on every render.
  const pendingCart = useRef<CartItem[] | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── REAL-TIME LISTENER ────────────────────────────────────────────────────
  // Stays exactly as before — Firestore is the source of truth and the
  // listener keeps other tabs/devices in sync.
  useEffect(() => {
    if (loading || !user) {
      setCart([]);
      return;
    }

    const ref = doc(db, "carts", user.uid);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setCart(snap.data().items || []);
      } else {
        setCart([]);
      }
    });

    // Cancel any pending debounced write when the user signs out / changes
    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      pendingCart.current = null;
    };
  }, [user, loading]);

  // ── DEBOUNCED FLUSH ───────────────────────────────────────────────────────
  // Schedules a Firestore write DEBOUNCE_MS after the last cart mutation.
  // Calling it again before the timer fires cancels the previous timer,
  // so 10 rapid adds => 1 write instead of 10.
  const scheduleFlush = (userId: string, items: CartItem[]) => {
    pendingCart.current = items;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const toWrite = pendingCart.current;
      if (toWrite === null) return;
      try {
        await setDoc(doc(db, "carts", userId), { items: toWrite }, { merge: true });
      } catch (error) {
        console.log("Cart flush error:", error);
      } finally {
        pendingCart.current = null;
        debounceTimer.current = null;
      }
    }, DEBOUNCE_MS);
  };

  // ── IMMEDIATE FLUSH ───────────────────────────────────────────────────────
  // Used for operations where the user's intent is explicit and singular
  // (remove item, clear cart) — no benefit to batching these.
  const flushNow = async (userId: string, items: CartItem[]) => {
    // Cancel any pending debounced write — this supersedes it
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    pendingCart.current = null;
    try {
      await setDoc(doc(db, "carts", userId), { items }, { merge: true });
    } catch (error) {
      console.log("Cart write error:", error);
    }
  };

  // ── ADD TO CART ───────────────────────────────────────────────────────────
  // Optimistic local update => debounced Firestore write
  const addToCart = (item: CartItem) => {
    if (!user) return;

    const current = cart;
    const existing = current.find((p) => p.id === item.id);

    let updatedCart: CartItem[];
    if (existing) {
      updatedCart = current.map((p) =>
        p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
      );
    } else {
      updatedCart = [...current, { ...item, quantity: 1 }];
    }

    // Update UI immediately — no waiting for Firestore round-trip
    setCart(updatedCart);

    // Schedule the actual write (debounced)
    scheduleFlush(user.uid, updatedCart);

    import("react-hot-toast").then((t) => {
      t.default.success("Added to cart 🛒");
    });
  };

  // ── REMOVE FROM CART ──────────────────────────────────────────────────────
  // Flush immediately — removal is a deliberate single action
  const removeFromCart = async (id: string) => {
    if (!user) return;
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    await flushNow(user.uid, updated);
  };

  // ── UPDATE QUANTITY ───────────────────────────────────────────────────────
  // Debounced — user may tap +/- rapidly in the cart page
  const updateQty = (id: string, qty: number) => {
    if (!user) return;
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: qty } : item
    );
    setCart(updated);
    scheduleFlush(user.uid, updated);
  };

  // ── CLEAR CART ────────────────────────────────────────────────────────────
  // Flush immediately — used after checkout, must be reliable
  const clearCart = async () => {
    if (!user) return;
    setCart([]);
    await flushNow(user.uid, []);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);