/**
 * HEATSHIELD :: KCAP-2025 Logistics Fleet Tracking Service
 * Professional Live Fleet Tracking & Route-Interpolated GPS Simulator
 */

const HEATSHIELD_FLEET_SERVICE = {
  mode: "SIMULATION", // SIMULATION | REAL
  simulationSpeed: 1.0, // 0.5x, 1x, 2x, 5x
  isPaused: false,
  animationFrameId: null,
  lastFrameTime: 0,
  
  // Real GPS WebSocket or Polling status
  connectionStatus: "SIMULATION", // SIMULATION | CONNECTED | DISCONNECTED | OFFLINE
  lastSync: null,
  
  // Map markers store (key: tankerId -> Leaflet marker/polyline objects)
  mapMarkers: new Map(),
  mapPolylines: new Map(),

  /**
   * Abstract Interface for Future smartphone/GPS tracker integration
   */
  fleetTrackingService: {
    async getTankerLocation(tankerId) {
      console.log(`[REAL GPS] API Request: Fetching coordinates for ${tankerId}`);
      return null;
    },
    subscribeToTankerUpdates(tankerId, callback) {
      console.log(`[REAL GPS] WebSocket Subscription initialized for ${tankerId}`);
      return () => console.log(`[REAL GPS] WebSocket unsubscribed for ${tankerId}`);
    },
    sendTankerLocation(tankerId, lat, lng, speed, heading) {
      console.log(`[REAL GPS] POST: Sending coordinates for ${tankerId} (${lat}, ${lng})`);
    },
    disconnect() {
      console.log("[REAL GPS] WebSocket Connection Closed.");
    }
  },

  init() {
    this.lastFrameTime = performance.now();
    this.startSimulationLoop();
  },

  /**
   * Main game-loop style simulation updates using requestAnimationFrame
   */
  startSimulationLoop() {
    const loop = (time) => {
      this.animationFrameId = requestAnimationFrame(loop);
      
      const dt = (time - this.lastFrameTime) / 1000; // seconds elapsed
      this.lastFrameTime = time;
      
      if (this.isPaused || this.mode !== "SIMULATION") return;
      
      this.updateSimulation(dt);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  stopSimulationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  },

  _getState() {
    return window.HEATSHIELD_STATE || (window.HEATSHIELD_APP ? window.HEATSHIELD_APP.state : null);
  },

  /**
   * Update all active simulated tankers along their routes
   */
  updateSimulation(dt) {
    const state = this._getState();
    if (!state || !state.assignedTankers || state.assignedTankers.length === 0) return;
    
    let stateChanged = false;
    
    state.assignedTankers.forEach(tanker => {
      if (tanker.status !== "EN_ROUTE" || !tanker.route || !tanker.route.geometry) return;
      
      stateChanged = true;
      const coords = tanker.route.geometry.coordinates; // Array of [lng, lat]
      if (!coords || coords.length < 2) return;
      
      // Calculate distances along the path
      if (!tanker.segmentDistances) {
        this.initializeRouteDistances(tanker, coords);
      }
      
      // Speed in meters per second (speed is km/h, convert to m/s: / 3.6)
      const currentSpeed = tanker.speedKmh || 30;
      const speedMps = (currentSpeed / 3.6) * this.simulationSpeed;
      
      tanker.distanceTraveled = (tanker.distanceTraveled || 0) + (speedMps * dt);
      
      if (tanker.distanceTraveled >= tanker.totalRouteDistance) {
        // Tanker arrived!
        tanker.distanceTraveled = tanker.totalRouteDistance;
        tanker.lat = coords[coords.length - 1][1];
        tanker.lng = coords[coords.length - 1][0];
        tanker.status = "ARRIVED";
        tanker.speedKmh = 0;
        tanker.distanceRemaining = 0;
        tanker.eta = 0;
        tanker.routeProgress = 100;
        tanker.lastUpdated = new Date().toLocaleTimeString();
        
        // Log arrival event
        const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        if (state.alertLogs) {
          state.alertLogs.unshift({
            time: nowTime,
            text: `SIMULATION EVENT: ${tanker.name} arrived at Ward ${tanker.destination.ward_id} (Centroid). Resource delivery ready.`,
            type: "action"
          });
        }
        
        window.HEATSHIELD_SFX?.playDeploy();
        
        if (window.HEATSHIELD_APP) {
          if (typeof window.HEATSHIELD_APP.renderLogisticsRouteCard === "function") {
            window.HEATSHIELD_APP.renderLogisticsRouteCard();
          }
          if (typeof window.HEATSHIELD_APP.renderAlertTimeline === "function") {
            window.HEATSHIELD_APP.renderAlertTimeline(window.HEATSHIELD_I18N?.currentLang === "bn");
          }
        }
      } else {
        // Interpolate current position along polyline coords
        const pos = this.getPositionAtDistance(coords, tanker.segmentDistances, tanker.distanceTraveled);
        tanker.lat = pos.lat;
        tanker.lng = pos.lng;
        tanker.heading = Math.round(pos.bearing);
        tanker.distanceRemaining = Number(((tanker.totalRouteDistance - tanker.distanceTraveled) / 1000).toFixed(2)); // km
        tanker.eta = Math.round((tanker.totalRouteDistance - tanker.distanceTraveled) / speedMps / 60); // minutes remaining
        tanker.routeProgress = Math.round((tanker.distanceTraveled / tanker.totalRouteDistance) * 100);
        tanker.lastUpdated = new Date().toLocaleTimeString();
      }
      
      // Update marker position and heading rotation on map
      this.updateTankerMapMarker(tanker);
    });
    
    if (stateChanged && window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.renderLogisticsRouteCard === "function") {
      window.HEATSHIELD_APP.renderLogisticsRouteCard();
    }
  },

  /**
   * Pre-calculate cumulative and segment distances along route coordinates
   */
  initializeRouteDistances(tanker, coords) {
    const segmentDistances = [];
    let totalDistance = 0;
    
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i]; // [lng, lat]
      const p2 = coords[i + 1];
      const dist = this.haversineDistance(p1[1], p1[0], p2[1], p2[0]); // meters
      segmentDistances.push(dist);
      totalDistance += dist;
    }
    
    tanker.segmentDistances = segmentDistances;
    tanker.totalRouteDistance = totalDistance;
    tanker.distanceTraveled = 0;
  },

  /**
   * Haversine distance in meters
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // meters
  },

  /**
   * Find coordinates [lat, lng] and bearing at a distance traveled along coordinates
   */
  getPositionAtDistance(coords, segmentDistances, distance) {
    let accumulatedDistance = 0;
    
    for (let i = 0; i < segmentDistances.length; i++) {
      const segmentDist = segmentDistances[i];
      if (accumulatedDistance + segmentDist >= distance) {
        const remainingDistOnSegment = distance - accumulatedDistance;
        const fraction = remainingDistOnSegment / segmentDist;
        
        const p1 = coords[i]; // [lng, lat]
        const p2 = coords[i + 1];
        
        const lat = p1[1] + (p2[1] - p1[1]) * fraction;
        const lng = p1[0] + (p2[0] - p1[0]) * fraction;
        const bearing = this.calculateBearing(p1[1], p1[0], p2[1], p2[0]);
        
        return { lat, lng, bearing };
      }
      accumulatedDistance += segmentDist;
    }
    
    const lastPt = coords[coords.length - 1];
    return { lat: lastPt[1], lng: lastPt[0], bearing: 0 };
  },

  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  },

  /**
   * Update or create the Leaflet marker for a tanker
   */
  updateTankerMapMarker(tanker) {
    if (!window.HEATSHIELD_MAP || !window.HEATSHIELD_MAP.map) return;
    const map = window.HEATSHIELD_MAP.map;
    
    const isSelected = window.HEATSHIELD_STATE.selectedTankerId === tanker.id;
    
    let statusColor = "#10B981"; // green
    if (tanker.status === "STOPPED") statusColor = "#F59E0B"; // yellow/orange
    if (tanker.status === "ARRIVED") statusColor = "#3B82F6"; // blue
    if (tanker.status === "OFFLINE") statusColor = "#EF4444"; // red
    if (tanker.status === "AVAILABLE") statusColor = "#94A3B8"; // grey/white
    
    const rotation = tanker.heading || 0;
    
    const svgIcon = `
      <div class="relative flex items-center justify-center transition-transform" style="transform: rotate(${rotation}deg);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="3" width="14" height="18" rx="2" fill="#0f172a" stroke="${statusColor}" stroke-width="2.5"/>
          <rect x="7" y="5" width="10" height="9" rx="1" fill="${statusColor}" fill-opacity="0.3" stroke="${statusColor}" stroke-width="1.5"/>
          <line x1="12" y1="3" x2="12" y2="21" stroke="${statusColor}" stroke-width="1.5" stroke-dasharray="2,2"/>
          <circle cx="5" cy="8" r="1.5" fill="#f1f5f9"/>
          <circle cx="19" cy="8" r="1.5" fill="#f1f5f9"/>
          <circle cx="5" cy="16" r="1.5" fill="#f1f5f9"/>
          <circle cx="19" cy="16" r="1.5" fill="#f1f5f9"/>
        </svg>
        <span class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[7px] font-black text-white">${tanker.name.split("#")[1]}</span>
      </div>
    `;
    
    const tankerIcon = L.divIcon({
      className: `custom-tanker-tracking-marker ${isSelected ? 'tanker-selected-ring' : ''}`,
      html: svgIcon,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    let marker = this.mapMarkers.get(tanker.id);
    if (marker) {
      marker.setLatLng([tanker.lat, tanker.lng]);
      marker.setIcon(tankerIcon);
    } else {
      marker = L.marker([tanker.lat, tanker.lng], { icon: tankerIcon }).addTo(map);
      
      marker.on("click", () => {
        window.HEATSHIELD_STATE.selectedTankerId = tanker.id;
        const tankerIdx = window.HEATSHIELD_STATE.assignedTankers.findIndex(t => t.id === tanker.id);
        if (tankerIdx !== -1) {
          window.HEATSHIELD_STATE.selectedTankerIndex = tankerIdx;
          if (window.HEATSHIELD_APP) {
            window.HEATSHIELD_APP.renderLogisticsRouteCard();
            window.HEATSHIELD_APP.selectWard(tanker.destination.ward_id);
          }
        }
      });
      
      this.mapMarkers.set(tanker.id, marker);
    }
    
    marker.bindTooltip(`<b>${tanker.name}</b><br>Status: <span class="font-bold" style="color:${statusColor}">${tanker.status}</span><br>ETA: ${tanker.eta} mins<br>Speed: ${tanker.speedKmh} km/h`, { direction: "top" });
    
    let polyline = this.mapPolylines.get(tanker.id);
    if (tanker.route && tanker.route.geometry) {
      const geojsonFeature = {
        type: "Feature",
        geometry: tanker.route.geometry
      };
      
      if (polyline) {
        map.removeLayer(polyline);
      }
      
      polyline = L.geoJSON(geojsonFeature, {
        style: {
          color: isSelected ? "#0ea5e9" : "#475569",
          weight: isSelected ? 4.5 : 2.0,
          opacity: isSelected ? 0.85 : 0.45,
          lineCap: "round"
        }
      }).addTo(map);
      this.mapPolylines.set(tanker.id, polyline);
    }
  },

  clearAllMapFeatures() {
    if (!window.HEATSHIELD_MAP || !window.HEATSHIELD_MAP.map) return;
    const map = window.HEATSHIELD_MAP.map;
    
    this.mapMarkers.forEach(marker => map.removeLayer(marker));
    this.mapMarkers.clear();
    
    this.mapPolylines.forEach(polyline => map.removeLayer(polyline));
    this.mapPolylines.clear();
  },

  startSimulationForTanker(tanker) {
    if (!tanker || !tanker.route) return;
    
    tanker.status = "EN_ROUTE";
    tanker.speedKmh = 30; // default simulation speed
    tanker.lastUpdated = new Date().toLocaleTimeString();
    
    const state = this._getState();
    if (state && state.alertLogs) {
      const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      state.alertLogs.unshift({
        time: nowTime,
        text: `SIMULATION EVENT: ${tanker.name} departed Depot for Ward ${tanker.destination.ward_id} centroid.`,
        type: "sync"
      });
    }
    
    if (window.HEATSHIELD_APP) {
      if (typeof window.HEATSHIELD_APP.renderLogisticsRouteCard === "function") {
        window.HEATSHIELD_APP.renderLogisticsRouteCard();
      }
      if (typeof window.HEATSHIELD_APP.renderAlertTimeline === "function") {
        window.HEATSHIELD_APP.renderAlertTimeline(window.HEATSHIELD_I18N?.currentLang === "bn");
      }
    }
  },

  pauseSimulation() {
    this.isPaused = true;
    const state = this._getState();
    if (!state || !state.assignedTankers) return;
    state.assignedTankers.forEach(tanker => {
      if (tanker.status === "EN_ROUTE") {
        tanker.status = "STOPPED";
      }
    });
    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.renderLogisticsRouteCard === "function") {
      window.HEATSHIELD_APP.renderLogisticsRouteCard();
    }
  },

  resumeSimulation() {
    this.isPaused = false;
    const state = this._getState();
    if (!state || !state.assignedTankers) return;
    state.assignedTankers.forEach(tanker => {
      if (tanker.status === "STOPPED") {
        tanker.status = "EN_ROUTE";
      }
    });
    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.renderLogisticsRouteCard === "function") {
      window.HEATSHIELD_APP.renderLogisticsRouteCard();
    }
  },

  resetSimulation() {
    this.clearAllMapFeatures();
    const state = this._getState();
    if (!state || !state.assignedTankers) return;
    state.assignedTankers.forEach(tanker => {
      tanker.status = "ROUTE NOT LOADED";
      tanker.route = null;
      tanker.alternatives = null;
      tanker.alternativeIndex = 0;
      tanker.segmentDistances = null;
      tanker.totalRouteDistance = 0;
      tanker.distanceTraveled = 0;
      tanker.lat = null;
      tanker.lng = null;
      tanker.speedKmh = 0;
      tanker.distanceRemaining = 0;
      tanker.eta = 0;
      tanker.routeProgress = 0;
    });
    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.renderLogisticsRouteCard === "function") {
      window.HEATSHIELD_APP.renderLogisticsRouteCard();
    }
  }
};

window.HEATSHIELD_FLEET_SERVICE = HEATSHIELD_FLEET_SERVICE;
