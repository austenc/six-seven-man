/**
 * Procedural Web Audio — Doom-adjacent peashooter chaos.
 */

let ctx = null;
let master = null;
let musicGain = null;
let musicTimer = null;
let unlocked = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(master);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  unlocked = true;
  startMusic();
}

function now() {
  return ctx ? ctx.currentTime : 0;
}

function env(dur, peak = 0.25, atk = 0.01) {
  const g = ctx.createGain();
  const t = now();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  return g;
}

function tone(freq, dur, type = "square", peak = 0.2) {
  if (!unlocked || !ensure()) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, now());
  o.connect(env(dur, peak));
  o.start(now());
  o.stop(now() + dur + 0.02);
}

function noise(dur, peak, freq) {
  if (!unlocked || !ensure()) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  src.connect(f);
  f.connect(env(dur, peak, 0.005));
  src.start(now());
}

export function sfxShoot(kind) {
  if (kind === "shotgun") {
    noise(0.18, 0.35, 900);
    tone(90, 0.12, "sawtooth", 0.2);
  } else if (kind === "launcher") {
    noise(0.22, 0.3, 400);
    tone(70, 0.2, "sawtooth", 0.22);
  } else {
    tone(520, 0.06, "square", 0.12);
    noise(0.05, 0.1, 1800);
  }
}

export function sfxHit() {
  noise(0.08, 0.25, 700);
  tone(110, 0.07, "square", 0.15);
}

export function sfxExplode() {
  noise(0.35, 0.4, 300);
  tone(55, 0.3, "sawtooth", 0.25);
}

export function sfxHurt() {
  tone(140, 0.18, "sawtooth", 0.22);
}

export function sfxPickup() {
  tone(440, 0.06, "triangle", 0.12);
  tone(660, 0.08, "triangle", 0.12);
}

export function sfxDoor() {
  noise(0.2, 0.2, 250);
  tone(180, 0.15, "square", 0.1);
}

export function sfxStep() {
  noise(0.04, 0.06, 350);
}

function startMusic() {
  if (!ctx || musicTimer) return;
  musicGain.gain.linearRampToValueAtTime(0.08, now() + 0.8);
  const root = 98;
  const pattern = [0, 0, 3, 5, 0, -2, 3, 7];
  let step = 0;
  const tick = () => {
    if (!unlocked || !ctx) return;
    const t = now();
    const note = root * Math.pow(2, pattern[step % pattern.length] / 12);
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = note;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g);
    g.connect(musicGain);
    o.start(t);
    o.stop(t + 0.28);
    if (step % 4 === 0) {
      const b = ctx.createOscillator();
      b.type = "square";
      b.frequency.value = root / 2;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      b.connect(bg);
      bg.connect(musicGain);
      b.start(t);
      b.stop(t + 0.2);
    }
    step++;
  };
  tick();
  musicTimer = setInterval(tick, 260);
}
