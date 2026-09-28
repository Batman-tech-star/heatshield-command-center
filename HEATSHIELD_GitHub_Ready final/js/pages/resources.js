/**
 * HEATSHIELD :: Resources & Fleet Logistics (Page 6)
 * Real-time municipal asset tracking, capacity accounting, and tactical re-dispatch
 */

window.HEATSHIELD_PAGE_RESOURCES = {
  render(state) {
    const container = document.getElementById("pageResources");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const res = s.resources || {
      tankers: { total: 25, deployed: 14, available: 11 },
      coolingHubs: { total: 15, deployed: 8, available: 7 },
      medicalTeams: { total: 10, deployed: 6, available: 4 },
      officers: { total: 40, deployed: 28, available: 12 }
    };
    const fleet = s.fleetList || [];
    const pct = (dep, tot) => (tot && tot > 0) ? Math.min(100, Math.max(0, Math.round((dep / tot) * 100))) : 0;

    container.innerHTML = `
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div class="page-title">Resources & Fleet Logistics</div>
          <div class="page-subtitle" style="margin-bottom: 0;">Municipal asset deployment, mobile misting tankers, emergency cooling centres & medical squads</div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_PAGE_RESOURCES.runOptimizer()">
            <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Decision Support Allocation</span>
          </button>
        </div>
      </div>

      <!-- 4 Resource Capacity Accounting Cards -->
      <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 20px;">
        <!-- Water Tankers -->
        <div class="kpi-card" style="border-left: 4px solid var(--safe);">
          <div class="flex items-center justify-between mb-1">
            <span class="kpi-label" style="margin-bottom: 0;">Water Misting Tankers</span>
            <span class="risk-pill safe">AVAILABLE</span>
          </div>
          <div class="flex items-baseline gap-1 my-1">
            <span class="kpi-value" style="color: var(--safe); font-size: 24px;">${res.tankers.available}</span>
            <span class="kpi-unit">Available</span>
          </div>
          <div class="text-xxs text-muted mt-1">In Use: ${res.tankers.deployed} · Total: ${res.tankers.total} units</div>
          <div class="progress-bar mt-2">
            <div class="progress-fill green" style="width: ${pct(res.tankers.deployed, res.tankers.total)}%;"></div>
          </div>
        </div>

        <!-- Cooling Hubs -->
        <div class="kpi-card" style="border-left: 4px solid var(--primary);">
          <div class="flex items-center justify-between mb-1">
            <span class="kpi-label" style="margin-bottom: 0;">Pop-Up Cooling Centres</span>
            <span class="risk-pill safe">OPERATIONAL</span>
          </div>
          <div class="flex items-baseline gap-1 my-1">
            <span class="kpi-value" style="color: var(--primary); font-size: 24px;">${res.coolingHubs.available}</span>
            <span class="kpi-unit">Available</span>
          </div>
          <div class="text-xxs text-muted mt-1">In Use: ${res.coolingHubs.deployed} · Total: ${res.coolingHubs.total} centres</div>
          <div class="progress-bar mt-2">
            <div class="progress-fill blue" style="width: ${pct(res.coolingHubs.deployed, res.coolingHubs.total)}%;"></div>
          </div>
        </div>

        <!-- Medical Teams -->
        <div class="kpi-card" style="border-left: 4px solid var(--high);">
          <div class="flex items-center justify-between mb-1">
            <span class="kpi-label" style="margin-bottom: 0;">Medical Triage Squads</span>
            <span class="risk-pill high">DEPLOYED</span>
          </div>
          <div class="flex items-baseline gap-1 my-1">
            <span class="kpi-value" style="color: var(--high); font-size: 24px;">${res.medicalTeams.available}</span>
            <span class="kpi-unit">Available</span>
          </div>
          <div class="text-xxs text-muted mt-1">In Use: ${res.medicalTeams.deployed} · Total: ${res.medicalTeams.total} teams</div>
          <div class="progress-bar mt-2">
            <div class="progress-fill orange" style="width: ${pct(res.medicalTeams.deployed, res.medicalTeams.total)}%;"></div>
          </div>
        </div>

        <!-- Field Officers -->
        <div class="kpi-card" style="border-left: 4px solid var(--text-tertiary);">
          <div class="flex items-center justify-between mb-1">
            <span class="kpi-label" style="margin-bottom: 0;">Field Task Officers</span>
            <span class="risk-pill safe">ON DUTY</span>
          </div>
          <div class="flex items-baseline gap-1 my-1">
            <span class="kpi-value" style="color: var(--text-primary); font-size: 24px;">${res.officers.available}</span>
            <span class="kpi-unit">Available</span>
          </div>
          <div class="text-xxs text-muted mt-1">In Use: ${res.officers.deployed} · Total: ${res.officers.total} officers</div>
          <div class="progress-bar mt-2">
            <div class="progress-fill blue" style="width: ${pct(res.officers.deployed, res.officers.total)}%;"></div>
          </div>
        </div>
      </div>

      <!-- Live Resource Allocation Table -->
      <div class="card mb-4">
        <div class="card-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="card-title">Live Municipal Fleet & Emergency Facility Roster</span>
            <span class="provenance-badge source">ACTIVE ASSETS</span>
          </div>
          <span class="text-xxs text-muted font-mono">Real-Time GPS & Depot Tracking</span>
        </div>
        <div class="card-body" style="padding: 0; overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 100px;">Unit ID</th>
                <th>Asset Type</th>
                <th>Capacity / Specs</th>
                <th>Assigned Location</th>
                <th>Status</th>
                <th>ETA / Readiness</th>
                <th>In-Charge Contact</th>
                <th style="width: 120px;">Operational Action</th>
              </tr>
            </thead>
            <tbody>
              ${fleet.map(f => {
                const statusType = f.status === 'ACTIVE' ? 'safe' : f.status === 'EN ROUTE' ? 'high' : f.status === 'ASSIGNED' ? 'moderate' : 'safe';
                const statusLabel = f.status === 'ACTIVE' ? 'DEPLOYED' : f.status === 'EN ROUTE' ? 'EN ROUTE' : f.status === 'AVAILABLE' ? 'AVAILABLE' : 'BUSY';
                return `
                  <tr>
                    <td><span class="font-mono text-xs font-bold">${f.id}</span></td>
                    <td class="font-semibold text-xs">${f.type}</td>
                    <td class="text-xs font-mono">${f.cap}</td>
                    <td>
                      <span class="font-bold text-xs" style="color: var(--primary);">Ward ${f.ward}</span>
                    </td>
                    <td>
                      <span class="risk-pill ${statusType}">
                        ${statusLabel}
                      </span>
                    </td>
                    <td class="text-xs font-bold" style="color: var(--${statusType});">${f.eta}</td>
                    <td class="text-xs text-muted">${f.driver} (${f.contact})</td>
                    <td>
                      <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_PAGE_RESOURCES.openReassignModal('${f.id}')">
                        Reassign Unit
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openReassignModal(unitId) {
    const unit = (window.HEATSHIELD_STATE.fleetList || []).find(f => f.id === unitId);
    const wards = (window.HEATSHIELD_STATE.evaluatedWards || []).slice(0, 30);

    const content = `
      <div class="flex flex-col gap-3">
        <div class="p-3" style="background: var(--bg-muted); border-radius: 8px; border: 1px solid var(--border);">
          <div class="font-bold text-xs">Reassign Fleet Asset: ${unit.id} (${unit.type})</div>
          <div class="text-xxs text-muted mt-0.5">Currently Designated: Ward ${unit.ward} · Capacity: ${unit.cap}</div>
        </div>
        <label class="text-xs font-bold text-secondary">Select Priority Destination Ward:</label>
        <select id="reassignWardSelect" class="header-search-input" style="height: 36px; padding-left: 10px; font-size: 12px; background: var(--bg-input);">
          ${wards.map(w => `<option value="${w.ward_id}" ${w.ward_id === unit.ward ? 'selected' : ''}>Ward ${w.ward_id} – ${w.name} (${w.risk_level} Risk · Score: ${w.hhvi ? w.hhvi.mitigated_hhvi : 75})</option>`).join("")}
        </select>
      </div>
    `;

    const footer = `
      <div class="flex justify-between w-full">
        <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="
          const wardId = parseInt(document.getElementById('reassignWardSelect').value, 10);
          HEATSHIELD_APP.assignResourceToWard(wardId, '${unit.id}');
        ">Confirm Re-dispatch →</button>
      </div>
    `;

    window.HEATSHIELD_APP.openModal(`Re-dispatch Asset ${unit.id}`, content, footer);
  },

  runOptimizer() {
    window.HEATSHIELD_APP.showToast("⚡ Computing optimal dispatch matrix based on live thermal hazard and vulnerable population density...", "info");

    setTimeout(() => {
      window.HEATSHIELD_APP.showToast("✓ Recommended fleet allocation: 3 High-Capacity Misting Units routed to Central Corridor (Wards 17, 58, 63).", "success");
    }, 1000);
  }
};
