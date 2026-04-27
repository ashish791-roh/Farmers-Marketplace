import { products } from "@/lib/data";
import Navbar from "@/components/Navbar";

type Props = {
  params: {
    id: string;
  };
};

export default function ProductDetails({ params }: Props) {
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    return <div className="p-10">Product not found</div>;
  }

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid md:grid-cols-2 gap-10 bg-white p-6 rounded-2xl shadow">
          
          {/* 🖼️ Image */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-[350px] object-cover rounded-xl"
          />

          {/* 📝 Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {product.name}
            </h1>

            <p className="text-green-600 text-2xl font-bold mt-3">
              ₹{product.price}
            </p>

            {/* ⭐ Rating UI */}
            <div className="mt-3 text-yellow-500 text-lg">
              ⭐⭐⭐⭐☆
            </div>

            <p className="mt-4 text-gray-600">
              {product.description}
            </p>

            <button className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-lg">
              Add to Cart 🛒
            </button>
          </div>
        </div>
      </main>
    </>
  );
}