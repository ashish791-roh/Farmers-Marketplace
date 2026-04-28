import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "FarmX",
  description: "Fresh products directly from farmers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">

        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

        {/* 🔐 AUTH GLOBAL STATE */}
        <AuthProvider>

          {/* 🛒 CART GLOBAL STATE */}
          <CartProvider>

            {/* 🌍 APP CONTENT */}
            {children}

            {/* 🔔 TOAST SYSTEM (GLOBAL) */}
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