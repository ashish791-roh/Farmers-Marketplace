"use client";

import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { cartItems } = useCart();

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handlePayment = async () => {
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: totalAmount }),
    });

    const data = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // ✅ REQUIRED
      amount: data.amount,
      currency: "INR",
      name: "Farmers Marketplace",
      description: "Order Payment",
      order_id: data.id,
      handler: function (response: any) {
        alert("Payment Successful ✅");
        console.log(response);
      },
      prefill: {
        name: "User",
        email: "user@example.com",
      },
      theme: {
        color: "#16a34a",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div>
      <h1>Total: ₹{totalAmount}</h1>
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  );
}