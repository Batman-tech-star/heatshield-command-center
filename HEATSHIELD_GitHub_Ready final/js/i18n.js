/**
 * HEATSHIELD :: KCAP-2025 Bilingual Dictionary & Translation Engine
 * Complete English (EN) & বাংলা (BN) Dictionary
 */

const HEATSHIELD_I18N = {
  currentLang: "en",

  translations: {
    en: {
      // Header & System Meta
      system_title: "HEATSHIELD",
      sub_title: "Kolkata Heat Risk Intelligence :: KCAP-2025 Command Module",
      target_ps: "SIH26083 | Ministry of Earth Sciences | NCMRWF",
      satellite_sync: "REPRESENTATIVE CITY WEATHER",
      weather_offline: "OFFLINE / CACHED BASELINE",
      system_online: "SYSTEM ONLINE",
      ist_clock: "Live IST Clock",
      btn_export_docket: "Export Docket",
      btn_presentation_mode: "Presentation Mode",
      btn_accessibility_mode: "Accessibility",
      btn_compare_mode: "Compare Wards",
      btn_lang_toggle: "বাংলা",
      cmd_search_placeholder: "Search ward, locality, action, or tool (Ctrl + K)...",

      // Top Executive KPI Ribbon
      kpi_critical_wards: "Critical Wards",
      kpi_critical_sub: "Immediate Intervention Req.",
      kpi_peak_temp: "Peak Outdoor Temp",
      kpi_peak_temp_sub: "Live WMO Station (Alipore)",
      kpi_heat_index: "Heat Index (Feels Like)",
      kpi_heat_index_sub: "Combined RH & Thermal Stress",
      kpi_population: "Planning Pop. Exposed",
      kpi_population_sub: "Census 2011 Baseline",
      kpi_indoor_exposure: "Peak Indoor Exposure",
      kpi_indoor_exposure_sub: "Modeled Slum Interior",
      kpi_mitigation_units: "Available Response Assets",
      kpi_mitigation_sub: "Active Tankers & Cooling Hubs",

      // Map Controls & Layer Switcher
      map_title: "Geospatial Intelligence Workspace",
      map_kcap_badge: "KCAP 2025 Baseline Active: +2.6°C Urban Surge & Wetland Loss Proxy",
      layer_risk: "Risk (HHVI)",
      layer_population: "Population Density",
      layer_slum: "Slum Microclimate",
      layer_elderly: "Elderly & Labor Ratio",
      layer_canopy: "Tree Canopy Cover",
      layer_wetland: "Wetland Proximity",
      layer_grid: "Grid Load Stress",
      layer_night: "Night Heat Trapping (LST)",
      map_3d_toggle: "3D Perspective",
      map_reset_view: "Reset City View",
      map_search_placeholder: "Find ward or landmark...",
      map_filter_all: "All Wards",
      map_filter_critical: "Critical (≥80)",
      map_filter_high: "High (65-79)",
      map_filter_moderate: "Moderate (50-64)",
      map_filter_safe: "Safe (<50)",

      // Ward Intelligence Panel Tabs
      tab_overview: "Overview",
      tab_weather: "Live Weather",
      tab_vulnerability: "Vulnerability",
      tab_resources: "Resources",
      tab_history: "History",
      tab_data_audit: "Data Audit",

      // Ward Intelligence Dossier Details
      diag_title: "Ward Operational Intelligence Dossier",
      diag_select_prompt: "Select any ward on the map or ranking table to view intelligence.",
      diag_confidence_title: "Data Confidence Score",
      diag_confidence_desc: "Verifiable telemetry & census cross-validation index.",
      diag_why_score_btn: "Why This Score?",
      diag_why_modal_title: "HHVI Score Explainability Decomposition",
      diag_indoor_flow_title: "Modeled Indoor Heat Exposure Flow",
      diag_indoor_flow_sub: "Simulated radiant heat penetration in dense informal housing.",
      flow_outdoor: "Outdoor Shade Temp",
      flow_heat_index: "Apparent Heat Index",
      flow_slum_penalty: "Tin-Roof Insulation Penalty",
      flow_indoor_est: "Modeled Slum Indoor Temp",
      model_estimate_badge: "MODEL ESTIMATE (Not Sensor)",

      // NEW: AI Tactical Decision Copilot & Biometeorology
      ai_copilot_title: "AI Tactical Dispatch Advisor & Bio-Thermal Strain",
      ai_copilot_badge: "AUTONOMOUS AI ADVISORY",
      ai_copilot_sub: "Autonomous optimization directives & physiological tolerance model for active ward.",
      bio_safe_labor: "Safe Continuous Labor Limit",
      bio_csi: "Cardiovascular Strain Index",
      bio_sweat: "Sweat Evaporation Efficiency",
      bio_core_temp: "Projected Core Body Temp",
      btn_ai_auto_mitigate: "⚡ Auto-Mitigate & Deploy AI Plan",

      // Mayor What-If Simulation Laboratory
      sandbox_title: "Mayor's 'What-If' Simulation Laboratory",
      sandbox_subtitle: "Capacity-Constrained Logistics Optimization & Policy Testing",
      strategy_label: "Logistics Prioritization Strategy:",
      strategy_vulnerable: "🛡️ Protect Most Vulnerable (High Slum / Elderly)",
      strategy_critical: "🚨 Reduce Critical Wards (HHVI ≥ 80)",
      strategy_population: "👥 Maximum Population Coverage",
      strategy_balanced: "⚖️ Balanced Multi-Objective Strategy",
      slider_tankers: "Emergency Water Tankers",
      slider_tankers_units: "10,000L Misting / Potable Units",
      slider_buses: "Mobile Cooling Hubs / Transit Units",
      slider_buses_units: "Air-Conditioned Emergency Shelters",
      slider_medical: "Rapid Response Medical Teams",
      slider_medical_units: "ASHA + Paramedic Heat Stroke Units",
      toggle_labor_ban: "Enforce High-Noon Labor Shift Ban (11:00 AM - 3:30 PM)",
      toggle_labor_sub: "Section 144 mandatory shutdown for outdoor construction, delivery & port workers",
      sandbox_delta_title: "Real-Time Simulation Impact (Before → After):",
      delta_critical_wards: "Critical Wards:",
      delta_exposed_pop: "Population Exposed:",
      delta_city_coverage: "Asset Coverage:",

      // Time Travel Forecast & Heat Replay
      time_travel_title: "Time-Travel Forecast & Diurnal Replay Command Deck",
      time_travel_sub: "Real-time atmospheric predictive modeling & 24-hour diurnal thermal cycle analysis.",
      time_now: "Now (Live)",
      time_plus_6h: "+6 Hours",
      time_plus_12h: "+12 Hours",
      time_tomorrow: "Tomorrow (+24h)",
      time_plus_3d: "+3 Days (Peak Lag)",
      forecast_simulation_badge: "PREDICTIVE FORECAST MODEL",

      heat_replay_title: "Diurnal 24-Hr Cycle Scrubber:",
      replay_morning: "06:00 Morning",
      replay_morning_peak: "10:00 Morning Ramp",
      replay_noon: "13:30 Solar Peak (41.2°C)",
      replay_evening: "17:30 Evening Flush",
      replay_night: "22:00 Night Heat Trap",

      // 7-Day DLNM Analytics Card
      dlnm_title: "7-Day DLNM Cardiorespiratory Surge Analytics",
      dlnm_subtitle: "Distributed Lag Non-Linear Model (+3 to +5 Days Hospital Surge Lag)",
      dlnm_tooltip_info: "DLNM epidemiological model: Peak physiological collapse occurs 72–120 hours post extreme wet-bulb exposure.",
      dlnm_temp_line: "Ambient Forecast Temp (°C)",
      dlnm_surge_bar: "Emergency Hospital Inflow Surge (%)",
      dlnm_view_combined: "Combined",
      dlnm_view_area: "Area Surge",
      dlnm_view_line: "Line Only",
      btn_download_chart: "Download PNG",
      dlnm_lag_day_3: "+3 Days: Cardiovascular Shock Inflow",
      dlnm_lag_day_5: "+5 Days: Renal Failure & Dehydration",

      // Ward Comparison Mode
      compare_title: "Dual Ward Intelligence Comparison",
      compare_sub: "Side-by-side epidemiological, demographic, and logistical vulnerability audit.",
      compare_select_a: "Primary Ward (A):",
      compare_select_b: "Comparison Ward (B):",

      // Resource Allocation Flow
      flow_title: "Resource Allocation Operational Flow",
      flow_sub: "Real-time routing from City Depots → Priority Engine → Critical Wards.",
      flow_depot: "Central Depot Fleet",
      flow_engine: "Optimization Engine",
      flow_deployed: "Deployed Field Nodes",

      // Infrastructure Domino Network
      domino_title: "Infrastructure Domino & Cascading Failure Network",
      domino_sub: "Automated predictive stress-test modeling cascading power cuts, pump outages, and hospital bed surges during extreme heat.",
      domino_status_critical: "CRITICAL NETWORK WARNING",
      domino_scenario_badge: "PREDICTIVE STRESS MODEL (Click Action to Mitigate)",
      domino_explainer: "Why Critical? Peak AC demand overloads 33kV substations in Ward 63, threatening water pumping station power cuts and hospital emergency bed overflows.",

      // Citywide Priority Ranking Matrix
      dispatch_table_title: "Citywide Ward Priority Ranking Matrix",
      col_rank: "Rank",
      col_ward: "Ward & Locality",
      col_outdoor_temp: "Outdoor Temp",
      col_temp: "Modeled Indoor",
      col_wbgt: "WBGT",
      col_slum: "Slum Density",
      col_hhvi: "Mitigated HHVI",
      col_status: "Risk Tier",
      col_confidence: "Confidence",
      col_action: "Action",
      btn_dispatch_squad: "⚡ AUTO-DISPATCH PARA-CLUB & ASHA",
      btn_diagnostics: "Diagnostics",

      // Alert Timeline
      timeline_title: "Operational Alert Timeline & Incident Log",
      timeline_sub: "Real-time audit log of environmental threshold breaches and tactical simulations.",

      // Data Provenance Center
      provenance_title: "Data Provenance & Source Verification Audit",
      provenance_sub: "Transparent verification of authoritative, live, derived, and modeled layers.",
      col_dataset: "Dataset Layer",
      col_source: "Authoritative Source",
      col_vintage: "Vintage / Year",
      col_type: "Layer Type",
      col_audit_conf: "Confidence",

      // Accessibility & Presentation Mode
      access_title: "Accessibility Controls",
      access_font_size: "Typography Scale:",
      access_high_contrast: "High Contrast Dark Mode",
      access_reduce_motion: "Reduce Interface Motion",
      access_colorblind: "Colorblind-Safe Palette (Deuteranopia/Protanopia)",
      access_reset: "Reset Defaults",

      pres_title: "HEATSHIELD Executive Presentation Mode",
      pres_sub: "Use Left / Right arrow keys to cycle slides. Press ESC to exit.",
      pres_slide_1: "1. Kolkata Heat Emergency Crisis Overview",
      pres_slide_2: "2. Slum Microclimate & The 'Indoor Oven' Trap",
      pres_slide_3: "3. Mayor's Logistics Sandbox & Asset Mitigation",
      pres_slide_4: "4. Infrastructure Overload & Power Grid Domino",
      pres_slide_5: "5. 7-Day DLNM Lagged Mortality Hospital Surge",

      // Risk Tiers
      risk_critical: "CRITICAL",
      risk_high: "HIGH",
      risk_moderate: "MODERATE",
      risk_safe: "MITIGATED",

      // Integrity Badges
      badge_source_backed: "SOURCE-BACKED",
      badge_live: "LIVE",
      badge_derived: "DERIVED",
      badge_modelled: "MODELLED",
      badge_synthetic: "SYNTHETIC PROTOTYPE",
      badge_simulation: "SIMULATION",

      // Logistics Route Intelligence
      route_title: "Logistics Route Intelligence",
      route_subtitle: "Road-Network Routing & Alternative Analysis",
      route_select_label: "Select Assigned Response Tanker:",
      route_dest_label: "Destination (Prototype Target)",
      route_origin_label: "Origin (Prototype Depot)",
      route_fastest_label: "Fastest Calculated Route",
      route_alt_label: "Alternate Options:",
      route_path_label: "Calculated Road Segment Transit Path:",
      btn_view_route: "View Route",
      btn_alt_route: "Alternative",
      btn_fit_route: "Fit Map",
      btn_clear_route: "Clear",
      route_show_all_label: "Show all routes simultaneously:",

      // Fleet Tracking
      fleet_title: "Active Response Fleet",
      fleet_subtitle: "Live Fleet Tracking & Telemetry Sync",
      kpi_active: "ACTIVE",
      kpi_enroute: "EN ROUTE",
      kpi_available: "AVAIL",
      kpi_arrived: "ARRIVED",
      kpi_offline: "OFFLINE",
      btn_start_sim: "Start",
      btn_reset_sim: "Reset",
      sim_speed_label: "Simulation Speed:",
      gps_source_label: "GPS Telemetry Source:",
      fleet_no_match: "No tankers match filter.",
      arrival_title: "🎉 TANKER ARRIVED",
      arrival_sub: "STATUS: RESOURCE DELIVERY READY (DELIVERY SIMULATION)",
      // Census population upgrade keys
      pop_census_2011: "2011 Census Population",
      pop_estimate_2026: "2026 Planning Estimate",
      source_backed: "Source-Backed",
      modelled: "Modelled",
      not_available: "Not Available",
      historical_baseline: "Historical Baseline",
      planning_population: "Planning Population",
      not_yet_verified: "Not Yet Verified",
      no_direct_match: "No Direct Match"
    },

    bn: {
      // Header & System Meta
      system_title: "হিটশিল্ড",
      sub_title: "কলকাতা চরম তাপ ঝুঁকি ইন্টেলিজেন্স :: কেক্যাপ-২০২৫ কমান্ড মডিউল",
      target_ps: "SIH26083 | ভূবিজ্ঞান মন্ত্রক | NCMRWF",
      satellite_sync: "প্রতিনিধিত্বমূলক শহরের আবহাওয়া",
      weather_offline: "অফলাইন / ক্যাশড বেসলাইন",
      system_online: "সিস্টেম অনলাইন",
      ist_clock: "লাইভ ভারতীয় সময় (IST)",
      btn_export_docket: "সিচুয়েশন ডকেট",
      btn_presentation_mode: "উপস্থাপনা মোড",
      btn_accessibility_mode: "অ্যাক্সেসিবিলিটি",
      btn_compare_mode: "ওয়ার্ড তুলনা",
      btn_lang_toggle: "English",
      cmd_search_placeholder: "ওয়ার্ড, এলাকা, অ্যাকশন বা টুল অনুসন্ধান করুন (Ctrl + K)...",

      // Top Executive KPI Ribbon
      kpi_critical_wards: "মারাত্মক ঝুঁকিপূর্ণ ওয়ার্ড",
      kpi_critical_sub: "অবিলম্বে হস্তক্ষেপ প্রয়োজন",
      kpi_peak_temp: "সর্বোচ্চ বাইরের তাপমাত্রা",
      kpi_peak_temp_sub: "লাইভ আলিপুর আবহাওয়া কেন্দ্র",
      kpi_heat_index: "হিট ইনডেক্স (অনুভূত তাপ)",
      kpi_heat_index_sub: "আর্দ্রতা ও তাপীয় চাপের সংমিশ্রণ",
      kpi_population: "পরিকল্পনা জনসংখ্যা ঝুঁকির মুখে",
      kpi_population_sub: "২০১১ আদমশুমারি ভিত্তিরেখা",
      kpi_indoor_exposure: "সর্বোচ্চ ইনডোর তাপমাত্রা",
      kpi_indoor_exposure_sub: "মডেলকৃত বস্তির অভ্যন্তরীণ",
      kpi_mitigation_units: "উপলব্ধ প্রশমন ইউনিট",
      kpi_mitigation_sub: "নিয়োজিত ট্যাঙ্কার ও কুলিং কেন্দ্র",

      // Map Controls & Layer Switcher
      map_title: "জিওস্প্যাশিয়াল ইন্টেলিজেন্স ওয়ার্কস্পেস",
      map_kcap_badge: "কেক্যাপ ২০২৫ সক্রিয়: +২.৬°C আরবান সার্জ ও জলাভূমি ক্ষয় বেসলাইন",
      layer_risk: "ঝুঁকি সূচক (HHVI)",
      layer_population: "জনঘনত্ব",
      layer_slum: "বস্তি মাইক্রোক্লাইমেট",
      layer_elderly: "বয়স্ক ও শ্রমজীবী অনুপাত",
      layer_canopy: "বৃক্ষ আচ্ছাদন (গাছপালা)",
      layer_wetland: "জলাভূমি দূরত্ব",
      layer_grid: "গ্রিড লোড স্ট্রেস",
      layer_night: "রাতের তাপ ধারণ (LST)",
      map_3d_toggle: "ত্রিমাত্রিক (3D) দৃশ্য",
      map_reset_view: "শহরের দৃশ্য রিসেট",
      map_search_placeholder: "ওয়ার্ড বা ল্যান্ডমার্ক খুঁজুন...",
      map_filter_all: "সকল ওয়ার্ড (১৪৪)",
      map_filter_critical: "মারাত্মক (≥৮০)",
      map_filter_high: "উচ্চ ঝুঁকি (৬৫-৭৯)",
      map_filter_moderate: "মাঝারি ঝুঁকি (৫০-৬৪)",
      map_filter_safe: "নিয়ন্ত্রিত (<৫০)",

      // Ward Intelligence Panel Tabs
      tab_overview: "সারসংক্ষেপ",
      tab_weather: "লাইভ আবহাওয়া",
      tab_vulnerability: "ঝুঁকি বিশ্লেষণ",
      tab_resources: "সম্পদ বরাদ্দ",
      tab_history: "ইতিহাস",
      tab_data_audit: "উৎস নিরীক্ষা",

      // Ward Intelligence Dossier Details
      diag_title: "ওয়ার্ড অপারেশনাল ইন্টেলিজেন্স ডসিয়ার",
      diag_select_prompt: "বিস্তারিত বিশ্লেষণ দেখতে মানচিত্র বা টেবিলে যেকোনো ওয়ার্ড নির্বাচন করুন।",
      diag_confidence_title: "তথ্য নির্ভরযোগ্যতা স্কোর",
      diag_confidence_desc: "যাচাইকৃত সেন্সাস ও লাইভ স্যাটেলাইট ক্রসবহুল সূচক।",
      diag_why_score_btn: "স্কোরের কারণ কী?",
      diag_why_modal_title: "HHVI স্কোরের কারণ ও উপাদানের বিশদ বিশ্লেষণ",
      diag_indoor_flow_title: "মডেলভিত্তিক ইনডোর তাপ প্রবাহ",
      diag_indoor_flow_sub: "ঘন বস্তি এলাকায় বিকিরিত তাপ আটকে থাকার চিত্র।",
      flow_outdoor: "বাইরের ছায়া তাপমাত্রা",
      flow_heat_index: "অনুভূত হিট ইনডেক্স",
      flow_slum_penalty: "টিনের চালের অতিরিক্ত তাপ",
      flow_indoor_est: "বস্তি ঘরের অভ্যন্তরীণ তাপমাত্রা",
      model_estimate_badge: "মডেল অনুমান (সেন্সর নয়)",

      // NEW: AI Tactical Decision Copilot & Biometeorology (Bengali)
      ai_copilot_title: "এআই ট্যাকটিক্যাল ডিসপ্যাচ অ্যাডভাইজর ও বায়ো-থার্মাল স্ট্রেস",
      ai_copilot_badge: "স্বয়ংক্রিয় এআই পরামর্শ",
      ai_copilot_sub: "নির্বাচিত ওয়ার্ডের জন্য স্বয়ংক্রিয় অপ্টিমাইজেশন ও মানবদেহের তাপসহনশীলতা মডেল।",
      bio_safe_labor: "নিরাপদ ধারাবাহিক শ্রমসীমা",
      bio_csi: "কার্ডিওভাসকুলার স্ট্রেস সূচক",
      bio_sweat: "ঘাম বাষ্পীভবন কার্যকারিতা",
      bio_core_temp: "আনুমানিক অভ্যন্তরীণ শরীরের তাপমাত্রা",
      btn_ai_auto_mitigate: "⚡ এআই পরিকল্পনা স্বয়ংক্রিয়ভাবে কার্যকর করুন",

      // Mayor What-If Simulation Laboratory
      sandbox_title: "মেয়রের 'হোয়াট-ইফ' সিমুলেশন ল্যাবরেটরি",
      sandbox_subtitle: "সীমাবদ্ধ পৌর সম্পদ অপ্টিমাইজেশন ও নীতি প্রয়োগ সিমুলেশন",
      strategy_label: "লজিস্টিক অগ্রাধিকার কৌশল:",
      strategy_vulnerable: "🛡️ সর্বাধিক ঝুঁকিপূর্ণদের সুরক্ষা (বস্তি ও বয়স্ক)",
      strategy_critical: "🚨 মারাত্মক ওয়ার্ডের ঝুঁকি হ্রাস (HHVI ≥ ৮০)",
      strategy_population: "👥 সর্বাধিক জনসংখ্যা কভারেজ",
      strategy_balanced: "⚖️ সুষম সমন্বিত কৌশল",
      slider_tankers: "জরুরী জল ট্যাঙ্কার মোতায়েন",
      slider_tankers_units: "১০,০০০ লিটার মিস্ট/পানীয় জল ইউনিট",
      slider_buses: "ভ্রাম্যমাণ শীতাতপ কুলিং বাস/কেন্দ্র",
      slider_buses_units: "জরুরি শীতাতপ আশ্রয় কেন্দ্র",
      slider_medical: "দ্রুত সাড়াদানকারী মেডিকেল টিম",
      slider_medical_units: "আশা + প্যারামেডিক হিটস্ট্রোক স্কোয়াড",
      toggle_labor_ban: "দুপুর বেলা বহিরাঙ্গন কায়িক শ্রম নিষিদ্ধকরণ (১১:০০ - ৩:৩০)",
      toggle_labor_sub: "১৪৪ ধারা জারি করে নির্মাণ শ্রমিক, ডেলিভারি ও কুলি কর্মীদের কাজ বন্ধ রাখা",
      sandbox_delta_title: "রিয়েল-টাইম সিমুলেশন প্রভাব (পূর্বে → পরে):",
      delta_critical_wards: "মারাত্মক ওয়ার্ড:",
      delta_exposed_pop: "ঝুঁকিতে থাকা জনসংখ্যা:",
      delta_city_coverage: "সম্পদ কভারেজ:",

      // Time Travel Forecast & Heat Replay
      time_travel_title: "টাইম-ট্রাভেল পূর্বাভাস ও দৈনিক তাপচক্র ডেক",
      time_travel_sub: "বায়ুমণ্ডলীয় মডেলভিত্তিক পূর্বাভাস ও ২৪ ঘণ্টার থার্মাল সাইকেল সিমুলেশন।",
      time_now: "এখন (লাইভ)",
      time_plus_6h: "+৬ ঘণ্টা",
      time_plus_12h: "+১২ ঘণ্টা",
      time_tomorrow: "আগামীকাল (+২৪ ঘণ্টা)",
      time_plus_3d: "+৩ দিন (ল্যাগ পিক)",
      forecast_simulation_badge: "পূর্বাভাস মডেল",

      heat_replay_title: "দৈনিক তাপচক্র স্ক্রাবার:",
      replay_morning: "০৬:০০ সকাল",
      replay_morning_peak: "১০:০০ সকালের বৃদ্ধি",
      replay_noon: "১৩:৩০ মধ্যাহ্ন শীর্ষ (৪১.২°C)",
      replay_evening: "১৭:৩০ বিকেল",
      replay_night: "২২:০০ রাতের তাপ ধারণ",

      // 7-Day DLNM Analytics Card
      dlnm_title: "৭-দিনের DLNM কার্ডিওরেসপিরেটরি সার্জ বিশ্লেষণ",
      dlnm_subtitle: "ডিস্ট্রিবিউটেড ল্যাগ নন-লিনিয়ার মডেল (+৩ থেকে +৫ দিন হাসপাতালে রোগীর চাপ)",
      dlnm_tooltip_info: "DLNM মহামারী সংক্রান্ত মডেল: তাপপ্রবাহের ৭২-১২০ ঘণ্টা পর মানবদেহে চরম রোগাক্রান্ত হওয়ার ঝুঁকি দেখা দেয়।",
      dlnm_temp_line: "পূর্বাভাস তাপমাত্রা (°C)",
      dlnm_surge_bar: "হাসপাতালে জরুরি রোগী বৃদ্ধির হার (%)",
      dlnm_view_combined: "উভয়",
      dlnm_view_area: "সার্জ এরিয়া",
      dlnm_view_line: "কেবল রেখা",
      btn_download_chart: "পিএনজি ডাউনলোড",
      dlnm_lag_day_3: "+৩ দিন: কার্ডিওভাসকুলার শক বৃদ্ধি",
      dlnm_lag_day_5: "+৫ দিন: কিডনি বিকল ও মারাত্মক পানিশূন্যতা",

      // Infrastructure Domino Network
      domino_title: "পরিকাঠামো ডোমিনো ও ধারাবাহিক বিপর্যয় নেটওয়ার্ক",
      domino_sub: "চরম গরমে বিদ্যুৎ গ্রিড, পানীয় জল পাম্প এবং হাসপাতালে ধারাবাহিক বিপর্যয়ের মডেল।",
      domino_status_critical: "মারাত্মক পরিকাঠামো সতর্কতা",
      domino_scenario_badge: "পূর্বাভাস দৃশ্যকল্প (পদক্ষেপ নিতে বোতামে ক্লিক করুন)",
      domino_explainer: "কেন সংকটজনক? অতিরিক্ত এসি ব্যবহারের কারণে ৬৩ নং ওয়ার্ডের ৩৩কেভি সাবস্টেশন ওভারলোড হয়, যা জল পাম্প বন্ধ এবং হাসপাতালে জরুরি রোগী বৃদ্ধির ঝুঁকি তৈরি করে।",

      // Risk Tiers
      risk_critical: "মারাত্মক",
      risk_high: "উচ্চ ঝুঁকি",
      risk_moderate: "মাঝারি",
      risk_safe: "নিয়ন্ত্রিত",

      // Integrity Badges
      badge_source_backed: "উৎস-যাচাইকৃত",
      badge_live: "লাইভ",
      badge_derived: "উদ্ভূত",
      badge_modelled: "মডেলভিত্তিক",
      badge_synthetic: "সিন্থেটিক প্রোটোটাইপ",
      badge_simulation: "সিমুলেশন",

      // Citywide Table Translations (Bengali)
      dispatch_table_title: "সিটিওয়াইড ওয়ার্ড অগ্রাধিকার তালিকা",
      col_rank: "র‍্যাঙ্ক",
      col_ward: "ওয়ার্ড ও এলাকা",
      col_outdoor_temp: "বাইরের তাপমাত্রা",
      col_temp: "ইনডোর তাপমাত্রা",
      col_wbgt: "ডাব্লিউবিজিটি",
      col_slum: "বস্তি ঘনত্ব",
      col_hhvi: "প্রশমিত HHVI",
      col_status: "ঝুঁকি স্তর",
      col_confidence: "নির্ভরযোগ্যতা",
      col_action: "অ্যাকশন",

      // Logistics Route Intelligence (Bengali)
      route_title: "লজিস্টিক রুট ইন্টেলিজেন্স",
      route_subtitle: "রোড-নেটওয়ার্ক রাউটিং ও বিকল্প বিশ্লেষণ",
      route_select_label: "নিযুক্ত প্রতিক্রিয়া ট্যাঙ্কার নির্বাচন করুন:",
      route_dest_label: "গন্তব্য (প্রোটোটাইপ লক্ষ্য)",
      route_origin_label: "উত্স (প্রোটোটাইপ ডিপো)",
      route_fastest_label: "দ্রুততম হিসাবকৃত রুট",
      route_alt_label: "বিকল্প রুট অপশন:",
      route_path_label: "হিসাবকৃত সড়ক সংযোগ ট্রানজিট পথ:",
      btn_view_route: "রুট দেখুন",
      btn_alt_route: "বিকল্প রুট",
      btn_fit_route: "ফিট ম্যাপ",
      btn_clear_route: "পরিষ্কার করুন",
      route_show_all_label: "একই সাথে সমস্ত রুট দেখান:",

      // Fleet Tracking (Bengali)
      fleet_title: "সক্রিয় প্রতিক্রিয়া বহর",
      fleet_subtitle: "লাইভ ফ্লিট ট্র্যাকিং ও টেলিমেট্রি সিঙ্ক",
      kpi_active: "সক্রিয়",
      kpi_enroute: "চলমান",
      kpi_available: "প্রস্তুত",
      kpi_arrived: "পৌঁছেছে",
      kpi_offline: "অফলাইন",
      btn_start_sim: "শুরু করুন",
      btn_reset_sim: "রিসেট",
      sim_speed_label: "সিমুলেশন গতি:",
      gps_source_label: "জিপিএস টেলিমেট্রি উৎস:",
      fleet_no_match: "ফিল্টারের সাথে মেলে এমন কোন ট্যাঙ্কার নেই।",
      arrival_title: "🎉 ট্যাঙ্কার পৌঁছেছে",
      arrival_sub: "অবস্থা: সম্পদ সরবরাহ প্রস্তুত (সরবরাহ সিমুলেশন)",
      // Census population upgrade keys
      pop_census_2011: "২০১১ আদমশুমারি জনসংখ্যা",
      pop_estimate_2026: "২০২৬ পরিকল্পনা অনুমান",
      source_backed: "উৎস-সমর্থিত",
      modelled: "মডেলকৃত",
      not_available: "উপলব্ধ নয়",
      historical_baseline: "ঐতিহাসিক ভিত্তিরেখা",
      planning_population: "পরিকল্পনা জনসংখ্যা",
      not_yet_verified: "এখনও যাচাই করা হয়নি",
      no_direct_match: "কোন সরাসরি মিল নেই"
    }
  },

  getText(key, lang = this.currentLang) {
    const dict = this.translations[lang] || this.translations.en;
    return dict[key] || this.translations.en[key] || key;
  },

  setLang(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      this.applyTranslations();
      return true;
    }
    return false;
  },

  applyTranslations() {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
      const key = el.getAttribute("data-i18n");
      const text = this.getText(key);
      if (text) el.textContent = text;
    });

    const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
    placeholders.forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      const text = this.getText(key);
      if (text) el.setAttribute("placeholder", text);
    });

    window.dispatchEvent(new CustomEvent("heatshield:lang_changed", { detail: { lang: this.currentLang } }));
  }
};

window.HEATSHIELD_I18N = HEATSHIELD_I18N;
