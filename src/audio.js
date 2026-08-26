/**
 * Procedural Web Audio SFX — no asset files needed.
 * Call unlock() once from a user gesture (start button).
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
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.0;
  musicGain.connect(master);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  unlocked = true;
  startMusicBed();
}

export function setMuted(muted) {
  if (!master) return;
  master.gain.value = muted ? 0 : 0.55;
}

function now() {
  return ctx ? ctx.currentTime : 0;
}

function envGain(duration, peak = 0.3, attack = 0.01) {
  const g = ctx.createGain();
  const t = now();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  g.connect(master);
  return g;
}

function tone(freq, duration, type = "square", peak = 0.22) {
  if (!unlocked || !ensure()) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, now());
  o.connect(envGain(duration, peak));
  o.start(now());
  o.stop(now() + duration + 0.02);
}

function noiseBurst(duration, peak = 0.2, filterFreq = 1200) {
  if (!unlocked || !ensure()) return;
  const len = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  src.connect(filter);
  filter.connect(envGain(duration, peak, 0.005));
  src.start(now());
}

export function sfxFootstep() {
  noiseBurst(0.06, 0.08, 400);
}

export function sfxJump() {
  if (!unlocked || !ensure()) return;
  const o = ctx.createOscillator();
  o.type = "triangle";
  const t = now();
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(420, t + 0.12);
  o.connect(envGain(0.14, 0.16));
  o.start(t);
  o.stop(t + 0.15);
}

export function sfxSwing(style = "fist") {
  if (style === "sword") {
    noiseBurst(0.14, 0.22, 1800);
    tone(220, 0.1, "sawtooth", 0.1);
  } else if (style === "spear") {
    noiseBurst(0.1, 0.18, 900);
    tone(140, 0.12, "triangle", 0.12);
  } else if (style === "mace") {
    noiseBurst(0.18, 0.28, 400);
    tone(90, 0.14, "square", 0.16);
  } else if (style === "gun") {
    noiseBurst(0.09, 0.24, 2200);
    tone(520, 0.07, "square", 0.14);
    tone(180, 0.08, "sawtooth", 0.1);
  } else {
    noiseBurst(0.08, 0.14, 700);
  }
}

export function sfxHit() {
  noiseBurst(0.09, 0.28, 600);
  tone(90, 0.08, "square", 0.18);
}

export function sfxKill() {
  if (!unlocked || !ensure()) return;
  const t = now();
  [520, 660, 880].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.02 + i * 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22 + i * 0.05);
    o.connect(g);
    g.connect(master);
    o.start(t + i * 0.04);
    o.stop(t + 0.3 + i * 0.05);
  });
  noiseBurst(0.18, 0.2, 1400);
}

export function sfxHurt() {
  tone(160, 0.16, "sawtooth", 0.2);
  tone(110, 0.2, "square", 0.12);
}

export function sfxPickup() {
  if (!unlocked || !ensure()) return;
  const t = now();
  [523, 659, 784, 1046].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.14, t + i * 0.05 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.05 + 0.18);
    o.connect(g);
    g.connect(master);
    o.start(t + i * 0.05);
    o.stop(t + i * 0.05 + 0.2);
  });
}

export function sfxEquip() {
  tone(400, 0.06, "square", 0.1);
  tone(600, 0.08, "triangle", 0.1);
}

export function sfxCrate() {
  noiseBurst(0.12, 0.22, 500);
  tone(180, 0.1, "square", 0.1);
}

export function sfxUi() {
  tone(660, 0.05, "square", 0.08);
}

/** Soft looping chiptune-ish bed */
function startMusicBed() {
  if (!ctx || musicTimer) return;
  musicGain.gain.cancelScheduledValues(now());
  musicGain.gain.linearRampToValueAtTime(0.07, now() + 1.2);

  const root = 110;
  const pattern = [0, 3, 5, 7, 5, 3, 0, -2];
  let step = 0;

  const tick = () => {
    if (!unlocked || !ctx) return;
    const t = now();
    const note = root * Math.pow(2, pattern[step % pattern.length] / 12);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = note;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g);
    g.connect(musicGain);
    o.start(t);
    o.stop(t + 0.3);

    // quiet pulse bass
    if (step % 2 === 0) {
      const b = ctx.createOscillator();
      b.type = "sine";
      b.frequency.value = root / 2;
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      b.connect(bg);
      bg.connect(musicGain);
      b.start(t);
      b.stop(t + 0.22);
    }
    step++;
  };

  tick();
  musicTimer = setInterval(tick, 280);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
