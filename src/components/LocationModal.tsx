"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  X,
  Search,
  Navigation,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

// Lazy load the map component to avoid SSR issues with Leaflet
const IndiaMapSelector = lazy(() => import("@/components/IndiaMapSelector"));

// ── Types ──────────────────────────────────────────────────────────────────────
export type LocationInfo = {
  city: string;
  pincode?: string;
  state?: string;
  district?: string;
};

// ── Popular cities with pincodes ───────────────────────────────────────────────
const POPULAR_CITIES: LocationInfo[] = [
  { city: "New Delhi", pincode: "110001", state: "Delhi", district: "New Delhi" },
  { city: "Mumbai", pincode: "400001", state: "Maharashtra", district: "Mumbai City" },
  { city: "Bangalore", pincode: "560001", state: "Karnataka", district: "Bengaluru Urban" },
  { city: "Chennai", pincode: "600001", state: "Tamil Nadu", district: "Chennai" },
  { city: "Hyderabad", pincode: "500001", state: "Telangana", district: "Hyderabad" },
  { city: "Kolkata", pincode: "700001", state: "West Bengal", district: "Kolkata" },
  { city: "Pune", pincode: "411001", state: "Maharashtra", district: "Pune" },
  { city: "Ahmedabad", pincode: "380001", state: "Gujarat", district: "Ahmedabad" },
  { city: "Jaipur", pincode: "302001", state: "Rajasthan", district: "Jaipur" },
  { city: "Lucknow", pincode: "226001", state: "Uttar Pradesh", district: "Lucknow" },
  { city: "Chandigarh", pincode: "160001", state: "Chandigarh", district: "Chandigarh" },
  { city: "Indore", pincode: "452001", state: "Madhya Pradesh", district: "Indore" },
];

// ── Local storage key ─────────────────────────────────────────────────────────
const LOCATION_KEY = "farmx_delivery_location";

export function getStoredLocation(): LocationInfo {
  if (typeof window === "undefined") return { city: "New Delhi", pincode: "110001" };
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { city: "New Delhi", pincode: "110001" };
}

export function storeLocation(loc: LocationInfo) {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}

// ── Main Modal ────────────────────────────────────────────────────────────────
interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationInfo;
  onLocationChange: (loc: LocationInfo) => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  currentLocation,
  onLocationChange,
}: LocationModalProps) {
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [tab, setTab] = useState<"city" | "pincode" | "map">("city");

  const searchRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Filter cities by query
  const filtered = query.trim()
    ? POPULAR_CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(query.toLowerCase()) ||
          (c.pincode && c.pincode.includes(query))
      )
    : POPULAR_CITIES;

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setPincodeInput("");
      setPincodeError("");
      setDetected(false);
      setTimeout(() => searchRef.current?.focus(), 120);
    }
  }, [isOpen]);

  // Detect current location via Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const city =
            addr.city || addr.town || addr.village || addr.county || "Your Location";
          const pincode = addr.postcode || "";
          const state = addr.state || "";
          const district = addr.county || addr.state_district || city;
          const loc: LocationInfo = { city, pincode, state, district };
          setDetecting(false);
          setDetected(true);
          onLocationChange(loc);
          storeLocation(loc);
          setTimeout(() => {
            onClose();
            setDetected(false);
          }, 1000);
        } catch {
          setDetecting(false);
          alert("Could not fetch location details. Please select manually.");
        }
      },
      () => {
        setDetecting(false);
        alert("Location access denied. Please allow location access or select manually.");
      },
      { timeout: 8000 }
    );
  };

  // Select a city
  const handleSelect = (loc: LocationInfo) => {
    onLocationChange(loc);
    storeLocation(loc);
    toast.success(`📍 Delivering to ${loc.city}`);
    onClose();
  };

  // Handle map selection (state -> district)
  const handleMapSelect = (state: string, district: string, pincode?: string) => {
    const loc: LocationInfo = {
      city: district,
      pincode: pincode || "",
      state,
      district,
    };
    onLocationChange(loc);
    storeLocation(loc);
    toast.success(`📍 Delivering to ${district}, ${state}`);
    onClose();
  };

  // Submit pincode
  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pincodeInput.trim();
    if (!/^\d{6}$/.test(pin)) {
      setPincodeError("Please enter a valid 6-digit pincode.");
      return;
    }
    const match = POPULAR_CITIES.find((c) => c.pincode === pin);
    const loc: LocationInfo = match ? match : { city: "Your Location", pincode: pin };
    onLocationChange(loc);
    storeLocation(loc);
    toast.success(`📍 Delivering to ${loc.city || pin}`);
    onClose();
  };

  const TABS = [
    { id: "city" as const, label: "🏙️ City" },
    { id: "map" as const, label: "🗺️ Map" },
    { id: "pincode" as const, label: "📍 Pincode" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full z-[75] bg-white md:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "92vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                  <MapPin size={16} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Delivery Location</h2>
                  <p className="text-[11px] text-gray-400">
                    Currently:{" "}
                    <span className="font-semibold text-green-600">
                      {currentLocation.district || currentLocation.city}
                    </span>
                    {currentLocation.state &&
                      currentLocation.state !== (currentLocation.district || currentLocation.city) && (
                        <span className="text-gray-400">, {currentLocation.state}</span>
                      )}
                    {currentLocation.pincode && ` – ${currentLocation.pincode}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Detect location button */}
            <div className="px-5 pt-4">
              <button
                onClick={handleDetectLocation}
                disabled={detecting || detected}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border-2 ${
                  detected
                    ? "bg-green-600 text-white border-green-600"
                    : "border-green-600 text-green-600 hover:bg-green-50"
                }`}
              >
                {detecting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Detecting your location…
                  </>
                ) : detected ? (
                  <>
                    <CheckCircle2 size={16} />
                    Location detected!
                  </>
                ) : (
                  <>
                    <Navigation size={16} />
                    Use My Current Location
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-medium">or select manually</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 mb-3">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tab === t.id
                      ? t.id === "map"
                        ? "bg-blue-600 text-white"
                        : "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div
              className="px-5 overflow-y-auto"
              style={{
                maxHeight: tab === "map" ? "calc(92vh - 230px)" : "calc(92vh - 260px)",
              }}
            >
              {/* ── CITY TAB ── */}
              {tab === "city" && (
                <>
                  <div className="relative mb-3">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search city or pincode…"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition placeholder:text-gray-400"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 pb-5">
                    {filtered.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-6">
                        No cities found for "{query}"
                      </p>
                    ) : (
                      filtered.map((loc) => {
                        const isSelected = loc.city === currentLocation.city;
                        return (
                          <button
                            key={loc.city}
                            onClick={() => handleSelect(loc)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                              isSelected
                                ? "bg-green-50 border border-green-200"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                  isSelected ? "bg-green-600" : "bg-gray-100"
                                }`}
                              >
                                <MapPin size={13} className={isSelected ? "text-white" : "text-gray-400"} />
                              </div>
                              <div className="text-left">
                                <p className={`text-sm font-semibold ${isSelected ? "text-green-700" : "text-gray-800"}`}>
                                  {loc.city}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {loc.state && `${loc.state} · `}
                                  {loc.pincode && `PIN: ${loc.pincode}`}
                                </p>
                              </div>
                            </div>
                            {isSelected ? (
                              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-300 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* ── MAP TAB ── */}
              {tab === "map" && (
                <div className="pb-5">
                  <p className="text-[11px] text-gray-400 mb-3 text-center">
                    Click a dot on the map or search below — select State → District
                  </p>
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-48">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={24} className="animate-spin text-green-500" />
                          <span className="text-xs text-gray-400">Loading map…</span>
                        </div>
                      </div>
                    }
                  >
                    <IndiaMapSelector
                      onSelect={handleMapSelect}
                      selectedState={currentLocation.state}
                      selectedDistrict={currentLocation.district}
                    />
                  </Suspense>
                </div>
              )}

              {/* ── PINCODE TAB ── */}
              {tab === "pincode" && (
                <form onSubmit={handlePincodeSubmit} className="pb-5">
                  <div className="space-y-3">
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincodeInput}
                        onChange={(e) => {
                          setPincodeInput(e.target.value.replace(/\D/g, ""));
                          setPincodeError("");
                        }}
                        placeholder="Enter 6-digit pincode"
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition placeholder:text-gray-400 tracking-widest font-mono"
                      />
                    </div>
                    {pincodeError && (
                      <p className="text-xs text-red-500 font-medium">{pincodeError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition"
                    >
                      Apply Pincode
                    </button>
                    <p className="text-center text-[11px] text-gray-400">
                      We'll show you products available in your area
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}