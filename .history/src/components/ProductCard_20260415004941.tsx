type Props = {
  name: string;
  price: number;
  image: string;
};

const ProductCard = ({ name, price, image }: Props) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300">
      <img
        src={image}
        alt={name}
        className="h-44 w-full object-cover"
      />

      <div className="p-4">
        <h2 className="font-semibold text-lg text-gray-800">
          {name}
        </h2>

        <p className="text-green-600 font-bold text-lg">
          ₹{price}
        </p>

        <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;