import "./globals.css";
import { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "FarmFresh - Farmers Marketplace",
  description: "Buy fresh products directly from farmers 🌿",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}