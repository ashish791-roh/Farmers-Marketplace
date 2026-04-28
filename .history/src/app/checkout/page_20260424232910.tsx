"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Loader,
  MapPin,
  Phone,
  User,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Form validation
function validateForm(form: any) {
  const errors: Record<string, string> = {};
  if (!form.name?.trim()) errors.name = "Name is required";
  if (!form.phone?.trim()) errors.phone = "Phone is required";
  else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) errors.phone = "Invalid phone number";
  if (!form.pincode?.trim()) errors.pincode = "Pincode is required";
  else if (!/^\d{6}$/.test(form.pincode)) errors.pincode = "Pincode must be 6 digits";
  if (!form.city?.trim()) errors.city = "City is required";
  if (!form.state?.trim()) errors.state = "State is required";
  if (!form.address?.trim()) errors.address = "Address is required";
  return errors;
}

// Pincode lookup (simple implementation)
async function lookupPincode(pincode: string) {
  // In a real app, you'd call an API like Google Geocoding or a pincode database
  // For demo, return mock data
  const mockData: Record<string, { city: string; state: string }> = {
    "110001": { city: "New Delhi", state: "Delhi" },
    "400001": { city: "Mumbai", state: "Maharashtra" },
    "560001": { city: "Bangalore", state: "Karnataka" },
    "500001": { city: "Hyderabad", state: "Telangana" },
    "600001": { city: "Chennai", state: "Tamil Nadu" },
  };
  return mockData[pincode];
}

function CheckoutPageContent() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    address: "",
  });

  const errors = validateForm(form);
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([k]) => touched[k])
  );

  // Wait for Razorpay SDK to load
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

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setTouched((t) => ({ ...t, [name]: true }));

    // Auto-fill city/state from pincode
    if (name === "pincode" && /^\d{6}$/.test(value)) {
      setPincodeLoading(true);
      const result = await lookupPincode(value);
      setPincodeLoading(false);
      if (result) {
        setForm((f) => ({ ...f, city: result.city, state: result.state }));
        toast.success(`📍 ${result.city}, ${result.state} detected!`);
      } else {
        toast.error("Pincode not found. Please fill city/state manually.");
      }
    }
  };

  const total = cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const delivery = total >= 500 ? 0 : 49;
  const grandTotal = total + delivery;

  const handleContinueToReview = () => {
    setTouched({ name: true, phone: true, pincode: true, city: true, state: true, address: true });
    if (Object.keys(errors).length === 0) {
      setStep(2);
    } else {
      toast.error("Please fix the errors before continuing");
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error("Login required");
      router.push("/login");
      return;
    }
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }
    if (!(window as any).Razorpay) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    try {
      setLoading(true);
      setStep(3);

      // Create order on backend
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || "Failed to create payment order");
      }

      const order = await res.json();
      if (!order.id) throw new Error("Order creation failed - no order ID received");

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "FarmX",
        description: "Order Payment",
        order_id: order.id,

        handler: async function (response: any) {
          try {
            // Verify payment signature on backend
            const verifyRes = await fetch("/api/payment/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const errorData = await verifyRes.json();
              throw new Error(errorData.error || "Payment verification failed");
            }

            // Save order to Firestore
            await addDoc(collection(db, "orders"), {
              userId: user.uid,
              items: cart,
              subtotal: total,
              delivery,
              total: grandTotal,
              address: form,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              status: "confirmed",
              createdAt: serverTimestamp(),
            });

            await clearCart();
            toast.success("Order placed successfully! 🎉");
            router.push("/orders");
          } catch (error) {
            console.error("Error saving order:", error);
            toast.error(
              error instanceof Error ? error.message : "Payment successful but order saving failed. Contact support."
            );
            setStep(2);
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            setStep(2);
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
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to checkout</p>
          <Link
            href="/login"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            Go to Login
          </Link>
        </div>
      </>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items to your cart before checking out</p>
          <Link
            href="/products"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            Continue Shopping
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-6 md:py-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[
              { num: 1, label: "Address" },
              { num: 2, label: "Review" },
              { num: 3, label: "Payment" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    step === s.num
                      ? "bg-green-600 text-white"
                      : step > s.num
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > s.num ? <Check size={20} /> : s.num}
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-500">Step {s.num}</p>
                  <p className="font-semibold text-gray-900">{s.label}</p>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      step > s.num ? "bg-green-200" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="md:col-span-2">
              {/* Step 1: Address Form */}
              {step === 1 && (
                <div className="bg-white rounded-xl p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Address</h2>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User size={16} className="inline mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition ${
                          visibleErrors.name
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-200 focus:border-green-500"
                        }`}
                      />
                      {visibleErrors.name && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {visibleErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Phone size={16} className="inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="10-digit phone number"
                        className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition ${
                          visibleErrors.phone
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-200 focus:border-green-500"
                        }`}
                      />
                      {visibleErrors.phone && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {visibleErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin size={16} className="inline mr-2" />
                        Pincode
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="pincode"
                          value={form.pincode}
                          onChange={handleChange}
                          placeholder="6-digit pincode"
                          maxLength={6}
                          className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition ${
                            visibleErrors.pincode
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 focus:border-green-500"
                          }`}
                        />
                        {pincodeLoading && (
                          <Loader size={16} className="absolute right-3 top-3 text-green-600 animate-spin" />
                        )}
                      </div>
                      {visibleErrors.pincode && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {visibleErrors.pincode}
                        </p>
                      )}
                    </div>

                    {/* City & State */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="City"
                          className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition ${
                            visibleErrors.city
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 focus:border-green-500"
                          }`}
                        />
                        {visibleErrors.city && (
                          <p className="text-red-600 text-xs mt-1">{visibleErrors.city}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={form.state}
                          onChange={handleChange}
                          placeholder="State"
                          className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition ${
                            visibleErrors.state
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 focus:border-green-500"
                          }`}
                        />
                        {visibleErrors.state && (
                          <p className="text-red-600 text-xs mt-1">{visibleErrors.state}</p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Full address (house number, street name, etc.)"
                        rows={3}
                        className={`w-full px-4 py-2.5 rounded-lg border-2 focus:outline-none transition resize-none ${
                          visibleErrors.address
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-200 focus:border-green-500"
                        }`}
                      />
                      {visibleErrors.address && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {visibleErrors.address}
                        </p>
                      )}
                    </div>

                    {/* Continue Button */}
                    <button
                      onClick={handleContinueToReview}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition mt-6"
                    >
                      Continue to Review
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Review Order */}
              {step === 2 && (
                <div className="bg-white rounded-xl p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Order</h2>

                  {/* Delivery Address Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-blue-900 mb-3">Delivery Address</p>
                    <p className="text-sm text-blue-800">
                      {form.name} ({form.phone})<br />
                      {form.address}<br />
                      {form.city}, {form.state} {form.pincode}
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-semibold mt-3"
                    >
                      ← Edit Address
                    </button>
                  </div>

                  {/* Order Items */}
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm border-b pb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  {/* Proceed to Payment */}
                  <button
                    onClick={handlePayment}
                    disabled={loading || !razorpayReady}
                    className={`w-full font-bold py-3 rounded-lg transition ${
                      razorpayReady
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-400 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader size={18} className="animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </button>
                </div>
              )}

              {/* Step 3: Processing */}
              {step === 3 && (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Loader size={48} className="mx-auto mb-4 text-green-600 animate-spin" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
                  <p className="text-gray-600">Please complete payment in the popup window</p>
                </div>
              )}
            </div>

            {/* Sidebar: Order Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6 border-b pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-semibold">{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>

                <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800 mb-4">
                  ✓ 100% Secure Payments<br />
                  ✓ Cash on Delivery<br />
                  ✓ 7-Day Returns
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Items ({cart.length})</p>
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-600">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default CheckoutPageContent;
