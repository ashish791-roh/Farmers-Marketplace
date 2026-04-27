import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Farmers Marketplace",
  description: "Fresh products directly from farmers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        {/* 🔐 Auth Context */}
        <AuthProvider>

          {/* 🌍 App Pages */}
          {children}

          {/* 🔔 Toast Notifications */}
          <Toaster position="top-right" />

        </AuthProvider>

      </body>
    </html>
  );
}