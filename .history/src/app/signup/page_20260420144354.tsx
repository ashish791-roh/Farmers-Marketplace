"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type AccountType = "customer" | "farmer";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const strength = () => {
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) return "Strong";
    return "Medium";
  };

  const buildUserDoc = (uid: string, email: string | null) => {
    const base = {
      email,
      createdAt: serverTimestamp(),
    };
    if (accountType === "farmer") {
      return {
        ...base,
        role: "farmer",
        farmerStatus: "pending", // pending | approved | rejected
        farmName: farmName.trim(),
        farmLocation: farmLocation.trim(),
        phone: phone.trim(),
      };
    }
    return { ...base, role: "user" };
  };

  const afterSignup = (role: string, farmerStatus?: string) => {
    if (role === "farmer") {
      toast.success("Farmer account submitted! Awaiting admin approval 🌾");
      router.push("/farmer/pending");
    } else {
      toast.success("Account created 🚀");
      router.push("/");
    }
  };

  const handleSignup = async () => {
    if (accountType === "farmer" && !farmName.trim()) {
      toast.error("Please enter your farm name");
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userDoc = buildUserDoc(cred.user.uid, cred.user.email);
      await setDoc(doc(db, "users", cred.user.uid), userDoc);

      // Create farmer approval notification for admin
      if (accountType === "farmer") {
        await setDoc(doc(db, "notifications", `farmer_reg_${cred.user.uid}`), {
          type: "farmer_registration",
          farmerId: cred.user.uid,
          farmerEmail: cred.user.email,
          farmName: farmName.trim(),
          farmLocation: farmLocation.trim(),
          phone: phone.trim(),
          status: "unread",
          createdAt: serverTimestamp(),
        });
      }

      afterSignup(accountType === "farmer" ? "farmer" : "user");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const ref = doc(db, "users", result.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const userDoc = buildUserDoc(result.user.uid, result.user.email);
        await setDoc(ref, userDoc);
        if (accountType === "farmer") {
          await setDoc(doc(db, "notifications", `farmer_reg_${result.user.uid}`), {
            type: "farmer_registration",
            farmerId: result.user.uid,
            farmerEmail: result.user.email,
            farmName: farmName.trim(),
            farmLocation: farmLocation.trim(),
            phone: phone.trim(),
            status: "unread",
            createdAt: serverTimestamp(),
          });
        }
      }
      const finalSnap = await getDoc(ref);
      const role = finalSnap.data()?.role || "user";
      afterSignup(role, finalSnap.data()?.farmerStatus);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 py-10">
      <div className="w-full max-w-md bg-white/90 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-green-700">🌱 Join FarmX</h1>

        {/* ACCOUNT TYPE TOGGLE */}
        <div className="flex mt-6 rounded-xl overflow-hidden border border-green-200">
          <button
            onClick={() => setAccountType("customer")}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${
              accountType === "customer"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            🛒 Customer
          </button>
          <button
            onClick={() => setAccountType("farmer")}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${
              accountType === "farmer"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            🌾 Farmer / Seller
          </button>
        </div>

        {/* FARMER EXTRA FIELDS */}
        {accountType === "farmer" && (
          <div className="mt-4 space-y-3 bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-xs text-green-700 font-medium">Farm Details (required for approval)</p>
            <input
              className="w-full p-3 border rounded-lg text-sm"
              placeholder="Farm Name *"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg text-sm"
              placeholder="Farm Location / City"
              value={farmLocation}
              onChange={(e) => setFarmLocation(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg text-sm"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        {/* GOOGLE BUTTON */}
        <button
          onClick={handleGoogleSignup}
          className="w-full mt-4 bg-white border flex items-center justify-center gap-2 p-3 rounded-lg shadow cursor-pointer hover:shadow-md transition"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="text-center my-4 text-gray-400 text-sm">OR</div>

        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mt-3">
          <input
            type={showPass ? "text" : "password"}
            className="w-full p-3 border rounded-lg"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 cursor-pointer">
            👁️
          </span>
        </div>

        <p className="text-sm mt-2">
          Strength:{" "}
          <span className={strength() === "Strong" ? "text-green-600" : strength() === "Medium" ? "text-yellow-500" : "text-red-500"}>
            {strength()}
          </span>
        </p>

        <button
          onClick={handleSignup}
          className="w-full mt-4 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          {accountType === "farmer" ? "Apply as Farmer 🌾" : "Create Account"}
        </button>

        <p className="text-center mt-3 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
}