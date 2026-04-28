"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleAdd = async () => {
    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
    });

    toast.success("Product added");
    setName("");
    setPrice("");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Add Product</h1>

      <input
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
        className="border p-2 block mb-2"
      />

      <input
        placeholder="Price"
        onChange={(e) => setPrice(e.target.value)}
        className="border p-2 block mb-2"
      />

      <button
        onClick={handleAdd}
        className="bg-green-600 text-white px-4 py-2"
      >
        Add Product
      </button>
    </div>
  );
}