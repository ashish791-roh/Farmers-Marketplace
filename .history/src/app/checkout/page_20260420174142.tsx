"use client";

import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    address: "",
  });

  // Handle Razorpay redirect on mobile
  useEffect(() => {
    const paymentId = searchParams.get("razorpay_payment_id");
    const orderId = searchParams.get("razorpay_order_id");

    if (paymentId && orderId && user) {
      // Payment was successful via redirect, retrieve stored data
      const storedForm = localStorage.getItem("checkoutForm");
      const storedCart = localStorage.getItem("checkoutCart");

      if (storedForm && storedCart) {
        const formData = JSON.parse(storedForm);
        const cartData = JSON.parse(storedCart);

        const saveOrder = async () => {
          try {
            setLoading(true);
            await addDoc(collection(db, "orders"), {
              userId: user.uid,
              items: cartData,
              total: cartData.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
              address: formData,
              paymentId,
              status: "paid",
              createdAt: serverTimestamp(),
            });

            // Clear stored data
            localStorage.removeItem("checkoutForm");
            localStorage.removeItem("checkoutCart");

            toast.success("Order placed successfully 🎉");
            router.push("/orders");
          } catch (error) {
            console.error("Error saving order:", error);
            toast.error("Payment successful but order saving failed. Contact support.");
          } finally {
            setLoading(false);
          }
        };

        saveOrder();
      }
    }
  }, [searchParams, user, router]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // TOTAL
  const total =
    cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  // PAYMENT HANDLER
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: total }),
      });

      if (!res.ok) {
        throw new Error("Failed to create payment order");
      }

      const order = await res.json();

      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Store form data for mobile redirect
      if (isMobile) {
        localStorage.setItem("checkoutForm", JSON.stringify(form));
        localStorage.setItem("checkoutCart", JSON.stringify(cart));
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
          } catch (error) {
            console.error("Error saving order:", error);
            toast.error("Payment successful but order saving failed. Contact support.");
          }
        },

        modal: {
          ondismiss: function() {
            toast.error("Payment cancelled");
            setLoading(false);
          }
        },

        redirect: isMobile, // Use redirect for mobile devices

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
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
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
          <h2 className="text-xl font-semibold mb-4">
            Order Summary
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-3 border-b last:border-none"
              >
                {/* SMALL THUMBNAIL (FIXED) */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 min-w-[48px] rounded-lg object-cover border border-gray-200"
                />

                {/* TEXT */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                {/* PRICE */}
                <div className="text-sm font-semibold text-gray-800">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-600">₹{total}</span>
          </div>

          {/* BUTTON */}
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
    </>
  );
}