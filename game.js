/* PATANG LADAI - by Aditya Solanki. Original game, all art & sound generated in code. */
(function () {
  'use strict';
  var FONT = Art.FONT, TAU = Math.PI * 2, CH = Art.CH;
  var cv = document.getElementById('c'), g = cv.getContext('2d');
  var W = 400, H = 720, scale = 1, offX = 0, offY = 0, dpr = 1, cssW = 400, cssH = 720;
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- save ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('patang_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('patang_' + k, JSON.stringify(v)); } catch (e) { } }
  };
  var save = { hi: store.get('hi', 0), coins: store.get('coins', 0), owned: store.get('owned', ['classic']), sel: store.get('sel', 'classic'), sound: store.get('sound', true), played: store.get('played', 0), tutDone: store.get('tutDone', false), duels: store.get('duels', 0) };
  function persist() { store.set('hi', save.hi); store.set('coins', save.coins); store.set('owned', save.owned); store.set('sel', save.sel); store.set('sound', save.sound); store.set('played', save.played); store.set('tutDone', save.tutDone); store.set('duels', save.duels); }
  Snd.setMuted(!save.sound);

  var DESIGNS = [
    { id: 'classic', name: 'Lal Patang', price: 0, pat: 'split', cols: ['#e8242c', '#ffd23c', '#ff8a00'], perk: 'Seedhi saadi patang', zone: 0, manja: 1, rival: 1 },
    { id: 'tiranga', name: 'Tiranga', price: 60, pat: 'tiranga', cols: ['#ff9933', '#ffffff', '#138808'], perk: 'Pench mein tap ka zor 15% zyada', zone: 0.10, manja: 1, rival: 1 },
    { id: 'neel', name: 'Neel Gagan', price: 110, pat: 'stripes', cols: ['#1e63d6', '#ffffff', '#7fc2ff'], perk: 'Manja dheere khatam hota hai', zone: 0, manja: 0.6, rival: 1 },
    { id: 'gulabi', name: 'Gulabi Rani', price: 170, pat: 'star', cols: ['#ff4fa3', '#fff2a8', '#ffffff'], perk: 'Pench mein tap ka zor 22% zyada', zone: 0.15, manja: 1, rival: 1 },
    { id: 'sunehri', name: 'Sunehri Shaan', price: 260, pat: 'checks', cols: ['#ffc400', '#b3261e', '#ffffff'], perk: 'Rival ka zor 12% kam', zone: 0.05, manja: 1, rival: 0.88 },
    { id: 'rangeela', name: 'Rangeela', price: 380, pat: 'rainbow', cols: ['#e53935', '#fdd835', '#1e88e5', '#43a047'], perk: 'Tap ka zor 27% zyada, manja kam kharch', zone: 0.18, manja: 0.7, rival: 1 },
    { id: 'kaala', name: 'Kaala Naag', price: 550, pat: 'cobra', cols: ['#16161e', '#ff3b3b', '#ffffff'], perk: 'Rival ka zor 22% kam', zone: 0.08, manja: 0.8, rival: 0.78 }
  ];
  function design(id) { for (var i = 0; i < DESIGNS.length; i++) if (DESIGNS[i].id === id) return DESIGNS[i]; return DESIGNS[0]; }

  var RPAT = [['split', ['#8e24aa', '#fdd835']], ['quarters', ['#00897b', '#ffffff']], ['stripes', ['#f4511e', '#ffffff']], ['star', ['#1565c0', '#ffeb3b']], ['checks', ['#2e7d32', '#ffffff']],
    ['border', ['#d81b60', '#ffffff', '#ffd54f']], ['diamond', ['#fb8c00', '#3949ab']], ['split', ['#00acc1', '#e91e63']], ['quarters', ['#ffb300', '#6a1b9a']], ['stripes', ['#43a047', '#fff176']], ['border', ['#3949ab', '#ffeb3b', '#ff5252']], ['star', ['#d32f2f', '#ffffff']]];
  var NAMES = ['Bunty', 'Pappu', 'Munna', 'Gulabo', 'Raju', 'Sonu', 'Kaka', 'Jigar', 'Babli', 'Chintu', 'Dabbu', 'Mamu', 'Tinku', 'Bholu', 'Chhotu', 'Rocky'];
  var SHOUTS = ['KAI PO CHE!', 'WOH KATA!', 'LAPET LAPET!', 'KATI PATANG!', 'KAI PO CHE!'];

  /* ---------- state ---------- */
  var STATE = 'intro', T = 0, stateT = 0, trans = null, fadeA = 0;
  var sceneD = 0.3, targetD = 0.3;
  var hits = [], pressedId = null, ptrs = {}, steer = null, pullCount = 0, fsTried = false;
  var shake = 0, flash = 0, flashCol = '#fff', cheerT = 0, hitStop = 0, ts = 1, vign = 0;
  var cityDay = null, cityDusk = null, cityScale = 0, roofs = [];
  var clouds = [], birds = [], farKites = [], wind = [], roofPeople = [], fgPeople = [];
  var particles = [], popups = [], shouts = [], banner = null;
  var player = null, rivals = [], falling = [], items = [], duel = null;
  var score = 0, lives = 3, wave = 1, combo = 0, coinsEarned = 0, cuts = 0, strongT = 0, slowT = 0, waveState = 'intro', waveT = 0, goT = 0, itemT = 8;
  var paused = false, newBest = false, hintT = 0, shopIdx = 0, shopMsg = 0, shopKite = null, swipe = null, demo = null, toast = null;
  var introKites = [];
  var tut = null, lastInput = 0;

  /* ---------- sizing ---------- */
  function resize() {
    cssW = window.innerWidth || 400; cssH = window.innerHeight || 720;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    var ratio = cssH / cssW;
    var newH = clamp(Math.round(400 * ratio), 640, 980);
    scale = Math.min(cssW / 400, cssH / newH);
    offX = (cssW - 400 * scale) / 2; offY = (cssH - newH * scale) / 2;
    var changed = newH !== H; H = newH;
    var want = Math.min(2, Math.max(1, Math.round(dpr * scale * 10) / 10));
    if (!cityDay || Math.abs(want - cityScale) > 0.3) { cityScale = want; var a = Art.buildCity(W, want, 'day'); cityDay = a.canvas; roofs = a.roofs; cityDusk = Art.buildCity(W, want, 'dusk').canvas; changed = true; }
    if (changed || !clouds.length) initScenery();
    if (player && STATE === 'play') { player.ax = ANCH_X(); player.ay = ANCH_Y(); }
  }
  function cityY() { return H - CH; }

  function initScenery() {
    var r = Art.mulberry(99), skyBot = H - CH - 40;
    clouds = []; for (var i = 0; i < 9; i++) clouds.push({ x: r() * W * 1.4 - 80, y: 50 + r() * (skyBot - 90), s: 0.5 + r() * 0.9, sp: 3 + r() * 9, sh: (r() * 4) | 0, a: 0.55 + r() * 0.4 });
    birds = []; for (var b = 0; b < 3; b++) { var fl = { x: r() * W, y: 90 + r() * (skyBot - 200), vx: 18 + r() * 14, bs: [] }; for (var k = 0; k < 3 + (r() * 3 | 0); k++) fl.bs.push({ dx: -k * (14 + r() * 8), dy: (k % 2 ? 1 : -1) * k * 5 + r() * 4, ph: r() * 6 }); birds.push(fl); }
    farKites = []; var fc = [['#e53935', '#ffffff'], ['#fdd835', '#e53935'], ['#1e88e5', '#ffffff'], ['#43a047', '#fdd835'], ['#ec407a', '#ffffff'], ['#ff9800', '#3949ab']];
    for (var f = 0; f < 15; f++) { var c = fc[(f + (r() * 3 | 0)) % fc.length]; farKites.push({ x: 20 + r() * (W - 40), y: 80 + r() * (skyBot - 130), s: 0.28 + r() * 0.26, ph: r() * 6, cols: c, pat: ['split', 'quarters', 'stripes', 'diamond'][(r() * 4) | 0], ax: 10 + r() * (W - 20) }); }
    wind = []; for (var w = 0; w < 30; w++) wind.push({ x: r() * W, y: r() * (H - CH), vx: 40 + r() * 70, len: 8 + r() * 22, a: 0.1 + r() * 0.25, petal: r() < 0.28, ph: r() * 6, col: ['#ff9800', '#ffd54f', '#ec407a', '#7cb342'][(r() * 4) | 0] });
    roofPeople = []; var step = Math.max(1, Math.floor(roofs.length / 8));
    for (var q = 1; q < roofs.length; q += step) roofPeople.push({ x: roofs[q].x, y: roofs[q].y, p: Art.makePerson(r), mode: [2, 3, 0, 1][(r() * 4) | 0], ai: -1.2 - r() * 0.3 });
    fgPeople = [{ x: 52, p: Art.makePerson(r), mode: 3 }, { x: W - 138, p: Art.makePerson(r), mode: 2 }];
  }

  /* ---------- helpers: kites ---------- */
  function newPts(n) { var a = []; for (var i = 0; i < n; i++) a.push({ x: 0, y: 0 }); return a; }
  function makeKite(x, y, d) {
    var k = { x: x, y: y, vx: 0, vy: 0, rot: 0, w: 44, h: 52, tail: [], str: newPts(16), pat: d.pat, cols: d.cols, seed: Math.random() * 10, ax: 0, ay: 0, sag: 30, flut: 0 };
    for (var i = 0; i < 11; i++) k.tail.push({ x: x, y: y + 26 + i * 6 });
    return k;
  }
  function updateTail(k, t) {
    k.tail[0].x = k.x - Math.sin(k.rot) * k.h * 0.5; k.tail[0].y = k.y + Math.cos(k.rot) * k.h * 0.5;
    for (var i = 1; i < k.tail.length; i++) {
      var p = k.tail[i], q = k.tail[i - 1];
      var dx = p.x - q.x + Math.sin(t * 7 + i * 0.9 + k.seed) * 0.7 * Math.min(1, i / 4) + 0.5, dy = p.y - q.y + 0.9;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      p.x = q.x + dx / d * 6.6; p.y = q.y + dy / d * 6.6;
    }
  }
  function drawKiteObj(k, t, alpha) {
    Art.drawTail(g, k.tail, k.cols);
    g.save(); g.translate(k.x, k.y); g.rotate(k.rot);
    var sk = Math.sin(t * 11 + k.seed) * 0.035 + (k.flut || 0);
    g.scale(1 + sk, 1 - sk * 0.5);
    if (alpha < 1) g.globalAlpha = alpha;
    Art.drawKite(g, k.pat, k.cols, k.w, k.h, t + k.seed);
    g.restore(); g.globalAlpha = 1;
  }
  function segHit(a, b, c, d) {
    var r1x = b.x - a.x, r1y = b.y - a.y, r2x = d.x - c.x, r2y = d.y - c.y, den = r1x * r2y - r1y * r2x;
    if (Math.abs(den) < 1e-6) return null;
    var t = ((c.x - a.x) * r2y - (c.y - a.y) * r2x) / den, u = ((c.x - a.x) * r1y - (c.y - a.y) * r1x) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { x: a.x + r1x * t, y: a.y + r1y * t };
    return null;
  }
  function ptSeg(px, py, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy, u = l2 > 0 ? clamp(((px - a.x) * dx + (py - a.y) * dy) / l2, 0, 1) : 0;
    var qx = a.x + dx * u, qy = a.y + dy * u;
    return { d: Math.hypot(px - qx, py - qy), x: qx, y: qy };
  }
  /* tol = extra "hit area" in px: strings that pass within tol of each other also count as crossing */
  function strCross(A, B, tol) {
    var i, j, h;
    for (i = 0; i < A.length - 1; i++) for (j = 0; j < B.length - 1; j++) { h = segHit(A[i], A[i + 1], B[j], B[j + 1]); if (h) return h; }
    if (tol) {
      var best = null, bd = tol;
      for (i = 0; i < A.length - 1; i++) for (j = 0; j < B.length - 1; j++) {
        var a = A[i], a2 = A[i + 1], b = B[j], b2 = B[j + 1];
        if (Math.min(a.x, a2.x) - tol > Math.max(b.x, b2.x) || Math.max(a.x, a2.x) + tol < Math.min(b.x, b2.x) || Math.min(a.y, a2.y) - tol > Math.max(b.y, b2.y) || Math.max(a.y, a2.y) + tol < Math.min(b.y, b2.y)) continue;
        var c = [ptSeg(a.x, a.y, b, b2), ptSeg(a2.x, a2.y, b, b2), ptSeg(b.x, b.y, a, a2), ptSeg(b2.x, b2.y, a, a2)];
        for (var q = 0; q < 4; q++) if (c[q].d < bd) { bd = c[q].d; best = { x: c[q].x, y: c[q].y }; }
      }
      if (best) return best;
    }
    return null;
  }

  /* ---------- fx ---------- */
  function sparks(x, y, n, cols, sp, life) {
    for (var i = 0; i < n && particles.length < 380; i++) { var a = Math.random() * TAU, v = rand(0.3, 1) * sp; particles.push({ t: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.5, 1) * (life || 0.7), max: life || 0.7, s: rand(1.2, 2.6), col: cols[(Math.random() * cols.length) | 0] }); }
  }
  function petals(x, y, n, sp) {
    var cs = ['#ff9800', '#ffd54f', '#ec407a', '#ffffff', '#ff5252'];
    for (var i = 0; i < n && particles.length < 380; i++) { var a = Math.random() * TAU, v = rand(0.2, 1) * sp; particles.push({ t: 'petal', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.4, life: rand(1.2, 2.2), max: 2.2, s: rand(2.5, 4), rot: rand(0, 6), col: cs[(Math.random() * cs.length) | 0] }); }
  }
  function ring(x, y, col, r1) { particles.push({ t: 'ring', x: x, y: y, vx: 0, vy: 0, life: 0.45, max: 0.45, s: r1 || 60, col: col }); }
  function popup(x, y, s, col, size) { popups.push({ x: x, y: y, txt: s, col: col || '#fff', size: size || 18, t: 0 }); }
  function shout(s, col) { shouts.push({ txt: s, col: col || '#ffd23c', t: 0 }); }

  /* ---------- UI helpers ---------- */
  function txt(s, x, y, size, fill, align, o) {
    o = o || {}; g.font = (o.w || '900') + ' ' + size + 'px ' + FONT; g.textAlign = align || 'center'; g.textBaseline = o.base || 'middle';
    if (o.sh) { g.fillStyle = o.shc || 'rgba(0,0,0,0.35)'; g.fillText(s, x + o.sh, y + o.sh); }
    if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || size * 0.18; g.strokeStyle = o.stroke; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y);
  }
  function spaced(s, x, y, size, fill, sp, o) {
    g.font = '900 ' + size + 'px ' + FONT; g.textBaseline = 'middle'; g.textAlign = 'left';
    var tw = 0, i, ws = []; for (i = 0; i < s.length; i++) { var w = g.measureText(s[i]).width; ws.push(w); tw += w + sp; } tw -= sp;
    var cx = x - tw / 2;
    for (i = 0; i < s.length; i++) { if (o && o.stroke) { g.lineWidth = size * 0.15; g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.strokeText(s[i], cx, y); } g.fillStyle = fill; g.fillText(s[i], cx, y); cx += ws[i] + sp; }
  }
  function wrap(s, maxW, size) {
    g.font = '700 ' + size + 'px ' + FONT; var words = s.split(' '), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  var BTN = { orange: ['#ffb02e', '#ff5a1f'], teal: ['#37d5c3', '#0f8f9d'], purple: ['#b06cff', '#6a2bd1'], green: ['#6fe36a', '#1f9d3a'], grey: ['#9aa0b4', '#5f647a'], red: ['#ff6b6b', '#c4232f'], dark: ['rgba(60,40,100,0.85)', 'rgba(30,18,60,0.9)'] };
  function button(id, x, y, w, h, label, kind, size) {
    hits.push({ id: id, x: x - w / 2, y: y - h / 2, w: w, h: h });
    var c = BTN[kind || 'orange'], pr = pressedId === id, s = pr ? 0.94 : 1;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.3)'; Art.rr(g, -w / 2, -h / 2 + 5, w, h, h * 0.4); g.fill();
    var gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]);
    g.fillStyle = gr; Art.rr(g, -w / 2, -h / 2, w, h, h * 0.4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.28)'; Art.rr(g, -w / 2 + 4, -h / 2 + 3, w - 8, h * 0.42, h * 0.3); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2; Art.rr(g, -w / 2, -h / 2, w, h, h * 0.4); g.stroke();
    txt(label, 0, 1, size || Math.round(h * 0.42), '#fff', 'center', { stroke: 'rgba(60,15,40,0.75)' });
    g.restore();
  }
  function roundBtn(id, x, y, r, drawIcon, kind) {
    hits.push({ id: id, x: x - r, y: y - r, w: r * 2, h: r * 2 });
    var c = BTN[kind || 'dark'], pr = pressedId === id;
    g.save(); g.translate(x, y); if (pr) g.scale(0.92, 0.92);
    var gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke();
    drawIcon(); g.restore();
  }
  function panel(x, y, w, h, a) { g.fillStyle = 'rgba(20,10,50,' + (a || 0.78) + ')'; Art.rr(g, x, y, w, h, 18); g.fill(); g.strokeStyle = 'rgba(255,214,120,0.8)'; g.lineWidth = 2.5; Art.rr(g, x, y, w, h, 18); g.stroke(); }
  function coinIcon(x, y, r) { Art.drawCoin(g, x, y, r, 0); }

  /* ---------- scene drawing ---------- */
  function drawBackdrop(t, dt, windMul) {
    Art.drawSky(g, W, H, sceneD);
    Art.drawSun(g, W, H, sceneD, t);
    var skyBot = H - CH;
    for (var i = 0; i < farKites.length; i++) {
      var f = farKites[i], x = f.x + Math.sin(t * 0.5 + f.ph) * 10, y = f.y + Math.sin(t * 0.37 + f.ph * 2) * 7;
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(f.ax, skyBot + 30); g.quadraticCurveTo((f.ax + x) / 2 + 8, (skyBot + y) / 2 + 30, x, y + 12 * f.s); g.stroke();
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 0.9 + f.ph) * 0.2); g.scale(f.s, f.s); g.globalAlpha = 0.85;
      Art.drawKite(g, f.pat, f.cols, 40, 48, t);
      g.strokeStyle = f.cols[0]; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 24); for (var q = 1; q < 6; q++) g.lineTo(Math.sin(t * 5 + q + f.ph) * 4 * q * 0.3, 24 + q * 7); g.stroke();
      g.restore();
    }
    var dark = Art.mix('#1c2b4a', '#2a1230', sceneD);
    for (var b = 0; b < birds.length; b++) {
      var fl = birds[b]; fl.x += fl.vx * dt * windMul; if (fl.x - 90 > W) { fl.x = -40; fl.y = 90 + Math.random() * (skyBot - 220); }
      for (var k = 0; k < fl.bs.length; k++) { var bd = fl.bs[k]; Art.drawBird(g, fl.x + bd.dx, fl.y + bd.dy + Math.sin(t * 1.3 + bd.ph) * 3, 1, t + bd.ph, dark); }
    }
    for (var c = 0; c < clouds.length; c++) { var cl = clouds[c]; cl.x += cl.sp * dt * windMul; if (cl.x > W + 20) cl.x = -170 * cl.s - 10; Art.drawCloud(g, cl, sceneD); }
  }
  function drawWind(t, dt, windMul) {
    g.save(); g.lineCap = 'round';
    for (var i = 0; i < wind.length; i++) {
      var w = wind[i]; w.x += w.vx * dt * windMul; w.y += Math.sin(t * 1.5 + w.ph) * 10 * dt;
      if (w.x > W + 30) { w.x = -30; w.y = Math.random() * (H - CH - 20); }
      if (w.petal) { g.fillStyle = w.col; g.globalAlpha = 0.7; g.save(); g.translate(w.x, w.y); g.rotate(t * 3 + w.ph); g.beginPath(); g.ellipse(0, 0, 3, 1.6, 0, 0, TAU); g.fill(); g.restore(); }
      else { g.globalAlpha = w.a; g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(w.x, w.y); g.lineTo(w.x - w.len, w.y - Math.sin(t * 1.5 + w.ph) * 2); g.stroke(); }
    }
    g.restore(); g.globalAlpha = 1;
  }
  function drawCity(t) {
    var y0 = cityY();
    g.drawImage(cityDay, 0, y0, W, CH);
    var f = clamp((sceneD - 0.45) / 0.5, 0, 1);
    if (f > 0.01) { g.globalAlpha = f; g.drawImage(cityDusk, 0, y0, W, CH); g.globalAlpha = 1; }
    for (var i = 0; i < roofPeople.length; i++) { var p = roofPeople[i]; Art.drawPerson(g, p.x, y0 + p.y + 1, 0.5, p.p, t, p.mode, cheerT > 0 ? 1 : 0, p.ai); }
    for (var j = 0; j < fgPeople.length; j++) { var q = fgPeople[j]; Art.drawPerson(g, q.x, H - 22, 0.95, q.p, t, q.mode, cheerT > 0 ? 1 : 0); }
  }
  function sceneTint() {
    var f = clamp((sceneD - 0.5) * 2, 0, 1);
    if (f > 0.01) { var gr = g.createLinearGradient(0, H - CH, 0, H); gr.addColorStop(0, 'rgba(255,120,60,0)'); gr.addColorStop(1, 'rgba(90,30,110,' + (0.22 * f) + ')'); g.fillStyle = gr; g.fillRect(0, H - CH, W, CH); }
  }

  /* ---------- game logic ---------- */
  function ANCH_X() { return W / 2 + 15; }
  function ANCH_Y() { return H - 76; }
  function makePlayer(resp) {
    var d = design(save.sel), k = makeKite(ANCH_X(), ANCH_Y() - 40, d);
    k.w = 46; k.h = 54; k.ax = ANCH_X(); k.ay = ANCH_Y(); k.alive = true; k.immuneT = resp ? 4.5 : 3; k.manja = 100; k.tension = 0; k.d = d; k.vy = -380; k.khT = 0; k.wasPull = false; k.respawnT = 0; k.hold = H - 370;
    return k;
  }
  function startGame(mode) {
    var doTut = mode === 'tut' || (mode === undefined && !save.tutDone);
    score = 0; lives = 5; wave = 1; combo = 0; coinsEarned = 0; cuts = 0; strongT = 0; slowT = 0; duel = null; paused = false; newBest = false;
    rivals = []; falling = []; items = []; particles = []; popups = []; shouts = []; goT = 0; itemT = 9; ts = 1; hintT = doTut ? 0 : 7; save.played++; persist();
    player = makePlayer(); steer = null; pullCount = 0; ptrs = {}; sceneD = 0; targetD = 0; lastInput = T; banner = null;
    if (doTut) { tut = { step: 0, t: 0, stepT: 0, prog: 0, okT: 0, fin: 3.2, dummy: null }; player.immuneT = 0; waveState = 'tut'; wave = 1; }
    else { tut = null; spawnWave(1); }
    setState('play', true);
  }
  function spawnWave(n) {
    wave = n; waveState = 'intro'; waveT = 2.4;
    var cnt = [2, 2, 3, 3, 4, 4, 5, 5][Math.min(n, 8) - 1] || 5;
    var sk = Math.min(0.85, 0.12 + 0.06 * (n - 1));
    var names = NAMES.slice().sort(function () { return Math.random() - 0.5; });
    var used = {}, nUsed = 0, pats = RPAT.slice().sort(function () { return Math.random() - 0.5; });
    rivals = [];
    for (var i = 0; i < cnt; i++) {
      var side = i % 2 ? 1 : -1, pd = pats[i % pats.length];
      var r = makeKite(side < 0 ? -50 : W + 50, rand(60, 200), { pat: pd[0], cols: pd[1] });
      r.name = names[i]; r.skill = clamp(sk + rand(-0.07, 0.08), 0.12, 0.97); r.mode = 'wander'; r.modeT = rand(1.5, 3); r.cd = 1.5 + i * 3.2; r.t = rand(0, 5);
      var ri; do { ri = (Math.random() * roofs.length) | 0; } while (used[ri] && nUsed < roofs.length);
      used[ri] = 1; nUsed++; r.ax = clamp(roofs[ri].x, 14, W - 14); r.ay = cityY() + roofs[ri].y - 16;
      r.tx = rand(60, W - 60); r.ty = rand(120, H - 400); r.sag = rand(18, 32); r.w = 42; r.h = 50;
      rivals.push(r);
    }
    banner = { t: 0, a: 'WAVE ' + n, b: cnt + ' rival patangbaaz aa gaye!' };
    Snd.sfx.wave();
    targetD = Math.min(1, (n - 1) / 6);
  }
  function spawnItem() {
    var tp = ['manja', 'slow', 'life'][(Math.random() * (lives >= 5 ? 2 : 3)) | 0];
    items.push({ t: tp, x: rand(50, W - 50), y: rand(130, H - 360), age: 0, ph: rand(0, 6) });
  }
  function clearWave() {
    waveState = 'clear'; waveT = 2.8;
    var bonus = 10 + wave * 2; save.coins += bonus; coinsEarned += bonus; score += 200 * wave; persist();
    banner = { t: 0, a: 'WAVE CLEAR!', b: '+' + (200 * wave) + ' points   +' + bonus + ' coins' };
    cheerT = 2.5; petals(W / 2, 220, 40, 260);
  }

  /* Pench = simple mash: tap anywhere (or hold KHENCH) fills YOUR bar, rival fills slowly. No timing, no penalty. */
  function tapMul() { return 1 + player.d.zone * 1.5; }
  function duelPush() {
    var r = duel.r; if (duel.tut || duel.t < 1) return 0;
    var wk = wave <= 2 ? 0.55 : wave <= 4 ? 0.8 : 1;
    var base = (0.045 + r.skill * 0.1) * wk * (1 + 0.03 * wave);
    return base * player.d.rival * (strongT > 0 ? 0.6 : 1) * (1 + (1 - player.manja / 100) * 0.25);
  }
  function startDuel(r, pt) {
    duel = { r: r, t: 0, bar: tut ? 0 : 0.2, lastTap: -9, streak: 0, taps: 0, ix: pt.x, iy: pt.y, msg: '', msgT: 0, msgCol: '#fff', perfects: 0, tut: !!tut };
    if (tut) { tut.step = 3; tut.okT = 0; tut.stepT = 0; }
    save.duels++; persist();
    r.mode = 'duel'; Snd.sfx.duelStart(); shout('PENCH!', '#ff8a5b'); shake = Math.max(shake, 6); flash = 0.4; flashCol = '#fff2c0';
    sparks(pt.x, pt.y, 24, ['#fff7c0', '#ffd23c', '#ffffff'], 220, 0.6);
    ring(pt.x, pt.y, '#ffe6a0', 70);
    steer = null; for (var k in ptrs) if (ptrs[k].role === 'steer') ptrs[k].role = 'tap';
  }
  function duelTap() {
    if (!duel) return;
    var gain = 0.08 * tapMul() * (strongT > 0 ? 1.35 : 1);
    duel.bar += gain; duel.taps++;
    var fast = T - duel.lastTap < 0.34; duel.lastTap = T; duel.streak = fast ? duel.streak + 1 : 0;
    if (fast && duel.streak % 8 === 0) { duel.perfects++; duel.bar += 0.04; duel.msg = 'SHABASH!'; duel.msgCol = '#7dff8a'; duel.msgT = 0.7; Snd.sfx.perfect(); sparks(duel.ix, duel.iy, 14, ['#fff7c0', '#7dff8a'], 200, 0.5); shake = Math.max(shake, 4); }
    else { Snd.sfx.good(); sparks(duel.ix, duel.iy, 4, ['#ffd23c', '#fff'], 130, 0.35); }
  }
  function khenchDown() { for (var k in ptrs) if (ptrs[k].role === 'pull') return true; return false; }
  function cutKite(k, isPlayer, ix, iy) {
    var f = { x: k.x, y: k.y, vx: rand(-20, 30), vy: -20, rot: k.rot, w: k.w, h: k.h, tail: k.tail, cols: k.cols, pat: k.pat, seed: k.seed, str: newPts(16), t: 0, spin: rand(-2.5, 2.5), isPlayer: isPlayer, flut: 0 };
    for (var i = 0; i < 16; i++) { f.str[i].x = lerp(ix, k.x, i / 15); f.str[i].y = lerp(iy, k.y, i / 15); }
    falling.push(f);
  }
  function resolveDuel(win) {
    var r = duel.r, ix = duel.ix, iy = duel.iy;
    sparks(ix, iy, 40, ['#fff7c0', '#ffd23c', '#ff8a00', '#ffffff'], 320, 0.8); ring(ix, iy, '#fff', 110); petals(ix, iy, 22, 200);
    Snd.sfx[win ? 'cut' : 'lose'](); hitStop = 0.14; shake = 16; flash = 0.7; cheerT = win ? 2 : 0; flashCol = win ? '#fff6c8' : '#ff5a4a';
    if (win) {
      cutKite(r, false, ix, iy); rivals.splice(rivals.indexOf(r), 1); combo++; cuts++;
      var pts = 100 + 25 * (wave - 1) + duel.perfects * 15 + (combo > 1 ? 40 * Math.min(combo - 1, 5) : 0);
      score += pts; var cn = 5 + Math.floor(wave / 2); coinsEarned += cn; save.coins += cn; persist();
      shout(SHOUTS[(Math.random() * SHOUTS.length) | 0], '#ffd23c');
      popup(r.x, r.y - 30, '+' + pts, '#fff', 24); popup(r.x, r.y - 6, '+' + cn + ' coins', '#ffe066', 14);
      if (combo > 1) popup(player.x, player.y - 50, 'COMBO x' + combo, '#7dff8a', 18);
      if (tut) { tut.step = 4; tut.fin = 3.2; save.tutDone = true; persist(); shout('KAI PO CHE!', '#ffd23c'); }
      else if (rivals.length === 0 && waveState !== 'clear') clearWave();
    } else {
      combo = 0; r.mode = 'wander'; r.modeT = 3; r.cd = 6;
      player.alive = false; lives--; cutKite(player, true, ix, iy); shout('KATI GAYI!', '#ff6b6b');
      popup(player.x, player.y - 30, 'Patang kat gayi', '#ffb0b0', 16);
      if (lives <= 0) goT = 2.4; else player.respawnT = 1.9;
    }
    duel = null;
  }

  /* ---------- update ---------- */
  var playerPerson = Art.makePerson(Art.mulberry(7));
  function pullHeld() {
    if (duel) return false;
    for (var k in ptrs) { var q = ptrs[k]; if (q.role === 'pull' || (q.role === 'steer' && q.still > 0.3)) return true; }
    return false;
  }
  function updatePlayer(p, rdt, dt) {
    if (!p.alive) {
      if (p.respawnT > 0) { p.respawnT -= rdt; if (p.respawnT <= 0 && lives > 0) { player = makePlayer(true); steer = null; lastInput = T; Snd.sfx.life(); popup(player.x, player.y - 60, 'SURAKSHIT! 4 second', '#9fe8ff', 15); } }
      return;
    }
    p.immuneT = Math.max(0, p.immuneT - dt);
    if (!duel) {
      var pulling = pullHeld() && p.manja > 2;
      if (pulling && p.manja < 8 && !p.wasPull) pulling = false;
      var tx = p.x, ty = p.y;
      for (var k in ptrs) { var q = ptrs[k]; if (q.role === 'steer') { tx = q.kx + (q.x - q.sx) * 1.4; ty = q.ky + (q.y - q.sy) * 1.4; if (Math.hypot(q.x - q.lx, q.y - q.ly) > 2.5) q.still = 0; else q.still += rdt; q.lx = q.x; q.ly = q.y; } }
      var hasSteer = false; for (var k2 in ptrs) if (ptrs[k2].role === 'steer') hasSteer = true;
      if (hasSteer) p.hold = null;
      if (!hasSteer) { tx = p.x + Math.sin(T * 0.9) * 8; ty = (p.hold != null ? p.hold : p.y) + Math.cos(T * 0.7) * 5; }
      if (pulling) ty -= 50;
      tx = clamp(tx, 32, W - 32); ty = clamp(ty, 105, H - 300);
      var kk = pulling ? 38 : 15, dm = pulling ? 12.5 : 7.5, mx = pulling ? 680 : 430;
      p.vx += ((tx - p.x) * kk - p.vx * dm) * dt; p.vy += ((ty - p.y) * kk - p.vy * dm) * dt;
      var sp = Math.hypot(p.vx, p.vy); if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (pulling && !p.wasPull) Snd.sfx.khench();
      if (pulling && Math.random() < 0.5) sparks(p.x, p.y + 6, 1, ['#ffffff', '#ffe9a0'], 40, 0.35);
      p.wasPull = pulling;
      if (pulling) { if (strongT <= 0) p.manja = Math.max(0, p.manja - 4 * p.d.manja * dt); } else p.manja = Math.min(100, p.manja + 16 * dt); if (tut) p.manja = 100;
      p.tension += ((pulling ? 1 : 0) - p.tension) * Math.min(1, dt * 10);
      p.rot += (clamp(p.vx * 0.0016, -0.5, 0.5) + Math.sin(T * 3) * 0.03 - p.rot) * Math.min(1, dt * 9);
      p.khT = pulling ? p.khT + dt : 0;
      pullCount += pulling ? dt : 0;
    } else { p.vx = p.vy = 0; p.rot += (Math.sin(T * 30) * 0.12 - p.rot) * 0.4; p.tension += (1 - p.tension) * Math.min(1, dt * 10); }
    p.sag = lerp(34, 6, p.tension);
    Art.stringPoints(p.str, p.ax, p.ay, p.x, p.y + 8, p.sag, T, p.seed);
    updateTail(p, T);
    if (hintT > 0) hintT -= rdt;
  }
  function updateRival(r, dt) {
    r.t += dt; r.modeT -= dt; r.cd -= dt;
    var p = player, sk = r.skill, spd = tut ? 0.7 : wave <= 2 ? 0.55 : wave <= 4 ? 0.75 : 1;
    if (r.mode === 'duel') { r.vx = r.vy = 0; r.rot += (Math.sin(T * 30) * 0.12 - r.rot) * 0.4; }
    else {
      if (r.mode === 'wander') {
        if (r.modeT <= 0) {
          var att = 0; for (var q = 0; q < rivals.length; q++) if (rivals[q].mode === 'attack') att++;
          if (r.cd <= 0 && p.alive && p.immuneT <= 0 && waveState === 'fight' && att < (wave <= 3 ? 1 : 2) && Math.random() < 0.85) { r.mode = 'attack'; r.modeT = rand(4, 6); Snd.sfx.rival(); }
          else { r.tx = clamp(r.ax + rand(-120, 120), 40, W - 40); r.ty = rand(100, H - 330); r.modeT = rand(1.5, 3.5); }
        }
      } else if (r.mode === 'attack') {
        /* rival comes to YOU: it aims at a point just across your string so the strings always meet */
        if (!p.alive || p.immuneT > 1.2) r.modeT = 0;
        else { var side = r.ax < p.ax ? 1 : -1, mid = p.str[8]; r.tx = mid.x + side * 30; r.ty = mid.y + 4; }
        if (r.modeT <= 0) { r.mode = 'wander'; r.cd = rand(1.5, 3) * (1.5 - sk); r.modeT = 0.5; }
      } else if (r.mode === 'tutdummy') {
        var as = tut ? clamp((tut.stepT - 8) / 8, 0, 1) : 1, sd = r.ax < p.ax ? 1 : -1, md = p.str[8];
        r.tx = lerp(r.hx + Math.sin(r.t * 1.3) * 8, md.x + sd * 30, as); r.ty = lerp(r.hy + Math.cos(r.t * 1.1) * 6, md.y + 4, as);
      }
      var at = r.mode === 'attack' || r.mode === 'tutdummy', kk = at ? 5 + sk * 12 : 4.5, dm = at ? 6 + sk * 4 : 4.2, mx = (at ? 110 + sk * 160 : 85) * spd;
      r.tx = clamp(r.tx, 30, W - 30); r.ty = clamp(r.ty, 95, H - 300);
      r.vx += ((r.tx - r.x) * kk - r.vx * dm) * dt; r.vy += ((r.ty - r.y) * kk - r.vy * dm) * dt;
      var sp = Math.hypot(r.vx, r.vy); if (sp > mx) { r.vx *= mx / sp; r.vy *= mx / sp; }
      r.x += r.vx * dt; r.y += r.vy * dt;
      r.rot += (clamp(r.vx * 0.002, -0.55, 0.55) + Math.sin(r.t * 3 + r.seed) * 0.05 - r.rot) * Math.min(1, dt * 7);
    }
    Art.stringPoints(r.str, r.ax, r.ay, r.x, r.y + 8, r.mode === 'attack' || r.mode === 'duel' ? 10 : r.sag, T, r.seed);
    updateTail(r, T);
  }
  function spawnTutDummy() {
    var p = player, dir = p.x > W / 2 ? -1 : 1, hx = clamp(p.x + dir * 150, 60, W - 60), hy = clamp(p.y - 15, 250, H - 330), ri = 0, bd = 1e9;
    for (var i = 0; i < roofs.length; i++) { var dd = Math.abs(roofs[i].x - hx); if (dd < bd) { bd = dd; ri = i; } }
    var r = makeKite(hx < W / 2 ? -50 : W + 50, hy - 50, { pat: 'diamond', cols: ['#fb8c00', '#3949ab'] });
    r.name = 'Practice'; r.skill = 0.05; r.mode = 'tutdummy'; r.modeT = 9; r.cd = 0; r.t = 0; r.hx = hx; r.hy = hy; r.tx = hx; r.ty = hy;
    r.ax = clamp(roofs[ri].x, 14, W - 14); r.ay = cityY() + roofs[ri].y - 16; r.sag = 22; r.w = 44; r.h = 52;
    rivals.push(r); tut.dummy = r;
  }
  function tutOk() { tut.okT = 1; Snd.sfx.good(); petals(player.x, player.y, 12, 160); popup(player.x, player.y - 44, 'WAH! Shabash!', '#7dff8a', 18); }
  function updateTut(rdt) {
    var p = player; if (!tut || !p) return;
    tut.t += rdt; tut.stepT += rdt;
    if (tut.okT > 0) { tut.okT -= rdt; if (tut.okT <= 0) { tut.step++; tut.stepT = 0; tut.prog = 0; if (tut.step === 2) spawnTutDummy(); } return; }
    if (tut.step === 0) { if (tut.prog >= 150) tutOk(); }
    else if (tut.step === 1) { if (khenchDown() && !duel) tut.prog += rdt; if (tut.prog >= 1.4) tutOk(); }
    else if (tut.step === 4) { tut.fin -= rdt; if (tut.fin <= 0) { tut = null; startGame('real'); } }
  }
  function updateFalling(dt) {
    for (var i = falling.length - 1; i >= 0; i--) {
      var f = falling[i]; f.t += dt;
      f.vy += 300 * dt; f.vy *= 1 - Math.min(0.9, 0.9 * dt); f.vx += Math.sin(f.t * 5 + f.seed) * 140 * dt; f.vx *= 1 - Math.min(0.9, 0.8 * dt);
      f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.spin * dt; f.flut = Math.sin(f.t * 14) * 0.05;
      updateTail(f, T);
      var s = f.str; s[15].x = f.x; s[15].y = f.y + 6;
      for (var j = 14; j >= 0; j--) { var a = s[j], b = s[j + 1]; a.y += 70 * dt; var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1; a.x = b.x + dx / d * 11; a.y = b.y + dy / d * 11; }
      if (Math.random() < 0.3) sparks(f.x, f.y, 1, f.cols, 30, 0.6);
      if (f.y > H + 80) falling.splice(i, 1);
    }
  }
  function updateFx(dt) {
    var i, q;
    for (i = particles.length - 1; i >= 0; i--) {
      q = particles[i]; q.life -= dt; if (q.life <= 0) { particles.splice(i, 1); continue; }
      if (q.t === 'spark') { q.vy += 220 * dt; q.vx *= 1 - 1.5 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
      else if (q.t === 'petal') { q.vy += 40 * dt; q.vx *= 1 - 1.2 * dt; q.vy *= 1 - 1.2 * dt; q.x += (q.vx + Math.sin(q.life * 6) * 30) * dt; q.y += q.vy * dt; q.rot += dt * 4; }
    }
    for (i = popups.length - 1; i >= 0; i--) { q = popups[i]; q.t += dt; q.y -= 28 * dt; if (q.t > 1.3) popups.splice(i, 1); }
    for (i = shouts.length - 1; i >= 0; i--) { shouts[i].t += dt; if (shouts[i].t > 1.4) shouts.splice(i, 1); }
    if (banner) { banner.t += dt; if (banner.t > 2.6) banner = null; }
  }
  function updatePlay(rdt) {
    if (paused) return;
    updateFx(rdt);
    if (hitStop > 0) { hitStop -= rdt; return; }
    T += rdt;
    var want = (duel ? 0.45 : 1) * (slowT > 0 ? 0.55 : 1);
    ts += (want - ts) * Math.min(1, rdt * 8);
    if (tut) updateTut(rdt);
    for (var pk in ptrs) { lastInput = T; break; }
    var dt = rdt * ts, p = player;
    if (strongT > 0) strongT -= rdt; if (slowT > 0) slowT -= rdt;
    if (cheerT > 0) cheerT -= rdt;
    updatePlayer(p, rdt, dt);
    for (var i = 0; i < rivals.length; i++) updateRival(rivals[i], dt);
    updateFalling(dt);
    /* waves */
    if (waveState === 'intro') { waveT -= rdt; if (waveT <= 0) waveState = 'fight'; }
    else if (waveState === 'clear') { waveT -= rdt; if (waveT <= 0) { spawnWave(wave + 1); } }
    else if (waveState === 'fight' && !items.length && !duel) { itemT -= rdt; if (itemT <= 0) { spawnItem(); itemT = rand(11, 17); } }
    /* items */
    for (var j = items.length - 1; j >= 0; j--) {
      var it = items[j]; it.age += dt; it.y += Math.sin(T * 2 + it.ph) * 8 * dt;
      if (p.alive && Math.hypot(p.x - it.x, p.y - it.y) < 36) {
        if (it.t === 'manja') { strongT = 9; p.manja = 100; popup(it.x, it.y, 'PAKKA MANJA!', '#ffd23c', 16); }
        else if (it.t === 'slow') { slowT = 6; popup(it.x, it.y, 'SLOW-MO!', '#7fd0ff', 16); }
        else { lives = Math.min(5, lives + 1); popup(it.x, it.y, 'EXTRA PATANG!', '#ff7aa8', 16); }
        Snd.sfx.power(); sparks(it.x, it.y, 20, ['#fff', '#ffd23c', '#7fd0ff'], 200, 0.7); ring(it.x, it.y, '#fff', 60); items.splice(j, 1); continue;
      }
      if (it.age > 13) items.splice(j, 1);
    }
    /* duel */
    if (duel) {
      var d = duel;
      d.t += rdt; if (d.msgT > 0) d.msgT -= rdt;
      if (khenchDown()) d.bar += 0.18 * tapMul() * (strongT > 0 ? 1.35 : 1) * rdt;
      d.bar -= duelPush() * rdt;
      d.bar = Math.min(d.bar, 1); if (d.tut && d.bar < 0.02) d.bar = 0.02;
      if (d.bar >= 1) resolveDuel(true); else if (d.bar <= -1) resolveDuel(false); else if (!d.tut && d.t > 14) resolveDuel(d.bar > 0);
      Snd.setIntensity(0.9);
    } else {
      Snd.setIntensity(wave >= 3 ? 0.7 : 0.4);
      if (p.alive && p.immuneT <= 0 && waveState !== 'intro') {
        for (var k = 0; k < rivals.length; k++) {
          var r = rivals[k];
          if (r.x < -10 || r.x > W + 10 || r.y < 40 || r.mode === 'duel') continue;
          if (r.mode === 'tutdummy' && (!tut || tut.stepT < 2.5 || r.x > W - 15 || r.x < 15)) continue;
          var hit = strCross(p.str, r.str, tut ? 14 : 9);
          if (hit) { startDuel(r, hit); break; }
        }
      }
    }
    if (goT > 0) { goT -= rdt; if (goT <= 0) endGame(); }
  }
  function endGame() {
    newBest = score > save.hi; if (newBest) save.hi = score; persist();
    Snd.sfx.over(); Snd.setIntensity(0); setState('over');
  }

  /* ---------- drawing: play ---------- */
  function drawItem(it, t) {
    var a = clamp((13 - it.age) / 2, 0, 1) * clamp(it.age * 3, 0, 1), pul = 1 + Math.sin(t * 6 + it.ph) * 0.07;
    g.save(); g.translate(it.x, it.y); g.scale(pul, pul); g.globalAlpha = a;
    var col = it.t === 'manja' ? '#ffb300' : it.t === 'slow' ? '#3fa9ff' : '#ff4f86';
    var gl = g.createRadialGradient(0, 0, 4, 0, 0, 34); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = a * 0.55; g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fill(); g.globalAlpha = a;
    g.fillStyle = 'rgba(25,12,50,0.88)'; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke();
    if (it.t === 'manja') { g.save(); g.scale(1.5, 1.5); Art.drawSpool(g, 0, 0, t); g.restore(); }
    else if (it.t === 'slow') { g.strokeStyle = '#fff'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(0, -7); g.lineTo(0, 0); g.lineTo(6, 3); g.stroke(); }
    else { g.fillStyle = '#ff6b9a'; g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(-16, -2, -9, -14, 0, -6); g.bezierCurveTo(9, -14, 16, -2, 0, 10); g.fill(); }
    g.restore(); g.globalAlpha = 1;
  }
  function drawFx(t) {
    var i, q;
    for (i = 0; i < particles.length; i++) {
      q = particles[i]; var a = clamp(q.life / q.max, 0, 1);
      if (q.t === 'spark') { g.globalAlpha = a; g.fillStyle = q.col; g.beginPath(); g.arc(q.x, q.y, q.s * (0.4 + a * 0.6), 0, TAU); g.fill(); }
      else if (q.t === 'petal') { g.globalAlpha = Math.min(1, a * 1.5); g.fillStyle = q.col; g.save(); g.translate(q.x, q.y); g.rotate(q.rot); g.scale(1, 0.55 + Math.abs(Math.sin(q.rot * 2)) * 0.45); g.beginPath(); g.ellipse(0, 0, q.s, q.s * 0.55, 0, 0, TAU); g.fill(); g.restore(); }
      else if (q.t === 'ring') { var k = 1 - a; g.globalAlpha = a; g.strokeStyle = q.col; g.lineWidth = 4 * a + 1; g.beginPath(); g.arc(q.x, q.y, 6 + q.s * k, 0, TAU); g.stroke(); }
    }
    g.globalAlpha = 1;
    for (i = 0; i < popups.length; i++) { q = popups[i]; g.globalAlpha = clamp(1.3 - q.t, 0, 1); txt(q.txt, clamp(q.x, 50, W - 50), q.y, q.size * (q.t < 0.15 ? 0.6 + q.t * 2.7 : 1), q.col, 'center', { stroke: 'rgba(30,10,40,0.85)' }); }
    g.globalAlpha = 1;
    for (i = 0; i < shouts.length; i++) {
      q = shouts[i]; var u = q.t / 1.4, sc = u < 0.12 ? 0.3 + u / 0.12 * 0.95 : u < 0.2 ? 1.25 - (u - 0.12) / 0.08 * 0.25 : 1, al = u > 0.75 ? (1 - u) / 0.25 : 1;
      g.save(); g.translate(W / 2, H * 0.3 + i * 4); g.rotate(-0.07); g.scale(sc, sc); g.globalAlpha = al;
      var size = q.txt.length > 10 ? 44 : 54;
      txt(q.txt, 0, 0, size, q.col, 'center', { stroke: '#4a0d2a', sw: 9, sh: 4, shc: 'rgba(0,0,0,0.4)' });
      g.restore();
    }
    g.globalAlpha = 1;
    if (banner) {
      var b = banner, au = b.t < 0.3 ? b.t / 0.3 : b.t > 2.2 ? (2.6 - b.t) / 0.4 : 1, off = (1 - Math.min(1, b.t / 0.3)) * -30;
      g.globalAlpha = clamp(au, 0, 1);
      txt(b.a, W / 2, H * 0.22 + off, 46, '#fff', 'center', { stroke: '#8a1b3d', sw: 8, sh: 3 });
      txt(b.b, W / 2, H * 0.22 + 38 + off, 15, '#ffeaa8', 'center', { stroke: 'rgba(40,10,40,0.8)', sw: 4 });
      g.globalAlpha = 1;
    }
  }
  function drawHud(t) {
    var p = player;
    txt(String(score), 14, 30, 28, '#fff', 'left', { stroke: 'rgba(40,10,60,0.85)', sw: 5 });
    txt('BEST ' + Math.max(save.hi, score), 15, 52, 11, '#ffe9a8', 'left', { stroke: 'rgba(40,10,60,0.8)', sw: 3 });
    for (var i = 0; i < lives; i++) { Art.drawKiteIcon(g, 21 + i * 22, 78, 0.95, p && p.d ? p.d.cols[0] : '#e8242c', p && p.d ? p.d.cols[1] : '#fff'); }
    // wave pill
    g.fillStyle = 'rgba(30,14,60,0.6)'; Art.rr(g, W / 2 - 38, 12, 76, 26, 13); g.fill();
    txt(tut ? 'TUTORIAL' : 'WAVE ' + wave, W / 2, 26, 14, '#fff', 'center');
    roundBtn('pause', W - 28, 28, 19, function () { g.fillStyle = '#fff'; Art.rr(g, -6, -7, 4.5, 14, 1.5); g.fill(); Art.rr(g, 1.5, -7, 4.5, 14, 1.5); g.fill(); });
    g.fillStyle = 'rgba(30,14,60,0.6)'; Art.rr(g, W - 88, 54, 70, 22, 11); g.fill(); coinIcon(W - 76, 65, 7); txt(String(save.coins), W - 66, 66, 13, '#ffe066', 'left');
    // manja bar
    if (p) {
      var bw = 150, bx = W / 2 - 75, by = 52, f = p.manja / 100, st = strongT > 0;
      g.fillStyle = 'rgba(20,10,40,0.7)'; Art.rr(g, bx - 2, by - 2, bw + 4, 16, 8); g.fill();
      var gr = g.createLinearGradient(bx, 0, bx + bw, 0);
      if (st) { gr.addColorStop(0, '#ffb300'); gr.addColorStop(0.5, '#fff2a0'); gr.addColorStop(1, '#ffb300'); } else { gr.addColorStop(0, f < 0.3 ? '#ff4040' : '#ff9a2e'); gr.addColorStop(1, f < 0.3 ? '#ff7a5a' : '#ffe24a'); }
      g.fillStyle = gr; Art.rr(g, bx, by, Math.max(6, bw * (st ? 1 : f)), 12, 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.3)'; Art.rr(g, bx + 3, by + 1.5, Math.max(2, bw * (st ? 1 : f) - 6), 4, 2); g.fill();
      txt(st ? 'PAKKA MANJA ' + Math.ceil(strongT) + 's' : 'MANJA', W / 2, by + 6.5, 9, '#fff', 'center', { stroke: 'rgba(30,10,40,0.8)', sw: 2.5 });
    }
    if (slowT > 0) { g.fillStyle = 'rgba(30,14,60,0.6)'; Art.rr(g, W / 2 - 42, 72, 84, 20, 10); g.fill(); txt('SLOW-MO ' + Math.ceil(slowT) + 's', W / 2, 82, 11, '#9fdcff', 'center'); }
    if (combo > 1 && !tut) txt('x' + combo + ' COMBO', 14, 100, 14, '#7dff8a', 'left', { stroke: 'rgba(20,50,30,0.85)', sw: 3 });
    // khench button
    if (p && p.alive) {
      var cx = W - 46, cy = H - 66, r = 36, pr = duel ? khenchDown() : pullHeld();
      hits.push({ id: 'khench', x: cx - r - 4, y: cy - r - 4, w: r * 2 + 8, h: r * 2 + 8 });
      var guideK = duel || (tut && tut.step === 1);
      if (guideK) { var gp = 0.5 + 0.5 * Math.sin(t * 8); g.strokeStyle = 'rgba(255,240,120,' + (0.45 + 0.4 * gp) + ')'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, r + 6 + gp * 7, 0, TAU); g.stroke(); }
      g.save(); g.translate(cx, cy); if (pr) g.scale(0.93, 0.93);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(0, 4, r, 0, TAU); g.fill();
      var g2 = g.createLinearGradient(0, -r, 0, r); g2.addColorStop(0, pr ? '#ffe45a' : '#ff9d2e'); g2.addColorStop(1, pr ? '#ff9d2e' : '#e0431f');
      g.fillStyle = g2; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-9, -4); g.lineTo(0, -14); g.lineTo(9, -4); g.moveTo(0, -14); g.lineTo(0, 0); g.stroke();
      txt('KHENCH', 0, 14, 11, '#fff', 'center', { stroke: 'rgba(90,20,10,0.8)', sw: 3 });
      g.restore();
      if (duel) txt('DABAYE RAKHO', cx, cy - r - 12, 9, '#fff6b0', 'center', { stroke: 'rgba(60,20,10,0.9)', sw: 3 });
    }
    // idle / first-time hint (Hinglish)
    var idleS = (p && p.alive && !duel && !tut && Object.keys(ptrs).length === 0) ? T - lastInput : 0;
    if ((hintT > 0 || idleS > 5) && !duel && !tut && waveState !== 'clear' && p && p.alive) {
      var lines;
      var attacker = false; for (var ri = 0; ri < rivals.length; ri++) if (rivals[ri].mode === 'attack') attacker = true;
      if (idleS > 5) {
        var HN = [['Ungli drag karo = patang udao', 'Patang ko dushman ke paas le jao'], ['KHENCH dabao = patang upar jaayegi', 'Neeche wala orange button dabao'], ['Dushman ki dor se apni dor takrao', 'Phir jaldi jaldi TAP = patang kategi!']];
        lines = attacker ? ['Dushman aa raha hai! Ruko ya paas jao', 'Uski dor se apni dor takrao'] : HN[Math.floor((idleS - 5) / 3.5) % 3];
      } else lines = ['Ungli drag karo = patang udao', 'KHENCH dabao = upar + tez | chhodo = dheel'];
      var ha = idleS > 5 ? 0.85 + 0.15 * Math.sin(t * 5) : clamp(hintT, 0, 1);
      g.globalAlpha = ha;
      var hy = H - 250; g.fillStyle = 'rgba(20,10,50,0.7)'; Art.rr(g, 24, hy - 28, W - 48, 56, 14); g.fill(); g.strokeStyle = 'rgba(255,214,120,0.8)'; g.lineWidth = 2; Art.rr(g, 24, hy - 28, W - 48, 56, 14); g.stroke();
      txt(lines[0], W / 2, hy - 8, 15, '#fff', 'center');
      txt(lines[1], W / 2, hy + 13, 12, '#ffe9a8', 'center');
      g.globalAlpha = 1;
    }
  }
  function drawFinger(x, y, press, a) {
    g.save(); g.translate(x, y); g.rotate(-0.22); if (press) g.scale(0.9, 0.9); g.globalAlpha = a == null ? 1 : a;
    g.fillStyle = 'rgba(0,0,0,0.25)'; Art.rr(g, -17, 6, 34, 58, 12); g.fill();
    g.fillStyle = '#ffe3c8'; g.strokeStyle = '#7a4a30'; g.lineWidth = 2.5;
    Art.rr(g, -17, 28, 34, 38, 12); g.fill(); g.stroke();
    Art.rr(g, -9, -2, 18, 44, 9); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; Art.rr(g, -5, 3, 5, 12, 2.5); g.fill();
    g.restore(); g.globalAlpha = 1;
  }
  function drawArrow(x, y, ang, size, col) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.strokeStyle = 'rgba(40,10,40,0.85)'; g.lineWidth = 3; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(size, 0); g.lineTo(0, -size * 0.7); g.lineTo(0, -size * 0.28); g.lineTo(-size * 0.9, -size * 0.28); g.lineTo(-size * 0.9, size * 0.28); g.lineTo(0, size * 0.28); g.lineTo(0, size * 0.7); g.closePath(); g.stroke(); g.fill(); g.restore();
  }
  function drawDuelUI(t) {
    var d = duel; if (!d) return;
    var pu = 0.5 + 0.5 * Math.sin(t * 10);
    // pulsing glow: whole screen edge + the crossing point
    var vg = g.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.78); vg.addColorStop(0, 'rgba(255,190,50,0)'); vg.addColorStop(1, 'rgba(255,160,40,' + (0.2 + 0.25 * pu) + ')'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    var gg = g.createRadialGradient(d.ix, d.iy, 4, d.ix, d.iy, 46 + pu * 16); gg.addColorStop(0, 'rgba(255,255,220,0.95)'); gg.addColorStop(0.4, 'rgba(255,214,90,0.55)'); gg.addColorStop(1, 'rgba(255,170,40,0)');
    g.fillStyle = gg; g.beginPath(); g.arc(d.ix, d.iy, 62, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * pu) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(d.ix, d.iy, 20 + pu * 10, 0, TAU); g.stroke();
    // big instruction
    var sc = 1 + 0.06 * Math.sin(t * 10), alt = Math.floor(d.t / 1.5) % 2, ty = Math.round(H * 0.28);
    g.save(); g.translate(W / 2, ty); g.scale(sc, sc);
    txt('PENCH LADA!', 0, 0, 40, '#ffe066', 'center', { stroke: '#7a1030', sw: 9, sh: 3 });
    g.restore();
    txt(alt === 0 || d.tut ? 'JALDI JALDI TAP KARO!' : 'KHENCH DABAO!', W / 2, ty + 38, 24, '#ffffff', 'center', { stroke: '#7a1030', sw: 6 });
    if (d.msgT > 0) txt(d.msg, W / 2, ty + 74, 26, d.msgCol, 'center', { stroke: 'rgba(30,10,40,0.9)', sw: 6 });
    // tug bar
    var px = 24, py = H - 232, pw = W - 48, ph = 108;
    g.fillStyle = 'rgba(25,10,50,0.82)'; Art.rr(g, px, py, pw, ph, 18); g.fill(); g.strokeStyle = '#ffd78a'; g.lineWidth = 2.5; Art.rr(g, px, py, pw, ph, 18); g.stroke();
    var bx = px + 16, bw = pw - 32, by = py + 30, f = clamp((d.bar + 1) / 2, 0, 1);
    txt('TUM', bx, py + 16, 12, '#9dffa8', 'left'); txt(d.r.name.toUpperCase(), bx + bw, py + 16, 12, '#ff9c8a', 'right');
    g.fillStyle = '#ff6a55'; Art.rr(g, bx, by, bw, 22, 11); g.fill();
    g.fillStyle = '#5fe070'; Art.rr(g, bx, by, Math.max(10, bw * f), 22, 11); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)'; Art.rr(g, bx + 4, by + 3, Math.max(4, bw * f - 8), 6, 3); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; Art.rr(g, bx, by, bw, 22, 11); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(bx + bw * f, by + 11, 11, 0, TAU); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 2; g.stroke();
    var pp = 1 + Math.sin(t * 12) * 0.06;
    g.save(); g.translate(W / 2, py + 82); g.scale(pp, pp); txt('SCREEN PE KAHIN BHI TAP TAP TAP!', 0, 0, 14, '#ffffff', 'center', { stroke: 'rgba(30,10,40,0.85)', sw: 4 }); g.restore();
    // animated finger: always in tutorial, and for the first few real fights
    if (d.tut || save.duels <= 4) {
      var bob = Math.abs(Math.sin(t * 9)), fx = W / 2 - 30, fy = py - 76 + bob * 22;
      g.strokeStyle = 'rgba(255,255,255,' + (0.8 - bob * 0.6) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(fx, py - 54, 8 + (1 - bob) * 22, 0, TAU); g.stroke();
      drawFinger(fx, fy, bob < 0.25);
    }
  }
  function drawTutUI(t) {
    if (!tut || !player) return;
    var p = player, st = tut.step, i;
    button('tutskip', W - 50, 106, 84, 30, 'SKIP >>', 'grey', 12);
    var T0 = ['Ungli ghumao - patang udao', 'KHENCH dabao - upar jao', 'Iski dor se dor takrao', 'Tap tap tap karo!', 'KAI PO CHE! Shabash!'];
    var T1 = ['Screen par ungli drag karo, patang peeche peeche aayegi', 'Neeche orange KHENCH button dabake rakho', 'Apni patang ko is patang ki dor tak le jao', 'Screen par kahin bhi jaldi jaldi tap karo', 'Ab asli khel shuru hota hai...'];
    var py = 128, ph = 76, pu = 0.5 + 0.5 * Math.sin(t * 6);
    g.fillStyle = 'rgba(20,10,50,0.82)'; Art.rr(g, 14, py, W - 28, ph, 16); g.fill(); g.strokeStyle = st === 4 ? '#7dff8a' : '#ffd78a'; g.lineWidth = 2.5; Art.rr(g, 14, py, W - 28, ph, 16); g.stroke();
    g.fillStyle = '#ff7a3d'; Art.rr(g, 24, py + 8, 66, 18, 9); g.fill(); txt('STEP ' + Math.min(st + 1, 4) + '/4', 57, py + 17.5, 11, '#fff', 'center');
    txt(T0[st], W / 2, py + 40, st === 4 ? 26 : 21, st === 4 ? '#7dff8a' : '#ffffff', 'center', { stroke: 'rgba(30,10,40,0.9)', sw: 5 });
    txt(T1[st], W / 2, py + 63, 11.5, '#ffe9a8', 'center', { w: '700' });
    var pr = st === 0 ? tut.prog / 150 : st === 1 ? tut.prog / 1.4 : 0;
    if (st <= 1) { g.fillStyle = 'rgba(255,255,255,0.15)'; Art.rr(g, 100, py + 14, W - 100 - 26, 6, 3); g.fill(); g.fillStyle = '#7dff8a'; Art.rr(g, 100, py + 14, Math.max(4, (W - 126) * clamp(pr, 0, 1)), 6, 3); g.fill(); }
    if (tut.okT > 0) {
      g.fillStyle = 'rgba(40,200,90,0.9)'; g.beginPath(); g.arc(W - 40, py + 40, 20, 0, TAU); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(W - 49, py + 40); g.lineTo(W - 42, py + 47); g.lineTo(W - 30, py + 32); g.stroke();
      return;
    }
    if (st === 0) {
      // drag hint: finger sweeping left-right below the kite, arrows both sides
      var sw = Math.sin(t * 2.2), fx = clamp(p.x, 70, W - 70) + sw * 70, fy = Math.min(p.y + 90, H - 250);
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 4; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(fx - 70 - sw * 0, fy + 6); g.lineTo(fx + 0, fy + 6); g.stroke(); g.setLineDash([]);
      drawArrow(p.x - 62 - pu * 6, p.y, Math.PI, 20, '#ffe066'); drawArrow(p.x + 62 + pu * 6, p.y, 0, 20, '#ffe066');
      drawFinger(fx, fy, false);
    } else if (st === 1) {
      var bx = W - 46, by = H - 66;
      drawArrow(bx - 4, by - 98 - pu * 8, Math.PI / 2, 24, '#ffe066');
      drawFinger(bx + 4, by - 6 + (khenchDown() ? 6 : 0), khenchDown(), 0.92);
    } else if (st === 2 && tut.dummy && rivals.indexOf(tut.dummy) >= 0) {
      var r = tut.dummy, a = Math.atan2(r.y - p.y, r.x - p.x), dist = Math.hypot(r.x - p.x, r.y - p.y);
      g.strokeStyle = 'rgba(255,230,120,' + (0.5 + 0.4 * pu) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(r.x, r.y, 36 + pu * 6, 0, TAU); g.stroke();
      if (dist > 70) drawArrow(p.x + Math.cos(a) * (46 + pu * 8), p.y + Math.sin(a) * (46 + pu * 8), a, 20, '#ffe066');
      txt('IDHAR!', r.x, r.y - r.h * 0.5 - 24, 14, '#ffe066', 'center', { stroke: 'rgba(40,10,40,0.9)', sw: 4 });
    }
  }
  function drawOffscreen(rv, t) {
    if (!(rv.x < 6 || rv.x > W - 6 || rv.y < 60)) return;
    var ex = clamp(rv.x, 24, W - 24), ey = clamp(rv.y, 112, H - 330), a = Math.atan2(rv.y - ey, rv.x - ex), pu = 0.5 + 0.5 * Math.sin(t * 8);
    if (Math.hypot(rv.x - ex, rv.y - ey) < 2) return;
    g.save(); g.translate(ex, ey);
    g.fillStyle = 'rgba(20,10,50,0.75)'; g.beginPath(); g.arc(0, 0, 17 + pu * 2, 0, TAU); g.fill(); g.strokeStyle = rv.cols[0]; g.lineWidth = 3; g.stroke();
    g.rotate(a); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(11, 0); g.lineTo(-4, -8); g.lineTo(-4, 8); g.closePath(); g.fill();
    g.restore();
    txt(rv.name, clamp(ex + (ex < W / 2 ? 36 : -36), 34, W - 34), ey, 10, '#fff', 'center', { stroke: 'rgba(30,10,40,0.85)', sw: 3 });
  }
  function drawPlay(t, dt) {
    var wm = 1 + (pullHeld() ? 0.6 : 0);
    drawBackdrop(t, dt * ts, wm);
    drawWind(t, dt * ts, wm);
    var i;
    for (i = 0; i < falling.length; i++) { var f = falling[i]; Art.drawStringPts(g, f.str, f.isPlayer ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)', 1.1); drawKiteObj(f, t, 1); }
    drawCity(t);
    sceneTint();
    var p = player;
    // player person + string anchor
    var tx = p && p.alive ? p.x : W / 2, ty = p && p.alive ? p.y : H - 300;
    var ang = Math.atan2(ty - (H - 62), tx - (W / 2 + 8)); if (ang > -0.3) ang = -0.3; if (ang < -2.8) ang = -2.8;
    var hand = Art.drawPerson(g, W / 2 - 6, H - 20, 1.2, playerPerson, t, p && p.alive ? 1 : 2, cheerT > 0 ? 1 : 0, ang);
    if (p && hand) { p.ax = hand.hx; p.ay = hand.hy; }
    for (i = 0; i < rivals.length; i++) { var r = rivals[i]; Art.drawStringPts(g, r.str, r.mode === 'duel' ? '#ffd9a0' : 'rgba(255,255,255,0.78)', r.mode === 'duel' ? 1.8 : 1.2); }
    if (p && p.alive) { var sc = strongT > 0; Art.drawStringPts(g, p.str, sc ? '#ffe27a' : '#ffffff', sc ? 1.9 : 1.5, sc ? 'rgba(255,190,40,0.55)' : 'rgba(120,200,255,0.35)'); }
    for (i = 0; i < items.length; i++) drawItem(items[i], t);
    for (i = 0; i < rivals.length; i++) {
      var rv = rivals[i]; drawKiteObj(rv, t, 1);
      txt(rv.name, rv.x, rv.y - rv.h * 0.5 - 9, 10, '#fff', 'center', { stroke: 'rgba(30,10,40,0.85)', sw: 3 });
      if (rv.mode === 'attack' && Math.sin(t * 14) > -0.2) txt('!', rv.x + rv.w * 0.5 + 4, rv.y - rv.h * 0.5, 18, '#ff4a3a', 'center', { stroke: '#fff', sw: 3 });
    }
    if (p && p.alive && p.immuneT > 0 && !tut) { var sp2 = 0.5 + 0.5 * Math.sin(t * 6), sg = g.createRadialGradient(p.x, p.y, 10, p.x, p.y, 44); sg.addColorStop(0, 'rgba(150,230,255,0)'); sg.addColorStop(1, 'rgba(150,230,255,' + (0.35 + 0.25 * sp2) + ')'); g.fillStyle = sg; g.beginPath(); g.arc(p.x, p.y, 44, 0, TAU); g.fill(); g.strokeStyle = 'rgba(190,240,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, 36 + sp2 * 3, 0, TAU); g.stroke(); txt('SURAKSHIT', p.x, p.y - 50, 10, '#bff0ff', 'center', { stroke: 'rgba(20,10,50,0.85)', sw: 3 }); }
    if (p && p.alive) { var fl = p.immuneT > 0 ? (Math.sin(t * 24) > 0 ? 1 : 0.4) : 1; drawKiteObj(p, t, fl); if (p.immuneT <= 0 && !duel && waveState === 'fight') { /* arrow marker */ g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(p.x, p.y - 38); g.lineTo(p.x - 5, p.y - 46); g.lineTo(p.x + 5, p.y - 46); g.closePath(); g.fill(); } }
    if (duel) { g.fillStyle = 'rgba(0,0,0,' + clamp(duel.t * 2, 0, 0.18) + ')'; g.fillRect(0, 0, W, H); drawKiteObj(duel.r, t, 1); if (p.alive) drawKiteObj(p, t, 1); }
    for (i = 0; i < rivals.length; i++) drawOffscreen(rivals[i], t);
    drawFx(t);
    drawHud(t);
    drawDuelUI(t);
    drawTutUI(t);
    if (paused) {
      g.fillStyle = 'rgba(10,5,30,0.7)'; g.fillRect(0, 0, W, H);
      panel(70, H / 2 - 130, 260, 260);
      txt('PAUSE', W / 2, H / 2 - 92, 34, '#fff', 'center', { stroke: '#6a1b4a', sw: 6 });
      button('resume', W / 2, H / 2 - 30, 190, 52, 'RESUME', 'green', 22);
      button('sound', W / 2, H / 2 + 36, 190, 44, save.sound ? 'SOUND: ON' : 'SOUND: OFF', 'purple', 17);
      button('quit', W / 2, H / 2 + 96, 190, 44, 'MAIN MENU', 'grey', 17);
    }
  }

  /* ---------- screens ---------- */
  function drawIntro(t) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0e0626'); gr.addColorStop(0.6, '#3a1250'); gr.addColorStop(1, '#8a2a50'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var r = Art.mulberry(5); g.fillStyle = '#fff';
    for (var i = 0; i < 60; i++) { var x = r() * W, y = r() * H * 0.7, tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); g.globalAlpha = 0.25 + 0.5 * tw * (1 - y / (H * 0.8)); g.fillRect(x, y, 1.6, 1.6); }
    g.globalAlpha = 1;
    for (var k = 0; k < introKites.length; k++) {
      var kk = introKites[k], u = clamp((t - kk.d) / 3.2, 0, 1.4);
      var nx = lerp(kk.x0, kk.x1, u) + Math.sin(t * 2 + k) * 14, ny = lerp(H + 60, kk.y1, Math.min(1, u * 1.1)) + Math.sin(t * 1.7 + k * 2) * 8;
      kk.vx = clamp(nx - kk.x, -6, 6); kk.x = nx; kk.y = ny; kk.rot += (kk.vx * 0.07 - kk.rot) * 0.1; updateTail(kk, t);
      kk.w = 40 * kk.sc; kk.h = 48 * kk.sc; g.globalAlpha = clamp(u * 3, 0, 1) * 0.9; drawKiteObj(kk, t, 1);
      g.globalAlpha = 0.5; g.strokeStyle = '#fff'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(W / 2 + (k - 1.5) * 40, H + 10); g.quadraticCurveTo((kk.x + W / 2) / 2, (kk.y + H) / 2 + 40, kk.x, kk.y + 10); g.stroke(); g.globalAlpha = 1;
    }
    var a1 = clamp((t - 0.5) / 0.7, 0, 1), a2 = clamp((t - 1.3) / 0.7, 0, 1), a3 = clamp((t - 2.0) / 0.6, 0, 1), out = clamp((t - 3.6) / 0.5, 0, 1);
    g.save(); g.globalAlpha = a1 * (1 - out); var cy = H * 0.42;
    var s = 0.9 + a1 * 0.1; g.translate(W / 2, cy - 54); g.scale(s, s); Art.drawKiteIcon(g, 0, 0, 2.6, '#ff5a2a', '#ffd23c'); g.restore();
    g.globalAlpha = a2 * (1 - out); spaced('ADITYA SOLANKI', W / 2, cy + 14, 30, '#fff', 3, { stroke: 'rgba(0,0,0,0.4)' });
    g.globalAlpha = a2 * (1 - out); spaced('GAMES', W / 2, cy + 52, 24, '#ffd23c', 14);
    g.globalAlpha = a3 * (1 - out); txt('presents', W / 2, cy + 92, 16, '#d9c8ff', 'center', { w: '600' });
    g.globalAlpha = 1;
    var sh = (t - 0.9) * 340 - 80; if (a2 > 0 && out < 1) { g.save(); g.beginPath(); g.rect(W / 2 - 150, cy - 6, 300, 40); g.clip(); var sg = g.createLinearGradient(sh - 30, 0, sh + 30, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(sh - 30, cy - 6, 60, 40); g.restore(); }
    if (t > 1.5) txt('TAP TO SKIP', W / 2, H - 30, 11, 'rgba(255,255,255,' + (0.3 + 0.2 * Math.sin(t * 4)) + ')', 'center', { w: '600' });
    if (t > 4.0) setState('title');
  }
  function drawTitle(t, dt) {
    drawBackdrop(t, dt, 1); drawWind(t, dt, 1);
    // demo duel
    var d = demo, ky = H * 0.43;
    d.A.x = 118 + Math.sin(t * 0.9) * 26; d.A.y = ky + Math.cos(t * 1.1) * 14; d.A.rot = Math.sin(t * 1.3) * 0.2 + 0.1;
    d.B.x = 282 + Math.sin(t * 0.8 + 2) * 26; d.B.y = ky - 6 + Math.cos(t * 1.0 + 1) * 14; d.B.rot = Math.sin(t * 1.2 + 1) * 0.2 - 0.1;
    d.A.ax = W * 0.82; d.A.ay = H - 40; d.B.ax = W * 0.18; d.B.ay = H - 40;
    Art.stringPoints(d.A.str, d.A.ax, d.A.ay, d.A.x, d.A.y + 8, 24, t, 1); Art.stringPoints(d.B.str, d.B.ax, d.B.ay, d.B.x, d.B.y + 8, 24, t, 3);
    updateTail(d.A, t); updateTail(d.B, t);
    drawCity(t); sceneTint();
    Art.drawStringPts(g, d.A.str, 'rgba(255,255,255,0.85)', 1.3); Art.drawStringPts(g, d.B.str, 'rgba(255,255,255,0.85)', 1.3);
    drawKiteObj(d.A, t, 1); drawKiteObj(d.B, t, 1);
    var hx = strCross(d.A.str, d.B.str); if (hx && Math.random() < 0.5) sparks(hx.x, hx.y, 2, ['#fff7c0', '#ffd23c'], 90, 0.5);
    updateFx(dt); drawFx(t);
    // title text
    var ty = Math.round(H * 0.13) + 24, pu = 1 + Math.sin(t * 2) * 0.012;
    var sl = clamp(stateT / 0.5, 0, 1), e = 1 - Math.pow(1 - sl, 3);
    g.save(); g.globalAlpha = e; g.translate(W / 2, ty + (1 - e) * -40); g.scale(pu, pu);
    txt('MAKAR SANKRANTI SPECIAL', 0, -52, 11, '#fff', 'center', { w: '800', sh: 1.5 });
    var rg = g.createLinearGradient(0, -34, 0, 34);
    g.save(); g.rotate(-0.04);
    txt('PATANG', 0, 0, 78, '#ffd23c', 'center', { stroke: '#7a1030', sw: 13, sh: 6, shc: 'rgba(60,0,30,0.45)' });
    txt('LADAI', 0, 68, 78, '#ff6a3d', 'center', { stroke: '#7a1030', sw: 13, sh: 6, shc: 'rgba(60,0,30,0.45)' });
    g.restore(); g.restore();
    if (e > 0.7) {
      button('play', W / 2, H - 300, 230, 68, 'PLAY', 'orange', 34);
      if (!save.tutDone) txt('Pehle chhota tutorial hoga', W / 2, H - 258, 11, '#ffe9a8', 'center', { stroke: 'rgba(30,10,50,0.85)', sw: 3, w: '700' });
      button('shop', W / 2 - 82, H - 214, 150, 48, 'KITES', 'purple', 18);
      button('how', W / 2 + 82, H - 214, 150, 48, 'HOW TO PLAY', 'teal', 14);
    }
    roundBtn('sound', W - 30, 30, 20, function () { drawSpeaker(save.sound); });
    g.fillStyle = 'rgba(30,14,60,0.6)'; Art.rr(g, 12, 14, 110, 32, 16); g.fill(); coinIcon(30, 30, 9); txt(String(save.coins), 44, 31, 16, '#ffe066', 'left');
    if (save.hi > 0) { g.fillStyle = 'rgba(30,14,60,0.6)'; Art.rr(g, 12, 52, 110, 24, 12); g.fill(); txt('BEST ' + save.hi, 22, 64, 12, '#fff', 'left'); }
    txt('Developer: Aditya Solanki', W / 2, H - 14, 13, '#fff', 'center', { stroke: 'rgba(30,10,50,0.85)', sw: 4, w: '800' });
  }
  function drawSpeaker(on) {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-9, -4); g.lineTo(-4, -4); g.lineTo(2, -9); g.lineTo(2, 9); g.lineTo(-4, 4); g.lineTo(-9, 4); g.closePath(); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineCap = 'round';
    if (on) { g.beginPath(); g.arc(3, 0, 5, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(3, 0, 9, -0.9, 0.9); g.stroke(); }
    else { g.strokeStyle = '#ff7a7a'; g.beginPath(); g.moveTo(6, -5); g.lineTo(13, 5); g.moveTo(13, -5); g.lineTo(6, 5); g.stroke(); }
  }
  function dimBackdrop(t, dt) { drawBackdrop(t, dt, 1); drawCity(t); g.fillStyle = 'rgba(15,6,40,0.55)'; g.fillRect(0, 0, W, H); }
  function drawHow(t, dt) {
    dimBackdrop(t, dt);
    txt('KAISE KHELE', W / 2, 44, 34, '#fff', 'center', { stroke: '#6a1b4a', sw: 7 });
    panel(16, 74, W - 32, H - 74 - 150);
    var steps = [
      ['1', 'UDAO', 'Ungli screen par drag karo. Patang usi taraf udegi.', '#37d5c3'],
      ['2', 'KHENCH', 'KHENCH button dabao: patang upar jaati hai, tez udti hai. Chhodo = dheel.', '#ffb02e'],
      ['3', 'KAATO', 'Dushman ki dor se apni dor takrao. Dushman khud tumhare paas aayega!', '#ff6b6b'],
      ['4', 'PENCH', 'Dor takrayi to screen par jaldi jaldi TAP karo (ya KHENCH dabaye rakho). Tumhara bar bhar gaya = dushman ki patang kat gayi!', '#b06cff'],
      ['5', 'POWER', '5 patang milti hain. Item pakdo: Pakka Manja, Slow-mo, Extra Patang.', '#6fe36a']
    ];
    var y = 100, avail = H - 74 - 150 - 30, per = avail / 5;
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i], cy = y + i * per + 4;
      g.fillStyle = s[3]; g.beginPath(); g.arc(46, cy + 14, 15, 0, TAU); g.fill(); txt(s[0], 46, cy + 15, 17, '#fff', 'center', { stroke: 'rgba(0,0,0,0.3)', sw: 3 });
      txt(s[1], 70, cy + 8, 16, s[3], 'left', { stroke: 'rgba(20,5,40,0.8)', sw: 4 });
      var fs = per > 95 ? 14 : 12, ls = wrap(s[2], W - 32 - 70 - 12, fs);
      for (var j = 0; j < ls.length; j++) txt(ls[j], 70, cy + 30 + j * (fs + 4), fs, '#f1e9ff', 'left', { w: '600' });
    }
    button('tutor', W / 2, H - 100, 270, 50, 'TUTORIAL KHELO', 'green', 20);
    button('back', W / 2, H - 40, 190, 50, 'BACK', 'orange', 22);
  }
  function setShopKite() { shopKite = makeKite(0, 0, DESIGNS[shopIdx]); shopKite.w = 44; shopKite.h = 52; }
  function drawShop(t, dt) {
    dimBackdrop(t, dt);
    var d = DESIGNS[shopIdx], owned = save.owned.indexOf(d.id) >= 0, sel = save.sel === d.id;
    txt('KITES', W / 2, 40, 34, '#fff', 'center', { stroke: '#6a1b4a', sw: 7 });
    g.fillStyle = 'rgba(30,14,60,0.7)'; Art.rr(g, W - 112, 18, 98, 30, 15); g.fill(); coinIcon(W - 96, 33, 9); txt(String(save.coins), W - 82, 34, 16, '#ffe066', 'left');
    panel(20, 70, W - 40, 370);
    txt(d.name.toUpperCase(), W / 2, 104, 26, '#ffd23c', 'center', { stroke: '#4a0d2a', sw: 6 });
    var ls = wrap(d.perk, W - 120, 13); for (var i = 0; i < ls.length; i++) txt(ls[i], W / 2, 134 + i * 16, 13, '#fff', 'center', { w: '700' });
    if (!shopKite) setShopKite();
    var k = shopKite; k.x = Math.sin(t * 1.4) * 6; k.y = Math.cos(t * 1.1) * 5; k.rot = Math.sin(t * 1.6) * 0.12; updateTail(k, t);
    g.save(); g.beginPath(); Art.rr(g, 24, 160, W - 48, 276, 14); g.clip(); g.translate(W / 2, 222); g.scale(2, 2); drawKiteObj(k, t, owned ? 1 : 0.9); g.restore();
    if (!owned) { g.fillStyle = 'rgba(20,10,50,0.8)'; Art.rr(g, W / 2 - 20, 395, 40, 24, 12); g.fill(); g.fillStyle = '#ffd23c'; Art.rr(g, W / 2 - 6, 405, 12, 9, 2); g.fill(); g.strokeStyle = '#ffd23c'; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, 405, 4.5, Math.PI, 0); g.stroke(); }
    roundBtn('prev', 44, 262, 22, function () { g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(3, -9); g.lineTo(-5, 0); g.lineTo(3, 9); g.stroke(); }, 'purple');
    roundBtn('next', W - 44, 262, 22, function () { g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-3, -9); g.lineTo(5, 0); g.lineTo(-3, 9); g.stroke(); }, 'purple');
    for (var j = 0; j < DESIGNS.length; j++) { g.fillStyle = j === shopIdx ? '#ffd23c' : 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(W / 2 + (j - 3) * 16, 458, j === shopIdx ? 4.5 : 3.2, 0, TAU); g.fill(); }
    if (sel) button('act', W / 2, 508, 230, 56, 'SELECTED', 'grey', 22);
    else if (owned) button('act', W / 2, 508, 230, 56, 'SELECT', 'green', 24);
    else button('act', W / 2, 508, 230, 56, 'BUY  ' + d.price, save.coins >= d.price ? 'orange' : 'grey', 24);
    if (!owned) coinIcon(W / 2 + 82, 508, 10);
    if (shopMsg > 0) { g.globalAlpha = clamp(shopMsg, 0, 1); txt(toast || '', W / 2, 560, 14, '#ffb0a0', 'center', { stroke: 'rgba(30,10,40,0.9)', sw: 4 }); g.globalAlpha = 1; shopMsg -= dt; }
    button('back', W / 2, H - 46, 190, 50, 'BACK', 'orange', 22);
  }
  function drawOver(t, dt) {
    dimBackdrop(t, dt); updateFx(dt); drawFx(t);
    var e = 1 - Math.pow(1 - clamp(stateT / 0.5, 0, 1), 3);
    g.save(); g.translate(W / 2, H / 2 - 20); g.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e); g.globalAlpha = e;
    panel(-165, -230, 330, 432);
    txt('GAME OVER', 0, -190, 36, '#ff7a6a', 'center', { stroke: '#4a0d1a', sw: 8, sh: 3 });
    txt('Saari patang kat gayi!', 0, -155, 13, '#ffd9d0', 'center', { w: '600' });
    txt('SCORE', 0, -122, 13, '#d9c8ff', 'center');
    txt(String(score), 0, -88, 52, '#fff', 'center', { stroke: '#6a1b4a', sw: 9 });
    if (newBest) { var s = 1 + Math.sin(t * 8) * 0.06; g.save(); g.translate(0, -48); g.scale(s, s); txt('NEW BEST!', 0, 0, 22, '#ffd23c', 'center', { stroke: '#7a3a00', sw: 5 }); g.restore(); }
    else txt('BEST ' + save.hi, 0, -48, 18, '#ffe9a8', 'center', { stroke: 'rgba(40,10,40,0.8)', sw: 4 });
    var rows = [['Wave', wave], ['Patang kaati', cuts], ['Coins mile', '+' + coinsEarned]];
    for (var i = 0; i < 3; i++) { var yy = -12 + i * 26; g.fillStyle = 'rgba(255,255,255,0.08)'; Art.rr(g, -130, yy - 11, 260, 22, 8); g.fill(); txt(rows[i][0], -120, yy, 14, '#e6dcff', 'left', { w: '700' }); txt(String(rows[i][1]), 120, yy, 15, i === 2 ? '#ffe066' : '#fff', 'right'); }
    button('again', 0, 100, 220, 58, 'PHIR KHELO', 'orange', 24);
    button('shop', -62, 156, 118, 42, 'KITES', 'purple', 15);
    button('menu', 62, 156, 118, 42, 'MENU', 'teal', 15);
    g.restore();
  }

  /* ---------- state machine ---------- */
  function setState(s) {
    if (trans) return;
    trans = { to: s, t: 0, sw: false };
  }
  function onEnter(s) {
    if (s === 'title') { targetD = 0.3; shouts = []; banner = null; paused = false; Snd.setIntensity(0); duel = null; particles = []; }
    else if (s === 'shop') { shopIdx = Math.max(0, DESIGNS.indexOf(design(save.sel))); setShopKite(); shopMsg = 0; }
    else if (s === 'over') { shouts = []; banner = null; petals(W / 2, 120, 26, 220); }
    else if (s === 'play') { Snd.setIntensity(0.4); }
  }
  function activate(id) {
    Snd.sfx.click();
    if (id === 'play') startGame();
    else if (id === 'again') startGame('real');
    else if (id === 'tutor') startGame('tut');
    else if (id === 'tutskip') { save.tutDone = true; persist(); tut = null; startGame('real'); }
    else if (id === 'shop') setState('shop');
    else if (id === 'how') setState('how');
    else if (id === 'back' || id === 'menu') setState('title');
    else if (id === 'quit') { paused = false; setState('title'); }
    else if (id === 'sound') { save.sound = !save.sound; Snd.setMuted(!save.sound); persist(); }
    else if (id === 'pause') { paused = true; }
    else if (id === 'resume') { paused = false; }
    else if (id === 'prev') { shopIdx = (shopIdx + DESIGNS.length - 1) % DESIGNS.length; setShopKite(); }
    else if (id === 'next') { shopIdx = (shopIdx + 1) % DESIGNS.length; setShopKite(); }
    else if (id === 'act') {
      var d = DESIGNS[shopIdx], owned = save.owned.indexOf(d.id) >= 0;
      if (owned) { save.sel = d.id; persist(); }
      else if (save.coins >= d.price) { save.coins -= d.price; save.owned.push(d.id); save.sel = d.id; persist(); Snd.sfx.buy(); petals(W / 2, 220, 30, 220); sparks(W / 2, 220, 20, ['#ffd23c', '#fff'], 220, 0.8); }
      else { toast = 'Coins kam hain! Patang kaato, coins kamao.'; shopMsg = 2; Snd.sfx.miss(); }
    }
  }

  /* ---------- input ---------- */
  function toL(e) { return { x: (e.clientX - offX) / scale, y: (e.clientY - offY) / scale }; }
  function hitAt(x, y) { for (var i = hits.length - 1; i >= 0; i--) { var h = hits[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h; } return null; }
  function firstGesture() {
    Snd.init(); Snd.resume();
    if (!fsTried) {
      fsTried = true;
      try { var el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen; if (rq) { var pr = rq.call(el, { navigationUI: 'hide' }); if (pr && pr.catch) pr.catch(function () { }); } } catch (e) { }
      try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(function () { }); } catch (e2) { }
    }
  }
  cv.addEventListener('pointerdown', function (e) {
    e.preventDefault(); firstGesture(); if (trans) return;
    var p = toL(e), ptr = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, lx: p.x, ly: p.y, still: 0, role: 'none', btn: null };
    ptrs[e.pointerId] = ptr; try { cv.setPointerCapture(e.pointerId); } catch (er) { }
    if (STATE === 'intro') { if (T > 0.4) setState('title'); return; }
    var h = hitAt(p.x, p.y);
    if (STATE === 'play' && !paused) {
      lastInput = T;
      if (h && h.id === 'khench') { ptr.role = 'pull'; if (duel) duelTap(); }
      else if (h && (h.id === 'pause' || h.id === 'tutskip')) { ptr.role = 'btn'; ptr.btn = h.id; pressedId = h.id; }
      else if (duel) { ptr.role = 'tap'; duelTap(); }
      else if (player && player.alive) { ptr.role = 'steer'; ptr.kx = player.x; ptr.ky = player.y; }
    } else if (h) { ptr.role = 'btn'; ptr.btn = h.id; pressedId = h.id; }
    else if (STATE === 'shop') ptr.role = 'swipe';
  }, { passive: false });
  cv.addEventListener('pointermove', function (e) {
    e.preventDefault(); var ptr = ptrs[e.pointerId]; if (!ptr) return;
    var p = toL(e);
    if (ptr.role === 'steer' && tut && tut.step === 0 && !tut.okT) tut.prog += Math.hypot(p.x - ptr.x, p.y - ptr.y);
    ptr.x = p.x; ptr.y = p.y; lastInput = T;
    if (ptr.role === 'btn') { var h = hitAt(p.x, p.y); pressedId = h && h.id === ptr.btn ? ptr.btn : null; }
  }, { passive: false });
  function endPtr(e, cancel) {
    var ptr = ptrs[e.pointerId]; if (!ptr) return;
    var p = toL(e);
    if (ptr.role === 'btn') { var h = hitAt(p.x, p.y); if (!cancel && h && h.id === ptr.btn && !trans) activate(ptr.btn); pressedId = null; }
    else if (ptr.role === 'swipe' && !cancel && STATE === 'shop') { var dx = p.x - ptr.sx; if (Math.abs(dx) > 45) activate(dx < 0 ? 'next' : 'prev'); }
    delete ptrs[e.pointerId];
  }
  cv.addEventListener('pointerup', function (e) { e.preventDefault(); endPtr(e, false); }, { passive: false });
  cv.addEventListener('pointercancel', function (e) { endPtr(e, true); });
  ['touchstart', 'touchmove', 'gesturestart', 'contextmenu'].forEach(function (n) { document.addEventListener(n, function (e) { e.preventDefault(); }, { passive: false }); });
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', function () { setTimeout(resize, 150); });
  function autoPause() { if (STATE === 'play' && !trans) paused = true; ptrs = {}; Snd.suspend(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) autoPause(); else Snd.resume(); });
  window.addEventListener('blur', function () { if (STATE === 'play') paused = true; });

  /* ---------- main loop ---------- */
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (trans) {
      trans.t += dt;
      if (!trans.sw && trans.t >= 0.18) { trans.sw = true; STATE = trans.to; stateT = 0; onEnter(STATE); }
      fadeA = trans.t < 0.18 ? trans.t / 0.18 : 1 - (trans.t - 0.18) / 0.18;
      if (trans.t >= 0.36) { trans = null; fadeA = 0; }
    }
    stateT += dt;
    sceneD += (targetD - sceneD) * Math.min(1, dt * 0.5);
    shake *= Math.exp(-dt * 7); if (shake < 0.2) shake = 0; flash = Math.max(0, flash - dt * 2.4);
    if (STATE === 'play') updatePlay(dt); else { T += dt; if (cheerT > 0) cheerT -= dt; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#12082a'; g.fillRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    if (shake > 0) g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    hits.length = 0;
    var t = T;
    if (STATE === 'intro') drawIntro(t);
    else if (STATE === 'title') drawTitle(t, dt);
    else if (STATE === 'how') drawHow(t, dt);
    else if (STATE === 'shop') drawShop(t, dt);
    else if (STATE === 'play') drawPlay(t, dt);
    else if (STATE === 'over') drawOver(t, dt);
    if (flash > 0) { g.globalAlpha = Math.min(0.8, flash); g.fillStyle = flashCol; g.fillRect(-20, -20, W + 40, H + 40); g.globalAlpha = 1; }
    g.restore();
    if (fadeA > 0) { g.fillStyle = 'rgba(12,5,30,' + clamp(fadeA, 0, 1) + ')'; g.fillRect(0, 0, W, H); }
  }

  /* ---------- boot ---------- */
  demo = { A: makeKite(0, 0, DESIGNS[0]), B: makeKite(0, 0, { pat: 'quarters', cols: ['#00897b', '#ffffff'] }) };
  demo.A.w = 50; demo.A.h = 60; demo.B.w = 50; demo.B.h = 60;
  var ik = [['split', ['#e8242c', '#ffd23c']], ['quarters', ['#1e63d6', '#ffffff']], ['star', ['#ff4fa3', '#fff2a8']], ['tiranga', ['#ff9933', '#ffffff', '#138808']]];
  for (var q = 0; q < 4; q++) { var k = makeKite(0, H + 60, { pat: ik[q][0], cols: ik[q][1] }); k.x0 = 60 + q * 90; k.x1 = 70 + q * 85; k.y1 = 110 + (q % 2) * 70 + q * 12; k.d = 0.2 + q * 0.3; k.sc = 0.9 + (q % 2) * 0.3; introKites.push(k); }
  resize();
  requestAnimationFrame(frame);

  window.__PL = {
    state: function () { return { s: STATE, score: score, lives: lives, wave: wave, duel: !!duel, bar: duel ? duel.bar : null, tut: tut ? tut.step : -1, tutDone: save.tutDone, rivals: rivals.length, falling: falling.length, paused: paused, ts: ts, H: H }; },
    start: function () { startGame(); },
    setState: function (s) { STATE = s; stateT = 0; trans = null; fadeA = 0; onEnter(s); },
    forceDuel: function () { if (!rivals.length || !player || !player.alive) return false; var r = rivals[0]; r.x = player.x + 40; r.y = player.y - 30; var pt = { x: (player.x + r.x) / 2, y: (player.y + r.y) / 2 }; player.immuneT = 0; startDuel(r, pt); return true; },
    tapDuel: function () { duelTap(); }, duelBar: function () { return duel ? duel.bar : null; }, tutState: function () { return tut ? { step: tut.step, prog: tut.prog, okT: tut.okT, dummy: tut.dummy ? { x: tut.dummy.x, y: tut.dummy.y } : null } : null; }, startTut: function () { startGame('tut'); }, resetTut: function () { save.tutDone = false; persist(); },
    winDuel: function () { if (duel) resolveDuel(true); }, loseDuel: function () { if (duel) resolveDuel(false); },
    coins: function (n) { save.coins = n; persist(); }, player: function () { return player; }, dayT: function (d) { targetD = d; sceneD = d; }, shopIdx: function (i) { shopIdx = i; setShopKite(); },
    clear: function () { rivals.length = 0; clearWave(); }
  };
})();
