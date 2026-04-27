"use client";

import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, Suspense, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, ChevronRight, MapPin, ClipboardList, CreditCard, AlertCircle, Loader2 } from "lucide-react";

// ── Step Indicator ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Review", icon: ClipboardList },
  { id: 3, label: "Pay", icon: CreditCard },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  backgroundColor: done ? "#16a34a" : active ? "#16a34a" : "#f3f4f6",
                  scale: active ? 1.1 : 1,
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  done || active ? "text-white" : "text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 size={20} /> : <Icon size={18} />}
              </motion.div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-green-700" : done ? "text-green-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 rounded transition-all ${
                  currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Validated Input ────────────────────────────────────────────────────────────
function ValidatedInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  maxLength,
  inputMode,
  rightSlot,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] & string;
  rightSlot?: React.ReactNode;
  disabled?: boolean;
}) {
  const hasError = !!error;
  const isValid = value.length > 0 && !hasError;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode as any}
          disabled={disabled}
          className={`w-full border px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 transition text-sm ${
            hasError
              ? "border-red-400 focus:ring-red-300 bg-red-50"
              : isValid
              ? "border-green-400 focus:ring-green-300 bg-green-50/30"
              : "border-gray-200 focus:ring-green-500"
          } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightSlot ? (
            rightSlot
          ) : hasError ? (
            <AlertCircle size={16} className="text-red-400" />
          ) : isValid ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : null}
        </div>
      </div>
      {hasError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

function ValidatedTextarea({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
}) {
  const hasError = !!error;
  const isValid = value.length > 0 && !hasError;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border px-4 py-3 rounded-xl h-24 focus:outline-none focus:ring-2 transition text-sm resize-none ${
          hasError
            ? "border-red-400 focus:ring-red-300 bg-red-50"
            : isValid
            ? "border-green-400 focus:ring-green-300 bg-green-50/30"
            : "border-gray-200 focus:ring-green-500"
        }`}
      />
      {hasError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

// ── Order Summary Sidebar ──────────────────────────────────────────────────────
function OrderSummary({
  cart,
  total,
  compact = false,
}: {
  cart: any[];
  total: number;
  compact?: boolean;
}) {
  const delivery = total >= 500 ? 0 : 49;
  const grandTotal = total + delivery;

  return (
    <div className="bg-white rounded-2xl shadow p-5 sticky top-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Order Summary</h2>

      <div className={`space-y-3 overflow-y-auto ${compact ? "max-h-40" : "max-h-64"}`}>
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-none">
            <img
              src={item.image}
              alt={item.name}
              className="w-11 h-11 min-w-[44px] rounded-lg object-cover border border-gray-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="text-sm font-semibold text-gray-700 shrink-0">
              ₹{item.price * item.quantity}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t mt-3 pt-3 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{total}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className={delivery === 0 ? "text-green-600 font-medium" : ""}>
            {delivery === 0 ? "FREE" : `₹${delivery}`}
          </span>
        </div>
        {delivery === 0 && (
          <p className="text-xs text-green-600">🎉 You saved ₹49 on delivery!</p>
        )}
      </div>

      <div className="border-t mt-3 pt-3 flex justify-between font-bold text-base text-gray-900">
        <span>Total</span>
        <span className="text-green-600">₹{grandTotal}</span>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">🔒 Secure payments via Razorpay</p>
    </div>
  );
}

// ── Pincode lookup ─────────────────────────────────────────────────────────────
async function lookupPincode(pin: string): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return { city: po.District, state: po.State };
    }
  } catch (_) {}
  return null;
}

// ── Validation helpers ─────────────────────────────────────────────────────────
function validateForm(form: any) {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Full name is required";
  else if (form.name.trim().length < 2) errors.name = "Name too short";

  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) errors.phone = "Enter a valid 10-digit mobile number";

  if (!form.pincode.trim()) errors.pincode = "Pincode is required";
  else if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode";

  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  if (!form.address.trim()) errors.address = "Address is required";
  else if (form.address.trim().length < 10) errors.address = "Please enter a more detailed address";

  return errors;
}

// ── Main Checkout Component ────────────────────────────────────────────────────
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

  useEffect(() => {
    if ((window as any).Razorpay) { setRazorpayReady(true); return; }
    const interval = setInterval(() => {
      if ((window as any).Razorpay) { setRazorpayReady(true); clearInterval(interval); }
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
    // Mark all fields touched to show errors
    setTouched({ name: true, phone: true, pincode: true, city: true, state: true, address: true });
    if (Object.keys(errors).length === 0) setStep(2);
    else toast.error("Please fix the errors before continuing");
  };

  const handlePayment = async () => {
    if (!user) { toast.error("Login required"); router.push("/login"); return; }
    if (!cart.length) { toast.error("Cart is empty"); return; }
    if (!(window as any).Razorpay) { toast.error("Payment system is loading. Please try again."); return; }

    try {
      setLoading(true);
      setStep(3);

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
              total: grandTotal,
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
            toast.error("Payment successful but order saving failed. Contact support.");
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            toast("Payment cancelled", { icon: "ℹ️" });
            setLoading(false);
            setStep(2);
          },
        },

        prefill: {
          name: form.name || "",
          email: user.email || "",
          contact: form.phone || "",
        },

        theme: { color: "#16a34a" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        toast.error(response.error?.description || "Payment failed. Please try again.");
        setLoading(false);
        setStep(2);
      });
      razorpay.open();

    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setLoading(false);
      setStep(2);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        <StepIndicator currentStep={step} />

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* LEFT - FORM AREA */}
          <div className="md:col-span-2 space-y-4">

            {/* STEP 1: ADDRESS */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 md:p-8 rounded-2xl shadow space-y-5"
                >
                  <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2">
                    <MapPin size={20} /> Delivery Details
                  </h2>

                  <ValidatedInput
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    error={visibleErrors.name}
                    placeholder="Enter your full name"
                  />

                  <ValidatedInput
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={handleChange}
                    error={visibleErrors.phone}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <ValidatedInput
                      label="Pincode"
                      name="pincode"
                      inputMode="numeric"
                      value={form.pincode}
                      onChange={handleChange}
                      error={visibleErrors.pincode}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      rightSlot={
                        pincodeLoading ? (
                          <Loader2 size={15} className="text-green-500 animate-spin" />
                        ) : undefined
                      }
                    />

                    <ValidatedInput
                      label="City"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      error={visibleErrors.city}
                      placeholder="Auto-filled from pincode"
                      disabled={pincodeLoading}
                    />
                  </div>

                  <ValidatedInput
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    error={visibleErrors.state}
                    placeholder="Auto-filled from pincode"
                    disabled={pincodeLoading}
                  />

                  <ValidatedTextarea
                    label="Full Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    error={visibleErrors.address}
                    placeholder="House/Flat No., Street, Area, Landmark..."
                  />

                  <button
                    onClick={handleContinueToReview}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
                  >
                    Continue to Review <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: REVIEW */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 md:p-8 rounded-2xl shadow space-y-5"
                >
                  <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2">
                    <ClipboardList size={20} /> Review Your Order
                  </h2>

                  {/* Delivery address review */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Delivering to</p>
                    <p className="font-semibold text-gray-800">{form.name}</p>
                    <p className="text-sm text-gray-600">{form.address}</p>
                    <p className="text-sm text-gray-600">{form.city}, {form.state} — {form.pincode}</p>
                    <p className="text-sm text-gray-600">📞 {form.phone}</p>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-green-600 hover:underline mt-1 font-medium"
                    >
                      ✏️ Edit Address
                    </button>
                  </div>

                  {/* Items review */}
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Items ({cart.length})</p>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-none">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading || !razorpayReady}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
                  >
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Processing...</>
                    ) : !razorpayReady ? (
                      <><Loader2 size={18} className="animate-spin" /> Loading payment...</>
                    ) : (
                      <><CreditCard size={18} /> Proceed to Pay ₹{grandTotal}</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* STEP 3: PAYING */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-10 rounded-2xl shadow flex flex-col items-center justify-center gap-4 min-h-[240px]"
                >
                  <Loader2 size={40} className="animate-spin text-green-600" />
                  <p className="text-lg font-semibold text-gray-700">Processing your payment…</p>
                  <p className="text-sm text-gray-400">Please complete payment in the Razorpay window</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT - ORDER SUMMARY (always visible) */}
          <div>
            <OrderSummary cart={cart} total={total} compact={step === 2} />
          </div>
        </div>
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}