/**
 * HEATSHIELD :: Visual FX & 3D Interactive Motion Engine
 * Map Camera Controls & Digital Counter Interpolation
 */

const HEATSHIELD_FX = {
  isOrbiting: false,
  orbitAngle: 0,
  orbitInterval: null,

  init() {},

  // =========================================================================
  // 3. MAP 3D CAMERA CONTROLS & CINEMATIC AUTO-ORBIT
  // =========================================================================
  setMapPerspective(mode) {
    const wrapper = document.getElementById("survivalMapWrapper");
    const map = document.getElementById("survivalMap");
    if (!wrapper || !map) return;

    if (this.orbitInterval) {
      clearInterval(this.orbitInterval);
      this.orbitInterval = null;
      this.isOrbiting = false;
    }

    wrapper.classList.remove("tactical-3d-perspective");
    map.style.transform = "";

    if (mode === "3d_tilt") {
      wrapper.classList.add("tactical-3d-perspective");
      map.style.transform = "rotateX(30deg) rotateZ(-2deg) scale(0.95)";
    } else if (mode === "3d_oblique") {
      wrapper.classList.add("tactical-3d-perspective");
      map.style.transform = "rotateX(48deg) rotateZ(-12deg) scale(0.92)";
    } else if (mode === "3d_orbit") {
      wrapper.classList.add("tactical-3d-perspective");
      this.isOrbiting = true;
      let angle = 0;
      this.orbitInterval = setInterval(() => {
        angle += 0.03;
        const rotX = 30 + Math.sin(angle) * 8;
        const rotZ = Math.cos(angle) * 10;
        map.style.transform = `rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(0.94)`;
      }, 40);
    } else {
      // 2D Flat
      map.style.transform = "none";
    }

    if (window.HEATSHIELD_MAP && window.HEATSHIELD_MAP.map) {
      setTimeout(() => window.HEATSHIELD_MAP.map.invalidateSize(), 350);
    }
  },

  // =========================================================================
  // 4. SMOOTH DIGITAL COUNTER INTERPOLATOR
  // =========================================================================
  animateNumber(elementId, targetNumber, suffix = "", duration = 600) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const startNumber = parseFloat(el.textContent.replace(/[^0-9.-]+/g, "")) || 0;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = startNumber + (targetNumber - startNumber) * ease;
      
      el.textContent = `${currentVal.toFixed(1)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${targetNumber}${suffix}`;
      }
    };
    requestAnimationFrame(update);
  }
};

window.HEATSHIELD_FX = HEATSHIELD_FX;
document.addEventListener("DOMContentLoaded", () => HEATSHIELD_FX.init());
