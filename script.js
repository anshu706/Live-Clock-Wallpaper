/* =============================================
   ChronoWall – script.js
   All clock renderers + site logic
   ============================================= */

'use strict';

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function getTime() {
  const now = new Date();
  const rawH = now.getHours();
  const h12raw = rawH % 12 || 12; // 0 → 12 for midnight/noon
  return {
    h:    rawH,
    m:    now.getMinutes(),
    s:    now.getSeconds(),
    ms:   now.getMilliseconds(),
    h12:  h12raw,
    ampm: rawH >= 12 ? 'PM' : 'AM',
    pad:  (n) => String(n).padStart(2, '0'),
    pad12: String(h12raw).padStart(2, '0'),
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }

// Star cache for hero
let heroStarData = null;

// ─────────────────────────────────────────────
// HERO STARS BACKGROUND
// ─────────────────────────────────────────────
function initHeroStars() {
  const canvas = document.getElementById('heroStars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    heroStarData = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      blink: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
    }));
  }

  resize();
  window.addEventListener('resize', resize);

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = performance.now() / 1000;
    for (const s of heroStarData) {
      const alpha = 0.3 + 0.5 * Math.sin(s.blink + t * s.speed * 10);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(drawStars);
  }
  drawStars();
}

// ─────────────────────────────────────────────
// NAV / FOOTER TIME
// ─────────────────────────────────────────────
function updateClockDisplays() {
  const t = getTime();
  const str = `${t.pad12}:${t.pad(t.m)}:${t.pad(t.s)} ${t.ampm}`;
  const navEl    = document.getElementById('navTime');
  const footerEl = document.getElementById('footerTime');
  if (navEl)    navEl.textContent = str;
  if (footerEl) footerEl.textContent = str;
}

// ─────────────────────────────────────────────
// ╔══════════════════════════════════════╗
// ║         CLOCK RENDERERS              ║
// ║  Each fn takes (ctx, w, h, t)        ║
// ╚══════════════════════════════════════╝
// ─────────────────────────────────────────────

/* ── 1. NEON PULSE ──────────────────────────── */
function drawNeon(ctx, w, h) {
  const t  = getTime();
  const cx = w / 2, cy = h / 2;
  const now = performance.now() / 1000;

  // Background
  ctx.fillStyle = '#000810';
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,200,255,0.06)';
  ctx.lineWidth = 1;
  const gs = Math.max(w, h) / 18;
  for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Scanline overlay
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, y, w, 2);
  }

  // Neon glow helper
  function neonText(text, x, y, size, color, blur) {
    ctx.font = `900 ${size}px 'Orbitron', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = blur; i > 0; i -= blur / 5) {
      ctx.shadowBlur = i * 4;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.12;
      ctx.fillText(text, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
  }

  const timeStr = `${t.pad12}:${t.pad(t.m)}:${t.pad(t.s)}`;
  const pulse   = 0.85 + 0.15 * Math.sin(now * 3);

  ctx.globalAlpha = pulse;
  neonText(timeStr, cx, cy * 0.95, Math.min(w, h) * 0.14, '#00f5ff', 6);
  ctx.globalAlpha = 1;

  // Date
  const days  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const d     = new Date();
  const dStr  = `${days[d.getDay()]} · ${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
  ctx.font = `400 ${Math.min(w,h)*0.04}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,245,255,0.5)';
  ctx.shadowBlur = 10; ctx.shadowColor = '#00f5ff';
  ctx.fillText(dStr, cx, cy * 1.35);
  ctx.shadowBlur = 0;

  // AM/PM
  ctx.font = `600 ${Math.min(w,h)*0.055}px 'Orbitron', monospace`;
  ctx.fillStyle = 'rgba(255,0,200,0.8)';
  ctx.shadowBlur = 14; ctx.shadowColor = '#ff00c8';
  ctx.fillText(t.ampm, cx, cy * 1.62);
  ctx.shadowBlur = 0;

  // Bottom accent line
  const barW  = w * 0.5;
  const barH  = 3;
  const barY  = h * 0.88;
  const grd   = ctx.createLinearGradient(cx - barW/2, 0, cx + barW/2, 0);
  grd.addColorStop(0,   'transparent');
  grd.addColorStop(0.5, '#00f5ff');
  grd.addColorStop(1,   'transparent');
  ctx.fillStyle = grd;
  ctx.shadowBlur = 20; ctx.shadowColor = '#00f5ff';
  ctx.fillRect(cx - barW/2, barY, barW, barH);
  ctx.shadowBlur = 0;
}

/* ── 2. COSMIC ORBIT ──────────────────────────── */
let cosmicAngle = 0;
function drawCosmic(ctx, w, h) {
  const t   = getTime();
  const cx  = w / 2, cy = h / 2;
  const R   = Math.min(w, h) * 0.37;
  cosmicAngle += 0.004;

  // Deep space bg
  const bgGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
  bgGrd.addColorStop(0,   '#0d0628');
  bgGrd.addColorStop(0.5, '#050318');
  bgGrd.addColorStop(1,   '#000');
  ctx.fillStyle = bgGrd;
  ctx.fillRect(0, 0, w, h);

  // Stars
  const seed = 42;
  for (let i = 0; i < 140; i++) {
    const sx = ((Math.sin(i * 127.1 + seed) * 0.5 + 0.5)) * w;
    const sy = ((Math.sin(i * 311.7 + seed) * 0.5 + 0.5)) * h;
    const sr = 0.4 + Math.abs(Math.sin(i * 54.3)) * 1.2;
    const sa = 0.4 + 0.4 * Math.sin(i + performance.now() / 2000);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${sa})`;
    ctx.fill();
  }

  // Nebula
  const nbGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
  nbGrd.addColorStop(0,   'rgba(80,0,200,0.12)');
  nbGrd.addColorStop(0.5, 'rgba(0,80,200,0.06)');
  nbGrd.addColorStop(1,   'transparent');
  ctx.fillStyle = nbGrd;
  ctx.fillRect(0, 0, w, h);

  // Saturn-style rings
  function drawRing(radius, tilt, color, lineW) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, Math.sin(tilt));
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.stroke();
    ctx.restore();
  }

  // Rotating minute ring
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(cosmicAngle);
  ctx.restore();

  drawRing(R * 1.18, 0.3, 'rgba(120,80,255,0.35)', 1.5);
  drawRing(R * 1.32, 0.28, 'rgba(80,160,255,0.2)', 1);
  drawRing(R * 1.0,  0.32, 'rgba(200,100,255,0.18)', 0.8);

  // Progress ring for seconds
  const secPct = (t.s + t.ms / 1000) / 60;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.05, 0, secPct * Math.PI * 2);
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 18; ctx.shadowColor = '#8b5cf6';
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Central glow
  const cGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
  cGrd.addColorStop(0,   'rgba(140,100,255,0.3)');
  cGrd.addColorStop(0.6, 'rgba(60,0,160,0.1)');
  cGrd.addColorStop(1,   'transparent');
  ctx.fillStyle = cGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Orbit dot (seconds)
  const secAngle = (t.s / 60) * Math.PI * 2 - Math.PI / 2;
  const dx = cx + Math.cos(secAngle) * R * 1.05;
  const dy = cy + Math.sin(secAngle) * R * 1.05 * 0.3;
  ctx.beginPath();
  ctx.arc(dx, dy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 20; ctx.shadowColor = '#c084fc';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Time text
  const timeStr = `${t.pad12}:${t.pad(t.m)}:${t.pad(t.s)}`;
  ctx.font = `700 ${Math.min(w,h)*0.1}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 30; ctx.shadowColor = '#c084fc';
  ctx.fillStyle = '#f0e6ff';
  ctx.fillText(timeStr, cx, cy);
  ctx.shadowBlur = 0;

  // AM/PM
  ctx.font = `500 ${Math.min(w,h)*0.042}px 'Orbitron', monospace`;
  ctx.fillStyle = 'rgba(192,132,252,0.7)';
  ctx.fillText(t.ampm, cx, cy + Math.min(w,h) * 0.13);
}

/* ── 3. AURORA BOREALIS ──────────────────────────── */
let auroraOffset = 0;
function drawAurora(ctx, w, h) {
  const t = getTime();
  const cx = w / 2, cy = h / 2;
  auroraOffset += 0.003;

  ctx.fillStyle = '#010a0f';
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (let i = 0; i < 100; i++) {
    const sx = (Math.sin(i * 137.5) * 0.5 + 0.5) * w;
    const sy = (Math.cos(i * 197.3) * 0.5 + 0.5) * h * 0.5;
    const sa = 0.3 + 0.4 * Math.sin(i + performance.now() / 1800);
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${sa})`;
    ctx.fill();
  }

  // Aurora curtains
  function auroraCurtain(xOff, hueShift, alpha) {
    const pts = 12;
    for (let i = 0; i <= pts; i++) {
      const nx  = (i / pts) * w;
      const phase = i * 0.7 + auroraOffset + xOff;
      const topY  = h * 0.05 + Math.sin(phase) * h * 0.08 + Math.sin(phase * 2.3) * h * 0.04;
      const botY  = topY + h * (0.28 + 0.12 * Math.sin(phase * 0.5));

      const grd = ctx.createLinearGradient(nx, topY, nx, botY);
      grd.addColorStop(0,   `hsla(${150 + hueShift + i * 5},100%,60%,0)`);
      grd.addColorStop(0.2, `hsla(${150 + hueShift + i * 5},100%,65%,${alpha * 0.8})`);
      grd.addColorStop(0.5, `hsla(${160 + hueShift + i * 8},90%,55%,${alpha})`);
      grd.addColorStop(0.8, `hsla(${280 + hueShift - i * 3},80%,50%,${alpha * 0.5})`);
      grd.addColorStop(1,   `hsla(${280 + hueShift},80%,40%,0)`);

      if (i === 0) { ctx.beginPath(); ctx.moveTo(nx, topY); }
      else ctx.lineTo(nx, topY);
    }
    for (let i = pts; i >= 0; i--) {
      const nx  = (i / pts) * w;
      const phase = i * 0.7 + auroraOffset + xOff;
      const topY  = h * 0.05 + Math.sin(phase) * h * 0.08 + Math.sin(phase * 2.3) * h * 0.04;
      const botY  = topY + h * (0.28 + 0.12 * Math.sin(phase * 0.5));
      ctx.lineTo(nx, botY);
    }
    ctx.closePath();

    // Fill with gradient — use a separate per-path gradient
    const fillGrd = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    fillGrd.addColorStop(0, `hsla(${150 + hueShift},100%,60%,0)`);
    fillGrd.addColorStop(0.3, `hsla(${155 + hueShift},100%,60%,${alpha})`);
    fillGrd.addColorStop(0.7, `hsla(${270 + hueShift},90%,55%,${alpha * 0.7})`);
    fillGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = fillGrd;
    ctx.fill();
  }

  auroraCurtain(0,     0,   0.45);
  auroraCurtain(1.2,  20,   0.35);
  auroraCurtain(2.4, -10,   0.3);

  // Ground reflection
  const refGrd = ctx.createLinearGradient(0, h * 0.7, 0, h);
  refGrd.addColorStop(0, 'rgba(0,80,40,0.1)');
  refGrd.addColorStop(1, '#010a0f');
  ctx.fillStyle = refGrd;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Horizon line
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.lineTo(w, h * 0.72);
  ctx.strokeStyle = 'rgba(0,200,100,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Time
  const timeStr = `${t.pad12}:${t.pad(t.m)}:${t.pad(t.s)} ${t.ampm}`;
  ctx.font = `700 ${Math.min(w,h)*0.12}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 40; ctx.shadowColor = '#00ff88';
  ctx.fillStyle = '#e0fff0';
  ctx.fillText(timeStr, cx, h * 0.82);
  ctx.shadowBlur = 0;

  // Date below
  const d = new Date();
  const dStr = `${d.toLocaleDateString('en-US', {weekday:'long'})} · ${d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  ctx.font = `400 ${Math.min(w,h)*0.035}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = 'rgba(160,255,200,0.5)';
  ctx.fillText(dStr, cx, h * 0.91);
}

/* ── 4. MATRIX RAIN ──────────────────────────── */
const matrixDrops = {};
const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

function initMatrixDrops(w, h) {
  const cols = Math.floor(w / 16);
  for (let i = 0; i < cols; i++) {
    if (matrixDrops[i] === undefined) matrixDrops[i] = Math.random() * -h;
  }
}

let matrixFrame = 0;
function drawMatrix(ctx, w, h) {
  const t = getTime();
  const cx = w / 2, cy = h / 2;

  initMatrixDrops(w, h);

  ctx.fillStyle = 'rgba(0,10,0,0.15)';
  ctx.fillRect(0, 0, w, h);

  matrixFrame++;
  if (matrixFrame % 2 === 0) {
    const fs = 15;
    const cols = Math.floor(w / fs);
    for (let i = 0; i < cols; i++) {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      const brightness = Math.random();
      ctx.font = `${fs}px monospace`;
      ctx.textAlign = 'left';

      if (brightness > 0.9) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8; ctx.shadowColor = '#00ff41';
      } else if (brightness > 0.6) {
        ctx.fillStyle = '#00ff41';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = `rgba(0,${Math.floor(100 + brightness * 155)},${Math.floor(brightness * 40)},${0.4 + brightness * 0.5})`;
        ctx.shadowBlur = 0;
      }

      ctx.fillText(char, i * fs, matrixDrops[i]);
      ctx.shadowBlur = 0;

      if (matrixDrops[i] > h && Math.random() > 0.975) matrixDrops[i] = 0;
      matrixDrops[i] += fs;
    }
  }

  // Dark center box for time
  const bw = Math.min(w, h) * 0.7;
  const bh = Math.min(w, h) * 0.35;
  ctx.fillStyle = 'rgba(0,8,0,0.82)';
  roundRect(ctx, cx - bw/2, cy - bh/2, bw, bh, 12);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,255,65,0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, cx - bw/2, cy - bh/2, bw, bh, 12);
  ctx.stroke();

  // Time text
  const timeStr = `${t.pad12}:${t.pad(t.m)}:${t.pad(t.s)} ${t.ampm}`;
  ctx.font = `700 ${Math.min(w,h)*0.12}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 25; ctx.shadowColor = '#00ff41';
  ctx.fillStyle = '#00ff41';
  ctx.fillText(timeStr, cx, cy - Math.min(w,h)*0.01);
  ctx.shadowBlur = 0;

  // Date
  const d = new Date();
  const dStr = d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  ctx.font = `400 ${Math.min(w,h)*0.035}px 'Orbitron', monospace`;
  ctx.fillStyle = 'rgba(0,200,50,0.65)';
  ctx.fillText(dStr, cx, cy + Math.min(w,h)*0.1);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── 5. MINIMAL ZEN ──────────────────────────── */
let zenHue = 220;
let zenHueDir = 0.05;
function drawZen(ctx, w, h) {
  const t  = getTime();
  const cx = w / 2, cy = h / 2;
  const R  = Math.min(w, h) * 0.35;

  zenHue += zenHueDir;
  if (zenHue > 280 || zenHue < 180) zenHueDir *= -1;

  // Breathing gradient BG
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  bg.addColorStop(0,   `hsl(${zenHue},30%,10%)`);
  bg.addColorStop(1,   `hsl(${zenHue + 30},20%,4%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Outer thin ring
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${zenHue},50%,70%,0.12)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Minute tick marks
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const ir = R * (isHour ? 0.85 : 0.92);
    const or = R * 0.98;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * ir, cy + Math.sin(angle) * ir);
    ctx.lineTo(cx + Math.cos(angle) * or, cy + Math.sin(angle) * or);
    ctx.strokeStyle = isHour ? `hsla(${zenHue},60%,75%,0.5)` : `hsla(${zenHue},40%,60%,0.2)`;
    ctx.lineWidth = isHour ? 2 : 1;
    ctx.stroke();
  }

  // Hour hand
  const hAngle = ((t.h12 + t.m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, hAngle, R * 0.52, `hsla(${zenHue},70%,85%,0.95)`, 3, R * 0.1);

  // Minute hand
  const mAngle = ((t.m + t.s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, mAngle, R * 0.78, `hsla(${zenHue},60%,80%,0.9)`, 2, R * 0.12);

  // Second hand
  const sAngle = ((t.s + t.ms / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sAngle);
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.88);
  ctx.lineTo(0, R * 0.2);
  ctx.strokeStyle = `hsl(${zenHue + 80},100%,65%)`;
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 12; ctx.shadowColor = `hsl(${zenHue + 80},100%,65%)`;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${zenHue + 80},100%,75%)`;
  ctx.shadowBlur = 15; ctx.shadowColor = `hsl(${zenHue + 80},100%,65%)`;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Digital readout below center
  ctx.font = `300 ${Math.min(w,h)*0.06}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `hsla(${zenHue},60%,80%,0.55)`;
  ctx.fillText(`${t.pad12}:${t.pad(t.m)} ${t.ampm}`, cx, cy + R * 1.35);
}

function drawHand(ctx, cx, cy, angle, length, color, width, backLen) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, backLen || 0);
  ctx.lineTo(0, -length);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

/* ── 6. RETRO FLIP ──────────────────────────── */
function drawRetro(ctx, w, h) {
  const t  = getTime();
  const cx = w / 2, cy = h / 2;

  // Warm dark bg with grain
  ctx.fillStyle = '#120c00';
  ctx.fillRect(0, 0, w, h);

  // Vignette
  const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  vig.addColorStop(0.5, 'transparent');
  vig.addColorStop(1,   'rgba(0,0,0,0.75)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Warm glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
  glow.addColorStop(0,   'rgba(255,160,0,0.07)');
  glow.addColorStop(1,   'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Grain — lightweight version using random small rects
  for (let g = 0; g < 800; g++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    const ga = (Math.random() - 0.5) * 0.07;
    ctx.fillStyle = ga > 0 ? `rgba(255,200,80,${ga})` : `rgba(0,0,0,${-ga})`;
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Flip panel helper
  function flipPanel(char, px, py, pw, ph) {
    const r = 8;
    // Panel bg
    ctx.fillStyle = '#1a1200';
    roundRect(ctx, px, py, pw, ph, r);
    ctx.fill();

    // Top half
    ctx.fillStyle = '#2a1e00';
    roundRect(ctx, px, py, pw, ph / 2, 0);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(180,120,0,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, px, py, pw, ph, r);
    ctx.stroke();

    // Divider line
    ctx.beginPath();
    ctx.moveTo(px + r, py + ph / 2);
    ctx.lineTo(px + pw - r, py + ph / 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Char
    ctx.font = `900 ${ph * 0.72}px 'Orbitron', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 20; ctx.shadowColor = '#f59e0b';
    ctx.fillText(char, px + pw / 2, py + ph / 2);
    ctx.shadowBlur = 0;

    // Shine
    const shine = ctx.createLinearGradient(px, py, px, py + ph / 2);
    shine.addColorStop(0,   'rgba(255,255,255,0.06)');
    shine.addColorStop(1,   'transparent');
    ctx.fillStyle = shine;
    roundRect(ctx, px, py, pw, ph / 2, 0);
    ctx.fill();
  }

  const panelW = Math.min(w, h) * 0.17;
  const panelH = Math.min(w, h) * 0.24;
  const gap    = Math.min(w, h) * 0.025;
  const cols   = ['H', 'H', 'M', 'M', 'S', 'S'];
  const vals   = [
    Math.floor(t.h12 / 10), t.h12 % 10,
    Math.floor(t.m / 10), t.m % 10,
    Math.floor(t.s / 10), t.s % 10,
  ];

  const totalW = panelW * 6 + gap * 5 + (panelW * 0.3) * 2; // 2 separators
  let startX   = cx - totalW / 2;
  const startY = cy - panelH / 2;

  for (let i = 0; i < 6; i++) {
    flipPanel(String(vals[i]), startX, startY, panelW, panelH);
    startX += panelW + gap;
    if (i === 1 || i === 3) {
      // Separator dots
      const sx = startX;
      ctx.fillStyle = '#f59e0b';
      ctx.shadowBlur = 12; ctx.shadowColor = '#f59e0b';
      ctx.beginPath(); ctx.arc(sx, cy - panelH * 0.18, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, cy + panelH * 0.18, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      startX += panelW * 0.3;
    }
  }

  // Label row
  function label(text, lx, ly) {
    ctx.font = `400 ${Math.min(w,h)*0.025}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(180,120,0,0.5)';
    ctx.fillText(text, lx, ly);
  }
  const ly = cy + panelH / 2 + 10;
  let lx = cx - totalW / 2 + panelW;
  label('HOUR', lx,   ly);
  label('MIN',  lx + panelW * 2 + gap + panelW * 0.3, ly);
  label('SEC',  lx + panelW * 4 + gap * 2 + panelW * 0.6, ly);

  // AM/PM label
  ctx.font = `700 ${Math.min(w,h)*0.045}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fbbf24';
  ctx.shadowBlur = 14; ctx.shadowColor = '#f59e0b';
  ctx.fillText(t.ampm, cx + totalW / 2 + Math.min(w,h) * 0.06, cy);
  ctx.shadowBlur = 0;

  // Date
  const d = new Date();
  const dStr = d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  ctx.font = `300 ${Math.min(w,h)*0.035}px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(200,150,30,0.4)';
  ctx.fillText(dStr, cx, cy + panelH / 2 + Math.min(w,h) * 0.09);
}

/* ── 7. HOLOGRAPHIC HUD ──────────────────────────── */
let holoAngle = 0;
let hexParticles = [];
function initHexParticles(w, h) {
  if (hexParticles.length > 0) return;
  for (let i = 0; i < 30; i++) {
    hexParticles.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 10 + 4,
      alpha: Math.random() * 0.3 + 0.05,
      text: Math.random() > 0.5
        ? Math.floor(Math.random() * 0xff).toString(16).toUpperCase().padStart(2,'0')
        : ['◈','⬡','⬢','⌬','⎔'][Math.floor(Math.random()*5)],
    });
  }
}

function drawHolo(ctx, w, h) {
  const t  = getTime();
  const cx = w / 2, cy = h / 2;
  holoAngle += 0.005;

  initHexParticles(w, h);

  // Dark teal bg
  ctx.fillStyle = '#010d12';
  ctx.fillRect(0, 0, w, h);

  // Scanlines
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,255,220,0.018)';
    ctx.fillRect(0, y, w, 1);
  }

  // Hex particles
  for (const p of hexParticles) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
    ctx.font = `${p.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(0,255,200,${p.alpha})`;
    ctx.fillText(p.text, p.x, p.y);
  }

  // Rotating rings
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(holoAngle);
  for (let r = 0; r < 3; r++) {
    const rad = Math.min(w,h) * (0.3 + r * 0.06);
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,220,${0.15 - r * 0.04})`;
    ctx.lineWidth = 1; ctx.stroke();
    // Dashes on ring
    for (let d = 0; d < 12; d++) {
      const a = (d / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rad * 0.97, Math.sin(a) * rad * 0.97);
      ctx.lineTo(Math.cos(a) * rad * 1.03, Math.sin(a) * rad * 1.03);
      ctx.strokeStyle = 'rgba(0,255,220,0.5)';
      ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
  ctx.restore();

  // Corner brackets
  const bSize = Math.min(w,h) * 0.07;
  const bOff  = Math.min(w,h) * 0.05;
  function bracket(x, y, dx, dy) {
    ctx.beginPath(); ctx.strokeStyle = 'rgba(0,255,220,0.5)'; ctx.lineWidth = 2;
    ctx.moveTo(x + dx * bSize, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * bSize);
    ctx.stroke();
  }
  bracket(bOff,     bOff,       1,  1);
  bracket(w - bOff, bOff,      -1,  1);
  bracket(bOff,     h - bOff,   1, -1);
  bracket(w - bOff, h - bOff,  -1, -1);

  // Center holographic circle
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w,h)*0.2);
  grd.addColorStop(0,   'rgba(0,255,220,0.08)');
  grd.addColorStop(0.7, 'rgba(0,200,180,0.03)');
  grd.addColorStop(1,   'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(cx, cy, Math.min(w,h)*0.2, 0, Math.PI*2); ctx.fill();

  // Time
  const timeStr = `${t.pad12}:${t.pad(t.m)}:${t.pad(t.s)}`;
  ctx.font = `700 ${Math.min(w,h)*0.11}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Chromatic aberration effect
  ctx.fillStyle = 'rgba(255,0,100,0.3)';
  ctx.fillText(timeStr, cx - 2, cy);
  ctx.fillStyle = 'rgba(0,255,220,0.3)';
  ctx.fillText(timeStr, cx + 2, cy);
  ctx.shadowBlur = 25; ctx.shadowColor = '#00ffdc';
  ctx.fillStyle = '#c8fff8';
  ctx.fillText(timeStr, cx, cy);
  ctx.shadowBlur = 0;

  // System status lines
  const lines = [
    `SYS.TIME ··· ACTIVE`,
    `SYNC ··· ${t.s % 2 === 0 ? '██' : '░░'} ${t.s % 2 === 0 ? 'LOCKED' : 'SYNCING'}`,
    `NODE ··· ${t.pad12}${t.pad(t.m)}${t.pad(t.s)} ${t.ampm}`,
  ];
  ctx.font = `400 ${Math.min(w,h)*0.03}px 'Orbitron', monospace`;
  ctx.fillStyle = 'rgba(0,255,200,0.4)';
  lines.forEach((ln, i) => ctx.fillText(ln, cx, cy + Math.min(w,h)*(0.15 + i*0.07)));
}

/* ── 8. CRYSTAL BLOOM ──────────────────────────── */
let crystalParticles = [];
let crystalPetals    = [];
function initCrystal(w, h) {
  if (crystalParticles.length > 0) return;
  for (let i = 0; i < 60; i++) {
    crystalParticles.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.5 - 0.2,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 60 + 250,
    });
  }
  const cx = w/2, cy = h/2;
  const R = Math.min(w,h)*0.28;
  for (let i = 0; i < 8; i++) {
    const a = (i/8)*Math.PI*2;
    crystalPetals.push({ angle: a, r: R, speed: (Math.random()-0.5)*0.001, hue: 260 + i*18 });
  }
}

function drawCrystal(ctx, w, h) {
  const t  = getTime();
  const cx = w / 2, cy = h / 2;

  initCrystal(w, h);

  // Deep purple bg
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w,h));
  bg.addColorStop(0,   '#120820');
  bg.addColorStop(0.6, '#08041a');
  bg.addColorStop(1,   '#040210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Shimmer particles
  for (const p of crystalParticles) {
    p.x += p.vx; p.y += p.vy;
    if (p.y < 0) { p.y = h; p.x = Math.random() * w; }
    if (p.x < 0 || p.x > w) p.x = Math.random() * w;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 500 + p.hue);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue},90%,80%,${p.alpha * pulse})`;
    ctx.fill();
  }

  // Glass petals
  for (const pet of crystalPetals) {
    pet.angle += pet.speed;
    const px = cx + Math.cos(pet.angle) * pet.r;
    const py = cy + Math.sin(pet.angle) * pet.r;
    const pr = Math.min(w,h) * 0.1;

    ctx.save();
    ctx.globalAlpha = 0.18;
    const petalGrd = ctx.createRadialGradient(px, py, 0, px, py, pr);
    petalGrd.addColorStop(0,   `hsla(${pet.hue},80%,85%,0.5)`);
    petalGrd.addColorStop(0.5, `hsla(${pet.hue+20},70%,65%,0.15)`);
    petalGrd.addColorStop(1,   'transparent');
    ctx.fillStyle = petalGrd;
    ctx.beginPath();
    ctx.ellipse(px, py, pr * 1.4, pr * 0.55, pet.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Iridescent center circle with glass effect
  const cR = Math.min(w,h) * 0.22;
  const cgrd = ctx.createRadialGradient(cx - cR*0.2, cy - cR*0.2, 0, cx, cy, cR);
  cgrd.addColorStop(0,   'rgba(255,255,255,0.12)');
  cgrd.addColorStop(0.4, 'rgba(180,120,255,0.08)');
  cgrd.addColorStop(0.8, 'rgba(80,200,255,0.05)');
  cgrd.addColorStop(1,   'rgba(120,80,255,0.02)');
  ctx.beginPath();
  ctx.arc(cx, cy, cR, 0, Math.PI * 2);
  ctx.fillStyle = cgrd;
  ctx.fill();

  // Glass border
  ctx.beginPath();
  ctx.arc(cx, cy, cR, 0, Math.PI * 2);
  const bGrd = ctx.createLinearGradient(cx - cR, cy - cR, cx + cR, cy + cR);
  bGrd.addColorStop(0,   'rgba(255,255,255,0.4)');
  bGrd.addColorStop(0.5, 'rgba(180,100,255,0.15)');
  bGrd.addColorStop(1,   'rgba(255,255,255,0.05)');
  ctx.strokeStyle = bGrd;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Shine highlight
  ctx.save();
  ctx.clip();
  const shine = ctx.createLinearGradient(cx - cR, cy - cR, cx + cR*0.3, cy+cR*0.3);
  shine.addColorStop(0, 'rgba(255,255,255,0.15)');
  shine.addColorStop(0.4,'rgba(255,255,255,0.04)');
  shine.addColorStop(1, 'transparent');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(cx, cy, cR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Time text
  const timeStr = `${t.pad12}:${t.pad(t.m)}:${t.pad(t.s)}`;
  ctx.font = `600 ${Math.min(w,h)*0.1}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 30; ctx.shadowColor = '#c084fc';
  ctx.fillStyle = '#f8f0ff';
  ctx.fillText(timeStr, cx, cy);
  ctx.shadowBlur = 0;

  // Date
  const d = new Date();
  ctx.font = `300 ${Math.min(w,h)*0.04}px 'Outfit', sans-serif`;
  ctx.fillStyle = 'rgba(200,160,255,0.55)';
  ctx.fillText(d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}), cx, cy + cR * 1.3);
}

// ─────────────────────────────────────────────
// 9. MIDNIGHT LUXE (Analog)
// ─────────────────────────────────────────────
function drawLuxe(ctx, w, h) {
  const t = getTime();
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.35;

  // Dark brushed metal background
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#0a0a0c');
  bgGrad.addColorStop(0.5, '#151518');
  bgGrad.addColorStop(1, '#050508');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Brushed lines texture
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 1;
  for(let i=0; i<w+h; i+=4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(0, i);
    ctx.stroke();
  }

  // Shadow / Bevel
  const rShadow = ctx.createRadialGradient(cx-R*0.1, cy-R*0.1, R*0.5, cx, cy, R*1.2);
  rShadow.addColorStop(0, 'rgba(255,215,0,0.05)');
  rShadow.addColorStop(1, 'transparent');
  ctx.fillStyle = rShadow;
  ctx.beginPath(); ctx.arc(cx, cy, R*1.1, 0, Math.PI*2); ctx.fill();

  // Outer Gold Ring
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  const ringGrad = ctx.createLinearGradient(cx-R, cy-R, cx+R, cy+R);
  ringGrad.addColorStop(0, '#ffd700');
  ringGrad.addColorStop(0.5, '#b8860b');
  ringGrad.addColorStop(1, '#ffeb73');
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Tick marks
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const ir = R * (isHour ? 0.8 : 0.9);
    const or = R * 0.95;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * ir, cy + Math.sin(angle) * ir);
    ctx.lineTo(cx + Math.cos(angle) * or, cy + Math.sin(angle) * or);
    ctx.strokeStyle = isHour ? '#ffd700' : 'rgba(255,215,0,0.3)';
    ctx.lineWidth = isHour ? 3 : 1;
    ctx.stroke();
  }

  // Hour hand
  const hAngle = ((t.h12 + t.m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, hAngle, R * 0.5, '#e5be01', 5, R * 0.1);

  // Minute hand
  const mAngle = ((t.m + t.s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, mAngle, R * 0.75, '#ffe55c', 3, R * 0.15);

  // Second hand
  const sAngle = ((t.s + t.ms / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, sAngle, R * 0.85, '#ff4500', 1.5, R * 0.2);

  // Center cap
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a'; ctx.fill();
}


// ─────────────────────────────────────────────
// 10. OCEAN DEPTHS (Analog)
// ─────────────────────────────────────────────
let oceanTime = 0;
function drawOcean(ctx, w, h) {
  const t = getTime();
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.35;
  oceanTime += 0.01;

  // Underwater gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#001a33');
  bgGrad.addColorStop(1, '#00081a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Ripples
  for (let i = 0; i < 3; i++) {
    const rx = cx + Math.sin(oceanTime + i*2) * 50;
    const ry = cy + Math.cos(oceanTime*0.8 + i*3) * 50;
    const rGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, R*1.5);
    rGrad.addColorStop(0, `rgba(0,180,216,${0.05 - i*0.01})`);
    rGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rGrad;
    ctx.beginPath(); ctx.arc(rx, ry, R*1.5, 0, Math.PI*2); ctx.fill();
  }

  // Dial
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,180,216,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots for hours
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * R * 0.85;
    const y = cy + Math.sin(angle) * R * 0.85;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2);
    ctx.fillStyle = i % 3 === 0 ? '#48cae4' : 'rgba(72,202,228,0.4)';
    ctx.fill();
  }

  // Hour hand
  const hAngle = ((t.h12 + t.m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, hAngle, R * 0.45, '#90e0ef', 4, R * 0.05);

  // Minute hand
  const mAngle = ((t.m + t.s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, mAngle, R * 0.7, '#caf0f8', 2.5, R * 0.1);

  // Second hand (coral accent)
  const sAngle = ((t.s + t.ms / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, sAngle, R * 0.8, '#ff7096', 1, R * 0.2);

  // Small center dot
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ff7096'; ctx.fill();
}


// ─────────────────────────────────────────────
// 11. STEAMPUNK (Analog)
// ─────────────────────────────────────────────
function drawSteam(ctx, w, h) {
  const t = getTime();
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.35;
  const timeSecs = t.s + t.ms/1000;

  // Leather/dark wood bg
  ctx.fillStyle = '#170e04';
  ctx.fillRect(0, 0, w, h);
  
  const vig = ctx.createRadialGradient(cx, cy, R*0.5, cx, cy, Math.max(w,h)*0.8);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = vig;
  ctx.fillRect(0,0,w,h);

  function drawGear(gx, gy, radius, teeth, rotation, color) {
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    for(let i=0; i<teeth; i++) {
      const a = (i/teeth)*Math.PI*2;
      const tW = (Math.PI*radius)/teeth * 0.6;
      ctx.lineTo(Math.cos(a-tW/radius)*radius, Math.sin(a-tW/radius)*radius);
      ctx.lineTo(Math.cos(a+tW/radius)*radius, Math.sin(a+tW/radius)*radius);
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath(); ctx.arc(0, 0, radius*0.3, 0, Math.PI*2);
    ctx.fillStyle = '#170e04'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Background Gears
  drawGear(cx - R*0.5, cy + R*0.4, R*0.4, 12, timeSecs*0.5, '#8b5a2b');
  drawGear(cx + R*0.4, cy - R*0.3, R*0.3, 8, -timeSecs*0.7, '#cd7f32');
  drawGear(cx, cy, R*0.6, 16, timeSecs*0.2, '#b87333');

  // Outer rim
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  const rimGrad = ctx.createLinearGradient(cx-R, cy-R, cx+R, cy+R);
  rimGrad.addColorStop(0, '#cd7f32'); // Bronze
  rimGrad.addColorStop(0.5, '#8b5a2b');
  rimGrad.addColorStop(1, '#e6a87c');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 8;
  ctx.stroke();

  // Roman Numerals
  const roman = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  ctx.font = `bold ${R*0.15}px 'Space Grotesk', serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#cd7f32';
  for(let i=0; i<12; i++) {
    const a = (i/12)*Math.PI*2 - Math.PI/2;
    ctx.fillText(roman[i], cx + Math.cos(a)*R*0.8, cy + Math.sin(a)*R*0.8);
  }

  // Hour hand
  const hAngle = ((t.h12 + t.m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, hAngle, R * 0.45, '#1a1a1a', 6, R * 0.1);
  drawHand(ctx, cx, cy, hAngle, R * 0.43, '#b87333', 2, R * 0.08); // inner detail

  // Minute hand
  const mAngle = ((t.m + t.s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, mAngle, R * 0.7, '#1a1a1a', 4, R * 0.15);
  drawHand(ctx, cx, cy, mAngle, R * 0.68, '#b87333', 1.5, R * 0.13); // inner detail

  // Second hand
  const sAngle = ((t.s + t.ms / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, sAngle, R * 0.8, '#8c1c1c', 2, R * 0.2); // deep red second hand
  
  // Center Bolt
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#222'; ctx.fill();
  ctx.strokeStyle = '#cd7f32'; ctx.lineWidth=2; ctx.stroke();
}


// ─────────────────────────────────────────────
// 12. SAKURA (Analog)
// ─────────────────────────────────────────────
let sakuraPetals = [];
function drawSakura(ctx, w, h) {
  const t = getTime();
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.35;

  if (sakuraPetals.length === 0) {
    for (let i = 0; i < 40; i++) {
      sakuraPetals.push({
        x: Math.random() * w,
        y: Math.random() * h,
        s: Math.random() * 0.5 + 0.5,
        a: Math.random() * Math.PI * 2,
        r: Math.random() * 0.02 - 0.01,
        vx: Math.random() * 1 - 0.5,
        vy: Math.random() * 1 + 0.5
      });
    }
  }

  // Soft cream background
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, w, h);

  // Subtle paper grain
  ctx.fillStyle = 'rgba(0,0,0,0.015)';
  for (let i = 0; i < 300; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  // Draw dropping petals
  ctx.fillStyle = 'rgba(255,183,197,0.6)';
  for (let p of sakuraPetals) {
    p.x += p.vx;
    p.y += p.vy;
    p.a += p.r;
    if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
    if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
    
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.scale(p.s, p.s);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(10, -5, 15, -15, 0, -20);
    ctx.bezierCurveTo(-15, -15, -10, -5, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  // Faint background dial branch
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100,60,60,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Subtle Hour Markers
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle)*R*0.9, cy + Math.sin(angle)*R*0.9, i%3===0 ? 4 : 2, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,160,180,0.8)';
    ctx.fill();
  }

  // Hour hand
  const hAngle = ((t.h12 + t.m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, hAngle, R * 0.45, '#5c4033', 3, R * 0.1); // Dark brown wood color

  // Minute hand
  const mAngle = ((t.m + t.s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, mAngle, R * 0.75, '#7a5a4a', 2, R * 0.15);

  // Second hand
  const sAngle = ((t.s + t.ms / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
  drawHand(ctx, cx, cy, sAngle, R * 0.85, '#ff809b', 1, R * 0.2);

  // Center blossom
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for(let i=0; i<5; i++) {
    const a = (i/5)*Math.PI*2;
    ctx.lineTo(Math.cos(a)*6, Math.sin(a)*6);
    const a2 = ((i+0.5)/5)*Math.PI*2;
    ctx.lineTo(Math.cos(a2)*3, Math.sin(a2)*3);
  }
  ctx.closePath();
  ctx.fillStyle = '#ff809b';
  ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────

// RENDERER MAP
// ─────────────────────────────────────────────
const CLOCKS = {
  neon:    { fn: drawNeon,    name: 'Neon Pulse' },
  cosmic:  { fn: drawCosmic,  name: 'Cosmic Orbit' },
  aurora:  { fn: drawAurora,  name: 'Aurora Borealis' },
  matrix:  { fn: drawMatrix,  name: 'Digital Rain' },
  zen:     { fn: drawZen,     name: 'Minimal Zen' },
  retro:   { fn: drawRetro,   name: 'Retro Flip' },
  holo:    { fn: drawHolo,    name: 'Holographic' },
  crystal: { fn: drawCrystal, name: 'Crystal Bloom' },
  luxe:    { fn: drawLuxe,    name: 'Midnight Luxe' },
  ocean:   { fn: drawOcean,   name: 'Ocean Depths' },
  steam:   { fn: drawSteam,   name: 'Steampunk' },
  sakura:  { fn: drawSakura,  name: 'Cherry Blossom' }
};

// ─────────────────────────────────────────────
// PREVIEW CANVASES (gallery cards)
// ─────────────────────────────────────────────
function initPreviews() {
  Object.keys(CLOCKS).forEach((key) => {
    const canvas = document.getElementById(`preview-${key}`);
    if (!canvas) return;
    const parent = canvas.parentElement;
    const W = parent.clientWidth  || 280;
    const H = parent.clientHeight || 175;
    canvas.width  = W;
    canvas.height = H;
  });
}

function renderPreviews() {
  Object.keys(CLOCKS).forEach((key) => {
    const canvas = document.getElementById(`preview-${key}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    CLOCKS[key].fn(ctx, canvas.width, canvas.height);
  });
}

// ─────────────────────────────────────────────
// HERO CLOCK (Cosmic)
// ─────────────────────────────────────────────
function renderHeroClock() {
  const canvas = document.getElementById('heroClock');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  drawCosmic(ctx, canvas.width, canvas.height);
}

// ─────────────────────────────────────────────
// FULLSCREEN MODAL
// ─────────────────────────────────────────────
let activeTheme    = null;
let modalAnimId    = null;

function openPreview(theme) {
  activeTheme = theme;
  const modal  = document.getElementById('previewModal');
  const canvas = document.getElementById('modalCanvas');
  const title  = document.getElementById('modalTitle');

  if (title) title.textContent = CLOCKS[theme]?.name || theme;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  modal._resizeFn = resize;

  function loop() {
    const ctx = canvas.getContext('2d');
    CLOCKS[theme].fn(ctx, canvas.width, canvas.height);
    modalAnimId = requestAnimationFrame(loop);
  }
  cancelAnimationFrame(modalAnimId);
  loop();

  // ESC to close
  document.addEventListener('keydown', escClose);
}

function closePreview() {
  const modal = document.getElementById('previewModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  cancelAnimationFrame(modalAnimId);
  modalAnimId = null;
  activeTheme = null;
  if (modal._resizeFn) window.removeEventListener('resize', modal._resizeFn);
  document.removeEventListener('keydown', escClose);
}

function escClose(e) {
  if (e.key === 'Escape') closePreview();
}

// ─────────────────────────────────────────────
// DOWNLOAD LIVE WALLPAPER (Standalone HTML)
// ─────────────────────────────────────────────
async function downloadWallpaper(theme) {
  try {
    const btn = document.getElementById(`btn-download-${theme}`);
    const originalText = btn ? btn.innerHTML : '↓ Download';
    if (btn) btn.innerHTML = 'Downloading...';

    // Fetch the script to bundle it
    const resp = await fetch('script.js');
    if (!resp.ok) throw new Error("Failed to fetch script");
    let jsText = await resp.text();

    // Strip the website init logic from the script so it doesn't try to run gallery code
    const initIdx = jsText.indexOf("window.addEventListener('load'");
    if (initIdx !== -1) {
      jsText = jsText.substring(0, initIdx);
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ChronoWall - ${CLOCKS[theme].name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; background: #000; width: 100vw; height: 100vh; }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <canvas id="wallpaperCanvas"></canvas>
  <script>
${jsText}

// --- Standalone Wallpaper Initialization ---
const canvas = document.getElementById('wallpaperCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function loop() {
  CLOCKS['${theme}'].fn(ctx, canvas.width, canvas.height);
  requestAnimationFrame(loop);
}
loop();
  <\/script>
</body>
</html>`;

    // Trigger download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChronoWall_${theme}_live.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    if (btn) btn.innerHTML = originalText;
  } catch (err) {
    console.error("Download failed:", err);
    alert("Could not build the live wallpaper. Please ensure you are viewing this via a web server (e.g. localhost) so scripts can be fetched.");
  }
}

function downloadCurrentPreview() {
  if (activeTheme) {
    const modalBtn = document.getElementById('modalDownload');
    const originalText = modalBtn.innerHTML;
    modalBtn.innerHTML = 'Downloading...';
    downloadWallpaper(activeTheme).then(() => {
      modalBtn.innerHTML = originalText;
    });
  }
}

// ─────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────
function mainLoop() {
  updateClockDisplays();
  renderPreviews();
  renderHeroClock();
  requestAnimationFrame(mainLoop);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener('load', () => {
  initHeroStars();
  initPreviews();

  // Re-size preview canvases on window resize
  window.addEventListener('resize', () => {
    initPreviews();
  });

  // Navbar shrink on scroll
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 40) nav.style.background = 'rgba(8,11,20,0.95)';
    else nav.style.background = 'rgba(8,11,20,0.75)';
  });

  mainLoop();
});
