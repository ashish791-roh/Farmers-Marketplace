"use client";

import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // 🧾 ADDRESS STATE (NEW)
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

  // 🚀 PAYMENT HANDLER (RAZORPAY)
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
      toast.error("Fill all address fields");
      return;
    }

    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      // 🔥 CREATE ORDER
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
          // ✅ SAVE ORDER
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

        theme: {
          color: "#16a34a",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.log(err);
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10 grid md:grid-cols-3 gap-8">

        {/* 🧾 LEFT - ADDRESS */}
        <div className="md:col-span-2 space-y-6">

          <h1 className="text-3xl font-bold text-green-700">
            Checkout 🧾
          </h1>

          <div className="bg-white p-6 rounded-xl shadow space-y-4">

            <h2 className="font-semibold text-lg">
              Delivery Details
            </h2>

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
          </div>

        </div>

        {/* 💳 RIGHT - ORDER SUMMARY */}
        <div className="bg-white p-6 rounded-xl shadow h-fit">

          <h2 className="text-xl font-semibold mb-4">
            Order Summary
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
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
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition"
          >
            {loading ? "Processing..." : "Pay Now 💳"}
          </button>

          {/* 🛡️ TRUST BADGE */}
          <p className="text-xs text-gray-400 mt-3 text-center">
            🔒 100% Secure Payments (UPI, Cards, Wallets)
          </p>

        </div>
      </main>

      {/* 🔥 GLOBAL INPUT STYLE */}
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}