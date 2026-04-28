import "./globals.css";

import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        
        {/* 🔥 HERO SECTION */}
        

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