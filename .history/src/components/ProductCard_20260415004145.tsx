type Props = {
  name: string;
  price: number;
  image: string;
};

const ProductCard = ({ name, price, image }: Props) => {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <img src={image} className="h-40 w-full object-cover rounded" />
      <h2 className="mt-2 font-semibold">{name}</h2>
      <p className="text-green-600 font-bold">₹{price}</p>
      <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded">
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;