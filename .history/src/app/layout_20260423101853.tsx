import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "FarmX – Fresh Direct from Farmers",
  description: "Fresh farm products directly from farmers 🌿",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/* Razorpay SDK */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {/* Main scrollable content */}
              <div className="min-h-screen">
                {children}
              </div>

              {/* Fixed bottom navigation (mobile only) */}
              <BottomNav />

              {/* Toast notifications */}
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 2500,
                  style: {
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  },
                  success: {
                    style: {
                      background: "#16a34a",
                      color: "white",
                    },
                    iconTheme: { primary: "white", secondary: "#16a34a" },
                  },
                  error: {
                    style: {
                      background: "#dc2626",
                      color: "white",
                    },
                    iconTheme: { primary: "white", secondary: "#dc2626" },
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