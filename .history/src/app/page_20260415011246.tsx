import "./globals.css";

import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/data";

export default function Home() {
  return (
    <>

    <div className="bg-green-100 rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-green-800">
            Fresh from Farms 🌿
          </h2>
          <p className="mt-2 text-gray-600">
            Get organic vegetables & fruits directly from farmers
          </p>
          <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg">
            Shop Now
          </button>
        </div>

        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e"
          className="w-64 mt-6 md:mt-0 rounded-xl"
        />
      </div>
      <Navbar />

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">
          Fresh from Farm 🌿
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              name={p.name}
              price={p.price}
              image={p.image}
            />
          ))}
        </div>
      </main>
    </>
  );
}