/**
 * HEATSHIELD :: KCAP-2025 Logistics Route Intelligence Service
 * Abstracted OpenStreetMap & OSRM Road-Network Routing Engine Client
 */

const HEATSHIELD_ROUTE_SERVICE = {
  prototypeDepots: [
    { id: "depot_north", name: "Depot North (Tala)", name_bn: "উত্তর ডিপো (টালা)", lat: 22.5950, lng: 88.3750, desc: "Prototype logistics origin (Tala Park)" },
    { id: "depot_central", name: "Depot Central (Sealdah)", name_bn: "সেন্ট্রাল ডিপো (শিয়ালদহ)", lat: 22.5680, lng: 88.3720, desc: "Prototype logistics origin (Sealdah Station)" },
    { id: "depot_south", name: "Depot South (Gariahat)", name_bn: "দক্ষিণ ডিপো (গড়িয়াহাট)", lat: 22.5180, lng: 88.3700, desc: "Prototype logistics origin (Gariahat Market)" }
  ],
  
  routeCache: new Map(), // Cache key: originLat,originLng;destLat,destLng
  activeRouteLayer: null,
  activeOriginMarker: null,
  activeDestMarker: null,
  allActiveRoutesGroup: null,
  
  // Active state for selected tanker
  selectedTankerId: null,
  activeRoutes: [], // List of alternate routes calculated
  activeRouteIndex: 0,
  
  /**
   * Find the closest prototype depot for a given coordinate
   */
  getClosestDepot(lat, lng) {
    let closest = this.prototypeDepots[0];
    let minDist = Infinity;
    
    this.prototypeDepots.forEach(depot => {
      const dist = Math.sqrt(Math.pow(depot.lat - lat, 2) + Math.pow(depot.lng - lng, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = depot;
      }
    });
    return closest;
  },

  /**
   * Calculate a route between origin and destination coordinates
   */
  async calculateRoute(origin, destination, options = {}) {
    const cacheKey = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)};${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
    
    if (this.routeCache.has(cacheKey)) {
      return {
        data: this.routeCache.get(cacheKey),
        status: "CACHE HIT"
      };
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500); // 8.5-second timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("HTTP-error: " + response.status);
      }
      
      const data = await response.json();
      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("OSRM returned no valid routes");
      }
      
      // Sort routes by duration to guarantee index 0 is fastest
      data.routes.sort((a, b) => a.duration - b.duration);
      
      this.routeCache.set(cacheKey, data);
      return {
        data: data,
        status: "ROUTE READY"
      };
    } catch (err) {
      console.error("Routing error:", err);
      if (err.name === 'AbortError') {
        return { status: "ROUTING SERVICE OFFLINE", error: "Request timed out" };
      }
      return {
        status: "ROUTE UNAVAILABLE",
        error: err.message || "Failed to calculate road-network route"
      };
    }
  },

  /**
   * Extract simplified step instructions for display
   */
  getSimplifiedSteps(route) {
    if (!route || !route.legs || !route.legs[0] || !route.legs[0].steps) return [];
    
    const rawSteps = route.legs[0].steps;
    const simplified = [];
    let currentRoad = "";
    
    rawSteps.forEach((step) => {
      let roadName = step.name || "";
      if (roadName.includes(";")) {
        roadName = roadName.split(";")[0]; // Simplify compound names
      }
      if (roadName && roadName !== "undefined" && roadName !== currentRoad) {
        simplified.push(roadName);
        currentRoad = roadName;
      }
    });

    if (simplified.length === 0) {
      simplified.push("Depot Exit Approach");
      simplified.push("Primary Collector Segment");
      simplified.push("Destination Ward Access Road");
    }

    return simplified;
  },

  /**
   * Render the route on the Leaflet map
   */
  showRouteOnMap(route, origin, destination, isAlternative = false) {
    if (!window.HEATSHIELD_MAP || !window.HEATSHIELD_MAP.map) return;
    const map = window.HEATSHIELD_MAP.map;
    
    this.clearRouteFromMap();

    // Create custom markers
    const originIcon = L.divIcon({
      className: "custom-depot-marker",
      html: `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border-2 border-cyan-400 text-xs font-bold shadow-lg shadow-cyan-900/50">
          🏢
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const destIcon = L.divIcon({
      className: "custom-target-marker",
      html: `
        <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border-2 border-rose-500 text-xs font-bold shadow-lg animate-pulse">
          🎯
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    this.activeOriginMarker = L.marker([origin.lat, origin.lng], { icon: originIcon })
      .bindTooltip(`<b>Logistics Origin (Depot)</b><br>${origin.name}<br><span class='text-[10px] text-slate-400'>${origin.desc}</span>`, { direction: "top" })
      .addTo(map);

    this.activeDestMarker = L.marker([destination.lat, destination.lng], { icon: destIcon })
      .bindTooltip(`<b>Designated Target (Ward Centroid)</b><br>Coordinates: ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`, { direction: "top" })
      .addTo(map);

    // Render route geometry
    const geojsonFeature = {
      type: "Feature",
      geometry: route.geometry
    };

    // Draw route line
    this.activeRouteLayer = L.geoJSON(geojsonFeature, {
      style: {
        color: isAlternative ? "#a855f7" : "#0ea5e9", // Purple for alternative, sky-blue for fastest
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round"
      }
    }).addTo(map);
  },

  /**
   * Zoom map to show the entire route
   */
  fitRouteOnMap() {
    if (!window.HEATSHIELD_MAP || !window.HEATSHIELD_MAP.map) return;
    const map = window.HEATSHIELD_MAP.map;
    
    if (this.activeRouteLayer) {
      map.fitBounds(this.activeRouteLayer.getBounds(), { padding: [60, 60], duration: 1.0 });
    }
  },

  /**
   * Remove route features from map
   */
  clearRouteFromMap() {
    if (!window.HEATSHIELD_MAP || !window.HEATSHIELD_MAP.map) return;
    const map = window.HEATSHIELD_MAP.map;

    if (this.activeRouteLayer) {
      map.removeLayer(this.activeRouteLayer);
      this.activeRouteLayer = null;
    }
    if (this.activeOriginMarker) {
      map.removeLayer(this.activeOriginMarker);
      this.activeOriginMarker = null;
    }
    if (this.activeDestMarker) {
      map.removeLayer(this.activeDestMarker);
      this.activeDestMarker = null;
    }
    if (this.allActiveRoutesGroup) {
      map.removeLayer(this.allActiveRoutesGroup);
      this.allActiveRoutesGroup = null;
    }
  },
  
  /**
   * Render all routes for assigned tankers in a subtle styling
   */
  showAllRoutesOnMap(tankersList) {
    if (!window.HEATSHIELD_MAP || !window.HEATSHIELD_MAP.map) return;
    const map = window.HEATSHIELD_MAP.map;
    
    this.clearRouteFromMap();
    
    this.allActiveRoutesGroup = L.layerGroup();
    const colors = ["#0ea5e9", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#f43f5e", "#14b8a6", "#84cc16"];
    
    tankersList.forEach((tanker, index) => {
      if (tanker.route && tanker.route.geometry) {
        const color = colors[index % colors.length];
        
        // Draw route line
        const routeLine = L.geoJSON({
          type: "Feature",
          geometry: tanker.route.geometry
        }, {
          style: {
            color: color,
            weight: 3.5,
            opacity: 0.6,
            lineCap: "round"
          }
        });
        
        // Add Tooltip to Route Line
        routeLine.bindTooltip(`<b>${tanker.name} Route</b><br>${(tanker.route.distance / 1000).toFixed(1)} km | ${Math.round(tanker.route.duration / 60)} mins`, { sticky: true });
        
        // Add markers
        const originMarker = L.circleMarker([tanker.origin.lat, tanker.origin.lng], {
          radius: 5,
          fillColor: color,
          color: "#ffffff",
          weight: 1.5,
          fillOpacity: 1.0
        }).bindTooltip(`<b>${tanker.name} Origin</b><br>${tanker.origin.name}`, { direction: "top" });
        
        const destMarker = L.circleMarker([tanker.destination.lat, tanker.destination.lng], {
          radius: 6,
          fillColor: color,
          color: "#000000",
          weight: 2.0,
          fillOpacity: 0.9
        }).bindTooltip(`<b>${tanker.name} Destination</b><br>${tanker.destination.name}`, { direction: "top" });
        
        this.allActiveRoutesGroup.addLayer(routeLine);
        this.allActiveRoutesGroup.addLayer(originMarker);
        this.allActiveRoutesGroup.addLayer(destMarker);
      }
    });
    
    this.allActiveRoutesGroup.addTo(map);
    
    // Fit map bounds to show all routes
    const bounds = L.latLngBounds();
    this.allActiveRoutesGroup.eachLayer(layer => {
      if (layer.getBounds) {
        bounds.extend(layer.getBounds());
      } else if (layer.getLatLng) {
        bounds.extend(layer.getLatLng());
      }
    });
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], duration: 1.0 });
    }
  }
};

window.HEATSHIELD_ROUTE_SERVICE = HEATSHIELD_ROUTE_SERVICE;
