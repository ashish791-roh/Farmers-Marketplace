// ── Central notification writer ────────────────────────────────────────────────
// All in-app notifications go through these helpers so the shape is consistent.
// Collections used:
//   userNotifications   — per-user consumer alerts
//   farmerNotifications — per-farmer alerts (already exists in farmer dashboard)
//   adminNotifications  — admin alerts (already exists in admin dashboard)

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export type NotifType =
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "low_stock_wishlist"
  | "new_order"          // farmer receives
  | "coupon_expiry";

interface BaseNotif {
  title: string;
  message: string;
  type: NotifType;
  link?: string;
}

// ── Consumer notification ──────────────────────────────────────────────────────
export async function notifyUser(
  userId: string,
  payload: BaseNotif
): Promise<void> {
  try {
    await addDoc(collection(db, "userNotifications"), {
      userId,
      ...payload,
      status: "unread",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[notifyUser] Failed:", err);
  }
}

// ── Farmer notification ────────────────────────────────────────────────────────
export async function notifyFarmer(
  farmerId: string,
  payload: BaseNotif
): Promise<void> {
  try {
    await addDoc(collection(db, "farmerNotifications"), {
      farmerId,
      ...payload,
      status: "unread",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[notifyFarmer] Failed:", err);
  }
}

// ── Admin notification ─────────────────────────────────────────────────────────
export async function notifyAdmin(payload: BaseNotif): Promise<void> {
  try {
    await addDoc(collection(db, "adminNotifications"), {
      ...payload,
      status: "unread",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[notifyAdmin] Failed:", err);
  }
}

// ── Order status → human label ─────────────────────────────────────────────────
export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

// ── Order status → emoji ───────────────────────────────────────────────────────
export function orderStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    confirmed: "✅",
    processing: "⚙️",
    shipped: "🚚",
    out_for_delivery: "📦",
    dispatched: "🚛",
    delivered: "🎉",
    cancelled: "❌",
  };
  return map[status] ?? "🔔";
}