"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, X, Search, Navigation, Loader2, CheckCircle2,
  Clock, Building2, Home, ChevronRight, Star, Utensils,
  ShoppingBag, Hospital, GraduationCap, Train, Landmark,
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
  lat?: string;
  lon?: string;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  importance: number;
  namedetails?: { name?: string; "name:en"?: string };
  extratags?: { amenity?: string; cuisine?: string; brand?: string };
  address: {
    house_number?: string;
    house_name?: string;
    road?: string;
    pedestrian?: string;
    path?: string;
    footway?: string;
    service?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city_block?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
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
    railway?: string;
    aeroway?: string;
    healthcare?: string;
    school?: string;
    university?: string;
    college?: string;
  };
};

// ── Storage ───────────────────────────────────────────────────────────────────
const LOCATION_KEY = "farmx_delivery_location";
const RECENTS_KEY  = "farmx_recent_locations";

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
    const existing: LocationInfo[] = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    const deduped = existing
      .filter((r) => r.fullAddress !== loc.fullAddress)
      .slice(0, 4);
    localStorage.setItem(RECENTS_KEY, JSON.stringify([loc, ...deduped]));
  } catch {}
}

function getRecentLocations(): LocationInfo[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]"); }
  catch { return []; }
}

// ── Parse a Nominatim result into LocationInfo ────────────────────────────────
function parseResult(r: NominatimResult): LocationInfo {
  const a = r.address;

  const houseNo   = a.house_number || a.house_name || "";
  const road      = a.road || a.pedestrian || a.path || a.footway || a.service || "";
  const area      = a.suburb || a.neighbourhood || a.quarter || a.city_block || "";
  const city      = a.city || a.town || a.village || a.hamlet || a.county || "";
  const state     = a.state || "";
  const pincode   = a.postcode || "";

  // Landmark / place name (most precise identifier)
  const placeName =
    a.amenity || a.building || a.office || a.shop ||
    a.tourism || a.leisure || a.railway || a.healthcare ||
    a.school || a.university || a.college || a.aeroway || "";

  // Build full address from most specific → least specific
  const parts = [placeName, houseNo ? `${houseNo}, ${road}` : road, area, city, state]
    .map((p) => p.trim())
    .filter(Boolean);

  const fullAddress = parts.join(", ");

  // Short display label for navbar
  const displayCity = placeName || (houseNo ? `${houseNo}, ${road}` : road) || area || city || "Your Location";

  return {
    city: displayCity,
    area: area || city,
    fullAddress,
    pincode,
    state,
    district: a.state_district || a.county || city,
    lat: r.lat,
    lon: r.lon,
  };
}

// ── Smart address display: primary + secondary lines ─────────────────────────
function formatDisplayName(r: NominatimResult): { primary: string; secondary: string } {
  const a = r.address;

  const placeName =
    a.amenity || a.building || a.office || a.shop ||
    a.tourism || a.leisure || a.railway || a.healthcare ||
    a.school || a.university || a.college || "";

  const houseNo = a.house_number || a.house_name || "";
  const road    = a.road || a.pedestrian || a.path || a.footway || "";
  const area    = a.suburb || a.neighbourhood || a.quarter || "";
  const city    = a.city || a.town || a.village || a.county || "";
  const state   = a.state || "";
  const pin     = a.postcode || "";

  let primary = "";
  let secondary = "";

  if (placeName) {
    primary   = placeName;
    const roadPart = houseNo ? `${houseNo}, ${road}` : road;
    secondary = [roadPart, area, city].filter(Boolean).join(", ");
  } else if (houseNo && road) {
    primary   = `${houseNo}, ${road}`;
    secondary = [area, city, state, pin].filter(Boolean).join(", ");
  } else if (road) {
    primary   = road;
    secondary = [area, city, state, pin].filter(Boolean).join(", ");
  } else if (area) {
    primary   = area;
    secondary = [city, state, pin].filter(Boolean).join(", ");
  } else {
    const parts = r.display_name.split(", ");
    primary   = parts.slice(0, 2).join(", ");
    secondary = parts.slice(2, 5).join(", ");
  }

  return { primary, secondary };
}

// ── Place icon based on OSM class/type ───────────────────────────────────────
function PlaceIcon({ r }: { r: NominatimResult }) {
  const a = r.address;
  const cls = r.class;
  const type = r.type;

  if (a.railway || type === "station" || type === "halt") return <Train size={13} className="text-purple-500" />;
  if (a.healthcare || type === "hospital" || type === "clinic" || type === "pharmacy")
    return <Hospital size={13} className="text-red-500" />;
  if (a.school || a.university || a.college || type === "school" || type === "university")
    return <GraduationCap size={13} className="text-yellow-600" />;
  if (a.shop || cls === "shop") return <ShoppingBag size={13} className="text-pink-500" />;
  if (type === "restaurant" || type === "cafe" || type === "fast_food" || type === "food_court")
    return <Utensils size={13} className="text-orange-500" />;
  if (cls === "office" || a.office || type === "government" || type === "company")
    return <Building2 size={13} className="text-blue-500" />;
  if (cls === "tourism" || a.tourism || type === "monument" || type === "temple" || type === "mosque" || type === "church")
    return <Landmark size={13} className="text-amber-500" />;
  if (cls === "building" || type === "house" || type === "residential" || type === "apartments")
    return <Home size={13} className="text-orange-400" />;
  return <MapPin size={13} className="text-green-500" />;
}

// ── Main component ────────────────────────────────────────────────────────────
interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationInfo;
  onLocationChange: (loc: LocationInfo) => void;
}

// India bounding box for viewbox bias (improves India-specific results)
const INDIA_VIEWBOX = "68.1766451354,7.96553477623,97.4025614766,35.4940095078";

export default function LocationModal({
  isOpen, onClose, currentLocation, onLocationChange,
}: LocationModalProps) {
  const [query, setQuery]               = useState("");
  const [results, setResults]           = useState<NominatimResult[]>([]);
  const [searching, setSearching]       = useState(false);
  const [detecting, setDetecting]       = useState(false);
  const [detected, setDetected]         = useState(false);
  const [recents, setRecents]           = useState<LocationInfo[]>([]);
  const [noResults, setNoResults]       = useState(false);
  const [lastResults, setLastResults]   = useState<NominatimResult[]>([]); // stale cache

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(""); setResults([]); setNoResults(false);
      setDetected(false); setRecents(getRecentLocations());
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Core search — uses multiple Nominatim params for max precision
  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) { setResults([]); setNoResults(false); return; }

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setSearching(true);
    setNoResults(false);

    try {
      const params = new URLSearchParams({
        q: trimmed,
        format: "jsonv2",
        addressdetails: "1",
        namedetails: "1",
        extratags: "1",
        limit: "10",
        countrycodes: "in",
        "accept-language": "en",
        viewbox: INDIA_VIEWBOX,
        bounded: "0",            // 0 = prefer viewbox but don't restrict
        dedupe: "1",
        featuretype: "settlement",
      });

      // Remove featuretype for general search — it restricts too much
      params.delete("featuretype");

      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: {
          "User-Agent": "FarmX-DeliveryApp/2.0 (contact@farmx.in)",
          "Accept-Language": "en",
        },
      });

      const data: NominatimResult[] = await res.json();

      // Sort: higher importance first, but boost results with house numbers / roads
      const sorted = data.sort((a, b) => {
        const aScore = (a.address.house_number ? 0.3 : 0) + (a.address.road ? 0.2 : 0) + (a.importance || 0);
        const bScore = (b.address.house_number ? 0.3 : 0) + (b.address.road ? 0.2 : 0) + (b.importance || 0);
        return bScore - aScore;
      });

      setResults(sorted);
      setLastResults(sorted);
      setNoResults(sorted.length === 0);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return; // silently ignore cancelled
      // Show stale results on network error
      if (lastResults.length > 0) setResults(lastResults);
      else setNoResults(true);
    } finally {
      setSearching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // 250ms debounce — fast enough to feel instant
    debounceRef.current = setTimeout(() => doSearch(val), 250);
  };

  // GPS — zoom=18 gives building-level precision, zoom=16 gives street-level
  const handleDetect = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported."); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          // Use zoom=18 for high accuracy (<20m), zoom=16 for lower accuracy
          const zoom = accuracy < 50 ? 18 : accuracy < 200 ? 16 : 14;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1&namedetails=1&extratags=1&zoom=${zoom}`,
            {
              headers: {
                "User-Agent": "FarmX-DeliveryApp/2.0",
                "Accept-Language": "en",
              },
            }
          );
          const data = await res.json();
          const loc = parseResult({ ...data, importance: 1, lat: String(latitude), lon: String(longitude) });

          setDetecting(false);
          setDetected(true);
          onLocationChange(loc);
          storeLocation(loc);
          toast.success(`📍 ${loc.fullAddress?.split(", ").slice(0, 2).join(", ") || loc.city}`);
          setTimeout(() => { onClose(); setDetected(false); }, 900);
        } catch {
          setDetecting(false);
          toast.error("Could not fetch address. Please search manually.");
        }
      },
      (err) => {
        setDetecting(false);
        if (err.code === 1) toast.error("Location access denied. Please allow and retry.");
        else toast.error("Could not detect location. Please search manually.");
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleSelect = (r: NominatimResult) => {
    const loc = parseResult(r);
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

  const showRecents  = !query.trim() && recents.length > 0;
  const showResults  = query.trim().length >= 2;
  const showPopular  = !query.trim() && recents.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-[75] bg-white md:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "92vh" }}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <MapPin size={17} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Delivery Location</h2>
                  <p className="text-[11px] text-gray-400 max-w-[200px] truncate">
                    {currentLocation.fullAddress || currentLocation.city}
                    {currentLocation.pincode && ` · ${currentLocation.pincode}`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
                <X size={17} />
              </button>
            </div>

            {/* GPS */}
            <div className="px-5 pt-3 pb-2">
              <button
                onClick={handleDetect}
                disabled={detecting || detected}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                  detected
                    ? "bg-green-600 text-white border-green-600"
                    : "border-green-500 text-green-600 hover:bg-green-50 active:bg-green-100 disabled:opacity-60"
                }`}
              >
                {detecting ? (
                  <><Loader2 size={15} className="animate-spin" /> Detecting precise location…</>
                ) : detected ? (
                  <><CheckCircle2 size={15} /> Location detected!</>
                ) : (
                  <><Navigation size={14} /> Use My Current Location</>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Street, colony, landmark, office, hospital…"
                  className="w-full pl-10 pr-9 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition placeholder:text-gray-400"
                />
                {searching && (
                  <Loader2 size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-green-500" />
                )}
                {query && !searching && (
                  <button
                    onClick={() => { setQuery(""); setResults([]); setNoResults(false); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 px-0.5">
                Search any street, building, shop, hospital, school or landmark in India
              </p>
            </div>

            {/* Scrollable results */}
            <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "calc(92vh - 230px)" }}>

              {/* No results */}
              {noResults && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search size={19} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">No results for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try adding city name, e.g. "MG Road, Bangalore"</p>
                </div>
              )}

              {/* Search results */}
              {showResults && results.length > 0 && (
                <div className="space-y-0.5">
                  {results.map((r) => {
                    const { primary, secondary } = formatDisplayName(r);
                    return (
                      <button
                        key={r.place_id}
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-green-50 active:bg-green-100 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                          <PlaceIcon r={r} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-1">{primary}</p>
                          {secondary && (
                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{secondary}</p>
                          )}
                          {r.address.postcode && (
                            <span className="text-[10px] text-green-600 font-medium mt-0.5 inline-block">
                              PIN {r.address.postcode}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={13} className="text-gray-300 group-hover:text-green-500 shrink-0 mt-1.5 transition-colors" />
                      </button>
                    );
                  })}
                  <p className="text-[10px] text-center text-gray-300 pt-2">
                    Powered by OpenStreetMap · India street data
                  </p>
                </div>
              )}

              {/* Recents */}
              {showRecents && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 mt-1">
                    <Clock size={11} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recent</span>
                  </div>
                  <div className="space-y-0.5">
                    {recents.map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentSelect(loc)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition text-left"
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
                          <span className="text-[10px] text-green-600 font-medium shrink-0">PIN {loc.pincode}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular areas */}
              {showPopular && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 mt-1">
                    <Star size={11} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Popular Areas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Connaught Place", city: "New Delhi" },
                      { label: "Bandra West", city: "Mumbai" },
                      { label: "Koramangala", city: "Bengaluru" },
                      { label: "Jubilee Hills", city: "Hyderabad" },
                      { label: "Anna Nagar", city: "Chennai" },
                      { label: "Salt Lake City", city: "Kolkata" },
                      { label: "Civil Lines", city: "Jaipur" },
                      { label: "Aundh", city: "Pune" },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleQueryChange(`${s.label}, ${s.city}`)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition text-left"
                      >
                        <MapPin size={10} className="text-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-700 truncate">{s.label}</p>
                          <p className="text-[10px] text-gray-400">{s.city}</p>
                        </div>
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