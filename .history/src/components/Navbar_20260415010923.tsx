const Navbar = () => {
  return (
    <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl md:text-2xl font-bold">
        🌿 Farmers Market
      </h1>

      <div className="flex items-center gap-4">
        <button className="hover:underline">Login</button>
        <button className="bg-white text-green-600 px-4 py-1 rounded-lg font-semibold">
          Cart 🛒
        </button>
      </div>
    </nav>
  );
};

export default Navbar;