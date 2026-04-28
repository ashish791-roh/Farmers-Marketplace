"use client";

import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    address: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 💰 TOTAL
  const total =
    cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  // 💳 PAYMENT HANDLER
  const handlePayment = async () => {
    if (!user) {
      toast.error("Login required");
      router.push("/login");
      return;
    }

    if (
      !form.name ||
      !form.phone ||
      !form.pincode ||
      !form.city ||
      !form.state ||
      !form.address
    ) {
      toast.error("Please fill all address fields");
      return;
    }

    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: total }),
      });

      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Farmers Marketplace",
        description: "Order Payment",
        order_id: order.id,

        handler: async function (response: any) {
          await addDoc(collection(db, "orders"), {
            userId: user.uid,
            items: cart,
            total,
            address: form,
            paymentId: response.razorpay_payment_id,
            status: "paid",
            createdAt: serverTimestamp(),
          });

          await clearCart();

          toast.success("Order placed successfully 🎉");
          router.push("/orders");
        },

        prefill: {
          email: user.email,
          contact: form.phone,
        },

        theme: {
          color: "#16a34a",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(error);
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10 grid md:grid-cols-3 gap-8">

        {/* 🧾 LEFT - ADDRESS FORM */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-white p-6 rounded-2xl shadow space-y-5"
        >
          <h2 className="text-2xl font-semibold text-green-700">
            Delivery Details
          </h2>

          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="input"
          />

          <input
            name="phone"
            placeholder="Phone Number"
            onChange={handleChange}
            className="input"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              name="pincode"
              placeholder="Pincode"
              onChange={handleChange}
              className="input"
            />

            <input
              name="city"
              placeholder="City"
              onChange={handleChange}
              className="input"
            />
          </div>

          <input
            name="state"
            placeholder="State"
            onChange={handleChange}
            className="input"
          />

          <textarea
            name="address"
            placeholder="Full Address"
            onChange={handleChange}
            className="input h-24"
          />
        </motion.div>

        {/* 🛒 RIGHT - ORDER SUMMARY */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow h-fit"
        >
          <h2 className="text-xl font-semibold mb-4">
            Order Summary
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b last:border-none"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-7 h-2 min-w-[40px] rounded-lg object-cover border border-gray-200"
                />

                <div className="flex-1 text-sm">
                  {item.name} × {item.quantity}
                </div>

                <div className="text-sm font-medium">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-600">₹{total}</span>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition"
          >
            {loading ? "Processing..." : "Pay Now 💳"}
          </button>

          <p className="text-xs text-gray-400 mt-3 text-center">
            🔒 Secure payments via Razorpay
          </p>
        </motion.div>
      </main>

      {/* 🎨 INPUT STYLING */}
      className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
    </>
  );
}