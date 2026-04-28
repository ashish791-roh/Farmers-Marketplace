"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  setDoc,
  getDoc,
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
  const loadCart = async () => {
    try {
      if (!user) return;

      const ref = doc(db, "carts", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setCart(snap.data().items || []);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.log("Cart load error:", error);
      setCart([]);
    }
  };

  // ===============================
  // ⏳ WAIT FOR AUTH BEFORE LOADING
  // ===============================
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setCart([]);
      return;
    }

    const timeout = setTimeout(() => {
      loadCart();
    }, 200);

    return () => clearTimeout(timeout);
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

      await setDoc(ref, { items: updated });
      setCart(updated);
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

      await setDoc(ref, { items: updated });
      setCart(updated);
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