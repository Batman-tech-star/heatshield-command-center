/**
 * HEATSHIELD :: Response Queue & Action Triage (Page 5)
 * Official Emergency Operations Center Multi-Agency Workflow:
 * Trigger / Recommendation → Review → Authorization → Fleet Assignment → En Route → Completion
 */

window.HEATSHIELD_PAGE_RESPONSE = {
  _statusFilter: "all",

  render(state) {
    const container = document.getElementById("pageResponse");
    if (!container) return;

    const s = state || window.HEATSHIELD_STATE || {};
    const queue = s.responseQueue || [];
    const fleetList = s.fleetList || [];
    const filteredQueue = this._statusFilter === "all" 
      ? queue 
      : queue.filter(q => q.status.toLowerCase() === this._statusFilter.toLowerCase());

    const criticalCount = queue.filter(q => q.priority === "URGENT" || q.risk_level === "CRITICAL").length;
    const highCount = queue.filter(q => q.priority === "HIGH" || q.risk_level === "HIGH").length;
    const assignedCount = queue.filter(q => q.status === "ASSIGNED" || q.status === "EN ROUTE").length;
    const availableFleet = fleetList.filter(f => f.status === "AVAILABLE").length || 11;

    container.innerHTML = `
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div class="page-title">Response Queue & Action Triage</div>
          <div class="page-subtitle" style="margin-bottom: 0;">Multi-agency command workflow: Recommended → Review → Approve → Assign Fleet → En Route → Verified</div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.navigateTo('resources')">
            <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span>View Available Fleet (${availableFleet})</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_APP.generatePDFReport('response')">
            <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Response Action Report PDF</span>
          </button>
        </div>
      </div>

      <!-- Top KPI Operational Status Strip -->
      <div class="kpi-grid" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 20px;">
        <div class="kpi-card critical" style="border-left: 4px solid var(--critical);">
          <div class="kpi-label">Urgent / Critical</div>
          <div class="kpi-value" style="color: var(--critical);">${criticalCount}</div>
          <div class="text-xxs text-muted mt-1 font-bold">Immediate Dispatch Req.</div>
        </div>
        <div class="kpi-card high" style="border-left: 4px solid var(--high);">
          <div class="kpi-label">High Priority</div>
          <div class="kpi-value" style="color: var(--high);">${highCount}</div>
          <div class="text-xxs text-muted mt-1 font-bold">Active Mitigation</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid var(--primary);">
          <div class="kpi-label">Units Assigned</div>
          <div class="kpi-value" style="color: var(--primary);">${assignedCount}</div>
          <div class="text-xxs text-muted mt-1 font-bold">Active in Field</div>
        </div>
        <div class="kpi-card safe" style="border-left: 4px solid var(--safe);">
          <div class="kpi-label">Available Fleet</div>
          <div class="kpi-value" style="color: var(--safe);">${availableFleet}</div>
          <div class="text-xxs text-muted mt-1 font-bold">Depot Readiness</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid var(--text-tertiary);">
          <div class="kpi-label">Total Protocol Items</div>
          <div class="kpi-value">${queue.length}</div>
          <div class="text-xxs text-muted mt-1 font-bold">Standard Operating Plan</div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="tabs">
        <div class="tab ${this._statusFilter === 'all' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_RESPONSE._statusFilter = 'all'; HEATSHIELD_PAGE_RESPONSE.render(HEATSHIELD_STATE);">All Actions (${queue.length})</div>
        <div class="tab ${this._statusFilter === 'recommended' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_RESPONSE._statusFilter = 'recommended'; HEATSHIELD_PAGE_RESPONSE.render(HEATSHIELD_STATE);">Pending Review (${queue.filter(q => q.status === 'RECOMMENDED').length})</div>
        <div class="tab ${this._statusFilter === 'approved' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_RESPONSE._statusFilter = 'approved'; HEATSHIELD_PAGE_RESPONSE.render(HEATSHIELD_STATE);">Approved (${queue.filter(q => q.status === 'APPROVED').length})</div>
        <div class="tab ${this._statusFilter === 'assigned' ? 'active' : ''}" onclick="HEATSHIELD_PAGE_RESPONSE._statusFilter = 'assigned'; HEATSHIELD_PAGE_RESPONSE.render(HEATSHIELD_STATE);">Assigned / En Route (${queue.filter(q => q.status === 'ASSIGNED').length})</div>
      </div>

      <!-- Official Emergency Action Triage Table -->
      <div class="card mb-4">
        <div class="card-header flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="card-title">Municipal Emergency Action Triage Log</span>
            <span class="provenance-badge source">OFFICIAL DECISION PIPELINE</span>
          </div>
          <span class="text-xxs font-mono text-muted">KMC Level-3 Heat Protocol Enforced</span>
        </div>
        <div class="card-body" style="padding: 0; overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 110px;">Priority</th>
                <th style="width: 140px;">Location</th>
                <th>Causal Problem & Risk Factors</th>
                <th>Recommended Action Protocol</th>
                <th style="width: 130px;">Assigned Team</th>
                <th style="width: 110px;">Status</th>
                <th style="width: 170px;">Action Controls</th>
              </tr>
            </thead>
            <tbody>
              ${filteredQueue.map(item => {
                const isUrgent = item.priority === "URGENT" || item.risk_level === "CRITICAL";
                const riskCls = (item.risk_level || 'critical').toLowerCase();
                const assignedFleet = fleetList.find(f => f.ward === item.ward_id) || { id: "Unassigned", driver: "Standby" };

                return `
                  <tr style="${isUrgent ? 'background: rgba(185, 28, 28, 0.03);' : ''}">
                    <td>
                      <span class="risk-pill ${riskCls}">${item.priority}</span>
                      <div class="text-xxs font-mono text-muted mt-1 font-bold">${item.id}</div>
                    </td>
                    <td>
                      <div class="font-bold text-xs" style="color: var(--text-primary);">Ward ${item.ward_id}</div>
                      <div class="text-xxs text-muted">${item.name}</div>
                      <div class="text-xxs font-bold mt-0.5" style="color: var(--${riskCls});">${item.risk}/100 Risk</div>
                    </td>
                    <td style="max-width: 250px;">
                      <div class="text-xs font-semibold" style="color: var(--text-primary);">${item.reason}</div>
                      <div class="text-xxs text-muted mt-0.5">High thermal exposure + vulnerable demographic concentration</div>
                    </td>
                    <td style="max-width: 240px;">
                      <div class="font-bold text-xs" style="color: var(--primary);">${item.action}</div>
                      <div class="text-xxs text-muted mt-0.5">Mandated under KMC Heat Action Plan</div>
                    </td>
                    <td>
                      ${item.status === 'ASSIGNED' ? `
                        <div class="font-bold text-xs text-primary">${assignedFleet.id}</div>
                        <div class="text-xxs text-muted">${assignedFleet.driver}</div>
                      ` : `
                        <span class="text-xxs text-muted font-bold">Standby Pool</span>
                      `}
                    </td>
                    <td>
                      <span class="provenance-badge ${item.status === 'ASSIGNED' ? 'source' : item.status === 'APPROVED' ? 'derived' : 'modelled'}">
                        ${item.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        ${item.status === 'RECOMMENDED' ? `
                          <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_PAGE_RESPONSE.openReviewModal('${item.id}')">View Details</button>
                          <button class="btn btn-primary btn-xs" onclick="HEATSHIELD_APP.updateResponseStatus('${item.id}', 'APPROVED')">Approve ✓</button>
                        ` : item.status === 'APPROVED' ? `
                          <button class="btn btn-primary btn-xs" onclick="HEATSHIELD_PAGE_RESPONSE.openAssignModal('${item.id}', ${item.ward_id})">Dispatch Unit</button>
                          <button class="btn btn-secondary btn-xs" onclick="HEATSHIELD_APP.updateResponseStatus('${item.id}', 'RECOMMENDED')">Reject</button>
                        ` : item.status === 'ASSIGNED' ? `
                          <button class="btn btn-primary btn-xs" onclick="HEATSHIELD_APP.updateResponseStatus('${item.id}', 'COMPLETED')">Mark Complete ✓</button>
                        ` : `
                          <span class="text-xs font-bold" style="color: var(--safe);">Resolved ✓</span>
                        `}
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- WORKFLOW PROGRESSION BOTTOM NAVIGATION RIBBON -->
      <div id="responseBottomNav"></div>
    `;

    if (window.HEATSHIELD_APP && typeof window.HEATSHIELD_APP.renderPipelineBottomNav === "function") {
      window.HEATSHIELD_APP.renderPipelineBottomNav(5, "responseBottomNav");
    }
  },

  openReviewModal(actionId) {
    const item = (window.HEATSHIELD_STATE.responseQueue || []).find(q => q.id === actionId);
    if (!item) return;

    const content = `
      <div class="flex flex-col gap-3">
        <div class="p-3" style="background: var(--bg-muted); border-radius: 8px; border: 1px solid var(--border);">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-sm">Action ${item.id} — Ward ${item.ward_id} (${item.name})</span>
            <span class="risk-pill ${(item.risk_level || 'critical').toLowerCase()}">${item.priority}</span>
          </div>
          <div class="text-xs text-secondary mt-1"><strong>Identified Risk Factor:</strong> ${item.reason}</div>
          <div class="text-xs text-primary font-bold mt-1"><strong>Mandated Protocol:</strong> ${item.action}</div>
        </div>
        <p class="text-xs text-secondary" style="line-height: 1.5;">
          Authorizing this dispatch confirms municipal compliance with KMC Level-3 Heat Wave SOP. Once approved, the fleet dispatch coordinator can allocate designated tankers, cooling hubs, or medical teams.
        </p>
      </div>
    `;

    const footer = `
      <div class="flex justify-between w-full">
        <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_APP.updateResponseStatus('${item.id}', 'APPROVED'); HEATSHIELD_APP.closeModal();">Approve Action ✓</button>
      </div>
    `;

    window.HEATSHIELD_APP.openModal("Officer Review & Authorization", content, footer);
  },

  openAssignModal(actionId, wardId) {
    const fleet = (window.HEATSHIELD_STATE.fleetList || []).filter(f => f.status === "AVAILABLE" || f.status === "ASSIGNED");

    const content = `
      <div class="flex flex-col gap-3">
        <p class="text-xs text-secondary">Select an operational fleet unit from the municipal depot to dispatch to Ward ${wardId}:</p>
        <div class="flex flex-col gap-2">
          ${fleet.map(f => `
            <div class="flex items-center justify-between p-2.5" style="background: var(--bg-muted); border-radius: 6px; border: 1px solid var(--border);">
              <div>
                <div class="font-bold text-xs text-primary">${f.id} — ${f.type}</div>
                <div class="text-xxs text-muted mt-0.5">Capacity: ${f.cap} · Driver: ${f.driver} (${f.contact})</div>
              </div>
              <button class="btn btn-primary btn-xs" onclick="
                HEATSHIELD_APP.assignResourceToWard(${wardId}, '${f.id}');
                HEATSHIELD_APP.updateResponseStatus('${actionId}', 'ASSIGNED');
              ">Dispatch This Unit</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    window.HEATSHIELD_APP.openModal(`Dispatch Fleet Unit to Ward ${wardId}`, content);
  }
};
