/* Patang Ladai - synthesized music + sfx (WebAudio, no assets) */
var Snd = (function () {
  'use strict';
  var ac = null, master, musicG, sfxG, comp, noiseBuf, muted = false, timer = null;
  var step = 0, nextT = 0, SD = 0.145, intensity = 0, musicOn = true;
  var ROOT = 293.66; // D
  var S = [0, 1, 4, 5, 7, 8, 11, 12, 13, 16, 17, 19]; // Bhairav flavoured
  var MEL = [
    [0,4,3],[3,3,1],[4,2,2],[6,3,2],[8,2,2],[10,1,2],[12,0,4],
    [16,4,3],[19,5,1],[20,4,2],[22,3,2],[24,4,2],[26,6,2],[28,7,4],
    [32,7,2],[34,6,2],[36,5,2],[38,4,2],[40,3,2],[42,2,2],[44,1,2],[46,0,2],
    [48,2,2],[50,4,2],[52,5,2],[54,4,2],[56,2,2],[58,1,2],[60,0,4]
  ];
  var melMap = {};
  MEL.forEach(function (m) { melMap[m[0]] = m; });

  function f(semi) { return ROOT * Math.pow(2, semi / 12); }

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 5;
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.85;
    master.connect(comp); comp.connect(ac.destination);
    musicG = ac.createGain(); musicG.gain.value = 0.42; musicG.connect(master);
    sfxG = ac.createGain(); sfxG.gain.value = 0.9; sfxG.connect(master);
    var len = ac.sampleRate * 1.0;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    nextT = ac.currentTime + 0.1; step = 0;
    timer = setInterval(tick, 50);
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, ac.currentTime, 0.03);
  }
  function suspend() { if (ac && ac.state === 'running') ac.suspend(); }
  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }
  function setIntensity(v) { intensity = v; }
  function setMusic(on) { musicOn = on; if (musicG) musicG.gain.setTargetAtTime(on ? 0.42 : 0.0, ac.currentTime, 0.2); }

  function tone(t, freq, dur, type, vol, dest, o) {
    o = o || {};
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + dur);
    var node = osc;
    if (o.lp) {
      var fl = ac.createBiquadFilter(); fl.type = 'lowpass';
      fl.frequency.setValueAtTime(o.lp, t);
      if (o.lpEnd) fl.frequency.exponentialRampToValueAtTime(o.lpEnd, t + dur);
      osc.connect(fl); node = fl;
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (o.att || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g); g.connect(dest || sfxG);
    if (o.vib) {
      var lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 5.5; lg.gain.value = o.vib; lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, ftype, f0, f1, dest, q) {
    var src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var fl = ac.createBiquadFilter(); fl.type = ftype; fl.Q.value = q || 1;
    fl.frequency.setValueAtTime(f0, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(dest || sfxG);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function kick(t) { tone(t, 150, 0.22, 'sine', 0.9, musicG, { glide: 48 }); }
  function dhol(t) { tone(t, 120, 0.16, 'triangle', 0.5, musicG, { glide: 70 }); noise(t, 0.05, 0.12, 'bandpass', 900, 500, musicG, 1); }
  function tak(t, v) { noise(t, 0.06, v, 'highpass', 3500, 2500, musicG, 0.7); tone(t, 520, 0.05, 'square', v * 0.25, musicG, { lp: 1800 }); }
  function shaker(t, v) { noise(t, 0.04, v, 'highpass', 7000, 6000, musicG, 0.5); }
  function pluck(t, semi, durSteps, vol) {
    var fr = f(semi), d = Math.max(0.12, durSteps * SD * 1.05);
    tone(t, fr, d, 'sawtooth', vol, musicG, { lp: 3200, lpEnd: 500, att: 0.004 });
    tone(t, fr * 2.003, d * 0.7, 'sine', vol * 0.35, musicG, { att: 0.004, vib: 3 });
  }

  function schedule(t, s) {
    var bs = s % 16;
    if (bs === 0 || bs === 6 || bs === 8 || bs === 14) kick(t);
    if (bs === 3 || bs === 11) dhol(t);
    if (bs === 4 || bs === 12) tak(t, 0.22);
    if (intensity > 0.5 && (bs === 2 || bs === 10 || bs === 15)) tak(t, 0.12);
    if (bs % 2 === 0) shaker(t, 0.05 + intensity * 0.04); else if (intensity > 0.3) shaker(t, 0.03);
    if (bs === 0) { tone(t, ROOT / 2, SD * 16, 'sine', 0.30, musicG, { att: 0.05 }); tone(t, ROOT * 0.75, SD * 8, 'sine', 0.12, musicG, { att: 0.05 }); }
    var m = melMap[s % 64];
    if (m) pluck(t, S[m[1]] + 12 * ((s % 64) >= 32 && (s % 64) < 48 ? 0 : 0), m[2], 0.20);
    if (intensity > 0.6 && s % 4 === 2) pluck(t, [0, 7, 4, 7][(s >> 2) & 3] - 12, 1, 0.08);
  }
  function tick() {
    if (!ac || ac.state !== 'running') { if (ac) nextT = Math.max(nextT, ac.currentTime + 0.05); return; }
    var guard = 0;
    while (nextT < ac.currentTime + 0.25 && guard++ < 8) {
      if (musicOn && !muted) schedule(nextT, step);
      step++; nextT += SD * (intensity > 0.5 ? 0.92 : 1);
    }
  }

  /* ---- sfx ---- */
  function ok() { return ac && ac.state === 'running' && !muted; }
  var sfx = {
    click: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 660, 0.09, 'triangle', 0.35); tone(t + 0.04, 990, 0.1, 'triangle', 0.25); },
    back: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 500, 0.09, 'triangle', 0.3); tone(t + 0.05, 380, 0.1, 'triangle', 0.25); },
    khench: function () { if (!ok()) return; var t = ac.currentTime; noise(t, 0.35, 0.28, 'bandpass', 500, 3000, sfxG, 2); },
    duelStart: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 200, 0.4, 'sawtooth', 0.3, sfxG, { glide: 90, lp: 1200 }); noise(t, 0.3, 0.2, 'bandpass', 2000, 800, sfxG, 3); tone(t + 0.12, 880, 0.25, 'square', 0.12, sfxG, { lp: 2000 }); },
    perfect: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 988, 0.18, 'triangle', 0.35); tone(t + 0.05, 1319, 0.25, 'triangle', 0.3); noise(t, 0.12, 0.12, 'highpass', 5000, 3000, sfxG); },
    good: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 740, 0.15, 'triangle', 0.3); tone(t + 0.05, 988, 0.15, 'triangle', 0.22); },
    miss: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 160, 0.2, 'sawtooth', 0.25, sfxG, { glide: 90, lp: 700 }); },
    rival: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 300, 0.18, 'square', 0.15, sfxG, { glide: 180, lp: 900 }); },
    cut: function () {
      if (!ok()) return; var t = ac.currentTime;
      tone(t, 1800, 0.18, 'sawtooth', 0.3, sfxG, { glide: 200, lp: 5000 });
      noise(t, 0.12, 0.35, 'highpass', 4000, 6000, sfxG);
      tone(t + 0.08, 523, 0.14, 'triangle', 0.3); tone(t + 0.16, 659, 0.14, 'triangle', 0.3); tone(t + 0.24, 784, 0.3, 'triangle', 0.35);
      noise(t + 0.1, 0.9, 0.18, 'bandpass', 1200, 700, sfxG, 0.6);
    },
    lose: function () {
      if (!ok()) return; var t = ac.currentTime;
      tone(t, 1500, 0.15, 'sawtooth', 0.28, sfxG, { glide: 150, lp: 4000 });
      tone(t + 0.15, 330, 0.25, 'triangle', 0.3); tone(t + 0.35, 262, 0.25, 'triangle', 0.3); tone(t + 0.55, 196, 0.5, 'triangle', 0.32);
    },
    power: function () { if (!ok()) return; var t = ac.currentTime; [523, 659, 784, 1047].forEach(function (fr, i) { tone(t + i * 0.07, fr, 0.2, 'triangle', 0.3); }); },
    life: function () { if (!ok()) return; var t = ac.currentTime; [659, 784, 988, 1319, 1568].forEach(function (fr, i) { tone(t + i * 0.08, fr, 0.25, 'sine', 0.3); }); },
    slow: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 800, 0.6, 'sine', 0.3, sfxG, { glide: 200 }); },
    coin: function () { if (!ok()) return; var t = ac.currentTime; tone(t, 1319, 0.08, 'square', 0.15, sfxG, { lp: 3000 }); tone(t + 0.07, 1760, 0.2, 'square', 0.15, sfxG, { lp: 3000 }); },
    wave: function () { if (!ok()) return; var t = ac.currentTime; [392, 523, 659].forEach(function (fr, i) { tone(t + i * 0.12, fr, 0.3, 'triangle', 0.3); }); },
    over: function () { if (!ok()) return; var t = ac.currentTime; [392, 349, 311, 262].forEach(function (fr, i) { tone(t + i * 0.25, fr, 0.45, 'triangle', 0.3); }); },
    whoosh: function () { if (!ok()) return; var t = ac.currentTime; noise(t, 0.6, 0.18, 'bandpass', 300, 2200, sfxG, 1.5); },
    buy: function () { if (!ok()) return; var t = ac.currentTime; [784, 988, 1175, 1568].forEach(function (fr, i) { tone(t + i * 0.06, fr, 0.22, 'square', 0.14, sfxG, { lp: 3500 }); }); }
  };
  return { init: init, setMuted: setMuted, isMuted: function () { return muted; }, suspend: suspend, resume: resume, setIntensity: setIntensity, setMusic: setMusic, sfx: sfx, ready: function () { return !!ac; } };
})();
