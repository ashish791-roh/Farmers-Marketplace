import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
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
          FIX: Use strategy="lazyOnload" for external CDN scripts in
          Next.js App Router. "beforeInteractive" is only supported for
          self-hosted scripts; using it for an external URL causes the
          script to be silently skipped → window.Razorpay stays undefined
          → every "Pay Now" click shows "Payment failed".

          "lazyOnload" correctly injects the <script> tag and loads
          Razorpay after the page becomes interactive, so window.Razorpay
          is available when the user clicks Pay Now.
        */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
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
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>

      </body>
    </html>
  );
}