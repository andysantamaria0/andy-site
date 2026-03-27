// ============================================================
// THE BREAKUP — Audio-Reactive Heart Orbs
// Heart-shaped, intensely pulsating, heating up when speaking.
// ============================================================

// Heart shape parametric function
function heartX(t) {
  return 16 * Math.pow(Math.sin(t), 3);
}
function heartY(t) {
  return -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
}

class Orb {
  constructor(canvasId, hue, hueShift) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.hue = hue;
    this.hueShift = hueShift;
    this.speaking = false;
    this.time = Math.random() * 1000;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = 400 * this.dpr;
    this.canvas.height = 400 * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.w = 400;
    this.h = 400;

    this.audio = { volume: 0, bass: 0, mid: 0, high: 0, spikiness: 0 };
    this.display = { volume: 0, bass: 0, mid: 0, high: 0, spikiness: 0 };

    this.emotionalHeat = 0;
    this.peakVolume = 0;
    this.peakDecay = 0;
    this._speakIntensity = 0;

    // Ember particles — orbit the heart
    this.embers = [];
    for (let i = 0; i < 30; i++) {
      this.embers.push({
        t: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.8,
        drift: 0.5 + Math.random() * 1.5,
        size: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        brightness: 0.3 + Math.random() * 0.7,
        freqBand: Math.random(),
      });
    }
  }

  setSpeaking(s) { this.speaking = s; }
  setAudioData(d) { this.audio = d; }

  // Get heart point at parameter t, scaled
  heartPoint(t, scale, cx, cy) {
    return {
      x: cx + heartX(t) * scale,
      y: cy + heartY(t) * scale,
    };
  }

  draw() {
    const { ctx, w, h } = this;
    const cx = w / 2;
    const cy = h / 2 + 5; // nudge down slightly for visual center

    ctx.clearRect(0, 0, w, h);

    // Smooth audio
    for (const key of ['volume', 'bass', 'mid', 'high', 'spikiness']) {
      const speed = key === 'bass' ? 0.06 : 0.14;
      this.display[key] += (this.audio[key] - this.display[key]) * speed;
    }

    const vol = this.display.volume;
    const bass = this.display.bass;
    const mid = this.display.mid;
    const high = this.display.high;
    const spike = this.display.spikiness;

    const speakTarget = this.speaking ? 1 : 0;
    this._speakIntensity += (speakTarget - this._speakIntensity) * 0.05;
    const si = this._speakIntensity;

    // Heat accumulates faster, decays slower
    if (this.speaking && vol > 0.1) {
      this.emotionalHeat = Math.min(1, this.emotionalHeat + vol * 0.012 + spike * 0.008);
    } else {
      this.emotionalHeat *= 0.98;
    }
    const heat = this.emotionalHeat;

    // Peak detection
    if (vol > this.peakVolume + 0.08) {
      this.peakDecay = vol;
    }
    this.peakDecay *= 0.9;
    this.peakVolume += (vol - this.peakVolume) * 0.3;

    this.time += 0.015 + vol * 0.04 + spike * 0.025 + heat * 0.01;

    // Hue — starts cool/warm, shifts toward fiery red with heat
    const currentHue = this.hue + this.hueShift * (si * 0.3 + vol * 0.4 + heat * 0.5);

    // Vibration
    const vibAmt = spike * 15 + high * 10 + vol * 5 + heat * 8;
    const vibX = si > 0.1 ? (Math.random() - 0.5) * vibAmt * si : 0;
    const vibY = si > 0.1 ? (Math.random() - 0.5) * vibAmt * si : 0;

    // Heart scale — pumps with bass like a heartbeat
    const baseScale = 3.8;
    const breathe = Math.sin(this.time * 1.5) * 0.1;
    const bassPump = bass * 0.5 * si;
    const volSwell = vol * 0.3 * si;
    const heatExpand = heat * 0.25;
    const scale = baseScale + breathe + bassPump + volSwell + heatExpand;

    // === Ambient heat glow ===
    const glowSize = 120 + heat * 60 + vol * 40 * si;
    const ambAlpha = 0.02 + heat * 0.06 + vol * 0.04 * si;
    const ambGrad = ctx.createRadialGradient(cx + vibX, cy + vibY, 0, cx + vibX, cy + vibY, glowSize);
    ambGrad.addColorStop(0, `hsla(${currentHue}, 80%, 55%, ${ambAlpha * 2})`);
    ambGrad.addColorStop(0.3, `hsla(${currentHue + 10}, 60%, 45%, ${ambAlpha})`);
    ambGrad.addColorStop(0.7, `hsla(${currentHue + 20}, 40%, 35%, ${ambAlpha * 0.3})`);
    ambGrad.addColorStop(1, `hsla(${currentHue}, 30%, 25%, 0)`);
    ctx.beginPath();
    ctx.arc(cx + vibX, cy + vibY, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = ambGrad;
    ctx.fill();

    // === Outer glow rings ===
    for (let i = 4; i > 0; i--) {
      const ringSize = 80 + i * (15 + vol * 20 * si + heat * 12);
      const alpha = (0.02 + vol * 0.05 * si + heat * 0.04) * (1 - i / 5);
      const grad = ctx.createRadialGradient(cx + vibX, cy + vibY, 30, cx + vibX, cy + vibY, ringSize);
      grad.addColorStop(0, `hsla(${currentHue}, 70%, 55%, ${alpha * 2})`);
      grad.addColorStop(0.5, `hsla(${currentHue + 15}, 60%, 45%, ${alpha})`);
      grad.addColorStop(1, `hsla(${currentHue}, 40%, 30%, 0)`);
      ctx.beginPath();
      ctx.arc(cx + vibX, cy + vibY, ringSize, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // === Main heart shape — distorted by audio ===
    ctx.beginPath();
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      let hx = heartX(t);
      let hy = heartY(t);

      // Audio distortion
      const dist = Math.sqrt(hx * hx + hy * hy);
      const norm = dist > 0 ? 1 : 0;
      const nx = norm ? hx / dist : 0;
      const ny = norm ? hy / dist : 0;

      const d1 = Math.sin(t * 3 + this.time * 2) * (0.5 + bass * 4 * si);
      const d2 = Math.sin(t * 5 + this.time * 3.2) * (0.3 + mid * 3 * si);
      const d3 = Math.sin(t * 8 + this.time * 4.5) * (0.2 + high * 2.5 * si);
      const d4 = Math.sin(t * 13 + this.time * 6) * (spike * 2 * si * heat);

      const totalDist = d1 + d2 + d3 + d4;
      hx += nx * totalDist;
      hy += ny * totalDist;

      const x = cx + vibX + hx * scale;
      const y = cy + vibY + hy * scale;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Heart gradient — gets hotter/brighter with heat
    const sat = 55 + vol * 25 * si + heat * 15;
    const lit = 45 + vol * 15 * si + heat * 12;
    const mainGrad = ctx.createRadialGradient(
      cx + vibX, cy + vibY - 10, 5,
      cx + vibX, cy + vibY + 10, 80 * scale / 3.8
    );
    mainGrad.addColorStop(0, `hsla(${currentHue + 15}, ${sat + 15}%, ${lit + 20}%, 0.95)`);
    mainGrad.addColorStop(0.3, `hsla(${currentHue + 5}, ${sat + 5}%, ${lit + 8}%, 0.92)`);
    mainGrad.addColorStop(0.6, `hsla(${currentHue - 5}, ${sat}%, ${lit}%, 0.85)`);
    mainGrad.addColorStop(1, `hsla(${currentHue - 15}, ${sat - 10}%, ${lit - 15}%, 0.7)`);
    ctx.fillStyle = mainGrad;
    ctx.fill();

    // === Inner core — hot bright center of the heart ===
    const coreSize = (25 + bass * 15 * si + vol * 10 * si + heat * 12) * scale / 3.8;
    const coreGrad = ctx.createRadialGradient(
      cx + vibX, cy + vibY - 5, 0,
      cx + vibX, cy + vibY, coreSize
    );
    const coreLit = 80 + vol * 10 + heat * 10;
    coreGrad.addColorStop(0, `hsla(${currentHue + 30}, 95%, ${coreLit}%, ${0.4 + vol * 0.4 * si + heat * 0.2})`);
    coreGrad.addColorStop(0.4, `hsla(${currentHue + 15}, 80%, 65%, ${0.15 + vol * 0.2 * si})`);
    coreGrad.addColorStop(1, `hsla(${currentHue}, 60%, 50%, 0)`);
    ctx.beginPath();
    ctx.arc(cx + vibX, cy + vibY - 5, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // === Peak flash — eruption on volume spikes ===
    if (this.peakDecay > 0.12 && si > 0.3) {
      const flashAlpha = (this.peakDecay - 0.12) * 0.5;
      const flashSize = 90 + heat * 40;
      const flashGrad = ctx.createRadialGradient(
        cx + vibX, cy + vibY, 0,
        cx + vibX, cy + vibY, flashSize
      );
      flashGrad.addColorStop(0, `hsla(${currentHue + 40}, 100%, 92%, ${flashAlpha})`);
      flashGrad.addColorStop(0.2, `hsla(${currentHue + 20}, 90%, 80%, ${flashAlpha * 0.5})`);
      flashGrad.addColorStop(1, `hsla(${currentHue}, 70%, 50%, 0)`);
      ctx.beginPath();
      ctx.arc(cx + vibX, cy + vibY, flashSize, 0, Math.PI * 2);
      ctx.fillStyle = flashGrad;
      ctx.fill();
    }

    // === Embers — particles that orbit the heart shape ===
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const e of this.embers) {
      const bandEnergy = e.freqBand < 0.33 ? bass : e.freqBand < 0.66 ? mid : high;
      const energy = bandEnergy * si;

      e.t += e.speed * 0.01 * (1 + energy * 4 + vol * 2 * si);

      // Position along heart with drift outward
      const ht = e.t;
      const driftAmt = e.drift * (1 + energy * 1.5 + heat * 1);
      const breathMod = 0.8 + 0.2 * Math.sin(this.time * 0.7 + e.phase);
      const hpt = this.heartPoint(ht, scale * (1 + driftAmt * 0.15 * breathMod), cx + vibX, cy + vibY);

      // Jitter
      const jit = si > 0.1 ? (spike * 3 + heat * 2) * si : 0;
      const ex = hpt.x + (Math.random() - 0.5) * jit;
      const ey = hpt.y + (Math.random() - 0.5) * jit;

      const eSize = e.size * (1 + energy * 3 + heat * 1.5);
      const eAlpha = (0.05 + energy * 0.5 + heat * 0.2 + vol * 0.1 * si) * e.brightness;

      // Glow
      const eGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eSize * 4);
      eGrad.addColorStop(0, `hsla(${currentHue + 40}, 90%, 88%, ${eAlpha})`);
      eGrad.addColorStop(0.4, `hsla(${currentHue + 20}, 80%, 70%, ${eAlpha * 0.4})`);
      eGrad.addColorStop(1, `hsla(${currentHue}, 60%, 50%, 0)`);
      ctx.beginPath();
      ctx.arc(ex, ey, eSize * 4, 0, Math.PI * 2);
      ctx.fillStyle = eGrad;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(ex, ey, eSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${currentHue + 50}, 95%, 92%, ${eAlpha * 1.5})`;
      ctx.fill();
    }
    ctx.restore();

    // === Heat waves — rippling rings when emotional heat is high ===
    if (heat > 0.2 && si > 0.2) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const waveCount = Math.floor(heat * 3) + 1;
      for (let i = 0; i < waveCount; i++) {
        const wavePhase = (this.time * 0.8 + i * 2.1) % 4;
        const waveRadius = 40 + wavePhase * 30 + heat * 20;
        const waveAlpha = Math.max(0, (1 - wavePhase / 4) * (heat - 0.2) * 0.15);

        ctx.beginPath();
        ctx.arc(cx + vibX, cy + vibY, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${currentHue + 30}, 80%, 65%, ${waveAlpha})`;
        ctx.lineWidth = 2 + heat * 3;
        ctx.stroke();
      }
      ctx.restore();
    }

    // === Rising sparks when heat is extreme ===
    if (heat > 0.5 && si > 0.3) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sparkCount = Math.floor((heat - 0.5) * 12);
      for (let i = 0; i < sparkCount; i++) {
        const sparkPhase = (this.time * 1.2 + i * 1.7) % 3;
        const sparkX = cx + vibX + (Math.sin(this.time * 0.5 + i * 2.3)) * (30 + heat * 20);
        const sparkY = cy + vibY - sparkPhase * 40 - 20;
        const sparkSize = 1.5 + heat * 3;
        const sparkAlpha = Math.max(0, (1 - sparkPhase / 3) * (heat - 0.5) * 0.4);

        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${currentHue + 50}, 100%, 85%, ${sparkAlpha})`;
        ctx.fill();
      }
      ctx.restore();
    }

    requestAnimationFrame(() => this.draw());
  }

  start() {
    this.draw();
  }
}

// Gio — deep blue/indigo, shifts toward red/hot when speaking
const orbA = new Orb('orb-a', 230, 130);
// Jo — warm rose/coral, shifts toward fiery crimson when speaking
const orbB = new Orb('orb-b', 350, 15);

orbA.start();
orbB.start();
