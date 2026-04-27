"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const router = useRouter();

  const strength = () => {
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) return "Strong";
    return "Medium";
  };

  const handleSignup = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    console.log("AUTH USER:", user.uid);

    // 🔥 FIRESTORE WRITE
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "user",
      createdAt: new Date(),
    });

    toast.success("Account created 🚀");
    router.push("/");
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err);
    toast.error(err.message);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">

      <div className="w-full max-w-md bg-white/80 p-8 rounded-2xl shadow-xl">

        <h1 className="text-3xl font-bold text-center text-green-700">
          🌱 Join Farmers Marketplace
        </h1>

        <input
          className="w-full p-3 border rounded-lg mt-5"
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

        {/* PASSWORD STRENGTH */}
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

        <button
          onClick={handleSignup}
          className="w-full mt-4 bg-green-600 text-white p-3 rounded-lg"
        >
          Create Account
        </button>

        <p className="text-center mt-3 text-sm">
          Already have account?{" "}
          <Link href="/login" className="text-green-600 font-semibold">
            LoginQ
          </Link>
        </p>
      </div>
    </div>
  );
}