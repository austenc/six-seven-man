import * as THREE from "three";
import { LEVELS, parseLevel } from "./maps.js";
import {
  buildLevel,
  disposeLevel,
  isSolidAt,
  tryUseDoor,
  updateDoors,
  CELL,
} from "./level.js";
import { createPlayerModel, updatePlayerPose } from "./player.js";
import { WEAPONS, createGunMesh, createProjectile } from "./weapons.js";
import { spawnEnemies, clearEnemies, updateEnemies, hitEnemy } from "./enemies.js";
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
  firingPose: 0,
};

const input = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
  use: false,
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0e0a);
scene.fog = new THREE.FogExp2(0x1a0e0a, 0.045);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 200);

const hemi = new THREE.HemisphereLight(0xffccaa, 0x221108, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xff8844, 0.35);
sun.position.set(20, 40, 10);
scene.add(sun);

const player = createPlayerModel();
scene.add(player);

const cam = { yaw: 0, pitch: 0.18, dist: 7.5, minP: -0.1, maxP: 0.55 };
const velocityY = { v: 0 };
let grounded = true;

let level = null;
let enemies = [];
let pickups = [];
let projectiles = [];
let gunMesh = null;

const tmp = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const wish = new THREE.Vector3();
const aimOrigin = new THREE.Vector3();
const aimDir = new THREE.Vector3();
const shootRay = new THREE.Raycaster();

function showMessage(text, dur = 2) {
  messageEl.textContent = text;
  state.messageT = dur;
}

function currentWeapon() {
  return WEAPONS[state.weaponIndex];
}

function refreshHud() {
  const w = currentWeapon();
  healthText.textContent = `${Math.ceil(state.hp)}%`;
  weaponText.textContent = w.name;
  levelText.textContent = LEVELS[state.levelIndex]?.id ?? "E1M1";
  const ammo = state.ammo[w.ammoKey];
  ammoText.textContent = String(ammo);
  if (state.hp > 70) faceEl.textContent = "😠";
  else if (state.hp > 35) faceEl.textContent = "😣";
  else faceEl.textContent = "🤕";
}

function equipWeapon(index) {
  const w = WEAPONS[index];
  if (!w || !state.owned.has(w.id)) {
    showMessage("No weapon in that slot.");
    return;
  }
  state.weaponIndex = index;
  attachGun();
  refreshHud();
  showMessage(w.name);
}

function attachGun() {
  const hand = player.userData.hand;
  while (hand.children.length) hand.remove(hand.children[0]);
  gunMesh = createGunMesh(currentWeapon().id);
  gunMesh.rotation.set(0.2, 0, 0);
  hand.add(gunMesh);
}

function solidPlayer(x, z) {
  const r = 0.55;
  return (
    isSolidAt(level, x + r, z) ||
    isSolidAt(level, x - r, z) ||
    isSolidAt(level, x, z + r) ||
    isSolidAt(level, x, z - r)
  );
}

function clearPickups() {
  for (const p of pickups) scene.remove(p.mesh);
  pickups = [];
}

function spawnPickups(spawns) {
  clearPickups();
  for (const s of spawns.pickups) {
    const color =
      s.kind === "health" ? 0xe74c3c : s.kind === "pea" ? 0x6ab04c : s.kind === "shotgun" ? 0xf1c40f : 0xe67e22;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
    );
    mesh.position.set(s.x * CELL, 1.0, s.z * CELL);
    scene.add(mesh);
    pickups.push({ mesh, kind: s.kind, taken: false });
  }
}

function loadLevel(index) {
  disposeLevel(scene, level);
  clearEnemies(scene, enemies);
  clearPickups();
  for (const p of projectiles) scene.remove(p.mesh);
  projectiles = [];

  state.levelIndex = index;
  state.kills = 0;
  state.levelStart = performance.now();

  const parsed = parseLevel(LEVELS[index]);
  level = buildLevel(scene, parsed);
  enemies = spawnEnemies(scene, parsed.spawns);
  spawnPickups(parsed.spawns);

  const start = parsed.spawns.player;
  player.position.set(start.x * CELL, 0, start.z * CELL);
  cam.yaw = 0;
  cam.pitch = 0.18;
  velocityY.v = 0;
  grounded = true;

  attachGun();
  refreshHud();
  showMessage(`${parsed.id}: ${parsed.name}`);
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
  state.levelIndex = 0;

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

function triggerGameOver() {
  state.alive = false;
  document.exitPointerLock?.();
  crosshairEl.classList.add("hidden");
  goScoreEl.textContent = `Kills ${state.totalKills}`;
  gameoverEl.classList.remove("hidden");
  sfxHurt();
}

function completeLevel() {
  document.exitPointerLock?.();
  crosshairEl.classList.add("hidden");
  const secs = ((performance.now() - state.levelStart) / 1000).toFixed(1);
  clearTitle.textContent = `${LEVELS[state.levelIndex].id} COMPLETE`;
  clearStats.textContent = `Kills ${state.kills} · Time ${secs}s`;
  nextLevelBtn.textContent =
    state.levelIndex >= LEVELS.length - 1 ? "FINISH HIM (THE CAKE)" : "NEXT FLOOR";
  levelClearEl.classList.remove("hidden");
}

function goNextLevel() {
  levelClearEl.classList.add("hidden");
  if (state.levelIndex >= LEVELS.length - 1) {
    winStats.textContent = `Total kills ${state.totalKills}. The desserts are compost.`;
    winEl.classList.remove("hidden");
    return;
  }
  loadLevel(state.levelIndex + 1);
  crosshairEl.classList.remove("hidden");
  canvas.focus();
  requestAnimationFrame(() => canvas.requestPointerLock?.());
}

function setHealth(hp) {
  state.hp = Math.max(0, Math.min(100, hp));
  refreshHud();
  if (state.hp <= 0 && state.alive) triggerGameOver();
}

function onHitPlayer(dmg, label) {
  if (state.invuln > 0 || !state.alive) return;
  setHealth(state.hp - dmg);
  state.invuln = 0.65;
  sfxHurt();
  hurtVignette.classList.add("show");
  setTimeout(() => hurtVignette.classList.remove("show"), 180);
  showMessage(`${label} hit you!`);
}

function getAim() {
  // Camera ray through crosshair → aim point; weapon fires from player toward that
  shootRay.setFromCamera(new THREE.Vector2(0, 0), camera);
  const far = tmp.copy(shootRay.ray.origin).addScaledVector(shootRay.ray.direction, 60);
  aimOrigin.set(player.position.x, player.position.y + 3.2, player.position.z);
  aimDir.subVectors(far, aimOrigin).normalize();
  return { origin: aimOrigin, dir: aimDir };
}

function fire() {
  if (!state.alive || state.cooldown > 0) return;
  const w = currentWeapon();
  if (state.ammo[w.ammoKey] < w.ammoPerShot) {
    showMessage("Out of ammo!");
    return;
  }
  state.ammo[w.ammoKey] -= w.ammoPerShot;
  state.cooldown = w.cooldown;
  state.firingPose = 0.18;
  sfxShoot(w.id === "pea" ? "pea" : w.id);
  refreshHud();
  muzzleFlash.classList.add("show");
  setTimeout(() => muzzleFlash.classList.remove("show"), 60);
  cam.pitch -= w.kick * 0.08;

  const { origin, dir } = getAim();

  if (w.projectile) {
    const mesh = createProjectile(w.color);
    mesh.position.copy(origin);
    scene.add(mesh);
    projectiles.push({
      mesh,
      vel: dir.clone().multiplyScalar(28),
      life: 2.2,
      damage: w.damage,
      splash: w.splash,
    });
    return;
  }

  // Hitscan pellets
  for (let i = 0; i < w.pellets; i++) {
    const d = dir.clone();
    d.x += (Math.random() - 0.5) * w.spread * 2;
    d.y += (Math.random() - 0.5) * w.spread;
    d.z += (Math.random() - 0.5) * w.spread * 2;
    d.normalize();

    let best = null;
    let bestT = w.range;
    for (const e of enemies) {
      if (!e.alive) continue;
      const center = e.mesh.position.clone();
      center.y += 1.2;
      const to = center.clone().sub(origin);
      const t = to.dot(d);
      if (t < 0.3 || t > w.range) continue;
      const closest = origin.clone().addScaledVector(d, t);
      if (closest.distanceToSquared(center) > (e.radius + 0.35) ** 2) continue;
      if (t < bestT) {
        bestT = t;
        best = e;
      }
    }
    if (best) {
      const killed = hitEnemy(best, w.damage);
      sfxHit();
      if (killed) {
        state.kills++;
        state.totalKills++;
        showMessage(`${best.type.label} gibbed!`);
      }
    }
  }
}

function explodeAt(pos, damage, radius) {
  sfxExplode();
  const blast = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6622 })
  );
  blast.position.copy(pos);
  scene.add(blast);
  setTimeout(() => scene.remove(blast), 120);

  for (const e of enemies) {
    if (!e.alive) continue;
    const d = e.mesh.position.distanceTo(pos);
    if (d < radius) {
      const falloff = 1 - d / radius;
      const killed = hitEnemy(e, damage * falloff);
      if (killed) {
        state.kills++;
        state.totalKills++;
        showMessage(`${e.type.label} exploded!`);
      }
    }
  }
  if (player.position.distanceTo(pos) < radius * 0.7) {
    onHitPlayer(Math.round(damage * 0.25), "Cob blast");
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.life -= dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.lookAt(p.mesh.position.clone().add(p.vel));

    let hit = false;
    if (isSolidAt(level, p.mesh.position.x, p.mesh.position.z)) hit = true;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (p.mesh.position.distanceTo(e.mesh.position) < 1.2) {
        hit = true;
        break;
      }
    }
    if (hit || p.life <= 0) {
      explodeAt(p.mesh.position.clone(), p.damage, p.splash);
      scene.remove(p.mesh);
      projectiles.splice(i, 1);
    }
  }
}

function updatePickups() {
  for (const p of pickups) {
    if (p.taken) continue;
    p.mesh.rotation.y += 0.03;
    p.mesh.position.y = 1 + Math.sin(performance.now() * 0.005) * 0.15;
    if (player.position.distanceTo(p.mesh.position) < 1.6) {
      p.taken = true;
      p.mesh.visible = false;
      sfxPickup();
      if (p.kind === "health") {
        setHealth(state.hp + 25);
        showMessage("+25 HEALTH");
      } else if (p.kind === "pea") {
        state.ammo.pea += 20;
        showMessage("+20 PEAS");
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

function tryUse() {
  if (tryUseDoor(level, player.position.x, player.position.z)) {
    sfxDoor();
    showMessage("Door opened");
    return;
  }
  const ex = level.parsed.spawns.exit;
  if (ex) {
    const dx = player.position.x - ex.x * CELL;
    const dz = player.position.z - ex.z * CELL;
    if (dx * dx + dz * dz < (CELL * 1.1) ** 2) {
      // Need most enemies dead? Soft: just reach exit
      completeLevel();
    } else {
      showMessage("Find the green exit pad");
    }
  }
}

function applyKey(e, pressed) {
  if (!state.started || !state.alive) return;
  const c = e.code;
  const k = e.key.toLowerCase();
  let handled = true;
  if (c === "KeyW" || c === "ArrowUp" || k === "w") input.forward = pressed;
  else if (c === "KeyS" || c === "ArrowDown" || k === "s") input.back = pressed;
  else if (c === "KeyA" || c === "ArrowLeft" || k === "a") input.left = pressed;
  else if (c === "KeyD" || c === "ArrowRight" || k === "d") input.right = pressed;
  else if (c === "ShiftLeft" || c === "ShiftRight") input.run = pressed;
  else if ((c === "KeyE" || k === "e") && pressed) tryUse();
  else if (pressed && (c === "Digit1" || c === "Numpad1")) equipWeapon(0);
  else if (pressed && (c === "Digit2" || c === "Numpad2")) equipWeapon(1);
  else if (pressed && (c === "Digit3" || c === "Numpad3")) equipWeapon(2);
  else handled = false;
  if (handled) e.preventDefault();
}

function clearInput() {
  input.forward = input.back = input.left = input.right = input.run = false;
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
  cam.yaw -= e.movementX * 0.0022;
  cam.pitch += e.movementY * 0.0018;
  cam.pitch = Math.max(cam.minP, Math.min(cam.maxP, cam.pitch));
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
  goNextLevel();
});
playAgainBtn.addEventListener("click", (e) => {
  e.preventDefault();
  winEl.classList.add("hidden");
  startGame();
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();

function updateCamera(dt) {
  const targetY = player.position.y + 3.4;
  const cp = Math.cos(cam.pitch);
  camera.position.set(
    player.position.x + Math.sin(cam.yaw) * cp * cam.dist,
    targetY + Math.sin(cam.pitch) * cam.dist + 0.8,
    player.position.z + Math.cos(cam.yaw) * cp * cam.dist
  );
  // Soft pull out of walls
  if (level && isSolidAt(level, camera.position.x, camera.position.z, true)) {
    camera.position.lerp(tmp.set(player.position.x, targetY + 1, player.position.z), 0.65);
  }
  camera.lookAt(player.position.x, targetY, player.position.z);
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  requestAnimationFrame(tick);

  if (state.messageT > 0) {
    state.messageT -= dt;
    if (state.messageT <= 0) messageEl.textContent = "";
  }

  if (state.started && state.alive && level) {
    state.invuln = Math.max(0, state.invuln - dt);
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.firingPose = Math.max(0, state.firingPose - dt);

    forward.set(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
    right.set(-forward.z, 0, forward.x);

    // Face aim
    const faceYaw = Math.atan2(forward.x, forward.z);
    let dy = faceYaw - player.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    player.rotation.y += dy * Math.min(1, 16 * dt);

    wish.set(0, 0, 0);
    if (input.forward) wish.add(forward);
    if (input.back) wish.sub(forward);
    if (input.right) wish.add(right);
    if (input.left) wish.sub(right);

    const moving = wish.lengthSq() > 0;
    const speed = (input.run ? 14 : 9.5) * (moving ? 1 : 0);
    if (moving) {
      wish.normalize();
      const nx = player.position.x + wish.x * speed * dt;
      const nz = player.position.z + wish.z * speed * dt;
      if (!solidPlayer(nx, player.position.z)) player.position.x = nx;
      if (!solidPlayer(player.position.x, nz)) player.position.z = nz;

      state.footT -= dt;
      if (state.footT <= 0) {
        sfxStep();
        state.footT = input.run ? 0.24 : 0.34;
      }
    }

    updatePlayerPose(player, {
      moving,
      sprint: input.run,
      dt,
      firing: state.firingPose > 0,
    });

    updateDoors(level, dt);
    updateEnemies(
      enemies,
      player.position,
      dt,
      (x, z) => isSolidAt(level, x, z),
      onHitPlayer
    );
    updateProjectiles(dt);
    updatePickups();
  }

  updateCamera(dt);
  renderer.render(scene, camera);
}

refreshHud();
tick();
