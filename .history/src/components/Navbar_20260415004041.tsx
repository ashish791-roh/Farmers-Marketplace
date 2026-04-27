const Navbar = () => {
  return (
    <nav className="bg-green-600 text-white p-4 flex justify-between">
      <h1 className="font-bold text-xl">🌿 Farmers Market</h1>
      <div className="space-x-4">
        <button>Login</button>
        <button>Cart 🛒</button>
      </div>
    </nav>
  );
};

export default Navbar;