"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronRight, ChevronDown, Search, X } from "lucide-react";
import { INDIA_STATES, type IndiaState, type District } from "@/lib/indiaData";

interface IndiaMapSelectorProps {
  onSelect: (state: string, district: string, pincode?: string) => void;
  selectedState?: string;
  selectedDistrict?: string;
}

export default function IndiaMapSelector({
  onSelect,
  selectedState,
  selectedDistrict,
}: IndiaMapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [activeState, setActiveState] = useState<IndiaState | null>(
    selectedState
      ? INDIA_STATES.find((s) => s.name === selectedState) || null
      : null
  );
  const [activeDistrict, setActiveDistrict] = useState<District | null>(
    selectedDistrict && selectedState
      ? INDIA_STATES.find((s) => s.name === selectedState)?.districts.find(
          (d) => d.name === selectedDistrict
        ) || null
      : null
  );
  const [stateSearch, setStateSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [view, setView] = useState<"state" | "district">("state");

  // Filtered lists
  const filteredStates = INDIA_STATES.filter((s) =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredDistricts = activeState
    ? activeState.districts.filter((d) =>
        d.name.toLowerCase().includes(districtSearch.toLowerCase())
      )
    : [];

  // Load Leaflet dynamically (CDN)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).__leafletLoaded) {
      initMap();
      return;
    }

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      (window as any).__leafletLoaded = true;
      initMap();
    };
    document.head.appendChild(script);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  function initMap() {
    if (!mapRef.current || leafletMap.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Initialize map centered on India
    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    // Free OpenStreetMap tile layer — no API key needed
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    // Small attribution
    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
      .addTo(map);

    leafletMap.current = map;
    markersLayer.current = L.layerGroup().addTo(map);

    // Add clickable state markers
    addStateMarkers(map, L);
    setMapReady(true);
  }

  function addStateMarkers(map: any, L: any) {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    INDIA_STATES.forEach((state) => {
      const isActive = activeState?.name === state.name;

      // Custom circle marker
      const marker = L.circleMarker([state.lat, state.lng], {
        radius: isActive ? 10 : 6,
        fillColor: isActive ? "#16a34a" : "#22c55e",
        color: isActive ? "#14532d" : "#166534",
        weight: isActive ? 2 : 1,
        opacity: 1,
        fillOpacity: isActive ? 1 : 0.75,
      });

      marker.bindTooltip(state.name, {
        permanent: false,
        direction: "top",
        className: "leaflet-india-tooltip",
      });

      marker.on("click", () => {
        handleStateSelect(state, map, L);
      });

      markersLayer.current.addLayer(marker);
    });
  }

  function handleStateSelect(state: IndiaState, map?: any, L?: any) {
    setActiveState(state);
    setActiveDistrict(null);
    setView("district");
    setDistrictSearch("");

    // Pan and zoom map to state
    const m = map || leafletMap.current;
    const leaflet = L || (window as any).L;
    if (m && leaflet) {
      m.flyTo([state.lat, state.lng], 7, { duration: 1 });

      // Re-render markers with new active state
      if (markersLayer.current) {
        markersLayer.current.clearLayers();
        INDIA_STATES.forEach((s) => {
          const isActive = s.name === state.name;
          const marker = leaflet.circleMarker([s.lat, s.lng], {
            radius: isActive ? 10 : 5,
            fillColor: isActive ? "#16a34a" : "#86efac",
            color: isActive ? "#14532d" : "#4ade80",
            weight: isActive ? 2 : 1,
            opacity: 1,
            fillOpacity: isActive ? 1 : 0.6,
          });

          marker.bindTooltip(s.name, {
            permanent: false,
            direction: "top",
          });

          marker.on("click", () => handleStateSelect(s));
          markersLayer.current.addLayer(marker);
        });

        // Add district markers for selected state
        state.districts.forEach((dist) => {
          // For district markers, we use offsets from state center since we
          // don't have exact district coords - this is a spread visual
          const jitterLat = state.lat + (Math.random() - 0.5) * 2.5;
          const jitterLng = state.lng + (Math.random() - 0.5) * 2.5;

          const dm = leaflet.circleMarker([jitterLat, jitterLng], {
            radius: 5,
            fillColor: "#3b82f6",
            color: "#1d4ed8",
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.7,
          });

          dm.bindTooltip(dist.name, { direction: "top", permanent: false });
          dm.on("click", () => handleDistrictSelect(dist));
          markersLayer.current.addLayer(dm);
        });
      }
    }
  }

  function handleDistrictSelect(district: District) {
    setActiveDistrict(district);
    onSelect(activeState!.name, district.name, district.pincode);
  }

  // When activeState changes from sidebar (not map click), sync map
  useEffect(() => {
    if (!mapReady || !activeState || !leafletMap.current) return;
    handleStateSelect(activeState);
  }, [mapReady]);

  return (
    <div className="flex flex-col gap-0" style={{ height: "420px" }}>
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: "200px" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
              <span className="text-xs text-gray-400">Loading India Map…</span>
            </div>
          </div>
        )}
        {activeState && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow text-xs font-semibold text-green-700 flex items-center gap-1.5">
            <MapPin size={11} />
            {activeState.name}
            {activeDistrict && (
              <>
                <ChevronRight size={10} className="text-gray-400" />
                <span className="text-blue-600">{activeDistrict.name}</span>
              </>
            )}
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-white/80 rounded px-2 py-1 text-[10px] text-gray-400">
          Click a dot to select state
        </div>
      </div>

      {/* Selector Panel */}
      <div className="flex flex-col mt-3" style={{ height: "210px" }}>
        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setView("state")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === "state"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            🏛️ State
          </button>
          <button
            onClick={() => setView("district")}
            disabled={!activeState}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
              view === "district"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            📍 District {activeState ? `(${activeState.name})` : ""}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={view === "state" ? stateSearch : districtSearch}
            onChange={(e) =>
              view === "state"
                ? setStateSearch(e.target.value)
                : setDistrictSearch(e.target.value)
            }
            placeholder={
              view === "state" ? "Search states…" : "Search districts…"
            }
            className="w-full pl-8 pr-8 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
          />
          {(view === "state" ? stateSearch : districtSearch) && (
            <button
              onClick={() =>
                view === "state" ? setStateSearch("") : setDistrictSearch("")
              }
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 space-y-0.5 pr-0.5">
          {view === "state" ? (
            filteredStates.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">
                No states found
              </p>
            ) : (
              filteredStates.map((state) => {
                const isSelected = activeState?.name === state.name;
                return (
                  <button
                    key={state.name}
                    onClick={() => handleStateSelect(state)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                      isSelected
                        ? "bg-green-50 border border-green-200 text-green-700 font-semibold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{state.name}</span>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="text-[10px]">
                        {state.districts.length} dist.
                      </span>
                      <ChevronRight size={12} />
                    </div>
                  </button>
                );
              })
            )
          ) : !activeState ? (
            <p className="text-center text-xs text-gray-400 py-4">
              Select a state first
            </p>
          ) : filteredDistricts.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-4">
              No districts found
            </p>
          ) : (
            filteredDistricts.map((dist) => {
              const isSelected = activeDistrict?.name === dist.name;
              return (
                <button
                  key={dist.name}
                  onClick={() => handleDistrictSelect(dist)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200 text-blue-700 font-semibold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={10} className={isSelected ? "text-blue-500" : "text-gray-300"} />
                    <span>{dist.name}</span>
                  </div>
                  {dist.pincode && (
                    <span className="text-[10px] text-gray-400">
                      {dist.pincode}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}