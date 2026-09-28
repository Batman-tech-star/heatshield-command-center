/**
 * HEATSHIELD :: Tactical Geospatial Intelligence Command Center (Page 4 Rebuild)
 * Rebuilt from the ground up: Segmented Basemap Switcher, Grouped Layer Panel, Dynamic Legend, Forecast Slider, Sliding Ward Drawer & 144-Ward Index
 */

window.HEATSHIELD_PAGE_HEATMAP = {
  _isWardDrawerOpen: false,
  _isWardIndexOpen: false,
  _isLayerPanelOpen: true,
  _wardSearchQuery: "",

  render(state) {
    const container = document.getElementById("pageHeatmap");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const map = window.HEATSHIELD_MAP;
    const evaluated = s.evaluatedWards || [];
    const liveWeather = (window.HEATSHIELD_ENGINE && window.HEATSHIELD_ENGINE.liveWeather) || { temp: 40.8, apparent_temp: 46.2, rh: 64 };
    const selectedWard = evaluated.find(w => w.ward_id === s.selectedWardId) || evaluated[0] || {};

    const activeThematic = map ? map.activeThematicLayer : "risk";
    const activeBasemap = map ? map.activeBasemap : "standard";
    const activeHorizon = map ? map.forecastHorizon : "now";
    const activeSeverity = map ? map.activeSeverityFilter : "all";

    // If GIS canvas and layout are already mounted in DOM, do NOT destroy them!
    const existingCanvas = document.getElementById("heatmapFullMap");
    if (existingCanvas && container.querySelector(".gis-master-layout")) {
      this._updateDrawer(selectedWard);
      if (window.HEATSHIELD_MAP) {
        window.HEATSHIELD_MAP.init("heatmapFullMap", { zoom: 12 });
        setTimeout(() => {
          const m = window.HEATSHIELD_MAP.maps["heatmapFullMap"];
          if (m && typeof m.invalidateSize === "function") {
            m.invalidateSize();
          }
        }, 50);
      }
      return;
    }

    container.innerHTML = `
      <div class="gis-master-layout">
        <!-- 1. COMPACT TACTICAL GIS HEADER -->
        <header class="gis-header">
          <div class="gis-header-left">
            <div class="gis-title-badge">GIS COMMAND</div>
            <div>
              <div class="gis-title">Kolkata Municipal Corporation · 144 Spatial Wards</div>
              <div class="gis-subtitle">Authoritative multi-hazard biometeorological & epidemiological geospatial intelligence</div>
            </div>
          </div>

          <!-- Risk Severity Filter Bar (All Wards | Critical | High | Moderate | Safe) -->
          <div class="gis-severity-bar">
            <span class="severity-title">FILTER:</span>
            <button class="severity-btn ${activeSeverity === 'all' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setSeverity('all')">
              All Wards
            </button>
            <button class="severity-btn critical ${activeSeverity === 'critical' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setSeverity('critical')">
              Critical
            </button>
            <button class="severity-btn high ${activeSeverity === 'high' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setSeverity('high')">
              High
            </button>
            <button class="severity-btn moderate ${activeSeverity === 'moderate' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setSeverity('moderate')">
              Moderate
            </button>
            <button class="severity-btn safe ${activeSeverity === 'safe' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setSeverity('safe')">
              Safe
            </button>
          </div>

          <!-- Quick Preset Layer Buttons -->
          <div class="gis-preset-bar">
            <button class="preset-btn ${activeThematic === 'risk' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setThematic('risk')">
              Heat Risk (HHVI)
            </button>
            <button class="preset-btn ${activeThematic === 'wbgt' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setThematic('wbgt')">
              WBGT Stress
            </button>
            <button class="preset-btn ${activeThematic === 'temperature' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setThematic('temperature')">
              Surface Temp
            </button>
            <button class="preset-btn ${activeThematic === 'population' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setThematic('population')">
              Demographics
            </button>
            <button class="preset-btn" onclick="HEATSHIELD_PAGE_HEATMAP.toggleWardIndex()">
              144 Wards Index
            </button>
          </div>

          <!-- Threat Summary Badge -->
          <div class="gis-threat-strip">
            <div class="threat-kpi">
              <span class="threat-kpi-label">CURRENT HAZARD</span>
              <span class="threat-kpi-val text-critical">SEVERE (FEELS 46.2°C)</span>
            </div>
            <div class="threat-divider"></div>
            <div class="threat-kpi">
              <span class="threat-kpi-label">LAST SYNC</span>
              <span class="threat-kpi-val">09:45 IST (ALIPORE)</span>
            </div>
          </div>
        </header>

        <!-- 2. FULL-VIEWPORT MAP CANVAS -->
        <div class="gis-canvas-wrapper">
          <div id="heatmapFullMap" class="gis-leaflet-canvas"></div>

          <!-- FLOATING LEFT CAMERA CONTROLS -->
          <div class="gis-floating-ctrls-left">
            <button class="gis-map-btn" onclick="HEATSHIELD_MAP.zoomIn()" title="Zoom In">+</button>
            <button class="gis-map-btn" onclick="HEATSHIELD_MAP.zoomOut()" title="Zoom Out">−</button>
            <button class="gis-map-btn" onclick="HEATSHIELD_MAP.resetKolkata()" title="Reset to City View">⊙</button>
          </div>

          <!-- FLOATING TOP-RIGHT: BASEMAP SEGMENTED SWITCHER -->
          <div class="gis-basemap-card">
            <div class="text-xxs font-bold text-muted uppercase tracking-wider mb-1.5">BASEMAP PROVIDER</div>
            <div class="segmented-basemap">
              <button class="seg-btn ${activeBasemap === 'standard' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setBasemap('standard')">
                Standard
              </button>
              <button class="seg-btn ${activeBasemap === 'satellite' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setBasemap('satellite')">
                Satellite
              </button>
              <button class="seg-btn ${activeBasemap === 'dark' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setBasemap('dark')">
                EOC Dark
              </button>
              <button class="seg-btn ${activeBasemap === 'terrain' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setBasemap('terrain')">
                Terrain
              </button>
            </div>
          </div>

          <!-- FLOATING RIGHT: GROUPED GIS LAYER PANEL -->
          <div class="gis-layer-drawer ${this._isLayerPanelOpen ? 'open' : 'collapsed'}">
            <div class="layer-drawer-header" onclick="HEATSHIELD_PAGE_HEATMAP.toggleLayerPanel()">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs">Tactical GIS Layers</span>
              </div>
              <span class="text-xs">${this._isLayerPanelOpen ? '▼' : '▲'}</span>
            </div>

            ${this._isLayerPanelOpen ? `
              <div class="layer-drawer-body">
                <!-- Group 1: Risk & Hazard -->
                <div class="layer-group">
                  <div class="layer-group-title">Risk & Hazard Assessment</div>
                  <label class="layer-option">
                    <input type="radio" name="thematicLayer" ${activeThematic === 'risk' ? 'checked' : ''} onchange="HEATSHIELD_PAGE_HEATMAP.setThematic('risk')" />
                    <span>Heat Risk Composite (HHVI)</span>
                    <span class="provenance-badge modelled">MODELLED</span>
                  </label>
                  <label class="layer-option">
                    <input type="radio" name="thematicLayer" ${activeThematic === 'wbgt' ? 'checked' : ''} onchange="HEATSHIELD_PAGE_HEATMAP.setThematic('wbgt')" />
                    <span>Wet-Bulb Globe Temp (WBGT)</span>
                    <span class="provenance-badge derived">DERIVED</span>
                  </label>
                  <label class="layer-option">
                    <input type="radio" name="thematicLayer" ${activeThematic === 'temperature' ? 'checked' : ''} onchange="HEATSHIELD_PAGE_HEATMAP.setThematic('temperature')" />
                    <span>Live Surface Temperature</span>
                    <span class="provenance-badge live">LIVE</span>
                  </label>
                </div>

                <!-- Group 2: Demographics -->
                <div class="layer-group">
                  <div class="layer-group-title">Demographics & Vulnerability</div>
                  <label class="layer-option">
                    <input type="radio" name="thematicLayer" ${activeThematic === 'population' ? 'checked' : ''} onchange="HEATSHIELD_PAGE_HEATMAP.setThematic('population')" />
                    <span>Population Density (Census 2011)</span>
                    <span class="provenance-badge source">SOURCE</span>
                  </label>
                  <label class="layer-option">
                    <input type="radio" name="thematicLayer" ${activeThematic === 'slums' ? 'checked' : ''} onchange="HEATSHIELD_PAGE_HEATMAP.setThematic('slums')" />
                    <span>Informal Settlement / Slum %</span>
                    <span class="provenance-badge source">SOURCE</span>
                  </label>
                </div>

                <!-- Group 3: Tactical Response Assets -->
                <div class="layer-group">
                  <div class="layer-group-title">Tactical Logistics & Facilities</div>
                  <label class="layer-option">
                    <input type="checkbox" ${map && map.activeOverlays.cooling ? 'checked' : ''} onchange="HEATSHIELD_MAP.toggleOverlay('cooling', this.checked)" />
                    <span>Cooling Centres (15 Active)</span>
                    <span class="provenance-badge live">DISPATCH</span>
                  </label>
                  <label class="layer-option">
                    <input type="checkbox" ${map && map.activeOverlays.water ? 'checked' : ''} onchange="HEATSHIELD_MAP.toggleOverlay('water', this.checked)" />
                    <span>Misting Tanker Fleet (25 Units)</span>
                    <span class="provenance-badge live">DISPATCH</span>
                  </label>
                  <label class="layer-option">
                    <input type="checkbox" ${map && map.activeOverlays.hospitals ? 'checked' : ''} onchange="HEATSHIELD_MAP.toggleOverlay('hospitals', this.checked)" />
                    <span>Designated Hospitals (5 Major)</span>
                    <span class="provenance-badge source">SOURCE</span>
                  </label>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- FLOATING BOTTOM-LEFT: DYNAMIC THEMATIC LEGEND -->
          <div class="gis-legend-card" id="gisDynamicLegend">
            ${this._renderLegendContent(activeThematic)}
          </div>

          <!-- FLOATING BOTTOM-CENTER: TEMPORAL FORECAST HORIZON SLIDER -->
          <div class="gis-timeline-bar">
            <div class="timeline-meta">
              <span class="font-bold text-xxs uppercase tracking-wider text-muted">FORECAST HORIZON:</span>
              <span class="provenance-badge ${activeHorizon === 'now' ? 'live' : 'modelled'}">
                ${activeHorizon === 'now' ? 'LIVE TELEMETRY' : 'MODELED SCENARIO'}
              </span>
            </div>
            <div class="timeline-steps">
              <button class="time-step-btn ${activeHorizon === 'now' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setHorizon('now')">NOW</button>
              <button class="time-step-btn ${activeHorizon === '+3h' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setHorizon('+3h')">+3H</button>
              <button class="time-step-btn ${activeHorizon === '+6h' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setHorizon('+6h')">+6H</button>
              <button class="time-step-btn ${activeHorizon === '+12h' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setHorizon('+12h')">+12H</button>
              <button class="time-step-btn ${activeHorizon === '+24h' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setHorizon('+24h')">+24H</button>
              <button class="time-step-btn ${activeHorizon === '+48h' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setHorizon('+48h')">+48H</button>
              <button class="time-step-btn ${activeHorizon === '+72h' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEATMAP.setHorizon('+72h')">+72H</button>
            </div>
          </div>

          <!-- SLIDING RIGHT-SIDE WARD INTELLIGENCE DRAWER -->
          <div class="gis-ward-drawer ${this._isWardDrawerOpen ? 'open' : ''}" id="gisWardDrawer">
            <div class="ward-drawer-header">
              <div>
                <div class="text-xxs font-bold text-muted uppercase">SELECTED WARD PROFILE</div>
                <div class="font-extrabold text-base text-primary" id="drawerWardTitle">
                  Ward ${selectedWard.ward_id} — ${selectedWard.name}
                </div>
                <div class="text-xxs text-muted mt-0.5" id="drawerWardSub">
                  Borough ${selectedWard.borough || 'Central'} · ${selectedWard.name_bn || ''}
                </div>
              </div>
              <button class="drawer-close-btn" onclick="HEATSHIELD_PAGE_HEATMAP.closeWardDrawer()">✕</button>
            </div>

            <div class="ward-drawer-body" id="drawerWardContent">
              ${this._renderDrawerContent(selectedWard)}
            </div>
          </div>

          <!-- COLLAPSIBLE 144-WARD INDEX ROSTER -->
          <div class="gis-ward-index-panel ${this._isWardIndexOpen ? 'open' : ''}" id="gisWardIndexPanel">
            <div class="ward-index-header">
              <div class="flex items-center gap-2">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                <span class="font-bold text-xs">144 KMC Wards Index</span>
              </div>
              <button class="drawer-close-btn" onclick="HEATSHIELD_PAGE_HEATMAP.toggleWardIndex()">✕</button>
            </div>

            <div class="p-3 border-b border-border">
              <input 
                type="text" 
                class="header-search-input text-xs" 
                placeholder="Filter by ward name or number..." 
                value="${this._wardSearchQuery}" 
                oninput="HEATSHIELD_PAGE_HEATMAP.filterWardIndex(this.value);"
              />
            </div>

            <div class="ward-index-list">
              ${this._renderWardIndexRows(evaluated)}
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize Map with 144-ward polygon choropleths
    setTimeout(() => {
      if (window.HEATSHIELD_MAP) {
        window.HEATSHIELD_MAP.init("heatmapFullMap", { zoom: 12 });
      }
    }, 50);
  },

  setSeverity(level) {
    if (window.HEATSHIELD_MAP) {
      window.HEATSHIELD_MAP.setSeverityFilter(level);
    }
    // Update severity filter buttons active state
    document.querySelectorAll(".gis-severity-bar .severity-btn").forEach(btn => {
      const isTarget = btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${level}'`);
      btn.classList.toggle("active", Boolean(isTarget));
    });
    // Re-render ward index roster to match severity filter
    const s = window.HEATSHIELD_STATE || {};
    const listEl = document.querySelector(".ward-index-list");
    if (listEl) {
      listEl.innerHTML = this._renderWardIndexRows(s.evaluatedWards || []);
    }
    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.showToast === "function") {
      const label = level === 'all' ? 'All Wards (144)' : `${level.toUpperCase()} Wards Only`;
      window.HEATSHIELD_APP.showToast(`Severity Filter: ${label}`, "info");
    }
  },

  setThematic(layerKey) {
    if (window.HEATSHIELD_MAP) {
      window.HEATSHIELD_MAP.setThematicLayer(layerKey);
    }
    // Update preset buttons
    document.querySelectorAll(".gis-preset-bar .preset-btn").forEach(btn => {
      const isTarget = btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${layerKey}'`);
      btn.classList.toggle("active", Boolean(isTarget));
    });
    // Update radio buttons in layer drawer
    document.querySelectorAll('input[name="thematicLayer"]').forEach(input => {
      const isTarget = input.getAttribute("onchange") && input.getAttribute("onchange").includes(`'${layerKey}'`);
      input.checked = Boolean(isTarget);
    });
    // Update legend
    this.updateLegend(layerKey);
  },

  updateLegend(layerKey) {
    const legendEl = document.getElementById("gisDynamicLegend");
    if (legendEl) {
      legendEl.innerHTML = this._renderLegendContent(layerKey);
    }
  },

  setBasemap(mode) {
    if (window.HEATSHIELD_MAP) {
      window.HEATSHIELD_MAP.setBasemap(mode);
    }
    // Update segmented basemap buttons
    document.querySelectorAll(".gis-basemap-card .seg-btn").forEach(btn => {
      const isTarget = btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${mode}'`);
      btn.classList.toggle("active", Boolean(isTarget));
    });
  },

  setHorizon(horizonKey) {
    if (window.HEATSHIELD_MAP) {
      window.HEATSHIELD_MAP.setForecastHorizon(horizonKey);
    }
    // Update timeline step buttons
    document.querySelectorAll(".timeline-steps .time-step-btn").forEach(btn => {
      const isTarget = btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${horizonKey}'`);
      btn.classList.toggle("active", Boolean(isTarget));
    });
    // Update timeline badge
    const badgeEl = document.querySelector(".timeline-meta .provenance-badge");
    if (badgeEl) {
      badgeEl.className = `provenance-badge ${horizonKey === "now" ? "live" : "modelled"}`;
      badgeEl.textContent = horizonKey === "now" ? "LIVE TELEMETRY" : "MODELED SCENARIO";
    }
  },

  toggleLayerPanel() {
    this._isLayerPanelOpen = !this._isLayerPanelOpen;
    const drawer = document.querySelector(".gis-layer-drawer");
    if (drawer) {
      drawer.classList.toggle("open", this._isLayerPanelOpen);
      drawer.classList.toggle("collapsed", !this._isLayerPanelOpen);
      const icon = drawer.querySelector(".layer-drawer-header span:last-child");
      if (icon) icon.textContent = this._isLayerPanelOpen ? "▼" : "▲";
    }
  },

  toggleWardIndex() {
    this._isWardIndexOpen = !this._isWardIndexOpen;
    const panel = document.getElementById("gisWardIndexPanel");
    if (panel) {
      panel.classList.toggle("open", this._isWardIndexOpen);
    }
  },

  filterWardIndex(query) {
    this._wardSearchQuery = query;
    const listEl = document.querySelector(".ward-index-list");
    if (listEl) {
      const s = window.HEATSHIELD_STATE || {};
      listEl.innerHTML = this._renderWardIndexRows(s.evaluatedWards || []);
    }
  },

  _updateDrawer(selectedWard) {
    const titleEl = document.getElementById("drawerWardTitle");
    const subEl = document.getElementById("drawerWardSub");
    const contentEl = document.getElementById("drawerWardContent");
    if (selectedWard && titleEl && subEl && contentEl) {
      titleEl.innerText = `Ward ${selectedWard.ward_id} — ${selectedWard.name}`;
      subEl.innerText = `Borough ${selectedWard.borough || 'Central'} · ${selectedWard.name_bn || ''}`;
      contentEl.innerHTML = this._renderDrawerContent(selectedWard);
    }
  },

  openWardDrawer(wardId) {
    this._isWardDrawerOpen = true;
    const s = window.HEATSHIELD_STATE || {};
    const w = (s.evaluatedWards || []).find(w => w.ward_id === wardId);
    
    const titleEl = document.getElementById("drawerWardTitle");
    const subEl = document.getElementById("drawerWardSub");
    const contentEl = document.getElementById("drawerWardContent");
    const drawerEl = document.getElementById("gisWardDrawer");

    if (w && titleEl && subEl && contentEl && drawerEl) {
      titleEl.innerText = `Ward ${w.ward_id} — ${w.name}`;
      subEl.innerText = `Borough ${w.borough || 'Central'} · ${w.name_bn || ''}`;
      contentEl.innerHTML = this._renderDrawerContent(w);
      drawerEl.classList.add("open");
    }
  },

  closeWardDrawer() {
    this._isWardDrawerOpen = false;
    const drawerEl = document.getElementById("gisWardDrawer");
    if (drawerEl) drawerEl.classList.remove("open");
  },

  _renderDrawerContent(w) {
    const score = w.hhvi ? w.hhvi.mitigated_hhvi : 75;
    const riskCls = (w.risk_level || 'safe').toLowerCase();
    const wbgt = ((w.effective_temp || 41.0) * 0.82).toFixed(1);
    const pop = w.population ? w.population.toLocaleString('en-IN') : 'N/A';

    return `
      <div class="flex flex-col gap-3">
        <!-- Risk & Score Banner -->
        <div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-muted); border: 1px solid var(--border);">
          <div>
            <div class="text-xxs font-bold text-muted uppercase">HHVI RISK COMPOSITE</div>
            <div class="font-extrabold text-lg" style="color: ${w.risk_color || 'var(--critical)'};">
              ${score} / 100
            </div>
          </div>
          <span class="risk-badge ${riskCls}">${w.risk_level || 'SAFE'}</span>
        </div>

        <!-- Biometeorology Strip -->
        <div class="grid-2">
          <div class="p-2.5 rounded-lg border border-border" style="background: var(--bg-card-solid);">
            <div class="text-xxs font-bold text-muted">WBGT STRESS</div>
            <div class="font-extrabold text-sm text-high">${wbgt}°C</div>
            <div class="text-xxs text-muted">High Threat</div>
          </div>
          <div class="p-2.5 rounded-lg border border-border" style="background: var(--bg-card-solid);">
            <div class="text-xxs font-bold text-muted">AMBIENT TEMP</div>
            <div class="font-extrabold text-sm text-primary">${w.outdoor_temp || 40.0}°C</div>
            <div class="text-xxs text-muted">Feels ${w.effective_temp || 41.2}°C</div>
          </div>
        </div>

        <!-- Demographic Info -->
        <div class="p-2.5 rounded-lg border border-border" style="background: var(--bg-card-solid);">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-muted font-semibold">Population (Census 2011):</span>
            <span class="font-bold">${pop}</span>
          </div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-muted font-semibold">Informal Slum Density:</span>
            <span class="font-bold">${((w.slum_density || 0.5) * 100).toFixed(0)}%</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-muted font-semibold">Tree Canopy Cover:</span>
            <span class="font-bold">${((w.tree_canopy || 0.1) * 100).toFixed(0)}%</span>
          </div>
        </div>

        <!-- Tactical Actions -->
        <div class="flex flex-col gap-2 mt-1">
          <button class="btn btn-primary btn-sm w-full" onclick="HEATSHIELD_APP.dispatchResource(${w.ward_id}, 'Water Tanker')">
            🚰 Dispatch Water Misting Tanker
          </button>
          <button class="btn btn-secondary btn-sm w-full" onclick="HEATSHIELD_APP.dispatchResource(${w.ward_id}, 'Cooling Hub')">
            ❄️ Open Pop-Up AC Cooling Hub
          </button>
          <button class="btn btn-secondary btn-sm w-full" onclick="HEATSHIELD_APP.navigateTo('ward-intel'); HEATSHIELD_APP.selectWard(${w.ward_id});">
            📄 Open Full Ward Dossier →
          </button>
        </div>
      </div>
    `;
  },

  _renderLegendContent(thematic) {
    if (thematic === "temperature") {
      return `
        <div class="legend-header">AMBIENT TEMPERATURE (°C)</div>
        <div class="legend-scale">
          <span class="legend-item"><span class="legend-dot" style="background: #EF4444;"></span> ≥42.5°C Extreme</span>
          <span class="legend-item"><span class="legend-dot" style="background: #F97316;"></span> 40.5–42.4°C High</span>
          <span class="legend-item"><span class="legend-dot" style="background: #FBBF24;"></span> 38.5–40.4°C Mod</span>
          <span class="legend-item"><span class="legend-dot" style="background: #10B981;"></span> &lt;38.5°C Safe</span>
        </div>
      `;
    }
    if (thematic === "wbgt") {
      return `
        <div class="legend-header">THERMAL STRESS (WBGT °C)</div>
        <div class="legend-scale">
          <span class="legend-item"><span class="legend-dot" style="background: #EF4444;"></span> ≥35.0°C Extreme</span>
          <span class="legend-item"><span class="legend-dot" style="background: #F97316;"></span> 32.5–34.9°C Danger</span>
          <span class="legend-item"><span class="legend-dot" style="background: #FBBF24;"></span> 30.0–32.4°C Alert</span>
          <span class="legend-item"><span class="legend-dot" style="background: #10B981;"></span> &lt;30.0°C Normal</span>
        </div>
      `;
    }
    if (thematic === "population") {
      return `
        <div class="legend-header">POPULATION DENSITY (CENSUS 2011)</div>
        <div class="legend-scale">
          <span class="legend-item"><span class="legend-dot" style="background: #7C3AED;"></span> &gt;60,000 High</span>
          <span class="legend-item"><span class="legend-dot" style="background: #2563EB;"></span> 45,000–60,000</span>
          <span class="legend-item"><span class="legend-dot" style="background: #0284C7;"></span> 25,000–45,000</span>
          <span class="legend-item"><span class="legend-dot" style="background: #64748B;"></span> &lt;25,000 Low</span>
        </div>
      `;
    }
    // Default: HHVI Risk Composite
    return `
      <div class="legend-header">HEAT-HEALTH VULNERABILITY (HHVI)</div>
      <div class="legend-scale">
        <span class="legend-item"><span class="legend-dot" style="background: #EF4444;"></span> Critical (≥80)</span>
        <span class="legend-item"><span class="legend-dot" style="background: #F97316;"></span> High (65–79)</span>
        <span class="legend-item"><span class="legend-dot" style="background: #FBBF24;"></span> Moderate (50–64)</span>
        <span class="legend-item"><span class="legend-dot" style="background: #10B981;"></span> Safe (&lt;50)</span>
      </div>
      <div class="text-xxs text-muted mt-1" style="font-size: 9px;">*Note: Composite score (0-100), not Celsius temperature.</div>
    `;
  },

  _renderWardIndexRows(wards) {
    let filtered = [...wards];
    const map = window.HEATSHIELD_MAP;

    // Filter by active severity filter if not 'all'
    if (map && map.activeSeverityFilter && map.activeSeverityFilter !== "all") {
      filtered = filtered.filter(w => (w.risk_level || "SAFE").toLowerCase() === map.activeSeverityFilter);
    }

    if (this._wardSearchQuery.trim()) {
      const q = this._wardSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(w => 
        String(w.ward_id).includes(q) || 
        (w.name || "").toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      return `
        <div class="p-4 text-center text-xs text-muted">
          No wards match current severity filter / query.
        </div>
      `;
    }

    return filtered.map(w => {
      const score = w.hhvi ? w.hhvi.mitigated_hhvi : 75;
      const riskCls = (w.risk_level || 'safe').toLowerCase();
      const wbgt = ((w.effective_temp || 41.0) * 0.82).toFixed(1);

      return `
        <div 
          class="ward-index-row" 
          onclick="HEATSHIELD_MAP.flyToWard(${w.ward_id}, 'heatmapFullMap');"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="status-dot ${riskCls}"></span>
            <div class="min-w-0">
              <div class="font-bold text-xs truncate">W${w.ward_id} — ${w.name}</div>
              <div class="text-xxs text-muted">WBGT ${wbgt}°C · Borough ${w.borough || 'Central'}</div>
            </div>
          </div>
          <span class="risk-badge ${riskCls}" style="font-size: 9px; padding: 2px 6px;">${score}</span>
        </div>
      `;
    }).join("");
  }
};
