/* Patang Ladai - all art is drawn in code (no external assets) */
var Art = (function () {
  'use strict';
  var CH = 210; // city strip height
  var FONT = '"Arial Black","Impact","Roboto","Helvetica Neue",system-ui,sans-serif';

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hex(c) {
    if (c.length === 4) return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)];
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }

  /* ---------------- sky ---------------- */
  var K = [
    ['#2a7fe2', '#5fb6f6', '#a9defc', '#fff0c4'],
    ['#3a72d2', '#79a9e6', '#ffd29c', '#ffb26a'],
    ['#241a66', '#8a3d9c', '#ff6b6c', '#ffc35c']
  ];
  function skyStops(d) {
    var a, b, t;
    if (d < 0.5) { a = K[0]; b = K[1]; t = d * 2; } else { a = K[1]; b = K[2]; t = (d - 0.5) * 2; }
    return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)];
  }
  function drawSky(g, W, H, d) {
    var s = skyStops(d);
    var gr = g.createLinearGradient(0, 0, 0, H - CH + 50);
    gr.addColorStop(0, s[0]); gr.addColorStop(0.38, s[1]); gr.addColorStop(0.72, s[2]); gr.addColorStop(1, s[3]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function sunPos(W, H, d) {
    var k = Math.pow(d, 1.4);
    return { x: W * 0.72, y: (H * 0.26) + k * (H - CH - 20 - H * 0.26) };
  }
  function drawSun(g, W, H, d, t) {
    var p = sunPos(W, H, d);
    var col = mix('#fffbe2', '#ffa13c', d);
    var rg = g.createRadialGradient(p.x, p.y, 10, p.x, p.y, 170 + Math.sin(t * 0.8) * 6);
    rg.addColorStop(0, 'rgba(255,240,190,' + (0.55 + d * 0.15) + ')'); rg.addColorStop(0.4, 'rgba(255,190,120,0.22)'); rg.addColorStop(1, 'rgba(255,170,100,0)');
    g.fillStyle = rg; g.fillRect(p.x - 180, p.y - 180, 360, 360);
    g.fillStyle = col; g.beginPath(); g.arc(p.x, p.y, 34 + d * 6, 0, 6.2832); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(p.x - 8, p.y - 9, 14, 0, 6.2832); g.fill();
  }

  /* ---------------- clouds ---------------- */
  var cloudSprites = null;
  function makeClouds() {
    var tints = [['#ffffff', '#cfe3fa'], ['#fff4e2', '#ffc58e'], ['#ffd9cc', '#b8649c']];
    var shapes = [
      [[30, 44, 22], [58, 34, 28], [92, 38, 26], [120, 46, 20], [76, 50, 26]],
      [[26, 46, 18], [50, 36, 24], [80, 30, 26], [108, 40, 22], [134, 48, 16], [78, 52, 24]],
      [[24, 44, 20], [52, 38, 22], [84, 44, 24], [110, 50, 16]],
      [[34, 46, 20], [64, 32, 30], [102, 36, 28], [134, 46, 22], [90, 52, 28], [52, 54, 22]]
    ];
    cloudSprites = tints.map(function (tn) {
      return shapes.map(function (sh) {
        var c = document.createElement('canvas'); c.width = 170; c.height = 80; var g = c.getContext('2d');
        sh.forEach(function (ci) {
          var col = mix(tn[0], tn[1], Math.min(1, Math.max(0, (ci[1] - 24) / 40)));
          var rg = g.createRadialGradient(ci[0], ci[1], 0, ci[0], ci[1], ci[2]);
          rg.addColorStop(0, col); rg.addColorStop(0.62, col); rg.addColorStop(1, 'rgba(255,255,255,0)');
          g.globalAlpha = 0.92; g.fillStyle = rg; g.beginPath(); g.arc(ci[0], ci[1], ci[2], 0, 6.2832); g.fill();
        });
        return c;
      });
    });
  }
  function drawCloud(g, c, d) {
    if (!cloudSprites) makeClouds();
    var w = 170 * c.s, h = 80 * c.s, a = c.a;
    var seg = d < 0.5 ? 0 : 1, f = d < 0.5 ? d * 2 : (d - 0.5) * 2;
    g.globalAlpha = a; g.drawImage(cloudSprites[seg][c.sh], c.x, c.y, w, h);
    if (f > 0.01) { g.globalAlpha = a * f; g.drawImage(cloudSprites[seg + 1][c.sh], c.x, c.y, w, h); }
    g.globalAlpha = 1;
  }

  /* ---------------- city ---------------- */
  function buildCity(W, sc, mode) {
    var c = document.createElement('canvas'); c.width = Math.ceil(W * sc); c.height = Math.ceil(CH * sc);
    var g = c.getContext('2d'); g.scale(sc, sc);
    var rnd = mulberry(20260114), dusk = mode === 'dusk', roofs = [], lit = [];
    function R(a, b) { return a + rnd() * (b - a); }
    // far skyline on temp layer
    var far = document.createElement('canvas'); far.width = c.width; far.height = c.height; var fg = far.getContext('2d'); fg.scale(sc, sc);
    fg.fillStyle = dusk ? '#7d5a9d' : '#8aa3c8';
    var x = -10, yb = CH - 44, k = 0;
    while (x < W + 10) {
      var w = R(20, 40), h = R(40, 100), kind = k % 6;
      if (kind === 2) { // dome building
        fg.fillRect(x, yb - h * 0.55, w, h * 0.55);
        fg.beginPath(); fg.arc(x + w / 2, yb - h * 0.55, w * 0.46, Math.PI, 0); fg.fill();
        fg.fillRect(x + w / 2 - 0.8, yb - h * 0.55 - w * 0.46 - 9, 1.6, 9);
      } else if (kind === 4) { // shikhar (temple spire)
        fg.fillRect(x, yb - h * 0.4, w, h * 0.4);
        for (var i = 0; i < 4; i++) { var ww = w * (0.9 - i * 0.2); fg.fillRect(x + (w - ww) / 2, yb - h * 0.4 - (i + 1) * 9, ww, 10); }
        fg.fillRect(x + w / 2 - 0.6, yb - h * 0.4 - 52, 1.2, 14);
        fg.beginPath(); fg.moveTo(x + w / 2, yb - h * 0.4 - 52); fg.lineTo(x + w / 2 + 8, yb - h * 0.4 - 49); fg.lineTo(x + w / 2, yb - h * 0.4 - 46); fg.fill();
      } else if (kind === 5) { // minaret
        fg.fillRect(x, yb - h * 0.5, w, h * 0.5);
        fg.fillRect(x + w / 2 - 3, yb - h - 10, 6, h + 10);
        fg.beginPath(); fg.moveTo(x + w / 2 - 4, yb - h - 10); fg.lineTo(x + w / 2, yb - h - 24); fg.lineTo(x + w / 2 + 4, yb - h - 10); fg.fill();
      } else fg.fillRect(x, yb - h, w, h);
      x += w + R(0, 3); k++;
    }
    g.globalAlpha = 0.62; g.drawImage(far, 0, 0, W, CH); g.globalAlpha = 1;

    // mid row
    var pal = ['#f4b6a6', '#f7d27a', '#8fd3c9', '#f29b7b', '#ece1c6', '#b9a6e0', '#9cc7f0', '#f2a7c3', '#e8a05a', '#a8d889'];
    var yb2 = CH - 50; x = -14; var bi = 0, tops = [];
    var wins = [];
    while (x < W + 10) {
      var bw = R(54, 88) | 0, bh = R(66, 122) | 0, col = pal[(bi * 3 + (rnd() * 4 | 0)) % pal.length], by = yb2 - bh;
      // body
      var gr = g.createLinearGradient(x, 0, x + bw, 0); gr.addColorStop(0, col); gr.addColorStop(1, mix(col, '#7a5a6a', 0.22));
      g.fillStyle = gr; g.fillRect(x, by, bw, bh);
      // roof parapet
      g.fillStyle = mix(col, '#5a3a4a', 0.35); g.fillRect(x - 2, by - 7, bw + 4, 7);
      g.fillStyle = mix(col, '#ffffff', 0.45); g.fillRect(x - 2, by - 8, bw + 4, 2);
      // parapet notches
      g.fillStyle = mix(col, '#5a3a4a', 0.5);
      for (var px = x; px < x + bw - 4; px += 9) g.fillRect(px + 2, by - 5, 4, 3);
      // windows
      var cols = Math.max(2, (bw / 22) | 0), rows = Math.max(2, ((bh - 14) / 28) | 0), cw = bw / cols;
      for (var r = 0; r < rows; r++) for (var cc = 0; cc < cols; cc++) {
        var wx = x + cc * cw + cw / 2 - 5, wy = by + 10 + r * 28;
        wins.push([wx, wy, rnd() < 0.55]);
        g.fillStyle = mix(col, '#3a2a40', 0.55); g.fillRect(wx - 2, wy - 2, 14, 19);
        g.fillStyle = '#35507a'; g.fillRect(wx, wy, 10, 15);
        g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(wx, wy, 4, 15);
        g.fillStyle = mix(col, '#3a2a40', 0.4); g.fillRect(wx + 4.5, wy, 1, 15);
        if (rnd() < 0.5) { g.fillStyle = mix(col, '#3a2a40', 0.5); g.fillRect(wx - 4, wy + 16, 18, 2.5); g.fillRect(wx - 4, wy + 11, 1, 6); g.fillRect(wx + 13, wy + 11, 1, 6); }
      }
      // roof extras
      var rx = x + 6, ro = rnd();
      if (ro < 0.5) { // water tank
        var tx = x + R(8, bw - 26), ty = by - 8;
        g.fillStyle = '#3b3f4d'; g.fillRect(tx + 2, ty - 5, 2.5, 5); g.fillRect(tx + 13, ty - 5, 2.5, 5);
        g.fillStyle = '#23262f'; rr(g, tx, ty - 22, 18, 17, 4); g.fill();
        g.fillStyle = '#3a3f50'; g.fillRect(tx + 2, ty - 21, 4, 15);
        g.fillStyle = '#23262f'; g.beginPath(); g.ellipse(tx + 9, ty - 22, 8, 2.6, 0, 0, 6.2832); g.fill();
        g.fillStyle = '#4a5064'; g.fillRect(tx + 6, ty - 26, 6, 3);
      } else if (ro < 0.75) { // stair room
        var sx = x + R(4, bw - 30);
        g.fillStyle = mix(col, '#ffffff', 0.18); g.fillRect(sx, by - 24, 26, 17);
        g.fillStyle = mix(col, '#5a3a4a', 0.4); g.fillRect(sx - 2, by - 26, 30, 3);
        g.fillStyle = '#6b4a3a'; g.fillRect(sx + 9, by - 18, 8, 11);
      } else { // antenna + solar
        var ax = x + R(6, bw - 12);
        g.strokeStyle = '#2b2b33'; g.lineWidth = 1; g.beginPath(); g.moveTo(ax, by - 7); g.lineTo(ax, by - 28); g.moveTo(ax - 7, by - 24); g.lineTo(ax + 7, by - 24); g.moveTo(ax - 5, by - 20); g.lineTo(ax + 5, by - 20); g.moveTo(ax - 4, by - 16); g.lineTo(ax + 4, by - 16); g.stroke();
        g.fillStyle = '#6a8aa8'; g.save(); g.translate(x + bw - 22, by - 8); g.rotate(-0.35); g.fillRect(-10, -6, 20, 7); g.restore();
      }
      // balcony
      if (rnd() < 0.6 && rows > 2) {
        var by2 = by + 10 + 28 + 18; g.fillStyle = mix(col, '#4a3040', 0.45); g.fillRect(x + 4, by2, bw - 8, 3);
        g.fillRect(x + 4, by2 - 9, 1.3, 9); g.fillRect(x + bw - 5.3, by2 - 9, 1.3, 9); g.fillRect(x + 4, by2 - 9, bw - 8, 1.3);
      }
      // clothes
      if (rnd() < 0.35) {
        var cy = by - 2; g.strokeStyle = '#444'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + 4, cy - 14); g.lineTo(x + bw - 4, cy - 14); g.stroke();
        var cl = ['#e84a5f', '#ffd23f', '#3fa7d6', '#ffffff', '#59cd90'];
        for (var q = x + 10; q < x + bw - 10; q += 9) { g.fillStyle = cl[(rnd() * 5) | 0]; g.fillRect(q, cy - 14, 5, 9); }
      }
      roofs.push({ x: x + bw * R(0.25, 0.75), y: by - 8, b: bi });
      tops.push({ x: x, w: bw, y: by - 8 });
      x += bw + R(0, 3); bi++;
    }
    // bunting between roofs
    var flagCols = ['#ff9933', '#e91e63', '#fdd835', '#43a047', '#29b6f6'];
    for (var i2 = 0; i2 < tops.length - 1; i2 += 2) {
      var A = tops[i2], B = tops[i2 + 1], x1 = A.x + A.w * 0.5, y1 = A.y - 3, x2 = B.x + B.w * 0.5, y2 = B.y - 3;
      g.strokeStyle = 'rgba(60,40,40,0.8)'; g.lineWidth = 0.9; g.beginPath();
      var pts = [];
      for (var s = 0; s <= 14; s++) { var tt = s / 14; var px2 = x1 + (x2 - x1) * tt, py2 = y1 + (y2 - y1) * tt + Math.sin(tt * Math.PI) * 11; pts.push([px2, py2]); s ? g.lineTo(px2, py2) : g.moveTo(px2, py2); }
      g.stroke();
      for (var s2 = 1; s2 < 14; s2++) { g.fillStyle = flagCols[(s2 + i2) % 5]; g.beginPath(); g.moveTo(pts[s2][0] - 2.6, pts[s2][1]); g.lineTo(pts[s2][0] + 2.6, pts[s2][1]); g.lineTo(pts[s2][0], pts[s2][1] + 6); g.fill(); }
    }
    // dusk tint
    if (dusk) {
      g.globalCompositeOperation = 'source-atop';
      var tg = g.createLinearGradient(0, 0, 0, CH); tg.addColorStop(0, 'rgba(255,110,80,0.38)'); tg.addColorStop(1, 'rgba(110,50,120,0.42)');
      g.fillStyle = tg; g.fillRect(0, 0, W, CH); g.globalCompositeOperation = 'source-over';
      wins.forEach(function (w) {
        if (!w[2]) return;
        var rg = g.createRadialGradient(w[0] + 5, w[1] + 7, 1, w[0] + 5, w[1] + 7, 14); rg.addColorStop(0, 'rgba(255,200,110,0.55)'); rg.addColorStop(1, 'rgba(255,200,110,0)');
        g.fillStyle = rg; g.fillRect(w[0] - 9, w[1] - 7, 28, 28);
        g.fillStyle = '#ffd68a'; g.fillRect(w[0], w[1], 10, 15); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(w[0], w[1], 4, 15);
      });
    }

    // foreground terrace
    var wallC = dusk ? '#d49a78' : '#ecc7a0';
    var wg = g.createLinearGradient(0, CH - 82, 0, CH - 54); wg.addColorStop(0, mix(wallC, '#ffffff', 0.12)); wg.addColorStop(1, mix(wallC, '#6a3a30', 0.2));
    g.fillStyle = wg; g.fillRect(0, CH - 82, W, 30);
    g.fillStyle = dusk ? '#9a6a56' : '#c79a78'; g.fillRect(0, CH - 86, W, 5);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, CH - 86, W, 1.5);
    g.strokeStyle = 'rgba(120,60,40,0.28)'; g.lineWidth = 1;
    for (var bx = 0; bx < W; bx += 14) { g.beginPath(); g.moveTo(bx, CH - 80); g.lineTo(bx, CH - 54); g.stroke(); }
    g.beginPath(); g.moveTo(0, CH - 67); g.lineTo(W, CH - 67); g.stroke();
    // floor
    var fg2 = g.createLinearGradient(0, CH - 52, 0, CH); fg2.addColorStop(0, dusk ? '#9c6b64' : '#c9a58a'); fg2.addColorStop(1, dusk ? '#6a4450' : '#a37e68');
    g.fillStyle = fg2; g.fillRect(0, CH - 52, W, 52);
    g.strokeStyle = 'rgba(80,40,30,0.22)';
    for (var ty2 = CH - 52; ty2 < CH; ty2 += 13) { g.beginPath(); g.moveTo(0, ty2); g.lineTo(W, ty2); g.stroke(); }
    for (var tx2 = -20; tx2 < W + 20; tx2 += 34) { g.beginPath(); g.moveTo(tx2, CH - 52); g.lineTo(tx2 - 20, CH); g.stroke(); }
    // flower pots
    [18, W - 20].forEach(function (px3) {
      g.fillStyle = '#b5532f'; g.beginPath(); g.moveTo(px3 - 8, CH - 80); g.lineTo(px3 + 8, CH - 80); g.lineTo(px3 + 6, CH - 66); g.lineTo(px3 - 6, CH - 66); g.fill();
      g.fillStyle = '#2f8f3f'; g.beginPath(); g.arc(px3, CH - 84, 8, 0, 6.2832); g.fill();
      ['#ff9800', '#ffeb3b', '#ff9800'].forEach(function (cl, i) { g.fillStyle = cl; g.beginPath(); g.arc(px3 - 5 + i * 5, CH - 87 + (i % 2) * 3, 2.6, 0, 6.2832); g.fill(); });
    });
    if (dusk) { g.fillStyle = 'rgba(70,30,90,0.18)'; g.fillRect(0, CH - 52, W, 52); }
    return { canvas: c, roofs: roofs };
  }

  /* ---------------- people ---------------- */
  var SKIN = ['#e0ac80', '#c68642', '#f1c27d', '#a86b3c', '#d9a066'];
  var SHIRT = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#ec407a', '#ff9800', '#8e24aa', '#26a69a', '#ffffff'];
  function makePerson(r) { return { skin: SKIN[(r() * SKIN.length) | 0], shirt: SHIRT[(r() * SHIRT.length) | 0], pants: ['#2c3e66', '#3a3a44', '#5b4636', '#f5f0e6'][(r() * 4) | 0], hair: '#1d1613', hat: r() < 0.3 ? ['#ff9933', '#e91e63', '#ffd23f'][(r() * 3) | 0] : null, ph: r() * 6.28, kid: r() < 0.3 }; }
  function drawPerson(g, x, y, s, p, t, mode, cheer, armAng) {
    var sc = s * (p.kid ? 0.82 : 1);
    var bob = cheer > 0 ? Math.abs(Math.sin(t * 9 + p.ph)) * 5 * sc : 0;
    g.save(); g.translate(x, y - bob); g.scale(sc, sc);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(0, bob / sc, 9, 2.5, 0, 0, 6.2832); g.fill();
    g.fillStyle = p.pants; g.fillRect(-5, -16, 4.4, 15); g.fillRect(0.6, -16, 4.4, 15);
    g.fillStyle = '#2a2230'; g.fillRect(-5.6, -2.4, 5.4, 2.6); g.fillRect(0.2, -2.4, 5.4, 2.6);
    // arms
    g.lineCap = 'round'; g.strokeStyle = p.skin; g.lineWidth = 3.4;
    var wave = Math.sin(t * 6 + p.ph);
    var aL, aR;
    if (mode === 1) { aR = armAng !== undefined ? armAng : -1.2; aL = 1.9; }
    else if (cheer > 0 || mode === 2) { aL = -Math.PI / 2 - 0.35 + wave * 0.35; aR = -Math.PI / 2 + 0.35 - wave * 0.35; }
    else { aL = 1.85; aR = -Math.PI / 2 + 0.4 + wave * 0.25 * (mode === 3 ? 1 : 0.4); }
    g.beginPath(); g.moveTo(-7, -33); g.lineTo(-7 + Math.cos(aL) * 14, -33 + Math.sin(aL) * 14); g.stroke();
    g.beginPath(); g.moveTo(7, -33); g.lineTo(7 + Math.cos(aR) * 14, -33 + Math.sin(aR) * 14); g.stroke();
    // torso
    g.fillStyle = p.shirt; rr(g, -8.5, -37, 17, 23, 5); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-1, -35, 2, 20);
    g.fillStyle = 'rgba(255,255,255,0.2)'; rr(g, -8, -36, 6, 22, 3); g.fill();
    // head
    g.fillStyle = p.skin; g.beginPath(); g.arc(0, -44, 7, 0, 6.2832); g.fill();
    if (p.hat) { g.fillStyle = p.hat; g.beginPath(); g.ellipse(0, -48, 8, 5, 0, Math.PI, 0); g.fill(); g.fillRect(-8, -48.5, 16, 2.2); }
    else { g.fillStyle = p.hair; g.beginPath(); g.arc(0, -45, 7.2, Math.PI * 1.02, Math.PI * 1.98); g.fill(); }
    if (sc > 0.7) { g.fillStyle = '#1d1613'; g.fillRect(-3, -43.5, 1.6, 1.8); g.fillRect(1.6, -43.5, 1.6, 1.8); }
    g.restore();
    return { hx: x + (mode === 1 ? Math.cos(armAng !== undefined ? armAng : -1.2) * 14 * sc + 7 * sc : 0), hy: y - bob - 33 * sc + (mode === 1 ? Math.sin(armAng !== undefined ? armAng : -1.2) * 14 * sc : 0) };
  }
  function drawSpool(g, x, y, t) { // charkhi
    g.save(); g.translate(x, y);
    g.fillStyle = '#7a3f1d'; g.beginPath(); g.arc(0, 0, 7.5, 0, 6.2832); g.fill();
    g.fillStyle = '#ff4fa0'; g.beginPath(); g.arc(0, 0, 5.6, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.arc(0, 0, 3.6, 0, 6.2832); g.stroke();
    g.save(); g.rotate(t * 3); g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.moveTo(0, -5); g.lineTo(0, 5); g.stroke(); g.restore();
    g.restore();
  }

  /* ---------------- kites ---------------- */
  function kitePath(g, w, h) {
    g.beginPath(); g.moveTo(0, -h * 0.5); g.lineTo(w * 0.5, -h * 0.1); g.lineTo(w * 0.07, h * 0.5); g.lineTo(-w * 0.07, h * 0.5); g.lineTo(-w * 0.5, -h * 0.1); g.closePath();
  }
  function drawKite(g, pat, cols, w, h, t) {
    var c0 = cols[0], c1 = cols[1] || '#fff', c2 = cols[2] || c1;
    g.save();
    kitePath(g, w, h); g.fillStyle = c0; g.fill(); g.clip();
    var cy = -h * 0.1;
    switch (pat) {
      case 'split': g.fillStyle = c1; g.fillRect(0, -h, w, h * 2); break;
      case 'quarters':
        g.fillStyle = c1; g.beginPath(); g.moveTo(0, cy); g.lineTo(0, -h * 0.5); g.lineTo(w * 0.5, cy); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(0, cy); g.lineTo(0, h * 0.5); g.lineTo(-w * 0.5, cy); g.closePath(); g.fill(); break;
      case 'tiranga': {
        var top = -h * 0.5, bot = h * 0.5, th = (bot - top) / 3;
        g.fillStyle = '#ff9933'; g.fillRect(-w, top, w * 2, th + 0.5);
        g.fillStyle = '#ffffff'; g.fillRect(-w, top + th, w * 2, th + 0.5);
        g.fillStyle = '#138808'; g.fillRect(-w, top + 2 * th, w * 2, th + 1);
        g.strokeStyle = '#1a3fa0'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, top + th * 1.5, th * 0.38, 0, 6.2832); g.stroke();
        g.lineWidth = 0.7; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; g.beginPath(); g.moveTo(0, top + th * 1.5); g.lineTo(Math.cos(a) * th * 0.38, top + th * 1.5 + Math.sin(a) * th * 0.38); g.stroke(); }
        break; }
      case 'stripes':
        g.fillStyle = c1; for (var s = -h * 0.5 + h * 0.1; s < h * 0.5; s += h * 0.2) g.fillRect(-w, s, w * 2, h * 0.095); break;
      case 'star': {
        g.fillStyle = c1; g.beginPath();
        for (var k = 0; k < 10; k++) { var r = k % 2 ? h * 0.12 : h * 0.3, an = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(Math.cos(an) * r * 0.9, cy + Math.sin(an) * r); }
        g.closePath(); g.fill(); break; }
      case 'checks': {
        var n = 6, cs = w / n; g.fillStyle = c1;
        for (var yy = -h * 0.5; yy < h * 0.5; yy += cs) for (var xx = -w * 0.5; xx < w * 0.5; xx += cs) if (((Math.round((xx + w) / cs) + Math.round((yy + h) / cs)) & 1) === 0) g.fillRect(xx, yy, cs, cs);
        break; }
      case 'rainbow': {
        var rc = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'], bh = h / 6;
        for (var j = 0; j < 6; j++) { g.fillStyle = rc[j]; g.fillRect(-w, -h * 0.5 + j * bh, w * 2, bh + 0.6); } break; }
      case 'border':
        g.fillStyle = c1; g.save(); g.translate(0, cy); g.scale(0.66, 0.66); g.translate(0, -cy); kitePath(g, w, h); g.fill(); g.restore();
        g.fillStyle = c2; g.save(); g.translate(0, cy); g.scale(0.34, 0.34); g.translate(0, -cy); kitePath(g, w, h); g.fill(); g.restore(); break;
      case 'cobra':
        g.fillStyle = c1; g.save(); g.translate(0, cy); g.scale(0.7, 0.7); g.translate(0, -cy); kitePath(g, w, h); g.fill(); g.restore();
        g.fillStyle = c0; g.save(); g.translate(0, cy); g.scale(0.5, 0.5); g.translate(0, -cy); kitePath(g, w, h); g.fill(); g.restore();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(-w * 0.12, cy - h * 0.04, 2.2, 0, 6.2832); g.arc(w * 0.12, cy - h * 0.04, 2.2, 0, 6.2832); g.fill();
        g.fillStyle = '#111'; g.beginPath(); g.arc(-w * 0.12, cy - h * 0.04, 1, 0, 6.2832); g.arc(w * 0.12, cy - h * 0.04, 1, 0, 6.2832); g.fill(); break;
      case 'diamond':
        g.fillStyle = c1; g.save(); g.translate(0, cy); g.scale(0.5, 0.5); g.translate(0, -cy); kitePath(g, w, h); g.fill(); g.restore(); break;
    }
    // sheen
    var sg = g.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5); sg.addColorStop(0, 'rgba(255,255,255,0.38)'); sg.addColorStop(0.45, 'rgba(255,255,255,0.05)'); sg.addColorStop(1, 'rgba(0,0,0,0.2)');
    g.fillStyle = sg; g.fillRect(-w, -h, w * 2, h * 2);
    g.restore();
    // frame
    g.save();
    g.strokeStyle = 'rgba(40,20,20,0.75)'; g.lineWidth = 1.4; kitePath(g, w, h); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(0, -h * 0.5); g.lineTo(0, h * 0.5); g.stroke();
    g.beginPath(); g.moveTo(-w * 0.5, -h * 0.1); g.quadraticCurveTo(0, -h * 0.28 + Math.sin(t * 9) * 1.2, w * 0.5, -h * 0.1); g.stroke();
    g.restore();
  }
  function drawTail(g, tail, cols) {
    if (!tail || tail.length < 2) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = cols[0]; g.lineWidth = 2.2; g.beginPath(); g.moveTo(tail[0].x, tail[0].y);
    for (var i = 1; i < tail.length; i++) g.lineTo(tail[i].x, tail[i].y); g.stroke();
    for (var j = 1; j < tail.length; j++) {
      var p = tail[j], q = tail[j - 1], a = Math.atan2(p.y - q.y, p.x - q.x), c = cols[j % cols.length] || cols[0];
      g.save(); g.translate(p.x, p.y); g.rotate(a); g.fillStyle = c;
      var sz = 4.2 - j * 0.14;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-sz * 0.6, -sz); g.lineTo(sz * 0.6, 0); g.lineTo(-sz * 0.6, sz); g.closePath(); g.fill();
      g.restore();
    }
    g.restore();
  }
  function drawKiteIcon(g, x, y, s, col, col2) {
    g.save(); g.translate(x, y); g.scale(s, s);
    kitePath(g, 16, 20); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(30,10,10,0.8)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = col2 || '#fff'; g.beginPath(); g.moveTo(0, -3); g.lineTo(0, -10); g.lineTo(8, -2); g.closePath(); g.fill();
    g.restore();
  }

  /* ---------------- string ---------------- */
  function stringPoints(out, ax, ay, kx, ky, sag, t, seed) {
    var n = out.length;
    for (var i = 0; i < n; i++) {
      var f = i / (n - 1), s = 4 * f * (1 - f);
      out[i].x = ax + (kx - ax) * f + Math.sin(t * 2.3 + f * 7 + seed) * 3 * s * (sag / 30 + 0.2);
      out[i].y = ay + (ky - ay) * f + s * sag + Math.sin(t * 1.7 + f * 5 + seed * 2) * 2 * s;
    }
  }
  function drawStringPts(g, pts, col, w, glow) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    function path() { g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (var i = 1; i < pts.length - 1; i++) { var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2; g.quadraticCurveTo(pts[i].x, pts[i].y, mx, my); } g.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); }
    if (glow) { g.strokeStyle = glow; g.lineWidth = w + 3; path(); g.stroke(); }
    g.strokeStyle = col; g.lineWidth = w; path(); g.stroke();
    g.restore();
  }

  function drawBird(g, x, y, s, t, col) {
    var f = Math.sin(t * 9) * 0.9;
    g.strokeStyle = col; g.lineWidth = 1.6 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 7 * s, y - f * 3 * s); g.quadraticCurveTo(x - 3 * s, y - 4 * s - f * 3 * s, x, y); g.quadraticCurveTo(x + 3 * s, y - 4 * s - f * 3 * s, x + 7 * s, y - f * 3 * s); g.stroke();
  }
  function drawCoin(g, x, y, r, t) {
    var sx = Math.abs(Math.cos(t * 2)) * 0.6 + 0.4;
    g.save(); g.translate(x, y); g.scale(sx, 1);
    g.fillStyle = '#c98a00'; g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fill();
    var gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#fff0a0'); gr.addColorStop(1, '#ffb800');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 0.82, 0, 6.2832); g.fill();
    g.strokeStyle = '#c98a00'; g.lineWidth = r * 0.14; g.beginPath(); g.arc(0, 0, r * 0.55, 0, 6.2832); g.stroke();
    g.restore();
  }

  return { CH: CH, FONT: FONT, mulberry: mulberry, mix: mix, rr: rr, drawSky: drawSky, drawSun: drawSun, sunPos: sunPos, drawCloud: drawCloud, buildCity: buildCity,
    makePerson: makePerson, drawPerson: drawPerson, drawSpool: drawSpool, drawKite: drawKite, drawTail: drawTail, drawKiteIcon: drawKiteIcon,
    stringPoints: stringPoints, drawStringPts: drawStringPts, drawBird: drawBird, drawCoin: drawCoin };
})();
