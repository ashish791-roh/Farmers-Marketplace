"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

// FIRESTORE IMPORTS
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"user" | "farmer">("user");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const strength = () => {
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) return "Strong";
    return "Medium";
  };

  const strengthColor = () => {
    const s = strength();
    if (s === "Strong") return { bar: "#16a34a", text: "#16a34a", width: "100%" };
    if (s === "Medium") return { bar: "#d97706", text: "#d97706", width: "60%" };
    return { bar: "#dc2626", text: "#dc2626", width: "25%" };
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: name.trim(),
        role: selectedRole,
        ...(selectedRole === "farmer" && { farmerStatus: "pending", farmDetails: "" }),
        createdAt: new Date(),
      });

      toast.success(
        selectedRole === "farmer"
          ? "Farmer account created! Awaiting admin approval 🌾"
          : "Account created 🚀"
      );
      router.push(selectedRole === "farmer" ? "/farmer/dashboard" : "/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email,
          name: user.displayName || "",
          role: selectedRole,
          ...(selectedRole === "farmer" && { farmerStatus: "pending", farmDetails: "" }),
          createdAt: new Date(),
        });
      }

      toast.success("Signed in with Google 🚀");
      const existingRole = snap.exists() ? snap.data().role : selectedRole;
      router.push(existingRole === "farmer" ? "/farmer/dashboard" : "/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sc = strengthColor();

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — Brand Story ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #14532d 0%, #166534 30%, #15803d 60%, #22c55e 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #bbf7d0, transparent)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 translate-x-1/3 translate-y-1/3"
          style={{ background: "radial-gradient(circle, #86efac, transparent)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <span className="text-3xl font-bold text-white tracking-tight">🌱 FarmX</span>
        </div>

        {/* Brand copy */}
        <div className="relative z-10">
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Grow with us.<br />Eat better.<br />Live fresher.
          </h2>
          <p className="text-green-100 text-lg leading-relaxed mb-10 max-w-sm">
            Join thousands of customers and farmers building a transparent, sustainable food supply chain.
          </p>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              { icon: "✅", title: "Verified Farmers", desc: "Every seller is background-checked & approved" },
              { icon: "🚚", title: "Fast Delivery", desc: "Same-day and next-day delivery options" },
              { icon: "💰", title: "Fair Prices", desc: "Direct from farm means better prices for everyone" },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3"
              >
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-green-200 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {[["500+", "Farmers"], ["50k+", "Customers"], ["100%", "Verified"]].map(([val, label]) => (
            <div key={label}>
              <p className="text-white text-2xl font-extrabold">{val}</p>
              <p className="text-green-300 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-2xl font-bold text-green-700">🌱 FarmX</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 mb-8">Join FarmX — it's free and takes less than a minute</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedRole("user")}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition font-medium text-sm ${
                selectedRole === "user"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">🛒</span>
              I'm a Customer
            </button>
            <button
              onClick={() => setSelectedRole("farmer")}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition font-medium text-sm ${
                selectedRole === "farmer"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">🌾</span>
              I'm a Farmer
            </button>
          </div>

          {selectedRole === "farmer" && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
              ⚠️ Farmer accounts require admin approval before you can list products.
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl p-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all mb-5 disabled:opacity-60"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt="Google"
            />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Password strength bar */}
          {password.length > 0 && (
            <div className="mb-5">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: sc.width, background: sc.bar }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: sc.text }}>
                Password strength: {strength()}
              </p>
            </div>
          )}

          {/* Signup button */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60 mt-2"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center mt-5 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}