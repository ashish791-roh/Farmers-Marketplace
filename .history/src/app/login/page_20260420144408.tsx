"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const getRedirect = (role: string | null) => {
  if (role === "admin") return "/admin";
  if (role === "farmer_approved") return "/farmer/dashboard";
  if (role === "farmer") return "/farmer/pending";
  return "/";
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful 🚀");
      const snap = await getDoc(doc(db, "users", result.user.uid));
      const role = snap.exists() ? snap.data().role : null;
      router.push(getRedirect(role));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast.success("Google login successful 🚀");
      const snap = await getDoc(doc(db, "users", result.user.uid));
      const role = snap.exists() ? snap.data().role : null;
      router.push(getRedirect(role));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-green-50 overflow-hidden">
      <Particles
        className="absolute inset-0"
        options={{
          particles: {
            number: { value: 40 },
            color: { value: "#22c55e" },
            move: { enable: true, speed: 1 },
            opacity: { value: 0.4 },
            size: { value: 3 },
          },
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-green-700">🌱 FarmX</h1>
        <p className="text-center text-gray-500 mb-6">Welcome back! Login to continue</p>

        <input
          className="w-full p-3 border rounded-lg mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mb-3">
          <input
            type={showPass ? "text" : "password"}
            className="w-full p-3 border rounded-lg"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 cursor-pointer text-gray-500">
            👁️
          </span>
        </div>

        <button onClick={handleLogin} className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition">
          Login
        </button>

        <button onClick={handleGoogle} className="w-full mt-2 border p-3 rounded-lg hover:bg-gray-100 transition">
          Continue with Google
        </button>

        <p className="text-center mt-4 text-sm">
          New user?{" "}
          <Link href="/signup" className="text-green-600 font-semibold">Create account</Link>
        </p>
      </div>
    </div>
  );
}