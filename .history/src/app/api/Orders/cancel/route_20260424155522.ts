import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Configurable cancellation window (milliseconds)
const CANCEL_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Statuses that are still cancellable
const CANCELLABLE_STATUSES = ["pending", "paid", "confirmed", "processing"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, userId } = body;

    if (!orderId || !userId) {
      return NextResponse.json(
        { success: false, message: "orderId and userId are required." },
        { status: 400 }
      );
    }

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    const order = orderSnap.data();

    // Ownership check — only the order's owner can cancel it
    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Not authorised to cancel this order." },
        { status: 403 }
      );
    }

    // Already cancelled or delivered
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            order.status === "cancelled"
              ? "This order is already cancelled."
              : "This order can no longer be cancelled as it has been dispatched or delivered.",
        },
        { status: 422 }
      );
    }

    // Time-window check
    const createdAtSeconds: number = order.createdAt?.seconds ?? 0;
    const ageMs = Date.now() - createdAtSeconds * 1000;

    if (ageMs > CANCEL_WINDOW_MS) {
      const minutesWindow = Math.round(CANCEL_WINDOW_MS / 60000);
      return NextResponse.json(
        {
          success: false,
          message: `Orders can only be cancelled within ${minutesWindow} minutes of placing them. This window has passed.`,
        },
        { status: 422 }
      );
    }

    // All checks passed — mark as cancelled
    await updateDoc(orderRef, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: "Cancelled by customer",
    });

    return NextResponse.json({
      success: true,
      message: "Your order has been cancelled. Any payment will be refunded within 5–7 business days.",
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}