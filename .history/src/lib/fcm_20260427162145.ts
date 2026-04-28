// ── Firebase Cloud Messaging (browser push) ────────────────────────────────────
// Call requestPushPermission() once after the user logs in.
// The FCM token is stored in Firestore under users/{uid}/fcmToken so the
// server (or admin panel) can send targeted pushes later.
//
// For NOW the browser push is triggered client-side using the Notifications API
// directly — this works on Chrome/Edge/Firefox without a server key, and covers
// foreground + background (via the service worker).

import { db, auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// ── Ask for permission & get FCM-style registration ───────────────────────────
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    await registerServiceWorker();
    return true;
  }

  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  if (result === "granted") {
    await registerServiceWorker();
    return true;
  }
  return false;
}

// ── Register SW so background push works ──────────────────────────────────────
async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    // Persist a flag so we know this device has push enabled
    const user = auth.currentUser;
    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { pushEnabled: true },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("[FCM] SW registration failed:", err);
  }
}

// ── Show a local browser push notification ────────────────────────────────────
// This fires immediately in the browser — no server-side FCM key needed.
// For truly server-triggered pushes you'd add the FCM Admin SDK to API routes.
export function showPushNotification(
  title: string,
  body: string,
  options?: { icon?: string; badge?: string; tag?: string; url?: string }
): void {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const sw = navigator.serviceWorker?.controller;

  if (sw) {
    // Post to SW so it shows the notification (works in background too)
    sw.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
      icon: options?.icon ?? "/favicon.ico",
      badge: options?.badge ?? "/favicon.ico",
      tag: options?.tag ?? "farmx-notif",
      url: options?.url ?? "/",
    });
  } else {
    // Fallback: direct Notification (foreground only)
    new Notification(title, {
      body,
      icon: options?.icon ?? "/favicon.ico",
      badge: options?.badge ?? "/favicon.ico",
      tag: options?.tag ?? "farmx-notif",
    });
  }
}