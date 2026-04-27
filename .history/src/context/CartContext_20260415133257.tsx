"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
};

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQty: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // ===============================
  // 🔥 REAL-TIME LISTENER (ONLY SOURCE OF TRUTH)
  // ===============================
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

    return () => unsubscribe();
  }, [user, loading]);

  // ===============================
  // ➕ ADD TO CART
  // ===============================
  
  // ===============================
  // ❌ REMOVE FROM CART
  // ===============================
  const removeFromCart = async (id: string) => {
    try {
      if (!user) return;

      const ref = doc(db, "carts", user.uid);

      const updated = cart.filter((item) => item.id !== id);

      await setDoc(ref, { items: updated }, { merge: true });

    } catch (error) {
      console.log("Remove cart error:", error);
    }
  };

  // ===============================
  // 🔁 UPDATE QUANTITY
  // ===============================
  const updateQty = async (id: string, qty: number) => {
    try {
      if (!user) return;

      const ref = doc(db, "carts", user.uid);

      const updated = cart.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      );

      await setDoc(ref, { items: updated }, { merge: true });

    } catch (error) {
      console.log("Update qty error:", error);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);