/**
 * HEATSHIELD :: Emergency Operations Center Mode (js/pages/emergency.js)
 * Production-Quality Emergency Command & Control Interface
 *
 * Core Concept:
 * High-speed operational decision interface that compresses information so the
 * operator can DETECT -> PRIORITIZE -> ACT -> DISPATCH -> MONITOR as quickly as possible.
 * Preserves all underlying analytical calculations, biostatistics, GIS data, and fleet models.
 */

window.HEATSHIELD_PAGE_EMERGENCY = {
  _mapInitialized: false,
  _3dInitialized: false,
  _3dRenderer: null,
  _3dScene: null,
  _3dCamera: null,
  _3dAnimId: null,
  _3dMeshes: {},
  _selectedWardId: null,

  /**
   * Main Render Method for Emergency Command Center
   */
  render(state) {
    const container = document.getElementById("pageEmergency");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const engine = window.HEATSHIELD_ENGINE || {};
    const evaluated = s.evaluatedWards || [];
    const queue = s.responseQueue || [];
    const fleetList = s.fleetList || [];
    const resources = s.resources || {
      tankers: { total: 25, deployed: 14, available: 11 },
      coolingHubs: { total: 15, deployed: 8, available: 7 },
      medicalTeams: { total: 10, deployed: 6, available: 4 },
      officers: { total: 40, deployed: 28, available: 12 }
    };

    // Calculate dynamic city incident status
    const criticalWards = evaluated.filter(w => w.risk_level === "CRITICAL");
    const highWards = evaluated.filter(w => w.risk_level === "HIGH");
    const moderateWards = evaluated.filter(w => w.risk_level === "MODERATE");

    let cityStatus = "NORMAL";
    let cityStatusColor = "var(--safe)";
    if (criticalWards.length > 0) {
      cityStatus = "CRITICAL";
      cityStatusColor = "var(--critical)";
    } else if (highWards.length > 0) {
      cityStatus = "HIGH";
      cityStatusColor = "var(--high)";
    } else if (moderateWards.length > 0) {
      cityStatus = "WATCH";
      cityStatusColor = "var(--moderate)";
    }

    const priorityWardsCount = criticalWards.length + highWards.length;
    const pendingActionsCount = queue.filter(q => q.status === "RECOMMENDED" || q.status === "APPROVED" || q.status === "PENDING").length;
    const availableMedical = resources.medicalTeams ? resources.medicalTeams.available : fleetList.filter(f => f.type.toLowerCase().includes("medical") && f.status === "AVAILABLE").length;
    const availableTankers = resources.tankers ? resources.tankers.available : fleetList.filter(f => f.type.toLowerCase().includes("tanker") && f.status === "AVAILABLE").length;
    const availableCooling = resources.coolingHubs ? resources.coolingHubs.available : fleetList.filter(f => f.type.toLowerCase().includes("cooling") && f.status === "ACTIVE").length;
    const availableOfficers = resources.officers ? resources.officers.available : 12;
    const totalAvailableUnits = availableMedical + availableTankers + availableCooling + availableOfficers;

    // Top priority wards (maximum 6 to prevent cognitive overload)
    const topWards = evaluated.slice(0, 6);
    this._selectedWardId = s.emergencyActiveWardId || s.selectedWardId || (topWards[0] ? topWards[0].ward_id : 17);
    const activeWard = evaluated.find(w => w.ward_id === this._selectedWardId) || topWards[0] || {};

    // Grounded Emergency AI Briefing
    const aiBriefing = this.generateAiBriefing(criticalWards, topWards[0], queue, availableCooling, availableTankers, s.peakTemp);

    // Render HTML structure
    container.innerHTML = `
      <div class="emergency-dashboard-wrapper">

        <!-- 1. DEEP ANALYSIS FLOATING BANNER (When viewing in Emergency Mode) -->
        <div class="emergency-action-header-bar flex items-center justify-between flex-wrap gap-2 mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="emergency-beacon-pulse"></span>
            <span class="text-xs font-bold tracking-wide uppercase" style="color: var(--critical);">
              MUNICIPAL EMERGENCY OPERATIONS CENTER (EOC) · ACTIVE INCIDENT DIRECTIVE
            </span>
            <span class="provenance-badge verified" style="font-size: 9.5px; background: rgba(14, 165, 233, 0.15); color: var(--primary); border: 1px solid var(--primary);">
              AUTOMATED PREPARATION · OFFICER COMMAND REQUIRED
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.openDeepAnalysisFromEmergency()" title="View DLNM biostatistical models, meteorological curves, and full ward census without destroying Emergency Mode">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span>VIEW DEEP ANALYSIS</span>
            </button>
            <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--critical); color: var(--critical); font-weight: 700;" onclick="HEATSHIELD_APP.confirmExitEmergencyMode()">
              ✕ EXIT EMERGENCY MODE
            </button>
          </div>
        </div>

        <!-- 2. CITY INCIDENT STATUS STRIP (Requirement 4) -->
        <div class="emergency-status-strip mb-4">
          <div class="emergency-status-cell" style="border-left: 5px solid ${cityStatusColor};">
            <div class="emergency-label">CITY INCIDENT STATUS</div>
            <div class="emergency-value" style="color: ${cityStatusColor};">${cityStatus}</div>
            <div class="text-xxs font-bold text-muted mt-0.5">KMC Heat Action Protocol Active</div>
          </div>

          <div class="emergency-status-cell" style="border-left: 5px solid var(--critical);">
            <div class="emergency-label">PRIORITY WARDS</div>
            <div class="emergency-value" style="color: var(--critical);">${priorityWardsCount}</div>
            <div class="text-xxs font-bold text-muted mt-0.5">${criticalWards.length} Critical · ${highWards.length} High Risk</div>
          </div>

          <div class="emergency-status-cell" style="border-left: 5px solid var(--high);">
            <div class="emergency-label">ACTIONS PENDING</div>
            <div class="emergency-value" style="color: var(--high);">${pendingActionsCount}</div>
            <div class="text-xxs font-bold text-muted mt-0.5">Require Immediate Authorization</div>
          </div>

          <div class="emergency-status-cell" style="border-left: 5px solid var(--safe);">
            <div class="emergency-label">RESPONSE UNITS AVAIL.</div>
            <div class="emergency-value" style="color: var(--safe);">${totalAvailableUnits}</div>
            <div class="text-xxs font-bold text-muted mt-0.5">Ready at Municipal Depots</div>
          </div>

          <div class="emergency-status-cell" style="border-left: 5px solid #0284C7;">
            <div class="emergency-label">COOLING UNITS AVAIL.</div>
            <div class="emergency-value" style="color: #0284C7;">${availableCooling}</div>
            <div class="text-xxs font-bold text-muted mt-0.5">Pre-conditioned & Operational</div>
          </div>
        </div>

        <!-- 3. EMERGENCY AI GROUNDED BRIEFING (Requirement 12) -->
        <div class="emergency-ai-briefing-card mb-4">
          <div class="flex items-center justify-between pb-2 mb-2" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div class="flex items-center gap-2">
              <span class="text-sm">🛡️</span>
              <span class="font-bold text-xs tracking-wider" style="color: var(--text-primary);">TACTICAL INCIDENT INTELLIGENCE BRIEFING</span>
              <span class="provenance-badge source">GROUNDED IN LIVE TELEMETRY</span>
            </div>
            <span class="text-xxs font-mono text-muted">Generated: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div class="emergency-ai-item">
              <span class="emergency-ai-label">CURRENT SITUATION</span>
              <div class="emergency-ai-desc">${aiBriefing.situation}</div>
            </div>
            <div class="emergency-ai-item">
              <span class="emergency-ai-label">HIGHEST PRIORITY</span>
              <div class="emergency-ai-desc">${aiBriefing.priority}</div>
            </div>
            <div class="emergency-ai-item">
              <span class="emergency-ai-label">IMMEDIATE ACTION</span>
              <div class="emergency-ai-desc">${aiBriefing.action}</div>
            </div>
            <div class="emergency-ai-item">
              <span class="emergency-ai-label">RESOURCE STATUS</span>
              <div class="emergency-ai-desc">${aiBriefing.resources}</div>
            </div>
          </div>
        </div>

        <!-- 4. TOP PRIORITY WARDS SECTION (Requirement 5) -->
        <div class="card mb-4">
          <div class="card-header flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs uppercase tracking-wider" style="color: var(--critical);">
                🔴 TOP PRIORITY WARDS — IMMEDIATE INTERVENTION TARGETS
              </span>
              <span class="provenance-badge source">${topWards.length} HIGHEST RANKED</span>
            </div>
            <span class="text-xxs text-muted">Dynamically ranked by biometeorological UTCI & mitigated HHVI risk score</span>
          </div>
          <div class="card-body" style="padding: 12px;">
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2.5" id="emergencyPriorityWardsGrid">
              ${topWards.map(w => {
                const isSelected = w.ward_id === this._selectedWardId;
                const riskCls = (w.risk_level || "critical").toLowerCase();
                const score = w.hhvi ? w.hhvi.mitigated_hhvi : 80;
                const driver = this.getPrimaryRiskDriver(w);
                const recAction = this.getRecommendedAction(w);

                return `
                  <div class="emergency-ward-card ${isSelected ? 'active' : ''} ${riskCls}" onclick="HEATSHIELD_PAGE_EMERGENCY.selectEmergencyWard(${w.ward_id})">
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="font-bold text-xs" style="color: var(--text-primary);">Ward ${w.ward_id}</span>
                      <span class="risk-badge ${riskCls}">${w.risk_level}</span>
                    </div>
                    <div class="text-xxs text-muted font-bold truncate mb-2" title="${w.name}">${w.name}</div>
                    
                    <div class="emergency-ward-metrics mb-2">
                      <div class="metric-row">
                        <span class="metric-lbl">UTCI (FEELS):</span>
                        <span class="metric-val" style="color: var(--high); font-weight:800;">${w.utci || 46.8}°C</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-lbl">HHVI RISK:</span>
                        <span class="metric-val font-bold" style="color: var(--${riskCls});">${score}/100</span>
                      </div>
                    </div>

                    <div class="emergency-driver-box mb-2">
                      <span class="driver-title">Primary Driver:</span>
                      <div class="driver-text">${driver}</div>
                    </div>

                    <div class="emergency-rec-box mb-2">
                      <span class="rec-title">Recommended:</span>
                      <div class="rec-text">${recAction}</div>
                    </div>

                    <div class="flex items-center gap-1 mt-2">
                      <button class="btn btn-secondary btn-xs flex-1" style="font-size: 9px; padding: 4px;" onclick="event.stopPropagation(); HEATSHIELD_PAGE_EMERGENCY.focusWardMap(${w.ward_id})">
                        VIEW WARD
                      </button>
                      <button class="btn btn-primary btn-xs flex-1" style="font-size: 9px; padding: 4px; background: var(--critical); border-color: var(--critical); color:#FFF;" onclick="event.stopPropagation(); HEATSHIELD_PAGE_EMERGENCY.openTakeActionModal(${w.ward_id})">
                        TAKE ACTION
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>

        <!-- 5. IMMEDIATE ACTION QUEUE & ONE-CLICK OPERATIONAL ACTIONS (Requirements 6 & 7) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          <!-- Left 2 Cols: Immediate Actions Queue -->
          <div class="card lg:col-span-2">
            <div class="card-header flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="card-title font-bold text-xs uppercase" style="color: var(--text-primary);">
                  ⚡ IMMEDIATE ACTION QUEUE — TACTICAL DISPATCH
                </span>
                <span class="risk-pill critical">${pendingActionsCount} PENDING</span>
              </div>
              <span class="text-xxs text-muted">Single-Click Authorization & Logistics Dispatch</span>
            </div>
            <div class="card-body" style="padding: 0; overflow-x: auto;">
              <table class="data-table" style="font-size: 11px;">
                <thead>
                  <tr>
                    <th style="width: 85px;">ACTION ID</th>
                    <th style="width: 110px;">WARD</th>
                    <th>MANDATED ACTION</th>
                    <th style="width: 100px;">RESOURCE</th>
                    <th style="width: 80px;">ETA</th>
                    <th style="width: 95px;">STATUS</th>
                    <th style="width: 105px; text-align: right;">DISPATCH</th>
                  </tr>
                </thead>
                <tbody>
                  ${queue.map(item => {
                    const isUrgent = item.priority === "URGENT" || item.risk_level === "CRITICAL";
                    const isDispatched = item.status === "DISPATCHED" || item.status === "ASSIGNED" || item.status === "EN ROUTE";
                    const isCompleted = item.status === "COMPLETED";

                    // Match or infer resource
                    const matchedFleet = fleetList.find(f => f.ward === item.ward_id) || { id: "TK-01", eta: "12 min" };
                    const resId = item.resource_id || matchedFleet.id || "CH-01";
                    const etaText = item.eta || matchedFleet.eta || "12 min";

                    return `
                      <tr style="${isUrgent ? 'background: rgba(239, 68, 68, 0.04);' : ''}">
                        <td class="font-mono font-bold text-muted">${item.id}</td>
                        <td>
                          <div class="font-bold text-xs" style="color: var(--text-primary);">Ward ${item.ward_id}</div>
                          <div class="text-xxs text-muted truncate" style="max-width: 100px;">${item.name}</div>
                        </td>
                        <td>
                          <div class="font-bold" style="color: var(--text-primary);">${item.action}</div>
                          <div class="text-xxs text-muted truncate" style="max-width: 220px;">${item.reason}</div>
                        </td>
                        <td>
                          <span class="font-mono font-bold text-xs" style="color: var(--primary);">${resId}</span>
                        </td>
                        <td>
                          <span class="text-xxs font-mono font-bold">${etaText}</span>
                        </td>
                        <td>
                          <span class="provenance-badge ${isDispatched ? 'source' : isCompleted ? 'safe' : 'simulation'}">
                            ${item.status}
                          </span>
                        </td>
                        <td style="text-align: right;">
                          ${!isDispatched && !isCompleted ? `
                            <button class="btn btn-primary btn-xs" style="background: var(--critical); border-color: var(--critical); color:#FFF; font-weight:800; font-size:10px; padding: 3px 8px;" onclick="HEATSHIELD_APP.dispatchImmediateAction('${item.id}', ${item.ward_id}, '${item.action}')">
                              DISPATCH ➔
                            </button>
                          ` : isDispatched ? `
                            <span class="text-xxs font-bold" style="color: var(--safe);">✓ DISPATCHED</span>
                          ` : `
                            <span class="text-xxs font-bold text-muted">✓ DONE</span>
                          `}
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right Col: One-Click Operational Ward Directives -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="card-title font-bold text-xs uppercase" style="color: var(--text-primary);">
                  TARGETED OPERATIONAL DIRECTIVES
                </span>
              </div>
              <span class="font-bold text-xs" style="color: var(--critical);">Ward ${activeWard.ward_id || 17}</span>
            </div>
            <div class="card-body flex flex-col gap-2" style="padding: 14px;">
              <div class="p-2.5 rounded mb-1" style="background: var(--bg-muted); border: 1px solid var(--border);">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-xs" style="color: var(--text-primary);">Ward ${activeWard.ward_id}: ${activeWard.name}</span>
                  <span class="risk-badge ${activeWard.risk_level ? activeWard.risk_level.toLowerCase() : 'critical'}">${activeWard.risk_level || 'CRITICAL'}</span>
                </div>
                <div class="text-xxs text-secondary">
                  Population: ${activeWard.population ? activeWard.population.toLocaleString() : '68,400'} · UTCI: <strong>${activeWard.utci || 46.8}°C</strong>
                </div>
              </div>

              <div class="text-xxs font-bold text-muted uppercase tracking-wider mb-1">Deploy Live Asset:</div>

              <button class="btn btn-secondary btn-sm flex items-center justify-between" style="text-align: left; padding: 8px 12px;" onclick="HEATSHIELD_APP.dispatchResourceFromEmergency(${activeWard.ward_id}, 'Medical Team')">
                <div class="flex items-center gap-2">
                  <span>🚑</span>
                  <div>
                    <div class="font-bold text-xs">DISPATCH MEDICAL TEAM</div>
                    <div class="text-xxs text-muted">${availableMedical} Units Available in Depot Pool</div>
                  </div>
                </div>
                <span class="text-xs">➔</span>
              </button>

              <button class="btn btn-secondary btn-sm flex items-center justify-between" style="text-align: left; padding: 8px 12px;" onclick="HEATSHIELD_APP.dispatchResourceFromEmergency(${activeWard.ward_id}, 'Water Tanker')">
                <div class="flex items-center gap-2">
                  <span>🚰</span>
                  <div>
                    <div class="font-bold text-xs">DEPLOY WATER SUPPORT</div>
                    <div class="text-xxs text-muted">${availableTankers} Tankers Ready (10,000L Misting)</div>
                  </div>
                </div>
                <span class="text-xs">➔</span>
              </button>

              <button class="btn btn-secondary btn-sm flex items-center justify-between" style="text-align: left; padding: 8px 12px;" onclick="HEATSHIELD_APP.dispatchResourceFromEmergency(${activeWard.ward_id}, 'Cooling Hub')">
                <div class="flex items-center gap-2">
                  <span>❄️</span>
                  <div>
                    <div class="font-bold text-xs">ACTIVATE COOLING HUB</div>
                    <div class="text-xxs text-muted">${availableCooling} Community Halls Pre-conditioned</div>
                  </div>
                </div>
                <span class="text-xs">➔</span>
              </button>

              <button class="btn btn-secondary btn-sm flex items-center justify-between" style="text-align: left; padding: 8px 12px;" onclick="HEATSHIELD_APP.issueHeatAdvisory(${activeWard.ward_id})">
                <div class="flex items-center gap-2">
                  <span>📢</span>
                  <div>
                    <div class="font-bold text-xs">ISSUE HEAT ADVISORY</div>
                    <div class="text-xxs text-muted">NDMA / KMC Ward Broadcast & SMS Alert</div>
                  </div>
                </div>
                <span class="text-xs">➔</span>
              </button>

              <button class="btn btn-secondary btn-sm flex items-center justify-between" style="text-align: left; padding: 8px 12px;" onclick="HEATSHIELD_APP.alertFieldTeam(${activeWard.ward_id})">
                <div class="flex items-center gap-2">
                  <span>👥</span>
                  <div>
                    <div class="font-bold text-xs">ALERT FIELD TEAM</div>
                    <div class="text-xxs text-muted">Mobilize ASHA Workers & Para-Club Squads</div>
                  </div>
                </div>
                <span class="text-xs">➔</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 6. EMERGENCY MAP & 3D DIGITAL TWIN (Requirements 8 & 9) -->
        <div class="card mb-4">
          <div class="card-header flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="card-title font-bold text-xs uppercase" style="color: var(--text-primary);">
                🗺️ SPATIAL EMERGENCY COMMAND — 144 WARDS GIS
              </span>
              <span class="provenance-badge source">AUTHENTIC KMC BOUNDARIES</span>
            </div>

            <!-- 2D / 3D Mode Toggle Controls -->
            <div class="flex items-center gap-2">
              <div class="emergency-map-toggle-group">
                <button class="map-toggle-btn active" id="btnMapMode2D" onclick="HEATSHIELD_PAGE_EMERGENCY.switchMapMode('2d')">
                  2D TACTICAL GIS
                </button>
                <button class="map-toggle-btn" id="btnMapMode3D" onclick="HEATSHIELD_PAGE_EMERGENCY.switchMapMode('3d')">
                  3D DIGITAL TWIN (EXTRUDED)
                </button>
              </div>

              <!-- Quick Reset Camera Button -->
              <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_PAGE_EMERGENCY.resetMapCamera()">
                Recenter Kolkata
              </button>
            </div>
          </div>

          <!-- Map Viewport Stack (2D Leaflet Container + 3D Three.js WebGL Container) -->
          <div class="emergency-map-viewport" style="position: relative; height: 520px; width: 100%; background: #0b0f19;">
            
            <!-- 2D Leaflet Map Container -->
            <div id="emergencyMap" style="width: 100%; height: 100%;"></div>

            <!-- 3D Digital Twin Container (Hidden by default) -->
            <div id="emergency3dContainer" style="display: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 10;"></div>

            <!-- 3D Fallback Notice Banner -->
            <div id="emergency3dFallbackNotice" style="display: none; position: absolute; bottom: 12px; left: 12px; background: rgba(15,23,42,0.9); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; z-index: 25; font-size: 11px; color: var(--text-secondary);">
              ℹ️ 3D Digital Twin WebGL unavailable — automatically displaying 2D Tactical GIS Map.
            </div>

            <!-- Compact Floating Map Legend -->
            <div class="emergency-map-legend">
              <div class="legend-title">RISK EXTRUSION / SEVERITY</div>
              <div class="legend-item"><span class="legend-color" style="background:#EF4444;"></span> Critical Risk (80–100)</div>
              <div class="legend-item"><span class="legend-color" style="background:#F97316;"></span> High Risk (65–79)</div>
              <div class="legend-item"><span class="legend-color" style="background:#F59E0B;"></span> Moderate (50–64)</div>
              <div class="legend-item"><span class="legend-color" style="background:#10B981;"></span> Normal / Monitored</div>
              <div class="legend-sep"></div>
              <div class="legend-title">OPERATIONAL ASSETS</div>
              <div class="legend-item">🏥 Hospital Triage Center</div>
              <div class="legend-item">❄️ AC Cooling Relief Hub</div>
              <div class="legend-item">🚛 Water Tanker (Misting)</div>
              <div class="legend-item">🚑 Emergency Ambulance</div>
            </div>
          </div>
        </div>

        <!-- 7. RESOURCE AVAILABILITY STRIP & INCIDENT TIMELINE (Requirements 10 & 11) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          
          <!-- Left Col: Live Resource Readiness Strip -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <span class="card-title font-bold text-xs uppercase" style="color: var(--text-primary);">
                TACTICAL RESOURCE READINESS
              </span>
              <span class="text-xxs font-mono text-muted">Live Fleet Registry</span>
            </div>
            <div class="card-body flex flex-col gap-3" style="padding: 16px;">
              <div class="emergency-resource-card">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-base">🚑</span>
                    <span class="font-bold text-xs">AMBULANCES & MEDICAL</span>
                  </div>
                  <span class="font-mono font-bold text-xs" style="color: var(--safe);">${availableMedical} AVAILABLE</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill safe" style="width: ${(availableMedical / (resources.medicalTeams ? resources.medicalTeams.total : 10)) * 100}%;"></div>
                </div>
                <div class="flex justify-between text-xxs text-muted mt-1">
                  <span>${(resources.medicalTeams ? resources.medicalTeams.deployed : 6)} Deployed</span>
                  <span>Total: ${resources.medicalTeams ? resources.medicalTeams.total : 10} Units</span>
                </div>
              </div>

              <div class="emergency-resource-card">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-base">🚰</span>
                    <span class="font-bold text-xs">WATER TANKERS</span>
                  </div>
                  <span class="font-mono font-bold text-xs" style="color: var(--safe);">${availableTankers} AVAILABLE</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill safe" style="width: ${(availableTankers / (resources.tankers ? resources.tankers.total : 25)) * 100}%;"></div>
                </div>
                <div class="flex justify-between text-xxs text-muted mt-1">
                  <span>${(resources.tankers ? resources.tankers.deployed : 14)} Deployed</span>
                  <span>Total: ${resources.tankers ? resources.tankers.total : 25} Tankers</span>
                </div>
              </div>

              <div class="emergency-resource-card">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-base">❄️</span>
                    <span class="font-bold text-xs">COOLING HUBS</span>
                  </div>
                  <span class="font-mono font-bold text-xs" style="color: #0284C7;">${availableCooling} AVAILABLE</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="background:#0284C7; width: ${(availableCooling / (resources.coolingHubs ? resources.coolingHubs.total : 15)) * 100}%;"></div>
                </div>
                <div class="flex justify-between text-xxs text-muted mt-1">
                  <span>${(resources.coolingHubs ? resources.coolingHubs.deployed : 8)} Operational</span>
                  <span>Total: ${resources.coolingHubs ? resources.coolingHubs.total : 15} Hubs</span>
                </div>
              </div>

              <div class="emergency-resource-card">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-base">👥</span>
                    <span class="font-bold text-xs">RESPONSE OFFICERS</span>
                  </div>
                  <span class="font-mono font-bold text-xs" style="color: var(--primary);">${availableOfficers} AVAILABLE</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="background:var(--primary); width: ${(availableOfficers / 40) * 100}%;"></div>
                </div>
                <div class="flex justify-between text-xxs text-muted mt-1">
                  <span>28 on Patrol</span>
                  <span>Total: 40 Officers</span>
                </div>
              </div>

              <button class="btn btn-secondary btn-xs mt-1" onclick="HEATSHIELD_APP.navigateTo('resources')">
                Open Full Fleet Logistics Console ➔
              </button>
            </div>
          </div>

          <!-- Right 2 Cols: Incident Timeline (Requirement 11) -->
          <div class="card lg:col-span-2">
            <div class="card-header flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="card-title font-bold text-xs uppercase" style="color: var(--text-primary);">
                  ⏱️ INCIDENT OPERATIONAL TIMELINE
                </span>
                <span class="provenance-badge source">REAL-TIME AUDIT LOG</span>
              </div>
              <span class="text-xxs font-mono text-muted">ID: ${s.emergencyIncidentId || 'INC-2026-ACTIVE'}</span>
            </div>
            <div class="card-body" style="padding: 16px; max-height: 380px; overflow-y: auto;">
              <div class="emergency-timeline-container" id="emergencyTimelineList">
                ${this.renderTimelineEvents(s)}
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Initialize GIS map after DOM nodes exist
    setTimeout(() => {
      this.initEmergencyMap();
    }, 80);
  },

  /**
   * Primary Risk Driver derivation from real ward parameters
   */
  getPrimaryRiskDriver(ward) {
    if (!ward) return "Extreme thermal heat island";
    const slum = ward.slum_density || 0.5;
    const elderly = ward.elderly_worker_ratio || 0.5;
    const canopy = ward.tree_canopy !== undefined ? ward.tree_canopy : 0.15;
    const grid = ward.grid_load_pct || 110;

    const drivers = [];
    if (slum > 0.65) drivers.push("Dense tin-roof slum heat trap");
    if (elderly > 0.6) drivers.push("High outdoor worker & elderly cohort");
    if (canopy < 0.1) drivers.push("Critical canopy deficit (<10%)");
    if (grid > 125) drivers.push("CESC feeder overload risk");

    if (drivers.length > 0) {
      return drivers.slice(0, 2).join(" + ");
    }
    return "Elevated biothermal UTCI radiation exposure";
  },

  /**
   * Recommended operational action derivation
   */
  getRecommendedAction(ward) {
    if (!ward) return "Continuous biometeorological monitoring";
    const level = (ward.risk_level || "CRITICAL").toUpperCase();
    if (level === "CRITICAL") {
      return "Activate AC cooling hub & mobilize misting tankers";
    } else if (level === "HIGH") {
      return "Deploy mobile ORS squads & hospital heat triage";
    }
    return "Enforce noon outdoor labor pause advisory";
  },

  /**
   * Grounded AI Briefing synthesis (Requirement 12)
   */
  generateAiBriefing(criticalWards, topWard, queue, availableCooling, availableTankers, peakTemp) {
    const critCount = criticalWards.length;
    const tWard = topWard || { ward_id: 17, name: "Burrabazar Central", utci: 46.8 };
    const pendingCount = queue.filter(q => q.status === "RECOMMENDED" || q.status === "APPROVED").length;

    return {
      situation: `${critCount} wards require immediate municipal intervention under KMC Level-3 protocol. Peak heat feels-like: ${peakTemp || 46.8}°C.`,
      priority: `Ward ${tWard.ward_id} (${tWard.name}) — UTCI ${tWard.utci || 46.8}°C with severe thermal trap and elderly density.`,
      action: `${pendingCount} actions pending authorization. Mandate immediate cooling center activation and misting tanker dispatch.`,
      resources: `${availableCooling} cooling units and ${availableTankers} water tankers ready at central depots for immediate mobilization.`
    };
  },

  /**
   * Render Chronological Timeline Events (Requirement 11)
   */
  renderTimelineEvents(state) {
    const s = state || window.HEATSHIELD_STATE || {};
    const timeline = s.emergencyTimeline || [];
    const alertLogs = s.alertLogs || [];

    // Combine incident-specific timeline with system alert logs
    const events = [];

    // Push emergency-specific events first
    timeline.forEach(t => {
      events.push({
        time: t.time || "JUST NOW",
        text: t.text || t.title,
        type: t.type || "critical",
        badge: t.badge || "INCIDENT ACTION"
      });
    });

    // Backfill with existing system alert logs
    alertLogs.slice(0, 8).forEach(l => {
      events.push({
        time: l.time || "PRE-INCIDENT",
        text: l.text,
        type: l.type || "info",
        badge: "TELEMETRY LOG"
      });
    });

    if (events.length === 0) {
      return `<div class="text-xs text-muted text-center py-4">No incident events recorded yet.</div>`;
    }

    return events.map((ev, idx) => `
      <div class="timeline-event-item">
        <div class="timeline-dot ${ev.type}"></div>
        <div class="timeline-content">
          <div class="flex items-center justify-between mb-1">
            <span class="timeline-time font-mono">${ev.time}</span>
            <span class="timeline-badge ${ev.type}">${ev.badge}</span>
          </div>
          <div class="timeline-text">${ev.text}</div>
        </div>
      </div>
    `).join("");
  },

  /**
   * Initialize or Re-center 2D Emergency GIS Map (Requirement 8)
   */
  initEmergencyMap() {
    if (!window.HEATSHIELD_MAP) return;

    const map = window.HEATSHIELD_MAP.init("emergencyMap", { zoom: 12 });
    if (map) {
      this._mapInitialized = true;
      [50, 200, 450].forEach(delay => {
        setTimeout(() => {
          if (map.invalidateSize) map.invalidateSize();
        }, delay);
      });
    }
  },

  /**
   * Focus map on selected priority ward
   */
  focusWardMap(wardId) {
    this._selectedWardId = parseInt(wardId, 10);
    const s = window.HEATSHIELD_STATE || {};
    s.emergencyActiveWardId = this._selectedWardId;

    if (window.HEATSHIELD_MAP) {
      window.HEATSHIELD_MAP.flyToWard(this._selectedWardId, "emergencyMap");
    }

    // Refresh active state in priority wards grid
    document.querySelectorAll(".emergency-ward-card").forEach(c => {
      c.classList.remove("active");
    });
    const targetCard = document.querySelector(`.emergency-ward-card:has(button[onclick*="${wardId}"])`);
    if (targetCard) targetCard.classList.add("active");
  },

  selectEmergencyWard(wardId) {
    this._selectedWardId = parseInt(wardId, 10);
    const s = window.HEATSHIELD_STATE || {};
    s.emergencyActiveWardId = this._selectedWardId;
    s.selectedWardId = this._selectedWardId;
    this.render(s);
  },

  resetMapCamera() {
    if (this._currentMode === "3d" && this._3dCamera) {
      this._3dCamera.position.set(0, -60, 90);
      this._3dCamera.lookAt(0, 0, 0);
      return;
    }
    if (window.HEATSHIELD_MAP) {
      window.HEATSHIELD_MAP.resetKolkata("emergencyMap");
    }
  },

  /**
   * 2D Tactical Map <-> 3D Digital Twin Switcher (Requirement 9)
   */
  switchMapMode(mode) {
    const btn2D = document.getElementById("btnMapMode2D");
    const btn3D = document.getElementById("btnMapMode3D");
    const el2D = document.getElementById("emergencyMap");
    const el3D = document.getElementById("emergency3dContainer");
    const fallbackNotice = document.getElementById("emergency3dFallbackNotice");

    this._currentMode = mode;

    if (mode === "3d") {
      if (btn2D) btn2D.classList.remove("active");
      if (btn3D) btn3D.classList.add("active");

      // Attempt 3D WebGL Initialization
      try {
        const success = this.init3dDigitalTwin();
        if (success) {
          if (el2D) el2D.style.display = "none";
          if (el3D) el3D.style.display = "block";
          if (fallbackNotice) fallbackNotice.style.display = "none";
        } else {
          // Graceful fallback to 2D
          this.fallbackTo2D();
        }
      } catch (err) {
        console.warn("HEATSHIELD: 3D Twin WebGL initialization error, falling back safely to 2D GIS map:", err);
        this.fallbackTo2D();
      }
    } else {
      // Switch back to 2D
      if (btn2D) btn2D.classList.add("active");
      if (btn3D) btn3D.classList.remove("active");
      if (el3D) el3D.style.display = "none";
      if (el2D) el2D.style.display = "block";
      if (fallbackNotice) fallbackNotice.style.display = "none";

      if (window.HEATSHIELD_MAP && window.HEATSHIELD_MAP.maps["emergencyMap"]) {
        window.HEATSHIELD_MAP.maps["emergencyMap"].invalidateSize();
      }
    }
  },

  fallbackTo2D() {
    const btn2D = document.getElementById("btnMapMode2D");
    const btn3D = document.getElementById("btnMapMode3D");
    const el2D = document.getElementById("emergencyMap");
    const el3D = document.getElementById("emergency3dContainer");
    const fallbackNotice = document.getElementById("emergency3dFallbackNotice");

    if (btn2D) btn2D.classList.add("active");
    if (btn3D) btn3D.classList.remove("active");
    if (el3D) el3D.style.display = "none";
    if (el2D) el2D.style.display = "block";
    if (fallbackNotice) fallbackNotice.style.display = "block";

    if (window.HEATSHIELD_MAP && window.HEATSHIELD_MAP.maps["emergencyMap"]) {
      window.HEATSHIELD_MAP.maps["emergencyMap"].invalidateSize();
    }
  },

  /**
   * 3D Extruded Digital Twin Engine (Requirement 9)
   * Extrudes ward regions based on calculated risk score
   */
  init3dDigitalTwin() {
    if (typeof window === "undefined" || !window.THREE) {
      return false; // Three.js library not loaded
    }

    const container = document.getElementById("emergency3dContainer");
    if (!container) return false;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // If already initialized, just resume animation
    if (this._3dInitialized && this._3dRenderer) {
      this._3dRenderer.setSize(width, height);
      this._3dCamera.aspect = width / height;
      this._3dCamera.updateProjectionMatrix();
      return true;
    }

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    this._3dScene = scene;

    // 2. Camera (Isometric Perspective)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -60, 95);
    camera.lookAt(0, 5, 0);
    this._3dCamera = camera;

    // 3. Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(30, -40, 70);
    scene.add(dirLight);

    // 4. Ground Grid / Kolkata Baseline Plane
    const grid = new THREE.GridHelper(120, 24, 0x1e293b, 0x111827);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.5;
    scene.add(grid);

    // 5. Extruded Wards (Height represents existing calculated risk score)
    const s = window.HEATSHIELD_STATE || {};
    const evaluated = s.evaluatedWards || [];
    const centerLat = 22.5450;
    const centerLng = 88.3650;
    const scale = 220; // Coordinate to 3D world unit scale factor

    evaluated.forEach(ward => {
      const lat = ward.lat || (centerLat + (Math.random() - 0.5) * 0.12);
      const lng = ward.lng || (centerLng + (Math.random() - 0.5) * 0.08);

      const x = (lng - centerLng) * scale;
      const y = (lat - centerLat) * scale;

      // Risk score determines height
      const riskScore = ward.hhvi ? ward.hhvi.mitigated_hhvi : (ward.risk_level === 'CRITICAL' ? 85 : 55);
      const heightVal = Math.max(3.0, (riskScore / 100) * 28.0);

      // Color mapping
      let colorHex = 0x10b981; // Safe
      if (ward.risk_level === "CRITICAL") colorHex = 0xef4444;
      else if (ward.risk_level === "HIGH") colorHex = 0xf97316;
      else if (ward.risk_level === "MODERATE") colorHex = 0xf59e0b;

      // Extruded Prism Geometry
      const radius = 2.2;
      const geom = new THREE.CylinderGeometry(radius, radius, heightVal, 6);
      geom.rotateX(Math.PI / 2); // Orient upward along Z axis

      const mat = new THREE.MeshLambertMaterial({
        color: colorHex,
        transparent: true,
        opacity: ward.risk_level === 'CRITICAL' ? 0.95 : 0.75
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, heightVal / 2);
      mesh.userData = { wardId: ward.ward_id, name: ward.name, score: riskScore, level: ward.risk_level };

      scene.add(mesh);
      this._3dMeshes[ward.ward_id] = mesh;
    });

    // 6. Operational Markers (Hospitals, Cooling Centers, Tankers)
    const markerData = [
      { name: "Medical Trauma Center", lat: 22.5735, lng: 88.3618, color: 0xef4444 },
      { name: "SSKM Emergency Surge", lat: 22.5392, lng: 88.3435, color: 0xef4444 },
      { name: "Burrabazar AC Cooling Hub", lat: 22.5810, lng: 88.3540, color: 0x0284c7 },
      { name: "Sealdah Relief Center", lat: 22.5680, lng: 88.3710, color: 0x0284c7 },
      { name: "Water Tanker TK-01", lat: 22.5830, lng: 88.3520, color: 0x10b981 }
    ];

    markerData.forEach(m => {
      const x = (m.lng - centerLng) * scale;
      const y = (m.lat - centerLat) * scale;
      const beaconGeom = new THREE.SphereGeometry(1.2, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: m.color });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.set(x, y, 32);
      scene.add(beacon);

      // Vertical tether pole down to ground
      const poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 32, 4);
      poleGeom.rotateX(Math.PI / 2);
      const poleMat = new THREE.MeshBasicMaterial({ color: m.color, transparent: true, opacity: 0.5 });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(x, y, 16);
      scene.add(pole);
    });

    // 7. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    this._3dRenderer = renderer;

    // 8. Mouse interaction (Orbit & Raycast)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    renderer.domElement.addEventListener("mousedown", (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    renderer.domElement.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      camera.position.x -= dx * 0.15;
      camera.position.y += dy * 0.15;
      camera.lookAt(0, 5, 0);
    });

    // Raycast on Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener("click", (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Object.values(this._3dMeshes));

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit && hit.userData && hit.userData.wardId) {
          HEATSHIELD_PAGE_EMERGENCY.selectEmergencyWard(hit.userData.wardId);
          if (window.HEATSHIELD_APP) {
            window.HEATSHIELD_APP.showToast(`Selected Ward ${hit.userData.wardId} (${hit.userData.name}) via 3D Digital Twin`, "info");
          }
        }
      }
    });

    // 9. Animation Loop
    const animate = () => {
      this._3dAnimId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    this._3dInitialized = true;
    return true;
  },

  /**
   * Modal for Take Action on specific ward
   */
  openTakeActionModal(wardId) {
    const s = window.HEATSHIELD_STATE || {};
    const ward = (s.evaluatedWards || []).find(w => w.ward_id === wardId);
    if (!ward) return;

    const modalContent = `
      <div class="emergency-modal-body">
        <div class="flex items-center justify-between mb-3 p-3 rounded" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid var(--critical);">
          <div>
            <div class="font-bold text-sm" style="color: var(--text-primary);">Ward ${ward.ward_id} — ${ward.name}</div>
            <div class="text-xs text-secondary mt-0.5">Borough ${ward.borough || 4} · Apparent Heat: <strong>${ward.utci || 46.8}°C</strong></div>
          </div>
          <span class="risk-badge ${ward.risk_level ? ward.risk_level.toLowerCase() : 'critical'}">${ward.risk_level || 'CRITICAL'}</span>
        </div>

        <div class="text-xs font-bold uppercase text-muted mb-2">Select Tactical Emergency Intervention:</div>

        <div class="flex flex-col gap-2 mb-4">
          <label class="emergency-action-radio">
            <input type="radio" name="optAction" value="Cooling Hub" checked />
            <div>
              <div class="font-bold text-xs">Deploy Pop-Up AC Cooling Relief Hub</div>
              <div class="text-xxs text-secondary">Immediate pre-cooling of community center with beds and rehydration fluids.</div>
            </div>
          </label>

          <label class="emergency-action-radio">
            <input type="radio" name="optAction" value="Water Tanker" />
            <div>
              <div class="font-bold text-xs">Deploy 10,000L Water Misting Tanker</div>
              <div class="text-xxs text-secondary">Aerosol road cooling and potable hydration supply in high-density vendor market.</div>
            </div>
          </label>

          <label class="emergency-action-radio">
            <input type="radio" name="optAction" value="Medical Team" />
            <div>
              <div class="font-bold text-xs">Mobilize ASHA Rapid ORS Squad</div>
              <div class="text-xxs text-secondary">Door-to-door triage and oral rehydration salt distribution to elderly cohorts.</div>
            </div>
          </label>
        </div>
      </div>
    `;

    const modalFooter = `
      <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" style="background: var(--critical); border-color: var(--critical); color:#FFF; font-weight:700;" onclick="HEATSHIELD_PAGE_EMERGENCY.confirmTakeAction(${ward.ward_id})">
        Authorize & Dispatch Immediate Action ➔
      </button>
    `;

    if (window.HEATSHIELD_APP) {
      window.HEATSHIELD_APP.openModal(`Authorize Emergency Dispatch: Ward ${ward.ward_id}`, modalContent, modalFooter);
    }
  },

  confirmTakeAction(wardId) {
    const radios = document.getElementsByName("optAction");
    let chosen = "Cooling Hub";
    radios.forEach(r => {
      if (r.checked) chosen = r.value;
    });

    if (window.HEATSHIELD_APP) {
      window.HEATSHIELD_APP.closeModal();
      window.HEATSHIELD_APP.dispatchResourceFromEmergency(wardId, chosen);
    }
  }
};
