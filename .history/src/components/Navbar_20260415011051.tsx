const Navbar = () => {
  return (
    <nav className="bg-green-700 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      {/* Logo */}
      <h1 className="text-xl font-bold">🌿 FarmFresh</h1>

      {/* Search */}
      <div className="flex-1 mx-6 hidden md:block">
        <input
          type="text"
          placeholder="Search fresh products..."
          className="w-full px-4 py-2 rounded-lg text-black outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="hover:underline">Login</button>
        <button className="bg-white text-green-700 px-4 py-1 rounded-lg font-semibold">
          Cart 🛒
        </button>
      </div>
    </nav>
  );
};

export default Navbar;