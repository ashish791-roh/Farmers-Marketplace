import "./globals.css";
import type { Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import BottomNav from "@/components/BottomNav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: {
    default: "FarmX – Fresh Direct from Farmers",
    template: "%s | FarmX",
  },
  description:
    "Buy fresh vegetables, fruits, dairy and grains directly from verified local farmers. Best prices, zero middlemen.",
  keywords: [
    "fresh vegetables",
    "farm products",
    "buy direct from farmers",
    "organic produce",
    "FarmX",
    "online grocery",
  ],
  openGraph: {
    title: "FarmX – Fresh Direct from Farmers",
    description:
      "Buy fresh vegetables, fruits, dairy and grains directly from verified local farmers.",
    type: "website",
    locale: "en_IN",
    siteName: "FarmX",
  },
  twitter: {
    card: "summary_large_image",
    title: "FarmX – Fresh Direct from Farmers",
    description:
      "Buy fresh produce directly from verified local farmers. Best prices, zero middlemen.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased overflow-x-hidden">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="min-h-screen w-full overflow-x-hidden">
                {children}
              </div>
              <BottomNav />
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
                    style: { background: "#16a34a", color: "white" },
                    iconTheme: { primary: "white", secondary: "#16a34a" },
                  },
                  error: {
                    style: { background: "#dc2626", color: "white" },
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