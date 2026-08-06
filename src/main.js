import * as THREE from "three";
import {
  createPlayer,
  WEAPON_DEFS,
  HOTBAR_SLOT_IDS,
  updatePlayerAnim,
  attachWeaponMeshes,
} from "./player.js";
import { generateCity } from "./world.js";
import { spawnEnemies, updateEnemies, clearEnemies } from "./enemies.js";
import {
  unlockAudio,
  sfxFootstep,
  sfxJump,
  sfxSwing,
  sfxHit,
  sfxKill,
  sfxHurt,
  sfxPickup,
  sfxEquip,
  sfxCrate,
  sfxUi,
} from "./audio.js";
import { shake, spawnBurst, spawnFloater, updateFx } from "./fx.js";

const canvas = document.getElementById("game");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start");
const healthFill = document.getElementById("health-fill");
const healthText = document.getElementById("health-text");
const weaponEl = document.getElementById("weapon");
const messageEl = document.getElementById("message");
const hotbarEl = document.getElementById("hotbar");
const inventoryEl = document.getElementById("inventory");
const inventorySlotsEl = document.getElementById("inventory-slots");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const hurtVignette = document.getElementById("hurt-vignette");
const hudEl = document.getElementById("hud");
const crosshairEl = document.getElementById("crosshair");
const gameoverEl = document.getElementById("gameover");
const goScoreEl = document.getElementById("go-score");
const restartBtn = document.getElementById("restart");

canvas.tabIndex = 0;

const MAX_HP = 100;
const PLAYER_RADIUS = 0.7;
const MOVE_SPEED = 13;
const SPRINT_MULT = 1.55;
const JUMP_VEL = 11.5;
const GRAVITY = 32;

const inventory = {
  owned: new Set(["fists"]),
  equippedSlot: 0,
  open: false,
};

const state = {
  hp: MAX_HP,
  attacking: false,
  attackT: 0,
  attackDuration: 0.26,
  hitApplied: false,
  messageT: 0,
  invuln: 0,
  alive: true,
  started: false,
  score: 0,
  combo: 0,
  comboT: 0,
  footT: 0,
  wasGrounded: true,
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5d9);
scene.fog = new THREE.Fog(0x87b5d9, 70, 175);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 320);
camera.position.set(0, 10, 14);

const hemi = new THREE.HemisphereLight(0xfff2d9, 0x4a5a3a, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b0, 1.15);
sun.position.set(40, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
scene.add(sun);

const { colliders, openSpots, crates, softRadius, fadeRadius } = generateCity(scene, 67);
const player = createPlayer();
player.position.set(0, 0, 0);
scene.add(player);

const enemies = spawnEnemies(scene, openSpots, 22, 67);

const aimRay = new THREE.Raycaster();
const aimNdc = new THREE.Vector2(0, 0);
const aimPoint = new THREE.Vector3();
const aimDir = new THREE.Vector3();
const weaponOrigin = new THREE.Vector3();
const aimHitCenter = new THREE.Vector3();
const aimToCenter = new THREE.Vector3();
const softPush = new THREE.Vector3();
let aimPitch = 0;

const cam = {
  yaw: 0,
  pitch: 0.35,
  dist: 12,
  minPitch: 0.05,
  maxPitch: 1.25,
};

const input = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  sprint: false,
};

const velocity = new THREE.Vector3();
let grounded = true;

const tmp = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const wish = new THREE.Vector3();

function showMessage(text, duration = 2.2) {
  messageEl.textContent = text;
  state.messageT = duration;
}

function bumpScore(points) {
  state.score += points;
  scoreEl.textContent = `SCORE ${state.score}`;
}

function bumpCombo() {
  state.combo += 1;
  state.comboT = 2.4;
  if (state.combo >= 2) {
    comboEl.textContent = `${state.combo}x COMBO`;
    comboEl.classList.add("pop");
    comboEl.classList.remove("hidden");
    requestAnimationFrame(() => comboEl.classList.remove("pop"));
  }
}

function setHealth(hp) {
  state.hp = Math.max(0, Math.min(MAX_HP, hp));
  healthFill.style.width = `${(state.hp / MAX_HP) * 100}%`;
  healthText.textContent = String(Math.ceil(state.hp));
  if (state.hp <= 0 && state.alive) {
    triggerGameOver();
  }
}

function triggerGameOver() {
  state.alive = false;
  state.attacking = false;
  clearInput();
  document.exitPointerLock?.();
  crosshairEl.classList.add("hidden");
  goScoreEl.textContent = `SCORE ${state.score}`;
  gameoverEl.classList.remove("hidden");
  sfxHurt();
}

function restartRun() {
  gameoverEl.classList.add("hidden");
  inventory.open = false;
  inventoryEl.classList.add("hidden");

  clearEnemies(scene, enemies);
  const fresh = spawnEnemies(scene, openSpots, 22, 67 + Math.floor(Math.random() * 1000));
  enemies.push(...fresh);

  for (const c of crates) {
    c.opened = false;
    c.mesh.visible = true;
  }

  inventory.owned = new Set(["fists"]);
  inventory.equippedSlot = 0;
  attachWeaponMeshes(player, null);

  player.position.set(0, 0, 0);
  player.rotation.set(0, 0, 0);
  velocity.set(0, 0, 0);
  grounded = true;
  cam.yaw = 0;
  cam.pitch = 0.35;

  state.alive = true;
  state.attacking = false;
  state.attackT = 0;
  state.hitApplied = false;
  state.invuln = 1.2;
  state.combo = 0;
  state.comboT = 0;
  state.score = 0;
  state.messageT = 0;
  comboEl.classList.add("hidden");
  messageEl.textContent = "";

  setHealth(MAX_HP);
  bumpScore(0);
  refreshHud();
  clearInput();

  crosshairEl.classList.remove("hidden");
  hudEl.classList.remove("hidden");
  canvas.focus();
  requestAnimationFrame(() => canvas.requestPointerLock?.());
  showMessage("Back at it — desserts still hate you.");
}

function getEquippedDef() {
  const id = HOTBAR_SLOT_IDS[inventory.equippedSlot];
  if (!id || !inventory.owned.has(id)) return WEAPON_DEFS.fists;
  return WEAPON_DEFS[id] || WEAPON_DEFS.fists;
}

function refreshHud() {
  const def = getEquippedDef();
  const hands = def.twoHanded ? " (2H)" : "";
  weaponEl.textContent = `Weapon: ${def.label}${hands}`;

  hotbarEl.querySelectorAll(".hotbar-slot").forEach((el, i) => {
    const id = HOTBAR_SLOT_IDS[i];
    const owned = id && inventory.owned.has(id);
    const defSlot = id ? WEAPON_DEFS[id] : null;
    el.classList.toggle("active", i === inventory.equippedSlot);
    el.classList.toggle("locked", !owned);
    el.querySelector(".slot-name").textContent = owned && defSlot ? defSlot.label : id ? "???" : "—";
  });

  inventorySlotsEl.innerHTML = "";
  HOTBAR_SLOT_IDS.forEach((id, i) => {
    const owned = id && inventory.owned.has(id);
    const defSlot = id ? WEAPON_DEFS[id] : null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inv-item" + (i === inventory.equippedSlot ? " equipped" : "") + (!owned ? " locked" : "");
    btn.innerHTML = `
      <span class="inv-key">${i + 1}</span>
      <span class="inv-label">${owned && defSlot ? defSlot.label : id ? "Locked" : "Empty"}</span>
      <span class="inv-meta">${owned && defSlot ? `${defSlot.damage} dmg · ${defSlot.twoHanded ? "Two-handed" : "One-handed"}` : "—"}</span>
    `;
    if (owned) {
      btn.addEventListener("click", () => {
        equipSlot(i);
        setInventoryOpen(false);
        canvas.requestPointerLock?.();
      });
    }
    inventorySlotsEl.appendChild(btn);
  });
}

function equipSlot(slotIndex) {
  if (state.attacking) return;
  const id = HOTBAR_SLOT_IDS[slotIndex];
  if (!id || !inventory.owned.has(id)) {
    showMessage("Nothing in that slot yet.");
    return;
  }
  inventory.equippedSlot = slotIndex;
  const def = getEquippedDef();
  attachWeaponMeshes(player, def.builder ? def : null);
  state.attackDuration = def.attackDuration;
  refreshHud();
  sfxEquip();
  showMessage(`Equipped ${def.label}`);
}

function grantWeapon(id) {
  const def = WEAPON_DEFS[id];
  if (!def) return;
  const firstTime = !inventory.owned.has(id);
  inventory.owned.add(id);
  sfxPickup();
  if (firstTime) {
    const slot = HOTBAR_SLOT_IDS.indexOf(id);
    if (slot >= 0) equipSlot(slot);
    showMessage(`Found ${def.label}! Press ${slot + 1} or I for inventory.`);
  } else {
    showMessage(`Already have ${def.label}.`);
    refreshHud();
  }
}

function setInventoryOpen(open) {
  if (!state.alive) return;
  inventory.open = open;
  inventoryEl.classList.toggle("hidden", !open);
  crosshairEl.classList.toggle("hidden", open);
  if (open) {
    document.exitPointerLock?.();
    sfxUi();
    refreshHud();
  } else if (state.started) {
    canvas.focus();
    canvas.requestPointerLock?.();
  }
}

function tryOpenCrate() {
  if (inventory.open) return;
  let nearest = null;
  let nearestDist = 3.2;
  for (const c of crates) {
    if (c.opened) continue;
    const d = player.position.distanceTo(c.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = c;
    }
  }
  if (!nearest) {
    showMessage("No loot crate nearby.");
    return;
  }
  nearest.opened = true;
  nearest.mesh.visible = false;
  sfxCrate();
  spawnBurst(scene, nearest.position, 0xffe082, 10);
  bumpScore(15);

  const roll = Math.random();
  if (roll < 0.5) grantWeapon("carrotSword");
  else if (roll < 0.95) grantWeapon("asparagusSpear");
  else {
    setHealth(state.hp + 25);
    sfxPickup();
    spawnFloater(scene, nearest.position.clone(), "+25", "#a8e06c");
    showMessage("Found a veggie snack! +25 HP");
  }
}

function getLookDirection(out) {
  out.set(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
  return out;
}

/** Crosshair → world aim. Body + weapons + hit tests all use this. */
function updateAim() {
  aimRay.setFromCamera(aimNdc, camera);
  const ray = aimRay.ray;

  // Prefer where the crosshair meets chest-height plane; else a look-distance point
  const planeY = player.position.y + 2.4;
  let tPlane = Infinity;
  if (Math.abs(ray.direction.y) > 0.001) {
    tPlane = (planeY - ray.origin.y) / ray.direction.y;
  }
  if (tPlane > 2 && tPlane < 80) {
    aimPoint.copy(ray.origin).addScaledVector(ray.direction, tPlane);
  } else {
    aimPoint.copy(ray.origin).addScaledVector(ray.direction, 22);
  }

  weaponOrigin.set(player.position.x, player.position.y + 3.15, player.position.z);
  aimDir.subVectors(aimPoint, weaponOrigin);
  const len = aimDir.length();
  if (len < 0.5) {
    getLookDirection(tmp);
    aimDir.set(tmp.x, -Math.sin(cam.pitch - 0.25), tmp.z).normalize();
    aimPoint.copy(weaponOrigin).addScaledVector(aimDir, 16);
  } else {
    aimDir.multiplyScalar(1 / len);
  }

  const horiz = Math.hypot(aimDir.x, aimDir.z);
  aimPitch = Math.atan2(aimDir.y, Math.max(0.05, horiz));
}

function attack() {
  if (!state.alive || !state.started || state.attacking || inventory.open) return;
  const def = getEquippedDef();
  state.attacking = true;
  state.attackDuration = def.attackDuration;
  state.attackT = def.attackDuration;
  state.hitApplied = false;
  sfxSwing(def.style);
}

function applyAttackHits() {
  const def = getEquippedDef();
  updateAim();

  // Hit test along the weapon aim (body → crosshair), not a free camera-only ray
  const beam =
    def.style === "spear" ? 0.26 : def.style === "sword" ? 0.52 : 0.4;

  let best = null;
  let bestT = def.range;

  for (const e of enemies) {
    if (!e.userData.alive) continue;

    const enemyR = e.userData.hitRadius ?? 0.7;
    const hitR = enemyR * (def.style === "spear" ? 0.8 : 1.0) + beam;
    aimHitCenter.set(
      e.position.x,
      e.position.y + (e.userData.hitHeight ?? 1.4),
      e.position.z
    );

    aimToCenter.subVectors(aimHitCenter, weaponOrigin);
    const t = aimToCenter.dot(aimDir);
    if (t < 0.35 || t > def.range) continue;
    const closest = tmp.copy(weaponOrigin).addScaledVector(aimDir, t);
    if (closest.distanceToSquared(aimHitCenter) > hitR * hitR) continue;

    if (t < bestT) {
      bestT = t;
      best = e;
    }
  }

  if (!best) {
    shake.add(0.06);
    return;
  }

  const e = best;
  e.userData.hp -= def.damage;
  e.userData.hitFlash = 0.25;

  aimToCenter.set(e.position.x - player.position.x, 0, e.position.z - player.position.z);
  if (aimToCenter.lengthSq() > 0.001) {
    aimToCenter.normalize();
    e.position.addScaledVector(aimToCenter, def.style === "spear" ? 2.0 : 1.5);
  }

  spawnBurst(scene, e.position, def.style === "sword" ? 0xf39c12 : 0x6ab04c, 8);
  spawnFloater(scene, e.position.clone(), `-${def.damage}`, "#ff6b35");

  if (e.userData.hp <= 0) {
    e.userData.alive = false;
    e.visible = false;
    sfxKill();
    shake.add(0.45);
    spawnBurst(scene, e.position, 0xffe08a, 22);
    spawnFloater(scene, e.position.clone(), "SMASH", "#ffe08a");
    const comboMult = 1 + Math.min(5, state.combo) * 0.25;
    const points = Math.round(100 * comboMult);
    bumpCombo();
    bumpScore(points);
    showMessage(`${e.userData.label} smashed! +${points}`);
  } else {
    sfxHit();
    shake.add(0.22);
    bumpCombo();
    bumpScore(10);
    showMessage(`Hit ${e.userData.label}!`);
  }
}

function resolveCollisions(pos, dt) {
  for (const c of colliders) {
    const nearestX = Math.max(c.minX, Math.min(pos.x, c.maxX));
    const nearestZ = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
    const dx = pos.x - nearestX;
    const dz = pos.z - nearestZ;
    const distSq = dx * dx + dz * dz;
    const r = PLAYER_RADIUS;
    if (distSq >= r * r) continue;
    if (distSq < 1e-8) {
      const left = Math.abs(pos.x - c.minX);
      const rightD = Math.abs(c.maxX - pos.x);
      const top = Math.abs(pos.z - c.minZ);
      const bot = Math.abs(c.maxZ - pos.z);
      const m = Math.min(left, rightD, top, bot);
      if (m === left) pos.x = c.minX - r;
      else if (m === rightD) pos.x = c.maxX + r;
      else if (m === top) pos.z = c.minZ - r;
      else pos.z = c.maxZ + r;
    } else {
      const dist = Math.sqrt(distSq);
      pos.x = nearestX + (dx / dist) * r;
      pos.z = nearestZ + (dz / dist) * r;
    }
  }

  // Soft map edge — fog hides the skirt; gentle inward pull, no hard wall
  const dist = Math.hypot(pos.x, pos.z);
  if (dist > softRadius) {
    const over = dist - softRadius;
    const strength = Math.min(1, over / Math.max(1, fadeRadius - softRadius));
    softPush.set(-pos.x / dist, 0, -pos.z / dist);
    pos.addScaledVector(softPush, over * (0.35 + strength * 1.8) * Math.min(1, dt * 8));
  }
}

function updateCamera(dt = 1 / 60) {
  const targetY = player.position.y + 3.8;
  const cp = Math.cos(cam.pitch);
  camera.position.set(
    player.position.x + Math.sin(cam.yaw) * cp * cam.dist,
    targetY + Math.sin(cam.pitch) * cam.dist,
    player.position.z + Math.cos(cam.yaw) * cp * cam.dist
  );

  for (const c of colliders) {
    const p = camera.position;
    if (p.x > c.minX && p.x < c.maxX && p.z > c.minZ && p.z < c.maxZ && p.y < c.height + 1) {
      camera.position.lerp(tmp.set(player.position.x, targetY, player.position.z), 0.55);
      break;
    }
  }

  const jolt = shake.update(dt);
  camera.position.x += jolt.x;
  camera.position.y += jolt.y;
  camera.position.z += jolt.z;
  camera.lookAt(player.position.x, targetY, player.position.z);
}

function onHitPlayer(damage, label) {
  if (state.invuln > 0 || !state.alive) return;
  setHealth(state.hp - damage);
  state.invuln = 0.7;
  state.combo = 0;
  state.comboT = 0;
  comboEl.classList.add("hidden");
  sfxHurt();
  shake.add(0.55);
  hurtVignette.classList.add("show");
  setTimeout(() => hurtVignette.classList.remove("show"), 220);
  showMessage(`${label} attacked you for ${damage}!`);
}

function applyKey(e, pressed) {
  if (!state.alive && state.started) return;

  if (inventory.open && pressed) {
    if (e.code === "KeyI" || e.key.toLowerCase() === "i" || e.code === "Escape") {
      setInventoryOpen(false);
      e.preventDefault();
      return;
    }
    if (e.code.startsWith("Digit") || e.code.startsWith("Numpad")) {
      const n = parseInt(e.code.replace("Digit", "").replace("Numpad", ""), 10);
      if (n >= 1 && n <= 4) {
        equipSlot(n - 1);
        setInventoryOpen(false);
        e.preventDefault();
      }
      return;
    }
  }

  const code = e.code;
  const key = e.key.toLowerCase();

  let handled = true;
  if (code === "KeyW" || code === "ArrowUp" || key === "w") input.forward = pressed;
  else if (code === "KeyS" || code === "ArrowDown" || key === "s") input.back = pressed;
  else if (code === "KeyA" || code === "ArrowLeft" || key === "a") input.left = pressed;
  else if (code === "KeyD" || code === "ArrowRight" || key === "d") input.right = pressed;
  else if (code === "Space" || key === " ") input.jump = pressed;
  else if (code === "ShiftLeft" || code === "ShiftRight") input.sprint = pressed;
  else if ((code === "KeyE" || key === "e") && pressed && state.started) tryOpenCrate();
  else if ((code === "KeyI" || key === "i") && pressed && state.started) {
    setInventoryOpen(!inventory.open);
  } else if (pressed && state.started && !inventory.open) {
    const digit = code.startsWith("Digit")
      ? parseInt(code.replace("Digit", ""), 10)
      : code.startsWith("Numpad")
        ? parseInt(code.replace("Numpad", ""), 10)
        : NaN;
    if (digit >= 1 && digit <= 4) equipSlot(digit - 1);
    else handled = false;
  } else {
    handled = false;
  }

  if (handled && state.started) e.preventDefault();
}

function clearInput() {
  input.forward = false;
  input.back = false;
  input.left = false;
  input.right = false;
  input.jump = false;
  input.sprint = false;
}

document.addEventListener("keydown", (e) => applyKey(e, true), { passive: false });
document.addEventListener("keyup", (e) => applyKey(e, false), { passive: false });
window.addEventListener("blur", clearInput);

document.addEventListener("mousedown", (e) => {
  if (!state.started || !state.alive || e.button !== 0 || inventory.open) return;
  if (e.target === canvas || document.pointerLockElement === canvas) attack();
});

document.addEventListener("mousemove", (e) => {
  if (!state.started || !state.alive || inventory.open) return;
  if (document.pointerLockElement !== canvas) return;
  cam.yaw -= e.movementX * 0.0025;
  cam.pitch += e.movementY * 0.002;
  cam.pitch = Math.max(cam.minPitch, Math.min(cam.maxPitch, cam.pitch));
});

canvas.addEventListener("click", () => {
  if (!state.started || !state.alive || inventory.open) return;
  canvas.focus();
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
});

document.getElementById("inventory-close").addEventListener("click", () => {
  setInventoryOpen(false);
});

startBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  unlockAudio();
  overlay.classList.add("hidden");
  hudEl.classList.remove("hidden");
  crosshairEl.classList.remove("hidden");
  state.started = true;
  clearInput();
  canvas.focus();
  requestAnimationFrame(() => canvas.requestPointerLock?.());
  showMessage("Desserts are demon food — aim with the crosshair and smash.");
});

restartBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  unlockAudio();
  restartRun();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  requestAnimationFrame(tick);

  if (state.messageT > 0) {
    state.messageT -= dt;
    if (state.messageT <= 0) messageEl.textContent = "";
  }

  if (state.comboT > 0) {
    state.comboT -= dt;
    if (state.comboT <= 0) {
      state.combo = 0;
      comboEl.classList.add("hidden");
    }
  }

  let moving = false;

  if (state.started && state.alive && !inventory.open) {
    state.invuln = Math.max(0, state.invuln - dt);

    getLookDirection(forward);
    right.set(-forward.z, 0, forward.x);

    // Body always faces the crosshair / look direction
    const faceYaw = Math.atan2(forward.x, forward.z);
    let dy = faceYaw - player.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    player.rotation.y += dy * Math.min(1, 18 * dt);

    updateAim();

    wish.set(0, 0, 0);
    if (input.forward) wish.add(forward);
    if (input.back) wish.sub(forward);
    if (input.right) wish.add(right);
    if (input.left) wish.sub(right);

    const speed = MOVE_SPEED * (input.sprint ? SPRINT_MULT : 1);

    if (wish.lengthSq() > 0) {
      moving = true;
      wish.normalize();
      player.position.x += wish.x * speed * dt;
      player.position.z += wish.z * speed * dt;
    }

    if (grounded && input.jump) {
      velocity.y = JUMP_VEL;
      grounded = false;
      sfxJump();
    }
    velocity.y -= GRAVITY * dt;
    player.position.y += velocity.y * dt;
    if (player.position.y <= 0) {
      player.position.y = 0;
      velocity.y = 0;
      grounded = true;
    }

    if (moving && grounded) {
      state.footT -= dt;
      if (state.footT <= 0) {
        sfxFootstep();
        state.footT = input.sprint ? 0.22 : 0.3;
      }
    } else {
      state.footT = 0;
    }

    resolveCollisions(player.position, dt);

    if (state.attacking) {
      state.attackT -= dt;
      const progress = 1 - state.attackT / state.attackDuration;
      const def = getEquippedDef();
      const impactAt = def.style === "sword" ? 0.38 : def.style === "spear" ? 0.32 : 0.22;
      if (!state.hitApplied && progress >= impactAt) {
        state.hitApplied = true;
        applyAttackHits();
      }
      if (state.attackT <= 0) {
        state.attacking = false;
        state.attackT = 0;
        player.userData.leftArm.position.set(-1.05, 3.55, 0);
        player.userData.rightArm.position.set(1.05, 3.55, 0);
      }
    }

    updateEnemies(enemies, player.position, dt, onHitPlayer);
  } else if (state.started && state.alive) {
    updateAim();
  }

  const def = getEquippedDef();
  updatePlayerAnim(player, {
    moving,
    sprint: input.sprint,
    attacking: state.attacking,
    attackT: state.attackT,
    attackDuration: state.attackDuration,
    weaponStyle: def.style,
    aimPitch,
    dt,
  });

  updateFx(dt, scene);
  updateCamera(dt);
  renderer.render(scene, camera);
}

setHealth(MAX_HP);
refreshHud();
bumpScore(0);
tick();
