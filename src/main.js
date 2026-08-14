import { LEVELS, parseLevel, isBlocked } from "./maps.js";
import { createTextures, createSprites } from "./textures.js";
import { createRenderer, hitscan } from "./raycast.js";
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
const faceEl = document.getElementById("face");
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

canvas.tabIndex = 0;

const textures = createTextures();
const sprites = createSprites();
const renderer = createRenderer(canvas, textures, sprites);
renderer.resize();

const ENEMY_TYPES = [
  { sprite: "cake", label: "Cake Demon", hp: 50, speed: 1.8, damage: 10 },
  { sprite: "ice", label: "Ice Cream Imp", hp: 30, speed: 2.6, damage: 8 },
  { sprite: "cookie", label: "Cookie Fiend", hp: 80, speed: 1.4, damage: 14 },
];

const state = {
  started: false,
  alive: true,
  hp: 100,
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
};

const player = { x: 1.5, y: 1.5, angle: 0, bob: 0 };
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
};

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
  faceEl.textContent = state.hp > 70 ? "😠" : state.hp > 35 ? "😣" : "🤕";
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
      attackCd: 0,
    };
  });

  pickups = map.spawns.pickups.map((p) => ({
    x: p.x,
    y: p.y,
    kind: p.kind,
    sprite:
      p.kind === "health"
        ? "health"
        : p.kind === "pea"
          ? "peaAmmo"
          : p.kind === "shotgun"
            ? "cornAmmo"
            : "cobAmmo",
    taken: false,
  }));

  refreshHud();
  showMessage(`${map.id}: ${map.name}`);
}

function startGame() {
  state.started = true;
  state.alive = true;
  state.hp = 100;
  state.weaponIndex = 0;
  state.owned = new Set(["pea"]);
  state.ammo = { pea: 40, corn: 0, cob: 0 };
  state.cooldown = 0;
  state.invuln = 0;
  state.totalKills = 0;
  state.gunKick = 0;

  overlay.classList.add("hidden");
  gameoverEl.classList.add("hidden");
  levelClearEl.classList.add("hidden");
  winEl.classList.add("hidden");
  hudEl.classList.remove("hidden");
  crosshairEl.classList.remove("hidden");

  loadLevel(0);
  canvas.focus();
  requestAnimationFrame(() => canvas.requestPointerLock?.());
}

function setHealth(hp) {
  state.hp = Math.max(0, Math.min(100, hp));
  refreshHud();
  if (state.hp <= 0 && state.alive) {
    state.alive = false;
    document.exitPointerLock?.();
    crosshairEl.classList.add("hidden");
    goScoreEl.textContent = `Kills ${state.totalKills}`;
    gameoverEl.classList.remove("hidden");
    sfxHurt();
  }
}

function onHurt(dmg, label) {
  if (state.invuln > 0 || !state.alive) return;
  setHealth(state.hp - dmg);
  state.invuln = 0.6;
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
  sfxShoot(w.id === "pea" ? "pea" : w.id);
  refreshHud();
  muzzleFlash.classList.add("show");
  setTimeout(() => muzzleFlash.classList.remove("show"), 50);

  if (w.projectile) {
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(player.angle) * 10,
      vy: Math.sin(player.angle) * 10,
      damage: w.damage,
      splash: w.splash,
      life: 2,
    });
    return;
  }

  for (let i = 0; i < w.pellets; i++) {
    const ang = player.angle + (Math.random() - 0.5) * w.spread * 2;
    const saved = player.angle;
    player.angle = ang;
    const hit = hitscan(player, map, doors, enemies, w.range);
    player.angle = saved;
    if (hit) damageEnemy(hit, w.damage);
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
  sfxExplode();
  for (const e of enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < radius) damageEnemy(e, dmg * (1 - d / radius));
  }
  if (Math.hypot(player.x - x, player.y - y) < radius * 0.6) {
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
    if (dist < 12 && dist > 0.01) {
      const nx = e.x + (dx / dist) * e.speed * dt;
      const ny = e.y + (dy / dist) * e.speed * dt;
      if (!isBlocked(map, nx, e.y, doors)) e.x = nx;
      if (!isBlocked(map, e.x, ny, doors)) e.y = ny;
      if (dist < 0.7 && e.attackCd <= 0) {
        onHurt(e.damage, e.label);
        e.attackCd = 0.85;
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
      sprite: "cobAmmo",
      alive: true,
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
  Object.keys(input).forEach((k) => (input[k] = false));
}

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
  if (!state.started || !state.alive) return;
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
  canvas.focus();
  requestAnimationFrame(() => canvas.requestPointerLock?.());
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

  if (state.started && state.alive && map) {
    state.invuln = Math.max(0, state.invuln - dt);
    state.cooldown = Math.max(0, state.cooldown - dt);

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

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let boom = p.life <= 0 || isBlocked(map, p.x, p.y, doors);
      for (const e of enemies) {
        if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < 0.5) boom = true;
      }
      if (boom) {
        explode(p.x, p.y, p.damage, p.splash);
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
      state.gunKick
    );
  } else if (!state.started) {
    // Idle dark screen behind splash
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#120c0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    renderer.render(player, map, doors, entitiesForDraw(), weapon().id, 0);
  }
}

refreshHud();
requestAnimationFrame(tick);
