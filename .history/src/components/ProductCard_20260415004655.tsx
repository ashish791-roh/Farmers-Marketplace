type Props = {
  name: string;
  price: number;
  image: string;
};

const ProductCard = ({ name, price, image }: Props) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
      <img
        src={image}
        alt={name}
        className="h-40 w-full object-cover"
      />

      <div className="p-4">
        <h2 className="font-semibold text-lg">{name}</h2>
        <p className="text-green-600 font-bold">₹{price}</p>

        <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;