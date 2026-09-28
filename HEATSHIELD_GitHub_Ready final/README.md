# 🛡️ HEATSHIELD — Municipal Heat-Health Intelligence & B2G Decision Support
### SIH26083 :: Kolkata Municipal Corporation (KMC) Command Center Platform
**"Apple-level visual polish + Bloomberg/Palantir-level information hierarchy + Government command-center usability"**

---

## 📖 Table of Contents
1. [Core Product Mission](#1-core-product-mission)
2. [UX Principle: "One Page = One Job"](#2-ux-principle-one-page--one-job)
3. [System Architecture & 8-Page Structure](#3-system-architecture--8-page-structure)
4. [Scientific & Mathematical Engines](#4-scientific--mathematical-engines)
   - [Adaptive Heat-Health DLNM (Distributed Lag Non-Linear Model)](#adaptive-heat-health-dlnm)
   - [HHVI Composite Risk Scoring (Deterministic & Mitigated)](#hhvi-composite-risk-scoring)
   - [Intelligent Dynamic Label Density (GIS Engine)](#intelligent-dynamic-label-density)
5. [Data Provenance & Verification Baseline](#5-data-provenance--verification-baseline)
6. [Interactive Features & Operational Tools](#6-interactive-features--operational-tools)
7. [Running Tests & Quality Assurance](#7-running-tests--quality-assurance)
8. [Quick Start & Local Deployment](#8-quick-start--local-deployment)

---

## 1. Core Product Mission

**HEATSHIELD** transforms municipal heat disaster management from passive meteorological observation into proactive, capacity-constrained decision support. Built for Kolkata Municipal Corporation's 144 administrative wards, it solves the fundamental disconnect between raw weather forecasts and actionable field operations:

```
WEATHER FORECAST (Open-Meteo / WMO Alipore 42807)
  ↓
THERMAL-STRESS ENGINE (Effective Heat & Microclimate Traps)
  ↓
VULNERABILITY ENGINE (Census 2011, Slum Density, Tree Canopy, Elderly Ratio)
  ↓
ADAPTIVE DLNM HEALTH-RISK ENGINE (0-7 Day Distributed Lag Non-Linear Curve)
  ↓
GIS SPATIAL ENGINE (144 Spatial Polygon Choropleths & Zero-Overlap Labels)
  ↓
ACTION & FLEET ENGINE (Automated Allocation: Tankers, Cooling Hubs, Medical Squads)
```

---

## 2. UX Principle: "One Page = One Job"

Rather than overwhelming municipal executives with an endless single-page dashboard, HEATSHIELD organizes command capabilities into **8 dedicated, purpose-built workspaces**:

| Page | Question Answered | Core Job & Capabilities |
| :--- | :--- | :--- |
| **1. Overview** | *"What is happening right now?"* | City status KPIs, quick-glance GIS choropleth, top 5 priority queue, and active advisory strips. |
| **2. Heat Intelligence** | *"Why is it hot & what happens next?"* | 24-Hour diurnal thermal curve, 7-day forecast, and full Adaptive DLNM lag models with 95% CIs. |
| **3. Ward Intelligence** | *"Understand one ward in depth."* | 144-ward filterable roster, 5-part waterfall risk breakdown, community contacts, and direct dispatch buttons. |
| **4. Heat Map (GIS)** | *"Where is the spatial risk?"* | Full-viewport map, multi-basemap switcher (Standard/Satellite/Dark/Terrain), dynamic legend, forecast slider (`NOW` to `+72H`), sliding ward drawer. |
| **5. Response Queue** | *"What action needs approval?"* | Multi-agency approval workflow (Recommended → Review → Approve → Assign → En Route → Completed). |
| **6. Resources & Fleet** | *"What assets do we have?"* | Real-time capacity meters, asset roster (Tankers, Cooling Hubs, Medical Teams), and AI priority optimizer. |
| **7. Scenarios Simulator** | *"What if we change the plan?"* | Escalation sliders (+0.5°C to +5°C), policy toggles (labor pause, tanker surge) with comparative before/after delta. |
| **8. Reports & Export** | *"Create official records."* | 4 in-browser PDF report generators (Situation, Ward Dossier, Response, DLNM Impact), CSV & JSON raw exporters. |

---

## 3. System Architecture & 8-Page Structure

HEATSHIELD is built on a clean, zero-build, zero-dependency vanilla JavaScript architecture for 100% offline and intranet compatibility:

```
heatshield-command-center/
├── index.html                   # Master SPA shell, sidebar navigation, top header bar, modal overlays
├── css/
│   └── styles.css               # Dual-theme design system (Government Light Mode + Command Dark Mode)
├── js/
│   ├── kolkata_boundaries.js    # Synchronous GeoJSON polygons for all 144 Kolkata administrative wards
│   ├── data.js                  # Census 2011 verified populations, baseline demographics & asset registry
│   ├── adaptiveDlnm.js          # Hierarchical Adaptive DLNM mathematical engine (B-splines, 95% CIs)
│   ├── engine.js                # HHVI calculation, WBGT, biometeorological stress & domino cascade
│   ├── map.js                   # Leaflet GIS engine, intelligent label density, multi-basemap registry
│   ├── routeService.js          # OSRM turn-by-turn routing engine for emergency misting tankers
│   ├── fleetService.js          # Municipal vehicle GPS telemetry simulator & dispatch controller
│   ├── modal.js                 # Global modal controller, compare view, and notification center
│   ├── i18n.js                  # 100% bilingual English and Bengali (বাংলা) dictionary
│   ├── app.js                   # State manager, reactive event bus, PDF generator, and data exporter
│   └── pages/
│       ├── overview.js          # Page 1: City Overview & Executive Landing View
│       ├── heat-intel.js        # Page 2: Thermal Intelligence & DLNM Diagnostics
│       ├── ward-intel.js        # Page 3: Filterable Ward Roster & Micro-Demographic Dossier
│       ├── heatmap.js           # Page 4: Tactical Full-Viewport GIS with Sliding Drawer
│       ├── response.js          # Page 5: Response Queue & Multi-Agency Action Triage
│       ├── resources.js         # Page 6: Asset Fleet Capacity & Reassignment Roster
│       ├── scenarios.js         # Page 7: What-If Contingency Simulator & Impact Delta
│       └── reports.js           # Page 8: Official PDF Generator & Data Provenance Center
└── tests/
    └── test_adaptive_dlnm.js    # Node.js automated test suite for scientific validation (14/14 Passing)
```

---

## 4. Scientific & Mathematical Engines

### Adaptive Heat-Health DLNM
Implements Gasparrini et al. (Lancet 2015) cross-basis formulation adapted for South Asian tropical urban biometeorology:
- **Exposure Dimension:** Natural cubic splines with boundary knots placed at 10th and 90th percentiles of historical wet-bulb temperature.
- **Lag Dimension:** Polynomial distributed lag structure extending from Lag 0 to Lag 7 with empirical data-driven peak lag estimation ($t_{\text{peak}} \approx 3\text{--}5\text{ days}$).
- **Effect Modification:** Tests 3d, 7d, and 14d cumulative heat exposure windows with AIC model selection to distinguish short-term physiological adaptation from cumulative heat exhaustion.
- **Hierarchical Partial Pooling:** Shrinks sparse or low-confidence ward estimates toward the citywide empirical Bayes mean.
- **Uncertainty Quantification:** Generates explicit 95% confidence interval bands across all lag estimates ($RR_{95\%} = \exp(\hat{\beta} \pm 1.96 \cdot \text{SE})$).

### HHVI Composite Risk Scoring
Computes deterministic and mitigated Heat Health Vulnerability Index ($0\text{--}100$) using a 5-factor weighted waterfall:
$$\text{HHVI} = 0.35 \times \text{Thermal} + 0.25 \times \text{Slum} + 0.20 \times \text{Elderly} + 0.20 \times \text{CanopyDeficit}$$

### Intelligent Dynamic Label Density
To prevent map clutter and overlapping labels across Kolkata's 144 wards:
- **Zoom < 13 (City View):** Zero static labels rendered; clear boundary polygons with interactive hover tooltips.
- **Zoom 13–14 (Sub-District View):** Intelligent priority labelling showing only top critical and active dispatch wards.
- **Zoom ≥ 15 (Locality View):** Dynamic collision-free viewport labels for all visible wards.
- **Selected Ward:** Always highlighted with a prominent pill badge.

---

## 5. Data Provenance & Verification Baseline

| Dataset | Source Authority | Vintage / Vintage | Classification |
| :--- | :--- | :--- | :--- |
| **Meteorological Telemetry** | Open-Meteo API / WMO Station 42807 (Alipore) | Hourly Live Feed | `LIVE` |
| **Ward Boundaries** | DataMeet India / KMC Official GIS Proxy | 2023 Clean Baseline | `SOURCE-BACKED` |
| **Ward Populations** | Census of India 2011 (Wards 1–141 Verified) | Decennial Census | `SOURCE-BACKED` |
| **Slum Settlement Distribution** | KMC Slum Inventory Survey Proxy | 2023 Municipal Est. | `PROXY` |
| **Tree Canopy Cover** | Sentinel-2 Satellite Vegetation Index (NDVI) | 2024 Composite | `DERIVED` |
| **DLNM Parameters** | Gasparrini et al. (Lancet 2015) & South Asian Cohorts | Published Literature | `MODELLED` |

---

## 6. Interactive Features & Operational Tools

- **Dual-Theme Design System:** Institutional Government Light Mode (Primary) + Tactical Dark Mode with one-click header toggle.
- **Bilingual Interface:** Instant switching between English and Bengali (বাংলা).
- **Real In-Browser PDF Generation:** Generates styled, official KMC Situation Reports, Ward Dossiers, and Dispatch Audits with tabular data and timestamps.
- **CSV & JSON Data Exporters:** Download full evaluated datasets for external GIS and statistical analysis.
- **SIH 2-Minute Executive Walkthrough:** Interactive slide deck explaining the problem, methodology, and operational value for judges.

---

## 7. Running Tests & Quality Assurance

Run the automated scientific test suite via Node.js:
```bash
node tests/test_adaptive_dlnm.js
```

Validate JavaScript syntax across all modules:
```powershell
Get-ChildItem -Path js -Filter *.js -Recurse | ForEach-Object { node -c $_.FullName }
```

---

## 8. Quick Start & Local Deployment

1. Clone or download the repository into your local directory.
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
3. No build tools, Node servers, or npm installs are required for runtime execution.

---

## GitHub Pages Deployment

This repository is a static HTML/CSS/JavaScript application and can be hosted directly with GitHub Pages.

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**.
6. Save and wait for GitHub Pages to publish the site.

The live URL will normally be:

`https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY-NAME/`

No build command is required.
