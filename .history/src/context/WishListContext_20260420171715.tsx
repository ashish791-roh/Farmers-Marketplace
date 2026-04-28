"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

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
  };

  const isWishlisted = (id: string) => wishlist.some((w) => w.id === id);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);