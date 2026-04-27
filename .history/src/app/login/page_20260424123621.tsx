"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

const redirectByRole = (role: string | null) => {
  if (role === "admin") return "/admin";
  if (role === "farmer") return "/farmer/dashboard";
  return "/";
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful 🚀");

      const snap = await getDoc(doc(db, "users", result.user.uid));
      const role = snap.exists() ? snap.data().role : null;
      router.push(redirectByRole(role));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
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
          role: "user",
          createdAt: new Date(),
          provider: "google",
        });
        toast.success("Welcome to FarmX! 🌱");
      } else {
        toast.success("Google login successful 🚀");
      }

      const role = snap.exists() ? snap.data().role : "user";
      router.push(redirectByRole(role));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            Farm-fresh<br />delivered to<br />your door.
          </h2>
          <p className="text-green-100 text-lg leading-relaxed mb-10 max-w-sm">
            Connect directly with verified farmers. No middlemen, no markups — just honest produce from hands that care.
          </p>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
            <p className="text-green-50 text-sm italic leading-relaxed">
              "FarmX changed how I shop. I know exactly where my food comes from and the quality is unmatched."
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-8 h-8 rounded-full bg-green-300 flex items-center justify-center text-green-800 font-bold text-xs">
                P
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Ashish</p>
                <p className="text-green-300 text-xs">Customer, Mumbai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
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
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-2xl font-bold text-green-700">🌱 FarmX</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl p-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all mb-6 disabled:opacity-60"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt="Google"
            />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <a href="#" className="text-xs text-green-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                placeholder="••••••••"
                value={password}
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

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {/* Signup link */}
          <p className="text-center mt-6 text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-green-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}