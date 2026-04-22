"use client";

import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function CheckoutPageContent() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    address: "",
  });

  /*
    FIX: Poll until window.Razorpay is available.
    Because we use strategy="lazyOnload", the SDK loads asynchronously.
    We wait for it to be ready before enabling the Pay Now button,
    so the user can never click it while window.Razorpay is still undefined.
  */
  useEffect(() => {
    if ((window as any).Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const interval = setInterval(() => {
      if ((window as any).Razorpay) {
        setRazorpayReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const total =
    cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

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

    /*
      FIX: Guard against window.Razorpay being undefined.
      If the SDK hasn't loaded yet (slow network), show a clear message
      instead of crashing silently with "Payment failed".
    */
    if (!(window as any).Razorpay) {
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to create payment order"
        );
      }

      const order = await res.json();

      if (!order.id) {
        throw new Error("Order creation failed - no order ID received");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "FarmX",
        description: "Order Payment",
        order_id: order.id,

        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/payment/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json();
              throw new Error(errData.error || "Payment verification failed");
            }

            await addDoc(collection(db, "orders"), {
              userId: user.uid,
              items: cart,
              total,
              address: form,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              status: "paid",
              createdAt: serverTimestamp(),
            });

            await clearCart();

            toast.success("Order placed successfully 🎉");
            router.push("/orders");
          } catch (error) {
            console.error("Error saving order:", error);
            toast.error(
              "Payment successful but order saving failed. Contact support."
            );
          } finally {
            /*
              FIX: setLoading(false) belongs in the handler's finally block,
              NOT in the outer try/finally. The outer finally fires right
              after razorpay.open() returns (before the user even pays),
              which would prematurely re-enable the button.
            */
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            toast("Payment cancelled", { icon: "ℹ️" });
            // FIX: Reset loading when user closes the Razorpay modal
            setLoading(false);
          },
        },

        prefill: {
          name: form.name || "",
          email: user.email || "",
          contact: form.phone || "",
        },

        theme: {
          color: "#16a34a",
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      /*
        FIX: Listen for the payment.failed event to reset loading state
        and show a proper error message instead of leaving the button
        stuck in "Processing..." state.
      */
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(
          response.error?.description || "Payment failed. Please try again."
        );
        setLoading(false);
      });

      razorpay.open();

      /*
        FIX: Do NOT call setLoading(false) here in the outer finally.
        Loading is now reset inside the handler, ondismiss, and
        payment.failed callbacks — after the user actually finishes.
      */
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Payment failed. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10 grid md:grid-cols-3 gap-8">

        {/* LEFT - ADDRESS FORM */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-white p-8 rounded-2xl shadow space-y-6"
        >
          <h2 className="text-2xl font-semibold text-green-700">
            Delivery Details
          </h2>

          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />

          <input
            name="phone"
            placeholder="Phone Number"
            onChange={handleChange}
            className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              name="pincode"
              placeholder="Pincode"
              onChange={handleChange}
              className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />

            <input
              name="city"
              placeholder="City"
              onChange={handleChange}
              className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>

          <input
            name="state"
            placeholder="State"
            onChange={handleChange}
            className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />

          <textarea
            name="address"
            placeholder="Full Address"
            onChange={handleChange}
            className="w-full border border-gray-200 px-4 py-3 rounded-xl h-24 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
        </motion.div>

        {/* RIGHT - ORDER SUMMARY */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow h-fit"
        >
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-3 border-b last:border-none"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 min-w-[48px] rounded-lg object-cover border border-gray-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-sm font-semibold text-gray-800">
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
            disabled={loading || !razorpayReady}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl transition"
          >
            {loading
              ? "Processing..."
              : !razorpayReady
              ? "Loading payment..."
              : "Pay Now 💳"}
          </button>

          <p className="text-xs text-gray-400 mt-3 text-center">
            🔒 Secure payments via Razorpay
          </p>
        </motion.div>
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}