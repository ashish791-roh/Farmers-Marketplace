import { NextRequest, NextResponse } from "next/server";

// ── Coupon definitions live ONLY on the server ─────────────────────────────────
// These are never exposed to the browser. Add/remove coupons here safely.
const COUPONS: Record<
  string,
  { description: string; type: "percent" | "flat"; value: number; minOrder?: number }
> = {
  FARM10: {
    description: "10% off on your first order",
    type: "percent",
    value: 10,
  },
  FRESH20: {
    description: "₹20 off on orders above ₹299",
    type: "flat",
    value: 20,
    minOrder: 299,
  },
  ORGANIC15: {
    description: "15% off on organic products",
    type: "percent",
    value: 15,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code: string = (body.code ?? "").trim().toUpperCase();
    const orderTotal: number = Number(body.orderTotal) || 0;

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    const coupon = COUPONS[code];

    if (!coupon) {
      return NextResponse.json(
        { valid: false, message: "Invalid coupon code. Please try again." },
        { status: 200 }
      );
    }

    if (coupon.minOrder && orderTotal < coupon.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          message: `This coupon requires a minimum order of ₹${coupon.minOrder}.`,
        },
        { status: 200 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === "percent") {
      discountAmount = Math.round((orderTotal * coupon.value) / 100);
    } else {
      discountAmount = coupon.value;
    }

    return NextResponse.json({
      valid: true,
      code,
      description: coupon.description,
      discountAmount,
      message: `Coupon applied! You save ₹${discountAmount}.`,
    });
  } catch {
    return NextResponse.json(
      { valid: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Also expose the list of available coupon codes (NOT their validation logic)
// so the UI can show them as suggestions without revealing discount logic.
export async function GET() {
  const publicList = Object.entries(COUPONS).map(([code, c]) => ({
    code,
    description: c.description,
  }));
  return NextResponse.json({ coupons: publicList });
}