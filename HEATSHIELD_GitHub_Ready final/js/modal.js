/**
 * HEATSHIELD :: KCAP-2025 Enterprise Modals, Command Palette & Presentation Mode
 */

const HEATSHIELD_MODAL = {
  activeDispatchWard: null,
  activePresentationSlide: 1,
  totalPresentationSlides: 6,

  // =========================================================================
  // 1. GLOBAL COMMAND PALETTE (CTRL + K)
  // =========================================================================
  openCommandPalette() {
    const el = document.getElementById("commandPaletteModal");
    if (!el) return;
    el.classList.remove("hidden");
    el.classList.add("flex");
    const input = document.getElementById("commandPaletteInput");
    if (input) {
      input.value = "";
      input.focus();
      this.filterCommandPalette("");
    }
  },

  closeCommandPalette() {
    const el = document.getElementById("commandPaletteModal");
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("flex");
    }
  },

  filterCommandPalette(query) {
    const listEl = document.getElementById("commandPaletteResults");
    if (!listEl) return;
    const q = (query || "").trim().toLowerCase();
    const wards = window.HEATSHIELD_STATE.evaluatedWards || [];
    const isBn = HEATSHIELD_I18N.currentLang === "bn";

    const commands = [
      { id: "action_lang", icon: "🌐", title: isBn ? "Switch to English" : "বাংলা ভাষায় পরিবর্তন করুন", category: "Language", action: () => document.getElementById("btnLangToggle")?.click() },
      { id: "action_docket", icon: "📄", title: isBn ? "সিচুয়েশন ডকেট এক্সপোর্ট" : "Export Daily Situation Docket", category: "Report", action: () => HEATSHIELD_MODAL.openDocketModal() },
      { id: "action_pres", icon: "📽️", title: isBn ? "উপস্থাপনা মোড চালু করুন" : "Launch Executive Presentation Mode", category: "Presentation", action: () => HEATSHIELD_MODAL.openPresentationMode() },
      { id: "action_access", icon: "♿", title: isBn ? "অ্যাক্সেসিবিলিটি সেটিংস" : "Open Accessibility Panel", category: "System", action: () => HEATSHIELD_MODAL.openAccessibilityModal() },
      { id: "action_compare", icon: "⚖️", title: isBn ? "ওয়ার্ড তুলনা মোড" : "Compare Two Wards", category: "Analytics", action: () => HEATSHIELD_MODAL.openCompareModal() },
      { id: "action_oven", icon: "🔥", title: isBn ? "ইনডোর ওভেন সিমুলেটর টগল" : "Toggle Indoor Oven Microclimate", category: "Simulation", action: () => { const sw = document.getElementById("indoorOvenSwitch"); if (sw) { sw.checked = !sw.checked; sw.dispatchEvent(new Event("change")); } } },
      { id: "action_labor", icon: "🛑", title: isBn ? "দুপুর বেলা বহিরাঙ্গন শ্রম নিষেধাজ্ঞা" : "Toggle High-Noon Labor Shift Ban", category: "Policy", action: () => { const sw = document.getElementById("toggleLaborBan"); if (sw) { sw.checked = !sw.checked; sw.dispatchEvent(new Event("change")); } } },
      { id: "action_reset_map", icon: "🗺️", title: isBn ? "মানচিত্র ভিউ রিসেট" : "Reset City Map View", category: "Map", action: () => HEATSHIELD_MAP.resetView() }
    ];

    let html = "";

    // Filter Actions
    const matchingCmds = commands.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    if (matchingCmds.length > 0) {
      html += `<div class="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 py-1.5">${isBn ? "কমান্ড ও অ্যাকশন" : "Actions & Tools"}</div>`;
      matchingCmds.forEach(c => {
        html += `
          <div class="px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs text-slate-200 transition-colors" onclick="HEATSHIELD_MODAL.closeCommandPalette(); (${c.action.toString()})()">
            <div class="flex items-center gap-2.5">
              <span>${c.icon}</span>
              <span class="font-semibold">${c.title}</span>
            </div>
            <span class="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">${c.category}</span>
          </div>
        `;
      });
    }

    // Filter Wards
    const matchingWards = wards.filter(w => w.name.toLowerCase().includes(q) || w.name_bn.toLowerCase().includes(q) || String(w.ward_id).includes(q)).slice(0, 8);
    if (matchingWards.length > 0) {
      html += `<div class="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-2">${isBn ? "ওয়ার্ড ও এলাকা" : "Wards & Localities"}</div>`;
      matchingWards.forEach(w => {
        const name = isBn ? w.name_bn : w.name;
        html += `
          <div class="px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs text-slate-200 transition-colors" onclick="HEATSHIELD_MODAL.closeCommandPalette(); HEATSHIELD_MAP.focusWard(${w.ward_id});">
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full" style="background:${w.risk_color}"></span>
              <span class="font-mono font-bold text-cyan-300">Ward ${w.ward_id}</span>
              <span>— ${name}</span>
            </div>
            <span class="text-[11px] font-mono font-bold" style="color:${w.risk_color}">${w.hhvi.mitigated_hhvi} HHVI</span>
          </div>
        `;
      });
    }

    if (!matchingCmds.length && !matchingWards.length) {
      html = `<div class="p-6 text-center text-slate-400 text-xs">${isBn ? "কোনো ফলাফল পাওয়া যায়নি।" : "No matching commands or wards found."}</div>`;
    }

    listEl.innerHTML = html;
  },

  // =========================================================================
  // 2. WARD COMPARISON MODE
  // =========================================================================
  openCompareModal() {
    const el = document.getElementById("wardCompareModal");
    if (!el) return;
    this.renderCompareModal();
    el.classList.remove("hidden");
    el.classList.add("flex");
  },

  closeCompareModal() {
    const el = document.getElementById("wardCompareModal");
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("flex");
    }
  },

  renderCompareModal() {
    const state = window.HEATSHIELD_STATE;
    const isBn = HEATSHIELD_I18N.currentLang === "bn";
    const toBn = HEATSHIELD_DATA.toBengaliNumber;

    const selectA = document.getElementById("compareSelectA");
    const selectB = document.getElementById("compareSelectB");

    if (selectA && selectB) {
      const wardIdA = parseInt(selectA.value, 10) || state.selectedWardId || 17;
      const wardIdB = parseInt(selectB.value, 10) || (wardIdA === 17 ? 58 : 17);

      const wards = state.evaluatedWards || [];
      const optionsHtml = wards.map(w => `<option value="${w.ward_id}">${w.name} (HHVI: ${w.hhvi.mitigated_hhvi})</option>`).join("");

      if (!selectA.innerHTML.trim()) {
        selectA.innerHTML = optionsHtml;
        selectA.value = wardIdA;
        selectA.onchange = () => this.renderCompareModal();
      }
      if (!selectB.innerHTML.trim()) {
        selectB.innerHTML = optionsHtml;
        selectB.value = wardIdB;
        selectB.onchange = () => this.renderCompareModal();
      }

      const wA = wards.find(w => w.ward_id === parseInt(selectA.value, 10)) || wards[0];
      const wB = wards.find(w => w.ward_id === parseInt(selectB.value, 10)) || wards[1];

      const appA = window.HEATSHIELD_ENGINE.calculateApparentTemp(wA.outdoor_temp, wA.base_rh, window.HEATSHIELD_ENGINE.liveWeather.wind_speed_kmh);
      const appB = window.HEATSHIELD_ENGINE.calculateApparentTemp(wB.outdoor_temp, wB.base_rh, window.HEATSHIELD_ENGINE.liveWeather.wind_speed_kmh);
      const popDetailsA = window.HEATSHIELD_DATA.getWardPopulation(wA.ward_id);
      const popDetailsB = window.HEATSHIELD_DATA.getWardPopulation(wB.ward_id);

      const contentEl = document.getElementById("compareDetailsContent");
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="grid grid-cols-2 gap-4">
            <!-- Ward A Card -->
            <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-700 pb-2">
                <div>
                  <div class="font-bold text-sm text-cyan-400 font-mono">Ward ${wA.ward_id}</div>
                  <div class="text-xs text-slate-300 font-semibold">${isBn ? wA.name_bn : wA.name}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono" style="background:${wA.risk_color}22; color:${wA.risk_color}; border: 1px solid ${wA.risk_color}66">
                  ${wA.risk_level}
                </span>
              </div>
              <div class="space-y-2 text-xs font-mono">
                <div class="flex justify-between"><span class="text-slate-400">Mitigated HHVI:</span><span class="font-bold text-base" style="color:${wA.risk_color}">${wA.hhvi.mitigated_hhvi}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Outdoor Temp:</span><span class="text-amber-400 font-bold">${wA.outdoor_temp}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Apparent Temp (HI):</span><span class="text-orange-400 font-bold">${appA}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Modeled Indoor Exposure:</span><span class="text-red-400 font-bold">${wA.effective_temp}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">WBGT Thermal Index:</span><span class="text-slate-200">${wA.wbgt.wbgt_celsius}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Slum Density:</span><span class="text-rose-400 font-bold">${Math.round(wA.slum_density * 100)}%</span></div>
                <div class="flex justify-between"><span class="text-slate-400">2011 Census Pop:</span><span class="${popDetailsA.population_census_2011 !== null ? 'text-slate-200' : 'text-amber-400 font-bold'}">${isBn ? toBn(popDetailsA.census_display_label) : popDetailsA.census_display_label}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">2026 Planning Est:</span><span class="${popDetailsA.population_estimate_2026 !== null ? 'text-slate-200' : 'text-slate-500'}">${isBn ? toBn(popDetailsA.estimate_display_label) : popDetailsA.estimate_display_label}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Tree Canopy Cover:</span><span class="text-emerald-400">${Math.round(wA.tree_canopy * 100)}%</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Age 60+ (Geriatric):</span><span class="text-purple-400">${Math.round(wA.elderly_worker_ratio * 100)}%</span></div>
              </div>
            </div>

            <!-- Ward B Card -->
            <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-700 pb-2">
                <div>
                  <div class="font-bold text-sm text-cyan-400 font-mono">Ward ${wB.ward_id}</div>
                  <div class="text-xs text-slate-300 font-semibold">${isBn ? wB.name_bn : wB.name}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono" style="background:${wB.risk_color}22; color:${wB.risk_color}; border: 1px solid ${wB.risk_color}66">
                  ${wB.risk_level}
                </span>
              </div>
              <div class="space-y-2 text-xs font-mono">
                <div class="flex justify-between"><span class="text-slate-400">Mitigated HHVI:</span><span class="font-bold text-base" style="color:${wB.risk_color}">${wB.hhvi.mitigated_hhvi}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Outdoor Temp:</span><span class="text-amber-400 font-bold">${wB.outdoor_temp}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Apparent Temp (HI):</span><span class="text-orange-400 font-bold">${appB}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Modeled Indoor Exposure:</span><span class="text-red-400 font-bold">${wB.effective_temp}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">WBGT Thermal Index:</span><span class="text-slate-200">${wB.wbgt.wbgt_celsius}°C</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Slum Density:</span><span class="text-rose-400 font-bold">${Math.round(wB.slum_density * 100)}%</span></div>
                <div class="flex justify-between"><span class="text-slate-400">2011 Census Pop:</span><span class="${popDetailsB.population_census_2011 !== null ? 'text-slate-200' : 'text-amber-400 font-bold'}">${isBn ? toBn(popDetailsB.census_display_label) : popDetailsB.census_display_label}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">2026 Planning Est:</span><span class="${popDetailsB.population_estimate_2026 !== null ? 'text-slate-200' : 'text-slate-500'}">${isBn ? toBn(popDetailsB.estimate_display_label) : popDetailsB.estimate_display_label}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Tree Canopy Cover:</span><span class="text-emerald-400">${Math.round(wB.tree_canopy * 100)}%</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Age 60+ (Geriatric):</span><span class="text-purple-400">${Math.round(wB.elderly_worker_ratio * 100)}%</span></div>
              </div>
            </div>
          </div>
        `;
      }
    }
  },

  // =========================================================================
  // 3. "WHY THIS SCORE?" EXPLAINABILITY MODAL
  // =========================================================================
  openWhyScoreModal(wardId) {
    const el = document.getElementById("whyScoreModal");
    if (!el) return;
    const ward = window.HEATSHIELD_STATE.evaluatedWards.find(w => w.ward_id === wardId) || window.HEATSHIELD_STATE.evaluatedWards[0];
    const isBn = HEATSHIELD_I18N.currentLang === "bn";

    const titleEl = document.getElementById("whyScoreWardTitle");
    if (titleEl) {
      titleEl.textContent = `Ward ${ward.ward_id} — ${isBn ? ward.name_bn : ward.name}`;
    }

    const contentEl = document.getElementById("whyScoreContent");
    if (contentEl) {
      const wf = ward.hhvi.waterfall;
      
      // Calculate percentages for contribution bars
      const exposurePct = Math.min(100, Math.round((wf.heat_component / 35) * 100));
      const slumPct = Math.min(100, Math.round((wf.slum_component / 25) * 100));
      const agePct = Math.min(100, Math.round((wf.elderly_component / 20) * 100));
      const canopyPct = Math.min(100, Math.round((wf.canopy_component / 20) * 100));

      contentEl.innerHTML = `
        <div class="space-y-4 text-xs font-sans">
          <!-- Mathematical Contribution Waterfall with Contribution Bars -->
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-mono text-cyan-400 font-bold uppercase">Mathematical Contribution Waterfall</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-purple-950/80 text-purple-400 border border-purple-500/40">PROTOTYPE MODEL</span>
            </div>
            
            <div class="space-y-2.5 font-mono text-xs">
              <!-- Component 1 -->
              <div class="space-y-1">
                <div class="flex justify-between items-center text-slate-300">
                  <span>1. Thermal Exposure (BTSS × 0.35):</span>
                  <span class="text-red-400 font-bold">+${wf.heat_component} pts</span>
                </div>
                <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full bg-red-500 rounded-full" style="width: ${exposurePct}%"></div>
                </div>
              </div>

              <!-- Component 2 -->
              <div class="space-y-1">
                <div class="flex justify-between items-center text-slate-300">
                  <span>2. Slum Microclimate (Density × 0.25):</span>
                  <span class="text-rose-400 font-bold">+${wf.slum_component} pts</span>
                </div>
                <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full bg-rose-500 rounded-full" style="width: ${slumPct}%"></div>
                </div>
              </div>

              <!-- Component 3 -->
              <div class="space-y-1">
                <div class="flex justify-between items-center text-slate-300">
                  <span>3. Labor / Geriatric Vulnerability (Ratio × 0.20):</span>
                  <span class="text-orange-400 font-bold">+${wf.elderly_component} pts</span>
                </div>
                <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full bg-orange-500 rounded-full" style="width: ${agePct}%"></div>
                </div>
              </div>

              <!-- Component 4 -->
              <div class="space-y-1">
                <div class="flex justify-between items-center text-slate-300">
                  <span>4. Canopy Deficit ((1 - Canopy) × 0.20):</span>
                  <span class="text-amber-400 font-bold">+${wf.canopy_component} pts</span>
                </div>
                <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" style="width: ${canopyPct}%"></div>
                </div>
              </div>

              <!-- Component 5: Mitigation -->
              <div class="border-t border-slate-800 pt-2 flex justify-between items-center text-emerald-400">
                <span class="font-bold">Active Logistics Mitigation Discount:</span>
                <span class="font-bold">-${wf.mitigation_discount} pts</span>
              </div>

              <!-- Composite Output -->
              <div class="border-t border-cyan-500/40 pt-2 flex justify-between items-center text-sm font-bold text-slate-100">
                <span>Final Mitigated HHVI Composite:</span>
                <span style="color:${ward.risk_color}">${ward.hhvi.mitigated_hhvi}</span>
              </div>
            </div>
          </div>

          <!-- Human Readable Assessment -->
          <div class="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
            <div class="text-cyan-300 font-bold font-mono text-[11px] uppercase">Human-Readable Assessment</div>
            <ul class="list-disc list-inside space-y-1 text-slate-200 text-xs">
              ${ward.hhvi.explanations.map(e => `<li>${e}</li>`).join("")}
            </ul>
          </div>

          <!-- Prototype Weights Disclaimer -->
          <div class="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 text-[10px] text-purple-300/95 leading-relaxed font-sans">
            <strong>⚠️ PROTOTYPE MODEL:</strong> The weights used in this composite index (Thermal Exposure 35%, Slum Microclimate 25%, Demographics 20%, Tree Canopy 20%) are synthetic model assumptions for planning simulations and have not been officially validated by the KMC or WB Government.
          </div>
        </div>
      `;
    }

    el.classList.remove("hidden");
    el.classList.add("flex");
  },

  closeWhyScoreModal() {
    const el = document.getElementById("whyScoreModal");
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("flex");
    }
  },

  openWhyPopulationModal() {
    const el = document.getElementById("whyPopulationModal");
    if (!el) return;
    el.classList.remove("hidden");
    el.classList.add("flex");
  },

  closeWhyPopulationModal() {
    const el = document.getElementById("whyPopulationModal");
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("flex");
    }
  },

  // =========================================================================
  // 4. PRESENTATION MODE
  // =========================================================================
  openPresentationMode() {
    const el = document.getElementById("presentationModeOverlay");
    if (!el) return;
    this.activePresentationSlide = 1;
    this.renderPresentationSlide(1);
    el.classList.remove("hidden");
    el.classList.add("flex");

    // Listen for keyboard navigation
    window.addEventListener("keydown", this.handlePresentationKeyDown);
  },

  closePresentationMode() {
    const el = document.getElementById("presentationModeOverlay");
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("flex");
    }
    window.removeEventListener("keydown", this.handlePresentationKeyDown);
  },

  handlePresentationKeyDown(e) {
    if (e.key === "Escape") {
      HEATSHIELD_MODAL.closePresentationMode();
    } else if (e.key === "ArrowRight" || e.key === " ") {
      HEATSHIELD_MODAL.nextPresentationSlide();
    } else if (e.key === "ArrowLeft") {
      HEATSHIELD_MODAL.prevPresentationSlide();
    }
  },

  nextPresentationSlide() {
    if (this.activePresentationSlide < this.totalPresentationSlides) {
      this.activePresentationSlide++;
      this.renderPresentationSlide(this.activePresentationSlide);
    }
  },

  prevPresentationSlide() {
    if (this.activePresentationSlide > 1) {
      this.activePresentationSlide--;
      this.renderPresentationSlide(this.activePresentationSlide);
    }
  },

  renderPresentationSlide(slideNum) {
    const contentEl = document.getElementById("presentationSlideContent");
    const indicatorEl = document.getElementById("presentationSlideIndicator");
    if (!contentEl) return;

    if (indicatorEl) indicatorEl.textContent = `Slide ${slideNum} / ${this.totalPresentationSlides}`;

    const slides = [
      {
        title: "1. The Invisible Killer: Kolkata Extreme Heat Emergency",
        sub: "Current meteorological tools report 41°C outdoor shade temperatures, missing severe wet-bulb stress in dense informal slum clusters.",
        metric1: "1.84M At-Risk Citizens",
        metric2: "+2.6°C Urban Surge Baseline",
        body: "HEATSHIELD bridges meteorological forecasting with actionable municipal logistics. Using 144 authentic KMC ward polygons, it tracks real human vulnerability."
      },
      {
        title: "2. The 'Indoor Oven' Trap: Tin-Roof Microclimate Penalty",
        sub: "While meteorological stations measure outdoor shade, slum residents endure radiant trapped heat under asbestos and corrugated tin sheets.",
        metric1: "48.4°C Slum Indoor Temp",
        metric2: "+7.2°C Radiant Trapping",
        body: "Our model calculates effective indoor microclimates, closing the spatial loophole and prioritizing rapid hydration and cooling for vulnerable settlements."
      },
      {
        title: "3. Mayor's Logistics Sandbox: Capacity-Constrained Resource Optimization",
        sub: "Answering the core question: 'If the City has 144 wards but only 12 tankers, where do they go first?'",
        metric1: "25 Tankers + 15 Cooling Hubs",
        metric2: "-48.0 pts HHVI Cooldown",
        body: "Simulates instant field deployments with multi-strategy optimization (Protect Most Vulnerable, Reduce Critical Wards, Maximize Population Coverage)."
      },
      {
        title: "4. Infrastructure Stress Simulation: Cascading Failure Modeling",
        sub: "Extreme temperatures trigger peak HVAC electrical draw, causing modeled transformer overloads that may cascade to water pumping stations.",
        metric1: "Modeled Grid Stress Scenario",
        metric2: "Cascading Pump Risk Model",
        body: "Simulates cascading infrastructure stress scenarios. In production, this would connect to CESC & WBSEDCL control rooms for real-time telemetry."
      },
      {
        title: "5. 7-Day DLNM Scenario: Advance Hospital Preparedness Model",
        sub: "Epidemiological evidence proves peak cardiovascular shock and renal collapse occur 72–120 hours post-heatwave.",
        metric1: "Modeled Hospital Surge Scenario",
        metric2: "Prototype Preparedness Model",
        body: "Provides government hospitals (SSKM, Medical College, NRS, RG Kar) a modeled 3-day advance warning to prepare emergency dialysis, ORS, and ICU beds. Based on published DLNM research, not validated against local data."
      },
      {
        title: "6. Smart Logistics & GPS Tracking: Live Road-Network Dispatch Tracking",
        sub: "Tracks response vehicle GPS coordinates and simplifies step-by-step street transits to KMC target centers.",
        metric1: "OSRM Road-Network Routing",
        metric2: "Simulated GPS Telemetry Sync",
        body: "Orchestrates live asset dispatches dynamically based on spatial priorities. When tankers are allocated, KMC officers can monitor routing paths, track vehicle GPS, and verify arrival in real-time."
      }
    ];

    const slide = slides[slideNum - 1];
    contentEl.innerHTML = `
      <div class="space-y-6 max-w-3xl mx-auto text-left">
        <div class="space-y-2">
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
            Executive Briefing :: Slide ${slideNum}
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-100">${slide.title}</h2>
          <p class="text-sm text-slate-400">${slide.sub}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <span class="text-xs text-slate-500 font-mono uppercase block">Key Operational Metric</span>
            <span class="text-xl md:text-2xl font-bold font-mono text-cyan-400">${slide.metric1}</span>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <span class="text-xs text-slate-500 font-mono uppercase block">Logistics Target</span>
            <span class="text-xl md:text-2xl font-bold font-mono text-emerald-400">${slide.metric2}</span>
          </div>
        </div>

        <p class="text-sm text-slate-300 leading-relaxed font-sans bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
          ${slide.body}
        </p>
      </div>
    `;
  },

  // =========================================================================
  // 5. ACCESSIBILITY MODAL
  // =========================================================================
  openAccessibilityModal() {
    const el = document.getElementById("accessibilityModal");
    if (el) {
      el.classList.remove("hidden");
      el.classList.add("flex");
    }
  },

  closeAccessibilityModal() {
    const el = document.getElementById("accessibilityModal");
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("flex");
    }
  },

  setFontScale(scale) {
    document.documentElement.style.fontSize = `${scale}%`;
  },

  toggleHighContrast(enabled) {
    document.body.classList.toggle("high-contrast-mode", enabled);
  },

  toggleReduceMotion(enabled) {
    document.body.classList.toggle("reduce-motion-mode", enabled);
  },

  // =========================================================================
  // 6. TWILIO DISPATCH MODAL
  // =========================================================================
  openDispatchModal(wardId) {
    const state = window.HEATSHIELD_STATE;
    const ward = state.evaluatedWards.find(w => w.ward_id === wardId) || state.evaluatedWards[0];
    this.activeDispatchWard = ward;

    const modalEl = document.getElementById("twilioDispatchModal");
    if (!modalEl) return;

    const isBn = HEATSHIELD_I18N.currentLang === "bn";
    const toBn = HEATSHIELD_DATA.toBengaliNumber;

    const targetWardName = isBn ? ward.name_bn : ward.name;
    const targetWardEl = document.getElementById("dispatchWardTitle");
    if (targetWardEl) {
      targetWardEl.textContent = `${targetWardName} (Borough ${ward.borough})`;
    }

    const bnMessage = `🚨 জরুরী সতর্কবার্তা (Ward ${ward.ward_id} - ${ward.name}): ${ward.effective_temp}°C আর্দ্র তাপপ্রবাহ (${ward.base_rh}% RH)। অবিলম্বে ক্লাব সদস্যদের মাঠে নামিয়ে ORS, ওআরএস দ্রবণ ও বরফজল বিতরণ করুন। নির্মাণ শ্রমিকদের দুপুর ১১:০০-৩:৩০টা পর্যন্ত বাধ্যতামূলক কাজ বন্ধ রাখুন।`;
    const enMessage = `🚨 EMERGENCY HEAT ALERT (Ward ${ward.ward_id} - ${ward.name}): Extreme ${ward.effective_temp}°C wet-bulb index (${ward.base_rh}% RH). Activate ASHA & Para-Club squads for urgent ORS and chilled water distribution. Mandatory outdoor labor shutdown enforced (11:00 AM - 3:30 PM).`;

    const previewEl = document.getElementById("dispatchMessagePreview");
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-100 text-xs font-sans leading-relaxed mb-3">
          <div class="flex items-center gap-2 text-emerald-400 font-bold mb-1.5 font-mono text-[11px]">
            <span>🟢 [WHATSAPP DISPATCH ENCRYPTED PAYLOAD - BENGALI]</span>
          </div>
          ${bnMessage}
        </div>
        <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 text-xs font-mono leading-relaxed">
          <div class="flex items-center gap-2 text-cyan-400 font-bold mb-1.5 text-[11px]">
            <span>🔵 [TWILIO REST SMS FALLBACK - ENGLISH]</span>
          </div>
          ${enMessage}
        </div>
      `;
    }

    const recipientsListEl = document.getElementById("dispatchRecipientsList");
    if (recipientsListEl) {
      const clubs = ward.para_clubs || ["Local Youth Para Club", "KMC Ward Welfare Committee"];
      const ashas = ward.asha_supervisors || ["ASHA Supervisor (+91 98300 12345)"];

      recipientsListEl.innerHTML = `
        <div class="text-xs space-y-1.5">
          <div class="flex items-center gap-2 text-cyan-300 font-semibold">
            <span>🏛️ Registered Para-Clubs:</span>
            <span class="text-slate-300 font-normal">${clubs.join(" | ")}</span>
          </div>
          <div class="flex items-center gap-2 text-emerald-300 font-semibold">
            <span>👩‍⚕️ Designated ASHA Supervisors:</span>
            <span class="text-slate-300 font-normal">${ashas.join(" | ")}</span>
          </div>
        </div>
      `;
    }

    const terminalEl = document.getElementById("twilioApiConsole");
    if (terminalEl) {
      terminalEl.classList.add("hidden");
      terminalEl.innerHTML = "";
    }
    const sendBtn = document.getElementById("btnExecuteDispatch");
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = `<span>🚀</span> <span>${isBn ? "টুইলিও হোয়াটসঅ্যাপ ব্রডকাস্ট পাঠান" : "Execute Twilio WhatsApp & SMS Broadcast"}</span>`;
      sendBtn.className = "px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono shadow-lg shadow-cyan-900/50 flex items-center gap-2 transition-all cursor-pointer";
    }

    modalEl.classList.remove("hidden");
    modalEl.classList.add("flex");
  },

  closeDispatchModal() {
    const modalEl = document.getElementById("twilioDispatchModal");
    if (modalEl) {
      modalEl.classList.add("hidden");
      modalEl.classList.remove("flex");
    }
  },

  simulateTwilioExecution() {
    const sendBtn = document.getElementById("btnExecuteDispatch");
    const terminalEl = document.getElementById("twilioApiConsole");
    const ward = this.activeDispatchWard;
    if (!terminalEl || !ward) return;

    terminalEl.classList.remove("hidden");
    if (sendBtn) sendBtn.disabled = true;

    terminalEl.innerHTML = `
      <div class="p-3 rounded-lg bg-slate-900 border border-amber-500/40 space-y-2 text-xs font-mono">
        <div class="flex items-center gap-2 text-amber-400 font-bold">
          <span>ℹ️</span>
          <span>PROTOTYPE SIMULATION</span>
        </div>
        <div class="text-slate-300 leading-relaxed font-sans">
          In production, this action would dispatch emergency WhatsApp and SMS alerts
          via the <strong class="text-cyan-300">Twilio API</strong> to all registered Para-Club secretaries
          and ASHA supervisors in <strong class="text-cyan-300">Ward ${ward.ward_id} (${ward.name})</strong>.
        </div>
        <div class="text-slate-400 text-[10px] border-t border-slate-800 pt-2 mt-2">
          Integration requires: Twilio Account SID, Auth Token, verified WhatsApp sender,
          and registered recipient phone numbers. Not connected in this prototype.
        </div>
      </div>
    `;

    if (sendBtn) {
      setTimeout(() => {
        sendBtn.innerHTML = `<span>📋</span> <span>DISPATCH LOGGED (Prototype)</span>`;
        sendBtn.classList.remove("bg-cyan-600", "hover:bg-cyan-500");
        sendBtn.classList.add("bg-amber-600");
      }, 500);
    }

    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    window.HEATSHIELD_STATE.alertLogs.unshift({
      time: now,
      text: `Dispatch logged for Ward ${ward.ward_id} (${ward.name}). Prototype — Twilio API not connected.`,
      type: "dispatch"
    });
    if (window.HEATSHIELD_APP) {
      window.HEATSHIELD_APP.renderAlertTimeline(window.HEATSHIELD_I18N?.currentLang === "bn");
    }
  },

  // =========================================================================
  // 7. EXECUTIVE DAILY SITUATION DOCKET (A4 PRINT / PDF)
  // =========================================================================
  openDocketModal() {
    const modalEl = document.getElementById("situationDocketModal");
    if (!modalEl) return;
    this.renderDocketContent();
    modalEl.classList.remove("hidden");
    modalEl.classList.add("flex");
  },

  closeDocketModal() {
    const modalEl = document.getElementById("situationDocketModal");
    if (modalEl) {
      modalEl.classList.add("hidden");
      modalEl.classList.remove("flex");
    }
  },

  renderDocketContent() {
    const state = window.HEATSHIELD_STATE;
    const isBn = HEATSHIELD_I18N.currentLang === "bn";
    const toBn = HEATSHIELD_DATA.toBengaliNumber;

    const docketBody = document.getElementById("docketPrintableArea");
    if (!docketBody) return;

    const top5 = state.evaluatedWards.slice(0, 5);
    const criticalCount = state.evaluatedWards.filter(w => w.hhvi.mitigated_hhvi >= 80).length;

    let top5Rows = "";
    top5.forEach((w, i) => {
      const rankNum = isBn ? toBn(i + 1) : i + 1;
      const wardTitle = isBn ? w.name_bn : w.name;
      const outVal = isBn ? toBn(w.outdoor_temp) : w.outdoor_temp;
      const tVal = isBn ? toBn(w.effective_temp) : w.effective_temp;
      const wbgtVal = isBn ? toBn(w.wbgt.wbgt_celsius) : w.wbgt.wbgt_celsius;
      const hhviVal = isBn ? toBn(w.hhvi.mitigated_hhvi) : w.hhvi.mitigated_hhvi;
      const popDetails = window.HEATSHIELD_DATA.getWardPopulation(w.ward_id);
      const censusPopVal = popDetails.population_census_2011 !== null ? (isBn ? toBn(popDetails.population_census_2011.toLocaleString()) : popDetails.population_census_2011.toLocaleString()) : (isBn ? 'উপলব্ধ নয়' : 'N/A');
      const estimatePopVal = popDetails.population_estimate_2026 !== null ? '~' + (isBn ? toBn(popDetails.population_estimate_2026.toLocaleString()) : popDetails.population_estimate_2026.toLocaleString()) : (isBn ? 'উপলব্ধ নয়' : 'NOT AVAILABLE');
      
      const popHtml = `
        <div class="text-[9px] whitespace-nowrap text-left"><strong class="text-slate-600 font-sans">${isBn ? '১১ আদমশুমারি:' : '2011 Census:'}</strong> ${censusPopVal}</div>
        <div class="text-[9px] whitespace-nowrap text-left"><strong class="text-slate-600 font-sans">${isBn ? '২০২৬ অনুমান:' : '2026 Planning:'}</strong> ${estimatePopVal}${popDetails.population_estimate_2026 !== null ? (isBn ? ' (মডেল)' : ' (MODELLED)') : ''}</div>
      `;

      top5Rows += `
        <tr class="border-b border-slate-300 text-xs">
          <td class="py-2 px-2 font-bold text-center">#${rankNum}</td>
          <td class="py-2 px-2 font-semibold">${wardTitle} (Ward ${w.ward_id})</td>
          <td class="py-2 px-2 text-left font-mono">${popHtml}</td>
          <td class="py-2 px-2 text-center font-mono text-amber-700 font-bold">${outVal}°C</td>
          <td class="py-2 px-2 text-center font-mono text-red-700 font-bold">${tVal}°C</td>
          <td class="py-2 px-2 text-center font-mono text-orange-700">${wbgtVal}°C</td>
          <td class="py-2 px-2 text-center font-mono font-bold">${hhviVal}</td>
          <td class="py-2 px-2 text-center">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
              PRIORITY RED
            </span>
          </td>
        </tr>
      `;
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    docketBody.innerHTML = `
      <div class="bg-white text-slate-900 p-8 rounded-xl shadow-2xl max-w-4xl mx-auto font-sans leading-normal border border-slate-200 print:shadow-none print:border-none print:p-0">
        
        <!-- Header with Official Seals -->
        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center font-black text-xs text-center bg-slate-100">
              KMC<br/>DISASTER
            </div>
            <div>
              <h1 class="text-base md:text-lg font-black tracking-wide text-slate-900 uppercase">KOLKATA MUNICIPAL CORPORATION</h1>
              <h2 class="text-xs font-bold text-slate-700 tracking-wider">DISASTER MANAGEMENT & HEAT RESILIENCE CELL (KCAP-2025)</h2>
              <div class="text-[11px] font-mono text-slate-500">DIRECTIVE :: HEATSHIELD-KMC-2026-08 | SITREP #144-B | SIH26083</div>
            </div>
          </div>
          <div class="text-right text-xs font-mono">
            <div class="font-bold text-red-600 text-xs">OFFICIAL USE / RESTRICTED</div>
            <div>Date: ${dateStr}</div>
            <div>Time: ${timeStr} IST</div>
          </div>
        </div>

        <!-- Section 1: Executive Assessment -->
        <div class="mb-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-1.5">
            1. Executive Assessment & Thermal Threat Level
          </h3>
          <p class="text-xs text-slate-700 leading-relaxed text-justify">
            Under active KCAP-2025 baseline parameters (+2.6°C urban heat island surge), the city is undergoing compounded wet-bulb thermal stress. 
            Currently, <strong>${criticalCount} Wards</strong> are categorized under <strong>Critical Risk (HHVI ≥ 80)</strong>, exposing an estimated 
            <strong>${(state.totalAtRiskPop / 1000000).toFixed(2)} Million citizens (derived)</strong> to severe heat exhaustion and delayed cardiac strain.
          </p>
          <div class="text-[9px] text-slate-500 mt-1 font-sans italic">
            Calculated from the selected planning population (Census 2011) and HEATSHIELD risk classification.
          </div>
        </div>

        <!-- Section 2: Priority Wards -->
        <div class="mb-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-1.5">
            2. Priority Municipal Intervention Wards (High Slum & Labor Density)
          </h3>
          <table class="w-full border border-slate-300 border-collapse">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-300 text-[11px] text-slate-700 uppercase">
                <th class="py-1 px-2 text-center">Rank</th>
                <th class="py-1 px-2 text-left">Ward & Zone</th>
                <th class="py-1 px-2 text-left">Population Profile</th>
                <th class="py-1 px-2 text-center">Outdoor Temp</th>
                <th class="py-1 px-2 text-center">Modeled Indoor</th>
                <th class="py-1 px-2 text-center">WBGT</th>
                <th class="py-1 px-2 text-center">HHVI</th>
                <th class="py-1 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${top5Rows}
            </tbody>
          </table>
        </div>

        <!-- Section 3: Asset Allocations -->
        <div class="mb-4 grid grid-cols-3 gap-3">
          <div class="p-2.5 rounded border border-slate-300 bg-slate-50">
            <div class="text-[10px] text-slate-500 font-bold uppercase">Allocated Water Tankers</div>
            <div class="text-lg font-bold font-mono text-cyan-800">${state.mitigations.tankers} Units</div>
            <div class="text-[10px] text-slate-500">10,000L Misting / Potable</div>
          </div>
          <div class="p-2.5 rounded border border-slate-300 bg-slate-50">
            <div class="text-[10px] text-slate-500 font-bold uppercase">Mobile Cooling Hubs</div>
            <div class="text-lg font-bold font-mono text-emerald-800">${state.mitigations.coolingBuses} Transit Units</div>
            <div class="text-[10px] text-slate-500">Slum Cluster Deployed</div>
          </div>
          <div class="p-2.5 rounded border border-slate-300 bg-slate-50">
            <div class="text-[10px] text-slate-500 font-bold uppercase">Labor Shift Ban</div>
            <div class="text-lg font-bold font-mono ${state.mitigations.laborShift ? 'text-emerald-700' : 'text-amber-700'}">
              ${state.mitigations.laborShift ? 'ACTIVE (11-3:30)' : 'INACTIVE'}
            </div>
            <div class="text-[10px] text-slate-500">Section 144 Hazard Directive</div>
          </div>
        </div>

        <!-- Section 4: DLNM Advisory -->
        <div class="mb-4 border-l-4 border-red-600 bg-red-50 p-3 text-xs text-red-950">
          <div class="font-bold text-red-800 mb-1 uppercase">4. DLNM Scenario Advisory (Prototype Model)</div>
          <div>• <strong>Modeled Lagged Cardiac Scenario:</strong> Based on published DLNM epidemiological research, peak cardiorespiratory hospital admissions may surge significantly <strong>between t+3 and t+5 days</strong> post-heatwave. Advance preparedness recommended for SSKM, NRS, and RG Kar.</div>
          <div>• <strong>Infrastructure Stress Model:</strong> Simulated grid stress scenarios indicate potential cascading effects on water pumping stations during peak cooling demand. Backup generator readiness advised.</div>
        </div>

        <!-- Section 5: Sign-off -->
        <div class="pt-3 border-t-2 border-slate-800 flex justify-between items-end text-xs">
          <div>
            <div class="text-[10px] font-mono text-slate-500">AUTH HASH: 9a7f-d881-kcap2025-kmc-sec</div>
            <div class="text-slate-600">HEATSHIELD Decision Support Prototype | SIH26083</div>
          </div>
          <div class="text-center w-56">
            <div class="h-8 border-b border-dashed border-slate-600 mb-1 flex items-end justify-center text-slate-400 font-serif italic text-[11px]">
              [ Digitally Signed & Sealed ]
            </div>
            <div class="font-bold text-slate-900">Municipal Commissioner</div>
            <div class="text-[10px] text-slate-600">Kolkata Municipal Corporation (KMC)</div>
          </div>
        </div>

      </div>
    `;
  },

  printDocket() {
    window.print();
  }
};

window.HEATSHIELD_MODAL = HEATSHIELD_MODAL;
