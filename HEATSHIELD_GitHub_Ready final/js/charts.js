/**
 * HEATSHIELD :: KCAP-2025 DLNM Chart Controller
 * 7-Day Distributed Lag Non-Linear Model Hospital Surge Visualizer
 */

const HEATSHIELD_CHARTS = {
  chartInstance: null,
  viewMode: "combined", // combined | area | line
  crimsonGradient: null,
  amberGradient: null,

  init(ctxId = "dlnmChart") {
    const canvas = document.getElementById(ctxId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    this.crimsonGradient = ctx.createLinearGradient(0, 0, 0, 260);
    this.crimsonGradient.addColorStop(0, "rgba(239, 68, 68, 0.60)");
    this.crimsonGradient.addColorStop(1, "rgba(239, 68, 68, 0.02)");

    this.amberGradient = ctx.createLinearGradient(0, 0, 0, 260);
    this.amberGradient.addColorStop(0, "rgba(245, 158, 11, 0.35)");
    this.amberGradient.addColorStop(1, "rgba(245, 158, 11, 0.02)");

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Day -2", "Day -1", "Today", "+1 Day", "+2 Days", "+3 Days (Lag Peak)", "+4 Days", "+5 Days"],
        datasets: [
          {
            label: "Modeled Inflow Surge Scenario (%)",
            data: [12, 24, 45, 82, 118, 148, 139, 126],
            borderColor: "#EF4444",
            backgroundColor: this.crimsonGradient,
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            yAxisID: "yHealth",
            pointBackgroundColor: "#EF4444",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
            pointRadius: [4, 4, 5, 6, 7, 9, 7, 5],
            pointHoverRadius: 10,
            hidden: false
          },
          {
            label: "Modeled Outdoor Temp (°C)",
            data: [39.2, 40.5, 41.2, 41.6, 40.0, 38.8, 38.0, 37.5],
            borderColor: "#F59E0B",
            backgroundColor: this.amberGradient,
            borderWidth: 2.5,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            yAxisID: "yTemperature",
            pointBackgroundColor: "#F59E0B",
            pointBorderColor: "#0B0F19",
            pointRadius: 4,
            pointHoverRadius: 8,
            hidden: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#F1F5F9",
              font: {
                family: "'Inter', sans-serif",
                size: 11,
                weight: "600"
              },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: "rgba(11, 15, 25, 0.95)",
            titleColor: "#38BDF8",
            bodyColor: "#F8FAFC",
            borderColor: "rgba(51, 65, 85, 0.6)",
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: function(items) {
                return `Timeline Interval: ${items[0].label}`;
              },
              label: function(context) {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y;
                if (context.datasetIndex === 0) {
                  return `🔴 ${datasetLabel}: +${value}% (Cardiac Spikes)`;
                } else {
                  return `🟠 ${datasetLabel}: ${value}°C`;
                }
              },
              afterBody: function(items) {
                const dayIndex = items[0].dataIndex;
                if (dayIndex >= 5) {
                  return "\n⚠️ DLNM Physiological Shock: Lagged mortality surge from accumulated cellular & cardiovascular stress.";
                }
                return "";
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(51, 65, 85, 0.35)",
              drawBorder: false
            },
            ticks: {
              color: "#94A3B8",
              font: {
                family: "'JetBrains Mono', monospace",
                size: 11
              }
            }
          },
          yHealth: {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: "Hospital Inflow Surge (%)",
              color: "#EF4444",
              font: { size: 11, weight: "600" }
            },
            grid: {
              color: "rgba(51, 65, 85, 0.25)",
              drawBorder: false
            },
            ticks: {
              color: "#EF4444",
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: val => `+${val}%`
            }
          },
          yTemperature: {
            type: "linear",
            position: "right",
            title: {
              display: true,
              text: "Ambient Temp (°C)",
              color: "#F59E0B",
              font: { size: 11, weight: "600" }
            },
            grid: { drawOnChartArea: false, drawBorder: false },
            ticks: {
              color: "#F59E0B",
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: val => `${val}°C`
            }
          }
        }
      }
    });

    // Apply default mode
    this.setViewMode(this.viewMode);
  },

  setViewMode(mode) {
    this.viewMode = mode;
    if (!this.chartInstance) return;

    const datasetSurge = this.chartInstance.data.datasets[0];
    const datasetTemp = this.chartInstance.data.datasets[1];

    // Ensure BOTH datasets are always visible
    datasetSurge.hidden = false;
    datasetTemp.hidden = false;

    if (mode === "area") {
      datasetSurge.fill = true;
      datasetSurge.backgroundColor = this.crimsonGradient;
      datasetTemp.fill = true;
      datasetTemp.backgroundColor = this.amberGradient;
    } else if (mode === "line") {
      datasetSurge.fill = false;
      datasetTemp.fill = false;
    } else {
      // Combined (default): Red surge filled, Orange temp clean line over it
      datasetSurge.fill = true;
      datasetSurge.backgroundColor = this.crimsonGradient;
      datasetTemp.fill = false;
    }

    this.chartInstance.update();
  },

  downloadPNG() {
    if (!this.chartInstance) return;
    const url = this.chartInstance.toBase64Image();
    const link = document.createElement("a");
    link.download = `HEATSHIELD_DLNM_Surge_Report_${Date.now()}.png`;
    link.href = url;
    link.click();
  },

  update(dlnmData, isBengali = false) {
    if (!this.chartInstance) return;

    const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    const toBn = num => String(num).split('').map(c => bnDigits[parseInt(c, 10)] || c).join('');

    const labels = isBengali
      ? ["দিন -২", "দিন -১", "আজ", "+১ দিন", "+২ দিন", "+৩ দিন (শীর্ষ)", "+৪ দিন", "+৫ দিন"]
      : ["Day -2", "Day -1", "Today", "+1 Day", "+2 Days", "+3 Days (Lag Peak)", "+4 Days", "+5 Days"];

    this.chartInstance.data.labels = labels;
    this.chartInstance.data.datasets[0].data = dlnmData.surge_percentages;
    this.chartInstance.data.datasets[1].data = dlnmData.temperatures;

    this.chartInstance.data.datasets[0].label = isBengali
      ? "মডেলকৃত রোগী বৃদ্ধির দৃশ্যকল্প (%)"
      : "Modeled Inflow Surge Scenario (%)";

    this.chartInstance.data.datasets[1].label = isBengali
      ? "মডেলকৃত বাইরের তাপমাত্রা (°C)"
      : "Modeled Outdoor Temp (°C)";

    this.chartInstance.update("none");

    const peakSurgeEl = document.getElementById("dlnmPeakVal");
    const peakLagCasesEl = document.getElementById("dlnmExcessCases");
    if (peakSurgeEl) {
      peakSurgeEl.textContent = isBengali ? `+${toBn(dlnmData.peak_surge_pct)}%` : `+${dlnmData.peak_surge_pct}%`;
    }
    if (peakLagCasesEl) {
      peakLagCasesEl.textContent = isBengali
        ? `+${toBn(dlnmData.total_lagged_excess_inflow)} জন মডেলকৃত অতিরিক্ত কেস`
        : `+${dlnmData.total_lagged_excess_inflow} Modeled Excess Cases`;
    }
  }
};

window.HEATSHIELD_CHARTS = HEATSHIELD_CHARTS;
