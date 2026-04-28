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
  const { cart, clearCart } = useCart(); // ✅ ADDED
  const { user } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // 💰 SAFE TOTAL
  const total =
    cart?.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) || 0;

  // 🚀 PLACE ORDER
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    if (!address) {
      toast.error("Enter delivery address");
      return;
    }

    if (!cart || cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      // ✅ SAVE ORDER
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: cart,
        total,
        address,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // ✅ CLEAR CART AFTER ORDER
      await clearCart();

      toast.success("Order placed successfully 🎉");

      // ✅ REDIRECT (BETTER UX)
      router.push("/orders");

    } catch (error) {
      console.log(error);
      toast.error("Order failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
  try {
    if (!user) {
      toast.error("Login required");
      return;
    }

    if (!address) {
      toast.error("Enter address");
      return;
    }

    if (!cart || cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);

    // 🧾 CREATE ORDER FROM BACKEND
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: total }),
    });

    const order = await res.json();

    // ⚡ RAZORPAY OPTIONS
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "Farmers Marketplace",
      description: "Purchase Payment",
      order_id: order.id,

      handler: async function (response: any) {
        // ✅ SUCCESS

        await addDoc(collection(db, "orders"), {
          userId: user.uid,
          items: cart,
          total,
          address,
          paymentId: response.razorpay_payment_id,
          status: "paid",
          createdAt: new Date(),
        });

        await clearCart();

        toast.success("Payment successful 🎉");

        router.push("/orders");
      },

      prefill: {
        email: user.email,
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

      <main className="max-w-5xl mx-auto p-6 md:p-10">

        <h1 className="text-3xl font-bold mb-6">
          Checkout 🧾
        </h1>

        {/* 📦 CART ITEMS */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          {(!cart || cart.length === 0) ? (
            <p>Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between py-2 border-b"
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))
          )}
        </div>

        {/* 📍 ADDRESS */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="font-semibold mb-2">
            Delivery Address
          </h2>

          <textarea
            className="w-full border p-3 rounded-lg"
            placeholder="Enter your address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* 💰 TOTAL */}
        <div className="bg-white p-6 rounded-xl shadow mb-6 flex justify-between">
          <span className="text-lg font-semibold">
            Total
          </span>
          <span className="text-lg font-bold text-green-600">
            ₹{total}
          </span>
        </div>

        {/* 🛒 PLACE ORDER */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl text-lg transition"
        >
          {loading ? "Placing Order..." : "Place Order 🛒"}
        </button>

      </main>
    </>
  );
}