/**
 * HEATSHIELD :: Tactical Sound Synthesizer (Web Audio API)
 * Procedural sci-fi UI sound effects with zero external audio assets
 */

const HEATSHIELD_SFX = {
  enabled: false,
  audioCtx: null,

  init() {
    // AudioContext will be initialized on first user gesture
    const initContext = () => {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
      document.removeEventListener("click", initContext);
      document.removeEventListener("keydown", initContext);
    };
    document.addEventListener("click", initContext, { once: true });
    document.addEventListener("keydown", initContext, { once: true });
  },

  toggleSound() {
    this.enabled = !this.enabled;
    const btn = document.getElementById("btnToggleSfx");
    if (btn) {
      btn.innerHTML = this.enabled ? `<span>🔊</span> <span class="hidden sm:inline">SFX ON</span>` : `<span>🔇</span> <span class="hidden sm:inline">SFX OFF</span>`;
      btn.classList.toggle("text-cyan-400", this.enabled);
      btn.classList.toggle("text-slate-500", !this.enabled);
    }
    if (this.enabled) this.playBlip(600, "sine", 0.05);
    return this.enabled;
  },

  playBlip(freq = 800, type = "sine", duration = 0.04, gainVal = 0.05) {
    if (!this.enabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Ignore audio policy issues
    }
  },

  playClick() {
    this.playBlip(1200, "triangle", 0.03, 0.04);
  },

  playDeploy() {
    if (!this.enabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.14);
    } catch (e) {}
  },

  playAlert() {
    if (!this.enabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      const now = this.audioCtx.currentTime;
      [0, 0.12].forEach(offset => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now + offset);
        gain.gain.setValueAtTime(0.06, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    } catch (e) {}
  },

  playSonar() {
    if (!this.enabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch (e) {}
  }
};

window.HEATSHIELD_SFX = HEATSHIELD_SFX;
document.addEventListener("DOMContentLoaded", () => HEATSHIELD_SFX.init());
