"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
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
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // 🔄 Load cart
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
    console.log("Cart load error (ignored safe):", error);
    setCart([]);
  }
};
  useEffect(() => {
    loadCart();
  }, [user]);

  // ➕ Add to cart
  const addToCart = async (item: CartItem) => {
    if (!user) return;

    const ref = doc(db, "carts", user.uid);
    const snap = await getDoc(ref);

    let updatedCart: CartItem[] = [];

    if (snap.exists()) {
      updatedCart = snap.data().items || [];
    }

    const existing = updatedCart.find((p) => p.id === item.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      updatedCart.push({ ...item, quantity: 1 });
    }

    await setDoc(ref, { items: updatedCart });
    setCart(updatedCart);
  };

  // ❌ Remove
  const removeFromCart = async (id: string) => {
    if (!user) return;

    const ref = doc(db, "carts", user.uid);

    const updated = cart.filter((item) => item.id !== id);

    await setDoc(ref, { items: updated });
    setCart(updated);
  };

  // 🔁 Update qty
  const updateQty = async (id: string, qty: number) => {
    if (!user) return;

    const ref = doc(db, "carts", user.uid);

    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: qty } : item
    );

    await setDoc(ref, { items: updated });
    setCart(updated);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);