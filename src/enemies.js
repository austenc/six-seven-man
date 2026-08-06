import * as THREE from "three";
import { addBlock, createRng } from "./voxel.js";

/**
 * Dessert enemies — 6-7 Man hates desserts. They chase and attack.
 */

function angryEyes(g, y, z, spread = 0.35) {
  // Whites
  addBlock(g, 0xffeeee, -spread, y, z, 0.28, 0.28, 0.14);
  addBlock(g, 0xffeeee, spread, y, z, 0.28, 0.28, 0.14);
  // Pupils
  addBlock(g, 0x1a0505, -spread, y - 0.02, z + 0.08, 0.14, 0.14, 0.1);
  addBlock(g, 0x1a0505, spread, y - 0.02, z + 0.08, 0.14, 0.14, 0.1);
  // Angry brows
  addBlock(g, 0x3b0a0a, -spread, y + 0.22, z + 0.02, 0.35, 0.1, 0.12);
  addBlock(g, 0x3b0a0a, spread, y + 0.22, z + 0.02, 0.35, 0.1, 0.12);
}

function createCarrotCake() {
  const g = new THREE.Group();
  addBlock(g, 0xd4a017, 0, 0.55, 0, 1.4, 1.0, 1.4);
  addBlock(g, 0xf5e6c8, 0, 1.15, 0, 1.45, 0.25, 1.45);
  addBlock(g, 0xd4a017, 0, 1.55, 0, 1.2, 0.55, 1.2);
  addBlock(g, 0xf5e6c8, 0, 1.95, 0, 1.25, 0.2, 1.25);
  addBlock(g, 0xe67e22, 0.35, 2.25, 0.2, 0.25, 0.55, 0.25);
  addBlock(g, 0x27ae60, 0.35, 2.6, 0.2, 0.2, 0.25, 0.2);
  angryEyes(g, 1.55, 0.72, 0.32);
  // Snarl mouth
  addBlock(g, 0x5c1a1a, 0, 1.15, 0.75, 0.55, 0.18, 0.12);
  g.userData.type = "carrotCake";
  g.userData.maxHp = 60;
  g.userData.hp = 60;
  g.userData.damage = 12;
  g.userData.speed = 5.4;
  g.userData.aggroRange = 30;
  g.userData.label = "Hostile Carrot Cake";
  g.userData.hitRadius = 0.75;
  g.userData.hitHeight = 1.35;
  return g;
}

function createIceCream() {
  const g = new THREE.Group();
  addBlock(g, 0xe0a86c, 0, 0.7, 0, 0.7, 1.2, 0.7);
  addBlock(g, 0xd4956a, 0, 0.15, 0, 0.45, 0.3, 0.45);
  addBlock(g, 0xffb6c1, 0, 1.55, 0, 1.1, 0.9, 1.1);
  addBlock(g, 0xadd8e6, 0.15, 2.25, 0.1, 0.9, 0.75, 0.9);
  addBlock(g, 0xfff8dc, -0.1, 2.85, 0, 0.7, 0.55, 0.7);
  addBlock(g, 0xe74c3c, 0, 3.3, 0, 0.35, 0.35, 0.35);
  angryEyes(g, 1.7, 0.58, 0.28);
  addBlock(g, 0x5c1a1a, 0, 1.35, 0.6, 0.45, 0.14, 0.1);
  g.userData.type = "iceCream";
  g.userData.maxHp = 45;
  g.userData.hp = 45;
  g.userData.damage = 10;
  g.userData.speed = 6.5;
  g.userData.aggroRange = 32;
  g.userData.label = "Hostile Ice Cream";
  g.userData.hitRadius = 0.55;
  g.userData.hitHeight = 1.7;
  return g;
}

function createCookieMonster() {
  const g = new THREE.Group();
  addBlock(g, 0x1a5276, 0, 1.1, 0, 1.6, 1.8, 1.4);
  addBlock(g, 0x2471a3, 0, 2.15, 0, 1.5, 0.7, 1.3);
  angryEyes(g, 2.35, 0.72, 0.4);
  addBlock(g, 0x1a0505, 0, 1.65, 0.75, 0.9, 0.4, 0.22);
  // Fangs
  addBlock(g, 0xf5f5f5, -0.25, 1.55, 0.82, 0.15, 0.25, 0.12);
  addBlock(g, 0xf5f5f5, 0.25, 1.55, 0.82, 0.15, 0.25, 0.12);
  addBlock(g, 0xc4a35a, 0.55, 1.5, 0.5, 0.4, 0.15, 0.35);
  addBlock(g, 0x1a5276, -1.05, 1.3, 0, 0.4, 0.9, 0.4);
  addBlock(g, 0x1a5276, 1.05, 1.3, 0, 0.4, 0.9, 0.4);
  g.userData.type = "cookieMonster";
  g.userData.maxHp = 95;
  g.userData.hp = 95;
  g.userData.damage = 16;
  g.userData.speed = 4.4;
  g.userData.aggroRange = 28;
  g.userData.label = "Cookie Monster";
  g.userData.hitRadius = 0.85;
  g.userData.hitHeight = 1.5;
  return g;
}

const BUILDERS = [createCarrotCake, createIceCream, createCookieMonster];

export function clearEnemies(scene, enemies) {
  for (const e of enemies) {
    scene.remove(e);
  }
  enemies.length = 0;
}

export function spawnEnemies(scene, openSpots, count = 18, seed = 67) {
  const rng = createRng(seed + 99);
  const enemies = [];

  // Guaranteed pack near spawn so it's obvious desserts are enemies
  const nearSpawn = [
    [22, 6],
    [-20, 16],
    [14, -24],
    [-18, -14],
    [28, -10],
  ];
  for (let i = 0; i < nearSpawn.length; i++) {
    const enemy = BUILDERS[i % BUILDERS.length]();
    enemy.position.set(nearSpawn[i][0], 0, nearSpawn[i][1]);
    armEnemy(enemy, rng);
    scene.add(enemy);
    enemies.push(enemy);
  }

  const spots = openSpots.length
    ? openSpots
    : Array.from({ length: 20 }, () => ({
        x: (rng() - 0.5) * 80,
        z: (rng() - 0.5) * 80,
      }));

  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 20) {
    attempts++;
    const spot = spots[Math.floor(rng() * spots.length)];
    const builder = BUILDERS[Math.floor(rng() * BUILDERS.length)];
    const angle = rng() * Math.PI * 2;
    const radius = 4 + rng() * 12;
    const x = spot.x + Math.cos(angle) * radius;
    const z = spot.z + Math.sin(angle) * radius;
    if (Math.hypot(x, z) < 28) continue;

    const enemy = builder();
    enemy.position.set(x, 0, z);
    armEnemy(enemy, rng);
    scene.add(enemy);
    enemies.push(enemy);
    placed++;
  }
  return enemies;
}

function armEnemy(enemy, rng) {
  enemy.userData.alive = true;
  enemy.userData.hitFlash = 0;
  enemy.userData.attackCd = 0;
  enemy.userData.wanderT = rng() * 4;
  enemy.userData.wanderDir = new THREE.Vector3(rng() - 0.5, 0, rng() - 0.5).normalize();
}

export function updateEnemies(enemies, playerPos, dt, onHitPlayer) {
  for (const e of enemies) {
    if (!e.userData.alive) continue;

    if (e.userData.hitFlash > 0) {
      e.userData.hitFlash -= dt;
      const lit = e.userData.hitFlash > 0;
      e.traverse((c) => {
        if (c.isMesh && c.material?.emissive) {
          c.material.emissive.setHex(lit ? 0x881111 : 0x000000);
        }
      });
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, e.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const aggro = e.userData.aggroRange ?? 24;

    e.userData.attackCd = Math.max(0, e.userData.attackCd - dt);

    if (dist < aggro) {
      if (dist > 1.7) {
        toPlayer.normalize();
        e.position.addScaledVector(toPlayer, e.userData.speed * dt);
        e.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      } else if (e.userData.attackCd <= 0) {
        onHitPlayer(e.userData.damage, e.userData.label);
        e.userData.attackCd = 0.75;
        // Lunge
        toPlayer.normalize();
        e.position.addScaledVector(toPlayer, 0.35);
      }
    } else {
      e.userData.wanderT -= dt;
      if (e.userData.wanderT <= 0) {
        const a = Math.random() * Math.PI * 2;
        e.userData.wanderDir.set(Math.cos(a), 0, Math.sin(a));
        e.userData.wanderT = 2 + Math.random() * 3;
      }
      e.position.addScaledVector(e.userData.wanderDir, e.userData.speed * 0.4 * dt);
      e.rotation.y = Math.atan2(e.userData.wanderDir.x, e.userData.wanderDir.z);
    }

    e.position.y = Math.sin(performance.now() * 0.006 + e.position.x) * 0.1;
  }
}
