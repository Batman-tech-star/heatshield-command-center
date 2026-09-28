/**
 * HEATSHIELD :: Operational Command Overview (Page 1)
 * "Government Command Center + Urban Heat Intelligence Platform + AI Decision Support System"
 * Clear Visual Hierarchy answering within 10 seconds:
 * 1. CURRENT SITUATION (City Heat Status & Bulk Early Warning)
 * 2. WHERE IS THE RISK? (Heat Intelligence & WB UTCI GIS Choropleth)
 * 3. TECHNICAL INTELLIGENCE FLOW (Data Input -> Intelligence -> Output -> Recommendation -> Action)
 * 4. WHAT NEEDS ACTION? (Response Required Priority Queue)
 * 5. HEALTH & HOSPITAL IMPACT (Biostatistical DLNM Baseline vs Intervention)
 * 6. WHAT RESOURCES ARE AVAILABLE? (Tactical Municipal Fleet Readiness)
 */

window.HEATSHIELD_PAGE_OVERVIEW = {
  _mapInitialized: false,
  _impactChart: null,

  render(state) {
    const container = document.getElementById("pageOverview");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const engine = window.HEATSHIELD_ENGINE || {};
    const app = window.HEATSHIELD_APP;
    const isBn = s.language === "bn";

    const liveWeather = engine.liveWeather || { temp: 40.8, apparent_temp: 46.2, rh: 64, wind_speed_kmh: 14.5 };
    const evaluated = s.evaluatedWards || [];
    
    // Exact 4-level ward counts
    const criticalWardsList = evaluated.filter(w => w.risk_level === "CRITICAL");
    const criticalWards = criticalWardsList.length || s.criticalWardsCount || 14;
    const highWards = evaluated.filter(w => w.risk_level === "HIGH").length || s.highWardsCount || 32;
    const moderateWards = evaluated.filter(w => w.risk_level === "MODERATE").length || 48;
    const safeWards = evaluated.filter(w => w.risk_level === "SAFE" || !w.risk_level).length || 50;
    const totalWards = evaluated.length || 144;

    const atRiskPop = s.totalAtRiskPop || 380400;
    const topWards = evaluated.slice(0, 5);
    const selectedWard = evaluated.find(w => w.ward_id === s.selectedWardId) || evaluated[0] || {};
    const resources = s.resources || {
      tankers: { total: 25, deployed: 14, available: 11 },
      coolingHubs: { total: 15, deployed: 8, available: 7 },
      medicalTeams: { total: 10, deployed: 6, available: 4 },
      officers: { total: 40, deployed: 28, available: 12 }
    };

    container.innerHTML = `
      <!-- 1. OFFICIAL PAGE HEADER & TIME SENSITIVITY -->
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div class="page-title">${isBn ? "শহরব্যাপী তাপ-ঝুঁকি পরিস্থিতি ও কমান্ড রুম" : "Kolkata Citywide Urban Heat Emergency Command"}</div>
          <div class="page-subtitle" style="margin-bottom: 0;">
            ${isBn ? "১৪৪টি ওয়ার্ডের রিয়েল-টাইম থার্মাল স্ট্রেস, UTCI সূচক ও আগাম সতর্কবার্তা" : "Real-time surveillance across 144 municipal wards · Universal Thermal Climate Index (UTCI) · Early Warning"}
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.openAiAssistant()" title="Open System-Aware AI Administrative Assistant">
            <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Ask AI Assistant</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_APP.generatePDFReport('situation')">
            <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Situation Report PDF</span>
          </button>
        </div>
      </div>

      <!-- 2. CITY HEAT STATUS: 4-LEVEL OPERATIONAL HIERARCHY + CRITICAL BULK ACTION (ABOVE THE FOLD) -->
      <div class="city-heat-status-banner">
        <!-- Level 1: CRITICAL -->
        <div class="heat-level-cell critical">
          <div class="heat-level-header">
            <span class="heat-level-title" style="color: var(--critical);">
              <span class="risk-pill critical" style="margin-right: 4px;">CRITICAL</span>
            </span>
            <button class="btn btn-xs" style="background: var(--critical); color: #FFF; border: none; font-size: 10px; padding: 2px 7px;" onclick="HEATSHIELD_APP.openBulkWarningModal()">
              Send Early Warning (${criticalWards})
            </button>
          </div>
          <div class="heat-level-count" style="color: var(--critical);">
            ${criticalWards} <span class="text-xs font-semibold text-muted">/ ${totalWards} wards</span>
          </div>
          <div class="heat-level-desc">Extreme Heat Stress · Severe informal settlement vulnerability</div>
        </div>

        <!-- Level 2: HIGH -->
        <div class="heat-level-cell high">
          <div class="heat-level-header">
            <span class="heat-level-title" style="color: var(--high);">
              <span class="risk-pill high" style="margin-right: 4px;">HIGH</span>
            </span>
            <span class="text-xxs font-bold text-muted">Targeted Advisory</span>
          </div>
          <div class="heat-level-count" style="color: var(--high);">
            ${highWards} <span class="text-xs font-semibold text-muted">/ ${totalWards} wards</span>
          </div>
          <div class="heat-level-desc">Pre-positioning required · Outdoor labor pause 12–4 PM</div>
        </div>

        <!-- Level 3: MODERATE -->
        <div class="heat-level-cell moderate">
          <div class="heat-level-header">
            <span class="heat-level-title" style="color: var(--moderate);">
              <span class="risk-pill moderate" style="margin-right: 4px;">MODERATE</span>
            </span>
            <span class="text-xxs font-bold text-muted">Active Watch</span>
          </div>
          <div class="heat-level-count" style="color: var(--moderate);">
            ${moderateWards} <span class="text-xs font-semibold text-muted">/ ${totalWards} wards</span>
          </div>
          <div class="heat-level-desc">Hydration kiosks active · Routine surveillance</div>
        </div>

        <!-- Level 4: NORMAL / SAFE -->
        <div class="heat-level-cell safe">
          <div class="heat-level-header">
            <span class="heat-level-title" style="color: var(--safe);">
              <span class="risk-pill safe" style="margin-right: 4px;">NORMAL / SAFE</span>
            </span>
            <span class="text-xxs font-bold text-muted">Baseline Safe</span>
          </div>
          <div class="heat-level-count" style="color: var(--safe);">
            ${safeWards} <span class="text-xs font-semibold text-muted">/ ${totalWards} wards</span>
          </div>
          <div class="heat-level-desc">Normal vegetative buffer · Low thermal stress</div>
        </div>
      </div>

      <!-- 2.5 48-HOUR HEATWAVE EARLY WARNING BANNER (SIMPLE ON TOP) -->
      <div class="mb-3 p-3 rounded flex items-center justify-between flex-wrap gap-2" style="background: rgba(239, 68, 68, 0.08); border: 1px solid var(--critical); border-left: 5px solid var(--critical);">
        <div class="flex items-center gap-3">
          <span style="font-size: 22px;">⚠️</span>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs" style="color: var(--critical); letter-spacing: 0.04em;">
                48-HOUR HEATWAVE EARLY WARNING · RED ALERT FORECAST
              </span>
              <span class="risk-pill critical" style="font-size: 9px; padding: 1px 6px;">HIGH CONFIDENCE (94%)</span>
            </div>
            <div class="text-xs text-secondary mt-0.5">
              Expected Peak: <strong>43.5°C</strong> tomorrow 13:00–16:00 · <strong>${criticalWards} Wards</strong> under Extreme Thermal Stress · Preparation Window: <strong>12 Hours Remaining</strong>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_APP.navigateTo('early-warning')" style="font-weight: 700;">
            View Forecast Ramp & Early Actions →
          </button>
        </div>
      </div>

      <!-- 3. HOW SEVERE IS IT? (CORE VITAL KPI STRIP - SIMPLE ON TOP) -->
      <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 18px;">
        <div class="kpi-card critical">
          <div class="operational-question-tag">Warning Level</div>
          <div class="kpi-label">Heatwave Warning Status</div>
          <div class="kpi-value" style="color: var(--critical);">RED ALERT</div>
          <div class="kpi-delta up">
            <span class="risk-dot critical"></span>
            <span><strong>Severe Heatwave · Action Window: 12h</strong></span>
          </div>
        </div>

        <div class="kpi-card high">
          <div class="operational-question-tag">Thermal Stress</div>
          <div class="kpi-label">Peak Human Thermal Stress (UTCI)</div>
          <div class="kpi-value" style="color: var(--text-primary);">${selectedWard.utci || 46.2}<span class="kpi-unit">°C</span></div>
          <div class="text-xxs mt-1" style="color: var(--high);">
            <strong>${selectedWard.utci_category || 'EXTREME HEAT STRESS'}</strong> · WB UTCI: ${selectedWard.wb_utci || 33.9}°C
          </div>
        </div>

        <div class="kpi-card">
          <div class="operational-question-tag">Human Risk</div>
          <div class="kpi-label">Critical Wards & Population at Risk</div>
          <div class="kpi-value" style="color: var(--critical);">${criticalWards} <span class="kpi-unit">Wards</span></div>
          <div class="text-xxs text-muted mt-1 font-mono">${app.formatPop(atRiskPop)} Citizens in High-Risk Zones</div>
        </div>

        <div class="kpi-card safe">
          <div class="operational-question-tag">Logistics Readiness</div>
          <div class="kpi-label">Municipal Fleet & Early Action Ready</div>
          <div class="kpi-value" style="color: var(--safe);">${resources.tankers.available + resources.coolingHubs.available + resources.medicalTeams.available} <span class="kpi-unit">Units</span></div>
          <div class="text-xxs text-muted mt-1 font-mono">${resources.tankers.available} Tankers · ${resources.coolingHubs.available} Cooling Hubs Standby</div>
        </div>
      </div>

      <!-- 4. TECHNICAL INTELLIGENCE FLOW PIPELINE (PROBLEM -> RESULT FOR SELECTED WARD) -->
      <div class="pipeline-card">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="operational-question-tag">Technical Pipeline</span>
            <span class="font-bold text-xs" style="color: var(--text-primary);">
              Automated Decision Support Flow · Ward ${selectedWard.ward_id} (${selectedWard.name})
            </span>
          </div>
          <span class="text-xxs font-mono text-muted">Real-Time State Machine (Deterministic Engine)</span>
        </div>

        <div class="pipeline-flow-grid">
          <!-- Step 1: Data Input -->
          <div class="pipeline-node">
            <div>
              <div class="pipeline-node-header">
                <span class="pipeline-node-tag">1. DATA INPUT</span>
                <span class="text-xxs text-muted">Live Stream</span>
              </div>
              <div class="pipeline-node-title">Telemetry & Census</div>
              <div class="pipeline-node-desc">
                • Temp: <strong>${selectedWard.outdoor_temp || liveWeather.temp}°C</strong><br>
                • Humidity: <strong>${liveWeather.rh}%</strong><br>
                • UTCI: <strong>${selectedWard.utci || 46.2}°C</strong><br>
                • Slum Density: <strong>${Math.round((selectedWard.slum_density || 0.6) * 100)}%</strong>
              </div>
            </div>
            <div class="text-xxs font-mono text-muted mt-2">Station 42807 + Census 2011</div>
          </div>

          <!-- Step 2: Intelligence -->
          <div class="pipeline-node">
            <div>
              <div class="pipeline-node-header">
                <span class="pipeline-node-tag">2. INTELLIGENCE</span>
                <span class="text-xxs text-muted">Algorithms</span>
              </div>
              <div class="pipeline-node-title">Multi-Criteria Engine</div>
              <div class="pipeline-node-desc">
                • Thermal Hazard (35%)<br>
                • Tin/Asbestos Roofs (25%)<br>
                • Elderly/Labor Ratio (20%)<br>
                • Tree Canopy Deficit (20%)
              </div>
            </div>
            <div class="text-xxs font-mono text-muted mt-2">HHVI + Stull Psychrometric</div>
          </div>

          <!-- Step 3: Output Risk -->
          <div class="pipeline-node ${selectedWard.risk_level === 'CRITICAL' ? 'highlight-critical' : ''}">
            <div>
              <div class="pipeline-node-header">
                <span class="pipeline-node-tag">3. RISK OUTPUT</span>
                <span class="risk-pill ${selectedWard.risk_level ? selectedWard.risk_level.toLowerCase() : 'critical'}">${selectedWard.risk_level || 'CRITICAL'}</span>
              </div>
              <div class="pipeline-node-title">Composite Risk Score</div>
              <div class="pipeline-node-desc">
                Score: <strong>${selectedWard.hhvi ? selectedWard.hhvi.mitigated_hhvi : 88}/100</strong><br>
                Strain: <strong>${selectedWard.utci_category || 'EXTREME HEAT STRESS'}</strong><br>
                Effective Temp: <strong>${selectedWard.effective_temp || 46.2}°C</strong>
              </div>
            </div>
            <div class="text-xxs font-mono text-muted mt-2">Threshold: Critical &gt;80</div>
          </div>

          <!-- Step 4: Recommendation -->
          <div class="pipeline-node">
            <div>
              <div class="pipeline-node-header">
                <span class="pipeline-node-tag">4. RECOMMENDATION</span>
                <span class="text-xxs text-muted">Decision Support</span>
              </div>
              <div class="pipeline-node-title">Mandated Response</div>
              <div class="pipeline-node-desc">
                • Deploy 2x 10KL Water Tankers<br>
                • Activate AC Cooling Hub<br>
                • Mobilize ASHA ORS Squads<br>
                • Enforce 12–4 PM Labor Pause
              </div>
            </div>
            <div class="text-xxs font-mono text-muted mt-2">NDMA Heat Action Protocol</div>
          </div>

          <!-- Step 5: Action Confirmation -->
          <div class="pipeline-node" style="border-color: var(--primary);">
            <div>
              <div class="pipeline-node-header">
                <span class="pipeline-node-tag">5. DISPATCH ACTION</span>
                <span class="text-xxs font-bold" style="color:var(--primary);">Officer Triage</span>
              </div>
              <div class="pipeline-node-title">Command Execution</div>
              <div class="pipeline-node-desc">
                Unit TK-08 Assigned.<br>
                ETA to Burrabazar: <strong>12 min</strong>.<br>
                Status: <strong>EN ROUTE</strong>
              </div>
            </div>
            <button class="btn btn-primary btn-xs mt-2" onclick="HEATSHIELD_APP.dispatchResource(${selectedWard.ward_id}, 'Water Tanker')">
              Execute Dispatch Now
            </button>
          </div>
        </div>
      </div>

      <!-- 5. WHERE IS THE HEAT? (GIS MAP) & WHAT NEEDS ACTION? (RESPONSE QUEUE) -->
      <div class="grid-60-40 mb-4" id="overviewMapSection">
        <!-- MAP PANEL -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="operational-question-tag">Spatial Heat Intelligence</span>
              <span class="card-title">Where is the Heat? · 144-Ward UTCI & Heat Risk Choropleth</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_APP.navigateTo('heatmap')">
                Full GIS Tactical View →
              </button>
            </div>
          </div>
          <div class="card-body" style="padding: 0; position: relative;">
            <div id="overviewMap" class="map-container map-container-overview"></div>
          </div>
          <div class="card-footer flex items-center justify-between flex-wrap gap-2">
            <div class="risk-legend">
              <span class="legend-item"><span class="legend-dot" style="background: var(--critical);"></span> [CRITICAL] Severe (≥80)</span>
              <span class="legend-item"><span class="legend-dot" style="background: var(--high);"></span> [HIGH] Alert (65–79)</span>
              <span class="legend-item"><span class="legend-dot" style="background: var(--moderate);"></span> [MODERATE] Watch (50–64)</span>
              <span class="legend-item"><span class="legend-dot" style="background: var(--safe);"></span> [SAFE] Normal (&lt;50)</span>
            </div>
            <span class="text-xxs text-muted font-bold">144 Wards Active · Click any polygon to focus intelligence</span>
          </div>
        </div>

        <!-- PRIORITY RESPONSE QUEUE -->
        <div class="card flex flex-col">
          <div class="card-header flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="operational-question-tag">Response Required</span>
              <span class="card-title">Immediate Action Triage Queue</span>
            </div>
            <a href="javascript:void(0)" class="text-xs font-bold" style="color: var(--primary); text-decoration: none;" onclick="HEATSHIELD_APP.navigateTo('response')">View All Pending (${s.responseQueue.length}) →</a>
          </div>
          <div class="card-body" style="padding: 0; flex: 1; overflow-y: auto;">
            ${topWards.map((w, idx) => {
              const riskCls = (w.risk_level || 'safe').toLowerCase();
              const score = w.hhvi ? w.hhvi.mitigated_hhvi : 75;
              const pop = w.population ? w.population.toLocaleString('en-IN') : 'N/A';
              const borough = w.borough ? `Borough ${w.borough}` : 'Central';
              return `
                <div 
                  style="padding: 10px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.15s ease;"
                  class="hover:bg-muted"
                  onclick="HEATSHIELD_APP.selectWard(${w.ward_id}); HEATSHIELD_APP.navigateTo('ward-intel');"
                >
                  <div class="flex items-center gap-3 min-w-0" style="flex: 1;">
                    <div style="font-weight: 800; font-size: 11px; color: var(--text-tertiary); width: 16px;">#${idx + 1}</div>
                    <span class="risk-pill ${riskCls}">${w.risk_level}</span>
                    <div class="min-w-0">
                      <div class="font-bold text-xs truncate" style="color: var(--text-primary);">
                        Ward ${w.ward_id} – ${w.name}
                      </div>
                      <div class="text-xxs text-muted mt-0.5">
                        UTCI ${w.utci || 42}°C · ${borough} · Pop: ${pop}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-xs" style="color: var(--text-primary);">${score}/100</span>
                    <button class="btn btn-secondary btn-xs" style="padding: 3px 8px; font-size: 10.5px;" onclick="event.stopPropagation(); HEATSHIELD_APP.dispatchResource(${w.ward_id}, 'Water Tanker');">
                      Dispatch
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
          <div class="card-footer flex items-center justify-between">
            <span class="text-xxs text-muted font-bold">Ranked by Multi-Criteria Vulnerability & Heat Index</span>
            <button class="btn btn-primary btn-xs" onclick="HEATSHIELD_APP.navigateTo('response')">Manage Full Queue →</button>
          </div>
        </div>
      </div>

      <!-- 6. WHAT IS THE IMPACT? (HEALTH / HOSPITAL MORTALITY & SURGE MODELING) -->
      <div class="card mb-4" id="overviewImpactSection">
        <div class="card-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="operational-question-tag">Epidemiological Impact</span>
            <span class="card-title">Healthcare Surge & Lagged Mortality Burden (Adaptive DLNM Model)</span>
          </div>
          <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_APP.navigateTo('hospital-impact')">
            Deep Hospital Impact (DLNM) →
          </button>
        </div>
        <div class="card-body" style="padding: 16px 20px;">
          <div class="grid-60-40" style="gap: 20px; align-items: center;">
            <!-- Large Comparative Hospital Impact Chart -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold" style="color:var(--text-primary);">7-Day Projected Emergency Admissions vs Mitigated Intervention</span>
                <div class="flex items-center gap-3 text-xxs font-bold">
                  <span style="color:var(--critical);">■ Baseline Surge (No Action)</span>
                  <span style="color:var(--safe);">■ Post-Intervention Projection</span>
                </div>
              </div>
              <div style="height: 180px; position: relative;">
                <canvas id="overviewHospitalImpactChart"></canvas>
              </div>
            </div>

            <!-- Explanatory Impact Narrative -->
            <div class="flex flex-col gap-2">
              <div class="p-3 rounded" style="background:var(--bg-muted); border-left:3px solid var(--critical);">
                <div class="font-bold text-xs" style="color:var(--critical);">Estimated Health Burden Without Action</div>
                <p class="text-xs text-secondary mt-1" style="line-height:1.5;">
                  Due to prolonged exposure to UTCI &gt;42°C, hospitalizations for heat exhaustion, dehydration, and cardiovascular strain peak at <strong>Days 2 to 4</strong> post-exposure, projecting an excess <strong>+42 admissions/day</strong> across North Kolkata UPHCs.
                </p>
              </div>
              <div class="p-3 rounded" style="background:var(--bg-muted); border-left:3px solid var(--safe);">
                <div class="font-bold text-xs" style="color:var(--safe);">Projected Protective Effect of Intervention</div>
                <p class="text-xs text-secondary mt-1" style="line-height:1.5;">
                  Deploying water misting tankers, activating AC pop-up cooling shelters, and enforcing afternoon outdoor labor pauses reduces peak hospital surge by an estimated <strong>38%</strong>, averting severe inpatient capacity bottlenecks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 7. WHAT RESOURCES ARE AVAILABLE? (OPERATIONAL FLEET ROSTER) -->
      <div class="card mb-2" id="overviewResourcesSection">
        <div class="card-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="operational-question-tag">Fleet Logistics</span>
            <span class="card-title">What Resources Are Available? · Municipal Fleet Readiness</span>
          </div>
          <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_APP.navigateTo('resources')">
            Manage Fleet Roster →
          </button>
        </div>
        <div class="card-body" style="padding: 14px 18px;">
          <div class="grid-4" style="gap: 14px;">
            <!-- Tankers -->
            <div class="p-3" style="background: var(--bg-muted); border-radius: 6px; border: 1px solid var(--border);">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs">Water Misting Tankers</span>
                <span class="risk-pill safe">AVAILABLE</span>
              </div>
              <div class="flex items-baseline gap-1 my-1">
                <span class="font-extrabold text-lg" style="color: var(--safe);">${resources.tankers.available}</span>
                <span class="text-xs text-muted">ready / ${resources.tankers.total} total</span>
              </div>
              <div class="progress-bar mt-1">
                <div class="progress-fill green" style="width: ${(resources.tankers.available / resources.tankers.total) * 100}%;"></div>
              </div>
            </div>

            <!-- Cooling Hubs -->
            <div class="p-3" style="background: var(--bg-muted); border-radius: 6px; border: 1px solid var(--border);">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs">Pop-Up Cooling Centers</span>
                <span class="risk-pill safe">READY</span>
              </div>
              <div class="flex items-baseline gap-1 my-1">
                <span class="font-extrabold text-lg" style="color: var(--primary);">${resources.coolingHubs.available}</span>
                <span class="text-xs text-muted">standby / ${resources.coolingHubs.total} total</span>
              </div>
              <div class="progress-bar mt-1">
                <div class="progress-fill blue" style="width: ${(resources.coolingHubs.available / resources.coolingHubs.total) * 100}%;"></div>
              </div>
            </div>

            <!-- Medical Teams -->
            <div class="p-3" style="background: var(--bg-muted); border-radius: 6px; border: 1px solid var(--border);">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs">Medical Triage Squads</span>
                <span class="risk-pill high">DEPLOYED</span>
              </div>
              <div class="flex items-baseline gap-1 my-1">
                <span class="font-extrabold text-lg" style="color: var(--high);">${resources.medicalTeams.available}</span>
                <span class="text-xs text-muted">ready / ${resources.medicalTeams.total} total</span>
              </div>
              <div class="progress-bar mt-1">
                <div class="progress-fill orange" style="width: ${(resources.medicalTeams.available / resources.medicalTeams.total) * 100}%;"></div>
              </div>
            </div>

            <!-- Field Officers -->
            <div class="p-3" style="background: var(--bg-muted); border-radius: 6px; border: 1px solid var(--border);">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs">Field Task Officers</span>
                <span class="risk-pill safe">ON PATROL</span>
              </div>
              <div class="flex items-baseline gap-1 my-1">
                <span class="font-extrabold text-lg" style="color: var(--text-primary);">${resources.officers.available}</span>
                <span class="text-xs text-muted">ready / ${resources.officers.total} total</span>
              </div>
              <div class="progress-bar mt-1">
                <div class="progress-fill blue" style="width: ${(resources.officers.available / resources.officers.total) * 100}%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- WORKFLOW PROGRESSION BOTTOM NAVIGATION RIBBON -->
      <div id="overviewBottomNav"></div>
    `;

    // Initialize Map with 144-ward polygon choropleth & labels
    setTimeout(() => {
      if (window.HEATSHIELD_MAP) {
        window.HEATSHIELD_MAP.init("overviewMap", { zoom: 12 });
      }
    }, 60);

    // Initialize Hospital Impact Curve Chart
    setTimeout(() => {
      this._renderHospitalImpactChart();
    }, 100);

    // Render shared workflow progression bottom navigation
    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.renderPipelineBottomNav === "function") {
      window.HEATSHIELD_APP.renderPipelineBottomNav(0, "overviewBottomNav");
    }
  },

  _renderHospitalImpactChart() {
    const canvas = document.getElementById("overviewHospitalImpactChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (this._impactChart) {
      this._impactChart.destroy();
      this._impactChart = null;
    }

    const state = window.HEATSHIELD_STATE || {};
    const selectedWard = (state.evaluatedWards || []).find(w => w.ward_id === state.selectedWardId) || (state.evaluatedWards || [])[0] || {};
    const isDark = (state.theme || "dark") === "dark";
    const tickColor = isDark ? "#94A3B8" : "#475569";
    const gridColor = isDark ? "rgba(148, 163, 184, 0.14)" : "rgba(71, 85, 105, 0.14)";

    let labels = ["Day 0 (Peak Sun)", "Day +1", "Day +2 (Lag Peak)", "Day +3", "Day +4", "Day +5", "Day +6"];
    let baselineSurge = [12, 28, 45, 38, 26, 18, 14];
    let mitigatedSurge = [10, 18, 27, 22, 16, 12, 9];

    // Dynamically compute Distributed Lag Non-Linear Curve from scientific engine
    if (window.HEATSHIELD_ADAPTIVE_DLNM && typeof window.HEATSHIELD_ADAPTIVE_DLNM.computeLagCurve === "function") {
      try {
        const curve = window.HEATSHIELD_ADAPTIVE_DLNM.computeLagCurve(selectedWard.effective_temp || 42.0, 1.0, 1.0);
        if (curve && Array.isArray(curve.lags) && curve.lags.length >= 7) {
          const validLags = curve.lags.slice(0, 7);
          labels = validLags.map((l, idx) => idx === 0 ? "Day 0 (Peak Sun)" : (idx === curve.peak_lag_day ? `Day +${l.lag} (Lag Peak)` : `Day +${l.lag}`));
          const pop = selectedWard.population || 30000;
          const scale = pop / 35000;
          baselineSurge = validLags.map(l => Math.max(2, Math.round((l.relative_risk - 1.0) * 80 * scale + 8)));
          mitigatedSurge = baselineSurge.map(b => Math.max(1, Math.round(b * 0.62)));
        }
      } catch (err) {
        console.warn("HEATSHIELD: DLNM curve calculation fallback:", err);
      }
    }

    const ctx = canvas.getContext("2d");
    this._impactChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Baseline Surge (No Mitigation)",
            data: baselineSurge,
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: 3
          },
          {
            label: "Post-Intervention Projected Burden",
            data: mitigatedSurge,
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            borderWidth: 2,
            borderDash: [4, 4],
            fill: true,
            tension: 0.35,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: +${context.raw} admissions/day`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: tickColor }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              font: { size: 10 },
              color: tickColor,
              callback: (v) => `+${v}`
            }
          }
        }
      }
    });
  }
};

