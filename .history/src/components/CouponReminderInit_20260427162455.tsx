"use client";
// CouponReminderInit is a zero-UI component that runs the coupon reminder hook.
// It's mounted inside the RootLayout (which is a Server Component) via this
// thin client boundary — hooks can't run directly in Server Components.

import { useCouponReminder } from "@/hooks/useCouponReminder";

export default function CouponReminderInit() {
  useCouponReminder();
  return null;
}