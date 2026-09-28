/**
 * HEATSHIELD v2 — Heat Intelligence Page Module
 * "Why is it hot? How will it affect health?"
 * 
 * Includes the upgraded Adaptive Heat-Health DLNM (Distributed Lag Non-Linear Model):
 * - Non-linear cross-basis exposure response (splines)
 * - Distributed lag structure (0-7 days) with data-driven peak lag estimation
 * - Recent heat exposure history effect-modification testing
 * - 95% Confidence Interval uncertainty ribbons
 * - 2D Exposure × Lag Risk Surface Heatmap Matrix
 * - Separation of Population Health Burden vs Healthcare Facility Demand
 * - Model Governance & Trust safeguards
 */

window.HEATSHIELD_PAGE_HEAT_INTEL = {
  _activeTab: "current",
  _dlnmViewMode: "curve", // "curve" | "surface" | "comparison"
  _selectedWardId: null,  // null = citywide, or specific wardId
  _chart: null,

  /**
   * Main render function called by the application controller
   * @param {Object} state - Application state
   */
  render(state) {
    const container = document.getElementById("pageHeatIntel");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const engine = window.HEATSHIELD_ENGINE || {};
    const liveWeather = engine.liveWeather || {
      temp: 40.8,
      apparent_temp: 46.2,
      rh: 64,
      wind_speed_kmh: 14.5
    };

    container.innerHTML = `
      <!-- 1. PAGE HEADER -->
      <div class="page-title">Heat Intelligence</div>
      <div class="page-subtitle">Biometeorological analytics & adaptive epidemiological lag forecasting</div>

      <!-- 2. TABS -->
      <div class="tabs">
        <div class="tab ${this._activeTab === 'current' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEAT_INTEL.setTab('current')">Current Conditions</div>
        <div class="tab ${this._activeTab === 'forecast' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEAT_INTEL.setTab('forecast')">7-Day Forecast</div>
        <div class="tab ${this._activeTab === 'cycle' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEAT_INTEL.setTab('cycle')">24-Hour Cycle</div>
        <div class="tab ${this._activeTab === 'dlnm' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_HEAT_INTEL.setTab('dlnm')">Adaptive Heat-Health DLNM</div>
      </div>

      <!-- TAB CONTENT -->
      <div id="heatIntelContentArea">
        ${this._renderTabContent(s, liveWeather)}
      </div>
    `;

    // Render active tab Chart.js instance
    this._initActiveTabChart(s, liveWeather);
  },

  /**
   * Switch active tab and re-render
   * @param {string} tabKey
   */
  setTab(tabKey) {
    this._activeTab = tabKey;
    this.render(window.HEATSHIELD_STATE);
  },

  /**
   * Set DLNM sub-view mode ("curve" | "surface" | "comparison")
   */
  setDlnmViewMode(mode) {
    this._dlnmViewMode = mode;
    this.render(window.HEATSHIELD_STATE);
  },

  /**
   * Set target ward for DLNM analysis
   */
  setDlnmTargetWard(wardId) {
    this._selectedWardId = wardId ? parseInt(wardId, 10) : null;
    this.render(window.HEATSHIELD_STATE);
  },

  /**
   * Render HTML based on the active tab
   */
  _renderTabContent(state, weather) {
    if (this._activeTab === "current") {
      return this._renderCurrentConditions(state, weather);
    }
    if (this._activeTab === "dlnm") {
      return this._renderHealthImpactDLNM(state, weather);
    }
    return this._renderPlaceholder();
  },

  /**
   * 3. CURRENT CONDITIONS tab content
   */
  _renderCurrentConditions(state, weather = {}) {
    const app = window.HEATSHIELD_APP;
    const engine = window.HEATSHIELD_ENGINE || {};

    let windRiskClass = "safe";
    let windRiskText = "Normal";
    if (weather.apparent_temp > 40) {
      windRiskClass = "high";
      windRiskText = "High";
    } else if (weather.apparent_temp > 35) {
      windRiskClass = "moderate";
      windRiskText = "Moderate";
    }

    const tempDisplay = weather.temp !== undefined ? (app ? app.formatNumber(weather.temp) : weather.temp) : "40.8";
    const apparentDisplay = weather.apparent_temp !== undefined ? (app ? app.formatNumber(weather.apparent_temp) : weather.apparent_temp) : "46.2";
    const rhDisplay = weather.rh !== undefined ? (app ? app.formatNumber(weather.rh) : weather.rh) : "64";
    const windDisplay = weather.wind_speed_kmh !== undefined ? (app ? app.formatNumber(weather.wind_speed_kmh) : weather.wind_speed_kmh) : "14.5";

    const utciData = (engine && engine.calculateUTCI) 
      ? engine.calculateUTCI(weather.temp || 40.8, weather.rh || 64, weather.wind_speed_kmh || 14.5) 
      : { utci_celsius: 46.2, wb_utci_celsius: 39.8, category: "VERY_STRONG", stress_level: "Very Strong Heat Stress" };

    let utciBadgeClass = "critical";
    if (utciData.category === "EXTREME") utciBadgeClass = "critical";
    else if (utciData.category === "VERY_STRONG") utciBadgeClass = "critical";
    else if (utciData.category === "STRONG") utciBadgeClass = "high";
    else if (utciData.category === "MODERATE") utciBadgeClass = "moderate";
    else utciBadgeClass = "safe";

    return `
      <!-- a. KPI row (5 cards) -->
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="kpi-card">
          <div class="kpi-label">Ambient Temperature</div>
          <div class="kpi-value">${tempDisplay}<span class="kpi-unit">°C</span></div>
        </div>

        <div class="kpi-card" style="border-top: 3px solid var(--critical);">
          <div class="flex items-center justify-between mb-1">
            <span class="kpi-label" style="margin-bottom: 0;">UTCI (Universal Thermal)</span>
            <span class="risk-badge ${utciBadgeClass}" style="font-size: 9px; padding: 2px 6px;">${utciData.category}</span>
          </div>
          <div class="kpi-value" style="color: var(--critical);">${utciData.utci_celsius}<span class="kpi-unit">°C</span></div>
          <div class="text-xs text-muted mt-1 truncate">${utciData.stress_level}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">WB-UTCI (Wet-Bulb)</div>
          <div class="kpi-value" style="color: var(--high);">${utciData.wb_utci_celsius}<span class="kpi-unit">°C</span></div>
          <div class="text-xs text-muted mt-1">Stull Enthalpy Formulation</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Relative Humidity</div>
          <div class="kpi-value">${rhDisplay}<span class="kpi-unit">%</span></div>
        </div>

        <div class="kpi-card">
          <div class="flex items-center justify-between mb-1">
            <span class="kpi-label" style="margin-bottom: 0;">10m Wind Speed</span>
            <span class="risk-badge ${windRiskClass}">${windRiskText}</span>
          </div>
          <div class="kpi-value">${windDisplay}<span class="kpi-unit">km/h</span></div>
        </div>
      </div>

      <!-- b. Grid 60-40 -->
      <div class="grid-60-40">
        <!-- LEFT: 24-Hour Forecast (Today) -->
        <div class="card">
          <div class="card-header flex items-center justify-between">
            <span class="card-title">24-Hour Forecast (Today)</span>
            <span class="provenance-badge live">LIVE / MODEL</span>
          </div>
          <div class="card-body">
            <div style="height: 310px; position: relative;">
              <canvas id="heatIntelChart"></canvas>
            </div>
          </div>
        </div>

        <!-- RIGHT: Key Insights -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Key Insights</span>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-4">
              <div class="flex items-start gap-3">
                <span class="status-dot critical" style="margin-top: 5px;"></span>
                <span class="text-sm">Peak heat stress expected between 12 PM – 6 PM</span>
              </div>

              ${weather.apparent_temp > 40 ? `
              <div class="flex items-start gap-3">
                <span class="status-dot high" style="margin-top: 5px;"></span>
                <span class="text-sm">Vulnerable groups (elderly, outdoor workers) at higher risk</span>
              </div>
              ` : ''}

              <div class="flex items-start gap-3">
                <span class="status-dot" style="background: var(--blue-600); margin-top: 5px;"></span>
                <span class="text-sm">Adaptive DLNM predicts health impacts will peak in <strong>2–4 days</strong> post-exposure</span>
              </div>

              <div class="flex items-start gap-3">
                <span class="status-dot safe" style="margin-top: 5px;"></span>
                <span class="text-sm">Prepare hospital surge triage and hydration logistics in advance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 4. UPGRADED ADAPTIVE HEAT-HEALTH DLNM TAB CONTENT
   */
  _renderHealthImpactDLNM(state, weather) {
    const dlnmEngine = window.HEATSHIELD_ADAPTIVE_DLNM;
    if (!dlnmEngine) {
      return `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 48px;">
            <div class="text-muted">Adaptive DLNM module is currently loading...</div>
          </div>
        </div>
      `;
    }

    const wards = (state && state.evaluatedWards) || (window.HEATSHIELD_DATA && window.HEATSHIELD_DATA.ALL_WARDS) || [];
    let selectedWard = null;
    if (this._selectedWardId) {
      selectedWard = wards.find(w => w.ward_id === this._selectedWardId);
    }

    const exposureTemp = selectedWard ? (selectedWard.effective_temp || selectedWard.outdoor_temp || weather.temp || 41.5) : (weather.temp || 41.5);
    const dlnmResult = dlnmEngine.evaluateWardAdaptiveDLNM(selectedWard, exposureTemp);

    const mod = dlnmResult.effect_modification;
    const history = dlnmResult.exposure_history;
    const lagCurve = dlnmResult.adaptive_lag_curve;
    const governance = dlnmResult.model_governance;
    const burden = dlnmResult.health_burden;
    const demand = dlnmResult.healthcare_demand;

    // Direction styling
    let modBadgeClass = "modelled";
    let modSign = "";
    if (mod.direction === "INCREASED_RISK") {
      modBadgeClass = "simulation";
      modSign = "+";
    } else if (mod.direction === "REDUCED_RISK") {
      modBadgeClass = "source";
      modSign = "";
    }

    return `
      <!-- Scope Selector Bar & Calibration Banner -->
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4" style="padding: 12px 16px; background: var(--bg-muted); border: 1px solid var(--border); border-radius: var(--radius-lg);">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-xs font-bold text-secondary uppercase tracking-wider">Analysis Scope:</span>
          <select 
            class="search-input" 
            style="padding: 6px 12px; width: auto; min-width: 240px; background: var(--bg-card); font-size: 13px; font-family: inherit;"
            onchange="HEATSHIELD_PAGE_HEAT_INTEL.setDlnmTargetWard(this.value)"
          >
            <option value="" ${!this._selectedWardId ? 'selected' : ''}>🌐 Citywide Aggregate (All 144 Wards)</option>
            ${wards.slice(0, 40).map(w => `
              <option value="${w.ward_id}" ${this._selectedWardId === w.ward_id ? 'selected' : ''}>
                Ward ${w.ward_id} – ${w.name} (${w.risk_level ? w.risk_level.toUpperCase() : 'HHVI'})
              </option>
            `).join("")}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="provenance-badge ${governance.confidence_rating.includes('HIGH') ? 'source' : 'modelled'}">
            ${governance.confidence_rating}
          </span>
          <span class="provenance-badge modelled">${governance.mode}</span>
        </div>
      </div>

      <!-- 4 Top Intelligence Cards (Exposure History, Effect Modification, Peak Lag, Governance) -->
      <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 20px;">
        <!-- Card 1: 7-Day Exposure History -->
        <div class="kpi-card">
          <div class="kpi-label">7-Day Thermal History</div>
          <div class="kpi-value" style="font-size: 22px;">${history.avg_7d}°C <span class="kpi-unit">Avg</span></div>
          <div class="text-xs text-muted mt-1">
            <strong>${history.heat_stress_days_count}</strong> extreme heat days (>38°C)
          </div>
        </div>

        <!-- Card 2: Effect Modification Signal -->
        <div class="kpi-card" style="border-left: 4px solid ${mod.direction === 'INCREASED_RISK' ? 'var(--critical)' : mod.direction === 'REDUCED_RISK' ? 'var(--safe)' : 'var(--border)'};">
          <div class="flex items-center justify-between mb-1">
            <span class="kpi-label" style="margin-bottom: 0;">History Effect-Mod</span>
            <span class="provenance-badge ${modBadgeClass}" style="font-size: 9px;">${mod.evidence_strength}</span>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: ${mod.direction === 'INCREASED_RISK' ? 'var(--critical)' : mod.direction === 'REDUCED_RISK' ? 'var(--safe)' : 'var(--text-primary)'};">
            ${modSign}${mod.modification_percent}%
          </div>
          <div class="text-xs text-muted mt-1 truncate" title="${mod.interpretation}">
            ${mod.direction === 'INCREASED_RISK' ? 'Cumulative Physiological Strain' : mod.direction === 'REDUCED_RISK' ? 'Short-term Acclimatization' : 'No Significant Mod.'}
          </div>
        </div>

        <!-- Card 3: Data-Driven Peak Lag -->
        <div class="kpi-card">
          <div class="kpi-label">Expected Peak Window</div>
          <div class="kpi-value" style="font-size: 22px; color: var(--critical);">${lagCurve.peak_lag_window}</div>
          <div class="text-xs text-muted mt-1">
            Peak Excess Surge: <strong>+${lagCurve.peak_excess_pct}%</strong>
          </div>
        </div>

        <!-- Card 4: Cumulative 7-Day RR -->
        <div class="kpi-card">
          <div class="kpi-label">Cumulative 7-Day RR</div>
          <div class="kpi-value" style="font-size: 22px; color: var(--blue-700);">${lagCurve.cumulative_relative_risk}</div>
          <div class="text-xs text-muted mt-1">
            95% CI: [${lagCurve.cumulative_rr_ci[0]} – ${lagCurve.cumulative_rr_ci[1]}]
          </div>
        </div>
      </div>

      <!-- Main Visual Workspace: Sub-view Mode Selector -->
      <div class="card mb-4">
        <div class="card-header flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="card-title">
              ${this._dlnmViewMode === 'curve' ? 'Heat-Health Distributed Lag Curve (with 95% Confidence Band)' : 
                this._dlnmViewMode === 'surface' ? '2D Exposure × Lag Risk Surface Matrix' : 
                'Model Comparison: Adaptive vs Static DLNM'}
            </span>
            <span class="provenance-badge modelled">SPLINE MODEL</span>
          </div>

          <!-- Sub-view Navigation Pills -->
          <div class="flex gap-2 flex-wrap">
            <button 
              class="btn btn-sm ${this._dlnmViewMode === 'curve' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_HEAT_INTEL.setDlnmViewMode('curve')"
            >
              📈 Lag Curve (95% CI)
            </button>
            <button 
              class="btn btn-sm ${this._dlnmViewMode === 'surface' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_HEAT_INTEL.setDlnmViewMode('surface')"
            >
              🔥 Exposure × Lag Surface
            </button>
            <button 
              class="btn btn-sm ${this._dlnmViewMode === 'comparison' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_HEAT_INTEL.setDlnmViewMode('comparison')"
            >
              ⚖️ Adaptive vs Static
            </button>
            <button 
              class="btn btn-sm ${this._dlnmViewMode === 'ward_comparison' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_HEAT_INTEL.setDlnmViewMode('ward_comparison')"
            >
              👥 Compare Wards
            </button>
            <button 
              class="btn btn-sm ${this._dlnmViewMode === 'diagnostics' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_HEAT_INTEL.setDlnmViewMode('diagnostics')"
            >
              🔬 Model Diagnostics
            </button>
          </div>
        </div>

        <div class="card-body">
          ${this._renderDlnmSubView(dlnmResult)}
        </div>
      </div>

      <!-- Separation of Population Health Burden vs Healthcare Facility Demand -->
      <div class="grid-2 mb-4">
        <!-- Box 1: Population Health Burden -->
        <div class="card" style="border-top: 4px solid var(--critical);">
          <div class="card-header flex items-center justify-between">
            <span class="card-title">1. Population Health Burden (Community)</span>
            <span class="risk-badge ${burden.total_excess_burden_cases > 100 ? 'critical' : 'high'}">${burden.burden_tier}</span>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between mb-3 pb-2" style="border-bottom: 1px solid var(--border);">
              <span class="text-xs text-secondary">Target Population Base:</span>
              <span class="font-bold text-sm">${window.HEATSHIELD_APP ? window.HEATSHIELD_APP.formatNumber(burden.population_at_risk) : burden.population_at_risk} residents</span>
            </div>
            <div class="flex items-center justify-between mb-3 pb-2" style="border-bottom: 1px solid var(--border);">
              <span class="text-xs text-secondary">Expected Baseline 7-Day Health Events:</span>
              <span class="font-bold text-sm">${burden.baseline_7d_cases} cases</span>
            </div>
            <div class="flex items-center justify-between mb-3 pb-2" style="border-bottom: 1px solid var(--border);">
              <span class="text-xs text-secondary">Estimated Heat-Attributable Excess Illness:</span>
              <span class="font-extrabold text-base" style="color: var(--critical);">+${burden.total_excess_burden_cases} excess cases</span>
            </div>
            <div class="text-xs text-muted" style="line-height: 1.4;">
              Reflects true physiological incident burden (cardiac, renal, heat exhaustion) in domestic and un-cooled occupational environments.
            </div>
          </div>
        </div>

        <!-- Box 2: Healthcare Facility Demand -->
        <div class="card" style="border-top: 4px solid var(--blue-600);">
          <div class="card-header flex items-center justify-between">
            <span class="card-title">2. Healthcare Facility Demand (Hospitals)</span>
            <span class="risk-badge ${demand.realizable_excess_admissions_7d > 80 ? 'critical' : 'high'}">${demand.demand_tier}</span>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between mb-3 pb-2" style="border-bottom: 1px solid var(--border);">
              <span class="text-xs text-secondary">Reporting & Access Realization Factor:</span>
              <span class="font-bold text-sm">${(demand.access_reporting_factor * 100).toFixed(0)}% realizable</span>
            </div>
            <div class="flex items-center justify-between mb-3 pb-2" style="border-bottom: 1px solid var(--border);">
              <span class="text-xs text-secondary">Expected Emergency Hospital Surge:</span>
              <span class="font-extrabold text-base" style="color: var(--blue-700);">+${demand.realizable_excess_admissions_7d} admissions</span>
            </div>
            <div class="flex items-center justify-between mb-3 pb-2" style="border-bottom: 1px solid var(--border);">
              <span class="text-xs text-secondary">Peak Facility Surge Window:</span>
              <span class="font-bold text-sm" style="color: var(--critical);">${demand.peak_surge_day_label}</span>
            </div>
            <div class="text-xs text-muted" style="line-height: 1.4;">
              Separates community morbidity from hospital capacity by discounting healthcare access barriers in informal slum settlements.
            </div>
          </div>
        </div>
      </div>

      <!-- Scientific Governance, References & Disclaimer -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <span class="card-title">Model Governance & Methodological Reference</span>
          <span class="provenance-badge source">PEER-REVIEWED METHODOLOGY</span>
        </div>
        <div class="card-body">
          <div class="text-xs text-secondary mb-3" style="line-height: 1.6;">
            <strong>Methodology:</strong> Natural Cubic Splines over bi-dimensional cross-basis with empirical Bayes hierarchical shrinkage. Parameterized via tropical urban time-series regression cohorts (Gasparrini et al., <em>Lancet</em> 2015; Bhaskaran et al., <em>BMJ</em> 2012).
          </div>
          <div class="simulation-banner mb-2">
            ⚠️ ${governance.disclaimer}
          </div>
          ${governance.flags.length > 0 ? `
            <div class="flex flex-col gap-1 mt-2">
              ${governance.flags.map(f => `
                <div class="text-xs text-muted">• <span style="color: var(--high); font-weight: 600;">Governance Note:</span> ${f}</div>
              `).join("")}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  _renderDlnmSubView(dlnmResult) {
    if (this._dlnmViewMode === "surface") {
      return this._renderRiskSurfaceView(dlnmResult);
    }
    if (this._dlnmViewMode === "comparison") {
      return this._renderComparisonView(dlnmResult);
    }
    if (this._dlnmViewMode === "ward_comparison") {
      return this._renderWardComparisonView(dlnmResult);
    }
    if (this._dlnmViewMode === "diagnostics") {
      return this._renderDiagnosticsView();
    }
    // Default: Lag Curve
    return `
      <div style="height: 340px; position: relative;">
        <canvas id="dlnmAdaptiveLagChart"></canvas>
      </div>
      <div class="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3" style="border-top: 1px solid var(--border);">
        <div class="text-xs text-secondary">
          <span class="font-semibold text-primary">Lag Distribution:</span> 
          Peak mortality/morbidity concentrated around <strong>${dlnmResult.adaptive_lag_curve.peak_lag_window}</strong> post-exposure.
        </div>
        <div class="text-xs text-muted">
          Shaded ribbon represents ±1.96 SE (95% confidence interval bounds).
        </div>
      </div>
    `;
  },

  /**
   * 2D Exposure × Lag Risk Surface Heatmap Matrix View
   */
  _renderRiskSurfaceView(dlnmResult) {
    const surface = dlnmResult.risk_surface_2d;
    const lags = surface.lags;
    const rows = surface.matrix;

    // Helper to compute color intensity from excess risk percentage
    function getCellColor(pct) {
      if (pct <= 0) return "#F8FAFC";
      if (pct < 10) return "#FEF08A"; // light yellow
      if (pct < 25) return "#FDE047"; // yellow
      if (pct < 45) return "#FDBA74"; // light orange
      if (pct < 70) return "#FB923C"; // orange
      if (pct < 100) return "#F87171"; // light red
      return "#DC2626"; // deep red
    }

    function getTextColor(pct) {
      return pct >= 70 ? "#FFFFFF" : "#0F172A";
    }

    return `
      <div class="text-xs text-secondary mb-3">
        <strong>Cross-Basis Surface (Exposure × Lag):</strong> Illustrates how differing ambient exposure levels trigger delayed health peaks across the 7-day temporal window.
      </div>

      <div style="overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius);">
        <table class="data-table" style="font-size: 11px; text-align: center;">
          <thead>
            <tr>
              <th style="text-align: left; background: var(--bg-card); font-weight: 700;">Thermal Exposure</th>
              ${lags.map(l => `<th style="text-align: center;">${l === 0 ? 'Day 0 (Acute)' : 'Day +' + l}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td style="text-align: left; font-weight: 700; background: var(--bg-muted);">
                  ${row.temperature}°C Effective
                </td>
                ${row.lag_values.map((val, idx) => `
                  <td 
                    style="background: ${getCellColor(val)}; color: ${getTextColor(val)}; font-weight: 700; padding: 8px 4px; transition: transform 0.1s;"
                    title="Exposure: ${row.temperature}°C | Lag Day ${lags[idx]} | Excess Health Impact: +${val}%"
                  >
                    +${val}%
                  </td>
                `).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between flex-wrap gap-2 mt-3 text-xs text-muted">
        <div class="flex items-center gap-2">
          <span>Risk Scale:</span>
          <span class="legend-dot" style="background: #FEF08A;"></span> 0-10%
          <span class="legend-dot" style="background: #FDBA74;"></span> 25-45%
          <span class="legend-dot" style="background: #FB923C;"></span> 45-70%
          <span class="legend-dot" style="background: #DC2626;"></span> >100%
        </div>
        <div>Hover any grid cell for exact exposure-lag coordinates.</div>
      </div>
    `;
  },

  /**
   * Side-by-Side Model Comparison View (Standard vs Adaptive)
   */
  _renderComparisonView(dlnmResult) {
    const std = dlnmResult.standard_lag_curve;
    const adp = dlnmResult.adaptive_lag_curve;
    const mod = dlnmResult.effect_modification;

    return `
      <div class="text-xs text-secondary mb-4">
        <strong>Hypothesis Testing (Recent Exposure History as Effect Modifier):</strong>
        Comparing static unadjusted DLNM against the history-adaptive specification.
      </div>

      <div class="grid-2 mb-4">
        <div class="card" style="background: var(--bg-muted); border: 1px solid var(--border);">
          <div class="card-header">
            <span class="card-title" style="font-size: 12px;">Standard Static DLNM (No History)</span>
          </div>
          <div class="card-body" style="padding: 14px;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Cumulative 7d RR:</span>
              <strong class="text-sm">${std.cumulative_relative_risk}</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Cumulative Excess:</span>
              <strong class="text-sm" style="color: var(--blue-700);">+${std.cumulative_excess_risk_pct}%</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">Peak Lag:</span>
              <strong class="text-sm">${std.peak_lag_window}</strong>
            </div>
          </div>
        </div>

        <div class="card" style="background: var(--bg-card); border: 2px solid var(--blue-600);">
          <div class="card-header">
            <span class="card-title" style="font-size: 12px; color: var(--blue-700);">Adaptive DLNM (History Adjusted)</span>
          </div>
          <div class="card-body" style="padding: 14px;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Cumulative 7d RR:</span>
              <strong class="text-sm">${adp.cumulative_relative_risk}</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Cumulative Excess:</span>
              <strong class="text-sm" style="color: ${mod.direction === 'INCREASED_RISK' ? 'var(--critical)' : 'var(--safe)'};">
                +${adp.cumulative_excess_risk_pct}% (${mod.modification_percent >= 0 ? '+' : ''}${mod.modification_percent}%)
              </strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">Peak Lag:</span>
              <strong class="text-sm" style="color: var(--critical);">${adp.peak_lag_window}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="alert-strip ${mod.direction === 'INCREASED_RISK' ? 'warning' : 'info'}">
        🔬 <strong>Empirical Finding:</strong> ${mod.interpretation}
      </div>
    `;
  },

  /**
   * Side-by-Side Ward Comparison View (Section 16)
   */
  _renderWardComparisonView(dlnmResult) {
    const dlnmEngine = window.HEATSHIELD_ADAPTIVE_DLNM;
    if (!dlnmEngine) return '';

    const wardA_id = this._compareWardA || 17;
    const wardB_id = this._compareWardB || 88;
    const comp = dlnmEngine.compareWards(wardA_id, wardB_id);

    const wards = (window.HEATSHIELD_STATE && window.HEATSHIELD_STATE.evaluatedWards) || [];

    return `
      <div class="text-xs text-secondary mb-4">
        <strong>Cross-Ward Epidemiological Contrast (Section 16):</strong> Compare empirical lag curves, effect modifications, and healthcare demand across two distinct urban microclimates.
      </div>

      <!-- Ward Selector Dropdowns -->
      <div class="grid-2 mb-4" style="gap: 16px;">
        <div class="card" style="padding: 12px; background: var(--bg-muted);">
          <label class="text-xs font-bold text-secondary uppercase mb-1" style="display: block;">Ward A (Target Focus):</label>
          <select 
            class="search-input" 
            style="width: 100%; font-size: 12px; font-family: inherit; background: var(--bg-card);"
            onchange="HEATSHIELD_PAGE_HEAT_INTEL._compareWardA = parseInt(this.value, 10); HEATSHIELD_PAGE_HEAT_INTEL.render(HEATSHIELD_STATE);"
          >
            ${wards.slice(0, 30).map(w => `
              <option value="${w.ward_id}" ${w.ward_id === wardA_id ? 'selected' : ''}>Ward ${w.ward_id} – ${w.name}</option>
            `).join("")}
          </select>
        </div>

        <div class="card" style="padding: 12px; background: var(--bg-muted);">
          <label class="text-xs font-bold text-secondary uppercase mb-1" style="display: block;">Ward B (Comparison Baseline):</label>
          <select 
            class="search-input" 
            style="width: 100%; font-size: 12px; font-family: inherit; background: var(--bg-card);"
            onchange="HEATSHIELD_PAGE_HEAT_INTEL._compareWardB = parseInt(this.value, 10); HEATSHIELD_PAGE_HEAT_INTEL.render(HEATSHIELD_STATE);"
          >
            ${wards.slice(0, 30).map(w => `
              <option value="${w.ward_id}" ${w.ward_id === wardB_id ? 'selected' : ''}>Ward ${w.ward_id} – ${w.name}</option>
            `).join("")}
          </select>
        </div>
      </div>

      <!-- Comparative Summary Cards -->
      <div class="grid-2 mb-4" style="gap: 16px;">
        <!-- Ward A Profile -->
        <div class="card" style="border: 2px solid var(--critical);">
          <div class="card-header" style="background: var(--bg-muted);">
            <span class="card-title">${comp.ward_a.ward.name} (Ward ${comp.ward_a.ward.ward_id})</span>
            <span class="risk-badge critical">${comp.ward_a.health_burden.burden_tier}</span>
          </div>
          <div class="card-body" style="padding: 16px;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Effective Temperature:</span>
              <strong class="text-sm">${comp.ward_a.current_exposure.temperature_celsius}°C</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Peak Lag Window:</span>
              <strong class="text-sm" style="color: var(--critical);">${comp.ward_a.peak_lag}</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Cumulative 7d RR:</span>
              <strong class="text-sm">${comp.ward_a.cumulative_effect.relative_risk}</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Excess Community Cases:</span>
              <strong class="text-sm" style="color: var(--critical);">+${comp.ward_a.health_burden.total_excess_burden_cases} cases</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">Hospital Surge Demand:</span>
              <strong class="text-sm" style="color: var(--blue-700);">+${comp.ward_a.healthcare_demand.realizable_excess_admissions_7d} admissions</strong>
            </div>
          </div>
        </div>

        <!-- Ward B Profile -->
        <div class="card" style="border: 1px solid var(--border);">
          <div class="card-header" style="background: var(--bg-muted);">
            <span class="card-title">${comp.ward_b.ward.name} (Ward ${comp.ward_b.ward.ward_id})</span>
            <span class="risk-badge high">${comp.ward_b.health_burden.burden_tier}</span>
          </div>
          <div class="card-body" style="padding: 16px;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Effective Temperature:</span>
              <strong class="text-sm">${comp.ward_b.current_exposure.temperature_celsius}°C</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Peak Lag Window:</span>
              <strong class="text-sm" style="color: var(--high);">${comp.ward_b.peak_lag}</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Cumulative 7d RR:</span>
              <strong class="text-sm">${comp.ward_b.cumulative_effect.relative_risk}</strong>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted">Excess Community Cases:</span>
              <strong class="text-sm" style="color: var(--high);">+${comp.ward_b.health_burden.total_excess_burden_cases} cases</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">Hospital Surge Demand:</span>
              <strong class="text-sm" style="color: var(--blue-700);">+${comp.ward_b.healthcare_demand.realizable_excess_admissions_7d} admissions</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="alert-strip info">
        📊 <strong>Comparative Intelligence:</strong> ${comp.comparison_summary.higher_risk_ward} carries higher aggregate health burden (+${comp.comparison_summary.burden_difference_cases} excess cases). Lag distribution: ${comp.comparison_summary.peak_lag_contrast}.
      </div>
    `;
  },

  /**
   * Technical Model Diagnostics View (Section 21)
   */
  _renderDiagnosticsView() {
    const dlnmEngine = window.HEATSHIELD_ADAPTIVE_DLNM;
    if (!dlnmEngine) return '';

    const diag = dlnmEngine.getModelDiagnostics();

    return `
      <div class="text-xs text-secondary mb-4">
        <strong>Biostatistical Specification & Information Criteria (Section 21):</strong> Real-time audit of model convergence, spline basis knots, and candidate history window selection metrics.
      </div>

      <div class="grid-2 mb-4" style="gap: 16px;">
        <div class="card" style="padding: 16px; background: var(--bg-muted);">
          <div class="font-bold text-xs uppercase text-muted mb-3">Model Basis & Cross-Basis Specification</div>
          <div class="flex items-center justify-between mb-2 pb-1" style="border-bottom: 1px solid var(--border);">
            <span class="text-xs text-secondary">Framework:</span>
            <span class="font-bold text-xs">${diag.framework}</span>
          </div>
          <div class="flex items-center justify-between mb-2 pb-1" style="border-bottom: 1px solid var(--border);">
            <span class="text-xs text-secondary">Reference Threshold (MMT):</span>
            <span class="font-bold text-xs" style="color: var(--safe);">${diag.reference_mmt}</span>
          </div>
          <div class="flex items-center justify-between mb-2 pb-1" style="border-bottom: 1px solid var(--border);">
            <span class="text-xs text-secondary">Exposure Spline Knots:</span>
            <span class="font-mono text-xs font-bold">${diag.exposure_spline_knots.join(", ")} °C</span>
          </div>
          <div class="flex items-center justify-between mb-2 pb-1" style="border-bottom: 1px solid var(--border);">
            <span class="text-xs text-secondary">Lag Spline Knots:</span>
            <span class="font-mono text-xs font-bold">Lags ${diag.lag_spline_knots.join(", ")} days</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary">Convergence Status:</span>
            <span class="provenance-badge source">${diag.convergence_status}</span>
          </div>
        </div>

        <div class="card" style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border);">
          <div class="font-bold text-xs uppercase text-muted mb-3">Candidate Exposure-History Window Selection (AIC)</div>
          ${diag.candidate_window_selection.map(w => `
            <div class="flex items-center justify-between mb-2 pb-1" style="border-bottom: 1px solid var(--border);">
              <span class="text-xs ${w.status.includes('SELECTED') ? 'font-bold text-primary' : 'text-secondary'}">${w.window}:</span>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono">ΔAIC: ${w.delta_aic >= 0 ? '+' : ''}${w.delta_aic}</span>
                <span class="provenance-badge ${w.status.includes('SELECTED') ? 'source' : 'synthetic'}" style="font-size: 9px;">${w.status}</span>
              </div>
            </div>
          `).join("")}
          <div class="text-xxs text-muted mt-3">
            Akaike Information Criterion (AIC) selects 7-day cumulative window to balance model complexity against lagged biological response.
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 5. Placeholder for pending tabs
   */
  _renderPlaceholder() {
    return `
      <div class="card">
        <div class="card-body" style="text-align: center; padding: 56px 20px;">
          <div style="font-size: 36px; margin-bottom: 12px;">⏳</div>
          <div class="font-semibold text-primary mb-1">Forecast data integration pending.</div>
          <div class="text-xs text-muted">Telemetry synchronization with meteorological station feeds is underway.</div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize or update Chart.js instances according to the active tab
   */
  _initActiveTabChart(state, weather) {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    if (typeof Chart === "undefined") {
      console.warn("HEATSHIELD: Chart.js is not loaded.");
      return;
    }

    if (this._activeTab === "current") {
      this._create24HourChart(weather);
    } else if (this._activeTab === "dlnm" && this._dlnmViewMode === "curve") {
      this._createAdaptiveLagChart(state, weather);
    }
  },

  /**
   * Create 24-hour diurnal temperature line chart
   */
  _create24HourChart(weather) {
    const canvas = document.getElementById("heatIntelChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const labels = ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM", "12 AM", "3 AM", "6 AM"];
    const diurnalOffsets = [-5.2, -2.0, 0, -1.0, -3.5, -6.0, -6.0, -5.5, -5.2];
    const baseTemp = typeof weather.temp === "number" ? weather.temp : 40.8;

    const outdoorData = diurnalOffsets.map(offset => Number((baseTemp + offset).toFixed(1)));
    const apparentData = diurnalOffsets.map(offset => Number((baseTemp + offset + 3.0).toFixed(1)));

    this._chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Outdoor Temp (°C)",
            data: outdoorData,
            borderColor: "#2563EB",
            backgroundColor: "rgba(37, 99, 235, 0.08)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#2563EB",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: "Apparent Temp (°C)",
            data: apparentData,
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderWidth: 2.5,
            borderDash: [4, 4],
            fill: false,
            tension: 0.35,
            pointBackgroundColor: "#EF4444",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { color: "#475569", font: { family: "'Inter', sans-serif", size: 12, weight: "600" }, usePointStyle: true, boxWidth: 8 }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            titleColor: "#93C5FD",
            bodyColor: "#F8FAFC",
            borderColor: "#334155",
            borderWidth: 1,
            padding: 10,
            callbacks: { label: (context) => ` ${context.dataset.label}: ${context.raw}°C` }
          }
        },
        scales: {
          x: { grid: { color: "#F1F5F9" }, ticks: { color: "#64748B", font: { family: "'Inter', sans-serif", size: 11 } } },
          y: { grid: { color: "#F1F5F9" }, ticks: { color: "#64748B", font: { family: "'Inter', sans-serif", size: 11 }, callback: (val) => `${val}°C` } }
        }
      }
    });
  },

  /**
   * Create Adaptive DLNM lag curve chart with 95% Confidence Interval Ribbon
   */
  _createAdaptiveLagChart(state, weather) {
    const canvas = document.getElementById("dlnmAdaptiveLagChart");
    if (!canvas) return;

    const dlnmEngine = window.HEATSHIELD_ADAPTIVE_DLNM;
    if (!dlnmEngine) return;

    const wards = (state && state.evaluatedWards) || [];
    let selectedWard = null;
    if (this._selectedWardId) {
      selectedWard = wards.find(w => w.ward_id === this._selectedWardId);
    }

    const exposureTemp = selectedWard ? (selectedWard.effective_temp || selectedWard.outdoor_temp || weather.temp || 41.5) : (weather.temp || 41.5);
    const dlnmResult = dlnmEngine.evaluateWardAdaptiveDLNM(selectedWard, exposureTemp);

    const lags = dlnmResult.adaptive_lag_curve.lags;
    const labels = lags.map(l => l.lag_label);
    const pointEstimates = lags.map(l => l.excess_risk_pct);
    const lowerCI = lags.map(l => l.excess_risk_ci_lower);
    const upperCI = lags.map(l => l.excess_risk_ci_upper);
    const hospitalCases = dlnmResult.daily_projection.map(d => d.realizable_hospital_admissions);

    const ctx = canvas.getContext("2d");

    this._chart = new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          // 1. Upper 95% Confidence Bound (invisible line for fill anchor)
          {
            type: "line",
            label: "Upper 95% CI",
            data: upperCI,
            borderColor: "rgba(220, 38, 38, 0.35)",
            borderDash: [3, 3],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            yAxisID: "yRisk",
            order: 3
          },
          // 2. Point Estimate Mean Curve with Ribbon Fill down to Lower CI
          {
            type: "line",
            label: "Estimated Excess Risk (%)",
            data: pointEstimates,
            borderColor: "#DC2626",
            backgroundColor: "rgba(220, 38, 38, 0.12)",
            borderWidth: 2.8,
            fill: "+1", // Fill between this dataset and Lower 95% CI
            tension: 0.35,
            pointBackgroundColor: "#DC2626",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: "yRisk",
            order: 1
          },
          // 3. Lower 95% Confidence Bound
          {
            type: "line",
            label: "Lower 95% CI",
            data: lowerCI,
            borderColor: "rgba(220, 38, 38, 0.35)",
            borderDash: [3, 3],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            yAxisID: "yRisk",
            order: 4
          },
          // 4. Expected Hospital Surge Admissions (Bars)
          {
            type: "bar",
            label: "Expected Hospital Admissions",
            data: hospitalCases,
            backgroundColor: "rgba(37, 99, 235, 0.25)",
            borderColor: "#2563EB",
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: "yCases",
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#475569",
              font: { family: "'Inter', sans-serif", size: 11, weight: "600" },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            titleColor: "#93C5FD",
            bodyColor: "#F8FAFC",
            borderColor: "#334155",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                if (context.dataset.label === "Estimated Excess Risk (%)") {
                  const idx = context.dataIndex;
                  return ` Excess Risk: +${context.raw}% (95% CI: +${lowerCI[idx]}% to +${upperCI[idx]}%)`;
                }
                if (context.dataset.label === "Expected Hospital Admissions") {
                  return ` Realizable Admissions: ${context.raw} cases`;
                }
                return null;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: "#F1F5F9" },
            ticks: { color: "#64748B", font: { family: "'Inter', sans-serif", size: 11 } }
          },
          yRisk: {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: "Excess Population Health Impact (%)",
              color: "#64748B",
              font: { family: "'Inter', sans-serif", size: 11, weight: "600" }
            },
            grid: { color: "#F1F5F9" },
            ticks: {
              color: "#64748B",
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (val) => `+${val}%`
            }
          },
          yCases: {
            type: "linear",
            position: "right",
            title: {
              display: true,
              text: "Hospital Admissions (Cases)",
              color: "#64748B",
              font: { family: "'Inter', sans-serif", size: 11, weight: "600" }
            },
            grid: { drawOnChartArea: false },
            ticks: { color: "#64748B", font: { family: "'Inter', sans-serif", size: 11 } }
          }
        }
      }
    });
  }
};
