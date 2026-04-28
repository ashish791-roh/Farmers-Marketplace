// ─────────────────────────────────────────────────────────────────────────────
// FarmX — Central TypeScript Schema
// All shared types live here. Import from "@/types" across the app.
// ─────────────────────────────────────────────────────────────────────────────

import { Timestamp } from "firebase/firestore";

// ── Firestore timestamp (can be server Timestamp or plain seconds object) ─────
export type FirestoreTimestamp = Timestamp | { seconds: number; nanoseconds: number } | null;

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  description?: string;
  unit?: string;
  stock?: number;
  farmerId?: string;
  farmerName?: string;
  farmerVerified?: boolean;
  status?: "pending" | "approved" | "rejected";
  /** Persisted average from review subcollection */
  avgRating?: number;
  /** Persisted review count from review subcollection */
  reviewCount?: number;
  /** Legacy / static rating field */
  rating?: number;
  createdAt?: FirestoreTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING PRODUCT  (farmer submission awaiting admin approval)
// ─────────────────────────────────────────────────────────────────────────────
export interface PendingProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  description?: string;
  unit?: string;
  stock?: number;
  farmerId: string;
  farmerName?: string;
  farmerEmail?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt?: FirestoreTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  unit?: string;
  farmerId?: string;
  farmerName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER
// ─────────────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "processing"
  | "shipped"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal?: number;
  total: number;
  delivery?: number;
  couponCode?: string | null;
  couponDiscount?: number;
  status: OrderStatus;
  address?: OrderAddress;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  createdAt: FirestoreTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER / FARMER
// ─────────────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "farmer" | "user";

export interface AppUser {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: UserRole;
  pushEnabled?: boolean;
  createdAt?: FirestoreTimestamp;
}

export interface Farmer extends AppUser {
  farmName?: string;
  location?: string;
  phone?: string;
  verified?: boolean;
  farmerStatus?: "pending" | "approved" | "rejected";
  farmDetails?: string;
  rejectionReason?: string;
  bio?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW
// ─────────────────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  userName?: string;
  rating: number;
  comment?: string;
  verifiedPurchase?: boolean;
  helpful?: number;
  createdAt?: FirestoreTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export type NotificationType =
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_processing"
  | "order_out_for_delivery"
  | "order_dispatched"
  | "low_stock_wishlist"
  | "new_order"
  | "coupon_expiry"
  | "product_approved"
  | "product_rejected";

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  status: "unread" | "read";
  link?: string;
  /** For user notifications */
  userId?: string;
  /** For farmer notifications */
  farmerId?: string;
  resolved?: boolean;
  adminNote?: string;
  createdAt?: FirestoreTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────────────────────────────────────
export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COUPON
// ─────────────────────────────────────────────────────────────────────────────
export interface Coupon {
  code: string;
  description: string;
  discount: number;
  type: "percent" | "flat";
  minOrder?: number;
  maxDiscount?: number;
}