"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  const handleAdd = async () => {
    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      image,
      createdAt: new Date(),
    });

    alert("Product added!");
    setName("");
    setPrice("");
    setImage("");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Add Product</h1>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} className="border p-2 w-full" />
      <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} className="border p-2 w-full" />
      <input placeholder="Image URL" onChange={(e) => setImage(e.target.value)} className="border p-2 w-full" />

      <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2">
        Add Product
      </button>
    </div>
  );
}