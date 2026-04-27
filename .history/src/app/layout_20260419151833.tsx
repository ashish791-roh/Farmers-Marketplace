import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";
import Script from "next/script";

export const metadata = {
  title: "FarmX",
  description: "Fresh farm products directly from farmers 🌿",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">

        {/*
          FIX: Use Next.js <Script> with strategy="beforeInteractive" so the
          Razorpay SDK is guaranteed to load before any page JS runs.
          A plain <script> tag inside <body> in a Next.js Server Component
          is NOT executed reliably — window.Razorpay ends up undefined,
          which causes the "Payment failed" error on every click.
        */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />

        {/* AUTH GLOBAL STATE */}
        <AuthProvider>

          {/* CART GLOBAL STATE */}
          <CartProvider>

            {/*  APP CONTENT */}
            {children}

            {/*  TOAST SYSTEM (GLOBAL) */}
            <Toaster
              position="top-right"
              toastOptions={{
                success: {
                  style: {
                    background: "#16a34a",
                    color: "white",
                  },
                },
                error: {
                  style: {
                    background: "#dc2626",
                    color: "white",
                  },
                },
              }}
            />

          </CartProvider>
        </AuthProvider>

      </body>
    </html>
  );
}