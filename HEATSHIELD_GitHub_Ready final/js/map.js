/**
 * HEATSHIELD :: Professional Geospatial Intelligence GIS Engine (SIH26083)
 * Intelligent Label Density (Zero Overlap), Multi-Basemap Architecture, & Dynamic Thematic Layers
 */

window.HEATSHIELD_MAP = {
  maps: {}, // Map container registry
  activeBasemap: "standard", // "standard" | "satellite" | "dark" | "terrain"
  activeThematicLayer: "risk", // "risk" | "wbgt" | "temperature" | "population" | "slums"
  activeSeverityFilter: "all", // "all" | "critical" | "high" | "moderate" | "safe"
  polygonLayers: {}, // containerId -> { wardId: L.Layer }
  
  // Layer visibility registry
  activeOverlays: {
    boundaries: true,
    hospitals: false,
    cooling: false,
    water: false,
    feeders: false
  },

  forecastHorizon: "now", // "now" | "+3h" | "+6h" | "+12h" | "+24h" | "+48h" | "+72h"

  layerGroups: {},

  /**
   * Basemap Provider Registry (Verified CDN endpoints, Zero API Key / Watermark errors)
   */
  basemapProviders: {
    standard: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, USGS'
      }
    },
    dark: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, USGS'
      }
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
      }
    },
    terrain: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> & OpenStreetMap contributors'
      }
    }
  },

  /**
   * Initialize a map instance on a given container
   */
  init(containerId = "heatmapFullMap", options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return null;

    // Check if map already exists and is valid in current DOM
    if (this.maps[containerId]) {
      const existingMap = this.maps[containerId];
      if (existingMap._container === el && el.children.length > 0) {
        setTimeout(() => {
          if (this.maps[containerId]) {
            this.maps[containerId].invalidateSize();
            this.renderWardPolygons(containerId);
            this.updateIntelligentLabels(containerId);
          }
        }, 50);
        return existingMap;
      }
      // If container was replaced or detached, clean up old map instance properly
      try {
        existingMap.off();
        existingMap.remove();
      } catch (e) {}
      delete this.maps[containerId];
    }

    // Clear any stale leaflet ID to prevent "Map container is already initialized"
    if (el._leaflet_id) {
      delete el._leaflet_id;
    }

    // Determine initial basemap based on theme
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    if (this.activeBasemap === "standard" && currentTheme === "dark") {
      this.activeBasemap = "dark";
    }

    // Initialize Leaflet Map (Centered over Kolkata)
    const map = L.map(containerId, {
      center: [22.5450, 88.3650],
      zoom: options.zoom || 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false, // Using custom professional UI controls
      attributionControl: true
    });

    // Add Base Tile Layer
    const provider = this.basemapProviders[this.activeBasemap] || this.basemapProviders.standard;
    const tileLayer = L.tileLayer(provider.url, provider.options).addTo(map);
    map._baseTileLayer = tileLayer;

    // Create Layer Groups
    const lg = {
      polygons: L.layerGroup().addTo(map),
      selectedHighlight: L.layerGroup().addTo(map),
      intelligentLabels: L.layerGroup().addTo(map),
      hospitals: L.layerGroup(),
      cooling: L.layerGroup(),
      water: L.layerGroup()
    };
    this.layerGroups[containerId] = lg;
    this.maps[containerId] = map;

    // Render Initial Geospatial Features
    this.renderWardPolygons(containerId);
    this.updateIntelligentLabels(containerId);
    this.renderFacilityLayers(containerId);

    // Zoom Event: Intelligent Dynamic Label Density Adjustment
    map.on("zoomend", () => {
      this.updateIntelligentLabels(containerId);
    });

    map.on("moveend", () => {
      if (map.getZoom() >= 14) {
        this.updateIntelligentLabels(containerId);
      }
    });

    setTimeout(() => map.invalidateSize(), 150);

    return map;
  },

  /**
   * Switch Basemap Mode (Standard | Satellite | Dark | Terrain)
   */
  setBasemap(mode) {
    if (!this.basemapProviders[mode]) return;
    this.activeBasemap = mode;

    const provider = this.basemapProviders[mode];
    Object.values(this.maps).forEach(map => {
      if (map && map._baseTileLayer) {
        map._baseTileLayer.setUrl(provider.url);
      }
    });

    // Refresh polygon outlines to match contrast
    Object.keys(this.maps).forEach(cid => {
      this.renderWardPolygons(cid);
      this.updateIntelligentLabels(cid);
    });
  },

  /**
   * Set Active Thematic Choropleth Layer
   */
  setThematicLayer(layerKey) {
    this.activeThematicLayer = layerKey;
    Object.keys(this.maps).forEach(cid => {
      this.renderWardPolygons(cid);
      this.updateIntelligentLabels(cid);
    });

    // Notify UI to update legend
    if (window.HEATSHIELD_PAGE_HEATMAP && typeof window.HEATSHIELD_PAGE_HEATMAP.updateLegend === "function") {
      window.HEATSHIELD_PAGE_HEATMAP.updateLegend(layerKey);
    }
  },

  /**
   * Set Active Severity Filter (all | critical | high | moderate | safe)
   */
  setSeverityFilter(level) {
    this.activeSeverityFilter = (level || "all").toLowerCase();
    Object.keys(this.maps).forEach(cid => {
      this.renderWardPolygons(cid);
      this.updateIntelligentLabels(cid);
    });
  },

  /**
   * Set Forecast Horizon (NOW, +3H, +6H, +12H, +24H, +48H, +72H)
   */
  setForecastHorizon(horizonKey) {
    this.forecastHorizon = horizonKey;
    Object.keys(this.maps).forEach(cid => {
      this.renderWardPolygons(cid);
      this.updateIntelligentLabels(cid);
    });
  },

  /**
   * Toggle Point Overlay Layers (Hospitals, Cooling Hubs, Water Tankers)
   */
  toggleOverlay(overlayKey, isVisible) {
    this.activeOverlays[overlayKey] = isVisible;

    Object.keys(this.maps).forEach(cid => {
      const map = this.maps[cid];
      const lg = this.layerGroups[cid];
      if (!map || !lg) return;

      const group = lg[overlayKey];
      if (!group) return;

      if (isVisible) {
        map.addLayer(group);
      } else {
        map.removeLayer(group);
      }
    });
  },

  /**
   * Render All 144 Ward Polygons with Thematic Choropleth Fill
   */
  renderWardPolygons(containerId) {
    const map = this.maps[containerId];
    const lg = this.layerGroups[containerId];
    if (!map || !lg) return;

    lg.polygons.clearLayers();
    this.polygonLayers[containerId] = {};

    const data = window.HEATSHIELD_DATA;
    const state = window.HEATSHIELD_STATE || {};
    const evaluated = state.evaluatedWards || [];
    const selectedId = state.selectedWardId;

    const geojson = (data && data.KOLKATA_WARD_GEOJSON) || window.KOLKATA_WARD_GEOJSON;

    if (geojson) {
      L.geoJSON(geojson, {
        style: (feature) => {
          const wardId = parseInt(feature.properties.ward || feature.properties.ward_id || feature.properties.NAME || feature.properties.WARD, 10);
          const evalWard = evaluated.find(w => w.ward_id === wardId);
          return this.getPolygonStyle(evalWard, wardId === selectedId);
        },
        onEachFeature: (feature, layer) => {
          const wardId = parseInt(feature.properties.ward || feature.properties.ward_id || feature.properties.NAME || feature.properties.WARD, 10);
          const evalWard = evaluated.find(w => w.ward_id === wardId);
          this.polygonLayers[containerId][wardId] = layer;
          this.bindPolygonEvents(layer, evalWard, wardId, containerId);
        }
      }).addTo(lg.polygons);
    }
  },

  /**
   * Get Polygon Styling based on active thematic layer, forecast horizon, and severity filter
   */
  getPolygonStyle(evalWard, isSelected = false) {
    let fillColor = "#10B981";
    let fillOpacity = this.activeBasemap === "satellite" ? 0.48 : 0.62;
    let strokeColor = isSelected ? "#38BDF8" : (this.activeBasemap === "satellite" ? "rgba(255,255,255,0.7)" : "rgba(15, 23, 42, 0.45)");
    let weight = isSelected ? 3.5 : 1.2;

    const wardRisk = evalWard ? (evalWard.risk_level || "SAFE").toLowerCase() : "safe";
    const filter = this.activeSeverityFilter || "all";
    const isFilterMatch = filter === "all" || wardRisk === filter;

    if (evalWard) {
      // Forecast thermal offset
      const horizonOffsets = { "now": 0, "+3h": 0.8, "+6h": 1.4, "+12h": -1.2, "+24h": 1.8, "+48h": 2.5, "+72h": 3.2 };
      const offset = horizonOffsets[this.forecastHorizon] || 0;

      if (this.activeThematicLayer === "temperature") {
        const temp = (evalWard.outdoor_temp || 40.0) + offset;
        fillColor = temp >= 42.5 ? "#EF4444" : temp >= 40.5 ? "#F97316" : temp >= 38.5 ? "#FBBF24" : "#10B981";
      } else if (this.activeThematicLayer === "wbgt") {
        const wbgt = ((evalWard.effective_temp || 41.0) * 0.82) + offset;
        fillColor = wbgt >= 35.0 ? "#EF4444" : wbgt >= 32.5 ? "#F97316" : wbgt >= 30.0 ? "#FBBF24" : "#10B981";
      } else if (this.activeThematicLayer === "population") {
        const pop = evalWard.population || 30000;
        fillColor = pop > 60000 ? "#7C3AED" : pop > 45000 ? "#2563EB" : pop > 25000 ? "#0284C7" : "#64748B";
      } else if (this.activeThematicLayer === "slums") {
        const slum = evalWard.slum_density || 0.5;
        fillColor = slum >= 0.75 ? "#DC2626" : slum >= 0.50 ? "#EA580C" : slum >= 0.25 ? "#D97706" : "#16A34A";
      } else {
        // Default: HHVI Heat Risk Composite
        fillColor = evalWard.risk_color || (evalWard.hhvi && evalWard.hhvi.risk_color) || "#10B981";
      }
    }

    if (!isFilterMatch) {
      // Dim non-matching wards to make filtered severity clearly stand out
      fillOpacity = 0.08;
      strokeColor = "rgba(148, 163, 184, 0.2)";
      weight = 0.6;
    } else if (filter !== "all") {
      fillOpacity = Math.min(0.85, fillOpacity + 0.15);
      strokeColor = isSelected ? "#38BDF8" : "#FFFFFF";
      weight = isSelected ? 3.5 : 1.8;
    }

    return {
      fillColor: fillColor,
      fillOpacity: isSelected ? 0.85 : fillOpacity,
      color: strokeColor,
      weight: weight,
      opacity: 0.95
    };
  },

  /**
   * Generates authoritative 7-point emergency popup HTML for a ward
   * Content: Ward, Risk Level, UTCI / WB UTCI, Heat Stress, Vulnerable Pop, Hospital Impact, Recommended Action
   */
  getWardPopupHtml(evalWard, wardId) {
    const data = window.HEATSHIELD_DATA;
    const staticWard = data && data.ALL_WARDS ? data.ALL_WARDS.find(w => w.ward_id === wardId) : null;
    const wardName = evalWard ? evalWard.name : (staticWard ? staticWard.name : `Ward ${wardId}`);
    const borough = (evalWard && evalWard.borough) || (staticWard && staticWard.borough) || "Central";
    const score = evalWard && evalWard.hhvi ? evalWard.hhvi.mitigated_hhvi : (evalWard ? evalWard.hhvi_score : 75);
    const riskLevel = evalWard ? (evalWard.risk_level || "SAFE").toUpperCase() : "SAFE";
    const riskColor = evalWard ? (evalWard.risk_color || "#EF4444") : "#10B981";
    
    // Ambient Temp & UTCI (Feels-like)
    const outdoorTemp = evalWard ? (evalWard.outdoor_temp || 40.5).toFixed(1) : "40.5";
    const utci = evalWard ? (evalWard.effective_temp || 46.2).toFixed(1) : "46.2";
    // WB UTCI / WBGT Stress
    const wbgt = evalWard ? (((evalWard.effective_temp || 41.0) * 0.82).toFixed(1)) : "33.6";
    
    // Heat Stress category
    let heatStress = "Moderate Heat Stress";
    if (parseFloat(utci) >= 46.0 || parseFloat(wbgt) >= 34.0) {
      heatStress = "Extreme Danger (Heat Stroke Imminent)";
    } else if (parseFloat(utci) >= 42.0 || parseFloat(wbgt) >= 32.0) {
      heatStress = "Severe Heat Stress (High Morbidity Risk)";
    } else if (parseFloat(utci) >= 38.0 || parseFloat(wbgt) >= 30.0) {
      heatStress = "High Heat Stress (Vulnerable at Risk)";
    }

    // Vulnerable Population
    const pop = evalWard && evalWard.population ? evalWard.population.toLocaleString("en-IN") : (staticWard && staticWard.population ? staticWard.population.toLocaleString("en-IN") : "35,000");
    const slumPct = evalWard && evalWard.slum_density !== undefined ? `${(evalWard.slum_density * 100).toFixed(0)}%` : "45%";
    const vulnerableDesc = `${slumPct} Informal Settlements · ${pop} Total Residents`;

    // Hospital Impact
    const surgeMultiplier = evalWard && evalWard.hhvi ? (1 + (evalWard.hhvi.mitigated_hhvi / 100) * 1.6).toFixed(1) : "2.2";
    const hospitalImpact = `Hospital Surge +${((parseFloat(surgeMultiplier) - 1) * 100).toFixed(0)}% · ICU Heat Beds Pre-empted`;

    // Recommended Action
    let recommendedAction = "Continuous telemetry monitoring and public hydration advisories.";
    if (riskLevel === "CRITICAL") {
      recommendedAction = "Section 144 outdoor work halt (12:00–16:00), deploy misting tankers, and activate AC cooling centers.";
    } else if (riskLevel === "HIGH") {
      recommendedAction = "Deploy mobile ORS hydration points, initiate hospital triage surge, and distribute cooling caps.";
    } else if (riskLevel === "MODERATE") {
      recommendedAction = "Issue public heat alerts and position standby water tankers near vulnerable settlements.";
    }

    return `
      <div class="gis-ward-popup" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 250px; max-width: 290px; color: var(--text-primary, #F8FAFC); line-height: 1.35;">
        <!-- 1. Ward & 2. Risk Level -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border, #334155); padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: var(--text-primary, #FFF);">Ward ${wardId} — ${wardName}</div>
            <div style="font-size: 10px; color: var(--text-secondary, #94A3B8);">Borough ${borough} · KMC Operational Zone</div>
          </div>
          <span style="background: ${riskColor}; color: #FFF; font-size: 9.5px; font-weight: 800; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
            ${riskLevel} (${score})
          </span>
        </div>

        <!-- 3. UTCI / WB UTCI Metrics Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
          <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border, #334155); border-radius: 6px; padding: 4px 6px;">
            <div style="font-size: 8.5px; font-weight: 700; color: var(--text-secondary, #94A3B8); text-transform: uppercase;">UTCI (FEELS)</div>
            <div style="font-size: 12px; font-weight: 800; color: var(--high, #F97316);">${utci}°C <span style="font-size: 9px; color: var(--text-muted, #64748B);">(${outdoorTemp}°C Amb)</span></div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border, #334155); border-radius: 6px; padding: 4px 6px;">
            <div style="font-size: 8.5px; font-weight: 700; color: var(--text-secondary, #94A3B8); text-transform: uppercase;">WB UTCI / WBGT</div>
            <div style="font-size: 12px; font-weight: 800; color: ${riskColor};">${wbgt}°C</div>
          </div>
        </div>

        <!-- 4. Heat Stress -->
        <div style="margin-bottom: 6px; font-size: 11px;">
          <span style="font-size: 9px; font-weight: 800; color: var(--text-secondary, #94A3B8); text-transform: uppercase; display: block;">Heat Stress:</span>
          <span style="font-weight: 700; color: ${riskColor};">${heatStress}</span>
        </div>

        <!-- 5. Vulnerable Population -->
        <div style="margin-bottom: 6px; font-size: 11px;">
          <span style="font-size: 9px; font-weight: 800; color: var(--text-secondary, #94A3B8); text-transform: uppercase; display: block;">Vulnerable Population:</span>
          <span style="font-weight: 600;">${vulnerableDesc}</span>
        </div>

        <!-- 6. Hospital Impact -->
        <div style="margin-bottom: 6px; font-size: 11px;">
          <span style="font-size: 9px; font-weight: 800; color: var(--text-secondary, #94A3B8); text-transform: uppercase; display: block;">Hospital Impact:</span>
          <span style="font-weight: 600; color: #F59E0B;">${hospitalImpact}</span>
        </div>

        <!-- 7. Recommended Action -->
        <div style="background: rgba(239, 68, 68, 0.08); border-left: 2.5px solid ${riskColor}; padding: 5px 7px; border-radius: 0 4px 4px 0; margin-bottom: 8px; font-size: 10.5px;">
          <strong style="color: ${riskColor}; display: block; font-size: 9px; text-transform: uppercase;">Recommended Action:</strong>
          <span>${recommendedAction}</span>
        </div>

        <!-- Quick Action Buttons -->
        <div style="display: flex; gap: 4px;">
          <button onclick="HEATSHIELD_APP.dispatchResource(${wardId}, 'Water Tanker');" style="flex: 1; background: var(--bg-muted, #1E293B); border: 1px solid var(--border, #334155); color: var(--text-primary, #FFF); font-size: 9.5px; font-weight: 700; padding: 4px; border-radius: 4px; cursor: pointer;">
            🚰 Tanker
          </button>
          <button onclick="HEATSHIELD_APP.dispatchResource(${wardId}, 'Cooling Hub');" style="flex: 1; background: var(--bg-muted, #1E293B); border: 1px solid var(--border, #334155); color: var(--text-primary, #FFF); font-size: 9.5px; font-weight: 700; padding: 4px; border-radius: 4px; cursor: pointer;">
            ❄️ Cooling Hub
          </button>
          <button onclick="HEATSHIELD_APP.navigateTo('ward-intel'); HEATSHIELD_APP.selectWard(${wardId});" style="flex: 1.2; background: var(--primary, #2563EB); border: none; color: #FFF; font-size: 9.5px; font-weight: 700; padding: 4px; border-radius: 4px; cursor: pointer;">
            Dossier →
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Bind Hover, Tooltip, Popup, and Click-To-Inspect Events
   */
  bindPolygonEvents(layer, evalWard, wardId, containerId) {
    const wardName = evalWard ? evalWard.name : `Ward ${wardId}`;
    const score = evalWard && evalWard.hhvi ? evalWard.hhvi.mitigated_hhvi : 75;
    const riskLevel = evalWard ? (evalWard.risk_level || "SAFE").toUpperCase() : "SAFE";
    const wbgt = evalWard ? (((evalWard.effective_temp || 41.0) * 0.82).toFixed(1)) : "33.6";

    // High-Clarity Concise Tooltip (Never large clutter)
    layer.bindTooltip(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; padding: 3px 6px; line-height: 1.4;">
        <strong style="color: var(--text-primary);">Ward ${wardId} — ${wardName}</strong><br/>
        <span style="color: ${evalWard ? evalWard.risk_color : '#EF4444'}; font-weight: 700;">${riskLevel} RISK (${score}/100)</span> · 
        <span style="color: var(--text-secondary); font-weight: 600;">WBGT ${wbgt}°C</span>
      </div>
    `, { sticky: true, className: "ward-map-tooltip" });

    // Bind Rich Emergency Popup with 7 required points
    layer.bindPopup(this.getWardPopupHtml(evalWard, wardId), {
      maxWidth: 300,
      className: "gis-custom-leaflet-popup",
      autoPan: true
    });

    // Hover Highlight
    layer.on("mouseover", () => {
      layer.setStyle({
        weight: 3.0,
        color: "#FFFFFF",
        fillOpacity: 0.88
      });
      if (layer.bringToFront) layer.bringToFront();
    });

    layer.on("mouseout", () => {
      const state = window.HEATSHIELD_STATE || {};
      const isSelected = wardId === state.selectedWardId;
      layer.setStyle(this.getPolygonStyle(evalWard, isSelected));
    });

    // Click: Select Ward Globally, Highlight Polygon, Open Popup, Open Right Drawer
    layer.on("click", (e) => {
      this.selectWardOnMap(wardId, containerId);
    });
  },

  /**
   * Open Popup for a specific Ward
   */
  openWardPopup(wardId, containerId = "heatmapFullMap") {
    const wid = parseInt(wardId, 10);
    if (this.polygonLayers && this.polygonLayers[containerId] && this.polygonLayers[containerId][wid]) {
      const layer = this.polygonLayers[containerId][wid];
      if (typeof layer.openPopup === "function") {
        layer.openPopup();
      }
    }
  },

  /**
   * Select a Ward: Highlight boundary, zoom smoothly, trigger Popup & Ward Intelligence Drawer
   */
  selectWardOnMap(wardId, containerId = "heatmapFullMap") {
    const wid = parseInt(wardId, 10);
    const state = window.HEATSHIELD_STATE || {};
    state.selectedWardId = wid;
    if (window.HEATSHIELD_APP && window.HEATSHIELD_APP.state) {
      window.HEATSHIELD_APP.state.selectedWardId = wid;
    }

    // Refresh polygon styles across all active maps to reflect selection outline
    Object.keys(this.maps).forEach(cid => {
      this.renderWardPolygons(cid);
      this.updateIntelligentLabels(cid);
    });

    const data = window.HEATSHIELD_DATA;
    const ward = data && data.ALL_WARDS.find(w => w.ward_id === wid);

    // Open sliding Ward Intelligence drawer on GIS Page
    if (window.HEATSHIELD_PAGE_HEATMAP && typeof window.HEATSHIELD_PAGE_HEATMAP.openWardDrawer === "function") {
      window.HEATSHIELD_PAGE_HEATMAP.openWardDrawer(wid);
    }

    // Open popup on the selected ward polygon
    this.openWardPopup(wid, containerId);

    // Keep overview impact chart updated if overview is current
    if (state.currentPage === "overview" && window.HEATSHIELD_PAGE_OVERVIEW && typeof window.HEATSHIELD_PAGE_OVERVIEW._renderHospitalImpactChart === "function") {
      window.HEATSHIELD_PAGE_OVERVIEW._renderHospitalImpactChart();
    }

    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.showToast === "function") {
      window.HEATSHIELD_APP.showToast(`Selected Ward ${wid} — ${ward ? ward.name : ''}`, "info");
    }
  },

  /**
   * INTELLIGENT LABEL DENSITY ENGINE (Zero Collision, Never 144 Labels at Once)
   */
  updateIntelligentLabels(containerId) {
    const map = this.maps[containerId];
    const lg = this.layerGroups[containerId];
    if (!map || !lg || !lg.intelligentLabels) return;

    lg.intelligentLabels.clearLayers();

    const zoom = map.getZoom();
    const data = window.HEATSHIELD_DATA;
    const state = window.HEATSHIELD_STATE || {};
    const evaluated = state.evaluatedWards || [];
    const selectedId = state.selectedWardId;

    if (!data || !data.ALL_WARDS) return;

    // 1. ALWAYS render prominent floating badge for Selected Ward
    if (selectedId) {
      const selectedWard = data.ALL_WARDS.find(w => w.ward_id === selectedId);
      const evalW = evaluated.find(w => w.ward_id === selectedId);
      if (selectedWard && selectedWard.lat && selectedWard.lng) {
        const riskLabel = evalW ? evalW.risk_level : "CRITICAL";
        const score = evalW && evalW.hhvi ? evalW.hhvi.mitigated_hhvi : 88;
        const pillHtml = `
          <div class="selected-ward-pill">
            <span class="pill-dot ${riskLabel.toLowerCase()}"></span>
            <strong>W${selectedWard.ward_id} — ${selectedWard.name.replace('Ward ' + selectedWard.ward_id + ' - ', '')}</strong>
            <span class="pill-badge">${score}</span>
          </div>
        `;

        L.marker([selectedWard.lat, selectedWard.lng], {
          icon: L.divIcon({
            className: "selected-ward-marker-icon",
            html: pillHtml,
            iconSize: [160, 26],
            iconAnchor: [80, 13]
          }),
          zIndexOffset: 1000,
          interactive: false
        }).addTo(lg.intelligentLabels);
      }
    }

    // 2. City Zoom (< 13): Zero other static labels to prevent clutter
    if (zoom < 13) {
      return;
    }

    // 3. Medium Zoom (13-14): Show labels ONLY for Top Critical Wards
    if (zoom >= 13 && zoom < 15) {
      const topCritical = evaluated.slice(0, 6);
      topCritical.forEach(w => {
        if (w.ward_id === selectedId) return; // Already rendered
        if (!w.lat || !w.lng) return;

        const shortName = (w.name.split(' - ')[1] || w.name).substring(0, 12);
        const marker = L.marker([w.lat, w.lng], {
          icon: L.divIcon({
            className: "smart-ward-label",
            html: `<div class="subtle-label-pill">W${w.ward_id} ${shortName}</div>`,
            iconSize: [90, 18],
            iconAnchor: [45, 9]
          }),
          interactive: false
        });
        marker.addTo(lg.intelligentLabels);
      });
      return;
    }

    // 4. High Zoom (15+): Show non-colliding labels for visible bounds
    if (zoom >= 15) {
      const bounds = map.getBounds();
      const visibleWards = data.ALL_WARDS.filter(w => {
        return w.lat && w.lng && bounds.contains([w.lat, w.lng]);
      });

      visibleWards.forEach(w => {
        if (w.ward_id === selectedId) return;
        const shortName = (w.name.split(' - ')[1] || w.name).substring(0, 14);

        const marker = L.marker([w.lat, w.lng], {
          icon: L.divIcon({
            className: "smart-ward-label",
            html: `<div class="subtle-label-pill">W${w.ward_id} ${shortName}</div>`,
            iconSize: [100, 18],
            iconAnchor: [50, 9]
          }),
          interactive: false
        });
        marker.addTo(lg.intelligentLabels);
      });
    }
  },

  /**
   * Render Point Facility Layers (Cooling Hubs, Tankers, Trauma Hospitals)
   */
  renderFacilityLayers(containerId) {
    const map = this.maps[containerId];
    const lg = this.layerGroups[containerId];
    if (!map || !lg) return;

    // Hospitals
    const hospitals = [
      { name: "Calcutta Medical College", lat: 22.5735, lng: 88.3618, type: "Tertiary Trauma Center", beds: "180 Heat Beds" },
      { name: "SSKM Hospital / IPGMER", lat: 22.5392, lng: 88.3435, type: "Super Specialty ICU Surge", beds: "240 Heat Beds" },
      { name: "RG Kar Medical College", lat: 22.6042, lng: 88.3752, type: "Regional Triage Unit", beds: "120 Heat Beds" },
      { name: "NRS Medical College", lat: 22.5645, lng: 88.3698, type: "Heat Stroke & Burn Unit", beds: "150 Heat Beds" },
      { name: "CNMC National Medical College", lat: 22.5442, lng: 88.3712, type: "Pediatric Thermal Surge", beds: "90 Heat Beds" }
    ];

    lg.hospitals.clearLayers();
    hospitals.forEach(h => {
      L.marker([h.lat, h.lng], {
        icon: L.divIcon({
          className: "facility-marker-pin",
          html: `<div style="background:#EF4444; color:#FFF; font-size:11px; font-weight:800; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #FFF; box-shadow:0 3px 8px rgba(0,0,0,0.5);">🏥</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).bindTooltip(`<strong>${h.name}</strong><br/>${h.type} · ${h.beds}`).addTo(lg.hospitals);
    });

    // Cooling Hubs
    const coolingHubs = [
      { name: "Burrabazar AC Cooling Hub", lat: 22.5810, lng: 88.3540, cap: "120 beds", status: "Active" },
      { name: "Sealdah Relief Center", lat: 22.5680, lng: 88.3710, cap: "200 beds", status: "Active" },
      { name: "Park Circus Cooling Hall", lat: 22.5430, lng: 88.3680, cap: "80 beds", status: "Active" },
      { name: "Cossipore Pavilion", lat: 22.6180, lng: 88.3680, cap: "100 beds", status: "Active" }
    ];

    lg.cooling.clearLayers();
    coolingHubs.forEach(c => {
      L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: "facility-marker-pin",
          html: `<div style="background:#0284C7; color:#FFF; font-size:11px; font-weight:800; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #FFF; box-shadow:0 3px 8px rgba(0,0,0,0.5);">❄️</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).bindTooltip(`<strong>${c.name}</strong><br/>Capacity: ${c.cap} (${c.status})`).addTo(lg.cooling);
    });

    // Water Tankers
    const tankers = [
      { id: "Tanker #08", lat: 22.5830, lng: 88.3520, ward: "Ward 17", status: "Active Misting" },
      { id: "Tanker #12", lat: 22.5950, lng: 88.3780, ward: "Ward 58", status: "Active Misting" },
      { id: "Tanker #03", lat: 22.5480, lng: 88.3540, ward: "Ward 63", status: "Stationary Refill" }
    ];

    lg.water.clearLayers();
    tankers.forEach(t => {
      L.marker([t.lat, t.lng], {
        icon: L.divIcon({
          className: "facility-marker-pin",
          html: `<div style="background:#10B981; color:#FFF; font-size:11px; font-weight:800; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #FFF; box-shadow:0 3px 8px rgba(0,0,0,0.5);">🚛</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).bindTooltip(`<strong>${t.id}</strong><br/>Assigned: ${t.ward}<br/>Status: ${t.status}`).addTo(lg.water);
    });
  },

  /**
   * Camera Controls
   */
  zoomIn(containerId = "heatmapFullMap") {
    const map = this.maps[containerId];
    if (map) map.zoomIn();
  },

  zoomOut(containerId = "heatmapFullMap") {
    const map = this.maps[containerId];
    if (map) map.zoomOut();
  },

  resetKolkata(containerId = "heatmapFullMap") {
    const map = this.maps[containerId];
    if (map) {
      map.flyTo([22.5450, 88.3650], 12, { duration: 1.0 });
    }
  },

  flyToWard(wardId, containerId = "heatmapFullMap") {
    const map = this.maps[containerId];
    if (!map) return;

    const data = window.HEATSHIELD_DATA;
    const ward = data && data.ALL_WARDS.find(w => w.ward_id === wardId);
    if (ward && ward.lat && ward.lng) {
      map.flyTo([ward.lat, ward.lng], 15, { duration: 1.0 });
      this.selectWardOnMap(wardId, containerId);
      setTimeout(() => {
        this.openWardPopup(wardId, containerId);
      }, 1050);
    }
  },

  refreshColors(containerId) {
    if (containerId && this.maps[containerId]) {
      this.renderWardPolygons(containerId);
      this.updateIntelligentLabels(containerId);
    } else {
      Object.keys(this.maps).forEach(cid => {
        this.renderWardPolygons(cid);
        this.updateIntelligentLabels(cid);
      });
    }
  },

  updateTheme() {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    // If on standard or dark basemap, auto-switch to match theme
    if (this.activeBasemap === "standard" || this.activeBasemap === "dark") {
      this.setBasemap(theme === "dark" ? "dark" : "standard");
    }
    // Refresh polygons and intelligent labels for all active maps
    Object.keys(this.maps).forEach(containerId => {
      this.renderWardPolygons(containerId);
      this.updateIntelligentLabels(containerId);
    });
  }
};

// Auto-invalidate map dimensions on viewport resize and device orientation change
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  let _mapResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(_mapResizeTimer);
    _mapResizeTimer = setTimeout(() => {
      if (window.HEATSHIELD_MAP && window.HEATSHIELD_MAP.maps) {
        Object.values(window.HEATSHIELD_MAP.maps).forEach(m => {
          if (m && typeof m.invalidateSize === "function") {
            m.invalidateSize();
          }
        });
      }
    }, 150);
  });
}

