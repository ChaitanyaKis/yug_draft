/*
 * Yugantra — the Kala Yantra (time instrument).
 *
 * The dial IS the fest. Every ring is drawn from content.js:
 *   centre   the track figure of the event (or track) held at the top marker
 *   band 1   the tracks, each spanning its events, with its symbol
 *   band 2   every event, one sector each, with its day as dots
 *   band 3   the 3-day schedule on a 60-ghati clock (static; the hand reads it)
 *   band 4   each event's prize as a wedge; the rim is a 72-tooth cam, one
 *            tooth per hour of the fest, raised when something is on
 *   band 5   the fest's identity: name, tagline, dates, counts
 *
 * Two textures are painted with Canvas2D — "ancient" (engraved, Malayalam
 * numerals) and "future" (slugs, hex, binary, Gantt bars) — whose RGB
 * channels are masks (R = lines, G = type, B = fills). A full-screen fragment
 * shader rotates the bands, lights the metal, draws the centre figure as
 * signed-distance shapes, highlights a hovered event and composites the lens.
 *
 * Zero dependencies. Exposes window.YugantraDial.create(canvas).
 */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const TOP = -Math.PI / 2;
  const FONT_ML = '"Noto Serif Malayalam", "Manjari", serif';
  const FONT_MONO = '"DM Mono", ui-monospace, monospace';
  const FONT_DISPLAY = '"Marcellus", Georgia, serif';

  const mlNum = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x0d66 + Number(d)));

  /* ---------------------------------------------------------------- *
   * Canvas2D painter — every primitive is in dial units (1 = rim).    *
   * ---------------------------------------------------------------- */
  function painter(S) {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'lighter'; // channels accumulate independently
    const C = S / 2;
    const U = (S / 2) * 0.985;
    const k = S / 2048;
    const X = (a, r) => C + Math.cos(a) * r * U;
    const Y = (a, r) => C + Math.sin(a) * r * U;

    const P = {
      c, g, C, U, k,
      ring(r, w, col, dash) {
        g.strokeStyle = col; g.lineWidth = w * k;
        g.setLineDash(dash ? dash.map((d) => d * k) : []);
        g.beginPath(); g.arc(C, C, r * U, 0, TAU); g.stroke();
        g.setLineDash([]);
      },
      ray(a, r0, r1, w, col) {
        g.strokeStyle = col; g.lineWidth = w * k;
        g.beginPath(); g.moveTo(X(a, r0), Y(a, r0)); g.lineTo(X(a, r1), Y(a, r1)); g.stroke();
      },
      arc(r, a0, a1, w, col, cap) {
        g.strokeStyle = col; g.lineWidth = w * k; g.lineCap = cap || 'butt';
        g.beginPath(); g.arc(C, C, r * U, a0, a1); g.stroke();
        g.lineCap = 'butt';
      },
      dot(a, r, rad, col) { g.fillStyle = col; g.beginPath(); g.arc(X(a, r), Y(a, r), rad * U, 0, TAU); g.fill(); },
      circ(a, r, rad, w, col) { g.strokeStyle = col; g.lineWidth = w * k; g.beginPath(); g.arc(X(a, r), Y(a, r), rad * U, 0, TAU); g.stroke(); },
      annulus(r0, r1, col) {
        g.fillStyle = col;
        g.beginPath(); g.arc(C, C, r1 * U, 0, TAU); g.arc(C, C, r0 * U, 0, TAU); g.fill('evenodd');
      },
      sector(r0, r1, a0, a1, col) {
        g.fillStyle = col;
        g.beginPath(); g.arc(C, C, r1 * U, a0, a1); g.arc(C, C, r0 * U, a1, a0, true); g.closePath(); g.fill();
      },
      sectorLine(r0, r1, a0, a1, w, col) {
        g.strokeStyle = col; g.lineWidth = w * k;
        g.beginPath(); g.arc(C, C, r1 * U, a0, a1); g.arc(C, C, r0 * U, a1, a0, true); g.closePath(); g.stroke();
      },
      /** The site's track figures (0 ◇ · 1 △ · 2 twin circles · 3 point-in-circle · 4 power), upright at the top. */
      figure(kind, a, r, size, w, col) {
        const s = size * U;
        g.save();
        g.translate(X(a, r), Y(a, r)); g.rotate(a + Math.PI / 2);
        g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w * k; g.lineCap = 'round';
        g.beginPath();
        if (kind === 0) { g.moveTo(0, -s); g.lineTo(s, 0); g.lineTo(0, s); g.lineTo(-s, 0); g.closePath(); g.stroke(); }
        else if (kind === 1) { g.moveTo(0, -1.05 * s); g.lineTo(0.95 * s, 0.6 * s); g.lineTo(-0.95 * s, 0.6 * s); g.closePath(); g.stroke(); }
        else if (kind === 2) { g.arc(-0.38 * s, 0, 0.72 * s, 0, TAU); g.moveTo(1.1 * s, 0); g.arc(0.38 * s, 0, 0.72 * s, 0, TAU); g.stroke(); }
        else if (kind === 3) { g.arc(0, 0, 0.95 * s, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 0.26 * s, 0, TAU); g.fill(); }
        else { g.arc(0, 0, 0.9 * s, -Math.PI / 2 + 0.55, -Math.PI / 2 - 0.55 + TAU); g.moveTo(0, -1.12 * s); g.lineTo(0, -0.15 * s); g.stroke(); }
        g.restore();
        g.lineCap = 'butt';
      },
      square(a, r, half, filled, w, col) {
        g.save();
        g.translate(X(a, r), Y(a, r)); g.rotate(a);
        if (filled) { g.fillStyle = col; g.fillRect(-half * U, -half * U, 2 * half * U, 2 * half * U); }
        else { g.strokeStyle = col; g.lineWidth = w * k; g.strokeRect(-half * U, -half * U, 2 * half * U, 2 * half * U); }
        g.restore();
      },
      /** Text tangent to the circle, upright at the top. */
      text(str, a, r, size, font, col, weight) {
        g.save();
        g.translate(X(a, r), Y(a, r)); g.rotate(a + Math.PI / 2);
        g.fillStyle = col; g.font = `${weight || 400} ${size * U}px ${font}`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(str, 0, 0);
        g.restore();
      },
      /** Text running outward along the radius, starting at r0. */
      radial(str, a, r0, size, font, col, weight) {
        g.save();
        g.translate(X(a, r0), Y(a, r0)); g.rotate(a);
        g.fillStyle = col; g.font = `${weight || 400} ${size * U}px ${font}`;
        g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText(str, 0, 0);
        g.restore();
      },
      /** Curved label centred on angle `mid`, one glyph at a time. */
      arcText(str, mid, r, size, font, col, track) {
        const px = size * U;
        g.font = `400 ${px}px ${font}`;
        const glyphs = [...str];
        const ws = glyphs.map((ch) => g.measureText(ch).width + px * (track == null ? 0.16 : track));
        const total = ws.reduce((s, w) => s + w, 0);
        let s = -total / 2;
        glyphs.forEach((ch, i) => {
          const a = mid + (s + ws[i] / 2) / (r * U);
          if (ch !== ' ') P.text(ch, a, r, size, font, col);
          s += ws[i];
        });
      },
      /** Tokens laid around the full circle, spacing stretched to close it. */
      textRing(tokens, r, size, col) {
        const px = size * U;
        const items = tokens.map((tok) => {
          if (tok.sep) return { sep: true, w: px * 1.1 };
          g.font = `${tok.weight || 400} ${px}px ${tok.font}`;
          return { ...tok, w: g.measureText(tok.t).width + px * (tok.gap == null ? 0.18 : tok.gap) };
        });
        const unit = items.reduce((s, it) => s + it.w, 0);
        const circ = TAU * r * U;
        const reps = Math.max(1, Math.floor(circ / unit));
        const stretch = circ / (unit * reps);
        let s = 0;
        for (let rep = 0; rep < reps; rep++) {
          for (const it of items) {
            const adv = it.w * stretch;
            const a = TOP + (s + adv / 2) / (r * U);
            if (it.sep) {
              g.save();
              g.translate(X(a, r), Y(a, r)); g.rotate(a + Math.PI / 4);
              g.fillStyle = col;
              const d = px * 0.16;
              g.fillRect(-d, -d, 2 * d, 2 * d);
              g.restore();
            } else if (it.t !== ' ') {
              P.text(it.t, a, r, size, it.font, col, it.weight);
            }
            s += adv;
          }
        }
      }
    };
    return P;
  }

  const L = (a) => `rgba(255,0,0,${a})`; // line mask
  const T = (a) => `rgba(0,255,0,${a})`; // type mask
  const F = (a) => `rgba(0,0,255,${a})`; // fill mask
  const BOUNDS = [0.2, 0.36, 0.53, 0.7, 0.86];
  const DAY_R = [0.585, 0.607, 0.629];            // schedule rows for day 1..3
  const slotAngle = (minutes) => TOP + ((((minutes - 360) / 1440) % 1 + 1) % 1) * TAU; // 0 = 06:00 IST

  /** Split ring segments into per-glyph tokens (Latin curves; Malayalam stays whole). */
  function ringTokens(segments, latinFont, mono) {
    const out = [];
    segments.forEach((seg) => {
      if (seg.sep) { out.push({ sep: true }); return; }
      if (seg.ml) { out.push({ t: seg.text, font: FONT_ML, weight: 600, gap: 0.35 }); return; }
      for (const ch of seg.text) out.push({ t: ch, font: latinFont, gap: mono ? 0.2 : 0.3 });
      out.push({ t: ' ', font: latinFont, gap: 0.1 });
    });
    return out;
  }
  const shortMoney = (v) => (v >= 1e5 ? `${+(v / 1e5).toFixed(2)}L` : `${Math.round(v / 1e3)}K`);

  /* ---------------- Ancient dial: engraved, Malayalam numerals -------- */
  function drawAncient(S, d) {
    const P = painter(S);
    const N = d.events.length, step = TAU / N;
    const a0 = (i) => TOP + i * step;

    P.annulus(0.205, 0.355, F(0.16));
    P.annulus(0.365, 0.525, F(0.26));
    P.annulus(0.535, 0.695, F(0.12));
    P.annulus(0.705, 0.855, F(0.22));
    P.annulus(0.865, 0.995, F(0.3));
    BOUNDS.forEach((r) => { P.ring(r - 0.0045, 1.3, L(0.95)); P.ring(r + 0.0045, 1.3, L(0.95)); });
    P.ring(0.998, 2.4, L(1));
    P.ring(0.984, 1, L(0.5));

    // centre: the frame the track figure sits in
    P.ring(0.165, 0.9, L(0.25));

    // band 1 — tracks, each spanning its own events
    d.tracks.forEach((t) => {
      P.ray(a0(t.from), 0.205, 0.355, 1.8, L(1));
      const mid = a0(t.from) + ((t.to - t.from + 1) * step) / 2;
      P.arcText(t.label, mid, 0.296, 0.03, FONT_DISPLAY, T(1), 0.22);
      P.figure(t.kind, mid, 0.238, 0.016, 1.6, T(1));
    });
    for (let i = 0; i < N; i++) {
      P.ray(a0(i), 0.205, 0.222, 0.9, L(0.55));
      P.ray(a0(i), 0.338, 0.355, 0.9, L(0.55));
    }

    // band 2 — one sector per event: its name, and its day as dots
    d.events.forEach((ev, i) => {
      const boundary = d.tracks.some((t) => t.from === i);
      P.ray(a0(i), 0.365, 0.525, boundary ? 1.8 : 1.1, L(boundary ? 1 : 0.7));
      const mid = a0(i) + step / 2;
      P.radial(ev.short || ev.name, mid, 0.378, 0.021, FONT_DISPLAY, T(1));
      const n = Math.max(1, ev.day);
      for (let k = 0; k < n; k++) {
        const a = mid + (k - (n - 1) / 2) * 0.024;
        if (ev.day === 0) P.circ(a, 0.51, 0.0045, 1, L(0.9));
        else P.dot(a, 0.51, 0.0048, T(1));
      }
    });

    // band 3 — the schedule on a 60-ghati clock (0 = 06:00 IST, top)
    for (let i = 0; i < 240; i++) {
      const a = TOP + (i * TAU) / 240;
      const major = i % 4 === 0, five = i % 20 === 0;
      P.ray(a, 0.535, 0.535 + (five ? 0.036 : major ? 0.024 : 0.013), major ? 1.3 : 0.7, L(major ? 0.9 : 0.5));
    }
    for (let j = 0; j < 12; j++) {
      const hour = (6 + j * 2) % 24;
      P.text(mlNum(hour), TOP + (j * 5 * TAU) / 60, 0.668, 0.026, FONT_ML, T(0.95), 600);
    }
    DAY_R.slice(0, d.days).forEach((r, di) => {
      P.ring(r, 0.8, L(0.22));
      P.text(mlNum(di + 1), TOP - 0.045, r, 0.014, FONT_ML, T(0.8), 600);
    });
    d.slots.forEach((s) => {
      const r = DAY_R[s.day - 1];
      if (r == null) return;
      P.dot(slotAngle(s.minutes), r, 0.0062, T(1));
    });

    // band 4 — prizes as wedges (length ∝ prize); workshops and talks as rings
    d.events.forEach((ev, i) => {
      const a = a0(i), mid = a + step / 2;
      P.ray(a, 0.705, 0.8, 0.8, L(0.45));
      if (ev.prize > 0) {
        const len = 0.085 * (ev.prize / d.maxPrize);
        P.sector(0.712, 0.712 + len, a + step * 0.22, a + step * 0.78, F(0.6));
        P.sectorLine(0.712, 0.712 + len, a + step * 0.22, a + step * 0.78, 1, L(0.75));
        P.text(shortMoney(ev.prize), mid, 0.815, 0.018, FONT_DISPLAY, T(0.95));
      } else {
        P.circ(mid, 0.74, 0.011, 1.1, L(0.8));
        P.text(ev.kind === 'workshop' ? 'LEARN' : ev.kind === 'showcase' ? 'SHOWCASE' : 'PRIZES TBA', mid, 0.815, 0.014, FONT_DISPLAY, T(0.8));
      }
    });

    // rim of band 4 — a cam of 72 teeth, one per hour of the fest
    const H = d.activity.length;
    P.ring(0.832, 0.9, L(0.55));
    for (let h = 0; h < H; h++) {
      const s0 = TOP + (h * TAU) / H + 0.006, s1 = TOP + ((h + 1) * TAU) / H - 0.006;
      const top = d.activity[h] ? 0.853 : 0.842;
      P.sector(0.832, top, s0, s1, F(d.activity[h] ? 0.7 : 0.35));
      P.sectorLine(0.832, top, s0, s1, 0.8, L(d.activity[h] ? 0.8 : 0.4));
    }

    // band 5 — identity
    P.textRing(ringTokens(d.ringAncient, FONT_DISPLAY, false), 0.929, 0.048, T(1));
    return P.c;
  }

  /* ---------------- Future dial: slugs, hex, binary, Gantt ------------- */
  function drawFuture(S, d) {
    const P = painter(S);
    const N = d.events.length, step = TAU / N;
    const a0 = (i) => TOP + i * step;
    const bits = Math.max(1, Math.ceil(Math.log2(N)));

    BOUNDS.forEach((r) => P.ring(r, 1.1, L(0.9)));
    P.ring(0.998, 1.6, L(1));
    P.ring(0.972, 0.8, L(0.45), [6, 10]);

    // centre reticle
    for (let i = 0; i < 4; i++) P.ray(TOP + (i * TAU) / 4, 0.03, 0.19, 0.8, L(0.4));
    P.ring(0.165, 0.7, L(0.3), [4, 8]);

    // band 1 — track routes
    d.tracks.forEach((t) => {
      P.ray(a0(t.from), 0.205, 0.355, 1.4, L(0.9));
      const mid = a0(t.from) + ((t.to - t.from + 1) * step) / 2;
      P.arcText(`/${t.slug}`, mid, 0.296, 0.027, FONT_MONO, T(1), 0.1);
      P.arcText(`[${t.to - t.from + 1}]`, mid, 0.236, 0.02, FONT_MONO, T(0.8), 0.1);
    });

    // band 2 — event ids, and each event's index in binary
    d.events.forEach((ev, i) => {
      P.ray(a0(i), 0.37, 0.52, 0.7, L(0.4));
      const mid = a0(i) + step / 2;
      P.radial(ev.id.length > 12 ? ev.id.slice(0, 11) + '…' : ev.id, mid, 0.378, 0.018, FONT_MONO, T(1));
      for (let b = 0; b < bits; b++) {
        const a = mid + (b - (bits - 1) / 2) * 0.022;
        if ((i >> (bits - 1 - b)) & 1) P.square(a, 0.51, 0.0045, true, 0, T(0.95));
        else P.square(a, 0.51, 0.0045, false, 1, L(0.6));
      }
    });

    // band 3 — the schedule as a Gantt ring
    for (let i = 0; i < 60; i++) P.ray(TOP + (i * TAU) / 60, 0.535, 0.535 + (i % 5 === 0 ? 0.03 : 0.014), 0.8, L(0.55));
    for (let j = 0; j < 12; j++) P.text(String((6 + j * 2) % 24).padStart(2, '0'), TOP + (j * 5 * TAU) / 60, 0.668, 0.02, FONT_MONO, T(0.9));
    d.slots.forEach((s) => {
      const r = DAY_R[s.day - 1];
      if (r == null) return;
      const s0 = slotAngle(s.minutes), s1 = s0 + (Math.min(1380, Math.max(30, s.duration)) / 1440) * TAU;
      P.arc(r, s0 + 0.004, s1 - 0.004, 7, F(0.85));
      P.ray(s0, r - 0.009, r + 0.009, 1, L(0.9));
    });

    // band 4 — prizes in hex; rim as an hourly activity barcode
    d.events.forEach((ev, i) => {
      const a = a0(i), mid = a + step / 2;
      if (ev.prize > 0) {
        const len = 0.085 * (ev.prize / d.maxPrize);
        P.sector(0.712, 0.712 + len, a + step * 0.3, a + step * 0.7, F(0.8));
      }
      P.text(ev.prize > 0 ? `0x${ev.prize.toString(16).toUpperCase()}` : 'null', mid, 0.815, 0.015, FONT_MONO, T(0.9));
    });
    const H = d.activity.length;
    for (let h = 0; h < H; h++) {
      const a = TOP + ((h + 0.5) * TAU) / H;
      P.ray(a, 0.832, d.activity[h] ? 0.855 : 0.842, d.activity[h] ? 2.4 : 0.8, L(d.activity[h] ? 0.95 : 0.4));
    }

    // band 5 — identity as data
    P.textRing(ringTokens(d.ringFuture, FONT_MONO, true), 0.929, 0.034, T(1));
    return P.c;
  }

  /* ---------------------------------------------------------------- *
   * Shaders                                                           *
   * ---------------------------------------------------------------- */
  const VERT = `
    attribute vec2 aPos;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif
    uniform vec2 uRes;
    uniform float uDpr, uTime, uRadius, uOpacity, uShapeA, uShapeB, uShapeMix, uLight, uHand, uLensAmt, uGrain, uHasTex, uScroll, uFocusA, uFocusB, uFocusAmt, uN, uBoot, uExplode;
    uniform vec2 uTilt;   // pitch, yaw of the exploded view
    uniform vec2 uCenter;
    uniform vec4 uRotA;   // bands 1..4
    uniform vec2 uRotB;   // band 5, band 0
    uniform vec3 uLens;   // x, y, radius (device px)
    uniform vec3 uTint;
    uniform sampler2D uTexA;
    uniform sampler2D uTexF;

    const float TAU = 6.28318530718;
    const vec3 BG = vec3(0.0118, 0.0667, 0.0510);      // #03110D
    const vec3 EMERALD = vec3(0.0863, 0.1882, 0.1686); // #16302B
    const vec3 GOLD = vec3(0.6392, 0.5216, 0.3765);    // #A38560
    const vec3 GOLDHI = vec3(0.86, 0.76, 0.58);
    const vec3 WARM = vec3(0.8784);                    // #E0E0E0
    const vec3 SAGE = vec3(0.6588, 0.7098, 0.6863);    // #A8B5AF

    float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c*p.x - s*p.y, s*p.x + c*p.y); }

    float bandAngle(float r){
      if (r < 0.20) return uRotB.y;
      if (r < 0.36) return uRotA.x;
      if (r < 0.53) return uRotA.y;
      if (r < 0.70) return uRotA.z;
      if (r < 0.86) return uRotA.w;
      return uRotB.x;
    }
    // pxs: the size of one device pixel in dial units at this point. Gradients are
    // given explicitly so mip selection never sees the jump between rotating bands
    // (no seams), and are tightened slightly (SHARP) so type stays crisp in motion.
    const float SHARP = 0.8;
    vec3 dialTex(sampler2D tex, vec2 p, float pxs){
      float r = length(p);
      if (r > 1.0) return vec3(0.0);
      float a = -bandAngle(r);
      vec2 q = rot(p, a);
      vec2 gx = rot(vec2(pxs, 0.0), a) * (0.4925 * SHARP);
      vec2 gy = rot(vec2(0.0, pxs), a) * (0.4925 * SHARP);
      return TEXGRAD(tex, 0.5 + q * 0.4925, gx, gy).rgb;
    }
    // 1 inside the focused sectors (an event or a whole track), in the tracks, events and prize bands
    float focusMask(vec2 p){
      if (uFocusA < 0.0) return 0.0;
      float r = length(p);
      bool inBand = (r > 0.2 && r < 0.53) || (r > 0.7 && r < 0.86);
      if (!inBand) return 0.0;
      float a = mod(atan(p.y, p.x) - uRotA.x + 1.5707963, TAU);
      float s = floor(a / (TAU / uN));
      return (s > uFocusA - 0.5 && s < uFocusB + 0.5) ? uFocusAmt : 0.0;
    }

    float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
    float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
    float sdTri(vec2 p, float r){
      const float k = 1.7320508;
      p.x = abs(p.x) - r; p.y = p.y + r / k;
      if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
      p.x -= clamp(p.x, -2.0 * r, 0.0);
      return -length(p) * sign(p.y);
    }
    float stroke(float d, float w, float aa){ return 1.0 - smoothstep(w * 0.5, w * 0.5 + aa, abs(d)); }

    // Track figures, identical to the site's symbols:
    // 0 Code ◇ · 1 Robotics △ · 2 Design (twin circles) · 3 AI & Security (point in circle) · 4 Workshops / Yugantra (power)
    float glyph(float k, vec2 p, float w, float aa){
      if (k < 0.5) return stroke(sdBox(rot(p, 0.7853982), vec2(0.086)), w * 1.3, aa);
      if (k < 1.5) return stroke(sdTri(vec2(p.x, 0.02 - p.y), 0.112), w * 1.3, aa);
      if (k < 2.5) return max(stroke(length(p - vec2(0.046, 0.0)) - 0.086, w * 1.3, aa), stroke(length(p + vec2(0.046, 0.0)) - 0.086, w * 1.3, aa));
      if (k < 3.5) return max(stroke(length(p) - 0.112, w * 1.3, aa), 1.0 - smoothstep(0.03, 0.03 + aa, length(p)));
      float r = length(p);
      float ang = atan(p.x, -p.y);
      float arc = stroke(r - 0.105, w * 1.5, aa) * smoothstep(0.52, 0.6, abs(ang));
      float line = stroke(sdSeg(p, vec2(0.0, -0.14), vec2(0.0, -0.018)), w * 1.5, aa);
      return max(arc, line);
    }
    float glyphMix(vec2 p, float w, float aa){
      float f = smoothstep(0.0, 1.0, clamp(uShapeMix, 0.0, 1.0));
      float a = glyph(uShapeA, rot(p, f * 0.9), w, aa);
      if (f > 0.999) return glyph(uShapeB, p, w, aa);
      float b = glyph(uShapeB, rot(p, (f - 1.0) * 0.9), w, aa);
      return mix(a, b, f);
    }
    // The hand reads the schedule ring only; it never points into the event wheel.
    float hand(vec2 p, float w, float aa){
      vec2 d = vec2(sin(uHand), -cos(uHand));
      float h = stroke(sdSeg(p, d * 0.54, d * 0.688), w * 1.1, aa);
      h = max(h, 1.0 - smoothstep(0.0, aa, sdBox(rot(p - d * 0.7, -uHand + 0.7853982), vec2(0.009))));
      return h;
    }
    // Fixed marker at 12 o'clock: the event (or track) the wheel is holding.
    float marker(vec2 p, float aa){
      float t = 1.0 - smoothstep(0.0, aa, sdTri(p - vec2(0.0, -0.556), 0.017));
      float stem = stroke(sdSeg(p, vec2(0.0, -0.575), vec2(0.0, -0.61)), 0.004, aa);
      return max(t, stem);
    }

    float bandIndex(float r){ return r < 0.2 ? 0.0 : r < 0.36 ? 1.0 : r < 0.53 ? 2.0 : r < 0.70 ? 3.0 : r < 0.86 ? 4.0 : 5.0; }
    float bandLo(float b){ return b < 0.5 ? 0.0 : b < 1.5 ? 0.2 : b < 2.5 ? 0.36 : b < 3.5 ? 0.53 : b < 4.5 ? 0.70 : 0.86; }
    float bandHi(float b){ return b < 0.5 ? 0.2 : b < 1.5 ? 0.36 : b < 2.5 ? 0.53 : b < 3.5 ? 0.70 : b < 4.5 ? 0.86 : 1.0; }

    // Boot: each ring is swept on clockwise from 12 o'clock, centre first.
    float bootLocal(float b){ return clamp(uBoot * 6.6 - b, 0.0, 1.0); }
    float bootMask(vec2 q, float b){
      if (uBoot >= 0.999) return 1.0;
      float a = mod(atan(q.y, q.x) + 1.5707963, TAU) / TAU;
      return 1.0 - smoothstep(bootLocal(b) - 0.012, bootLocal(b), a);
    }
    float bootEdge(vec2 q, float b){
      float l = bootLocal(b);
      if (uBoot >= 0.999 || l <= 0.0 || l >= 1.0) return 0.0;
      float a = mod(atan(q.y, q.x) + 1.5707963, TAU) / TAU;
      float d = (l - a) * TAU * length(q);
      return d < 0.0 ? 0.0 : exp(-d * 60.0);
    }

    // Everything the ancient dial shows at point q, which lies in band b.
    vec3 shadeDial(vec2 q, float b, float w, float aa, float pxs){
      float th = atan(q.y, q.x);
      float c = abs(cos(th - uLight));
      float sheen = pow(c, 3.0);
      float glint = pow(c, 42.0);
      vec3 metal = mix(GOLD * 0.82, GOLDHI, sheen * 0.65 + glint * 0.5);
      vec3 m = dialTex(uTexA, q, pxs) * uHasTex;
      float hv = focusMask(q) * uHasTex;
      vec3 col = metal * (m.r * (0.5 + 0.55 * sheen + 0.9 * glint) + m.g * (0.72 + 0.5 * sheen + 0.6 * glint));
      col += EMERALD * m.b * (0.8 + 0.6 * sheen);
      col = col * (1.0 + 0.9 * hv) + GOLD * 0.1 * hv;
      if (b < 0.5) col += metal * glyphMix(q, w, aa) * (0.95 + 0.5 * glint) * step(0.5, uBoot * 6.6);
      if (b > 2.5 && b < 3.5) {
        col += GOLDHI * hand(q, w, aa) * 0.9;
        col += GOLDHI * marker(q, aa) * uHasTex;
      }
      col *= bootMask(q, b);
      col += GOLDHI * bootEdge(q, b) * 0.9 * uHasTex;
      return col;
    }
    vec3 rx(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z); }
    vec3 ry(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }

    void main(){
      vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
      vec2 p = (px - uCenter) / uRadius;
      float r = length(p);
      float aa = 1.25 * uDpr / uRadius;
      float w = 1.9 * uDpr / uRadius;

      // atmosphere
      float glow = exp(-r * r * 0.85);
      vec3 col = BG + uTint * glow * 0.6;

      // perfboard: the build surface every project starts on
      vec2 g = (px + vec2(0.0, uScroll * 0.12 * uDpr)) / (28.0 * uDpr);
      float pad = smoothstep(0.11, 0.0, length(fract(g) - 0.5));
      col += GOLD * pad * (0.035 + 0.05 * glow);

      if (uExplode < 0.002) {
        col += shadeDial(p, bandIndex(r), w, aa, 1.0 / uRadius) * uOpacity;
      } else {
        // exploded view: every band is its own plate, tilted and pulled apart in depth
        vec3 ro = rx(ry(vec3(0.0, 0.0, -2.4), -uTilt.y), -uTilt.x);
        vec3 rd = rx(ry(vec3(p, 2.4), -uTilt.y), -uTilt.x);
        vec3 acc = vec3(0.0);
        for (int i = 0; i < 6; i++) {
          float b = float(i);
          float z = (b - 2.5) * 0.26 * uExplode;
          float t = (z - ro.z) / rd.z;
          if (t <= 0.0) continue;
          vec2 q = ro.xy + rd.xy * t;
          float rq = length(q);
          if (rq < bandLo(b) || rq >= bandHi(b)) continue;
          acc += shadeDial(q, b, w * t, aa * t, t / uRadius) * (1.05 - 0.07 * b * uExplode);
        }
        col += acc * uOpacity;
      }

      // the time lens
      if (uLensAmt > 0.001 && uLens.z > 1.0 && uExplode < 0.002) {
        vec2 lp = px - uLens.xy;
        float ld = length(lp);
        float LR = uLens.z;
        float inside = 1.0 - smoothstep(LR - 1.5 * uDpr, LR, ld);
        if (inside > 0.0) {
          float t = clamp(ld / LR, 0.0, 1.0);
          vec2 pxm = uLens.xy + lp * (0.7 + 0.22 * t * t);
          vec2 pm = (pxm - uCenter) / uRadius;
          float rm = length(pm);
          float thm = atan(pm.y, pm.x);
          vec3 fm = dialTex(uTexF, pm, (0.7 + 0.22 * t * t) / uRadius) * uHasTex;
          float sweep = pow(fract(thm / TAU + 0.5 - uTime * 0.06), 7.0);
          vec3 fc = BG * 0.7 + EMERALD * (0.5 + 0.35 * exp(-rm * rm * 2.0));
          vec3 fd = GOLDHI * fm.r * (0.85 + 0.5 * sweep) + WARM * fm.g * 0.95 + SAGE * fm.b * (0.3 + 0.55 * sweep);
          fd *= 1.0 + 0.8 * focusMask(pm);
          fd += WARM * glyphMix(pm, w * 0.8, aa * 0.8);
          fd += GOLDHI * hand(pm, w * 0.8, aa * 0.8);
          fd += WARM * marker(pm, aa * 0.8) * uHasTex;
          fc += fd * max(uOpacity, 0.55);
          fc *= 1.0 - 0.5 * pow(t, 5.0);
          col = mix(col, fc, inside);
        }
        col += GOLD * exp(-pow((ld - LR) / (16.0 * uDpr), 2.0)) * 0.12 * uLensAmt;
      }

      vec2 uv = gl_FragCoord.xy / uRes;
      col *= 1.0 - 0.42 * pow(length(uv - 0.5) * 1.3, 2.4);
      col += (hash12(px + fract(uTime * 7.0) * 97.0) - 0.5) * uGrain;
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('Shader compile failed: ' + log);
    }
    return s;
  }

  function create(canvas) {
    const opts = { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' };
    let gl = canvas.getContext('webgl2', opts);
    const gl2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) return null;
    const lodExt = !gl2 && gl.getExtension('EXT_shader_texture_lod');
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
    let vertSrc = VERT, fragSrc = FRAG;
    if (gl2) {
      vertSrc = '#version 300 es\n' + VERT.replace(/\battribute\b/g, 'in');
      fragSrc = '#version 300 es\n#define TEXGRAD(s, uv, gx, gy) textureGrad(s, uv, gx, gy)\nout highp vec4 fragColor;\n' +
        FRAG.replace(/\btexture2D\(/g, 'texture(').replace(/\bgl_FragColor\b/g, 'fragColor');
    } else if (lodExt) {
      fragSrc = '#extension GL_EXT_shader_texture_lod : enable\n#define TEXGRAD(s, uv, gx, gy) texture2DGradEXT(s, uv, gx, gy)\n' + FRAG;
    } else {
      fragSrc = '#define TEXGRAD(s, uv, gx, gy) texture2D(s, uv)\n' + FRAG;
    }

    let prog, uni = {}, texA, texF, hasTex = 0, recipe = null, texSize = 0;
    const NAMES = ['uRes', 'uDpr', 'uTime', 'uRadius', 'uOpacity', 'uShapeA', 'uShapeB', 'uShapeMix', 'uLight', 'uHand', 'uLensAmt', 'uGrain', 'uHasTex', 'uScroll', 'uFocusA', 'uFocusB', 'uFocusAmt', 'uN', 'uBoot', 'uExplode', 'uTilt', 'uCenter', 'uRotA', 'uRotB', 'uLens', 'uTint', 'uTexA', 'uTexF'];

    function makeTex() {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      return t;
    }
    function upload(tex, img) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    }
    function init() {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertSrc));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
      gl.bindAttribLocation(prog, 0, 'aPos');
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('Program link failed: ' + gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      NAMES.forEach((n) => { uni[n] = gl.getUniformLocation(prog, n); });
      texA = makeTex();
      texF = makeTex();
      gl.uniform1i(uni.uTexA, 0);
      gl.uniform1i(uni.uTexF, 1);
      if (recipe) paintNow(recipe.size, recipe.data);
    }

    function paintNow(S, data) {
      const a = drawAncient(S, data), f = drawFuture(S, data);
      upload(texA, a); upload(texF, f);
      a.width = a.height = f.width = f.height = 0; // release the canvas backing stores
      hasTex = 1; texSize = S;
    }

    init();

    let lost = false;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });
    canvas.addEventListener('webglcontextrestored', () => { lost = false; uni = {}; init(); });

    return {
      /** Paint both dial textures from fest data; call after webfonts are ready. */
      paint(size, data) {
        const S = Math.min(size || 2048, maxTex);
        recipe = { size: S, data };
        if (!lost) paintNow(S, data);
        return S;
      },
      get maxTexture() { return maxTex; },
      get textureSize() { return texSize; },
      get webgl2() { return gl2; },
      resize(w, h, dpr) {
        const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
        if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      },
      /** s: all positions in CSS px; converted to device px here. */
      render(s) {
        if (lost) return;
        const d = s.dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texF);
        gl.uniform2f(uni.uRes, canvas.width, canvas.height);
        gl.uniform1f(uni.uDpr, d);
        gl.uniform1f(uni.uTime, s.time);
        gl.uniform2f(uni.uCenter, s.cx * d, s.cy * d);
        gl.uniform1f(uni.uRadius, Math.max(1, s.radius * d));
        gl.uniform1f(uni.uOpacity, s.opacity);
        gl.uniform4f(uni.uRotA, s.rot[1], s.rot[2], s.rot[3], s.rot[4]);
        gl.uniform2f(uni.uRotB, s.rot[5], s.rot[0]);
        gl.uniform1f(uni.uShapeA, s.shapeA);
        gl.uniform1f(uni.uShapeB, s.shapeB);
        gl.uniform1f(uni.uShapeMix, s.shapeMix);
        gl.uniform1f(uni.uLight, s.light);
        gl.uniform1f(uni.uHand, s.hand);
        gl.uniform3f(uni.uLens, s.lx * d, s.ly * d, s.lr * d);
        gl.uniform1f(uni.uLensAmt, s.lensAmt);
        gl.uniform3f(uni.uTint, s.tint[0], s.tint[1], s.tint[2]);
        gl.uniform1f(uni.uGrain, s.grain);
        gl.uniform1f(uni.uHasTex, hasTex);
        gl.uniform1f(uni.uScroll, s.scroll);
        gl.uniform1f(uni.uFocusA, s.focusA == null ? -1 : s.focusA);
        gl.uniform1f(uni.uFocusB, s.focusB == null ? -1 : s.focusB);
        gl.uniform1f(uni.uFocusAmt, s.focusAmt == null ? 1 : s.focusAmt);
        gl.uniform1f(uni.uN, Math.max(1, s.sectors || 1));
        gl.uniform1f(uni.uBoot, s.boot == null ? 1 : s.boot);
        gl.uniform1f(uni.uExplode, s.explode || 0);
        gl.uniform2f(uni.uTilt, s.tilt ? s.tilt[0] : 0, s.tilt ? s.tilt[1] : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  window.YugantraDial = { create, mlNum, slotAngle };
})();
