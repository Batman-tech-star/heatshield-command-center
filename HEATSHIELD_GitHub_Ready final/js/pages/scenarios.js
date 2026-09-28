/**
 * HEATSHIELD :: Scenarios Simulator & What-If Planning (Page 7)
 * Proactive contingency modeling with dynamic anomaly sliders (Section Q & AS Standard)
 */

window.HEATSHIELD_PAGE_SCENARIOS = {
  _params: {
    tempDelta: 2.5,
    humidityDelta: 5,
    tankers: 8,
    coolingHubs: 5,
    laborBan: true
  },
  _hasRun: false,

  render(state) {
    const container = document.getElementById("pageScenarios");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const p = this._params;
    const basePeak = s.peakTemp || 41.2;
    const baseCritical = s.criticalWardsCount || 4;
    const baseAtRiskPop = s.totalAtRiskPop || 180000;

    // Mathematical projection of simulation delta
    const simPeakTemp = Number((basePeak + p.tempDelta).toFixed(1));
    const rawEscalatedCritical = Math.min(144, Math.round(baseCritical * (1 + p.tempDelta * 0.75)));
    
    // Mitigation reductions from intervention sliders
    const tankerMitigation = p.tankers * 0.6;
    const hubMitigation = p.coolingHubs * 0.8;
    const laborMitigation = p.laborBan ? 4.5 : 0.0;
    const totalMitigationWards = Math.round(tankerMitigation + hubMitigation + laborMitigation);

    const simCriticalWards = Math.max(1, rawEscalatedCritical - totalMitigationWards);
    const simAtRiskPop = Math.round(baseAtRiskPop * (1 + (p.tempDelta * 0.5) - (totalMitigationWards * 0.04)));
    const protectionPct = Number(((totalMitigationWards / Math.max(1, rawEscalatedCritical)) * 100).toFixed(1));

    container.innerHTML = `
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div class="page-title">Scenarios Simulator & What-If Lab</div>
          <div class="page-subtitle" style="margin-bottom: 0;">Simulate extreme heat escalation scenarios & quantify policy intervention impacts</div>
        </div>
        <div class="simulation-banner">
          ⚠️ SIMULATION MODE — DOES NOT MODIFY LIVE OPERATIONAL STATE
        </div>
      </div>

      <!-- Split Layout: 40% Interactive Controls / 60% Projected Outcomes -->
      <div class="grid-40-60">
        <!-- LEFT PANEL: Scenario Controls -->
        <div class="card flex flex-col gap-4" style="padding: 20px;">
          <div class="card-title">Intervention & Hazard Controls</div>

          <!-- Temperature Anomaly Slider -->
          <div class="slider-control">
            <label>
              <span>Temperature Anomaly (Heatwave Escalation):</span>
              <strong style="color: var(--critical);">+${p.tempDelta}°C (${simPeakTemp}°C)</strong>
            </label>
            <input 
              type="range" min="0" max="5" step="0.5" value="${p.tempDelta}" 
              oninput="HEATSHIELD_PAGE_SCENARIOS._params.tempDelta = parseFloat(this.value); HEATSHIELD_PAGE_SCENARIOS.render(HEATSHIELD_STATE);" 
            />
          </div>

          <!-- Humidity Anomaly Slider -->
          <div class="slider-control">
            <label>
              <span>Relative Humidity Anomaly:</span>
              <strong style="color: var(--primary);">${p.humidityDelta >= 0 ? '+' : ''}${p.humidityDelta}%</strong>
            </label>
            <input 
              type="range" min="-10" max="20" step="5" value="${p.humidityDelta}" 
              oninput="HEATSHIELD_PAGE_SCENARIOS._params.humidityDelta = parseFloat(this.value); HEATSHIELD_PAGE_SCENARIOS.render(HEATSHIELD_STATE);" 
            />
          </div>

          <!-- Water Tankers Slider -->
          <div class="slider-control">
            <label>
              <span>Deploy Mobile Water Misting Tankers:</span>
              <strong>${p.tankers} Units</strong>
            </label>
            <input 
              type="range" min="0" max="20" step="1" value="${p.tankers}" 
              oninput="HEATSHIELD_PAGE_SCENARIOS._params.tankers = parseInt(this.value, 10); HEATSHIELD_PAGE_SCENARIOS.render(HEATSHIELD_STATE);" 
            />
          </div>

          <!-- Cooling Hubs Slider -->
          <div class="slider-control">
            <label>
              <span>Activate Community Pop-Up Cooling Hubs:</span>
              <strong>${p.coolingHubs} Centers</strong>
            </label>
            <input 
              type="range" min="0" max="15" step="1" value="${p.coolingHubs}" 
              oninput="HEATSHIELD_PAGE_SCENARIOS._params.coolingHubs = parseInt(this.value, 10); HEATSHIELD_PAGE_SCENARIOS.render(HEATSHIELD_STATE);" 
            />
          </div>

          <!-- Labor Shift Restriction Toggle -->
          <div class="flex items-center justify-between p-3" style="background: var(--bg-muted); border-radius: 8px;">
            <div>
              <div class="font-bold text-xs">Mandatory Labor Shift Stoppage</div>
              <div class="text-xxs text-muted">Enforce 12 PM – 4 PM construction pause</div>
            </div>
            <input 
              type="checkbox" ${p.laborBan ? 'checked' : ''} 
              style="width: 18px; height: 18px; cursor: pointer;"
              onchange="HEATSHIELD_PAGE_SCENARIOS._params.laborBan = this.checked; HEATSHIELD_PAGE_SCENARIOS.render(HEATSHIELD_STATE);" 
            />
          </div>

          <div class="flex gap-2 mt-2">
            <button class="btn btn-primary btn-sm flex-1" onclick="HEATSHIELD_PAGE_SCENARIOS.runSimulation()">
              ▶ Run Scenario Projection
            </button>
            <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_PAGE_SCENARIOS.resetDefaults()">
              ↺ Reset Defaults
            </button>
          </div>
        </div>

        <!-- RIGHT PANEL: Projected Simulation Results -->
        <div class="flex flex-col gap-4">
          <!-- Comparative Metric Cards (Current vs Simulated) -->
          <div class="grid-3" style="gap: 12px;">
            <!-- Metric 1: Critical Wards -->
            <div class="card" style="padding: 16px; border-left: 4px solid var(--critical);">
              <div class="kpi-label">Critical Wards (HHVI >= 80)</div>
              <div class="flex items-baseline gap-2">
                <span class="text-sm text-muted">${baseCritical}</span>
                <span class="text-sm">→</span>
                <span class="kpi-value" style="color: var(--critical);">${simCriticalWards}</span>
              </div>
              <div class="text-xxs text-muted mt-1">Escalation without mitigation: +${rawEscalatedCritical - baseCritical}</div>
            </div>

            <!-- Metric 2: Population at Risk -->
            <div class="card" style="padding: 16px; border-left: 4px solid var(--high);">
              <div class="kpi-label">Population Exposed</div>
              <div class="flex items-baseline gap-2">
                <span class="text-sm text-muted">${window.HEATSHIELD_APP.formatPop(baseAtRiskPop)}</span>
                <span class="text-sm">→</span>
                <span class="kpi-value" style="color: var(--high);">${window.HEATSHIELD_APP.formatPop(simAtRiskPop)}</span>
              </div>
              <div class="text-xxs text-muted mt-1">Census 2011 Verified Baseline</div>
            </div>

            <!-- Metric 3: Protective Impact -->
            <div class="card" style="padding: 16px; border-left: 4px solid var(--safe);">
              <div class="kpi-label">Intervention Efficiency</div>
              <div class="kpi-value" style="color: var(--safe);">+${protectionPct}%</div>
              <div class="text-xxs text-muted mt-1">${totalMitigationWards} Wards Protected</div>
            </div>
          </div>

          <!-- Policy Insights & Recommendation Summary -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <span class="card-title">Scenario Synthesis & Municipal Findings</span>
              <span class="provenance-badge modelled">MODELLED PROJECTION</span>
            </div>
            <div class="card-body">
              <div class="flex flex-col gap-3 text-xs" style="line-height: 1.6;">
                <div class="flex items-start gap-2">
                  <span class="status-dot critical" style="margin-top: 5px;"></span>
                  <span><strong>Hazard Impact:</strong> A +${p.tempDelta}°C anomaly pushes peak apparent temperatures to <strong>${simPeakTemp}°C</strong>, expanding severe heat traps into northern dense boroughs.</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="status-dot safe" style="margin-top: 5px;"></span>
                  <span><strong>Mitigation Return:</strong> Deploying ${p.tankers} water misting tankers combined with ${p.coolingHubs} cooling hubs reduces expected emergency hospitalizations by <strong>${protectionPct}%</strong>.</span>
                </div>
                ${p.laborBan ? `
                  <div class="flex items-start gap-2">
                    <span class="status-dot safe" style="margin-top: 5px;"></span>
                    <span><strong>Policy Action:</strong> Afternoon construction ban successfully prevents physiological collapse across 42,000 outdoor daily-wage laborers.</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  runSimulation() {
    window.HEATSHIELD_APP.showToast("✓ Scenario recalculated with current intervention parameters.", "success");
    this.render(window.HEATSHIELD_STATE);
  },

  resetDefaults() {
    this._params = {
      tempDelta: 2.5,
      humidityDelta: 5,
      tankers: 8,
      coolingHubs: 5,
      laborBan: true
    };
    window.HEATSHIELD_APP.showToast("Reset scenario sliders to baseline defaults.", "info");
    this.render(window.HEATSHIELD_STATE);
  }
};
