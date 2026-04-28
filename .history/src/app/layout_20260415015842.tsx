import "./globals.css";
import { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";

export const metadata = {
  title: "FarmFresh - Farmers Marketplace",
  description: "Buy fresh products directly from farmers 🌿",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-800">
        
        {/* 🎬 Page Animation Wrapper */}
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>

      </body>
    </html>
  );
}