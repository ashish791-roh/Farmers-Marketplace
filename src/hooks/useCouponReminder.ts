"use client";

// ── Coupon reminder hook ────────────────────────────────────────────────────────
// Fires once per session when the user is logged in and hasn't used a coupon
// in the last 7 days. Reads the available coupon list from the API and picks
// a random one to highlight.

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { notifyUser } from "@/lib/notifications";
import { showPushNotification } from "@/lib/fcm";

const COUPON_REMINDER_KEY = "farmx_last_coupon_reminder";
const REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useCouponReminder() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const last = localStorage.getItem(COUPON_REMINDER_KEY);
    const lastMs = last ? parseInt(last, 10) : 0;

    // Only remind once per 7-day window
    if (Date.now() - lastMs < REMINDER_INTERVAL_MS) return;

    // Fire after 30s so it doesn't feel spammy on load
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/coupon/validate");
        const data = await res.json();
        const coupons: { code: string; description: string }[] = data.coupons || [];
        if (coupons.length === 0) return;

        // Pick a random coupon to highlight
        const picked = coupons[Math.floor(Math.random() * coupons.length)];

        await notifyUser(user.uid, {
          type: "coupon_expiry",
          title: "🎟️ Unused Offer Waiting!",
          message: `Don't forget: ${picked.description}. Use code ${picked.code} before it expires!`,
          link: "/products",
        });

        showPushNotification(
          "🎟️ You have an unused coupon!",
          `${picked.description} — Use code ${picked.code} now!`,
          { tag: "coupon-reminder", url: "/products" }
        );

        localStorage.setItem(COUPON_REMINDER_KEY, Date.now().toString());
      } catch (err) {
        console.error("[useCouponReminder] Failed:", err);
      }
    }, 30_000);

    return () => clearTimeout(t);
  }, [user]);
}