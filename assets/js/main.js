/*
 * Yugantra 2026 — page behaviour.
 * Reads content from window.YUGANTRA (content.js) and drives the dial from
 * window.YugantraDial (dial.js). No dependencies, no build step.
 *
 * Rule of the design: nothing on the page is decoration. Every figure,
 * tick, dot, ring, sound and motion is generated from the fest's own data.
 */
(() => {
  'use strict';

  const D = window.YUGANTRA;
  const site = D.site;
  const root = document.documentElement;

  /* ------------------------------------------------------------------ *
   * Utilities                                                          *
   * ------------------------------------------------------------------ */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
  const TAU = Math.PI * 2;
  const inr = new Intl.NumberFormat('en-IN');
  const rupees = (v) => `₹${inr.format(v)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f2 = (n) => n.toFixed(2);
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
  let reduced = reducedMQ.matches;
  let fine = fineMQ.matches;
  reducedMQ.addEventListener?.('change', (e) => { reduced = e.matches; });
  fineMQ.addEventListener?.('change', (e) => { fine = e.matches; });
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } }
  };

  /* ------------------------------------------------------------------ *
   * Derived facts — computed once, used everywhere                     *
   * ------------------------------------------------------------------ */
  const AGE = Object.fromEntries(D.ages.map((a, i) => [a.id, { ...a, index: i }]));
  const EVENTS = Object.fromEntries(D.events.map((e) => [e.id, e]));
  const eventsOf = (ageId) => D.events.filter((e) => e.era === ageId);
  const competitions = D.events.filter((e) => e.kind === 'competition');
  const confirmedPool = D.events.filter((e) => e.status !== 'tbc' && e.prize).reduce((s, e) => s + e.prize, 0);
  const trackCount = D.ages.filter((a) => a.years).length;
  const days = D.schedule.length;
  const slotCount = D.schedule.reduce((s, d) => s + d.slots.length, 0);
  const lakhText = (v) => (v / 1e5).toFixed(2).replace(/\.?0+$/, '');
  const longest = D.events.reduce((m, e) => (e.hours && e.hours > (m?.hours || 0) ? e : m), null);
  const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

  const IST_OFFSET = 5.5 * 3600e3;
  const weekday = (iso) => new Date(iso + 'T12:00:00+05:30').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  const toMinutes = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  /** Clock time "HH:MM" → ghatis (24 min) and palas (24 s) since 06:00. */
  const toGhati = (hhmm) => {
    const mins = toMinutes(hhmm);
    if (mins == null || mins < 360) return '';
    const g = (mins - 360) / 24;
    const whole = Math.floor(g), pala = Math.round((g - whole) * 60);
    return pala ? `${whole} gh ${pala} pa` : `${whole} gh`;
  };
  const dayOf = (n) => D.schedule.find((d) => d.day === n);
  function eventStart(ev) {
    const d = ev.day > 0 && dayOf(ev.day);
    const m = d && toMinutes(ev.time);
    if (d && m != null) return Date.parse(`${d.date}T${ev.time}:00+05:30`);
    return Date.parse(site.startsAt);
  }
  const whenLabel = (ev) => (ev.day === 0 ? 'Online' : `Day ${ev.day} · ${ev.time}`);
  function teamRange(team) {
    const t = String(team);
    const m = t.match(/(\d+)\s*[–-]\s*(\d+)/);
    if (m) return [Number(m[1]), Number(m[2])];
    if (/solo|individual/i.test(t)) return [1, 1];
    const n = t.match(/^\s*(\d+)\s*$/);
    return n ? [Number(n[1]), Number(n[1])] : [0, 0];
  }
  const durShort = (ev) => (!ev.hours ? 'Duration TBA' : /^\d+(–\d+)? hours$/.test(ev.duration) ? ev.duration : `${ev.hours} hours`);
  const prizeLabel = (ev) => (ev.prize ? (ev.split ? ev.split.map(rupees).join(' · ') : rupees(ev.prize)) : 'TBA');

  // The dial lays events out track by track.
  const DIAL_EVENTS = D.ages.flatMap((a) => eventsOf(a.id));
  const DIAL_INDEX = Object.fromEntries(DIAL_EVENTS.map((e, i) => [e.id, i]));
  const DIAL_STEP = TAU / DIAL_EVENTS.length;
  const TRACK_RANGE = D.ages.map((a) => {
    const idx = DIAL_EVENTS.map((e, i) => (e.era === a.id ? i : -1)).filter((i) => i >= 0);
    return idx.length ? [Math.min(...idx), Math.max(...idx)] : null;
  });
  const DIAL_TIMES = DIAL_EVENTS.map((e) => { const s0 = eventStart(e); return { start: s0, end: s0 + (e.hours || 2) * 3600e3 }; });
  /** The event the dial should hold: the one live now (latest started), else the next to start. */
  function heldEvent(now) {
    let live = -1, next = -1;
    DIAL_TIMES.forEach((t, i) => {
      if (DIAL_EVENTS[i].day === 0) return;
      if (now >= t.start && now < t.end && (live < 0 || t.start > DIAL_TIMES[live].start)) live = i;
      if (t.start >= now && (next < 0 || t.start < DIAL_TIMES[next].start)) next = i;
    });
    if (live >= 0) return { i: live, live: true };
    return { i: next >= 0 ? next : 0, live: false };
  }
  const fmtWhen = (ms) => new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
  }

  /* ------------------------------------------------------------------ *
   * Sound — synthesised, off by default. Every sound marks a real      *
   * event: a sector passing the marker, a ring locking, a seal breaking.*
   * ------------------------------------------------------------------ */
  const Sound = {
    on: false, ctx: null, last: 0,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },
    tick(freq = 1900, dur = 0.035, gain = 0.045) {
      if (!this.on || !this.ctx) return;
      const now = performance.now();
      if (now - this.last < 28) return;
      this.last = now;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    },
    chime() {
      if (!this.on || !this.ctx) return;
      [660, 990].forEach((f, i) => {
        const t = this.ctx.currentTime + i * 0.06, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + 0.75);
      });
    },
    crack() {
      if (!this.on || !this.ctx) return;
      const len = Math.floor(this.ctx.sampleRate * 0.22);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1400; g.gain.value = 0.35;
      src.connect(f).connect(g).connect(this.ctx.destination); src.start();
    }
  };
  const sndBtn = $('#sndBtn');
  function setSound(on) {
    Sound.on = on && Sound.ensure();
    sndBtn.setAttribute('aria-pressed', String(Sound.on));
    sndBtn.setAttribute('aria-label', Sound.on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on');
    store.set('yg-sound', Sound.on ? '1' : '0');
    if (Sound.on) Sound.chime();
  }
  sndBtn.addEventListener('click', () => setSound(!Sound.on));
  if (store.get('yg-sound') === '1') addEventListener('pointerdown', () => setSound(true), { once: true });

  /* ------------------------------------------------------------------ *
   * Odometer — digits roll like a mechanical counter                   *
   * ------------------------------------------------------------------ */
  const STRIP = '0123456789'.split('').map((d) => `<i>${d}</i>`).join('');
  function odo(el, text) {
    const str = String(text);
    const shape = str.replace(/\d/g, '0');
    if (el._odo !== shape) {
      el.innerHTML = `<span class="sr">${esc(str)}</span>` + [...str].map((ch) => (/\d/.test(ch)
        ? `<span class="odo-d" aria-hidden="true"><span class="odo-s">${STRIP}</span></span>`
        : `<span class="odo-c" aria-hidden="true">${esc(ch)}</span>`)).join('');
      el._odo = shape;
      el.classList.add('odo');
    } else {
      el.firstChild.textContent = str;
    }
    const strips = el.querySelectorAll('.odo-s');
    let k = 0;
    for (const ch of str) if (/\d/.test(ch)) strips[k++].style.transform = `translateY(${-Number(ch)}em)`;
  }
  /** Show zeros now; roll to the real value when the element scrolls into view. */
  function odoOnView(el, text) {
    if (reduced) { odo(el, text); return; }
    odo(el, String(text).replace(/\d/g, '0'));
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      setTimeout(() => odo(el, text), 120);
    }, { threshold: 0.6 });
    io.observe(el);
  }

  /* ------------------------------------------------------------------ *
   * The symbol system                                                   *
   * Track figures are the ages' dice counts: 4 → diamond, 3 → triangle, *
   * 2 → twin circles, 1 → a point, 0|1 → the power sign.                *
   * ------------------------------------------------------------------ */
  const poly = (n, R, rot) => {
    let d = '';
    for (let i = 0; i < n; i++) { const a = rot + (i * TAU) / n; d += `${i ? 'L' : 'M'}${f2(Math.cos(a) * R)} ${f2(Math.sin(a) * R)}`; }
    return `<path d="${d}Z"/>`;
  };
  const powerArc = (R, gap = 0.5) => `M${f2(Math.sin(gap) * R)} ${f2(-Math.cos(gap) * R)}A${R} ${R} 0 1 1 ${f2(-Math.sin(gap) * R)} ${f2(-Math.cos(gap) * R)}`;
  function figSVG(i) {
    const shapes = [
      '<path d="M0 -9L9 0L0 9L-9 0Z"/>',
      '<path d="M0 -9.5L8.5 5.5H-8.5Z"/>',
      '<circle cx="-3.4" r="6.4"/><circle cx="3.4" r="6.4"/>',
      '<circle r="8.5"/><circle r="2.3" class="fillc"/>',
      `<path d="${powerArc(8)}M0 -10V-1.5"/>`
    ];
    return `<svg class="fig" viewBox="-12 -12 24 24" aria-hidden="true">${shapes[i] ?? shapes[4]}</svg>`;
  }

  /* Centre pictograms: what you actually do at each event (drawn in ±18). */
  const gen = {
    board() {
      let g = '';
      for (let i = 1; i < 8; i++) g += `M${-16 + 4 * i} -16V16M-16 ${-16 + 4 * i}H16`;
      return `<rect x="-16" y="-16" width="32" height="32"/><path d="${g}" class="faint"/><path d="M-10 10V2H-6"/><circle cx="-10" cy="10" r="1.8" class="fillc"/><circle cx="-6" cy="2" r="2.6"/>`;
    },
    wave() {
      const hs = [4, 8, 14, 22, 30, 22, 14, 8, 4];
      return `<path d="${hs.map((h, i) => `M${-16 + i * 4} ${-h / 2}V${h / 2}`).join('')}" class="thick"/>`;
    },
    kolam() {
      let dots = '';
      for (const x of [-10, 0, 10]) for (const y of [-10, 0, 10]) if (!(x === 10 && y === 10)) dots += `<circle cx="${x}" cy="${y}" r="1.6" class="fillc"/>`;
      return `<path d="M-10 -17C-2 -17 -3 -5 0 -5C3 -5 2 -17 10 -17C17 -17 17 -10 17 -10C17 -2 5 -3 5 0C5 3 17 2 17 6M-17 10C-17 2 -5 3 -5 0C-5 -3 -17 -2 -17 -10C-17 -17 -10 -17 -10 -17M-17 10C-17 17 -10 17 -10 17C-2 17 -3 5 0 5C3 5 2 12 6 12"/>${dots}<rect x="8" y="8" width="4" height="4" class="fillc"/><rect x="13" y="8" width="4" height="4"/><rect x="8" y="13" width="4" height="4"/><rect x="13" y="13" width="4" height="4" class="fillc"/>`;
    }
  };
  const ICONS = {
    braces: '<ellipse rx="6.5" ry="10"/><path d="M-11 -12q-4 0-4 4v3.5q0 3.5-3.5 4.5q3.5 1 3.5 4.5v3.5q0 4 4 4M11 -12q4 0 4 4v3.5q0 3.5 3.5 4.5q-3.5 1-3.5 4.5v3.5q0 4-4 4"/>',
    'code-tag': '<path d="M-7 -9L-16 0L-7 9M7 -9L16 0L7 9M3 -13L-3 13"/>',
    chart: '<path d="M-16 -17V16H17"/><rect x="-12" y="10" width="4.5" height="6"/><rect x="-5" y="5" width="4.5" height="11"/><rect x="2" y="0" width="4.5" height="16"/><rect x="9" y="-6" width="4.5" height="22"/><path d="M-13 4L-3 -3L3 -1L14 -13M9 -13H14V-8"/>',
    briefcase: '<rect x="-16" y="-8" width="32" height="22" rx="2"/><path d="M-6 -8V-13H6V-8M-16 1H16"/><rect x="-3" y="-1" width="6" height="4" class="fillc"/>',
    kolam: gen.kolam(),
    reel: '<rect x="-9" y="-17" width="18" height="34" rx="3"/><path d="M-9 -11H9M-9 11H9"/><path d="M-3 -6L6 0L-3 6Z" class="fillc"/>',
    wave: gen.wave(),
    gamepad: '<path d="M-10 -8H10C16 -8 18 -2 18 4C18 10 15 13 12 13C9 13 7 9 5 7H-5C-7 9 -9 13 -12 13C-15 13 -18 10 -18 4C-18 -2 -16 -8 -10 -8Z"/><path d="M-11 -2V6M-15 2H-7"/><circle cx="8" cy="0" r="1.8" class="fillc"/><circle cx="12" cy="4" r="1.8" class="fillc"/>',
    map: '<path d="M-17 -12L-6 -16L6 -12L17 -16V12L6 16L-6 12L-17 16Z"/><path d="M-6 -16V12M6 -12V16" class="faint"/><path d="M-12 8Q-8 -2 0 2T9 -6" class="dash"/><path d="M8 -10L13 -5M13 -10L8 -5"/>',
    fort: '<path d="M-16 16V-2H-12V2H-8V-2H-4V2H4V-2H8V2H12V-2H16V16Z"/><path d="M-4 16V10A4 4 0 0 1 4 10V16M0 2V-17"/><path d="M0 -17L10 -14L0 -11Z" class="fillc"/>',
    magnifier: '<circle cx="-4" cy="-4" r="11"/><path d="M4 4L15 15" class="thick"/><path d="M-9 -3A5 5 0 0 1 1 -3M-11 1A7 7 0 0 1 3 1M-7 -7A3 3 0 0 1 -1 -7" class="faint"/>',
    lock: '<rect x="-12" y="-3" width="24" height="18" rx="2"/><path d="M-7 -3V-8A7 7 0 0 1 7 -8V-3"/><circle cx="-6" cy="6" r="1.8" class="fillc"/><circle cx="0" cy="6" r="1.8" class="fillc"/><circle cx="6" cy="6" r="1.8" class="fillc"/>',
    screen: '<rect x="-17" y="-15" width="34" height="22"/><path d="M0 7V13M-7 17L0 13L7 17"/><path d="M-11 2L-4 -4L1 0L10 -9"/>',
    pedestal: '<path d="M-10 16H10M-7 16V5H7V16"/><path d="M0 -16L9 -11V-1L0 4L-9 -1V-11Z"/><path d="M0 -6V4M0 -6L9 -11M0 -6L-9 -11" class="faint"/>'
  };
  const FRAMES = [
    () => poly(4, 47, -Math.PI / 2),
    () => poly(3, 52, -Math.PI / 2),
    () => '<circle cx="-15" r="33"/><circle cx="15" r="33"/>',
    () => '<circle r="44"/><circle cy="-44" r="3" class="fillc"/>',
    () => `<path d="${powerArc(44)}M0 -52V-30"/>`
  ];
  const FRAME_TURN = [90, 120, 180, 90, 360];
  const PICT_SCALE = [1.45, 1.2, 1.1, 1.6, 1.5];
  // pathLength="1" lets every stroke be drawn on with one CSS rule.
  const drawable = (svg) => svg.replace(/<(path|circle|rect|ellipse)\b([^>]*?)\/>/g, (m, tag, attrs) => (/fillc|"bb"|dash/.test(attrs) ? m : `<${tag}${attrs} pathLength="1"/>`));

  /**
   * An event's symbol. Read it like this:
   *   frame = track · ticks = one per hour it runs (dashed ring = TBA)
   *   dots  = team size (filled required, open optional) · centre = the challenge
   */
  function glyphSVG(ev) {
    const ai = AGE[ev.era].index;
    const hours = ev.hours ? clamp(Math.round(ev.hours), 1, 72) : 0;
    let ticks = '';
    if (hours) {
      for (let i = 0; i < hours; i++) {
        const a = -Math.PI / 2 + (i * TAU) / hours;
        const long = hours >= 12 ? i % 6 === 0 : i === 0;
        const r0 = long ? 51.5 : 53.5;
        ticks += `<path class="g-tick" style="--k:${i}" d="M${f2(Math.cos(a) * r0)} ${f2(Math.sin(a) * r0)}L${f2(Math.cos(a) * 58)} ${f2(Math.sin(a) * 58)}"/>`;
      }
    } else {
      ticks = '<circle r="55.5" class="g-tba" pathLength="1"/>';
    }
    const [need, max] = teamRange(ev.team);
    let dots = '';
    for (let k = 0; k < max; k++) dots += `<circle class="g-dot${k < need ? ' fillc' : ''}" style="--k:${k}" cx="${f2((k - (max - 1) / 2) * 8)}" cy="67" r="2.4"/>`;
    const sc = PICT_SCALE[ai];
    return `<svg class="glyph" viewBox="-60 -60 120 132" style="--r1:${FRAME_TURN[ai]}deg" aria-hidden="true">
      <g class="spin2"><circle r="58" class="bb"/>${ticks}</g>
      <g class="spin frame"><circle r="52" class="bb"/>${drawable(FRAMES[ai]())}</g>
      <g class="pict" transform="scale(${sc})" style="--sw:${(1.25 / sc).toFixed(3)}">${drawable(ICONS[ev.icon] || '')}</g>
      <g class="dots">${dots}</g></svg>`;
  }

  /* ------------------------------------------------------------------ *
   * Static bindings                                                    *
   * ------------------------------------------------------------------ */
  const bindings = { ...site, eventCount: D.events.length, trackCount, dayCount: days, dayWord: WORDS[days] || String(days) };
  $$('[data-bind]').forEach((el) => { const v = bindings[el.dataset.bind]; if (v != null) el.textContent = v; });

  const startMs = Date.parse(site.startsAt);
  const endMs = Date.parse(site.endsAt);
  $('#fDate').textContent = `${site.startsAt.slice(0, 16)}+05:30/P${days}D`;
  $('#isoDate').textContent = `${site.startsAt.slice(0, 10)}/${site.endsAt.slice(0, 10)}`;
  if (!site.scheduleIsProvisional) $('#provNote').remove();

  $$('[data-register]').forEach((a) => {
    if (site.registerUrl) { a.href = site.registerUrl; a.target = '_blank'; a.rel = 'noopener'; }
    else a.href = '#events';
  });

  const deck = $('#deckLink');
  if (site.partnerDeckUrl) { deck.href = site.partnerDeckUrl; deck.target = '_blank'; deck.rel = 'noopener'; }
  else {
    deck.textContent = 'Deck on request';
    deck.classList.remove('btn-gold');
    deck.setAttribute('aria-disabled', 'true');
    deck.addEventListener('click', (e) => e.preventDefault());
  }

  $$('[data-copy-email]').forEach((b) => b.addEventListener('click', () => {
    const done = () => toast('Email copied');
    const fail = () => {
      const el = $('.foot-mail .mono') || $('[data-bind="email"]');
      const r = document.createRange(); r.selectNodeContents(el);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      toast('Selected — press copy');
    };
    try { navigator.clipboard.writeText(site.email).then(done, fail); } catch (_) { fail(); }
  }));

  $('#socials').innerHTML = site.socials.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('');

  /* ------------------------------------------------------------------ *
   * Hero: wordmark, tracks, future layer                                *
   * ------------------------------------------------------------------ */
  const WORD = 'YUGANTRA';
  const wm = $('#wm');
  wm.innerHTML = [...WORD].map((ch, i) => `<span class="ch" data-ch="${ch}" style="--i:${i}">${ch}</span>`).join('');
  $('#fwm').innerHTML = [...WORD].map((ch) => `<span class="fch"><b>${ch}</b><i>${ch.charCodeAt(0).toString(2).padStart(8, '0')}</i></span>`).join('');

  $('#tracks').innerHTML = D.ages.map((a, i) => {
    const n = eventsOf(a.id).length;
    return `<li><button type="button" data-track="${a.id}" data-dial-track="${a.id}" aria-label="${esc(a.domain)}: ${n} events">${figSVG(i)}<span class="lg">${esc(a.domain)}</span><span class="sh">${esc(a.track)}</span><b>${n}</b></button></li>`;
  }).join('');
  $('#fTracks').textContent = `tracks = [${D.ages.map((a) => `${a.slug}:${eventsOf(a.id).length}`).join(', ')}]`;

  // Brahmi, the script Malayalam descends from, for the decode animation.
  const BRAHMI = [0x11005, 0x11006, 0x11007, 0x11009, 0x1100f].concat(Array.from({ length: 33 }, (_, i) => 0x11013 + i)).map((c) => String.fromCodePoint(c)).join('');
  const MALAYALAM = 'കഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹ';
  (() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=Noto+Sans+Brahmi&text=${encodeURIComponent(BRAHMI)}&display=swap`;
    document.head.appendChild(l);
  })();

  function decodeWordmark() {
    if (reduced) return;
    let pool = [...MALAYALAM, '0', '1', '0', '1'];
    try { if (document.fonts.check('40px "Noto Sans Brahmi"', [...BRAHMI][5])) pool = pool.concat([...BRAHMI]); } catch (_) { /* ignore */ }
    $$('.ch', wm).forEach((el, i) => {
      const final = el.dataset.ch;
      const total = 8 + i * 2;
      let n = 0;
      el.classList.add('scr');
      const tick = () => {
        n++;
        if (n >= total) { el.textContent = final; el.classList.remove('scr'); Sound.tick(900 + i * 90, 0.03, 0.03); return; }
        el.textContent = pool[(Math.random() * pool.length) | 0];
        setTimeout(tick, 42 + n * 4);
      };
      setTimeout(tick, 80 + i * 60);
    });
  }

  const heroMain = $('#heroMain');
  const heroFuture = $('#heroFuture');
  function syncFuture() {
    const host = heroMain.getBoundingClientRect();
    $$('[data-sync]', heroFuture).forEach((el) => {
      const src = document.getElementById(el.dataset.sync);
      const r = src.getBoundingClientRect();
      el.style.left = `${r.left - host.left}px`;
      el.style.top = `${r.top - host.top}px`;
      el.style.height = `${r.height}px`;
    });
  }

  /* ------------------------------------------------------------------ *
   * Countdown — Gregorian and traditional units, on rolling digits     *
   * ------------------------------------------------------------------ */
  const cdEls = Object.fromEntries($$('#countdown [data-k]').map((b) => [b.dataset.k, b]));
  const cdLast = {};
  function setCd(k, v) { if (cdLast[k] !== v) { cdLast[k] = v; odo(cdEls[k], v); } }
  function updateCountdown(now) {
    let target = startMs;
    let label = 'Until the next yuga';
    if (now >= startMs && now < endMs) { target = endMs; label = 'Yugantra is live · time left'; }
    else if (now >= endMs) { target = now; label = 'That age has ended. See you in the next.'; }
    if (cdLast.label !== label) { cdLast.label = label; $('#cdLabel').textContent = label; }
    const d = Math.max(0, target - now);
    const dd = Math.floor(d / 864e5);
    const rem = d - dd * 864e5;
    setCd('d', pad(dd));
    setCd('h', pad(Math.floor(rem / 36e5)));
    setCd('m', pad(Math.floor((rem % 36e5) / 6e4)));
    setCd('s', pad(Math.floor((rem % 6e4) / 1e3)));
    setCd('dv', pad(dd));
    setCd('gh', pad(Math.floor(rem / 1440000)));
    setCd('pa', pad(Math.floor((rem % 1440000) / 24000)));
    setCd('vp', pad(Math.floor((rem % 24000) / 400)));
  }
  function ghatiFraction(now) {
    const ist = now + IST_OFFSET;
    return ((((ist - 6 * 3600e3) % 864e5) + 864e5) % 864e5) / 864e5;
  }
  let lastGhatiText = '';
  function updateGhatiText(frac) {
    const g = frac * 60;
    const txt = `${Math.floor(g)} gh ${Math.floor((g % 1) * 60)} pa`;
    if (txt !== lastGhatiText) { lastGhatiText = txt; $('#ghatiNow').textContent = txt; }
  }

  /* ------------------------------------------------------------------ *
   * Marquee: the tagline, then the whole programme                      *
   * ------------------------------------------------------------------ */
  const mq = { a: $('#mqA'), b: $('#mqB'), wa: 0, wb: 0, xa: 0, xb: 0 };
  function buildMarquee() {
    const unitA = '<span class="mq-unit"><span class="o">Where tech defines the</span><span class="s" lang="ml">യുഗം</span><span class="sep"></span></span>';
    const items = D.events.map((e) => `<span>${esc(e.name)}${e.prize ? ` <b>${rupees(e.prize)}</b>` : ''}</span>`).join('');
    const unitB = `<span class="mq-unit">${items}<span><b>${trackCount}</b> tracks <b>${D.events.length}</b> events <b>1</b> new age</span></span>`;
    [[mq.a, unitA, 'wa'], [mq.b, unitB, 'wb']].forEach(([el, unit, key]) => {
      el.innerHTML = unit;
      const w = el.firstElementChild.getBoundingClientRect().width || 800;
      const copies = Math.ceil((innerWidth * 2) / w) + 1;
      el.innerHTML = unit.repeat(copies);
      mq[key] = w;
    });
  }

  /* ------------------------------------------------------------------ *
   * Lineage: one ancestor per track, each running live                  *
   * ------------------------------------------------------------------ */
  $$('.lin-track').forEach((b) => {
    const a = AGE[b.dataset.track];
    b.dataset.dialTrack = a.id;
    b.innerHTML = `${figSVG(a.index)}<span>${esc(a.domain)} · ${eventsOf(a.id).map((e) => esc(e.name)).join(', ')}</span><i aria-hidden="true">→</i>`;
  });

  const LAGHU = '<svg viewBox="0 0 22 12" aria-hidden="true"><path d="M3 2 Q11 15 19 2"/></svg>';
  const GURU = '<svg viewBox="0 0 22 12" aria-hidden="true"><path d="M2 7 H20"/></svg>';
  function knightsTour() {
    const moves = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
    const seen = new Set(['0,0']);
    const ok = (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8 && !seen.has(`${x},${y}`);
    const degree = (x, y) => moves.filter(([dx, dy]) => ok(x + dx, y + dy)).length;
    const path = [[0, 0]];
    let [x, y] = [0, 0];
    for (let s = 1; s < 64; s++) {
      let best = null, bd = 9;
      for (const [dx, dy] of moves) {
        const nx = x + dx, ny = y + dy;
        if (!ok(nx, ny)) continue;
        const dg = degree(nx, ny);
        if (dg < bd) { bd = dg; best = [nx, ny]; }
      }
      if (!best) break;
      [x, y] = best;
      seen.add(`${x},${y}`);
      path.push(best);
    }
    return path;
  }
  // Katapayadi, verified examples: the melakarta number of a raga from its first two syllables.
  const KATAPAYADI = [
    { word: 'Dheerasankarabharanam', syl: [['dhī', 9], ['ra', 2]], n: 29 },
    { word: 'Mechakalyani', syl: [['me', 5], ['ca', 6]], n: 65 }
  ];
  const pitch = D.events.find((e) => e.id === 'pitchathon');

  const readouts = {
    pingala: { el: $('#roPingala'), row: 3, every: 1100, t: 0,
      draw() {
        const n = this.row - 1;
        const syl = [0, 1, 2, 3].map((k) => (n >> k) & 1);
        const bin = n.toString(2).padStart(4, '0');
        this.el.innerHTML = `<span class="k">Four-syllable metre · row ${pad(this.row)} of 16</span>
          <div class="pg-marks">${syl.map((b) => `<span class="m">${b ? LAGHU : GURU}</span>`).join('')}</div>
          <div class="pg-bits">${syl.map((b) => `<span>${b}</span>`).join('')}</div>
          <span class="dim">heavy 0 · light 1 · read right to left: 0b${bin} + 1 = row ${this.row}</span>`;
      },
      step() { this.row = (this.row % 16) + 1; this.draw(); }
    },
    artha: { el: $('#roArtha'), t: 0, every: 70, phase: 0.4,
      draw() {
        const F = 12000, v = 80, p = Math.round(220 + 140 * Math.sin(this.phase));
        const be = Math.ceil(F / (p - v));
        const X = (u) => 8 + (u / 200) * 100, Y = (rs) => 64 - (rs / 60000) * 58;
        const bx = X(Math.min(be, 200)), by = Y(F + v * Math.min(be, 200));
        this.el.innerHTML = `<span class="k">Break-even, live${pitch ? ` · the maths behind every ${esc(pitch.name)}` : ''}</span>
          <svg class="be" viewBox="0 0 112 70" aria-hidden="true">
            <path d="M8 4V64H110" class="faint"/>
            <path d="M${X(0)} ${f2(Y(F))}L${X(200)} ${f2(Y(F + v * 200))}" class="cost"/>
            <path d="M${X(0)} ${Y(0)}L${X(200)} ${f2(Math.max(4, Y(p * 200)))}" class="rev"/>
            <circle cx="${f2(bx)}" cy="${f2(by)}" r="2.6" class="pt"/>
          </svg>
          <span>price ₹${p} · cost ₹${v}/unit · fixed ₹12,000 → <b class="ok">${be} units</b></span>`;
      },
      step() { this.phase += 0.045; this.draw(); }
    },
    chaturanga: { el: $('#roChaturanga'), i: 20, every: 420, t: 0, path: knightsTour(),
      draw() {
        const c = (v) => v * 10 + 5;
        const seen = this.path.slice(0, this.i + 1);
        const [kx, ky] = seen[seen.length - 1];
        let grid = '';
        for (let k = 1; k < 8; k++) grid += `M${k * 10} 0V80M0 ${k * 10}H80`;
        const trail = seen.slice(-6).map(([x, y]) => `${c(x)} ${c(y)}`).join('L');
        this.el.innerHTML = `<span class="k">Knight's tour on the ashtapada · move ${this.i + 1} of ${this.path.length}</span>
          <svg class="board" viewBox="-1 -1 82 82" aria-hidden="true">
            <rect x="0" y="0" width="80" height="80"/><path d="${grid}" class="faint"/>
            ${seen.slice(0, -1).map(([x, y]) => `<circle cx="${c(x)}" cy="${c(y)}" r="1.4" class="visited"/>`).join('')}
            <path d="M${trail}" class="trail"/>
            <circle cx="${c(kx)}" cy="${c(ky)}" r="3.6" class="knight"/>
          </svg>`;
      },
      step() { this.i = this.i >= this.path.length - 1 ? 0 : this.i + 1; this.draw(); }
    },
    katapayadi: { el: $('#roKatapayadi'), k: 0, s: 4, every: 750, t: 0,
      draw() {
        const ex = KATAPAYADI[this.k];
        const st = this.s;
        this.el.innerHTML = `<span class="k">Katapayadi · a raga's number from its name</span>
          <span class="kp-word">${esc(ex.word)}</span>
          <div class="kp-row">${ex.syl.map(([sy, d], i) => `<span class="kp-syl${st > i ? ' on' : ''}"><b>${sy}</b><i>${d}</i></span>`).join('<span class="kp-op">·</span>')}</div>
          <span class="${st > 2 ? 'line on' : 'line'}">read backwards → <b class="ok">${ex.n}</b>: melakarta raga no. ${ex.n}</span>`;
      },
      step() { this.s++; if (this.s > 5) { this.s = 0; this.k = (this.k + 1) % KATAPAYADI.length; } this.draw(); }
    },
    you: { el: $('#roYou'), i: 0, every: 45, t: 0,
      text: `> yugantra tracks\n${D.ages.map((a) => `${a.slug}(${eventsOf(a.id).length})`).join('  ')}\n> yugantra register --track=`,
      draw(all) {
        const s = all ? this.text : this.text.slice(0, this.i);
        this.el.innerHTML = `<span class="k">yugantra-cli · v${site.edition}</span><span class="tx">${esc(s)}<span class="cursor-blink"></span></span>`;
      },
      step() {
        this.i++;
        if (this.i > this.text.length + 60) this.i = 0;
        if (this.i <= this.text.length || this.i === 0) this.draw();
      }
    }
  };
  let originVisible = false;
  function initReadouts() {
    if (reduced) {
      readouts.pingala.row = 6; readouts.pingala.draw();
      readouts.artha.draw();
      readouts.chaturanga.i = readouts.chaturanga.path.length - 1; readouts.chaturanga.draw();
      readouts.katapayadi.draw();
      readouts.you.draw(true);
      return;
    }
    Object.values(readouts).forEach((r) => r.draw(r === readouts.you));
    new IntersectionObserver((entries) => { originVisible = entries.some((e) => e.isIntersecting); }, { rootMargin: '100px 0px' }).observe($('#origin'));
  }
  function tickReadouts(dtMs) {
    if (reduced || !originVisible) return;
    for (const r of Object.values(readouts)) {
      r.t += dtMs;
      if (r.t >= r.every) { r.t = 0; r.step(); }
    }
  }

  function renderStats() {
    const pwar = D.events.find((e) => /class(es)?\s*8/i.test(e.eligibility || ''));
    const stats = [
      { v: String(competitions.length), label: `competitions across ${trackCount} tracks` },
      { v: lakhText(confirmedPool), pre: '₹', suf: 'lakh+', label: 'in confirmed prize pools' },
      longest && { v: String(longest.hours), suf: 'h', label: `the longest event: ${longest.name}` },
      pwar && { v: '8', pre: 'Class ', label: `and up can compete, in ${pwar.name}` }
    ].filter(Boolean);
    $('#stats').innerHTML = stats.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${s.pre ? `<small class="pre">${s.pre}</small>` : ''}<span class="cnt"></span>${s.suf ? `<small>${s.suf}</small>` : ''}</dd></div>`).join('');
    $$('#stats .cnt').forEach((el, i) => odoOnView(el, stats[i].v));
  }

  /* ------------------------------------------------------------------ *
   * Tracks as ages                                                      *
   * ------------------------------------------------------------------ */
  const MAHAYUGA = D.ages.reduce((s, a) => s + a.years, 0);
  const cumYears = [];
  D.ages.reduce((s, a, i) => { cumYears[i] = s; return s + a.years; }, 0);
  function trackSummary(a) {
    const evs = eventsOf(a.id);
    const pool = evs.reduce((s, e) => s + (e.prize || 0), 0);
    if (pool) return `${evs.length} events · ${rupees(pool)} in prize pools`;
    return evs.map((e) => e.name).join(' · ');
  }
  function renderAges() {
    $('#agesStages').innerHTML = D.ages.map((a, i) => {
      const evs = eventsOf(a.id);
      return `<article class="stage${i === 0 ? ' on' : ''}" data-i="${i}">
        <div class="stage-num${a.count.length > 1 ? ' bin' : ''}" aria-hidden="true">${esc(a.count)}</div>
        <div class="stage-body">
          <p class="stage-kicker"><span class="ml" lang="ml">${esc(a.ml)}</span><span>${esc(a.alt)}</span><span>${a.years ? `${inr.format(a.years)} years` : `Year ${esc(site.edition)}`}</span></p>
          <h3 class="stage-name">${figSVG(i)}<span>${esc(a.domain)}</span></h3>
          <p class="stage-domain">${esc(trackSummary(a))}</p>
          <p class="stage-text">${esc(a.text)}</p>
          <ul class="stage-events" aria-label="Events in ${esc(a.domain)}">${evs.map((e) => `<li><button type="button" data-open="${e.id}" data-dial-ev="${e.id}">${esc(e.name)}${e.status === 'tbc' ? ' <em>TBC</em>' : ''}</button></li>`).join('')}</ul>
        </div>
      </article>`;
    }).join('');
    $('#timeline').innerHTML = D.ages.filter((a) => a.years).map((a, i) =>
      `<div class="tl-seg" data-i="${i}" data-dial-track="${a.id}" style="flex:${a.years}"><div class="tl-bar"><i></i></div><div class="tl-lab"><span><span class="nm">${esc(a.track)} </span>${esc(a.count)}</span><span class="yrs">${(a.years / 1e5).toFixed(2).replace(/\.?0+$/, '')} lakh yrs</span></div></div>`
    ).join('') + `<div class="tl-end" data-i="${D.ages.length - 1}">0|1</div>`;
  }
  const agesEl = $('#ages');
  let agesStage = -1;
  let agesState = { active: false, stage: 0, frac: 0, after: false };
  function updateAges(vh) {
    const r = agesEl.getBoundingClientRect();
    const span = Math.max(1, r.height - vh);
    const prog = clamp(-r.top / span, 0, 1);
    const q = prog * D.ages.length;
    const i = Math.min(D.ages.length - 1, Math.floor(q));
    const f = clamp(q - i, 0, 1);
    agesState = { active: r.top < vh * 0.5 && r.bottom > vh * 0.5, stage: i, frac: f, after: r.bottom <= vh * 0.5 };
    if (i !== agesStage) {
      $$('.stage', agesEl).forEach((s, j) => { s.classList.toggle('on', j === i); s.classList.toggle('past', j < i); });
      $$('.tl-seg, .tl-end', agesEl).forEach((s) => s.classList.toggle('on', Number(s.dataset.i) === i));
      if (agesStage >= 0 && agesState.active) Sound.tick(700 + i * 120, 0.06, 0.05);
      agesStage = i;
    }
    const num = $$('.stage-num', agesEl)[i];
    if (num) num.style.setProperty('--fill', `${(f * 100).toFixed(1)}%`);
    $$('.tl-seg', agesEl).forEach((s, j) => s.style.setProperty('--p', j < i ? 1 : j === i ? f : 0));
    const counter = $('#agesCounter');
    const label = $('#agesCounterLabel');
    if (i < D.ages.length - 1) {
      const left = Math.max(0, MAHAYUGA - (cumYears[i] + f * D.ages[i].years));
      counter.textContent = inr.format(Math.round(left));
      if (label.dataset.m !== 'y') { label.dataset.m = 'y'; label.textContent = 'Years left in this Mahayuga'; }
    } else {
      counter.textContent = f < 0.12 ? '0' : `${site.edition} CE`;
      if (label.dataset.m !== 'n') { label.dataset.m = 'n'; label.textContent = 'Mahayuga complete · the count restarts'; }
    }
  }

  /* ------------------------------------------------------------------ *
   * Events: heading, legend, cards (symbols draw themselves), filters  *
   * ------------------------------------------------------------------ */
  function footFor(ev) {
    if (ev.kind === 'competition') return `<span class="ev-prize"><small>Prize pool</small>${ev.prize ? rupees(ev.prize) : 'TBA'}</span>`;
    return `<span class="ev-prize"><small>${ev.kind === 'workshop' ? 'Learn' : 'Showcase'}</small>${esc(ev.fee === 'TBA' ? 'Details TBA' : ev.fee)}</span>`;
  }
  let setFilter = () => {};
  const drawIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const g = en.target;
      g.classList.remove('await');
      g.classList.add('draw');
      drawIO.unobserve(g);
    });
  }, { threshold: 0.35 });
  function drawOnView(scope) {
    if (reduced) return;
    const vh = innerHeight;
    $$('.glyph', scope).forEach((g) => {
      if (g.getBoundingClientRect().top < vh * 0.9) return; // visible at load: stays at rest
      g.classList.add('await');
      drawIO.observe(g);
    });
  }
  function redraw(g) {
    if (reduced || !g) return;
    g.classList.remove('draw', 'await');
    void g.getBoundingClientRect();
    g.classList.add('draw');
  }
  function renderEvents() {
    $('#eventsTitle').innerHTML = `<span class="n" data-v="${trackCount}"></span> tracks. <span class="n" data-v="${D.events.length}"></span> events. <span class="n" data-v="1"></span> new age.`;
    $$('#eventsTitle .n').forEach((el) => odoOnView(el, el.dataset.v));
    const tbc = D.events.filter((e) => e.status === 'tbc').length;
    $('#eventsLead').textContent = `${competitions.length} competitions, a masterclass and a student exhibition${tbc ? ` (${tbc} still to be confirmed)` : ''}. Every symbol tells you the track, how long it runs, the team size and the challenge.`;

    const sample = EVENTS.hackathon || D.events[0];
    const [need, max] = teamRange(sample.team);
    $('#legend').innerHTML = `
      <p class="lg-title">How to read a symbol</p>
      <div class="lg-item lg-frames"><div class="lg-figs">${D.ages.map((a, i) => `<span data-dial-track="${a.id}">${figSVG(i)}<i>${esc(a.track)}</i></span>`).join('')}</div><p><b>Frame</b> the track</p></div>
      <div class="lg-item"><svg class="lg-svg" viewBox="-30 -30 60 60" aria-hidden="true"><path d="${Array.from({ length: 12 }, (_, i) => { const a = -Math.PI / 2 + (i * TAU) / 12; return `M${f2(Math.cos(a) * 20)} ${f2(Math.sin(a) * 20)}L${f2(Math.cos(a) * 27)} ${f2(Math.sin(a) * 27)}`; }).join('')}"/><text y="4" text-anchor="middle">12h</text></svg><p><b>Ticks</b> one per hour it runs; a dashed ring means TBA</p></div>
      <div class="lg-item"><svg class="lg-svg lg-dots" viewBox="-30 -10 60 20" aria-hidden="true">${Array.from({ length: max }, (_, k) => `<circle cx="${(k - (max - 1) / 2) * 12}" r="3.6"${k < need ? ' class="fillc"' : ''}/>`).join('')}</svg><p><b>Dots</b> team size: filled required, open optional</p></div>
      <div class="lg-item"><svg class="lg-svg" viewBox="-22 -22 44 44" aria-hidden="true">${ICONS[sample.icon]}</svg><p><b>Centre</b> what you'll do (here: code)</p></div>`;

    $('#evGrid').innerHTML = D.events.map((ev) => `
      <button class="ev${ev.status === 'tbc' ? ' is-tbc' : ''}" type="button" data-open="${ev.id}" data-dial-ev="${ev.id}" data-era="${ev.era}" aria-haspopup="dialog" aria-label="${esc(ev.name)}, ${esc(AGE[ev.era].domain)} track${ev.status === 'tbc' ? ', to be confirmed' : ''}. Open details.">
        <span class="ev-top"><span class="era">${figSVG(AGE[ev.era].index)}${esc(AGE[ev.era].track)}</span><span>${ev.status === 'tbc' ? '<em class="tbc">To be confirmed</em>' : esc(whenLabel(ev))}</span></span>
        <span class="ev-glyph">${glyphSVG(ev)}</span>
        <span class="ev-name">${esc(ev.name)}</span>
        <span class="ev-format">${esc(ev.format)}</span>
        <span class="ev-foot">${footFor(ev)}<span class="ev-team">Team ${esc(ev.teamLabel)}<br>${esc(durShort(ev))}</span></span>
      </button>`).join('');
    drawOnView($('#evGrid'));

    const filters = [{ id: 'all', label: 'All', n: D.events.length, i: -1 }].concat(D.ages.map((a, i) => ({ id: a.id, label: a.domain, n: eventsOf(a.id).length, i })));
    const fh = $('#filters');
    fh.innerHTML = filters.map((f, k) => `<button type="button" data-filter="${f.id}"${f.i >= 0 ? ` data-dial-track="${f.id}"` : ''} aria-pressed="${k === 0}">${f.i >= 0 ? figSVG(f.i) : ''}<span class="lg">${esc(f.label)}</span><span class="sh">${esc(f.i >= 0 ? D.ages[f.i].track : f.label)}</span> <b>${f.n}</b></button>`).join('');
    setFilter = (id) => {
      $$('[data-filter]', fh).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.filter === id)));
      let k = 0;
      $$('.ev', $('#evGrid')).forEach((card) => {
        const show = id === 'all' || card.dataset.era === id;
        card.hidden = !show;
        card.classList.remove('enter');
        if (show && !reduced) {
          void card.offsetWidth;
          card.style.setProperty('--k', k++);
          card.classList.add('enter');
          redraw($('.glyph', card));
        }
      });
      Sound.tick(1300, 0.04, 0.04);
    };
    fh.addEventListener('click', (e) => { const b = e.target.closest('[data-filter]'); if (b) setFilter(b.dataset.filter); });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-track]');
    if (!b) return;
    setFilter(b.dataset.track);
    $('#events').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ------------------------------------------------------------------ *
   * Event dialog — the symbol flies out of wherever you clicked         *
   * ------------------------------------------------------------------ */
  const dlg = $('#evDialog');
  let dlgOrigin = null, dlgBusy = false;
  function flyRect(from) {
    if (!from) return null;
    if (typeof from === 'function') return flyRect(from());
    if (from instanceof DOMRect) return from;
    const g = from.querySelector?.('.ev-glyph') || from;
    const r = g.getBoundingClientRect();
    return r.width ? r : null;
  }
  function openEvent(id, from) {
    const ev = EVENTS[id];
    if (!ev || !dlg.showModal || dlg.open) return;
    const age = AGE[ev.era];
    const day = dayOf(ev.day);
    const whenTxt = ev.day === 0 ? 'Online' : `Day ${ev.day} · ${day ? weekday(day.date) : ''} · ${ev.time}${site.scheduleIsProvisional ? ' (provisional)' : ''}`;
    const gh = ev.day ? toGhati(ev.time) : '';
    $('#dlgGlyph').innerHTML = glyphSVG(ev);
    $('#dlgEra').textContent = `${age.domain} track · ${age.count} · ${age.alt}`;
    $('#dlgTitle').innerHTML = `${esc(ev.name)}${ev.status === 'tbc' ? ' <em class="tbc">To be confirmed</em>' : ''}`;
    $('#dlgMeaning').textContent = ev.format;
    $('#dlgBlurb').textContent = ev.blurb;
    const facts = [
      ['When', whenTxt + (gh ? ` · ${gh}` : '')],
      ['Duration', ev.duration],
      ['Where', ev.venue === 'TBA' ? 'To be announced' : ev.venue],
      ['Team', ev.teamLabel === 'TBA' ? 'To be announced' : ev.teamLabel],
      ['Entry fee', ev.fee === 'TBA' ? 'To be announced' : ev.fee],
      ['Prize pool', ev.prize ? `${prizeLabel(ev)}${ev.split ? ` (${rupees(ev.prize)})` : ''}` : (ev.kind === 'competition' ? 'To be announced' : '—')]
    ];
    $('#dlgFacts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    const inc = [ev.eligibility && `Open to: ${ev.eligibility}`, ev.partner && `With ${ev.partner}`, ev.food && `Food: ${ev.food}`, ev.goodies && `Goodies: ${ev.goodies}`].concat(ev.extras || []).filter(Boolean);
    $('#dlgH').hidden = !inc.length;
    $('#dlgRules').innerHTML = inc.map((r) => `<li>${esc(r)}</li>`).join('');
    const url = ev.registerUrl || site.registerUrl;
    $('#dlgCta').innerHTML = url
      ? `<a class="btn btn-gold" href="${esc(url)}" target="_blank" rel="noopener">Register for ${esc(ev.name)}</a>`
      : `<span class="btn" aria-disabled="true">Registration opens ${esc(site.registrationOpens)}</span><span class="note">Fees are paid at registration.</span>`;

    dlgOrigin = from || null;
    const a = flyRect(from);
    root.classList.add('dlg-open');
    dlg.classList.toggle('flying', !!a && !reduced);
    dlg.showModal();
    Sound.chime();
    $('#dlgClose').focus();
    if (a && !reduced) {
      const b = $('#dlgGlyph').getBoundingClientRect();
      const clone = document.createElement('div');
      clone.className = 'fly';
      clone.innerHTML = glyphSVG(ev);
      Object.assign(clone.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
      dlg.appendChild(clone);
      const landed = () => { clone.remove(); dlg.classList.remove('flying'); };
      clone.animate([
        { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})`, opacity: 0.7 },
        { transform: 'none', opacity: 1 }
      ], { duration: 640, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = landed;
      setTimeout(landed, 900);
    }
  }
  function closeEvent() {
    if (!dlg.open || dlgBusy) return;
    const a = flyRect(dlgOrigin);
    const done = () => { if (!dlg.open) return; dlgBusy = false; dlg.classList.remove('closing'); $$('.fly', dlg).forEach((f) => f.remove()); dlg.close(); root.classList.remove('dlg-open'); };
    if (!a || reduced || a.bottom < 0 || a.top > innerHeight) { done(); return; }
    dlgBusy = true;
    dlg.classList.add('closing');
    const b = $('#dlgGlyph').getBoundingClientRect();
    const clone = document.createElement('div');
    clone.className = 'fly';
    clone.innerHTML = $('#dlgGlyph').innerHTML;
    Object.assign(clone.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
    dlg.appendChild(clone);
    clone.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})`, opacity: 0.4 }
    ], { duration: 460, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }).onfinish = done;
    setTimeout(done, 700);
  }
  $('#dlgClose').addEventListener('click', closeEvent);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeEvent(); });
  dlg.addEventListener('close', () => { dlgBusy = false; dlg.classList.remove('closing', 'flying'); root.classList.remove('dlg-open'); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeEvent(); });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open]');
    if (t) { e.preventDefault(); openEvent(t.dataset.open, t); }
  });

  /* ------------------------------------------------------------------ *
   * Schedule — list per day, plus the whole fest as one ribbon          *
   * ------------------------------------------------------------------ */
  function slotHours(slot) {
    if (slot[5]) return slot[5];
    const ev = slot[4] && EVENTS[slot[4]];
    return (ev && ev.hours) || 1;
  }
  function renderSchedule() {
    const now = Date.now();
    const todayIdx = D.schedule.findIndex((d) => {
      const s = Date.parse(`${d.date}T00:00:00+05:30`);
      return now >= s && now < s + 864e5;
    });
    let sel = todayIdx >= 0 ? todayIdx : 0;
    const tabs = $('#dayTabs'), panels = $('#dayPanels');
    tabs.innerHTML = D.schedule.map((d, i) => `<button class="tab" type="button" role="tab" id="tab-${d.day}" aria-controls="panel-${d.day}" aria-selected="${i === sel}" tabindex="${i === sel ? 0 : -1}"><span class="d">Day ${d.day}</span><span class="w">${esc(weekday(d.date))}</span></button>`).join('');
    panels.innerHTML = D.schedule.map((d, i) => `<div role="tabpanel" id="panel-${d.day}" aria-labelledby="tab-${d.day}"${i === sel ? '' : ' hidden'}>
      <ol class="slots">${d.slots.map((slot) => {
        const [t, name, venue, era, evId] = slot;
        const start = Date.parse(`${d.date}T${t}:00+05:30`);
        const live = now >= start && now < start + slotHours(slot) * 3600e3;
        const a = AGE[era];
        const title = evId ? `<button type="button" class="slot-open" data-open="${evId}">${esc(name)}</button>` : esc(name);
        return `<li class="slot${live ? ' live' : ''}"${evId ? ` data-dial-ev="${evId}" data-ev="${evId}"` : ''}><time datetime="${d.date}T${t}+05:30">${t}</time><span class="gh">${toGhati(t)}</span><span class="nm">${title}</span><span class="vn">${esc(venue === 'TBA' ? 'Venue TBA' : venue)}</span><span class="era" title="${esc(a.domain)} track">${figSVG(a.index)}</span></li>`;
      }).join('')}</ol></div>`).join('');
    const select = (i, focus) => {
      sel = i;
      $$('.tab', tabs).forEach((t, j) => { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      $$('[role="tabpanel"]', panels).forEach((p, j) => { p.hidden = j !== i; });
      if (focus) $$('.tab', tabs)[i].focus();
    };
    tabs.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) select($$('.tab', tabs).indexOf(t)); });
    tabs.addEventListener('keydown', (e) => {
      const n = D.schedule.length;
      if (e.key === 'ArrowRight') { e.preventDefault(); select((sel + 1) % n, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select((sel - 1 + n) % n, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
    });
    renderRibbon();
  }
  function renderRibbon() {
    // Nights (00:00–08:00) are drawn at a quarter scale so the daytime sessions get the room.
    const NIGHT = 0.25, DAY_W = 8 * NIGHT + 16, TOTAL_W = days * DAY_W, total = days * 24;
    const X = (h) => { const d = Math.min(days - 1, Math.floor(h / 24)); const hod = h - d * 24; return d * DAY_W + (hod < 8 ? hod * NIGHT : 8 * NIGHT + (hod - 8)); };
    const pct = (h) => `${((X(h) / TOTAL_W) * 100).toFixed(3)}%`;
    const span = (a, b) => `${(((X(b) - X(a)) / TOTAL_W) * 100).toFixed(3)}%`;
    const rb = $('#ribbon');
    const px = Math.max(980, rb.getBoundingClientRect().width || 980) / TOTAL_W;
    const items = [];
    D.schedule.forEach((d) => d.slots.forEach((slot) => {
      const start = (d.day - 1) * 24 + toMinutes(slot[0]) / 60;
      items.push({ start, end: Math.min(total, start + slotHours(slot)), slot, d });
    }));
    items.sort((a, b) => a.start - b.start);
    const lanes = [];
    items.forEach((it) => {
      let l = lanes.findIndex((end) => end <= it.start + 0.01);
      if (l < 0) { l = lanes.length; lanes.push(0); }
      lanes[l] = it.end;
      it.lane = l;
    });
    let ticks = '';
    for (let d = 0; d < days; d++) {
      ticks += `<i class="rb-night" style="left:${pct(d * 24)};width:${span(d * 24, d * 24 + 8)}"><b>night</b></i>`;
      for (let hod = 8; hod < 24; hod += 2) ticks += `<i class="rb-t" style="left:${pct(d * 24 + hod)}"><b>${pad(hod)}</b></i>`;
    }
    const daysHtml = D.schedule.map((d, i) => `<span class="rb-day" style="left:${pct(i * 24)};width:${span(i * 24, i * 24 + 24)}">Day ${d.day} · ${esc(weekday(d.date))}</span>`).join('');
    const cam = Array.from({ length: total }, (_, h) => items.some((it) => it.start < h + 1 && it.end > h))
      .map((on, h) => `<i class="rb-cam${on ? ' on' : ''}" style="left:${pct(h)};width:${span(h, h + 1)}"></i>`).join('');
    const bars = items.map((it) => {
      const [t, name, , era, evId] = it.slot;
      const a = AGE[era];
      const tiny = (X(it.end) - X(it.start)) * px < 70 ? ' tiny' : '';
      const style = `left:${pct(it.start)};width:${span(it.start, it.end)};top:${34 + it.lane * 34}px`;
      const label = evId ? (EVENTS[evId].short || name) : name;
      const inner = `${figSVG(a.index)}<span>${esc(label)}</span>`;
      return evId
        ? `<button type="button" class="rb-bar${tiny}" style="${style}" data-open="${evId}" data-dial-ev="${evId}" data-ev="${evId}" title="${esc(name)} · Day ${it.d.day} ${t}" aria-label="${esc(name)}, Day ${it.d.day} ${t}">${inner}</button>`
        : `<span class="rb-bar plain${tiny}" style="${style}" title="${esc(name)} · Day ${it.d.day} ${t}">${inner}</span>`;
    }).join('');
    const now = Date.now();
    let nowHtml = '';
    if (now >= startMs && now < endMs) {
      const h = (now - Date.parse(`${D.schedule[0].date}T00:00:00+05:30`)) / 3600e3;
      if (h >= 0 && h <= total) nowHtml = `<i class="rb-now" style="left:${pct(h)}"><b>Now</b></i>`;
    } else if (now < startMs) {
      nowHtml = `<span class="rb-pre">Starts in ${Math.ceil((startMs - now) / 864e5)} days</span>`;
    }
    rb.style.height = `${34 + lanes.length * 34 + 30}px`;
    rb.innerHTML = `${daysHtml}${ticks}${cam}${bars}${nowHtml}`;
  }
  // Hovering anything tied to an event lights it up everywhere it appears.
  let litEv = null;
  function lightEvent(id) {
    if (id === litEv) return;
    if (litEv) $$(`[data-ev="${litEv}"]`).forEach((el) => el.classList.remove('lit'));
    litEv = id;
    if (id) $$(`[data-ev="${id}"]`).forEach((el) => el.classList.add('lit'));
  }

  /* ------------------------------------------------------------------ *
   * The Stage — band competition, with a seal to break                  *
   * ------------------------------------------------------------------ */
  function sealSVG(i, text, n) {
    return `<svg viewBox="-100 -100 200 200">
      <defs><path id="sealPath${i}" d="M0 -80 A80 80 0 1 1 0 80 A80 80 0 1 1 0 -80"/></defs>
      <g class="ring">
        <circle r="97" stroke-width="1"/><circle r="92" stroke-width="3" stroke-dasharray="0.8 5.2"/><circle r="64" stroke-width="1"/>
        <text><textPath href="#sealPath${i}" textLength="498" lengthAdjust="spacing">${esc(text)}</textPath></text>
      </g>
      <text class="n" text-anchor="middle" y="20">${esc(n)}</text>
    </svg>`;
  }
  function renderStage() {
    const ev = EVENTS.band;
    if (!ev) { $('#stage').remove(); return; }
    $('#stageLead').textContent = `${ev.blurb} Prizes: ${prizeLabel(ev)}. Entry ${ev.fee}.`;
    const plates = [
      { n: 'I', when: 'Round 1 · Online', title: 'Qualifiers', seal: 'ONLINE QUALIFIERS · BAND COMPETITION · YUGANTRA ·', body: `Entry ${ev.fee}. Team size to be announced.`, inside: 'Submit online' },
      { n: 'II', when: `Round 2 · Day ${ev.day} · ${ev.time}${site.scheduleIsProvisional ? ' (provisional)' : ''}`, title: 'Live finale', seal: 'FINALISTS SEALED UNTIL QUALIFIERS CLOSE · LIVE ·', body: `${prizeLabel(ev)} for first and second. ${(ev.extras || []).join('. ')}.`, inside: 'Finalists: after qualifiers' }
    ];
    $('#plates').innerHTML = plates.map((p, i) => `
      <article class="plate" data-reveal data-dial-ev="band" data-ev="band">
        <button class="seal" type="button" aria-label="Break the seal on ${esc(p.title)}">
          <span class="half l" aria-hidden="true">${sealSVG(`${i}l`, p.seal, p.n)}</span>
          <span class="half r" aria-hidden="true">${sealSVG(`${i}r`, p.seal, p.n)}</span>
          <span class="inside" aria-hidden="true">${esc(p.inside)}</span>
        </button>
        <div class="plate-body">
          <p class="eyebrow">${esc(p.when)}</p>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.body)}</p>
          <button class="btn btn-sm" type="button" data-open="band">Band Competition details</button>
        </div>
      </article>`).join('');
    $$('#plates .seal').forEach((b) => b.addEventListener('click', () => {
      const open = b.classList.toggle('cracked');
      if (open) Sound.crack(); else Sound.tick(500, 0.08, 0.05);
    }));
  }
  function renderPartners() {
    $('#assoc').innerHTML = (D.associations || []).map((a) => `<div class="assoc-card"><span class="k">In association with</span><b>${esc(a.name)}</b><span>${esc(a.full)}</span><i>${esc(a.role)}</i></div>`).join('');
    $('#tiers').innerHTML = D.partners.map((t) => {
      const cards = t.tier.startsWith('Track')
        ? D.ages.filter((a) => a.years).map((a) => `<div class="slot-card" data-dial-track="${a.id}">${figSVG(a.index)}<span>${esc(a.domain)}</span><i>open</i></div>`)
        : Array.from({ length: t.slots }, (_, i) => `<div class="slot-card${t.slots === 1 ? ' big' : ''}"><span>${t.slots === 1 ? esc(t.tier) : `Event slot ${i + 1}`}</span><i>open</i></div>`);
      return `<div class="tier" data-reveal><div><h3>${esc(t.tier)}</h3><p>${esc(t.note)}</p></div><div class="slots-grid">${cards.join('')}</div></div>`;
    }).join('');
  }
  function renderFaq() {
    $('#faqList').innerHTML = D.faq.map(([q, a]) => `<details><summary>${esc(q)}<span class="pm" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join('');
  }

  /* ------------------------------------------------------------------ *
   * Nav, menu, reveal                                                   *
   * ------------------------------------------------------------------ */
  const nav = $('#nav'), menu = $('#menu'), menuBtn = $('#menuBtn');
  let menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    root.classList.toggle('lock', open);
    nav.classList.remove('hide');
    if (open) $('a', menu).focus();
  }
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });

  const navLinks = $$('.nav-links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['top', 'origin', 'ages', 'events', 'schedule', 'stage', 'partners', 'faq'].forEach((id) => { const el = document.getElementById(id); if (el) sectionIO.observe(el); });

  function initReveal() {
    const vh = innerHeight;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal]').forEach((el) => {
      if (reduced) return;
      if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('pre'); io.observe(el); }
    });
  }

  /* ------------------------------------------------------------------ *
   * The dial — the fest as one instrument                              *
   * ------------------------------------------------------------------ */
  function dialData() {
    const events = DIAL_EVENTS.map((e) => ({ id: e.id, name: e.name, short: e.short, day: e.day, prize: e.prize || 0, kind: e.kind }));
    const tracks = [];
    let i = 0;
    D.ages.forEach((a, k) => {
      const n = eventsOf(a.id).length;
      if (n) tracks.push({ label: a.track, slug: a.slug, count: a.count, kind: k, from: i, to: i + n - 1 });
      i += n;
    });
    const slots = [];
    D.schedule.forEach((d) => d.slots.forEach((slot) => {
      slots.push({ day: d.day, minutes: toMinutes(slot[0]), duration: Math.round(slotHours(slot) * 60) });
    }));
    const activity = Array.from({ length: days * 24 }, (_, h) => slots.some((s) => {
      const a0 = (s.day - 1) * 1440 + s.minutes;
      return a0 < (h + 1) * 60 && a0 + s.duration > h * 60;
    }));
    const ml = window.YugantraDial.mlNum;
    const bits = [...WORD].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    return {
      events, tracks, slots, activity, days,
      maxPrize: Math.max(1, ...events.map((e) => e.prize)),
      ringAncient: [
        { text: `YUGANTRA ${site.edition}` }, { sep: true },
        { text: 'WHERE TECH DEFINES THE' }, { text: 'യുഗം', ml: true }, { sep: true },
        { text: site.dateLabel.toUpperCase() }, { sep: true },
        { text: 'KOLLAM ERA' }, { text: ml(site.kollamEra), ml: true }, { sep: true },
        { text: `${D.events.length} EVENTS · ${trackCount} TRACKS` }, { sep: true },
        { text: `${lakhText(confirmedPool)} LAKH+ IN PRIZES` }, { sep: true }
      ],
      ringFuture: [
        { text: bits }, { sep: true },
        { text: `${site.startsAt.slice(0, 16)}+05:30/P${days}D` }, { sep: true },
        { text: `events=${D.events.length}` }, { sep: true },
        { text: `prize_pool>=${confirmedPool}` }, { sep: true }
      ]
    };
  }

  const canvas = $('#dial');
  let dial = null;
  try { dial = window.YugantraDial && window.YugantraDial.create(canvas); } catch (err) { console.warn('[yugantra] dial disabled:', err); dial = null; }
  if (dial) root.classList.add('webgl');

  let W = innerWidth, H = innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, fine ? 1.75 : 1.5);
  const perf = { acc: 0, n: 0 };
  function resize() {
    W = innerWidth; H = innerHeight;
    if (dial) dial.resize(W, H, dpr);
    syncFuture();
    buildMarquee();
  }
  const fontsReady = Promise.race([
    Promise.all([
      document.fonts.load('600 40px "Noto Serif Malayalam"', '൧൨യുഗാന്ത്ര'),
      document.fonts.load('400 40px "DM Mono"', '0x01'),
      document.fonts.load('400 40px "Marcellus"', 'YUGANTRA'),
      document.fonts.load('800 40px "Baloo Chettan 2"', 'യുഗം'),
      document.fonts.load('400 20px "Jost"', 'Where')
    ]),
    new Promise((r) => setTimeout(r, 2600))
  ]).catch(() => {});
  let texReady = false;
  if (dial) {
    fontsReady.then(() => {
      const big = Math.max(W, H) * dpr > 1500;
      try { dial.paint(big ? 2048 : 1024, dialData()); texReady = true; } catch (err) { console.warn('[yugantra] texture paint failed:', err); }
    });
  }
  fontsReady.then(() => { syncFuture(); buildMarquee(); });

  const EMERALD = [0.086, 0.188, 0.169], BURGUNDY = [0.224, 0.02, 0.09], BRONZE = [0.373, 0.318, 0.239];
  const AGE_TINT = [EMERALD, [0.2, 0.19, 0.15], [0.12, 0.2, 0.16], BURGUNDY, BRONZE];
  const SECTIONS = ['top', 'origin', 'ages', 'events', 'schedule', 'stage', 'partners', 'faq', 'contact'].map((id) => ({ id, el: document.getElementById(id), cover: 0 }));
  const dialSlot = $('#dialSlot');
  function targetFor(id, w, h) {
    const portrait = w < h * 0.9;
    switch (id) {
      case 'top': return portrait ? { x: w * 0.5, y: h * 0.27, r: Math.min(w * 0.6, h * 0.3), o: 1, t: EMERALD } : { x: w * 0.71, y: h * 0.5, r: h * 0.62, o: 1, t: EMERALD };
      case 'origin': return portrait ? { x: w * 0.5, y: h * 0.5, r: h * 0.55, o: 0.12, t: EMERALD } : { x: w * 0.9, y: h * 0.5, r: h * 0.62, o: 0.2, t: EMERALD };
      case 'ages': {
        const tint = AGE_TINT[agesState.stage] || EMERALD;
        if (portrait) return { x: w * 0.5, y: h * 0.31, r: Math.min(w * 0.42, h * 0.18), o: 1, t: tint };
        const r = Math.min(h * 0.36, w * 0.24);
        return { x: w - r * 1.05 - w * 0.03, y: h * 0.5, r, o: 1, t: tint };
      }
      case 'events': {
        const s = dialSlot.getBoundingClientRect();
        if (s.width > 40) return { x: s.left + s.width / 2, y: s.top + s.height / 2, r: (s.width / 2) * 0.97, o: 1, t: EMERALD };
        return { x: w * 0.5, y: h * 0.5, r: Math.max(w, h) * 0.85, o: 0.06, t: EMERALD };
      }
      case 'schedule': return portrait ? { x: w * 0.5, y: h * 0.2, r: w * 0.7, o: 0.1, t: EMERALD } : { x: w * 0.04, y: h * 0.55, r: h * 0.7, o: 0.14, t: EMERALD };
      case 'stage': return { x: w * 0.5, y: h * 0.55, r: Math.min(w, h) * 0.5, o: 0.22, t: BURGUNDY };
      case 'partners': return { x: w * 0.92, y: h * 0.3, r: h * 0.55, o: 0.14, t: EMERALD };
      case 'faq': return { x: w * 0.1, y: h * 0.62, r: h * 0.48, o: 0.12, t: EMERALD };
      default: return { x: w * 0.5, y: h * 1.02, r: Math.min(w, h) * 0.6, o: 0.4, t: BRONZE };
    }
  }

  const cur = { x: 0, y: 0, r: 0, o: 1, t: EMERALD.slice(), light: -0.6 };
  let first = true;
  const acc = { centre: 0, rim: 0 }, spinTo = { centre: 4, wheel: -7, rim: 3 };
  const rot = [0, 0, 0, 0, 0, 0];
  let held = heldEvent(Date.now()), heldAt = 0;
  const wheelFor = (a, b) => -((a + b + 1) / 2) * DIAL_STEP;
  let wheelBase = wheelFor(held.i, held.i), wheelTarget = wheelBase, lastMarkerSector = -1;
  const shape = { a: AGE[DIAL_EVENTS[held.i].era].index, b: AGE[DIAL_EVENTS[held.i].era].index, mix: 1 };
  function setShape(k) {
    if (k === shape.b) return;
    shape.a = shape.mix > 0.5 ? shape.b : shape.a;
    shape.b = k;
    shape.mix = 0;
  }
  let explode = 0, bootV = dial ? 0 : 1, introScale = 1;

  /* what the dial is holding, and why — shown under the docked dial */
  let capKey = '';
  function updateCaption(kind, i) {
    const key = `${kind}:${i}:${held.live}`;
    if (key === capKey) return;
    capKey = key;
    const cap = $('#slotCap');
    if (kind === 'track') {
      const a = D.ages[i];
      cap.innerHTML = `${figSVG(i)}<span><b>${esc(a.domain)}</b> · ${eventsOf(a.id).length} events</span>`;
    } else {
      const ev = DIAL_EVENTS[i], a = AGE[ev.era];
      const lead = kind === 'held' ? (held.live ? 'Live now' : 'Next up') : a.domain;
      cap.innerHTML = `${figSVG(a.index)}<span>${esc(lead)} · <b>${esc(ev.name)}</b> · ${esc(whenLabel(ev))}</span>`;
    }
  }
  let lastHeldText = '';
  function updateHeldText() {
    const ev = DIAL_EVENTS[held.i];
    const txt = `${held.live ? 'Live now' : 'Next up'}: ${ev.name} · ${fmtWhen(DIAL_TIMES[held.i].start)}${site.scheduleIsProvisional ? ' (provisional)' : ''}`;
    if (txt !== lastHeldText) { lastHeldText = txt; $('#nextUp').textContent = txt; }
  }

  /* anything on the page can take hold of the dial */
  let pageFocus = null, pfTimer = 0;
  function focusFrom(el) {
    if (!el) return null;
    if (el.dataset.dialEv && DIAL_INDEX[el.dataset.dialEv] != null) return { ev: DIAL_INDEX[el.dataset.dialEv], id: el.dataset.dialEv };
    if (el.dataset.dialTrack && AGE[el.dataset.dialTrack]) return { track: AGE[el.dataset.dialTrack].index };
    return null;
  }
  function onFocusTarget(target) {
    const el = target && target.closest ? target.closest('[data-dial-ev], [data-dial-track]') : null;
    const f = focusFrom(el);
    clearTimeout(pfTimer);
    if (f) {
      pageFocus = f;
      lightEvent(f.id || null);
    } else {
      pfTimer = setTimeout(() => { pageFocus = null; lightEvent(null); }, 260);
    }
  }
  document.addEventListener('pointerover', (e) => { if (e.pointerType !== 'touch') onFocusTarget(e.target); });
  document.addEventListener('focusin', (e) => onFocusTarget(e.target));

  /* lens + dial hit-testing */
  const hero = $('#top');
  const ring = $('#lensRing');
  const tip = $('#dialTip');
  const lens = { x: W * 0.35, y: H * 0.45, tx: W * 0.35, ty: H * 0.45, r: 0, size: 0 };
  const pointer = { x: W * 0.6, y: H * 0.3, inHero: false, seen: false, lastTouch: -99, overUI: false, overSlot: false };
  let hoverIdx = -1;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
  }, { passive: true });
  hero.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') pointer.inHero = true; });
  hero.addEventListener('pointerleave', () => { pointer.inHero = false; });
  hero.addEventListener('pointerover', (e) => { pointer.overUI = !!e.target.closest('a, button, .countdown'); });
  const touchLens = (e) => { const t0 = e.touches[0]; if (!t0) return; lens.tx = t0.clientX; lens.ty = t0.clientY; pointer.lastTouch = clock; };
  hero.addEventListener('touchstart', touchLens, { passive: true });
  hero.addEventListener('touchmove', touchLens, { passive: true });

  function hitTest(x, y) {
    if (!dial || !texReady || explode > 0.05 || bootV < 1) return -1;
    const R = cur.r * introScale;
    const px = (x - cur.x) / R, py = (y - cur.y) / R;
    const r = Math.hypot(px, py);
    if (!((r > 0.2 && r < 0.53) || (r > 0.7 && r < 0.86))) return -1;
    let a = Math.atan2(py, px) - rot[1] + Math.PI / 2;
    a = ((a % TAU) + TAU) % TAU;
    return Math.floor(a / DIAL_STEP) % DIAL_EVENTS.length;
  }
  /** Screen rect of an event's sector on the dial, for the fly-out and fly-back. */
  function sectorRect(i) {
    const R = cur.r * introScale;
    const a = -Math.PI / 2 + (i + 0.5) * DIAL_STEP + rot[1];
    const x = cur.x + Math.cos(a) * R * 0.445, y = cur.y + Math.sin(a) * R * 0.445;
    const s = Math.max(28, R * 0.14);
    return new DOMRect(x - s / 2, y - s / 2, s, s * 1.1);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, [data-open]')) return;
    const inDial = e.target.closest('#top') || e.target.closest('#dialSlot');
    if (!inDial) return;
    const i = hitTest(e.clientX, e.clientY);
    if (i >= 0) openEvent(DIAL_EVENTS[i].id, () => sectorRect(i));
  });
  let tipFor = -1;
  function updateHover() {
    const overDial = (pointer.inHero && !pointer.overUI) || pointer.overSlot;
    const next = fine && ready && overDial ? hitTest(pointer.x, pointer.y) : -1;
    if (next !== hoverIdx && next >= 0) Sound.tick(2400, 0.02, 0.03);
    hoverIdx = next;
    root.classList.toggle('on-sector', next >= 0);
    if (next < 0) { if (!tip.hidden) tip.hidden = true; tipFor = -1; return; }
    if (tipFor !== next) {
      const ev = DIAL_EVENTS[next], a = AGE[ev.era];
      tip.innerHTML = `<span class="tt-k">${figSVG(a.index)}${esc(a.domain)}</span><b>${esc(ev.name)}</b><span>${esc(ev.format)} · ${esc(whenLabel(ev))}</span><span class="tt-v">${ev.prize ? `${rupees(ev.prize)} prize pool` : esc(ev.fee === 'TBA' ? 'Details TBA' : ev.fee)} · click to open</span>`;
      tipFor = next;
    }
    tip.hidden = false;
    const tx = Math.min(pointer.x + 18, W - tip.offsetWidth - 12);
    const ty = Math.min(pointer.y + 18, H - tip.offsetHeight - 12);
    tip.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }

  /* device tilt (phones) moves the light and the lens */
  const tilt = { x: 0, y: 0, on: false };
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    tilt.on = true;
    tilt.x = clamp(e.gamma / 35, -1, 1);
    tilt.y = clamp((e.beta - 45) / 35, -1, 1);
  }, { passive: true });
  document.addEventListener('touchend', () => {
    try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (_) { /* ignore */ }
  }, { once: true });

  function updateLens(dt) {
    const hr = hero.getBoundingClientRect();
    const visible = hr.bottom > 120 && ready && explode < 0.05;
    const base = fine ? clamp(W * 0.1, 104, 172) : clamp(W * 0.19, 64, 96);
    let target = 0;
    if (visible) {
      if (fine && pointer.inHero) { lens.tx = pointer.x; lens.ty = pointer.y; target = base; }
      else if (!fine && !reduced) {
        if (clock - pointer.lastTouch > 2.6) {
          const wr = wm.getBoundingClientRect();
          lens.tx = wr.left + wr.width * (0.5 + 0.4 * Math.sin(clock * 0.42) + (tilt.on ? tilt.x * 0.3 : 0));
          lens.ty = wr.top + wr.height * (0.55 + 0.35 * Math.sin(clock * 0.83) + (tilt.on ? tilt.y * 0.4 : 0));
        }
        target = base;
      }
    }
    if (lens.r < 0.5 && target > 0) { lens.x = lens.tx; lens.y = lens.ty; }
    lens.x = damp(lens.x, lens.tx, 16, dt);
    lens.y = damp(lens.y, lens.ty, 16, dt);
    lens.r = damp(lens.r, target, target ? 9 : 12, dt);
    if (lens.r < 0.4 || hr.bottom < 0) lens.r = 0;
    const mr = heroMain.getBoundingClientRect();
    heroMain.style.setProperty('--lx', `${(lens.x - mr.left).toFixed(1)}px`);
    heroMain.style.setProperty('--ly', `${(lens.y - mr.top).toFixed(1)}px`);
    heroMain.style.setProperty('--lr', `${lens.r.toFixed(1)}px`);
    const size = (lens.r / 86) * 200;
    if (Math.abs(size - lens.size) > 0.25) { lens.size = size; ring.style.width = ring.style.height = `${size.toFixed(1)}px`; }
    ring.style.transform = `translate3d(${(lens.x - size / 2).toFixed(1)}px, ${(lens.y - size / 2).toFixed(1)}px, 0)`;
    ring.style.opacity = clamp(lens.r / 40, 0, 1).toFixed(3);
  }

  /* custom cursor: a gold ring that shows the track of whatever you point at */
  const cursor = $('#cursor'), cursorFig = $('#cursorFig');
  const cz = { x: -100, y: -100, figKey: '' };
  function updateCursor(dt) {
    const on = fine && !reduced && pointer.seen;
    root.classList.toggle('cursor-on', on);
    if (!on) return;
    cz.x = damp(cz.x, pointer.x, 22, dt);
    cz.y = damp(cz.y, pointer.y, 22, dt);
    let fig = -1;
    if (hoverIdx >= 0) fig = AGE[DIAL_EVENTS[hoverIdx].era].index;
    else if (pageFocus) fig = pageFocus.track != null ? pageFocus.track : AGE[DIAL_EVENTS[pageFocus.ev].era].index;
    const key = String(fig);
    if (key !== cz.figKey) { cz.figKey = key; cursorFig.innerHTML = fig >= 0 ? figSVG(fig) : ''; }
    cursor.classList.toggle('has-fig', fig >= 0);
    cursor.classList.toggle('lensing', lens.r > 20);
    cursor.style.transform = `translate3d(${cz.x.toFixed(1)}px, ${cz.y.toFixed(1)}px, 0)`;
  }
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('on-link', !!e.target.closest('a, button, summary, [data-open], .rb-bar, .tab'));
  });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('gone'));
  document.documentElement.addEventListener('pointerenter', () => cursor.classList.remove('gone'));

  /* footer spotlight */
  const bigmark = $('#bigmark');
  function updateSpot() {
    const r = bigmark.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    let mx, my;
    if (fine && pointer.seen && pointer.y > r.top - 200) { mx = ((pointer.x - r.left) / r.width) * 100; my = ((pointer.y - r.top) / r.height) * 100; }
    else { mx = 50 + 42 * Math.sin(clock * 0.45) + (tilt.on ? tilt.x * 30 : 0); my = 50 + 20 * Math.sin(clock * 0.7); }
    bigmark.style.setProperty('--mx', `${mx.toFixed(1)}%`);
    bigmark.style.setProperty('--my', `${my.toFixed(1)}%`);
  }

  /* ------------------------------------------------------------------ *
   * Boot: the dial assembles ring by ring while the log reads the data *
   * ------------------------------------------------------------------ */
  let ready = false, readyAt = 0, clock = 0;
  function onReady() {
    if (ready) return;
    ready = true;
    readyAt = clock;
    root.classList.add('ready');
    decodeWordmark();
    const m = /^#ev-([\w-]+)$/.exec(location.hash);
    if (m && EVENTS[m[1]]) setTimeout(() => openEvent(m[1]), 400);
  }
  const BOOT_LINES = [
    '> yugantra --boot ' + site.edition,
    `tracks ........ ${trackCount} + ${D.ages.length - trackCount} showcase`,
    `events ........ ${D.events.length}`,
    `schedule ...... ${days} days · ${slotCount} slots`,
    `prizes ........ ₹${lakhText(confirmedPool)} lakh+ confirmed`,
    `identity ...... YUGANTRA ${site.edition}`,
    'ready · where tech defines the യുഗം'
  ];
  function runIntro() {
    const el = $('#intro');
    const skip = reduced || navigator.webdriver || !el || !dial;
    if (skip) { el && el.remove(); bootV = 1; onReady(); return; }
    root.classList.add('booting');
    const log = $('#bootLog'), num = $('#introNum'), lab = $('#introLabel');
    let shown = 0, done = false, t0 = 0, lastBand = -1;
    const showLines = (n) => {
      if (n <= shown) return;
      shown = n;
      log.textContent = BOOT_LINES.slice(0, n).join('\n');
    };
    showLines(1);
    const finish = () => {
      if (done) return;
      done = true;
      bootV = 1;
      showLines(BOOT_LINES.length);
      num.textContent = site.edition;
      lab.textContent = `${site.name} · ${site.kind.toLowerCase()} · ${site.dateLabel}`;
      el.classList.add('flip');
      setTimeout(() => {
        el.classList.add('out');
        root.classList.remove('booting');
        onReady();
        setTimeout(() => el.remove(), 1000);
      }, 520);
    };
    const DUR = 2600;
    const frame = (now) => {
      if (done) return;
      if (!texReady && performance.now() < 3400) { requestAnimationFrame(frame); return; }
      if (!t0) t0 = now;
      const k = clamp((now - t0) / DUR, 0, 1);
      bootV = k;
      num.textContent = inr.format(Math.round(MAHAYUGA * Math.pow(1 - k, 2)));
      const band = Math.floor(k * 6.6 - 1);
      if (band !== lastBand && band >= 0) { lastBand = band; Sound.tick(1000 + band * 180, 0.05, 0.05); }
      showLines(1 + clamp(band + 1, 0, 5));
      if (k < 1) requestAnimationFrame(frame); else finish();
    };
    requestAnimationFrame(frame);
    $('#bootSkip').addEventListener('click', finish);
    el.addEventListener('click', finish);
    addEventListener('keydown', finish, { once: true });
  }

  /* ------------------------------------------------------------------ *
   * Main loop                                                           *
   * ------------------------------------------------------------------ */
  const veil = $('#veil');
  let last = performance.now();
  let lastY = scrollY, vel = 0, dir = 1, lastCd = 0;
  function loop(now) {
    const dtRaw = (now - last) / 1000;
    const dt = Math.min(0.05, Math.max(0.0001, dtRaw));
    last = now;
    clock += dt;
    const y = scrollY;

    const dy = y - lastY;
    vel = damp(vel, dy / dt, 8, dt);
    if (Math.abs(dy) > 0.5) dir = dy > 0 ? 1 : -1;
    nav.classList.toggle('scrolled', y > 40);
    if (!menuOpen) {
      if (dy > 3 && y > 480) nav.classList.add('hide');
      else if (dy < -3 || y < 480) nav.classList.remove('hide');
    }
    lastY = y;
    const docH = document.documentElement.scrollHeight - H;
    $('#navProgress').style.transform = `scaleX(${docH > 0 ? clamp(y / docH, 0, 1).toFixed(4) : 0})`;

    const wall = Date.now();
    if (wall - lastCd > 100) { lastCd = wall; updateCountdown(wall); updateGhatiText(ghatiFraction(wall)); }

    updateAges(H);
    tickReadouts(dt * 1000);
    updateSpot();

    if (mq.wa && !reduced) {
      const sp = 46 + Math.min(1600, Math.abs(vel)) * 0.35;
      mq.xa = (((mq.xa + dir * sp * dt) % mq.wa) + mq.wa) % mq.wa;
      mq.xb = (((mq.xb - dir * sp * 0.6 * dt) % mq.wb) + mq.wb) % mq.wb;
      mq.a.style.transform = `translate3d(${-mq.xa.toFixed(1)}px,0,0)`;
      mq.b.style.transform = `translate3d(${-mq.xb.toFixed(1)}px,0,0)`;
    }
    wm.style.setProperty('--sheen', clamp(pointer.x / W, 0, 1).toFixed(3));

    // section coverage drives the dial's position and the night veil
    let sw = 0; const tg = { x: 0, y: 0, r: 0, o: 0, t: [0, 0, 0] };
    for (const s of SECTIONS) {
      s.cover = 0;
      if (!s.el) continue;
      const r = s.el.getBoundingClientRect();
      const cv = Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0)) / H;
      s.cover = cv;
      if (cv <= 0) continue;
      const t = targetFor(s.id, W, H);
      tg.x += t.x * cv; tg.y += t.y * cv; tg.r += t.r * cv; tg.o += t.o * cv;
      tg.t[0] += t.t[0] * cv; tg.t[1] += t.t[1] * cv; tg.t[2] += t.t[2] * cv;
      sw += cv;
    }
    const cover = Object.fromEntries(SECTIONS.map((s) => [s.id, s.cover]));
    veil.style.opacity = (clamp(cover.stage || 0, 0, 1) * 0.9).toFixed(3);

    const slotR = dialSlot.getBoundingClientRect();
    pointer.overSlot = slotR.width > 40 && pointer.x > slotR.left && pointer.x < slotR.right && pointer.y > slotR.top && pointer.y < slotR.bottom;

    if (dial) {
      if (sw > 0) { tg.x /= sw; tg.y /= sw; tg.r /= sw; tg.o /= sw; tg.t = tg.t.map((v) => v / sw); }
      else Object.assign(tg, targetFor('top', W, H));
      if (root.classList.contains('booting')) Object.assign(tg, { x: W * 0.5, y: H * 0.45, r: Math.min(W, H) * 0.34, o: 1, t: EMERALD });

      const snap = clamp(cover.events || 0, 0, 1);
      const lam = first ? 1e3 : 5 + 14 * snap * snap;
      cur.x = damp(cur.x, tg.x, lam, dt); cur.y = damp(cur.y, tg.y, lam, dt);
      cur.r = damp(cur.r, tg.r, lam, dt); cur.o = damp(cur.o, tg.o, lam, dt);
      for (let k = 0; k < 3; k++) cur.t[k] = damp(cur.t[k], tg.t[k], 3, dt);
      first = false;

      // exploded view while the hero hands over to the next section
      const s = y / Math.max(1, hero.offsetHeight);
      const eTarget = reduced || bootV < 1 ? 0 : Math.pow(Math.sin(clamp(s / 1.25, 0, 1) * Math.PI), 1.3);
      explode = damp(explode, eTarget, 8, dt);

      // what the wheel holds: pointer on the dial > anything pointed at on the page > the track being read > live / next event
      if (wall - heldAt > 1000) { held = heldEvent(wall); heldAt = wall; updateHeldText(); }
      introScale = reduced ? 1 : ready ? 1 - 0.1 * Math.exp(-2.6 * (clock - readyAt)) : 1;
      updateHover();
      let fa = held.i, fb = held.i, figure = AGE[DIAL_EVENTS[held.i].era].index, amt = 0.75, capKind = 'held', capI = held.i, turn = true;
      if (agesState.active && TRACK_RANGE[agesState.stage]) {
        [fa, fb] = TRACK_RANGE[agesState.stage]; figure = agesState.stage; capKind = 'track'; capI = agesState.stage;
      }
      if (pageFocus) {
        if (pageFocus.track != null && TRACK_RANGE[pageFocus.track]) { [fa, fb] = TRACK_RANGE[pageFocus.track]; figure = pageFocus.track; capKind = 'track'; capI = pageFocus.track; }
        else if (pageFocus.ev != null) { fa = fb = pageFocus.ev; figure = AGE[DIAL_EVENTS[pageFocus.ev].era].index; capKind = 'ev'; capI = pageFocus.ev; }
        amt = 1;
      }
      if (hoverIdx >= 0) { fa = fb = hoverIdx; figure = AGE[DIAL_EVENTS[hoverIdx].era].index; amt = 1; turn = false; capKind = 'ev'; capI = hoverIdx; }
      if (turn) { const t = wheelFor(fa, fb); wheelTarget = t + TAU * Math.round((wheelBase - t) / TAU); }
      setShape(figure);
      updateCaption(capKind, capI);
      shape.mix = reduced ? 1 : Math.min(1, shape.mix + dt / 0.55);
      wheelBase = damp(wheelBase, wheelTarget, reduced ? 50 : 3.2, dt);

      const lt = tilt.on && !fine ? Math.atan2(tilt.y, tilt.x) : fine && pointer.seen ? Math.atan2(pointer.y - cur.y, pointer.x - cur.x) : clock * 0.18;
      let dl = lt - cur.light;
      dl = ((dl + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2; // sheen has period π
      cur.light += dl * (1 - Math.exp(-4 * dt));

      const motion = reduced ? 0 : 1;
      acc.centre += 0.03 * dt * motion;
      acc.rim += 0.012 * dt * motion;
      const spin = ready ? Math.exp(-2.1 * (clock - readyAt)) : 0;
      const wheel = wheelBase + spinTo.wheel * spin * motion;
      rot[0] = acc.centre + spinTo.centre * spin * motion;
      rot[1] = rot[2] = rot[4] = wheel;
      rot[3] = 0;
      rot[5] = acc.rim + 0.00035 * y + spinTo.rim * spin * motion;

      // a tick each time an event passes the marker
      const ms = Math.floor((((-wheel % TAU) + TAU) % TAU) / DIAL_STEP);
      if (ms !== lastMarkerSector) { if (lastMarkerSector >= 0 && cur.o > 0.5 && bootV >= 1) Sound.tick(2100, 0.025, 0.03); lastMarkerSector = ms; }

      updateLens(dt);
      dial.render({
        dpr, time: clock, scroll: y,
        cx: cur.x, cy: cur.y, radius: cur.r * introScale, opacity: cur.o,
        rot, shapeA: shape.a, shapeB: shape.b, shapeMix: shape.mix,
        light: cur.light, hand: ghatiFraction(wall) * TAU,
        lx: lens.x, ly: lens.y, lr: lens.r, lensAmt: clamp(lens.r / 12, 0, 1),
        tint: cur.t, grain: 0.035,
        focusA: texReady ? fa : -1, focusB: fb, focusAmt: amt, sectors: DIAL_EVENTS.length,
        boot: bootV, explode, tilt: [0.95 * explode, -0.42 * explode]
      });

      if (!document.hidden && dtRaw < 0.1) {
        perf.acc += dtRaw; perf.n++;
        if (perf.n >= 45) {
          const avg = perf.acc / perf.n;
          perf.acc = 0; perf.n = 0;
          if (avg > 0.026 && dpr > 0.8) { dpr = Math.max(0.75, dpr * 0.8); dial.resize(W, H, dpr); }
        }
      }
    } else {
      updateLens(dt);
    }
    updateCursor(dt);
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ *
   * Boot                                                                *
   * ------------------------------------------------------------------ */
  renderStats();
  renderAges();
  renderEvents();
  renderSchedule();
  renderStage();
  renderPartners();
  renderFaq();
  initReadouts();
  resize();
  initReveal();
  updateCountdown(Date.now());
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { resize(); renderRibbon(); }, 120); });
  runIntro();
  requestAnimationFrame(loop);
})();
