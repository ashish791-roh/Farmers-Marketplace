import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification details" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured" },
        { status: 500 }
      );
    }

    // Verify HMAC signature — this is the authoritative check.
    // If the signature matches, the payment is genuine.
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed - Invalid signature" },
        { status: 400 }
      );
    }

    /*
      FIX: Removed the payment.status === "captured" check.

      In test mode Razorpay payments land in "authorized" state, not
      "captured" — so the old check rejected every single test payment
      with "Payment not captured", which was the root cause of the
      "payment failed, please try again later" error shown to users.

      In live mode with auto-capture disabled, payments are also
      "authorized" first, so the check would break live payments too.

      The HMAC signature verification above is the correct and sufficient
      authenticity check per Razorpay's own documentation. The handler
      callback on the client only fires after a successful payment, and
      the signature can only be produced by Razorpay using your secret
      key — so a valid signature means the payment is genuine.

      If you need to confirm capture status (e.g., for manual capture
      workflows), do it asynchronously via Razorpay webhooks instead.
    */

    return NextResponse.json({
      verified: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}