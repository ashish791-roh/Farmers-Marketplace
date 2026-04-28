import "./globals.css";

import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/data";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        
        {/* 🔥 HERO SECTION */}
        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-3xl p-10 mb-10 flex flex-col md:flex-row items-center justify-between shadow-lg">
  <div>
    <h2 className="text-4xl font-bold">
      Fresh & Organic 🌿
    </h2>
    <p className="mt-3 text-lg">
      Directly from farmers to your home
    </p>
    <button className="mt-5 bg-white text-green-700 px-6 py-2 rounded-full font-semibold hover:scale-105 transition duration-300 shadow-sm → hover:shadow-xl">
      Shop Now
    </button>
  </div>

  <img
    src="https://images.unsplash.com/photo-1542838132-92c53300491e"
    className="w-72 mt-6 md:mt-0 rounded-xl shadow"
  />
</div>

        {/* 🗂️ CATEGORIES */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">
            Categories
          </h2>

          <div className="flex gap-4 overflow-x-auto">
            {["Vegetables", "Fruits", "Dairy", "Organic"].map((cat) => (
              <div
                key={cat}
                className="min-w-[120px] bg-white shadow rounded-xl p-4 text-center hover:shadow-lg cursor-pointer"
              >
                🌱
                <p className="mt-2 font-medium">{cat}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 🛒 PRODUCTS */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Popular Products
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image}
              />
            ))}
          </div>
        </div>

      </main>
    </>
  );
}