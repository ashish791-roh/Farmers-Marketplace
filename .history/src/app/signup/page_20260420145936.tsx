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

  const router = useRouter();

  const strength = () => {
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) return "Strong";
    return "Medium";
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
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
    }
  };

  const handleGoogleSignup = async () => {
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="w-full max-w-md bg-white/80 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-green-700">
          🌱 Join FarmX
        </h1>

        {/* ROLE SELECTOR */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedRole("user")}
            className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition font-medium text-sm ${
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
            className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition font-medium text-sm ${
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
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">
            ⚠️ Farmer accounts require admin approval before you can list products.
          </div>
        )}

        {/* GOOGLE BUTTON */}
        <button
          onClick={handleGoogleSignup}
          className="w-full mt-5 bg-white border flex items-center justify-center gap-2 p-3 rounded-lg shadow cursor-pointer hover:shadow-md transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        {/* DIVIDER */}
        <div className="text-center my-4 text-gray-400 text-sm">OR</div>

        {/* NAME */}
        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* EMAIL */}
        <input
          className="w-full p-3 border rounded-lg mt-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <div className="relative mt-3">
          <input
            type={showPass ? "text" : "password"}
            className="w-full p-3 border rounded-lg"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-3 cursor-pointer"
          >
            👁️
          </span>
        </div>

        {/* STRENGTH */}
        <p className="text-sm mt-2">
          Strength:{" "}
          <span
            className={
              strength() === "Strong"
                ? "text-green-600"
                : strength() === "Medium"
                ? "text-yellow-500"
                : "text-red-500"
            }
          >
            {strength()}
          </span>
        </p>

        {/* SIGNUP BUTTON */}
        <button
          onClick={handleSignup}
          className="w-full mt-4 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition"
        >
          Create Account
        </button>

        <p className="text-center mt-3 text-sm">
          Already have account?{" "}
          <Link href="/login" className="text-green-600 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
