type Props = {
  name: string;
  price: number;
  image: string;
};

const ProductCard = ({ name, price, image }: Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-3">
      <img
        src={image}
        alt={name}
        className="h-40 w-full object-cover rounded-lg"
      />

      <div className="mt-3">
        <h3 className="text-sm font-semibold text-gray-800">
          {name}
        </h3>

        <p className="text-green-600 font-bold mt-1">
          ₹{price}
        </p>

        <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;