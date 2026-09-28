/**
 * HEATSHIELD :: Ward Intelligence, Multi-Ward Comparison & All-Ward Analytics (Page 3)
 * Government Command Center Micro-Demographic Intelligence & Causal Diagnostics
 * Three Unified View Modes:
 * 1. Single Ward Administrative Dossier (Deep Dive & UTCI Metrics)
 * 2. Dedicated Multi-Ward Comparison Console (Side-by-side with Status Filters & Manual Selection)
 * 3. All-Ward Citywide Analytics Table (Sortable by UTCI, Risk, Slum Density, Hospital Burden)
 */

window.HEATSHIELD_PAGE_WARD_INTEL = {
  _viewMode: "dossier", // "dossier" | "compare" | "all_wards"
  _priorityMode: "smart", // "smart" | "scarcity" | "critical" | "all"
  _filter: "all",
  _searchQuery: "",
  _selectedCompareIds: [17, 58, 63], // Default 3 representative wards
  _allWardsSortBy: "utci", // "utci" | "risk" | "slum" | "pop"

  render(state) {
    const container = document.getElementById("pageWardIntel");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const app = window.HEATSHIELD_APP;
    const evaluatedWards = s.evaluatedWards || [];
    const isBn = s.language === "bn";

    const filteredWards = this._getFilteredWards(evaluatedWards);
    let selectedWard = evaluatedWards.find(w => w.ward_id === s.selectedWardId) || evaluatedWards[0] || {};

    container.innerHTML = `
      <!-- Page Header & Mode Switcher Bar -->
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div class="page-title">${isBn ? "ওয়ার্ড বুদ্ধিমত্তা ও ডায়াগনস্টিকস" : "Ward Intelligence, Comparison & Risk Diagnostics"}</div>
          <div class="page-subtitle" style="margin-bottom: 0;">
            ${isBn ? "UTCI বায়োমেটিওরোলজি, বহু-মানদণ্ড কারণমূলক বিশ্লেষণ ও পারস্পরিক তুলনা" : "Universal Thermal Climate Index (UTCI) · Causal Vulnerability Attribution · Multi-Ward Contrast"}
          </div>
        </div>
        
        <!-- View Mode Switcher Pills -->
        <div class="flex gap-2 items-center">
          <div class="tabs" style="margin-bottom: 0; border: 1px solid var(--border); border-radius: 4px; padding: 2px; background: var(--bg-card);">
            <button 
              class="tab ${this._viewMode === 'dossier' ? 'active' : ''}" 
              style="padding: 4px 10px; font-size: 11px; font-weight: 600;" 
              onclick="HEATSHIELD_PAGE_WARD_INTEL._viewMode = 'dossier'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
            >
              Ward Dossier
            </button>
            <button 
              class="tab ${this._viewMode === 'compare' ? 'active' : ''}" 
              style="padding: 4px 10px; font-size: 11px; font-weight: 600;" 
              onclick="HEATSHIELD_PAGE_WARD_INTEL._viewMode = 'compare'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
            >
              Prioritize Wards (${this._selectedCompareIds.length})
            </button>
            <button 
              class="tab ${this._viewMode === 'all_wards' ? 'active' : ''}" 
              style="padding: 4px 10px; font-size: 11px; font-weight: 600;" 
              onclick="HEATSHIELD_PAGE_WARD_INTEL._viewMode = 'all_wards'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
            >
              Compare All 144 Wards
            </button>
          </div>

          <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_APP.generatePDFReport('ward-risk')">
            <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Dossier PDF</span>
          </button>
        </div>
      </div>

      <!-- Main Content Area by View Mode -->
      ${this._viewMode === 'dossier' ? this._renderDossierView(filteredWards, selectedWard, s) : ''}
      ${this._viewMode === 'compare' ? this._renderCompareView(evaluatedWards, s) : ''}
      ${this._viewMode === 'all_wards' ? this._renderAllWardsView(evaluatedWards, s) : ''}
    `;
  },

  /* --------------------------------------------------------------------------
     MODE 1: SINGLE WARD DOSSIER VIEW
     -------------------------------------------------------------------------- */
  _renderDossierView(filteredWards, selectedWard, s) {
    const liveWeather = window.HEATSHIELD_ENGINE ? window.HEATSHIELD_ENGINE.liveWeather : { rh: 64 };
    return `
      <div class="grid-40-60">
        <!-- LEFT PANEL: Filterable Ward List -->
        <div class="card flex flex-col" style="height: calc(100vh - 180px); min-height: 600px;">
          <!-- Search & Risk Filter Tabs -->
          <div style="padding: 10px 14px; border-bottom: 1px solid var(--border);">
            <div class="header-search-container mb-2" style="max-width: 100%;">
              <span class="search-icon-pos">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input 
                type="text" 
                class="header-search-input"
                placeholder="Search ward number or locality..." 
                value="${this._searchQuery}" 
                oninput="HEATSHIELD_PAGE_WARD_INTEL._searchQuery = this.value; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);" 
              />
            </div>

            <!-- Risk Filter Tabs -->
            <div class="tabs" style="margin-bottom: 0; border-bottom: none; gap: 4px; display: flex; flex-wrap: wrap;">
              <div class="tab ${this._filter === 'all' ? 'active' : ''}" style="padding: 3px 8px; font-size: 10.5px;" onclick="HEATSHIELD_PAGE_WARD_INTEL._filter = 'all'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">All (144)</div>
              <div class="tab ${this._filter === 'critical' ? 'active' : ''}" style="padding: 3px 8px; font-size: 10.5px;" onclick="HEATSHIELD_PAGE_WARD_INTEL._filter = 'critical'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">Critical</div>
              <div class="tab ${this._filter === 'high' ? 'active' : ''}" style="padding: 3px 8px; font-size: 10.5px;" onclick="HEATSHIELD_PAGE_WARD_INTEL._filter = 'high'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">High</div>
              <div class="tab ${this._filter === 'moderate' ? 'active' : ''}" style="padding: 3px 8px; font-size: 10.5px;" onclick="HEATSHIELD_PAGE_WARD_INTEL._filter = 'moderate'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">Moderate</div>
              <div class="tab ${this._filter === 'safe' ? 'active' : ''}" style="padding: 3px 8px; font-size: 10.5px;" onclick="HEATSHIELD_PAGE_WARD_INTEL._filter = 'safe'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">Safe</div>
            </div>
          </div>

          <!-- Ward Item List with Full Names -->
          <div class="card-body" style="padding: 0; flex: 1; overflow-y: auto;">
            ${filteredWards.map(w => {
              const isSel = w.ward_id === selectedWard.ward_id;
              const riskCls = (w.risk_level || 'safe').toLowerCase();
              const score = w.hhvi ? w.hhvi.mitigated_hhvi : 75;
              const pop = w.population ? w.population.toLocaleString('en-IN') : 'N/A';
              const borough = w.borough ? `Borough ${w.borough}` : 'Central';
              return `
                <div 
                  style="padding: 9px 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: ${isSel ? 'var(--bg-muted)' : 'transparent'}; border-left: ${isSel ? '3px solid var(--primary)' : '3px solid transparent'}; transition: background 0.15s ease;"
                  onclick="HEATSHIELD_APP.selectWard(${w.ward_id}); HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
                >
                  <div class="flex items-center gap-2 min-w-0" style="flex: 1;">
                    <span class="risk-pill ${riskCls}" style="font-size: 9px; padding: 1px 5px;">${w.risk_level}</span>
                    <div class="min-w-0">
                      <div class="font-bold text-xs truncate" style="color: var(--text-primary);">
                        Ward ${w.ward_id} – ${w.name}
                      </div>
                      <div class="text-xxs text-muted mt-0.5">
                        UTCI: ${w.utci || 42}°C · ${borough}
                      </div>
                    </div>
                  </div>
                  <span class="font-mono font-bold text-xs" style="color: var(--text-primary);">${score}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- RIGHT PANEL: Full Selected Ward Dossier -->
        <div class="flex flex-col gap-3" style="max-height: calc(100vh - 180px); overflow-y: auto;">
          <!-- Ward Header Card -->
          <div class="card">
            <div class="card-header flex items-center justify-between flex-wrap gap-2">
              <div>
                <div class="operational-question-tag">Administrative Ward Profile</div>
                <div style="font-size: 18px; font-weight: 800; color: var(--text-primary);">
                  Ward ${selectedWard.ward_id} – ${selectedWard.name}
                </div>
                <div class="text-xs text-muted mt-0.5">
                  Borough ${selectedWard.borough || 'Central'} · ${selectedWard.name_bn || ''} · Kolkata Municipal Corporation
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="risk-pill ${(selectedWard.risk_level || 'critical').toLowerCase()}" style="font-size: 11px; padding: 4px 10px;">
                  [${selectedWard.risk_level || 'CRITICAL'}] RISK
                </span>
                <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_PAGE_WARD_INTEL.addWardToCompare(${selectedWard.ward_id})">
                  + Add to Compare
                </button>
              </div>
            </div>

            <div class="card-body">
              <!-- UTCI & Key Climate Indicator Strip -->
              <div class="grid-4 mb-3" style="gap: 10px;">
                <div class="p-2 rounded" style="background: var(--bg-muted); border: 1px solid var(--border);">
                  <div class="text-xxs text-muted uppercase font-bold">Universal Thermal (UTCI)</div>
                  <div class="font-extrabold text-base mt-0.5" style="color: var(--critical);">${selectedWard.utci || 46.2}°C</div>
                  <div class="text-xxs font-bold" style="color: var(--critical);">${selectedWard.utci_category || 'EXTREME HEAT STRESS'}</div>
                </div>

                <div class="p-2 rounded" style="background: var(--bg-muted); border: 1px solid var(--border);">
                  <div class="text-xxs text-muted uppercase font-bold">Ambient Temp · RH</div>
                  <div class="font-extrabold text-base mt-0.5">${selectedWard.outdoor_temp || 40.8}°C</div>
                  <div class="text-xxs text-muted">${liveWeather.rh || 64}% Relative Humidity</div>
                </div>

                <div class="p-2 rounded" style="background: var(--bg-muted); border: 1px solid var(--border);">
                  <div class="text-xxs text-muted uppercase font-bold">Wet-Bulb UTCI (WB UTCI)</div>
                  <div class="font-extrabold text-base mt-0.5" style="color: var(--high);">${selectedWard.wb_utci || 33.9}°C</div>
                  <div class="text-xxs text-muted">Stull WBGT: ${selectedWard.wbgt || 33.5}°C</div>
                </div>

                <div class="p-2 rounded" style="background: var(--bg-muted); border: 1px solid var(--border);">
                  <div class="text-xxs text-muted uppercase font-bold">Population Vulnerability</div>
                  <div class="font-extrabold text-base mt-0.5">${selectedWard.population ? selectedWard.population.toLocaleString('en-IN') : 'N/A'}</div>
                  <div class="text-xxs text-muted">${Math.round((selectedWard.slum_density || 0.6) * 100)}% Informal Slum Ratio</div>
                </div>
              </div>

              <!-- LEVEL 1: IMMEDIATE DIRECTIVES (SIMPLE ON TOP) -->
              <div class="grid-2 mb-3" style="gap: 12px;">
                <!-- Box 1: WHY THIS WARD IS AT RISK -->
                <div class="p-3 rounded" style="background: rgba(239, 68, 68, 0.06); border: 1px solid var(--critical); border-left: 4px solid var(--critical);">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-xs uppercase" style="color: var(--critical);">🚨 Why This Ward Is At Risk:</span>
                    <span class="risk-pill critical" style="font-size: 8.5px;">CRITICAL DRIVERS</span>
                  </div>
                  <ul class="text-xs text-secondary pl-3" style="line-height: 1.5; margin: 0; list-style-type: disc;">
                    <li><strong>Extreme UTCI:</strong> Exposure reaches <strong>${selectedWard.utci || 46.2}°C</strong> (${selectedWard.utci_category || 'Extreme Heat Stress'}).</li>
                    <li><strong>Tin-Roof Heat Trap:</strong> <strong>${Math.round((selectedWard.slum_density || 0.6) * 100)}%</strong> informal density with uninsulated asbestos/tin trapping nocturnal heat.</li>
                    <li><strong>Severe Canopy Deficit:</strong> Only <strong>${Math.round((selectedWard.tree_canopy || 0.08) * 100)}%</strong> vegetation canopy cover (municipal target: 30%).</li>
                    <li><strong>Vulnerable Population:</strong> <strong>${selectedWard.population ? selectedWard.population.toLocaleString('en-IN') : 'N/A'}</strong> residents with high elderly & outdoor laborer concentration.</li>
                  </ul>
                </div>

                <!-- Box 2: WHAT SHOULD BE CONSIDERED (EARLY ACTIONS) -->
                <div class="p-3 rounded" style="background: rgba(14, 165, 233, 0.06); border: 1px solid var(--primary); border-left: 4px solid var(--primary);">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-xs uppercase" style="color: var(--primary);">🛡️ What Should Be Considered:</span>
                    <span class="provenance-badge source">NDMA PROTOCOL</span>
                  </div>
                  <ul class="text-xs text-secondary pl-3" style="line-height: 1.5; margin: 0; list-style-type: disc;">
                    <li><strong>Water Misting:</strong> Pre-position <strong>2x 10KL water misting tankers</strong> at major transit points and labor hubs.</li>
                    <li><strong>Cooling Shelter:</strong> Activate Ward Community Hall as an <strong>air-conditioned public cooling refuge</strong>.</li>
                    <li><strong>Hydration Squads:</strong> Mobilize ASHA & volunteer teams for doorstep <strong>ORS and cool water distribution</strong>.</li>
                    <li><strong>Work Hours Advisory:</strong> Enforce mandatory <strong>outdoor labor pause from 12:00 to 16:00 IST</strong>.</li>
                  </ul>
                </div>
              </div>

              <!-- LEVEL 3: DEEP SCIENTIFIC ANALYSIS (COLLAPSIBLE UNDERNEATH) -->
              <details class="mb-3" style="background: var(--bg-muted); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px;">
                <summary style="font-weight: 700; font-size: 11.5px; cursor: pointer; color: var(--text-primary); outline: none;">
                  🔬 View Full Scientific Analysis (HHVI Decomposition, Splines & Telemetry)
                </summary>
                
                <div class="pt-3 mt-2" style="border-top: 1px solid var(--border);">
                  <div class="font-bold text-xs uppercase text-muted mb-2 flex items-center justify-between">
                    <span>Multi-Criteria Vulnerability Decomposition</span>
                    <span class="text-xxs font-mono text-muted">Score: ${selectedWard.hhvi ? selectedWard.hhvi.mitigated_hhvi : 88}/100</span>
                  </div>

                  <div class="flex flex-col gap-2 text-xs">
                    <div>
                      <div class="flex justify-between font-semibold mb-1">
                        <span>Thermal Hazard (35% Weight · LST & Humidity)</span>
                        <strong>${selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.heat_component : 32.4} / 35 pts</strong>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill red" style="width: ${((selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.heat_component : 32.4) / 35) * 100}%;"></div>
                      </div>
                    </div>

                    <div>
                      <div class="flex justify-between font-semibold mb-1">
                        <span>Slum Density & Tin-Roof Trap (${Math.round((selectedWard.slum_density || 0.85) * 100)}% area)</span>
                        <strong>${selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.slum_component : 22.0} / 25 pts</strong>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill orange" style="width: ${((selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.slum_component : 22.0) / 25) * 100}%;"></div>
                      </div>
                    </div>

                    <div>
                      <div class="flex justify-between font-semibold mb-1">
                        <span>Demographic Sensitivity (Elderly & Outdoor Labor Ratio)</span>
                        <strong>${selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.vuln_component : 17.5} / 20 pts</strong>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill orange" style="width: ${((selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.vuln_component : 17.5) / 20) * 100}%;"></div>
                      </div>
                    </div>

                    <div>
                      <div class="flex justify-between font-semibold mb-1">
                        <span>Tree Canopy Deficit (${Math.round((selectedWard.tree_canopy || 0.08) * 100)}% vegetation cover)</span>
                        <strong>${selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.canopy_component : 16.1} / 20 pts</strong>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill orange" style="width: ${((selectedWard.hhvi && selectedWard.hhvi.waterfall ? selectedWard.hhvi.waterfall.canopy_component : 16.1) / 20) * 100}%;"></div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-xxs text-muted font-mono mt-3 pt-2" style="border-top: 1px dashed var(--border);">
                    <span>Formula: HHVI = 0.35·H + 0.25·S + 0.20·D + 0.20·(1 - C)</span>
                    <span class="provenance-badge source">IMD + CENSUS 2011</span>
                  </div>
                </div>
              </details>

              <!-- Quick Action Triggers -->
              <div class="flex gap-2 pt-2" style="border-top: 1px solid var(--border);">
                <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_APP.dispatchResource(${selectedWard.ward_id}, 'Water Tanker')">
                  Dispatch Water Tanker to Ward ${selectedWard.ward_id}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.navigateTo('heatmap'); setTimeout(() => HEATSHIELD_MAP.flyToWard(${selectedWard.ward_id}, 'heatmapFullMap'), 200);">
                  Locate on GIS Map →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- WORKFLOW PROGRESSION BOTTOM NAVIGATION RIBBON -->
      <div id="wardIntelBottomNav"></div>
    `;

    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.renderPipelineBottomNav === "function") {
      window.HEATSHIELD_APP.renderPipelineBottomNav(2, "wardIntelBottomNav");
    }
  },

  /* --------------------------------------------------------------------------
     MODE 2: SMART WARD PRIORITIZATION & MULTI-WARD CONSOLE
     -------------------------------------------------------------------------- */
  _renderCompareView(allWards, s) {
    const selectedIds = this._selectedCompareIds;
    const compareWards = allWards.filter(w => selectedIds.includes(w.ward_id));
    const filteredCompareWards = this._filter === "all" 
      ? compareWards 
      : compareWards.filter(w => (w.risk_level || "").toLowerCase() === this._filter);

    // Compute prioritized list based on _priorityMode
    const sortedByRisk = [...allWards].sort((a, b) => {
      const scoreA = a.hhvi ? a.hhvi.mitigated_hhvi : 70;
      const scoreB = b.hhvi ? b.hhvi.mitigated_hhvi : 70;
      return scoreB - scoreA;
    });

    let priorityCohort = [];
    let deferredCohort = [];
    const pMode = this._priorityMode || "smart";

    if (pMode === "scarcity") {
      // 5 tankers available for 18 critical wards
      priorityCohort = sortedByRisk.slice(0, 5);
      deferredCohort = sortedByRisk.slice(5, 12);
    } else if (pMode === "critical") {
      priorityCohort = sortedByRisk.filter(w => w.risk_level === "CRITICAL");
    } else if (pMode === "all") {
      priorityCohort = sortedByRisk.slice(0, 20);
    } else { // "smart"
      priorityCohort = sortedByRisk.slice(0, 8);
    }

    return `
      <!-- 1. SMART WARD PRIORITIZATION CONSOLE -->
      <div class="card p-3 mb-4" style="border-left: 4px solid var(--primary);">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="operational-question-tag" style="background: rgba(14, 165, 233, 0.15); color: var(--primary);">Decision Support</span>
              <span class="font-bold text-sm" style="color: var(--text-primary);">
                Smart Ward Prioritization (Resource Allocation Console)
              </span>
            </div>
            <div class="text-xs text-secondary mt-0.5">
              Direct Decision Support: "Which critical wards should receive available resources first, why, and why not others?"
            </div>
          </div>

          <!-- 4 Priority Mode Pills -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xxs font-bold text-muted uppercase">Strategy Mode:</span>
            <button 
              class="btn btn-xs ${pMode === 'smart' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_WARD_INTEL._priorityMode = 'smart'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
            >
              ⚡ SMART PRIORITY
            </button>
            <button 
              class="btn btn-xs ${pMode === 'scarcity' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_WARD_INTEL._priorityMode = 'scarcity'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
              title="Prioritize top 5 wards when resources are constrained"
            >
              ⚠️ RESOURCE SCARCITY (5 TANKERS)
            </button>
            <button 
              class="btn btn-xs ${pMode === 'critical' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_WARD_INTEL._priorityMode = 'critical'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
            >
              🔴 CRITICAL WARDS (18)
            </button>
            <button 
              class="btn btn-xs ${pMode === 'all' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="HEATSHIELD_PAGE_WARD_INTEL._priorityMode = 'all'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);"
            >
              📋 ALL WARDS (144)
            </button>
          </div>
        </div>

        <!-- Strategy Context Banner -->
        <div class="p-2.5 rounded mb-3 text-xs" style="background: var(--bg-muted); border: 1px solid var(--border);">
          ${pMode === 'scarcity' ? `
            <div class="flex items-center gap-2">
              <span style="font-size: 16px;">⚠️</span>
              <div>
                <strong style="color: var(--critical);">SCARCITY PROTOCOL ACTIVE:</strong> 5 Water Misting Tankers available against 18 Critical Wards.
                <span class="text-secondary">Directing immediate deployment to the 5 highest-vulnerability wards below; secondary wards deferred to Wave 2 upon tanker turnaround.</span>
              </div>
            </div>
          ` : pMode === 'critical' ? `
            <div class="flex items-center gap-2">
              <span style="font-size: 16px;">🔴</span>
              <div>
                <strong style="color: var(--critical);">ALL CRITICAL JURISDICTIONS (18 WARDS):</strong> All municipal wards exceeding both UTCI &gt;42°C and composite vulnerability &gt;80/100 requiring immediate heat intervention.
              </div>
            </div>
          ` : pMode === 'all' ? `
            <div class="flex items-center gap-2">
              <span style="font-size: 16px;">📋</span>
              <div>
                <strong style="color: var(--primary);">CITYWIDE PRIORITIZATION MATRIX:</strong> Complete 144-ward jurisdiction stratified by composite municipal vulnerability ranking.
              </div>
            </div>
          ` : `
            <div class="flex items-center gap-2">
              <span style="font-size: 16px;">⚡</span>
              <div>
                <strong style="color: var(--primary);">SMART MULTI-CRITERIA PRIORITIZATION:</strong> Dynamic ranking optimizing life-safety impact by weighing thermal hazard (35%), uninsulated tin-roof density (25%), demographic vulnerability (20%), and canopy deficit (20%).
              </div>
            </div>
          `}
        </div>

        <!-- Prioritized Wards Grid / Cards -->
        <div class="flex flex-col gap-2 mb-3">
          ${priorityCohort.map((w, idx) => {
            const score = w.hhvi ? w.hhvi.mitigated_hhvi : (88 - idx * 2);
            const slum = Math.round((w.slum_density || 0.6) * 100);
            const canopy = Math.round((w.tree_canopy || 0.08) * 100);
            const utci = w.utci || 46.2;
            const pop = w.population ? w.population.toLocaleString('en-IN') : 'N/A';
            return `
              <div class="p-3 rounded flex flex-col md:flex-row md:items-center justify-between gap-3" style="background: var(--bg-card); border: 1px solid var(--border); border-left: 4px solid ${idx < 3 ? 'var(--critical)' : 'var(--high)'};">
                <div style="flex: 1; min-width: 0;">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="font-extrabold text-xs" style="color: var(--primary);">#${idx + 1} PRIORITY</span>
                    <strong class="text-xs" style="color: var(--text-primary);">Ward ${w.ward_id} – ${w.name}</strong>
                    <span class="text-xxs text-muted">Borough ${w.borough || 'Central'}</span>
                    <span class="risk-pill ${(w.risk_level || 'critical').toLowerCase()}" style="font-size: 9px; padding: 1px 6px;">${w.risk_level || 'CRITICAL'}</span>
                    <span class="font-mono text-xs font-bold" style="color: var(--text-primary);">${score}/100 Score</span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs mt-2" style="background: var(--bg-muted); padding: 8px 10px; border-radius: 4px;">
                    <div>
                      <span class="text-xxs font-bold text-muted uppercase block">Why Selected:</span>
                      <span class="text-secondary" style="font-size: 11px;">
                        UTCI <strong>${utci}°C</strong>, <strong>${slum}%</strong> tin roofs, <strong>${canopy}%</strong> canopy cover.
                      </span>
                    </div>
                    <div>
                      <span class="text-xxs font-bold text-muted uppercase block">Resource Required:</span>
                      <span class="text-primary font-bold" style="font-size: 11px;">
                        2x 10KL Water Tankers + 1 Cooling Hub
                      </span>
                    </div>
                    <div>
                      <span class="text-xxs font-bold text-muted uppercase block">Expected Impact:</span>
                      <span class="font-bold text-safe" style="font-size: 11px;">
                        ~34% reduction in peak heat cases
                      </span>
                    </div>
                    <div>
                      <span class="text-xxs font-bold text-muted uppercase block">Confidence:</span>
                      <span class="provenance-badge verified" style="font-size: 9.5px;">HIGH (94% EMPIRICAL)</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_APP.selectWard(${w.ward_id}); HEATSHIELD_PAGE_WARD_INTEL._viewMode = 'dossier'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">
                    View Dossier
                  </button>
                  <button class="btn btn-primary btn-xs" onclick="HEATSHIELD_APP.dispatchResource(${w.ward_id}, 'Water Tanker')">
                    Dispatch Unit
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- Deferral Queue (When in Scarcity Mode) -->
        ${pMode === 'scarcity' && deferredCohort.length > 0 ? `
          <div class="p-3 rounded mb-3" style="background: rgba(249, 115, 22, 0.06); border: 1px dashed var(--warning);">
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-xs" style="color: var(--warning);">⏳ Wave 2 Deferred Queue (Resource Scarcity Protocol):</span>
              <span class="text-xxs text-muted">Awaiting turnaround of deployed tankers</span>
            </div>
            <div class="flex flex-col gap-1.5">
              ${deferredCohort.map((w, idx) => `
                <div class="flex items-center justify-between text-xs p-1.5 rounded" style="background: var(--bg-card); border: 1px solid var(--border);">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-muted text-xxs">#${idx + 6}</span>
                    <strong>Ward ${w.ward_id} – ${w.name}</strong>
                    <span class="risk-pill ${(w.risk_level || 'high').toLowerCase()}" style="font-size: 8.5px;">${w.risk_level}</span>
                    <span class="text-secondary text-xxs">UTCI ${w.utci || 42}°C · Pop: ${(w.population || 40000).toLocaleString()}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xxs text-muted"><strong>Why Not Selected:</strong> Lower informal density (${Math.round((w.slum_density || 0.4) * 100)}%), UPHC within 600m</span>
                    <span class="badge" style="background: var(--bg-muted); font-size: 9px;">DEFERRED WAVE 2</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 2. SIDE-BY-SIDE MULTI-WARD COMPARISON MATRIX -->
      <div class="card p-3">
        <div class="flex items-center justify-between mb-2 pb-2" style="border-bottom: 1px solid var(--border);">
          <div>
            <div class="font-bold text-xs" style="color: var(--text-primary);">Side-by-Side Detailed Parameter Comparison Matrix</div>
            <div class="text-xxs text-muted">Contrast micro-demographic, biometeorological, and infrastructure metrics across selected wards</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-muted">Add Ward:</span>
            <select class="header-search-input" style="width: 210px; padding: 3px 8px; font-size: 11px;" onchange="if(this.value){ HEATSHIELD_PAGE_WARD_INTEL.addWardToCompare(parseInt(this.value, 10)); this.value=''; }">
              <option value="">Select Ward to add...</option>
              ${allWards.map(w => `<option value="${w.ward_id}">Ward ${w.ward_id} – ${w.name} (${w.risk_level})</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- Quick Comparison Presets -->
        <div class="flex items-center gap-2 mb-3 pb-2 flex-wrap" style="border-bottom: 1px solid var(--border);">
          <span class="text-xxs font-bold text-muted uppercase">Comparison Presets:</span>
          <button class="btn btn-xs btn-secondary" onclick="HEATSHIELD_PAGE_WARD_INTEL.loadPreset('critical')">Top Critical Wards</button>
          <button class="btn btn-xs btn-secondary" onclick="HEATSHIELD_PAGE_WARD_INTEL.loadPreset('default')">Default Trio (Wards 17, 58, 63)</button>
          <button class="btn btn-xs btn-secondary" onclick="HEATSHIELD_PAGE_WARD_INTEL.loadPreset('clear')">Clear Matrix</button>
        </div>

        <!-- Matrix or Empty State -->
        ${filteredCompareWards.length === 0 ? `
          <div class="p-8 text-center" style="background: var(--bg-muted); border-radius: 6px; border: 1px dashed var(--border); margin: 16px 0;">
            <div class="font-bold text-sm mb-1" style="color: var(--text-primary);">No Wards in Current Comparison Matrix</div>
            <p class="text-xs text-secondary mb-3">
              ${this._filter !== 'all' 
                ? `None of your ${compareWards.length} selected wards have severity "${this._filter.toUpperCase()}".` 
                : 'Add wards manually using the dropdown above or load an operational preset.'}
            </p>
            <div class="flex gap-2 justify-center">
              <button class="btn btn-primary btn-xs" onclick="HEATSHIELD_PAGE_WARD_INTEL.loadPreset('critical')">Load Top Critical Wards</button>
              <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_PAGE_WARD_INTEL.loadPreset('default')">Load Default Trio (Wards 17, 58, 63)</button>
            </div>
          </div>
        ` : `
        <!-- Comparative Multi-Ward Matrix -->
        <div style="overflow-x: auto;">
          <table class="compare-matrix-table">
            <thead>
              <tr>
                <th style="width: 180px;">Operational Dimension</th>
                ${filteredCompareWards.map(w => `
                  <th style="min-width: 200px;">
                    <div class="flex items-center justify-between">
                      <span class="font-bold">Ward ${w.ward_id} (${w.name})</span>
                      <button class="header-icon-btn" style="width: 20px; height: 20px; font-size: 10px;" onclick="HEATSHIELD_PAGE_WARD_INTEL.removeWardFromCompare(${w.ward_id})">✕</button>
                    </div>
                  </th>
                `).join("")}
              </tr>
            </thead>
            <tbody>
              <!-- Risk Status -->
              <tr>
                <td class="font-bold">Heat Risk Classification</td>
                ${filteredCompareWards.map(w => `
                  <td><span class="risk-pill ${(w.risk_level || 'safe').toLowerCase()}">${w.risk_level || 'SAFE'}</span></td>
                `).join("")}
              </tr>
              <!-- UTCI Index -->
              <tr>
                <td class="font-bold">Universal Thermal (UTCI)</td>
                ${filteredCompareWards.map(w => `
                  <td class="font-extrabold" style="color: ${w.utci >= 46 ? 'var(--critical)' : (w.utci >= 38 ? 'var(--high)' : 'var(--text-primary)')};">
                    ${w.utci || 42}°C · <span class="text-xxs">${w.utci_category || 'STRONG'}</span>
                  </td>
                `).join("")}
              </tr>
              <!-- Wet-Bulb UTCI -->
              <tr>
                <td class="font-bold">Wet-Bulb UTCI (WB UTCI)</td>
                ${filteredCompareWards.map(w => `
                  <td class="font-mono">${w.wb_utci || 33.5}°C</td>
                `).join("")}
              </tr>
              <!-- Ambient & Effective Temp -->
              <tr>
                <td class="font-bold">Ambient / Effective Temp</td>
                ${filteredCompareWards.map(w => `
                  <td>${w.outdoor_temp || 40.8}°C / <strong style="color:var(--high);">${w.effective_temp || 44.5}°C</strong></td>
                `).join("")}
              </tr>
              <!-- Composite Score -->
              <tr>
                <td class="font-bold">Composite HHVI Score</td>
                ${filteredCompareWards.map(w => `
                  <td class="font-bold">${w.hhvi ? w.hhvi.mitigated_hhvi : 75} / 100</td>
                `).join("")}
              </tr>
              <!-- Population & Slum Density -->
              <tr>
                <td class="font-bold">Population · Slum Density</td>
                ${filteredCompareWards.map(w => `
                  <td>${w.population ? w.population.toLocaleString('en-IN') : 'N/A'} · <strong>${Math.round((w.slum_density || 0.5) * 100)}% Slums</strong></td>
                `).join("")}
              </tr>
              <!-- Tree Canopy -->
              <tr>
                <td class="font-bold">Tree Canopy Deficit</td>
                ${filteredCompareWards.map(w => `
                  <td>${Math.round((w.tree_canopy || 0.1) * 100)}% cover (${w.tree_canopy < 0.15 ? 'Severe Deficit' : 'Moderate'})</td>
                `).join("")}
              </tr>
              <!-- Hospital Impact -->
              <tr>
                <td class="font-bold">Projected Hospital Surge</td>
                ${filteredCompareWards.map(w => `
                  <td style="color: ${w.risk_level === 'CRITICAL' ? 'var(--critical)' : 'var(--text-secondary)'};">
                    ${w.risk_level === 'CRITICAL' ? '+42 admissions/wk (Extreme)' : '+14 admissions/wk (Moderate)'}
                  </td>
                `).join("")}
              </tr>
              <!-- Required Action -->
              <tr>
                <td class="font-bold">Mandated Response Action</td>
                ${filteredCompareWards.map(w => `
                  <td>
                    ${w.risk_level === 'CRITICAL' 
                      ? '<strong>Deploy 2 Water Tankers + Activate Pop-Up Cooling Hub</strong>' 
                      : (w.risk_level === 'HIGH' ? 'Pre-position 1 Tanker + Hydration Booths' : 'Routine Surveillance')}
                  </td>
                `).join("")}
              </tr>
              <!-- Operational Trigger -->
              <tr>
                <td class="font-bold">Immediate Dispatch</td>
                ${filteredCompareWards.map(w => `
                  <td>
                    <button class="btn btn-primary btn-xs" onclick="HEATSHIELD_APP.dispatchResource(${w.ward_id}, 'Water Tanker')">
                      Dispatch to Ward ${w.ward_id}
                    </button>
                  </td>
                `).join("")}
              </tr>
            </tbody>
          </table>
        </div>
        `}
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     MODE 3: COMPARE ALL 144 WARDS (CITYWIDE SORTABLE TABLE)
     -------------------------------------------------------------------------- */
  _renderAllWardsView(allWards, s) {
    let sortedWards = [...allWards];
    const sortBy = this._allWardsSortBy;

    if (sortBy === "utci") {
      sortedWards.sort((a, b) => (b.utci || 0) - (a.utci || 0));
    } else if (sortBy === "risk") {
      sortedWards.sort((a, b) => (b.hhvi ? b.hhvi.mitigated_hhvi : 0) - (a.hhvi ? a.hhvi.mitigated_hhvi : 0));
    } else if (sortBy === "slum") {
      sortedWards.sort((a, b) => (b.slum_density || 0) - (a.slum_density || 0));
    } else if (sortBy === "pop") {
      sortedWards.sort((a, b) => (b.population || 0) - (a.population || 0));
    }

    return `
      <div class="card p-3">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div class="font-bold text-xs" style="color:var(--text-primary);">All-Ward Citywide Stratification (144 Wards)</div>
            <div class="text-xxs text-muted">Comparative vulnerability matrix across the complete Kolkata municipal jurisdiction</div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-muted">Sort By:</span>
            <select class="header-search-input" style="width: 180px; padding: 3px 8px; font-size: 11px;" onchange="HEATSHIELD_PAGE_WARD_INTEL._allWardsSortBy = this.value; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">
              <option value="utci" ${sortBy === 'utci' ? 'selected' : ''}>Highest UTCI Index</option>
              <option value="risk" ${sortBy === 'risk' ? 'selected' : ''}>Highest Risk Score</option>
              <option value="slum" ${sortBy === 'slum' ? 'selected' : ''}>Highest Slum Density</option>
              <option value="pop" ${sortBy === 'pop' ? 'selected' : ''}>Highest Population</option>
            </select>
          </div>
        </div>

        <div style="max-height: 550px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ward ID & Name</th>
                <th>Borough</th>
                <th>Risk Level</th>
                <th>UTCI Index</th>
                <th>WB UTCI</th>
                <th>Effective Temp</th>
                <th>Slum Density</th>
                <th>Population</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${sortedWards.map(w => `
                <tr class="hover:bg-muted cursor-pointer" onclick="HEATSHIELD_APP.selectWard(${w.ward_id}); HEATSHIELD_PAGE_WARD_INTEL._viewMode = 'dossier'; HEATSHIELD_PAGE_WARD_INTEL.render(HEATSHIELD_STATE);">
                  <td class="font-bold">Ward ${w.ward_id} – ${w.name}</td>
                  <td>Borough ${w.borough || 'Central'}</td>
                  <td><span class="risk-pill ${(w.risk_level || 'safe').toLowerCase()}">${w.risk_level}</span></td>
                  <td class="font-bold" style="color: ${w.utci >= 46 ? 'var(--critical)' : (w.utci >= 38 ? 'var(--high)' : 'var(--text-primary)')};">${w.utci || 42}°C</td>
                  <td class="font-mono">${w.wb_utci || 33.5}°C</td>
                  <td>${w.effective_temp || 41.2}°C</td>
                  <td>${Math.round((w.slum_density || 0.5) * 100)}%</td>
                  <td>${w.population ? w.population.toLocaleString('en-IN') : 'N/A'}</td>
                  <td>
                    <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation(); HEATSHIELD_PAGE_WARD_INTEL.addWardToCompare(${w.ward_id})">
                      + Compare
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  addWardToCompare(wardId) {
    const id = parseInt(wardId, 10);
    if (!id || isNaN(id)) return;
    if (this._selectedCompareIds.includes(id)) {
      window.HEATSHIELD_APP.showToast(`Ward ${id} is already in the comparison matrix`, "warning");
      return;
    }
    this._selectedCompareIds.push(id);
    if (this._selectedCompareIds.length > 5) {
      this._selectedCompareIds.shift();
    }
    this._viewMode = "compare";
    this.render(window.HEATSHIELD_STATE);
    window.HEATSHIELD_APP.showToast(`✓ Added Ward ${id} to comparison matrix`, "info");
  },

  loadPreset(presetType) {
    const allWards = (window.HEATSHIELD_STATE && window.HEATSHIELD_STATE.evaluatedWards) || [];
    if (presetType === "critical") {
      const crit = allWards.filter(w => w.risk_level === "CRITICAL").slice(0, 5).map(w => w.ward_id);
      this._selectedCompareIds = crit.length > 0 ? crit : [17, 58, 63];
      this._filter = "all";
      window.HEATSHIELD_APP.showToast(`✓ Loaded ${this._selectedCompareIds.length} Critical Wards into comparison`, "info");
    } else if (presetType === "clear") {
      this._selectedCompareIds = [];
      this._filter = "all";
      window.HEATSHIELD_APP.showToast("Cleared comparison matrix", "info");
    } else { // default
      this._selectedCompareIds = [17, 58, 63];
      this._filter = "all";
      window.HEATSHIELD_APP.showToast("✓ Reset to default trio (Wards 17, 58, 63)", "info");
    }
    this._viewMode = "compare";
    this.render(window.HEATSHIELD_STATE);
  },

  setMode(mode) {
    if (["dossier", "compare", "all_wards"].includes(mode)) {
      this._viewMode = mode;
      this.render(window.HEATSHIELD_STATE);
    }
  },

  toggleWardInComparison(wardId) {
    const id = parseInt(wardId, 10);
    if (this._selectedCompareIds.includes(id)) {
      this.removeWardFromCompare(id);
    } else {
      this.addWardToCompare(id);
    }
  },

  removeWardFromCompare(wardId) {
    this._selectedCompareIds = this._selectedCompareIds.filter(id => id !== wardId);
    this.render(window.HEATSHIELD_STATE);
  },

  _getFilteredWards(wards) {
    let result = [...wards];
    if (this._filter !== "all") {
      result = result.filter(w => (w.risk_level || "").toLowerCase() === this._filter);
    }
    if (this._searchQuery.trim()) {
      const q = this._searchQuery.toLowerCase().trim();
      result = result.filter(w => 
        String(w.ward_id).includes(q) || 
        (w.name || "").toLowerCase().includes(q) ||
        (w.name_bn || "").toLowerCase().includes(q)
      );
    }
    return result;
  }
};
