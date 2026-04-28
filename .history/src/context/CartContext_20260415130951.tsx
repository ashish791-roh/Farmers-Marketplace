"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  setDoc,
  getDoc,
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
  // 🔄 LOAD CART FROM FIRESTORE
  // ===============================
   useEffect(() => {
  if (loading || !user) {
    setCart([]);
    return;
  }

  const ref = doc(db, "carts", user.uid);

  // 🔥 REAL-TIME LISTENER
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
   const addToCart = async (item: CartItem) => {
  try {
    if (!user) return;

    const ref = doc(db, "carts", user.uid);

    const current = cart || [];

    const existing = current.find((p) => p.id === item.id);

    let updatedCart: CartItem[];

    if (existing) {
      updatedCart = current.map((p) =>
        p.id === item.id
          ? { ...p, quantity: p.quantity + 1 }
          : p
      );
    } else {
      updatedCart = [...current, { ...item, quantity: 1 }];
    }

    await setDoc(ref, { items: updatedCart }, { merge: true });
  } catch (error) {
    console.log("Add to cart error:", error);
  }
};
  // ===============================
  // ❌ REMOVE FROM CART
  // ===============================
  const removeFromCart = async (id: string) => {
    try {
      if (!user) return;

      const ref = doc(db, "carts", user.uid);

      const updated = cart.filter((item) => item.id !== id);

      await setDoc(ref, { items: updated }, { merge: true });
      const newSnap = await getDoc(ref);
      setCart(newSnap.data()?.items || []);
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
      const newSnap = await getDoc(ref);
      setCart(newSnap.data()?.items || []);
    } catch (error) {
      console.log("Update qty error:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQty }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);