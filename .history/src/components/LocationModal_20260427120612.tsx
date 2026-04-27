"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  X,
  Search,
  Navigation,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  Home,
  ChevronRight,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────────
export type LocationInfo = {
  city: string;
  pincode?: string;
  state?: string;
  district?: string;
  fullAddress?: string;
  area?: string;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
    amenity?: string;
    building?: string;
    office?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
  };
};

// ── Local storage ─────────────────────────────────────────────────────────────
const LOCATION_KEY = "farmx_delivery_location";
const RECENTS_KEY = "farmx_recent_locations";

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
    // Save to recents (max 5)
    const existing: LocationInfo[] = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    const filtered = existing.filter((r) => r.fullAddress !== loc.fullAddress).slice(0, 4);
    localStorage.setItem(RECENTS_KEY, JSON.stringify([loc, ...filtered]));
  } catch {}
}

function getRecentLocations(): LocationInfo[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

// ── Parse Nominatim result into LocationInfo ──────────────────────────────────
function parseNominatimResult(r: NominatimResult): LocationInfo {
  const a = r.address;

  // Build a human-readable short label (area/landmark name)
  const landmark = a.amenity || a.building || a.office || a.shop || a.tourism || a.leisure || "";
  const road = a.road || "";
  const area = a.suburb || a.neighbourhood || a.quarter || "";
  const city = a.city || a.town || a.village || a.county || "";
  const state = a.state || "";
  const pincode = a.postcode || "";

  // Full readable address
  const parts = [landmark, road, area, city, state].filter(Boolean);
  const fullAddress = parts.join(", ");

  // Short "city" label shown in navbar
  const displayCity = landmark || area || city || "Your Location";

  return {
    city: displayCity,
    area: area || city,
    fullAddress,
    pincode,
    state,
    district: a.state_district || a.county || city,
  };
}

// ── Place type icon ───────────────────────────────────────────────────────────
function PlaceIcon({ type, cls }: { type: string; cls: string }) {
  if (["office", "commercial", "workplace", "company", "government"].includes(type) ||
      cls === "office") {
    return <Building2 size={14} className="text-blue-500" />;
  }
  if (["house", "residential", "apartments"].includes(type) || cls === "building") {
    return <Home size={14} className="text-orange-400" />;
  }
  return <MapPin size={14} className="text-green-500" />;
}

// ── Address line split ────────────────────────────────────────────────────────
function splitAddress(displayName: string) {
  const parts = displayName.split(", ");
  const primary = parts.slice(0, 2).join(", ");
  const secondary = parts.slice(2, 5).join(", ");
  return { primary, secondary };
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
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationInfo[]>([]);
  const [noResults, setNoResults] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recents on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setNoResults(false);
      setDetected(false);
      setRecentLocations(getRecentLocations());
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Debounced Nominatim search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setNoResults(false);
      return;
    }
    setSearching(true);
    setNoResults(false);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&countrycodes=in&accept-language=en`;
      const res = await fetch(url, {
        headers: { "User-Agent": "FarmX-App/1.0" },
      });
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setNoResults(data.length === 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  // GPS detect
  const handleDetect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
            { headers: { "User-Agent": "FarmX-App/1.0", "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address || {};

          const road = a.road || "";
          const area = a.suburb || a.neighbourhood || a.quarter || "";
          const city = a.city || a.town || a.village || a.county || "Your Location";
          const state = a.state || "";
          const pincode = a.postcode || "";
          const landmark = a.amenity || a.building || "";

          const fullAddress = [landmark, road, area, city, state].filter(Boolean).join(", ");
          const displayCity = road || area || city;

          const loc: LocationInfo = {
            city: displayCity,
            area,
            fullAddress,
            pincode,
            state,
            district: a.state_district || a.county || city,
          };

          setDetecting(false);
          setDetected(true);
          onLocationChange(loc);
          storeLocation(loc);
          toast.success(`📍 Located at ${displayCity}`);
          setTimeout(() => { onClose(); setDetected(false); }, 900);
        } catch {
          setDetecting(false);
          toast.error("Could not fetch address. Please search manually.");
        }
      },
      () => {
        setDetecting(false);
        toast.error("Location access denied. Please search manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Select a result
  const handleSelect = (r: NominatimResult) => {
    const loc = parseNominatimResult(r);
    onLocationChange(loc);
    storeLocation(loc);
    const label = loc.fullAddress?.split(", ").slice(0, 2).join(", ") || loc.city;
    toast.success(`📍 Delivering to ${label}`);
    onClose();
  };

  const handleRecentSelect = (loc: LocationInfo) => {
    onLocationChange(loc);
    storeLocation(loc);
    toast.success(`📍 Delivering to ${loc.city}`);
    onClose();
  };

  const showRecents = !query.trim() && recentLocations.length > 0;
  const showResults = query.trim().length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-[75] bg-white md:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <MapPin size={17} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Deliver to</h2>
                  <p className="text-[11px] text-gray-400 max-w-[220px] truncate">
                    {currentLocation.fullAddress || currentLocation.city}
                    {currentLocation.pincode && ` · ${currentLocation.pincode}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400"
              >
                <X size={17} />
              </button>
            </div>

            {/* GPS Button */}
            <div className="px-5 pt-4 pb-2">
              <button
                onClick={handleDetect}
                disabled={detecting || detected}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                  detected
                    ? "bg-green-600 text-white border-green-600"
                    : "border-green-500 text-green-600 hover:bg-green-50 active:bg-green-100"
                }`}
              >
                {detecting ? (
                  <><Loader2 size={16} className="animate-spin" /> Detecting precise location…</>
                ) : detected ? (
                  <><CheckCircle2 size={16} /> Location detected!</>
                ) : (
                  <><Navigation size={15} /> Use My Current Location</>
                )}
              </button>
            </div>

            {/* Search bar */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search street, area, landmark, office…"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition placeholder:text-gray-400"
                />
                {searching && (
                  <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-green-500" />
                )}
                {query && !searching && (
                  <button
                    onClick={() => { setQuery(""); setResults([]); setNoResults(false); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                Search any address, street, colony, hospital, mall, office or landmark in India
              </p>
            </div>

            {/* Results / Recents */}
            <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "calc(90vh - 240px)" }}>

              {/* No results */}
              {noResults && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">No results for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different street, area or landmark</p>
                </div>
              )}

              {/* Search results */}
              {showResults && results.length > 0 && (
                <div className="space-y-1">
                  {results.map((r) => {
                    const { primary, secondary } = splitAddress(r.display_name);
                    return (
                      <button
                        key={r.place_id}
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-green-50 active:bg-green-100 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                          <PlaceIcon type={r.type} cls={r.class} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{primary}</p>
                          {secondary && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{secondary}</p>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500 transition-colors shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Recent locations */}
              {showRecents && !showResults && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Recent</span>
                  </div>
                  <div className="space-y-1">
                    {recentLocations.map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentSelect(loc)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Clock size={13} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{loc.city}</p>
                          {loc.fullAddress && (
                            <p className="text-[11px] text-gray-400 truncate">{loc.fullAddress}</p>
                          )}
                        </div>
                        {loc.pincode && (
                          <span className="text-[10px] text-gray-300 shrink-0">{loc.pincode}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular areas when nothing typed */}
              {!showResults && !showRecents && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star size={12} className="text-gray-400" />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Popular Areas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Connaught Place, Delhi", q: "Connaught Place Delhi" },
                      { label: "Bandra, Mumbai", q: "Bandra Mumbai" },
                      { label: "Koramangala, Bengaluru", q: "Koramangala Bengaluru" },
                      { label: "Jubilee Hills, Hyderabad", q: "Jubilee Hills Hyderabad" },
                      { label: "Anna Nagar, Chennai", q: "Anna Nagar Chennai" },
                      { label: "Salt Lake, Kolkata", q: "Salt Lake Kolkata" },
                    ].map((s) => (
                      <button
                        key={s.q}
                        onClick={() => handleQueryChange(s.q)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition text-left"
                      >
                        <MapPin size={11} className="text-green-500 shrink-0" />
                        <span className="text-[11px] font-medium text-gray-600 leading-tight">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}