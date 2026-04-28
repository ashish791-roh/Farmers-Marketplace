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
  const [payment, setPayment] = useState("online");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const total =
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

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
        order_id: order.id,
        name: "Farmers Marketplace",

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

      <main className="max-w-2xl mx-auto p-6 space-y-6 pb-24">

        {/* 🔥 STEP PROGRESS */}
        <div className="flex justify-between text-sm text-gray-500">
          <span className="text-green-600 font-semibold">Address</span>
          <span>→</span>
          <span>Payment</span>
          <span>→</span>
          <span>Review</span>
        </div>

        {/* 📦 ADDRESS CARD */}
        <div className="bg-white rounded-2xl p-5 shadow space-y-3">
          <h2 className="font-semibold text-lg">Delivery Address</h2>

          <input name="name" placeholder="Full Name" onChange={handleChange} className="input" />
          <input name="phone" placeholder="Phone Number" onChange={handleChange} className="input" />

          <input name="address" placeholder="Full Address" onChange={handleChange} className="input" />

          <div className="grid grid-cols-2 gap-3">
            <input name="city" placeholder="City" onChange={handleChange} className="input" />
            <input name="state" placeholder="State" onChange={handleChange} className="input" />
          </div>

          <input name="pincode" placeholder="Pincode" onChange={handleChange} className="input" />
        </div>

        {/* 💳 PAYMENT CARD */}
        <div className="bg-white rounded-2xl p-5 shadow">
          <h2 className="font-semibold text-lg mb-3">Payment Method</h2>

          <div className="space-y-2">
            <button
              onClick={() => setPayment("online")}
              className={`w-full p-3 rounded-xl border ${
                payment === "online" ? "bg-green-600 text-white" : ""
              }`}
            >
              Online Payment 💳
            </button>

            <button
              onClick={() => setPayment("cod")}
              className={`w-full p-3 rounded-xl border ${
                payment === "cod" ? "bg-green-600 text-white" : ""
              }`}
            >
              Cash on Delivery
            </button>
          </div>
        </div>

        {/* 🛒 ORDER SUMMARY */}
        <div className="bg-white rounded-2xl p-5 shadow space-y-3">
          <h2 className="font-semibold text-lg">Order Summary</h2>

          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3">

              <img
                src={item.image}
                className="w-8 h-8 rounded-md object-cover"
              />

              <div className="flex-1 text-sm">
                {item.name} × {item.quantity}
              </div>

              <div className="text-sm font-medium">
                ₹{item.price * item.quantity}
              </div>
            </div>
          ))}

          <div className="flex justify-between font-bold pt-3 border-t">
            <span>Total</span>
            <span className="text-green-600">₹{total}</span>
          </div>
        </div>
      </main>

      {/* 🚀 STICKY CTA */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl text-lg"
        >
          {loading ? "Processing..." : `Pay ₹${total}`}
        </button>
      </div>

      {/* 🎨 INPUT STYLE */}
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