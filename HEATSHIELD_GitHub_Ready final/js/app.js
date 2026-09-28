/**
 * HEATSHIELD :: Central Application Controller & State Orchestrator (SIH26083)
 * Full Reactive State, Dual-Theme Engine, Action Lifecycle, & Interactive Workflows
 */

window.HEATSHIELD_APP = {
  _isNavigating: false,
  state: {
    theme: localStorage.getItem("heatshield_theme") || "light",
    language: "en",
    currentPage: "overview",
    selectedWardId: 17,
    comparedWardIds: [17, 88],
    evaluatedWards: [],
    criticalWardsCount: 0,
    highWardsCount: 0,
    totalAtRiskPop: 0,
    peakTemp: 41.2,
    resources: {
      tankers: { total: 25, deployed: 14, available: 11 },
      coolingHubs: { total: 15, deployed: 8, available: 7 },
      medicalTeams: { total: 10, deployed: 6, available: 4 },
      officers: { total: 40, deployed: 28, available: 12 }
    },
    fleetList: [
      { id: "TK-01", type: "Water Tanker", cap: "10,000L", ward: 17, status: "EN ROUTE", eta: "12 min", driver: "R. Sharma", contact: "98301-XXXXX" },
      { id: "TK-08", type: "Water Tanker", cap: "12,000L", ward: 17, status: "ACTIVE", eta: "On Site", driver: "A. Ghosh", contact: "98302-XXXXX" },
      { id: "TK-12", type: "Water Tanker", cap: "10,000L", ward: 58, status: "ASSIGNED", eta: "25 min", driver: "S. Roy", contact: "98303-XXXXX" },
      { id: "TK-03", type: "Water Tanker", cap: "8,000L", ward: 63, status: "AVAILABLE", eta: "Ready Depot", driver: "B. Das", contact: "98304-XXXXX" },
      { id: "CH-01", type: "Cooling Hub", cap: "120 beds", ward: 17, status: "ACTIVE", eta: "Operational", driver: "N/A", contact: "Ward Office" },
      { id: "CH-04", type: "Cooling Hub", cap: "80 beds", ward: 72, status: "ACTIVE", eta: "Operational", driver: "N/A", contact: "Para Club" },
      { id: "MT-02", type: "Medical Team", cap: "4 Staff + ORS", ward: 63, status: "EN ROUTE", eta: "15 min", driver: "Dr. Sen", contact: "98305-XXXXX" },
      { id: "MT-05", type: "Medical Team", cap: "3 Staff + Triage", ward: 58, status: "ACTIVE", eta: "On Site", driver: "Dr. Banerjee", contact: "98306-XXXXX" }
    ],
    responseQueue: [
      { id: "ACT-101", ward_id: 17, name: "Burrabazar Central", risk: 88, risk_level: "CRITICAL", reason: "Severe slum heat trap & high elderly vendor density", action: "Deploy 2 Water Tankers & Activate Misting", status: "RECOMMENDED", priority: "URGENT" },
      { id: "ACT-102", ward_id: 58, name: "Seven Tanks Estate", risk: 82, risk_level: "CRITICAL", reason: "Substation overload risk + unshaded industrial labor zone", action: "Open Pop-Up AC Cooling Hub at Community Hall", status: "REVIEWED", priority: "URGENT" },
      { id: "ACT-103", ward_id: 63, name: "Dum Dum Road / Tala", risk: 78, risk_level: "HIGH", reason: "High infant dehydration risk & low water pressure", action: "Dispatch ASHA ORS Rapid Distribution Squad", status: "APPROVED", priority: "HIGH" },
      { id: "ACT-104", ward_id: 72, name: "Lake Town Connector", risk: 74, risk_level: "HIGH", reason: "Outdoor construction worker exposure during peak sun", action: "Enforce Afternoon Labor Pause Advisory (12-4 PM)", status: "ASSIGNED", priority: "HIGH" },
      { id: "ACT-105", ward_id: 88, name: "Tollygunge Basin", risk: 62, risk_level: "MODERATE", reason: "Canopy deficit and elevated evening apparent heat index", action: "Pre-position Emergency Electrolyte Booths", status: "RECOMMENDED", priority: "MODERATE" }
    ],
    alertLogs: [
      { time: "09:15 IST", text: "Ward 17 thermal stress crossed 42.0°C threshold (Severe Risk)", type: "critical" },
      { time: "09:05 IST", text: "Water Tanker TK-08 arrived at Burrabazar Market", type: "safe" },
      { time: "08:45 IST", text: "CESC Grid Substation Feeder 4 in Ward 63 under elevated load", type: "high" },
      { time: "08:30 IST", text: "Live meteorological telemetry synchronized with Alipore WMO Station", type: "info" }
    ],
    notifications: [
      { id: 1, title: "Critical Heat Alert: Ward 17", desc: "Apparent Temp 46.8°C with acute slum vulnerability.", time: "10m ago", read: false, type: "critical" },
      { id: 2, title: "Substation Load Warning", desc: "Feeder 4 reaching 124% capacity in Tala basin.", time: "25m ago", read: false, type: "high" },
      { id: 3, title: "Weather Update", desc: "Alipore station confirms heatwave conditions.", time: "1h ago", read: false, type: "info" }
    ],
    presentationSlideIndex: 0,
    emergencyMode: false,
    emergencyStartedAt: null,
    emergencyIncidentId: null,
    emergencyTimeline: [],
    emergencyActiveWardId: 17,
    emergencyPreviousPage: "overview",
    emergencyDeepAnalysisOpen: false,
    emergencyTimerInterval: null
  },

  /**
   * Application Bootstrap
   */
  async init() {
    console.log("🛡️ HEATSHIELD :: Initializing Decision Support Engine...");

    // 1. Evaluate All 144 Wards First (Synchronous baseline)
    this.evaluateAllWards();
    window.HEATSHIELD_STATE = this.state;

    // 2. Apply Theme
    this.setTheme(this.state.theme);

    // 3. Pre-render all page modules so every section exists in the DOM
    const allPages = ["overview", "heat-intel", "ward-intel", "heatmap", "response", "resources", "scenarios", "reports", "emergency"];
    allPages.forEach(pid => this.renderPage(pid));

    // 4. Navigate to Initial Page (Support direct URL hash routing)
    const initialHash = (window.location && window.location.hash) ? window.location.hash.replace("#", "").trim() : "";
    const startPage = allPages.includes(initialHash) ? initialHash : (this.state.currentPage || "overview");
    this.navigateTo(startPage, false);

    // 5. Update Header & Notification Badges
    this.updateHeaderMetrics();
    this.updateNotificationCount();
    this.updateHeaderHeight();

    // 5b. Synchronize Header Height on Resize for dynamic sticky offsets
    window.addEventListener("resize", () => {
      this.updateHeaderHeight();
    });

    // 6. Setup Global Click Handlers, Outside Dismissals & History Popstate
    document.addEventListener("click", (e) => {
      const dropdown = document.getElementById("searchDropdownMenu");
      if (dropdown && !e.target.closest(".header-search-container")) {
        dropdown.classList.remove("show");
      }
      // Close mobile sidebar when clicking outside
      const sidebar = document.getElementById("sidebar");
      if (sidebar && sidebar.classList.contains("open") && !e.target.closest("#sidebar") && !e.target.closest("#menuToggle")) {
        sidebar.classList.remove("open");
      }
    });

    // Browser History (Back / Forward Navigation)
    window.addEventListener("popstate", (e) => {
      const hash = (window.location && window.location.hash) ? window.location.hash.replace("#", "").trim() : "";
      if (hash && hash !== this.state.currentPage && allPages.includes(hash)) {
        this.navigateTo(hash, false);
      }
    });

    // Global Keyboard Navigation (Escape key to dismiss overlays, Arrow keys for presentation)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
        this.closeBulkWarningModal();
        this.closeAiAssistant();
        this.closePresentationMode();
        this.closeNotificationDrawer();
        const dropdown = document.getElementById("searchDropdownMenu");
        if (dropdown) dropdown.classList.remove("show");
        const sidebar = document.getElementById("sidebar");
        if (sidebar && sidebar.classList.contains("open")) sidebar.classList.remove("open");
      } else if (e.key === "ArrowRight") {
        const pres = document.getElementById("presentationOverlayBackdrop");
        if (pres && pres.classList.contains("show")) {
          this.nextPresentationSlide();
        }
      } else if (e.key === "ArrowLeft") {
        const pres = document.getElementById("presentationOverlayBackdrop");
        if (pres && pres.classList.contains("show")) {
          this.prevPresentationSlide();
        }
      }
    });

    // Synchronize sidebar active indicator with scrolling position
    window.addEventListener("scroll", () => {
      if (this._isNavigating) return;
      const headerHeight = 75;
      const containers = document.querySelectorAll(".page-container");
      let currentSection = null;
      containers.forEach(c => {
        const top = c.getBoundingClientRect().top;
        if (top <= headerHeight + 60) {
          currentSection = c.getAttribute("data-page");
        }
      });
      if (currentSection && currentSection !== this.state.currentPage) {
        this.state.currentPage = currentSection;
        document.querySelectorAll(".sidebar .nav-item").forEach(item => {
          item.classList.toggle("active", item.getAttribute("data-page") === currentSection);
        });
      }
    }, { passive: true });

    // 6. Fetch Live Weather Telemetry (Async background sync)
    if (window.HEATSHIELD_ENGINE && typeof window.HEATSHIELD_ENGINE.fetchLiveWeather === "function") {
      try {
        const isLive = await window.HEATSHIELD_ENGINE.fetchLiveWeather();
        if (isLive) {
          this.evaluateAllWards();
          this.updateHeaderMetrics();
          this.renderPage(this.state.currentPage);
        }
      } catch (err) {
        console.warn("HEATSHIELD: Live weather sync deferred:", err.message);
      }
    }

    console.log("✅ HEATSHIELD :: Fully Loaded and Operational with 144 Wards.");
  },

  /**
   * Evaluate all wards through mathematical engines
   */
  evaluateAllWards() {
    const data = window.HEATSHIELD_DATA;
    const engine = window.HEATSHIELD_ENGINE;
    if (!data || !engine || !Array.isArray(data.ALL_WARDS)) return;

    const weather = engine.liveWeather || { temp: 40.8, rh: 64, wind_speed_kmh: 14.5 };
    let criticalCount = 0;
    let highCount = 0;
    let totalRiskPop = 0;
    let maxTemp = 0;

    const evaluated = data.ALL_WARDS.map(ward => {
      const outdoorTemp = engine.calculateOutdoorTemp ? engine.calculateOutdoorTemp(ward, "now", "noon") : (ward.base_temp || weather.temp);
      const effectiveTemp = engine.calculateEffectiveTemp ? engine.calculateEffectiveTemp(ward, true, "now", "noon") : (outdoorTemp + (ward.slum_density * 4.0));
      const wbgtResult = engine.calculateWBGT ? engine.calculateWBGT(effectiveTemp, weather.rh || 64) : { wbgt_celsius: 33.5 };
      const utciResult = engine.calculateUTCI ? engine.calculateUTCI(effectiveTemp, weather.rh || 64, weather.wind_speed_kmh || 14.5) : { utci_celsius: Number((effectiveTemp + 3.8).toFixed(1)), wb_utci_celsius: Number((effectiveTemp + 2.2).toFixed(1)), category: "VERY STRONG HEAT STRESS", stress_level: "HIGH" };
      const confidence = engine.calculateDataConfidence ? engine.calculateDataConfidence(ward) : { percentage: 95, status: "High Confidence", grade: "A" };
      const hhviResult = engine.calculateHHVI ? engine.calculateHHVI(ward, effectiveTemp, "may") : { mitigated_hhvi: 75, risk_level: "high", risk_color: "#F97316" };
      const advisory = engine.calculateHeatStressAdvisory ? engine.calculateHeatStressAdvisory(effectiveTemp, weather.rh || 64, ward.slum_density || 0.5, ward.elderly_worker_ratio || 0.5) : {};

      const pop = ward.population_active_for_planning || ward.population_census_2011 || ward.population || 30000;
      const riskLevel = (hhviResult.risk_level || "SAFE").toUpperCase();

      let cleanName = ward.name || `Ward ${ward.ward_id}`;
      const nameMatch = cleanName.match(/^Ward\s+\d+\s*[-–—]\s*(.*)$/i);
      if (nameMatch && nameMatch[1]) {
        cleanName = nameMatch[1].trim();
      }

      const evalWard = {
        ...ward,
        name: cleanName,
        full_name: `Ward ${ward.ward_id} – ${cleanName}`,
        population: pop,
        outdoor_temp: outdoorTemp,
        effective_temp: effectiveTemp,
        wbgt: wbgtResult.wbgt_celsius,
        utci: utciResult.utci_celsius,
        wb_utci: utciResult.wb_utci_celsius,
        utci_category: utciResult.category,
        utci_stress: utciResult.stress_level,
        confidence: confidence,
        hhvi: hhviResult,
        risk_level: riskLevel,
        risk_color: hhviResult.risk_color,
        advisory: advisory
      };

      if (evalWard.risk_level === "CRITICAL") {
        criticalCount++;
        totalRiskPop += pop;
      } else if (evalWard.risk_level === "HIGH") {
        highCount++;
        totalRiskPop += Math.round(pop * 0.6);
      }

      if (evalWard.effective_temp > maxTemp) maxTemp = evalWard.effective_temp;

      return evalWard;
    });

    // Sort descending by mitigated HHVI
    evaluated.sort((a, b) => {
      const scoreA = a.hhvi ? a.hhvi.mitigated_hhvi : 0;
      const scoreB = b.hhvi ? b.hhvi.mitigated_hhvi : 0;
      return scoreB - scoreA;
    });

    this.state.evaluatedWards = evaluated;
    this.state.criticalWardsCount = criticalCount;
    this.state.highWardsCount = highCount;
    this.state.totalAtRiskPop = totalRiskPop;
    this.state.peakTemp = Number(maxTemp.toFixed(1));

    // Ensure selectedWardId points to a valid evaluated ward
    if (!evaluated.some(w => w.ward_id === this.state.selectedWardId) && evaluated.length > 0) {
      this.state.selectedWardId = evaluated[0].ward_id;
    }

    // Calculate Adaptive DLNM series
    if (window.HEATSHIELD_ADAPTIVE_DLNM && typeof engine.calculateDLNMSeries === "function") {
      this.state.dlnmSeries = engine.calculateDLNMSeries(75, maxTemp || weather.temp);
    }

    return evaluated;
  },

  /**
   * SPA Page Navigation
   */
  navigateTo(pageId, pushHash = true) {
    this.state.currentPage = pageId;
    this._isNavigating = true;

    // Sync URL hash for browser history & bookmarking
    if (pushHash && typeof window !== "undefined" && window.location) {
      if (window.location.hash !== `#${pageId}`) {
        window.history.pushState({ page: pageId }, "", `#${pageId}`);
      }
    }

    // Update Sidebar Active state
    document.querySelectorAll(".sidebar .nav-item").forEach(item => {
      item.classList.toggle("active", item.getAttribute("data-page") === pageId);
    });

    // Update Decision Pipeline Workflow Stepper active button
    this.updateWorkflowStepper(pageId);

    // Toggle Page Container Visibility
    document.querySelectorAll(".page-container").forEach(c => {
      c.classList.remove("active");
    });

    const targetEl = document.querySelector(`.page-container[data-page="${pageId}"]`);
    if (targetEl) {
      targetEl.classList.add("active");
    }

    // Render Target Page Module
    this.renderPage(pageId);

    // Close mobile sidebar if open
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");

    // Invalidate GIS map if navigating to heatmap or overview
    if (window.HEATSHIELD_MAP) {
      if (pageId === "heatmap") {
        [50, 150, 350].forEach(delay => {
          setTimeout(() => {
            const m = window.HEATSHIELD_MAP.maps["heatmapFullMap"];
            if (m && typeof m.invalidateSize === "function") {
              m.invalidateSize();
            }
          }, delay);
        });
      } else if (pageId === "overview") {
        [50, 150, 350].forEach(delay => {
          setTimeout(() => {
            const m = window.HEATSHIELD_MAP.maps["overviewMap"];
            if (m && typeof m.invalidateSize === "function") {
              m.invalidateSize();
            }
          }, delay);
        });
      } else if (pageId === "emergency") {
        [50, 150, 350].forEach(delay => {
          setTimeout(() => {
            const m = window.HEATSHIELD_MAP.maps["emergencyMap"];
            if (m && typeof m.invalidateSize === "function") {
              m.invalidateSize();
            }
          }, delay);
        });
      }
    }

    // Auto-scroll smoothly to that area
    if (targetEl && typeof window !== "undefined" && window.scrollTo) {
      const performScroll = () => {
        if (pageId === "overview" || pageId === "emergency") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const header = document.querySelector(".top-header");
          const headerHeight = header ? header.offsetHeight : 62;
          const rect = targetEl.getBoundingClientRect ? targetEl.getBoundingClientRect() : { top: 0 };
          const targetY = (window.pageYOffset || 0) + rect.top - headerHeight - 10;
          window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        }
      };

      performScroll();
      setTimeout(performScroll, 50);
      setTimeout(() => {
        performScroll();
        this._isNavigating = false;
      }, 400);
    } else {
      this._isNavigating = false;
    }
  },

  updateWorkflowStepper(pageId) {
    const pageToStep = {
      "overview": 0,
      "early-warning": 0,
      "heatmap": 1,
      "heat-intel": 1,
      "ward-intel": 2,
      "hospital-impact": 3,
      "recommendations": 4,
      "response": 5,
      "emergency": 5,
      "resources": 5,
      "scenarios": 4,
      "reports": 6
    };
    const stepIdx = pageToStep[pageId];
    if (stepIdx !== undefined) {
      document.querySelectorAll(".workflow-step-btn").forEach(btn => {
        const btnStep = parseInt(btn.getAttribute("data-step"), 10);
        btn.classList.toggle("active", btnStep === stepIdx);
        btn.classList.toggle("completed", btnStep < stepIdx);
      });
    }

    // Update Stepper Context Pill
    this.updatePipelineContextPill();
  },

  updatePipelineContextPill() {
    const pill = document.getElementById("pipelineContextPill");
    const label = document.getElementById("pipelineContextLabel");
    if (!pill || !label) return;

    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === this.state.selectedWardId) || (this.state.evaluatedWards || [])[0];
    if (ward) {
      const riskTier = (ward.riskLevel || "High").toUpperCase();
      const dot = (typeof pill.querySelector === "function") ? pill.querySelector(".context-indicator-dot") : null;
      if (dot && dot.style) {
        dot.style.background = ward.riskLevel === "critical" ? "var(--critical)" : ward.riskLevel === "high" ? "var(--high)" : "var(--safe)";
        dot.style.boxShadow = `0 0 6px ${dot.style.background}`;
      }
      if ("textContent" in label) {
        label.textContent = `Ward ${ward.ward_id} · ${riskTier} (${(ward.riskScore || 0).toFixed(0)})`;
      }
    } else {
      if ("textContent" in label) {
        label.textContent = "KMC Citywide Surveillance";
      }
    }
  },

  /**
   * Render active page module
   */
  renderPage(pageId) {
    const modules = {
      "overview": window.HEATSHIELD_PAGE_OVERVIEW,
      "early-warning": window.HEATSHIELD_PAGE_EARLY_WARNING,
      "heat-intel": window.HEATSHIELD_PAGE_HEAT_INTEL,
      "ward-intel": window.HEATSHIELD_PAGE_WARD_INTEL,
      "hospital-impact": window.HEATSHIELD_PAGE_HOSPITAL_IMPACT,
      "recommendations": window.HEATSHIELD_PAGE_RECOMMENDATIONS,
      "heatmap": window.HEATSHIELD_PAGE_HEATMAP,
      "response": window.HEATSHIELD_PAGE_RESPONSE,
      "resources": window.HEATSHIELD_PAGE_RESOURCES,
      "scenarios": window.HEATSHIELD_PAGE_SCENARIOS,
      "reports": window.HEATSHIELD_PAGE_REPORTS,
      "emergency": window.HEATSHIELD_PAGE_EMERGENCY
    };

    // Maintain persistent deep-analysis return banner if in emergency mode and browsing analytics
    if (this.state.emergencyMode && pageId !== "emergency") {
      let banner = document.getElementById("emergencyDeepAnalysisBanner");
      if (!banner && typeof document !== "undefined" && document.createElement) {
        banner = document.createElement("div");
        banner.id = "emergencyDeepAnalysisBanner";
        banner.className = "emergency-deep-analysis-sticky-banner";
        const mainEl = document.querySelector(".main-content");
        if (mainEl && mainEl.prepend) mainEl.prepend(banner);
      }
      if (banner) {
        banner.innerHTML = `
          <div class="flex items-center justify-between flex-wrap gap-2" style="background: rgba(239,68,68,0.12); border: 1px solid var(--critical); padding: 8px 16px; border-radius: 6px; margin: 12px 16px 0 16px;">
            <div class="flex items-center gap-2">
              <span class="emergency-pulse-dot active"></span>
              <span class="font-bold text-xs" style="color: var(--text-primary);">🔴 EMERGENCY MODE ACTIVE (${this.state.emergencyIncidentId || 'ACTIVE'}) — Viewing Deep Analysis</span>
            </div>
            <button class="btn btn-primary btn-xs" style="background: var(--critical); border-color: var(--critical); color:#FFF; font-weight:800;" onclick="HEATSHIELD_APP.returnToEmergencyFromDeepAnalysis()">
              ⬅️ RETURN TO OPERATIONAL COMMAND
            </button>
          </div>
        `;
        banner.style.display = "block";
      }
    } else {
      const banner = document.getElementById("emergencyDeepAnalysisBanner");
      if (banner) banner.style.display = "none";
    }

    const mod = modules[pageId];
    if (mod && typeof mod.render === "function") {
      mod.render(this.state);
    }
  },

  /**
   * Select a ward globally across the entire application
   */
  selectWard(wardId, navigateToWardIntel = false) {
    const id = parseInt(wardId, 10);
    if (isNaN(id) || id < 1) return;
    const exists = (this.state.evaluatedWards || []).some(w => w.ward_id === id);
    if (!exists && (this.state.evaluatedWards || []).length > 0) return;
    this.state.selectedWardId = id;
    
    // Update Stepper Context Pill
    this.updatePipelineContextPill();

    // Refresh current view if relevant
    if (this.state.currentPage === "ward-intel" && window.HEATSHIELD_PAGE_WARD_INTEL) {
      window.HEATSHIELD_PAGE_WARD_INTEL.render(this.state);
    } else if (this.state.currentPage === "hospital-impact" && window.HEATSHIELD_PAGE_HOSPITAL_IMPACT) {
      window.HEATSHIELD_PAGE_HOSPITAL_IMPACT.render(this.state);
    } else if (this.state.currentPage === "recommendations" && window.HEATSHIELD_PAGE_RECOMMENDATIONS) {
      window.HEATSHIELD_PAGE_RECOMMENDATIONS.render(this.state);
    } else if (navigateToWardIntel) {
      this.navigateTo("ward-intel");
    }

    // Fly map camera if on map page
    if (window.HEATSHIELD_MAP) {
      const targetContainer = this.state.currentPage === "overview" ? "overviewMap" : "heatmapFullMap";
      window.HEATSHIELD_MAP.flyToWard(this.state.selectedWardId, targetContainer);
    }
  },

  /**
   * Toggle Theme (Light <-> Dark)
   */
  toggleTheme() {
    const newTheme = this.state.theme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
    this.showToast(`Switched to ${newTheme.toUpperCase()} mode`, "info");
  },

  setTheme(theme) {
    this.state.theme = theme;
    localStorage.setItem("heatshield_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    const icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";

    // Update Map Basemap Tiles
    if (window.HEATSHIELD_MAP) {
      window.HEATSHIELD_MAP.updateTheme();
    }

    // Re-render active page charts if any
    this.renderPage(this.state.currentPage);
  },

  /**
   * Toggle Language (English <-> Bengali)
   */
  toggleLanguage() {
    this.state.language = this.state.language === "en" ? "bn" : "en";
    const text = document.getElementById("langToggleText");
    if (text) text.textContent = this.state.language === "bn" ? "English (EN)" : "বাংলা (BN)";
    this.showToast(`Language set to ${this.state.language === "bn" ? "বাংলা" : "English"}`, "info");
    this.renderPage(this.state.currentPage);
  },

  /**
   * Refresh Live Meteorological Telemetry from Open-Meteo
   */
  async refreshLiveData() {
    const icon = document.getElementById("refreshIcon");
    if (icon) icon.style.display = "inline-block";
    
    this.showToast("Synchronizing live satellite & meteorological telemetry...", "info");

    if (window.HEATSHIELD_ENGINE) {
      await window.HEATSHIELD_ENGINE.fetchLiveWeather();
    }

    this.evaluateAllWards();
    this.updateHeaderMetrics();
    this.renderPage(this.state.currentPage);

    this.showToast("✓ Live weather telemetry refreshed successfully!", "success");
  },

  updateHeaderMetrics() {
    const statusText = document.getElementById("weatherStatusText");
    const engine = window.HEATSHIELD_ENGINE;
    if (statusText && engine && engine.liveWeather) {
      statusText.textContent = `${engine.liveWeather.temp}°C · ${engine.liveWeather.apparent_temp}°C feels`;
    }
  },

  /**
   * Global Search Auto-Complete & Filter
   */
  handleGlobalSearch(query) {
    const dropdown = document.getElementById("searchDropdownMenu");
    if (!dropdown) return;

    const q = (query || "").trim().toLowerCase();
    if (!q) {
      dropdown.classList.remove("show");
      return;
    }

    const wards = this.state.evaluatedWards || [];
    const matchedWards = wards.filter(w => 
      w.name.toLowerCase().includes(q) || 
      String(w.ward_id).includes(q) || 
      (w.borough && String(w.borough).toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedFleet = this.state.fleetList.filter(f => 
      f.id.toLowerCase().includes(q) || 
      f.type.toLowerCase().includes(q) || 
      f.driver.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedActions = this.state.responseQueue.filter(a => 
      a.action.toLowerCase().includes(q) || 
      a.reason.toLowerCase().includes(q)
    ).slice(0, 3);

    if (matchedWards.length === 0 && matchedFleet.length === 0 && matchedActions.length === 0) {
      dropdown.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-tertiary); font-size: 12px;">No results found for "${query}"</div>`;
      dropdown.classList.add("show");
      return;
    }

    let html = '';

    if (matchedWards.length > 0) {
      html += `<div class="search-group-title">Wards & Localities (${matchedWards.length})</div>`;
      html += matchedWards.map(w => `
        <div class="search-result-item" onclick="HEATSHIELD_APP.selectWard(${w.ward_id}, true); HEATSHIELD_APP.clearGlobalSearch();">
          <div class="flex items-center gap-2">
            <span class="status-dot ${w.risk_level.toLowerCase()}"></span>
            <div>
              <div class="font-bold text-xs">Ward ${w.ward_id} – ${w.name}</div>
              <div class="text-xxs text-muted">Borough: ${w.borough || 'Central'} · Pop: ${this.formatPop(w.population)}</div>
            </div>
          </div>
          <span class="risk-badge ${w.risk_level.toLowerCase()}">${w.risk_level}</span>
        </div>
      `).join("");
    }

    if (matchedFleet.length > 0) {
      html += `<div class="search-group-title">Resources & Fleet (${matchedFleet.length})</div>`;
      html += matchedFleet.map(f => `
        <div class="search-result-item" onclick="HEATSHIELD_APP.navigateTo('resources'); HEATSHIELD_APP.clearGlobalSearch();">
          <div class="flex items-center gap-2">
            <span>🚛</span>
            <div>
              <div class="font-bold text-xs">${f.id} (${f.type})</div>
              <div class="text-xxs text-muted">Driver: ${f.driver} · Ward: ${f.ward}</div>
            </div>
          </div>
          <span class="provenance-badge ${f.status === 'ACTIVE' ? 'source' : 'simulation'}">${f.status}</span>
        </div>
      `).join("");
    }

    if (matchedActions.length > 0) {
      html += `<div class="search-group-title">Emergency Response Actions (${matchedActions.length})</div>`;
      html += matchedActions.map(a => `
        <div class="search-result-item" onclick="HEATSHIELD_APP.navigateTo('response'); HEATSHIELD_APP.clearGlobalSearch();">
          <div class="flex items-center gap-2">
            <span>🚨</span>
            <div>
              <div class="font-bold text-xs">${a.action}</div>
              <div class="text-xxs text-muted">Ward ${a.ward_id} (${a.name}) · ${a.status}</div>
            </div>
          </div>
          <span class="risk-badge ${a.priority === 'URGENT' ? 'critical' : 'high'}">${a.priority}</span>
        </div>
      `).join("");
    }

    dropdown.innerHTML = html;
    dropdown.classList.add("show");
  },

  clearGlobalSearch() {
    const input = document.getElementById("globalSearchInput");
    if (input) input.value = "";
    const dropdown = document.getElementById("searchDropdownMenu");
    if (dropdown) dropdown.classList.remove("show");
  },

  /**
   * Stacking context & layout geometry synchronization
   */
  updateHeaderHeight() {
    if (typeof document === "undefined") return;
    const headerRegion = document.getElementById("commandHeaderRegion") || document.querySelector(".command-header-region");
    if (headerRegion && document.documentElement) {
      const h = headerRegion.offsetHeight || 58;
      document.documentElement.style.setProperty("--header-actual-height", `${h}px`);
    }
  },

  /**
   * Notification Center Drawer
   */
  openNotificationDrawer() {
    const drawer = document.getElementById("notifDrawerBackdrop");
    if (!drawer) return;

    const list = document.getElementById("notifListContainer");
    if (list) {
      list.innerHTML = `
        <div class="flex flex-col gap-3">
          ${this.state.notifications.map(n => `
            <div style="padding: 12px; background: ${n.read ? 'var(--bg-muted)' : 'var(--bg-card)'}; border: 1px solid ${n.read ? 'var(--border)' : 'var(--primary-border)'}; border-radius: 8px;">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-xs" style="color: var(--text-primary);">${n.title}</span>
                <span class="text-xxs text-muted">${n.time}</span>
              </div>
              <div class="text-xs text-secondary">${n.desc}</div>
            </div>
          `).join("")}

          <div class="font-bold text-xs uppercase text-muted mt-2 mb-1">Real-Time Incident Activity Log</div>
          ${this.state.alertLogs.map(l => `
            <div class="flex items-start gap-2 text-xs" style="padding: 6px 0; border-bottom: 1px solid var(--border);">
              <span class="status-dot ${l.type}" style="margin-top: 5px;"></span>
              <div>
                <span class="font-semibold">${l.time}:</span> ${l.text}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    drawer.classList.add("show");
  },

  closeNotificationDrawer(e) {
    const drawer = document.getElementById("notifDrawerBackdrop");
    if (drawer) drawer.classList.remove("show");
  },

  markNotificationsRead() {
    this.state.notifications.forEach(n => n.read = true);
    this.updateNotificationCount();
    this.openNotificationDrawer();
    this.showToast("All notifications marked as read.", "info");
  },

  updateNotificationCount() {
    const unread = this.state.notifications.filter(n => !n.read).length;
    const badge = document.getElementById("notifBadgeCount");
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? "flex" : "none";
    }
  },

  /**
   * General Modal Controller
   */
  openModal(title, contentHtml, footerHtml = null) {
    const backdrop = document.getElementById("globalModalBackdrop");
    const titleEl = document.getElementById("globalModalTitle");
    const contentEl = document.getElementById("globalModalContent");
    const footerEl = document.getElementById("globalModalFooter");

    if (!backdrop || !titleEl || !contentEl) return;

    titleEl.textContent = title;
    contentEl.innerHTML = contentHtml;
    if (footerEl && footerHtml) {
      footerEl.innerHTML = footerHtml;
    } else if (footerEl) {
      footerEl.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.closeModal()">Close</button>`;
    }

    backdrop.classList.add("show");
  },

  closeModal() {
    const backdrop = document.getElementById("globalModalBackdrop");
    if (backdrop) backdrop.classList.remove("show");
  },

  /**
   * "Why This Score?" Explainability Modal (Section K & AA)
   */
  explainRiskScore(wardId) {
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === wardId);
    if (!ward) return;

    const waterfall = (ward.hhvi && ward.hhvi.waterfall) || {};
    const score = ward.hhvi ? ward.hhvi.mitigated_hhvi : 75;

    const content = `
      <div style="font-family: inherit;">
        <div class="flex items-center justify-between mb-4 p-3" style="background: var(--bg-muted); border-radius: 8px;">
          <div>
            <div class="text-xs text-muted font-bold uppercase">Target Area</div>
            <div class="font-extrabold text-base">Ward ${ward.ward_id} – ${ward.name}</div>
          </div>
          <div class="risk-score ${ward.risk_level.toLowerCase()}" style="width: 56px; height: 56px; font-size: 18px;">
            ${score}
          </div>
        </div>

        <div class="font-bold text-xs uppercase text-muted mb-2">Composite Multi-Criteria Risk Formula</div>
        <div class="text-xs text-secondary mb-3" style="line-height: 1.5;">
          <strong>HHVI</strong> = 0.35 × Thermal Hazard + 0.25 × Slum Density + 0.20 × Elderly Worker Ratio + 0.20 × Canopy Deficit - Mitigations
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 14px;">
          <div class="hbar"><span class="hbar-label">Thermal Hazard</span><div class="hbar-track"><div class="hbar-fill" style="width:${(waterfall.heat_component/35)*100}%; background:var(--critical);"></div></div><span class="hbar-value">${waterfall.heat_component || 24}</span></div>
          <div class="hbar"><span class="hbar-label">Slum Density Trap</span><div class="hbar-track"><div class="hbar-fill" style="width:${(waterfall.slum_component/25)*100}%; background:var(--high);"></div></div><span class="hbar-value">${waterfall.slum_component || 18}</span></div>
          <div class="hbar"><span class="hbar-label">Elderly Ratio</span><div class="hbar-track"><div class="hbar-fill" style="width:${(waterfall.elderly_component/20)*100}%; background:var(--moderate);"></div></div><span class="hbar-value">${waterfall.elderly_component || 14}</span></div>
          <div class="hbar"><span class="hbar-label">Canopy Deficit</span><div class="hbar-track"><div class="hbar-fill" style="width:${(waterfall.canopy_component/20)*100}%; background:var(--safe);"></div></div><span class="hbar-value">${waterfall.canopy_component || 12}</span></div>
        </div>

        <div class="alert-strip info mt-4">
          ℹ️ <strong>Provable Data Provenance:</strong> Census 2011 official baseline (${this.formatPop(ward.population)}) + Open-Meteo live thermal telemetry.
        </div>
      </div>
    `;

    this.openModal(`Why This Score? — Ward ${ward.ward_id}`, content);
  },

  /**
   * Resource Dispatch Action Workflow
   */
  assignResourceToWard(wardId, resourceId) {
    const res = this.state.fleetList.find(f => f.id === resourceId);
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === wardId);

    if (res && ward) {
      res.status = "ASSIGNED";
      res.ward = wardId;
      res.eta = "18 min";

      this.state.alertLogs.unshift({
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST",
        text: `Assigned ${res.id} (${res.type}) to Ward ${ward.ward_id} (${ward.name})`,
        type: "safe"
      });

      this.showToast(`✓ Assigned ${res.id} to Ward ${wardId} successfully!`, "success");
      this.closeModal();
      this.renderPage(this.state.currentPage);
    }
  },

  /**
   * Direct Resource Dispatch Trigger (Buttons on Ward Dossier, Overview, GIS Map)
   */
  dispatchResource(wardId, resourceType = "Water Tanker") {
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === wardId);
    if (!ward) return;

    // Search for available fleet unit in the municipal fleet list
    const availableUnit = (this.state.fleetList || []).find(f => 
      f.status === "AVAILABLE" && (!resourceType || f.type.toLowerCase().includes(resourceType.toLowerCase()))
    );

    if (availableUnit) {
      this.assignResourceToWard(wardId, availableUnit.id);
    } else {
      // Simulate emergency mobilization and logging
      const dispatchId = `DISPATCH-${Date.now().toString().slice(-4)}`;
      this.state.alertLogs.unshift({
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST",
        text: `Emergency Dispatch Order [${dispatchId}]: Mobilized ${resourceType} to Ward ${ward.ward_id} (${ward.name})`,
        type: "safe"
      });
      this.showToast(`✓ Emergency ${resourceType} mobilized for Ward ${wardId} (ETA 18 min · Simulation)`, "success");
      this.renderPage(this.state.currentPage);
    }
  },

  /**
   * Update Response Queue Action Status (Approval Workflow)
   */
  updateResponseStatus(actionId, nextStatus) {
    const act = this.state.responseQueue.find(a => a.id === actionId);
    if (act) {
      act.status = nextStatus;

      this.state.alertLogs.unshift({
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST",
        text: `Response ${act.id} (${act.action}) moved to ${nextStatus}`,
        type: nextStatus === "COMPLETED" ? "safe" : "info"
      });

      this.showToast(`Action ${act.id} updated to ${nextStatus}`, "info");
      this.renderPage("response");
    }
  },

  /**
   * =========================================================================
   * EMERGENCY OPERATIONS CENTER (EOC) CONTROLLER (Requirements 1, 6, 7, 10, 11, 13, 17, 18)
   * =========================================================================
   */

  enterEmergencyMode() {
    console.log("🔴 HEATSHIELD :: Activating Emergency Command Mode...");

    if (!this.state.emergencyMode) {
      this.state.emergencyPreviousPage = this.state.currentPage || "overview";
      this.state.emergencyMode = true;
      this.state.emergencyStartedAt = Date.now();
      this.state.emergencyIncidentId = "INC-2026-" + Math.floor(1000 + Math.random() * 9000);
      this.state.emergencyDeepAnalysisOpen = false;

      // Select top priority ward as active
      const topWard = (this.state.evaluatedWards && this.state.evaluatedWards[0]) || { ward_id: 17 };
      this.state.emergencyActiveWardId = topWard.ward_id;

      const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";

      // Initialize full continuous incident timeline chain (Forecast -> Activation -> Audit)
      const activationEvents = [
        {
          time: nowStr,
          text: `Emergency Command Mode ACTIVATED by Duty Officer. Incident [${this.state.emergencyIncidentId}] registered.`,
          type: "critical",
          badge: "ACTIVATION"
        },
        {
          time: nowStr,
          text: `COMMAND GATE: Automated state preparation complete. Awaiting Duty Officer dispatch authorization (Human Command Decision Required).`,
          type: "high",
          badge: "OFFICER REVIEW REQUIRED"
        }
      ];

      if (!this.state.emergencyTimeline || this.state.emergencyTimeline.length === 0) {
        this.state.emergencyTimeline = [
          ...activationEvents,
          {
            time: nowStr,
            text: `RECOMMENDATION GENERATED: Mandated field interventions drafted (2x 10KL Water Tankers, AC Cooling Hub, Labor Pause).`,
            type: "info",
            badge: "RECOMMENDATION"
          },
          {
            time: nowStr,
            text: `HEALTH IMPACT PROJECTED: Adaptive-DLNM model projects +42 admissions/day peak surge across receiving hospital network.`,
            type: "high",
            badge: "HEALTH IMPACT"
          },
          {
            time: nowStr,
            text: `CRITICAL WARDS IDENTIFIED: Multi-criteria stratification isolated 18 Critical Wards requiring immediate tactical allocation.`,
            type: "critical",
            badge: "WARD PRIORITY"
          },
          {
            time: "T -2h",
            text: `RISK DETECTED: Biometeorological UTCI reached 46.2°C exceeding critical threshold in dense tin-roof slum settlements.`,
            type: "critical",
            badge: "RISK DETECTED"
          },
          {
            time: "T -14h",
            text: `EARLY WARNING ISSUED: Municipal 48-Hour Red Alert Heatwave Advisory formulated with 12-hour preparation window.`,
            type: "high",
            badge: "EARLY WARNING"
          },
          {
            time: "T -18h",
            text: `FORECAST SIGNAL: Synoptic sounding & NWP model detected severe heatwave trajectory (expected peak 43.5°C).`,
            type: "info",
            badge: "FORECAST SIGNAL"
          }
        ];
      } else {
        this.state.emergencyTimeline.unshift(...activationEvents);
      }

      this.state.alertLogs.unshift({
        time: nowStr,
        text: `CRITICAL: Emergency Operations Center activated under Incident ${this.state.emergencyIncidentId}`,
        type: "critical"
      });

      this.startEmergencyTimer();
    }

    this.updateEmergencyHeaderUI();
    this.navigateTo("emergency", true);
    this.showToast(`🔴 EMERGENCY MODE ACTIVE · Incident ${this.state.emergencyIncidentId}`, "critical");
  },

  startEmergencyTimer() {
    this.stopEmergencyTimer();
    const updateTime = () => {
      if (!this.state.emergencyMode || !this.state.emergencyStartedAt) return;
      const elapsedSec = Math.floor((Date.now() - this.state.emergencyStartedAt) / 1000);
      const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
      const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
      const secs = String(elapsedSec % 60).padStart(2, "0");
      const elapsedStr = `${hrs}:${mins}:${secs}`;

      const kolkataTimeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " IST";

      const elElapsed = document.getElementById("emHdrElapsedTime");
      if (elElapsed) elElapsed.textContent = elapsedStr;

      const elKolkata = document.getElementById("emHdrKolkataTime");
      if (elKolkata) elKolkata.textContent = kolkataTimeStr;
    };

    updateTime();
    this.state.emergencyTimerInterval = setInterval(updateTime, 1000);
  },

  stopEmergencyTimer() {
    if (this.state.emergencyTimerInterval) {
      clearInterval(this.state.emergencyTimerInterval);
      this.state.emergencyTimerInterval = null;
    }
  },

  updateEmergencyHeaderUI() {
    const btnEnter = document.getElementById("btnEnterEmergencyMode");
    const activeStrip = document.getElementById("emergencyActiveHeaderStrip");
    const incIdEl = document.getElementById("emHdrIncidentId");
    const dataStatusEl = document.getElementById("emHdrDataStatus");

    if (this.state.emergencyMode) {
      if (btnEnter) btnEnter.style.display = "none";
      if (activeStrip) activeStrip.style.display = "flex";
      if (incIdEl) incIdEl.textContent = this.state.emergencyIncidentId || "INC-2026-ACTIVE";
      if (dataStatusEl) {
        const engine = window.HEATSHIELD_ENGINE;
        dataStatusEl.textContent = (engine && engine.isLiveWeather) ? "LIVE TELEMETRY" : "DEMO / SIMULATION";
      }
    } else {
      if (btnEnter) btnEnter.style.display = "inline-flex";
      if (activeStrip) activeStrip.style.display = "none";
    }
    this.updateHeaderHeight();
  },

  confirmExitEmergencyMode() {
    const modal = document.getElementById("exitEmergencyModalBackdrop");
    if (modal) modal.classList.add("show");
  },

  closeExitEmergencyModal() {
    const modal = document.getElementById("exitEmergencyModalBackdrop");
    if (modal) modal.classList.remove("show");
  },

  exitEmergencyMode() {
    this.closeExitEmergencyModal();
    console.log("🛡️ HEATSHIELD :: Exiting Emergency Mode, preserving all operational state...");

    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";

    this.state.emergencyTimeline.unshift({
      time: nowStr,
      text: `Emergency Command Mode DEACTIVATED. Incident [${this.state.emergencyIncidentId}] audited and logged. Baseline surveillance resumed.`,
      type: "safe",
      badge: "DEACTIVATION"
    });

    this.state.alertLogs.unshift({
      time: nowStr,
      text: `Incident ${this.state.emergencyIncidentId} concluded. Operational dispatches & fleet allocations preserved.`,
      type: "safe"
    });

    this.state.emergencyMode = false;
    this.state.emergencyDeepAnalysisOpen = false;
    this.stopEmergencyTimer();
    this.updateEmergencyHeaderUI();

    const returnPage = (this.state.emergencyPreviousPage && this.state.emergencyPreviousPage !== "emergency") 
      ? this.state.emergencyPreviousPage 
      : "overview";

    this.navigateTo(returnPage, true);
    this.showToast("✓ Exited Emergency Mode. All dispatches, resource updates & incident logs preserved.", "info");
  },

  /**
   * Action Queue Dispatch Workflow (Requirement 6 & 7)
   */
  dispatchImmediateAction(actionId, wardId, actionName) {
    const act = (this.state.responseQueue || []).find(a => a.id === actionId);
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === wardId) || { ward_id: wardId, name: `Ward ${wardId}` };

    // Search available resource unit from fleet
    let assignedFleet = (this.state.fleetList || []).find(f => f.status === "AVAILABLE");

    if (assignedFleet) {
      assignedFleet.status = "EN ROUTE";
      assignedFleet.ward = wardId;
      assignedFleet.eta = "12 min";
    } else {
      assignedFleet = { id: `DEPOT-${Date.now().toString().slice(-4)}`, eta: "15 min" };
    }

    // Decrement resource availability
    const res = this.state.resources;
    if (res) {
      if (actionName && actionName.toLowerCase().includes("cooling") && res.coolingHubs && res.coolingHubs.available > 0) {
        res.coolingHubs.available--;
        res.coolingHubs.deployed++;
      } else if (actionName && actionName.toLowerCase().includes("tanker") && res.tankers && res.tankers.available > 0) {
        res.tankers.available--;
        res.tankers.deployed++;
      } else if (actionName && actionName.toLowerCase().includes("medical") && res.medicalTeams && res.medicalTeams.available > 0) {
        res.medicalTeams.available--;
        res.medicalTeams.deployed++;
      }
    }

    if (act) {
      act.status = "DISPATCHED";
      act.resource_id = assignedFleet.id;
      act.eta = assignedFleet.eta || "12 min";
    }

    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";

    this.state.emergencyTimeline.unshift({
      time: nowStr,
      text: `DISPATCH AUTHORIZED [${actionId}]: ${actionName || 'Emergency Action'} for Ward ${wardId} (${ward.name}). Unit ${assignedFleet.id} en route.`,
      type: "safe",
      badge: "DISPATCH"
    });

    this.state.alertLogs.unshift({
      time: nowStr,
      text: `Dispatch order executed: ${assignedFleet.id} mobilized to Ward ${wardId} (ETA ${assignedFleet.eta || '12 min'})`,
      type: "safe"
    });

    this.showToast(`✓ DISPATCHED: ${actionName || 'Action'} for Ward ${wardId} (${assignedFleet.id})`, "success");

    if (window.HEATSHIELD_SFX && typeof window.HEATSHIELD_SFX.playDeploy === "function") {
      window.HEATSHIELD_SFX.playDeploy();
    }

    this.renderPage(this.state.currentPage);
  },

  /**
   * One-Click Direct Emergency Dispatch (Requirement 7)
   */
  dispatchResourceFromEmergency(wardId, resourceType) {
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === wardId) || { ward_id: wardId, name: `Ward ${wardId}` };
    const res = this.state.resources;

    if (resourceType.toLowerCase().includes("cooling")) {
      if (res && res.coolingHubs && res.coolingHubs.available > 0) {
        res.coolingHubs.available--;
        res.coolingHubs.deployed++;
      }
    } else if (resourceType.toLowerCase().includes("tanker") || resourceType.toLowerCase().includes("water")) {
      if (res && res.tankers && res.tankers.available > 0) {
        res.tankers.available--;
        res.tankers.deployed++;
      }
    } else if (resourceType.toLowerCase().includes("medical")) {
      if (res && res.medicalTeams && res.medicalTeams.available > 0) {
        res.medicalTeams.available--;
        res.medicalTeams.deployed++;
      }
    }

    // Find or create fleet unit
    const unit = (this.state.fleetList || []).find(f => f.status === "AVAILABLE" && f.type.toLowerCase().includes(resourceType.toLowerCase()))
      || { id: `${resourceType.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`, eta: "14 min" };
    unit.status = "EN ROUTE";
    unit.ward = wardId;
    unit.eta = "14 min";

    // Add entry to responseQueue
    const newActId = `ACT-EMG-${Date.now().toString().slice(-4)}`;
    this.state.responseQueue.unshift({
      id: newActId,
      ward_id: wardId,
      name: ward.name,
      risk: ward.hhvi ? ward.hhvi.mitigated_hhvi : 85,
      risk_level: ward.risk_level || "CRITICAL",
      reason: `Emergency intervention authorized for acute biothermal strain`,
      action: `Deploy ${resourceType} (${unit.id})`,
      status: "DISPATCHED",
      priority: "URGENT",
      resource_id: unit.id,
      eta: "14 min"
    });

    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";

    this.state.emergencyTimeline.unshift({
      time: nowStr,
      text: `DIRECT DISPATCH: Mobilized ${resourceType} (${unit.id}) to Ward ${wardId} (${ward.name}). ETA 14 min.`,
      type: "safe",
      badge: "LOGISTICS DISPATCH"
    });

    this.state.alertLogs.unshift({
      time: nowStr,
      text: `Mobilized ${resourceType} (${unit.id}) to Ward ${wardId} (${ward.name})`,
      type: "safe"
    });

    this.showToast(`✓ DISPATCHED: ${resourceType} to Ward ${wardId} (ETA 14 min)`, "success");

    if (window.HEATSHIELD_SFX && typeof window.HEATSHIELD_SFX.playDeploy === "function") {
      window.HEATSHIELD_SFX.playDeploy();
    }

    this.renderPage(this.state.currentPage);
  },

  issueHeatAdvisory(wardId) {
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === wardId) || { ward_id: wardId, name: `Ward ${wardId}` };
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";

    this.state.emergencyTimeline.unshift({
      time: nowStr,
      text: `PUBLIC ADVISORY: Level-3 Heatwave Warning transmitted to Ward ${wardId} (${ward.name}) via SMS, WhatsApp & Councillor networks.`,
      type: "high",
      badge: "ADVISORY BROADCAST"
    });

    this.state.alertLogs.unshift({
      time: nowStr,
      text: `Heatwave public advisory broadcast executed for Ward ${wardId}`,
      type: "high"
    });

    this.showToast(`📢 Heat Advisory broadcasted to Ward ${wardId} successfully`, "info");
    this.renderPage(this.state.currentPage);
  },

  alertFieldTeam(wardId) {
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === wardId) || { ward_id: wardId, name: `Ward ${wardId}` };
    const res = this.state.resources;
    if (res && res.officers && res.officers.available > 0) {
      res.officers.available--;
      res.officers.deployed++;
    }

    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";

    this.state.emergencyTimeline.unshift({
      time: nowStr,
      text: `FIELD TEAM ALERTED: 8 ASHA community health workers and Para-Club volunteers dispatched in Ward ${wardId} (${ward.name}).`,
      type: "safe",
      badge: "FIELD MOBILIZATION"
    });

    this.state.alertLogs.unshift({
      time: nowStr,
      text: `Field response team alerted and deployed in Ward ${wardId}`,
      type: "safe"
    });

    this.showToast(`👥 Field Response Team mobilized in Ward ${wardId}`, "success");
    this.renderPage(this.state.currentPage);
  },

  openDeepAnalysisFromEmergency(wardId = null) {
    this.state.emergencyDeepAnalysisOpen = true;
    if (wardId) {
      this.selectWard(wardId);
      this.navigateTo("ward-intel");
    } else {
      this.navigateTo("overview");
    }
    this.showToast("Opening Deep Analysis. Emergency Mode remains active in the background.", "info");
  },

  returnToEmergencyFromDeepAnalysis() {
    this.state.emergencyDeepAnalysisOpen = false;
    this.navigateTo("emergency");
  },

  /**
   * Presentation Mode (8-Step Incident Lifecycle Walkthrough)
   * Showcases the real operational application through a continuous emergency incident story
   */
  openPresentationMode() {
    this.state.presentationSlideIndex = 0;
    this.renderPresentationSlide();
    const backdrop = document.getElementById("presentationOverlayBackdrop");
    if (backdrop) backdrop.classList.add("show");
  },

  closePresentationMode() {
    const backdrop = document.getElementById("presentationOverlayBackdrop");
    if (backdrop) backdrop.classList.remove("show");
  },

  nextPresentationSlide() {
    if (this.state.presentationSlideIndex < 7) {
      this.state.presentationSlideIndex++;
      this.renderPresentationSlide();
    } else {
      this.closePresentationMode();
      this.showToast("✓ Completed Incident Lifecycle Walkthrough! Command Center is live.", "success");
    }
  },

  prevPresentationSlide() {
    if (this.state.presentationSlideIndex > 0) {
      this.state.presentationSlideIndex--;
      this.renderPresentationSlide();
    }
  },

  renderPresentationSlide() {
    const slides = [
      {
        step: 1,
        page: "overview",
        title: "1. Current City Heat Status — Real-Time Thermal Surveillance",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              The command center aggregates telemetry across all <strong>144 Kolkata Municipal Corporation wards</strong>, combining WMO station weather feeds with satellite surface temperature and demographic exposure.
            </p>
            <div class="city-heat-status-banner" style="margin: 0; padding: 10px 14px;">
              <div class="heat-level-cell critical">
                <div class="heat-level-title">CRITICAL</div>
                <div class="heat-level-count">${this.state.criticalWardsCount || 14} wards</div>
                <div class="heat-level-desc">Immediate Action Required</div>
              </div>
              <div class="heat-level-cell high">
                <div class="heat-level-title">HIGH</div>
                <div class="heat-level-count">${this.state.highWardsCount || 32} wards</div>
                <div class="heat-level-desc">Targeted Intervention</div>
              </div>
              <div class="heat-level-cell moderate">
                <div class="heat-level-title">MODERATE</div>
                <div class="heat-level-count">48 wards</div>
                <div class="heat-level-desc">Active Surveillance</div>
              </div>
              <div class="heat-level-cell normal">
                <div class="heat-level-title">NORMAL / SAFE</div>
                <div class="heat-level-count">50 wards</div>
                <div class="heat-level-desc">Routine Operations</div>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs p-2 rounded" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
              <span><strong>Peak Apparent Heat Index:</strong> 46.2°C (Feels Like)</span>
              <span><strong>Stull WBGT Index:</strong> 33.8°C (Extreme Strain)</span>
              <span><strong>Population at Risk:</strong> ~380,000 residents</span>
            </div>
          </div>
        `
      },
      {
        step: 2,
        page: "heatmap",
        title: "2. City Heat-Risk Map — Hyper-Local GIS Spatial Intelligence",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              HEATSHIELD converts citywide data into an interactive 144-ward choropleth map. Officers can instantly identify thermal microclimates, high-density informal settlement clusters, and cooling resource deficits.
            </p>
            <div class="grid grid-2 gap-3">
              <div class="p-3 rounded" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
                <div class="font-bold text-xs mb-1" style="color: var(--critical);">Primary Heat Epicenter Detected</div>
                <p class="text-xs" style="color: var(--text-muted);">
                  Borough II & IV corridor (North-Central Commercial Basin) exhibits persistent thermal retention due to high building mass and low vegetation cover.
                </p>
              </div>
              <div class="p-3 rounded" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
                <div class="font-bold text-xs mb-1" style="color: var(--primary);">Operational GIS Overlays</div>
                <p class="text-xs" style="color: var(--text-muted);">
                  Live overlays display KMC water tanker filling stations, AC pop-up cooling shelters, and primary health clinics (UPHCs) within 500m of vulnerable populations.
                </p>
              </div>
            </div>
          </div>
        `
      },
      {
        step: 3,
        page: "ward-intel",
        wardId: 17,
        title: "3. Incident Triage — Isolation of Critical Ward 17",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              The system isolates <strong>Ward 17 (Shyambazar / Burrabazar)</strong> as the city's highest-risk operational sector. Immediate emergency protocols are triggered.
            </p>
            <div class="p-3 rounded flex items-center justify-between" style="background: var(--critical-light); border-left: 4px solid var(--critical);">
              <div>
                <div class="font-bold text-xs" style="color: var(--critical);">WARD 17 · CRITICAL HEAT RISK EXPOSURE</div>
                <div class="text-xs mt-1" style="color: var(--text-primary);">Borough II · 38,420 Residents · 14,200 High-Vulnerability Outdoor Workers & Elderly</div>
              </div>
              <span class="risk-pill critical">
                <span class="risk-dot"></span>
                <span>CRITICAL (Score: 88/100)</span>
              </span>
            </div>
            <div class="grid grid-3 gap-2 text-xs">
              <div class="p-2 rounded text-center" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
                <div style="color: var(--text-muted);">Air Temperature</div>
                <div class="font-bold text-sm mt-1">41.8°C</div>
              </div>
              <div class="p-2 rounded text-center" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
                <div style="color: var(--text-muted);">Apparent Temp</div>
                <div class="font-bold text-sm mt-1" style="color: var(--critical);">46.2°C</div>
              </div>
              <div class="p-2 rounded text-center" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
                <div style="color: var(--text-muted);">Wet Bulb (WBGT)</div>
                <div class="font-bold text-sm mt-1" style="color: var(--critical);">33.9°C</div>
              </div>
            </div>
          </div>
        `
      },
      {
        step: 4,
        page: "ward-intel",
        wardId: 17,
        title: "4. Causal Attribution — Why Ward 17 is at Extreme Risk",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              Unlike black-box models, HEATSHIELD decomposes the risk score into four deterministic, multi-criteria factors so officers understand the exact root causes:
            </p>
            <div class="flex flex-col gap-2">
              <div class="p-2 rounded flex justify-between items-center text-xs" style="background: var(--bg-card-secondary); border-left: 3px solid var(--critical);">
                <span><strong>1. Thermal Hazard (35% Weight):</strong> Peak afternoon heat index 46.2°C with high humidity trapping thermal mass.</span>
                <span class="font-bold">Severe</span>
              </div>
              <div class="p-2 rounded flex justify-between items-center text-xs" style="background: var(--bg-card-secondary); border-left: 3px solid var(--high);">
                <span><strong>2. Slum Density (25% Weight):</strong> 68% tin/asbestos roofed dwellings causing severe indoor heat entrapment.</span>
                <span class="font-bold">High</span>
              </div>
              <div class="p-2 rounded flex justify-between items-center text-xs" style="background: var(--bg-card-secondary); border-left: 3px solid var(--high);">
                <span><strong>3. Demographic Exposure (20% Weight):</strong> High density of elderly residents (14.2%) and outdoor market vendors (34%).</span>
                <span class="font-bold">High</span>
              </div>
              <div class="p-2 rounded flex justify-between items-center text-xs" style="background: var(--bg-card-secondary); border-left: 3px solid var(--high);">
                <span><strong>4. Tree Canopy Deficit (20% Weight):</strong> Sub-8% vegetative cover, amplifying urban heat island (UHI) effect.</span>
                <span class="font-bold">Deficit</span>
              </div>
            </div>
          </div>
        `
      },
      {
        step: 5,
        page: "ward-intel",
        wardId: 17,
        title: "5. AI-Assisted Decision Support — Evidence-Based Recommendations",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              Based on the causal decomposition and NDMA guidelines, the decision-support engine recommends targeted tactical interventions:
            </p>
            <div class="p-3 rounded" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
              <div class="flex items-center gap-2 mb-2 font-bold text-xs" style="color: var(--primary);">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>MANDATED MUNICIPAL ACTION PLAN · WARD 17</span>
              </div>
              <ul class="text-xs space-y-1.5" style="color: var(--text-primary); padding-left: 18px; line-height: 1.5;">
                <li><strong>Deploy 2 High-Capacity Water Tankers (TK-01, TK-08):</strong> Station at Burrabazar Market junction for misting and clean hydration supply.</li>
                <li><strong>Activate Pop-Up Cooling Hub (CH-01):</strong> Open air-conditioned emergency cooling station at Ward Community Hall (120 beds).</li>
                <li><strong>Deploy ASHA Rapid Hydration Squad:</strong> Door-to-door distribution of oral rehydration salts (ORS) to informal settlement lanes.</li>
                <li><strong>Issue Outdoor Labor Pause Advisory:</strong> Recommend suspension of heavy unshaded labor between 12:00 PM and 4:00 PM.</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        step: 6,
        page: "response",
        title: "6. Operational Response Queue — Commander Authorization & Dispatch",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              Recommendations are immediately routed to the Central Response Queue for formal officer authorization. Orders transition through a transparent approval lifecycle:
            </p>
            <div class="p-3 rounded text-xs" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
              <div class="flex items-center justify-between pb-2 mb-2" style="border-bottom: 1px solid var(--border);">
                <span class="font-bold">Incident Action: ACT-101 (Ward 17)</span>
                <span class="risk-pill critical"><span class="risk-dot"></span><span>CRITICAL / IMMEDIATE</span></span>
              </div>
              <div class="grid grid-2 gap-2 text-xs">
                <div><strong>Assigned Team:</strong> Field Response Team Alpha</div>
                <div><strong>Assigned Unit:</strong> Water Tanker TK-08 (12,000L)</div>
                <div><strong>Current Status:</strong> <span class="status-badge active">DISPATCHED / ACTIVE</span></div>
                <div><strong>ETA to Station:</strong> On-Site (Operational)</div>
              </div>
            </div>
            <div class="alert-strip success" style="font-size: 11px;">
              <span>✓ Workflow audit trail records timestamp, approving officer credentials, and unit acknowledgement.</span>
            </div>
          </div>
        `
      },
      {
        step: 7,
        page: "resources",
        title: "7. Fleet Readiness — Municipal Resource Availability",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              Commanders maintain continuous visibility over municipal fleet readiness, logistics, and field personnel across all 16 boroughs:
            </p>
            <div class="grid grid-4 gap-2">
              <div class="kpi-card">
                <div class="kpi-label">Water Tankers</div>
                <div class="kpi-value" style="color: var(--primary);">11 / 25</div>
                <div class="kpi-sub">11 Available · 14 Deployed</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Cooling Hubs</div>
                <div class="kpi-value" style="color: var(--success);">7 / 15</div>
                <div class="kpi-sub">7 Available · 8 Deployed</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Medical Squads</div>
                <div class="kpi-value" style="color: var(--high);">4 / 10</div>
                <div class="kpi-sub">4 Available · 6 Deployed</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Duty Officers</div>
                <div class="kpi-value">12 / 40</div>
                <div class="kpi-sub">12 Ready · 28 on Patrol</div>
              </div>
            </div>
            <p class="text-xs" style="color: var(--text-muted);">
              All units are tracked with live status indicators (AVAILABLE, DEPLOYED, BUSY), GPS tracking, and direct radio contacts.
            </p>
          </div>
        `
      },
      {
        step: 8,
        page: "reports",
        title: "8. Situation Report Generation & Institutional Governance",
        content: `
          <div class="flex flex-col gap-3">
            <p class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
              At any point during the operational shift, officers can generate official municipal heat-risk situation reports formatted for the Municipal Commissioner and State Disaster Management Authority:
            </p>
            <div class="p-3 rounded" style="background: var(--bg-card-secondary); border: 1px solid var(--border);">
              <div class="font-bold text-xs mb-1" style="color: var(--primary);">DAILY MUNICIPAL HEAT RISK SITUATION REPORT</div>
              <p class="text-xs" style="color: var(--text-secondary);">
                Features full 144-ward risk stratification, biostatistical DLNM excess mortality estimates, active resource dispatch dockets, and official compliance signatures.
              </p>
              <div class="flex items-center gap-2 mt-3">
                <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_APP.generatePDFReport('situation')">
                  <svg class="nav-svg-icon" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span>Download Stamped Official PDF</span>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.closePresentationMode(); HEATSHIELD_APP.navigateTo('reports');">
                  <span>Explore Reports Module</span>
                </button>
              </div>
            </div>
            <div class="alert-strip info" style="font-size: 11px;">
              <span>✓ Completes the end-to-end operational cycle: Early Warning → Spatial GIS Detection → Ward Triage → Decision Support → Incident Dispatch → Fleet Management → Official Reporting.</span>
            </div>
          </div>
        `
      }
    ];

    const slide = slides[this.state.presentationSlideIndex];
    const contentEl = document.getElementById("presentationSlideContent");
    const counterEl = document.getElementById("presSlideCounter");
    const nextBtn = document.getElementById("presNextBtn");
    const prevBtn = document.getElementById("presPrevBtn");

    if (slide) {
      // Synchronize the real command center behind the modal
      if (slide.page) {
        if (slide.wardId) {
          this.selectWard(slide.wardId, false);
        }
        this.navigateTo(slide.page);
      }

      if (contentEl) {
        contentEl.innerHTML = `
          <h3 class="text-base font-bold mb-3" style="color: var(--text-primary);">${slide.title}</h3>
          ${slide.content}
        `;
      }
    }

    if (counterEl) counterEl.textContent = `Step ${this.state.presentationSlideIndex + 1} of ${slides.length}`;
    if (prevBtn) prevBtn.disabled = this.state.presentationSlideIndex === 0;
    if (nextBtn) nextBtn.textContent = this.state.presentationSlideIndex === slides.length - 1 ? "Finish Walkthrough ✓" : "Next Step →";
  },

  /**
   * Settings & Help Modals
   */
  openSettingsModal() {
    const content = `
      <div class="flex flex-col gap-3 text-xs">
        <div class="flex items-center justify-between pb-2" style="border-bottom: 1px solid var(--border);">
          <span class="font-semibold">Current Operating Theme:</span>
          <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.toggleTheme()">${this.state.theme.toUpperCase()} MODE</button>
        </div>
        <div class="flex items-center justify-between pb-2" style="border-bottom: 1px solid var(--border);">
          <span class="font-semibold">Municipal Station Feed:</span>
          <span class="provenance-badge live">Open-Meteo Alipore WMO 42807</span>
        </div>
        <div class="flex items-center justify-between pb-2" style="border-bottom: 1px solid var(--border);">
          <span class="font-semibold">Census Population Dataset:</span>
          <span class="provenance-badge source">Census 2011 Verified (141 Wards)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="font-semibold">Operator Role:</span>
          <span class="font-bold">KMC Disaster Command Specialist</span>
        </div>
      </div>
    `;
    this.openModal("System Configuration & Settings", content);
  },

  openHelpModal() {
    const content = `
      <div class="flex flex-col gap-3 text-xs" style="line-height: 1.6;">
        <p><strong>HEATSHIELD</strong> is a B2G decision-support system designed for the Kolkata Municipal Corporation to forecast, prioritize, and mitigate human thermal stress.</p>
        <p><strong>Navigation Guide:</strong></p>
        <ul style="padding-left: 18px;">
          <li><strong>Overview:</strong> High-level command telemetry, active alerts, and top priority zones.</li>
          <li><strong>Heat Intelligence:</strong> 24h & 7-day meteorological forecasts and Adaptive DLNM health impact modeling.</li>
          <li><strong>Ward Intelligence:</strong> Deep demographic profiles and targeted tactical dispatches for 144 wards.</li>
          <li><strong>Heat Map:</strong> Interactive GIS multi-layer spatial explorer.</li>
          <li><strong>Response:</strong> Incident management and resource approval queue.</li>
          <li><strong>Reports:</strong> Official situation reports, automated PDF generation, and CSV/JSON data export.</li>
        </ul>
      </div>
    `;
    this.openModal("HEATSHIELD Documentation & Help", content);
  },

  /**
   * Toast Notification Controller
   */
  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icons = { success: "✓", error: "✕", warning: "⚠️", info: "ℹ️" };
    toast.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  },

  /**
   * Real In-Browser PDF Report Generator (Section S Standard)
   */
  generatePDFReport(reportType = "situation") {
    if (typeof window.jspdf === "undefined" && typeof jsPDF === "undefined") {
      this.showToast("jsPDF library is loading... Please retry in a moment.", "warning");
      return;
    }

    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF();
    const state = this.state;
    const dateStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Header & Institutional Branding
    doc.setFillColor(30, 64, 175); // #1E40AF
    doc.rect(0, 0, 210, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("KOLKATA MUNICIPAL CORPORATION — HEATSHIELD", 14, 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Disaster Management Command & Control Module (SIH26083)", 14, 19);

    // Title Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    
    const titles = {
      situation: "DAILY MUNICIPAL HEAT RISK SITUATION REPORT",
      "ward-risk": "WARD VULNERABILITY & THERMAL STRESS DOSSIER",
      response: "EMERGENCY RESOURCE ALLOCATION & DISPATCH SUMMARY",
      "heat-impact": "EPIDEMIOLOGICAL HEAT IMPACT & HOSPITAL SURGE (DLNM) REPORT"
    };

    doc.text(titles[reportType] || "MUNICIPAL SITUATION REPORT", 14, 38);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${dateStr} IST | Authority: KMC Disaster Response Officer`, 14, 44);

    // Summary Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 48, 182, 28, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("CURRENT CITYWIDE STATUS:", 18, 56);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`• Peak Temperature: ${state.peakTemp}°C | Critical Wards (HHVI >= 80): ${state.criticalWardsCount} / 144`, 18, 63);
    doc.text(`• Total Population in Elevated Hazard Zones: ${this.formatPop(state.totalAtRiskPop)} residents`, 18, 69);

    // Tabular Data via jsPDF-AutoTable
    const wards = (state.evaluatedWards || []).slice(0, 15);
    const tableData = wards.map(w => [
      `Ward ${w.ward_id}`,
      w.name,
      `${w.effective_temp || 40.5}°C`,
      w.risk_level,
      w.hhvi ? `${w.hhvi.mitigated_hhvi}/100` : "75/100",
      this.formatPop(w.population),
      (w.slum_density * 100).toFixed(0) + "%"
    ]);

    if (doc.autoTable) {
      doc.autoTable({
        startY: 82,
        head: [["Ward ID", "Locality Name", "Effective Temp", "Risk Level", "HHVI Score", "Population", "Slum %"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });
    }

    // Disclaimer & Provenance Footer
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 230;
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("DATA PROVENANCE: Census 2011 Official Ward Populations + Open-Meteo Live Meteorological Telemetry (WMO 42807).", 14, finalY);
    doc.text("PROTOTYPE DISCLAIMER: Decision-support model for SIH26083 demonstration. Real dispatch authorized via KMC command.", 14, finalY + 5);

    // Save PDF
    const filename = `HEATSHIELD_${reportType.toUpperCase()}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);

    this.showToast(`✓ Generated & Downloaded ${filename}`, "success");
  },

  /**
   * Real CSV Data Export (Section T Standard)
   */
  exportCSV() {
    const wards = this.state.evaluatedWards || [];
    let csv = "Ward_ID,Ward_Name,Borough,Effective_Temp_C,HHVI_Score,Risk_Level,Population_Census2011,Slum_Density_Pct,Tree_Canopy_Pct,Elderly_Worker_Pct\n";

    wards.forEach(w => {
      const score = w.hhvi ? w.hhvi.mitigated_hhvi : 75;
      csv += `${w.ward_id},"${w.name}","${w.borough || 'Central'}",${w.effective_temp || 40.5},${score},${w.risk_level},${w.population || 0},${(w.slum_density * 100).toFixed(1)},${(w.tree_canopy * 100).toFixed(1)},${(w.elderly_worker_ratio * 100).toFixed(1)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `HEATSHIELD_Kolkata_144_Wards_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast("✓ Exported 144 Wards dataset to CSV successfully!", "success");
  },

  /**
   * Real JSON Data Export (Section T Standard)
   */
  exportJSON() {
    const payload = {
      timestamp: new Date().toISOString(),
      metadata: {
        city: "Kolkata, West Bengal, India",
        project: "HEATSHIELD (SIH26083)",
        authority: "Kolkata Municipal Corporation"
      },
      city_summary: {
        peak_temperature: this.state.peakTemp,
        critical_wards: this.state.criticalWardsCount,
        high_risk_wards: this.state.highWardsCount,
        population_at_risk: this.state.totalAtRiskPop
      },
      wards: this.state.evaluatedWards,
      fleet_status: this.state.fleetList,
      response_queue: this.state.responseQueue
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `HEATSHIELD_State_Export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast("✓ Full application state exported to JSON successfully!", "success");
  },

  // Formatting Helpers
  formatNumber(n) {
    if (n == null || isNaN(n)) return "—";
    return Number(n).toLocaleString("en-IN");
  },

  formatPop(n) {
    if (n == null || isNaN(n)) return "—";
    if (n >= 100000) return (n / 100000).toFixed(1) + " L";
    if (n >= 1000) return (n / 1000).toFixed(1) + " K";
    return String(n);
  },

  getRiskClass(level) {
    const l = (level || "SAFE").toLowerCase();
    if (l === "critical") return "critical";
    if (l === "high") return "high";
    if (l === "moderate") return "moderate";
    return "safe";
  },

  getRiskLabel(level) {
    return (level || "Safe").toUpperCase();
  },

  /**
   * 7-Step Intuitive Decision Workflow Stepper
   * PROBLEM -> HEAT INTELLIGENCE -> RISK -> IMPACT -> RECOMMENDATION -> ACTION -> RESULT
   */
  jumpToWorkflowStep(stepIndex) {
    document.querySelectorAll(".workflow-step-btn").forEach((btn, idx) => {
      btn.classList.toggle("active", idx === stepIndex);
      btn.classList.toggle("completed", idx < stepIndex);
    });

    switch (stepIndex) {
      case 0: // Early Warning / Incident Context
        this.navigateTo("overview");
        window.scrollTo({ top: 0, behavior: "smooth" });
        this.showToast("Step 1: Extreme Heatwave Early Warning & Prediction", "info");
        break;
      case 1: // Human Thermal Stress & GIS
        this.navigateTo("heatmap");
        this.showToast("Step 2: Human Thermal Stress Index & GIS Heatmap (UTCI)", "info");
        break;
      case 2: // Ward-Level Risk & Smart Prioritization
        this.navigateTo("ward-intel");
        this.showToast("Step 3: Ward-Level Risk & Smart Prioritization", "info");
        break;
      case 3: // Healthcare Demand & Health Impact
        this.navigateTo("hospital-impact");
        this.showToast("Step 4: Health Impact & Hospital Surge Forecast", "info");
        break;
      case 4: // Targeted Recommendations
        this.navigateTo("recommendations");
        this.showToast("Step 5: Decision Support & Targeted Recommendations", "info");
        break;
      case 5: // Dispatch Action & Municipal Triage
        this.navigateTo("response");
        this.showToast("Step 6: Operational Dispatch & Municipal Action Authorization", "info");
        break;
      case 6: // Official Audit & Timeline
        this.navigateTo("reports");
        this.showToast("Step 7: Incident Timeline & Official Governance Audit", "info");
        break;
    }
  },

  /**
   * Reusable 7-Step Workflow Progression Bottom Navigation Bar
   */
  renderPipelineBottomNav(stepIndex, targetElementId) {
    const target = typeof targetElementId === "string" ? document.getElementById(targetElementId) : targetElementId;
    if (!target) return;

    const stepDefs = [
      { num: 1, name: "Early Warning", page: "overview" },
      { num: 2, name: "Thermal Stress (GIS)", page: "heatmap" },
      { num: 3, name: "Ward Risk & Priority", page: "ward-intel" },
      { num: 4, name: "Health Impact", page: "hospital-impact" },
      { num: 5, name: "Recommendations", page: "recommendations" },
      { num: 6, name: "Dispatch Action", page: "response" },
      { num: 7, name: "Audit & Timeline", page: "reports" }
    ];

    const prevStep = stepIndex > 0 ? stepDefs[stepIndex - 1] : null;
    const nextStep = stepIndex < 6 ? stepDefs[stepIndex + 1] : null;
    const ward = (this.state.evaluatedWards || []).find(w => w.ward_id === this.state.selectedWardId) || (this.state.evaluatedWards || [])[0];
    const wardLabel = ward ? `Ward ${ward.ward_id} (${ward.name || 'Kolkata'}) · Risk: ${(ward.riskScore || 0).toFixed(0)}` : "Citywide Context";

    target.innerHTML = `
      <div class="pipeline-bottom-nav">
        <div>
          ${prevStep ? `
            <button class="nav-step-btn" onclick="HEATSHIELD_APP.jumpToWorkflowStep(${stepIndex - 1})">
              ← Step ${prevStep.num}: ${prevStep.name}
            </button>
          ` : `
            <span class="text-xs text-muted font-bold">🏁 Workflow Start: Step 1</span>
          `}
        </div>

        <div class="flex items-center gap-2">
          <div class="pipeline-context-pill">
            <span class="context-indicator-dot"></span>
            <span>${wardLabel}</span>
          </div>
          <span class="text-xs text-secondary font-bold">Step ${stepIndex + 1} of 7</span>
        </div>

        <div>
          ${nextStep ? `
            <button class="nav-step-btn next-step" onclick="HEATSHIELD_APP.jumpToWorkflowStep(${stepIndex + 1})">
              Step ${nextStep.num}: ${nextStep.name} →
            </button>
          ` : `
            <button class="nav-step-btn" onclick="HEATSHIELD_APP.jumpToWorkflowStep(0)">
              ↺ Return to Step 1 (Problem)
            </button>
          `}
        </div>
      </div>
    `;
  },

  /**
   * System-Aware Administrative AI Assistant
   */
  openAiAssistant() {
    const backdrop = document.getElementById("aiAssistantBackdrop");
    const drawer = document.getElementById("aiAssistantDrawer");
    if (backdrop) backdrop.classList.add("open");
    if (drawer) drawer.classList.add("open");

    // Auto-focus input for frictionless typing
    setTimeout(() => {
      const input = document.getElementById("aiQueryInput");
      if (input) input.focus();
    }, 150);

    // Pre-populate prompt chips with live context
    const ward = this.state.evaluatedWards.find(w => w.ward_id === this.state.selectedWardId) || this.state.evaluatedWards[0];
    const chipsContainer = document.getElementById("aiDynamicChips");
    if (chipsContainer && ward) {
      chipsContainer.innerHTML = `
        <button class="ai-prompt-chip" onclick="HEATSHIELD_APP.sendAiQuery('Is Ward ${ward.ward_id} safe for field workers?')">Is Ward ${ward.ward_id} safe for field workers?</button>
        <button class="ai-prompt-chip" onclick="HEATSHIELD_APP.sendAiQuery('Which wards require immediate action?')">Which wards require immediate action?</button>
        <button class="ai-prompt-chip" onclick="HEATSHIELD_APP.sendAiQuery('Where should cooling resources be deployed?')">Where should cooling resources be deployed?</button>
        <button class="ai-prompt-chip" onclick="HEATSHIELD_APP.sendAiQuery('What is causing the high risk in Ward ${ward.ward_id}?')">What is causing the high risk in Ward ${ward.ward_id}?</button>
        <button class="ai-prompt-chip" onclick="HEATSHIELD_APP.sendAiQuery('What resources are currently available?')">What resources are currently available?</button>
      `;
    }
  },

  closeAiAssistant() {
    const backdrop = document.getElementById("aiAssistantBackdrop");
    const drawer = document.getElementById("aiAssistantDrawer");
    if (backdrop) backdrop.classList.remove("open");
    if (drawer) drawer.classList.remove("open");
  },

  sendAiQuery(queryText) {
    const input = document.getElementById("aiQueryInput");
    const query = (queryText || (input ? input.value : "")).trim();
    if (!query) return;

    if (input) input.value = "";

    const chatBody = document.getElementById("aiDrawerChat");
    if (!chatBody) return;

    // Append Officer Query safely (escaped)
    const escapedQuery = query.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));

    const userMsg = document.createElement("div");
    userMsg.className = "ai-msg user";
    userMsg.innerHTML = `
      <div class="ai-bubble font-semibold">${escapedQuery}</div>
      <span class="text-xs" style="color:var(--text-tertiary); align-self:flex-end;">Officer · Just now</span>
    `;
    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Display temporary animated thinking state
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "ai-msg assistant thinking-indicator";
    thinkingMsg.innerHTML = `
      <div class="ai-bubble" style="color:var(--text-secondary); font-style:italic; display:flex; align-items:center; gap:8px;">
        <span class="loading-spinner" style="display:inline-block; width:12px; height:12px; border:2px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin 0.8s linear infinite;"></span>
        Analyzing KMC biometeorological models & telemetry...
      </div>
    `;
    chatBody.appendChild(thinkingMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Generate Grounded System Response
    setTimeout(() => {
      if (thinkingMsg.parentNode) thinkingMsg.parentNode.removeChild(thinkingMsg);
      const responseHtml = this._generateSystemAwareAiResponse(query);
      const botMsg = document.createElement("div");
      botMsg.className = "ai-msg assistant";
      botMsg.innerHTML = `
        <div class="ai-bubble">${responseHtml}</div>
        <span class="text-xs" style="color:var(--text-tertiary);">HEATSHIELD Decision Support · Grounded on KMC Telemetry</span>
      `;
      chatBody.appendChild(botMsg);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 320);
  },

  _generateSystemAwareAiResponse(query) {
    const q = query.toLowerCase();
    const wardMatch = q.match(/ward\s*(\d+)/i);
    const targetWardId = wardMatch ? parseInt(wardMatch[1], 10) : this.state.selectedWardId;
    const ward = this.state.evaluatedWards.find(w => w.ward_id === targetWardId) || 
                 this.state.evaluatedWards.find(w => w.ward_id === this.state.selectedWardId) || 
                 this.state.evaluatedWards[0];
    const criticalWards = this.state.evaluatedWards.filter(w => w.risk_level === "CRITICAL");
    const resources = this.state.resources;

    if (q.includes("safe") || q.includes("worker") || q.includes("labor")) {
      const isCritical = ward.risk_level === "CRITICAL" || (ward.utci && ward.utci >= 38.0);
      return `
        <div class="flex flex-col gap-1.5">
          <div class="font-bold" style="color: ${isCritical ? 'var(--critical)' : 'var(--safe)'};">
            ${isCritical ? '⚠️ ADVISORY: NOT SAFE FOR UNRESTRICTED OUTDOOR WORK' : '✓ MODERATE RISK — MONITOR FIELD CREWS'}
          </div>
          <p><strong>Ward ${ward.ward_id} (${ward.name})</strong> currently exhibits thermal stress at <strong>${ward.utci_category || 'VERY STRONG HEAT STRESS'}</strong> (UTCI: <strong>${ward.utci || 41.8}°C</strong>, WBGT: <strong>${ward.wbgt || 33.5}°C</strong>).</p>
          <div class="p-2 rounded mt-1" style="background:var(--bg-muted); border-left:3px solid ${isCritical ? 'var(--critical)' : 'var(--moderate)'};">
            <strong>Mandated Protocol:</strong>
            <ul style="padding-left:16px; margin-top:4px;">
              <li>Enforce mandatory 15-minute rest breaks every 45 minutes in shaded/ventilated zones.</li>
              <li>Pre-position mobile electrolyte/ORS booths at major labor junctions.</li>
              ${isCritical ? '<li><strong>Suspend non-essential heavy outdoor construction between 12:00 PM and 4:00 PM.</strong></li>' : ''}
            </ul>
          </div>
        </div>
      `;
    }

    if (q.includes("which wards") || q.includes("which ward") || q.includes("priority") || q.includes("highest") || q.includes("immediate action") || q.includes("critical wards")) {
      const topWard = criticalWards[0] || ward;
      const topList = criticalWards.slice(0, 4).map(w => `
        <li style="margin-bottom:4px;">
          <strong>Ward ${w.ward_id} (${w.name})</strong> — Score: <span style="color:var(--critical); font-weight:bold;">${w.hhvi ? w.hhvi.mitigated_hhvi : 88}</span> · UTCI: ${w.utci || 42}°C
        </li>
      `).join("");
      return `
        <div class="flex flex-col gap-1.5">
          <div class="font-bold" style="color:var(--critical);">
            🚨 Highest Risk Ward: Ward ${topWard.ward_id} (${topWard.name}) · Score ${topWard.hhvi ? topWard.hhvi.mitigated_hhvi : 92}
          </div>
          <p><strong>${criticalWards.length} Wards</strong> currently in CRITICAL Emergency Status with peak UTCI at <strong>${topWard.utci || 46.2}°C</strong>.</p>
          <div class="text-xs p-2 rounded" style="background:var(--bg-muted); border-left:3px solid var(--critical);">
            <strong>Action Required:</strong> Dispatch misting tankers & pop-up cooling hubs immediately to high-density vendor corridors.
          </div>
          <p class="text-xs mt-1 font-semibold">Priority Critical Queue:</p>
          <ul style="padding-left:16px; margin-top:2px;" class="text-xs">
            ${topList}
          </ul>
          <div class="mt-2">
            <button class="btn btn-primary btn-sm" onclick="HEATSHIELD_APP.openBulkWarningModal(); HEATSHIELD_APP.closeAiAssistant();">
              Initiate Bulk Early Warning (${criticalWards.length} Wards)
            </button>
          </div>
        </div>
      `;
    }

    if (q.includes("surge") || q.includes("hospital") || q.includes("dlnm") || q.includes("mortality") || q.includes("admissions") || q.includes("health")) {
      return `
        <div class="flex flex-col gap-1.5">
          <div class="font-bold" style="color:var(--critical);">
            🏥 Hospital Surge & Epidemiological Lag Forecast (DLNM)
          </div>
          <p>Due to cumulative cardiovascular and respiratory strain, peak clinical admissions occur at a <strong>2–4 day lag</strong> post-exposure, not day 0.</p>
          <div class="flex flex-col gap-1 text-xs mt-1">
            <div>• <strong>Peak Hospital Surge:</strong> +38.4% emergency admissions projected on Day 3.</div>
            <div>• <strong>Lagged Mortality RR:</strong> 1.42 (95% CI: 1.28–1.57) relative risk.</div>
            <div>• <strong>Mitigation Opportunity:</strong> Early hydration stations & cooling centers reduce peak admissions by <strong>24.6%</strong>.</div>
          </div>
          <div class="mt-2">
            <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.navigateTo('heat-intel'); HEATSHIELD_APP.closeAiAssistant();">
              Inspect Adaptive DLNM Splines →
            </button>
          </div>
        </div>
      `;
    }

    if (q.includes("where should cooling") || q.includes("cooling resources") || (q.includes("cooling") && q.includes("deploy"))) {
      return `
        <div class="flex flex-col gap-1.5">
          <div class="font-bold" style="color:var(--primary);">
            📍 Cooling Resource Optimization Recommendation
          </div>
          <p>Prioritize high-density informal settlements where tin/asbestos roofing traps evening thermal radiation:</p>
          <ol style="padding-left:18px; margin-top:2px;">
            <li><strong>Ward 17 (Burrabazar / Shyambazar):</strong> Deploy 2x 10,000L Water Misting Tankers at the wholesale market perimeter.</li>
            <li><strong>Ward 58 (Seven Tanks / Cossipore):</strong> Activate the 120-bed AC Pop-Up Cooling Hub at the Community Centre.</li>
            <li><strong>Ward 63 (Tala / Dum Dum Road):</strong> Deploy mobile ASHA ORS hydration squad to nursery lanes.</li>
          </ol>
          <div class="mt-2">
            <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.navigateTo('response'); HEATSHIELD_APP.closeAiAssistant();">
              Open Response Authorization Queue →
            </button>
          </div>
        </div>
      `;
    }

    if (q.includes("cause") || q.includes("why") || q.includes("factors") || q.includes("causing")) {
      return `
        <div class="flex flex-col gap-1.5">
          <div class="font-bold" style="color:var(--text-primary);">
            🔍 Multi-Criteria Risk Causal Decomposition · Ward ${ward.ward_id}
          </div>
          <p>The elevated risk score is driven by four deterministic criteria:</p>
          <div class="flex flex-col gap-1 text-xs mt-1">
            <div>• <strong>Thermal Hazard (35%):</strong> Peak apparent heat index ${ward.effective_temp || 46.2}°C with ${ward.rh || 64}% RH.</div>
            <div>• <strong>Slum Density (25%):</strong> High tin/asbestos roof coverage (${Math.round((ward.slum_density || 0.6) * 100)}%) creating indoor greenhouse effects.</div>
            <div>• <strong>Vulnerability (20%):</strong> Elevated elderly and outdoor informal vendor demographic ratio.</div>
            <div>• <strong>Canopy Deficit (20%):</strong> Vegetation index sub-10%, eliminating natural evaporative cooling.</div>
          </div>
          <div class="mt-2">
            <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.navigateTo('ward-intel'); HEATSHIELD_APP.closeAiAssistant();">
              Inspect Full Ward Dossier →
            </button>
          </div>
        </div>
      `;
    }

    if (q.includes("resource") || q.includes("available") || q.includes("tanker") || q.includes("fleet") || q.includes("mist")) {
      return `
        <div class="flex flex-col gap-1.5">
          <div class="font-bold" style="color:var(--text-primary);">
            🚛 Live Municipal Resource Readiness & Fleet Operations
          </div>
          <div class="grid grid-2 gap-2 mt-1">
            <div class="p-2 rounded" style="background:var(--bg-muted); border:1px solid var(--border);">
              <div class="font-bold" style="color:var(--primary);">Tankers Active</div>
              <div><strong>${resources.tankers.available}</strong> available / ${resources.tankers.total} total</div>
            </div>
            <div class="p-2 rounded" style="background:var(--bg-muted); border:1px solid var(--border);">
              <div class="font-bold" style="color:var(--success);">Cooling Hubs</div>
              <div><strong>${resources.coolingHubs.available}</strong> available / ${resources.coolingHubs.total} total</div>
            </div>
            <div class="p-2 rounded" style="background:var(--bg-muted); border:1px solid var(--border);">
              <div class="font-bold" style="color:var(--high);">Medical Squads</div>
              <div><strong>${resources.medicalTeams.available}</strong> available / ${resources.medicalTeams.total} total</div>
            </div>
            <div class="p-2 rounded" style="background:var(--bg-muted); border:1px solid var(--border);">
              <div class="font-bold">Duty Officers</div>
              <div><strong>${resources.officers.available}</strong> available / ${resources.officers.total} total</div>
            </div>
          </div>
          <div class="mt-2">
            <button class="btn btn-secondary btn-sm" onclick="HEATSHIELD_APP.navigateTo('resources'); HEATSHIELD_APP.closeAiAssistant();">
              Inspect Full Fleet Roster →
            </button>
          </div>
        </div>
      `;
    }

    // Default System-Aware Answer
    return `
      <div class="flex flex-col gap-1.5">
        <p>Telemetry recorded across <strong>144 wards</strong> indicates a citywide average apparent temperature of <strong>${this.state.peakTemp}°C</strong> with <strong>${criticalWards.length} wards in Critical status</strong>.</p>
        <p>You can query specific ward safety conditions, cooling center deployment options, or resource availability using the suggested chips above.</p>
      </div>
    `;
  },

  /**
   * Bulk Early Warning Dispatcher
   */
  openBulkWarningModal() {
    const backdrop = document.getElementById("bulkWarningModalBackdrop");
    if (!backdrop) return;

    const criticalWards = this.state.evaluatedWards.filter(w => w.risk_level === "CRITICAL");
    const listEl = document.getElementById("bulkWarningWardList");
    const countEl = document.getElementById("bulkWarningCount");

    if (countEl) countEl.textContent = `${criticalWards.length} Critical Wards`;

    if (listEl) {
      listEl.innerHTML = criticalWards.map(w => `
        <div class="bulk-ward-chip">
          <span class="risk-dot critical"></span>
          <span>Ward ${w.ward_id} · ${w.name}</span>
        </div>
      `).join("");
    }

    backdrop.classList.add("show");
  },

  closeBulkWarningModal() {
    const backdrop = document.getElementById("bulkWarningModalBackdrop");
    if (backdrop) backdrop.classList.remove("show");
  },

  confirmSendBulkWarning() {
    if (this._isSendingBulkWarning) return; // Prevent duplicate execution
    this._isSendingBulkWarning = true;

    const criticalWards = this.state.evaluatedWards.filter(w => w.risk_level === "CRITICAL");
    this.closeBulkWarningModal();

    // Log broadcast action to alert activity log
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST";
    this.state.alertLogs.unshift({
      time: timeStr,
      text: `BROADCAST: Level-3 Thermal Warning issued to ${criticalWards.length} Critical Wards`,
      type: "critical"
    });

    // Provide clear user-facing feedback with explicit simulation notice as required
    this.showToast(`✓ Demo notification generated successfully for ${criticalWards.length} Critical Wards (Simulated Early Warning)`, "success");
    this.renderPage(this.state.currentPage);

    setTimeout(() => {
      this._isSendingBulkWarning = false;
    }, 1000);
  },

  renderAlertTimeline(isBn = false) {
    if (this.state.emergencyMode && window.HEATSHIELD_PAGE_EMERGENCY && typeof window.HEATSHIELD_PAGE_EMERGENCY.renderTimeline === "function") {
      window.HEATSHIELD_PAGE_EMERGENCY.renderTimeline(this.state);
    }
    const drawer = document.getElementById("notifDrawerBackdrop");
    if (drawer && drawer.classList.contains("show")) {
      this.openNotificationDrawer();
    }
  },

  renderLogisticsRouteCard() {
    const container = document.getElementById("logisticsRouteContainer");
    if (!container) {
      if (this.state.currentPage === 'resources' && window.HEATSHIELD_PAGE_RESOURCES && typeof window.HEATSHIELD_PAGE_RESOURCES.render === "function") {
        window.HEATSHIELD_PAGE_RESOURCES.render(this.state);
      }
      return;
    }
    const state = this.state || window.HEATSHIELD_STATE;
    if (!state || !state.assignedTankers || state.assignedTankers.length === 0) {
      container.classList.add("hidden");
      return;
    }
    container.classList.remove("hidden");
    const tanker = state.assignedTankers[state.selectedTankerIndex || 0];
    if (!tanker) return;
    const badgeEl = document.getElementById("routeStatusBadge");
    if (badgeEl) badgeEl.textContent = tanker.status || "ROUTE NOT LOADED";
    const distEl = document.getElementById("routeDistance");
    if (distEl) distEl.textContent = tanker.distanceRemaining !== undefined ? `${tanker.distanceRemaining} km` : (tanker.route ? `${(tanker.route.distance / 1000).toFixed(1)} km` : "-- km");
    const durEl = document.getElementById("routeDuration");
    if (durEl) durEl.textContent = tanker.eta !== undefined ? `${tanker.eta} min` : (tanker.route ? `${Math.round(tanker.route.duration / 60)} min` : "-- min");
  }
};

// Bootstrap when DOM is Ready
document.addEventListener("DOMContentLoaded", () => {
  window.HEATSHIELD_APP.init();
});
