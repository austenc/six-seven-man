import { LEVELS, parseLevel, isBlocked, isNukage } from "./maps.js";
import { createTextures, createSprites, drawMugshot } from "./textures.js";
import { createRenderer } from "./raycast.js";
import { WEAPONS } from "./weapons.js";
import {
  unlockAudio,
  sfxShoot,
  sfxHit,
  sfxExplode,
  sfxHurt,
  sfxPickup,
  sfxDoor,
  sfxStep,
} from "./audio.js";

const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start");
const hudEl = document.getElementById("hud");
const crosshairEl = document.getElementById("crosshair");
const healthText = document.getElementById("health-text");
const ammoText = document.getElementById("ammo-text");
const weaponText = document.getElementById("weapon-text");
const levelText = document.getElementById("level-text");
const mugshot = document.getElementById("mugshot");
const messageEl = document.getElementById("message");
const hurtVignette = document.getElementById("hurt-vignette");
const muzzleFlash = document.getElementById("muzzle-flash");
const gameoverEl = document.getElementById("gameover");
const goScoreEl = document.getElementById("go-score");
const restartBtn = document.getElementById("restart");
const levelClearEl = document.getElementById("levelclear");
const clearTitle = document.getElementById("clear-title");
const clearStats = document.getElementById("clear-stats");
const nextLevelBtn = document.getElementById("next-level");
const winEl = document.getElementById("win");
const winStats = document.getElementById("win-stats");
const playAgainBtn = document.getElementById("play-again");
const mobileEl = document.getElementById("mobile");
const joyZone = document.getElementById("joy-zone");
const joyKnob = document.getElementById("joy-knob");
const btnShoot = document.getElementById("btn-shoot");
const btnUse = document.getElementById("btn-use");

const isTouchUI =
  window.matchMedia("(pointer: coarse)").matches ||
  window.matchMedia("(hover: none)").matches ||
  "ontouchstart" in window;

canvas.tabIndex = 0;

const textures = createTextures();
const sprites = createSprites();
const renderer = createRenderer(canvas, textures, sprites);
renderer.resize();

const ENEMY_TYPES = [
  {
    sprite: "cake",
    label: "Cake Demon",
    hp: 55,
    speed: 1.7,
    damage: 12,
    floats: false,
    shoots: false,
  },
  {
    sprite: "ice",
    label: "Ice Cream Imp",
    hp: 28,
    speed: 2.5,
    damage: 8,
    floats: false,
    shoots: false,
  },
  {
    sprite: "cookie",
    label: "Cookie Demon",
    hp: 90,
    speed: 0.55,
    damage: 10,
    floats: true,
    shoots: true,
    shootRange: 11,
    shootCd: 2.4,
    fireballSpeed: 3.2,
    fireballDamage: 14,
    vMove: -0.22,
    spriteScale: 1.15,
  },
];

const state = {
  started: false,
  alive: true,
  hp: 100,
  armor: 0,
  weaponIndex: 0,
  owned: new Set(["pea"]),
  ammo: { pea: 40, corn: 0, cob: 0 },
  cooldown: 0,
  invuln: 0,
  messageT: 0,
  levelIndex: 0,
  kills: 0,
  totalKills: 0,
  levelStart: 0,
  footT: 0,
  gunKick: 0,
  muzzleT: 0,
  nukeT: 0,
};

const player = { x: 1.5, y: 1.5, angle: 0, bob: 0, nukage: false };
let map = null;
let doors = [];
let enemies = [];
let pickups = [];
let projectiles = [];

const input = {
  forward: false,
  back: false,
  left: false,
  right: false,
  turnLeft: false,
  turnRight: false,
  run: false,
  joyX: 0,
  joyY: 0,
  firing: false,
};

const joy = { active: false, pointerId: null, cx: 0, cy: 0 };
const lookTouch = { id: null, lastX: 0 };

function showMessage(text, dur = 2) {
  messageEl.textContent = text;
  state.messageT = dur;
}

function weapon() {
  return WEAPONS[state.weaponIndex];
}

function refreshHud() {
  const w = weapon();
  healthText.textContent = `${Math.ceil(state.hp)}%`;
  weaponText.textContent = w.name;
  levelText.textContent = LEVELS[state.levelIndex]?.id ?? "E1M1";
  ammoText.textContent = String(state.ammo[w.ammoKey]);
  const status = state.hp > 70 ? "ok" : state.hp > 35 ? "hurt" : "bad";
  drawMugshot(mugshot, status);
}

function equipWeapon(i) {
  const w = WEAPONS[i];
  if (!w || !state.owned.has(w.id)) {
    showMessage("No weapon");
    return;
  }
  state.weaponIndex = i;
  refreshHud();
  showMessage(w.name);
}

function loadLevel(index) {
  state.levelIndex = index;
  state.kills = 0;
  state.levelStart = performance.now();
  map = parseLevel(LEVELS[index]);
  doors = map.doors.map((d) => ({ ...d, open: false }));
  player.x = map.spawns.player.x;
  player.y = map.spawns.player.y;
  player.angle = map.spawns.player.angle;
  projectiles = [];

  enemies = map.spawns.enemies.map((s, i) => {
    const type = ENEMY_TYPES[i % ENEMY_TYPES.length];
    return {
      x: s.x,
      y: s.y,
      sprite: type.sprite,
      label: type.label,
      hp: type.hp,
      maxHp: type.hp,
      speed: type.speed,
      damage: type.damage,
      alive: true,
      attackCd: 0.5 + Math.random(),
      floats: !!type.floats,
      shoots: !!type.shoots,
      shootRange: type.shootRange || 0,
      shootCdMax: type.shootCd || 2,
      fireballSpeed: type.fireballSpeed || 3,
      fireballDamage: type.fireballDamage || 10,
      vMove: type.vMove || 0,
      spriteScale: type.spriteScale || 1,
      floatBob: Math.random() * Math.PI * 2,
    };
  });

  pickups = map.spawns.pickups.map((p) => ({
    x: p.x,
    y: p.y,
    kind: p.kind,
    sprite:
      p.kind === "health"
        ? "health"
        : p.kind === "armor"
          ? "armor"
          : p.kind === "pea"
            ? "pea"
            : p.kind === "shotgun"
              ? "shotgun"
              : "launcher",
    taken: false,
  }));

  refreshHud();
  showMessage(`${map.id}: ${map.name}`);
}

function startGame() {
  state.started = true;
  state.alive = true;
  state.hp = 100;
  state.armor = 0;
  state.weaponIndex = 0;
  state.owned = new Set(["pea"]);
  state.ammo = { pea: 40, corn: 0, cob: 0 };
  state.cooldown = 0;
  state.invuln = 0;
  state.totalKills = 0;
  state.gunKick = 0;
  state.muzzleT = 0;
  state.nukeT = 0;

  overlay.classList.add("hidden");
  gameoverEl.classList.add("hidden");
  levelClearEl.classList.add("hidden");
  winEl.classList.add("hidden");
  hudEl.classList.remove("hidden");
  crosshairEl.classList.remove("hidden");
  if (isTouchUI) mobileEl.classList.remove("hidden");

  loadLevel(0);
  canvas.focus();
  if (!isTouchUI) {
    requestAnimationFrame(() => canvas.requestPointerLock?.());
  }
}

function setHealth(hp) {
  state.hp = Math.max(0, Math.min(100, hp));
  refreshHud();
  if (state.hp <= 0 && state.alive) {
    state.alive = false;
    document.exitPointerLock?.();
    crosshairEl.classList.add("hidden");
    mobileEl.classList.add("hidden");
    goScoreEl.textContent = `Kills ${state.totalKills}`;
    gameoverEl.classList.remove("hidden");
    sfxHurt();
  }
}

function onHurt(dmg, label) {
  if (state.invuln > 0 || !state.alive) return;
  let taken = dmg;
  if (state.armor > 0) {
    const absorbed = Math.min(state.armor, Math.ceil(dmg * 0.5));
    state.armor -= absorbed;
    taken = dmg - absorbed;
  }
  setHealth(state.hp - taken);
  state.invuln = 0.55;
  sfxHurt();
  hurtVignette.classList.add("show");
  setTimeout(() => hurtVignette.classList.remove("show"), 160);
  showMessage(`${label} hit you!`);
}

function tryMove(nx, ny) {
  const r = 0.2;
  if (
    !isBlocked(map, nx - r, player.y, doors) &&
    !isBlocked(map, nx + r, player.y, doors)
  ) {
    player.x = nx;
  }
  if (
    !isBlocked(map, player.x, ny - r, doors) &&
    !isBlocked(map, player.x, ny + r, doors)
  ) {
    player.y = ny;
  }
}

function tryUse() {
  // Open nearby door
  const fx = player.x + Math.cos(player.angle) * 0.8;
  const fy = player.y + Math.sin(player.angle) * 0.8;
  const mx = Math.floor(fx);
  const my = Math.floor(fy);
  const door = doors.find((d) => d.x === mx && d.y === my && !d.open);
  if (door) {
    door.open = true;
    map.tiles[door.y][door.x] = 0;
    sfxDoor();
    showMessage("Door opened");
    return;
  }
  // Exit
  const ex = map.spawns.exit;
  if (ex && Math.hypot(player.x - ex.x, player.y - ex.y) < 1.2) {
    completeLevel();
  } else {
    showMessage("Find the EXIT");
  }
}

function completeLevel() {
  document.exitPointerLock?.();
  crosshairEl.classList.add("hidden");
  mobileEl.classList.add("hidden");
  const secs = ((performance.now() - state.levelStart) / 1000).toFixed(1);
  clearTitle.textContent = `${LEVELS[state.levelIndex].id} COMPLETE`;
  clearStats.textContent = `Kills ${state.kills} · Time ${secs}s`;
  nextLevelBtn.textContent =
    state.levelIndex >= LEVELS.length - 1 ? "FINISH" : "NEXT FLOOR";
  levelClearEl.classList.remove("hidden");
}

function fire() {
  if (!state.alive || state.cooldown > 0) return;
  const w = weapon();
  if (state.ammo[w.ammoKey] < w.ammoPerShot) {
    showMessage("Out of ammo!");
    return;
  }
  state.ammo[w.ammoKey] -= w.ammoPerShot;
  state.cooldown = w.cooldown;
  state.gunKick = 1;
  state.muzzleT = 0.08;
  sfxShoot(w.id === "pea" ? "pea" : w.id);
  refreshHud();
  muzzleFlash.classList.add("show");
  setTimeout(() => muzzleFlash.classList.remove("show"), 55);

  const count = w.count || 1;
  const rightX = -Math.sin(player.angle);
  const rightY = Math.cos(player.angle);
  const muzzleDist = 0.55;
  const muzzleSide = 0.12;
  for (let i = 0; i < count; i++) {
    const ang =
      player.angle +
      (count === 1
        ? (Math.random() - 0.5) * w.spread
        : (i / (count - 1) - 0.5) * w.spread * 2);
    projectiles.push({
      x: player.x + Math.cos(player.angle) * muzzleDist + rightX * muzzleSide,
      y: player.y + Math.sin(player.angle) * muzzleDist + rightY * muzzleSide,
      vx: Math.cos(ang) * w.speed,
      vy: Math.sin(ang) * w.speed,
      damage: w.damage,
      splash: w.splash || 0,
      life: 1.6,
      sprite: w.projectileSprite,
      owner: "player",
      isProjectile: true,
      spriteScale: 0.35,
      vMove: 0.38,
      vMoveTarget: 0.04,
    });
  }
}

function damageEnemy(e, dmg) {
  if (!e.alive) return;
  e.hp -= dmg;
  sfxHit();
  if (e.hp <= 0) {
    e.alive = false;
    state.kills++;
    state.totalKills++;
    showMessage(`${e.label} gibbed!`);
  }
}

function explode(x, y, dmg, radius) {
  if (radius > 0) sfxExplode();
  for (const e of enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < radius) damageEnemy(e, dmg * (1 - d / radius));
  }
  if (radius > 0 && Math.hypot(player.x - x, player.y - y) < radius * 0.6) {
    onHurt(Math.round(dmg * 0.2), "Cob blast");
  }
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    e.attackCd = Math.max(0, e.attackCd - dt);
    if (e.floats) e.floatBob += dt * 2.2;

    if (dist < 14 && dist > 0.01) {
      // Floaters drift slowly; melee demons charge
      const engage = e.shoots ? dist > 3.5 : true;
      if (engage) {
        const nx = e.x + (dx / dist) * e.speed * dt;
        const ny = e.y + (dy / dist) * e.speed * dt;
        if (!isBlocked(map, nx, e.y, doors)) e.x = nx;
        if (!isBlocked(map, e.x, ny, doors)) e.y = ny;
      }

      if (e.shoots && dist < e.shootRange && dist > 1.2 && e.attackCd <= 0) {
        const inv = 1 / dist;
        projectiles.push({
          x: e.x + dx * inv * 0.4,
          y: e.y + dy * inv * 0.4,
          vx: dx * inv * e.fireballSpeed,
          vy: dy * inv * e.fireballSpeed,
          damage: e.fireballDamage,
          splash: 0,
          life: 3.5,
          sprite: "fireball",
          owner: "enemy",
          isProjectile: true,
          spriteScale: 0.45,
          vMove: e.vMove || -0.1,
        });
        e.attackCd = e.shootCdMax;
        sfxShoot("pea");
      } else if (!e.shoots && dist < 0.7 && e.attackCd <= 0) {
        onHurt(e.damage, e.label);
        e.attackCd = 0.85;
      } else if (e.shoots && dist < 0.85 && e.attackCd <= 0) {
        onHurt(e.damage, e.label);
        e.attackCd = 1.1;
      }
    }
  }
}

function updatePickups() {
  for (const p of pickups) {
    if (p.taken) continue;
    if (Math.hypot(player.x - p.x, player.y - p.y) < 0.6) {
      p.taken = true;
      sfxPickup();
      if (p.kind === "health") {
        setHealth(state.hp + 25);
        showMessage("+25 HEALTH");
      } else if (p.kind === "armor") {
        state.armor = Math.min(100, state.armor + 50);
        showMessage("+50 ARMOR");
      } else if (p.kind === "pea") {
        state.ammo.pea += 25;
        showMessage("+25 PEAS");
      } else if (p.kind === "shotgun") {
        state.owned.add("shotgun");
        state.ammo.corn += 12;
        equipWeapon(1);
        showMessage("CORN SHOTGUN!");
      } else if (p.kind === "launcher") {
        state.owned.add("launcher");
        state.ammo.cob += 5;
        equipWeapon(2);
        showMessage("COB LAUNCHER!");
      }
      refreshHud();
    }
  }
}

function entitiesForDraw() {
  return [
    ...enemies.filter((e) => e.alive),
    ...pickups.filter((p) => !p.taken),
    ...projectiles.map((p) => ({
      x: p.x,
      y: p.y,
      sprite: p.sprite || "peaBall",
      alive: true,
      isProjectile: true,
      spriteScale: p.spriteScale || 0.35,
      vMove: p.vMove || 0,
    })),
  ];
}

function applyKey(e, pressed) {
  if (!state.started || !state.alive) return;
  const c = e.code;
  const k = e.key.toLowerCase();
  let handled = true;
  if (c === "KeyW" || c === "ArrowUp") input.forward = pressed;
  else if (c === "KeyS" || c === "ArrowDown") input.back = pressed;
  else if (c === "KeyA") input.left = pressed;
  else if (c === "KeyD") input.right = pressed;
  else if (c === "ArrowLeft") input.turnLeft = pressed;
  else if (c === "ArrowRight") input.turnRight = pressed;
  else if (c === "ShiftLeft" || c === "ShiftRight") input.run = pressed;
  else if ((c === "KeyE" || k === "e" || c === "Space") && pressed) tryUse();
  else if (pressed && (c === "Digit1" || c === "Numpad1")) equipWeapon(0);
  else if (pressed && (c === "Digit2" || c === "Numpad2")) equipWeapon(1);
  else if (pressed && (c === "Digit3" || c === "Numpad3")) equipWeapon(2);
  else handled = false;
  if (handled) e.preventDefault();
}

function clearInput() {
  Object.keys(input).forEach((k) => {
    if (typeof input[k] === "boolean") input[k] = false;
    if (typeof input[k] === "number") input[k] = 0;
  });
  input.joyX = 0;
  input.joyY = 0;
  input.firing = false;
}

function setJoyKnob(nx, ny) {
  const max = 36;
  joyKnob.style.transform = `translate(${nx * max}px, ${ny * max}px)`;
}

function onJoyStart(e) {
  if (!state.started || !state.alive) return;
  e.preventDefault();
  const t = e.changedTouches ? e.changedTouches[0] : e;
  const base = document.getElementById("joy-base").getBoundingClientRect();
  joy.active = true;
  joy.pointerId = t.identifier ?? "mouse";
  joy.cx = base.left + base.width / 2;
  joy.cy = base.top + base.height / 2;
  onJoyMove(e);
}

function onJoyMove(e) {
  if (!joy.active) return;
  e.preventDefault();
  const touches = e.changedTouches || [e];
  for (const t of touches) {
    if ((t.identifier ?? "mouse") !== joy.pointerId && joy.pointerId !== "mouse") continue;
    const dx = t.clientX - joy.cx;
    const dy = t.clientY - joy.cy;
    const len = Math.hypot(dx, dy) || 1;
    const max = 48;
    const clamped = Math.min(1, len / max);
    input.joyX = (dx / len) * clamped;
    input.joyY = (dy / len) * clamped;
    setJoyKnob(input.joyX, input.joyY);
  }
}

function onJoyEnd(e) {
  if (!joy.active) return;
  const touches = e.changedTouches;
  if (touches) {
    let match = false;
    for (const t of touches) {
      if (t.identifier === joy.pointerId) match = true;
    }
    if (!match) return;
  }
  joy.active = false;
  joy.pointerId = null;
  input.joyX = 0;
  input.joyY = 0;
  setJoyKnob(0, 0);
}

joyZone.addEventListener("touchstart", onJoyStart, { passive: false });
joyZone.addEventListener("touchmove", onJoyMove, { passive: false });
joyZone.addEventListener("touchend", onJoyEnd, { passive: false });
joyZone.addEventListener("touchcancel", onJoyEnd, { passive: false });

btnShoot.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    input.firing = true;
    fire();
  },
  { passive: false }
);
btnShoot.addEventListener("touchend", () => {
  input.firing = false;
});
btnShoot.addEventListener("touchcancel", () => {
  input.firing = false;
});
btnUse.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    tryUse();
  },
  { passive: false }
);

// Look / turn: drag on right half of screen (not on buttons)
function onLookStart(e) {
  if (!state.started || !state.alive || !isTouchUI) return;
  const t = e.changedTouches[0];
  if (t.clientX < window.innerWidth * 0.45) return;
  if (e.target.closest("#mobile-actions") || e.target.closest("#joy-zone")) return;
  lookTouch.id = t.identifier;
  lookTouch.lastX = t.clientX;
}

function onLookMove(e) {
  if (lookTouch.id == null) return;
  for (const t of e.changedTouches) {
    if (t.identifier !== lookTouch.id) continue;
    e.preventDefault();
    player.angle += (t.clientX - lookTouch.lastX) * 0.005;
    lookTouch.lastX = t.clientX;
  }
}

function onLookEnd(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === lookTouch.id) lookTouch.id = null;
  }
}

document.addEventListener("touchstart", onLookStart, { passive: true });
document.addEventListener("touchmove", onLookMove, { passive: false });
document.addEventListener("touchend", onLookEnd, { passive: true });
document.addEventListener("touchcancel", onLookEnd, { passive: true });

document.addEventListener("keydown", (e) => applyKey(e, true), { passive: false });
document.addEventListener("keyup", (e) => applyKey(e, false), { passive: false });
window.addEventListener("blur", clearInput);

document.addEventListener("mousedown", (e) => {
  if (!state.started || !state.alive || e.button !== 0) return;
  if (document.pointerLockElement === canvas || e.target === canvas) fire();
});

document.addEventListener("mousemove", (e) => {
  if (!state.started || !state.alive) return;
  if (document.pointerLockElement !== canvas) return;
  player.angle += e.movementX * 0.0025;
});

canvas.addEventListener("click", () => {
  if (!state.started || !state.alive || isTouchUI) return;
  canvas.focus();
  canvas.requestPointerLock?.();
});

startBtn.addEventListener("click", (e) => {
  e.preventDefault();
  unlockAudio();
  startGame();
});
restartBtn.addEventListener("click", (e) => {
  e.preventDefault();
  unlockAudio();
  startGame();
});
nextLevelBtn.addEventListener("click", (e) => {
  e.preventDefault();
  levelClearEl.classList.add("hidden");
  if (state.levelIndex >= LEVELS.length - 1) {
    winStats.textContent = `Total kills ${state.totalKills}. Desserts are compost.`;
    winEl.classList.remove("hidden");
    return;
  }
  loadLevel(state.levelIndex + 1);
  crosshairEl.classList.remove("hidden");
  if (isTouchUI) mobileEl.classList.remove("hidden");
  canvas.focus();
  if (!isTouchUI) {
    requestAnimationFrame(() => canvas.requestPointerLock?.());
  }
});
playAgainBtn.addEventListener("click", (e) => {
  e.preventDefault();
  winEl.classList.add("hidden");
  startGame();
});

window.addEventListener("resize", () => renderer.resize());

let last = performance.now();

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  requestAnimationFrame(tick);

  if (state.messageT > 0) {
    state.messageT -= dt;
    if (state.messageT <= 0) messageEl.textContent = "";
  }

  state.gunKick = Math.max(0, state.gunKick - dt * 4);
  state.muzzleT = Math.max(0, state.muzzleT - dt);

  if (state.started && state.alive && map) {
    state.invuln = Math.max(0, state.invuln - dt);
    state.cooldown = Math.max(0, state.cooldown - dt);

    if (input.firing) fire();

    if (input.turnLeft) player.angle -= 2.2 * dt;
    if (input.turnRight) player.angle += 2.2 * dt;

    const speed = (input.run ? 4.2 : 2.8) * dt;
    let mx = 0;
    let my = 0;
    if (input.forward) {
      mx += Math.cos(player.angle);
      my += Math.sin(player.angle);
    }
    if (input.back) {
      mx -= Math.cos(player.angle);
      my -= Math.sin(player.angle);
    }
    if (input.right) {
      mx += Math.cos(player.angle + Math.PI / 2);
      my += Math.sin(player.angle + Math.PI / 2);
    }
    if (input.left) {
      mx += Math.cos(player.angle - Math.PI / 2);
      my += Math.sin(player.angle - Math.PI / 2);
    }
    // Virtual joystick: Y forward/back, X strafe
    if (Math.abs(input.joyX) > 0.12 || Math.abs(input.joyY) > 0.12) {
      mx += Math.cos(player.angle) * -input.joyY;
      my += Math.sin(player.angle) * -input.joyY;
      mx += Math.cos(player.angle + Math.PI / 2) * input.joyX;
      my += Math.sin(player.angle + Math.PI / 2) * input.joyX;
    }
    const len = Math.hypot(mx, my);
    if (len > 0) {
      tryMove(player.x + (mx / len) * speed, player.y + (my / len) * speed);
      player.bob += dt * (input.run ? 14 : 10);
      state.footT -= dt;
      if (state.footT <= 0) {
        sfxStep();
        state.footT = input.run ? 0.28 : 0.38;
      }
    }

    player.nukage = isNukage(map, player.x, player.y);
    if (player.nukage) {
      state.nukeT -= dt;
      if (state.nukeT <= 0) {
        onHurt(5, "Nukage");
        state.nukeT = 0.7;
      }
    } else {
      state.nukeT = 0.15;
    }

    // Projectiles — visible peas / kernels / cobs / demon fireballs
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.vMoveTarget != null) {
        p.vMove += (p.vMoveTarget - p.vMove) * Math.min(1, dt * 5);
      }

      const wall = isBlocked(map, p.x, p.y, doors);
      if (p.owner === "enemy") {
        if (p.life <= 0 || wall) {
          projectiles.splice(i, 1);
          continue;
        }
        if (Math.hypot(player.x - p.x, player.y - p.y) < 0.4) {
          onHurt(p.damage, "Fireball");
          projectiles.splice(i, 1);
        }
        continue;
      }

      let hitEnemy = null;
      for (const e of enemies) {
        if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < 0.45) {
          hitEnemy = e;
          break;
        }
      }
      if (p.life <= 0 || wall || hitEnemy) {
        if (p.splash > 0) {
          explode(p.x, p.y, p.damage, p.splash);
        } else if (hitEnemy) {
          damageEnemy(hitEnemy, p.damage);
        }
        projectiles.splice(i, 1);
      }
    }

    updateEnemies(dt);
    updatePickups();

    renderer.render(
      player,
      map,
      doors,
      entitiesForDraw(),
      weapon().id,
      state.gunKick,
      state.muzzleT > 0
    );
  } else if (!state.started) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#120c0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    renderer.render(player, map, doors, entitiesForDraw(), weapon().id, 0, false);
  }
}

refreshHud();
requestAnimationFrame(tick);
