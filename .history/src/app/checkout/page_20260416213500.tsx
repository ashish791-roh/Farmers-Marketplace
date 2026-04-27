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
  const [paymentMethod, setPaymentMethod] = useState("online");

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

  const total =
    cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  const handlePayment = async () => {
    if (!user) return toast.error("Login required");
    if (!form.name || !form.phone || !form.address)
      return toast.error("Fill all details");
    if (!cart.length) return toast.error("Cart empty");

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

          toast.success("Order placed 🎉");
          router.push("/orders");
        },

        prefill: {
          email: user.email,
          contact: form.phone,
        },

        theme: { color: "#16a34a" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto p-6 md:p-10">

        {/* 🔥 STEP INDICATOR */}
        <div className="flex justify-center mb-8 gap-4 text-sm">
          <span className="font-bold text-green-600">1. Address</span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-400">2. Payment</span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-400">3. Review</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {/* 🧾 ADDRESS SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-xl space-y-4"
          >
            <h2 className="text-xl font-semibold">Delivery Details</h2>

            <input name="name" placeholder="Full Name" onChange={handleChange} className="input" />
            <input name="phone" placeholder="Phone Number" onChange={handleChange} className="input" />

            <div className="grid grid-cols-2 gap-3">
              <input name="pincode" placeholder="Pincode" onChange={handleChange} className="input" />
              <input name="city" placeholder="City" onChange={handleChange} className="input" />
            </div>

            <input name="state" placeholder="State" onChange={handleChange} className="input" />

            <textarea
              name="address"
              placeholder="Full Address"
              onChange={handleChange}
              className="input h-24"
            />

            {/* 💳 PAYMENT METHOD */}
            <div className="mt-4">
              <h3 className="font-medium mb-2">Payment Method</h3>

              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod("online")}
                  className={`px-4 py-2 rounded-lg border ${
                    paymentMethod === "online"
                      ? "bg-green-600 text-white"
                      : ""
                  }`}
                >
                  Online 💳
                </button>

                <button
                  onClick={() => setPaymentMethod("cod")}
                  className={`px-4 py-2 rounded-lg border ${
                    paymentMethod === "cod"
                      ? "bg-green-600 text-white"
                      : ""
                  }`}
                >
                  Cash on Delivery
                </button>
              </div>
            </div>
          </motion.div>

          {/* 🛒 ORDER SUMMARY */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-xl sticky top-6 h-fit"
          >
            <h2 className="text-lg font-semibold mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded object-cover"
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
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-700 text-white py-3 rounded-xl hover:scale-105 transition duration-300"
            >
              {loading ? "Processing..." : "Pay Now 🚀"}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              🔒 Secure payments via Razorpay
            </p>
          </motion.div>
        </div>
      </main>

      {/* 🎨 INPUT STYLE */}
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #ddd;
          padding: 12px;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
          outline: none;
        }
      `}</style>
    </>
  );
}