import crypto from "crypto";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment fields" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("Missing RAZORPAY_KEY_SECRET in environment");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify signature using HMAC-SHA256
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Payment signature mismatch - possible fraud attempt");
      return NextResponse.json(
        { error: "Payment verification failed - signature mismatch" },
        { status: 400 }
      );
    }

    // Optionally verify payment status with Razorpay API
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      console.error("Missing RAZORPAY_KEY_ID in environment");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    try {
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

      if (paymentDetails.status !== "captured") {
        console.error(
          `Payment status is ${paymentDetails.status}, expected 'captured'`
        );
        return NextResponse.json(
          { error: "Payment not captured yet" },
          { status: 400 }
        );
      }
    } catch (apiError) {
      console.error("Error fetching payment details from Razorpay:", apiError);
      // Even if API call fails, if signature is valid, we trust it
      // This prevents false negatives in case of temporary API issues
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        razorpay_order_id,
        razorpay_payment_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}