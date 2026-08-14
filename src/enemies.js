import * as THREE from "three";
import { CELL } from "./level.js";

const TYPES = [
  {
    id: "cake",
    label: "Cake Demon",
    hp: 55,
    speed: 5.2,
    damage: 10,
    color: 0xd4a017,
    accent: 0xf5e6c8,
    points: 100,
  },
  {
    id: "ice",
    label: "Ice Cream Imp",
    hp: 35,
    speed: 7.2,
    damage: 8,
    color: 0xffb6c1,
    accent: 0xe0a86c,
    points: 80,
  },
  {
    id: "cookie",
    label: "Cookie Fiend",
    hp: 90,
    speed: 4.0,
    damage: 14,
    color: 0x1a5276,
    accent: 0xc4a35a,
    points: 150,
  },
];

function makeDessertMesh(type) {
  const g = new THREE.Group();
  if (type.id === "cake") {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 1.3, 10),
      new THREE.MeshLambertMaterial({ color: type.color })
    );
    body.position.y = 0.9;
    const icing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.25, 10),
      new THREE.MeshLambertMaterial({ color: type.accent })
    );
    icing.position.y = 1.55;
    g.add(body, icing);
  } else if (type.id === "ice") {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.1, 8),
      new THREE.MeshLambertMaterial({ color: type.accent })
    );
    cone.position.y = 0.7;
    cone.rotation.x = Math.PI;
    const scoop = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 10, 8),
      new THREE.MeshLambertMaterial({ color: type.color })
    );
    scoop.position.y = 1.55;
    g.add(cone, scoop);
  } else {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 10, 8),
      new THREE.MeshLambertMaterial({ color: type.color })
    );
    body.position.y = 1.2;
    const cookie = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.12, 10),
      new THREE.MeshLambertMaterial({ color: type.accent })
    );
    cookie.rotation.x = Math.PI / 2;
    cookie.position.set(0.55, 1.1, 0.55);
    g.add(body, cookie);
  }

  // Angry eyes
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0xff2222, emissive: 0x880000, emissiveIntensity: 0.6 });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
  e1.position.set(-0.25, 1.55, 0.7);
  const e2 = e1.clone();
  e2.position.x = 0.25;
  g.add(e1, e2);
  return g;
}

export function spawnEnemies(scene, spawns) {
  const enemies = [];
  spawns.enemies.forEach((s, i) => {
    const type = TYPES[i % TYPES.length];
    const mesh = makeDessertMesh(type);
    mesh.position.set(s.x * CELL, 0, s.z * CELL);
    scene.add(mesh);
    enemies.push({
      mesh,
      type,
      hp: type.hp,
      maxHp: type.hp,
      alive: true,
      attackCd: 0,
      hitFlash: 0,
      radius: 0.85,
    });
  });
  return enemies;
}

export function clearEnemies(scene, enemies) {
  for (const e of enemies) scene.remove(e.mesh);
  enemies.length = 0;
}

export function updateEnemies(enemies, playerPos, dt, levelSolid, onHitPlayer) {
  for (const e of enemies) {
    if (!e.alive) continue;

    if (e.hitFlash > 0) {
      e.hitFlash -= dt;
      e.mesh.traverse((c) => {
        if (c.isMesh && c.material?.emissive) {
          c.material.emissive.setHex(e.hitFlash > 0 ? 0x662222 : 0x000000);
        }
      });
    }

    const to = new THREE.Vector3().subVectors(playerPos, e.mesh.position);
    to.y = 0;
    const dist = to.length();
    e.attackCd = Math.max(0, e.attackCd - dt);

    if (dist < 22 && dist > 0.01) {
      to.normalize();
      const step = e.type.speed * dt;
      const nx = e.mesh.position.x + to.x * step;
      const nz = e.mesh.position.z + to.z * step;
      if (!levelSolid(nx, e.mesh.position.z)) e.mesh.position.x = nx;
      if (!levelSolid(e.mesh.position.x, nz)) e.mesh.position.z = nz;
      e.mesh.rotation.y = Math.atan2(to.x, to.z);

      if (dist < 1.7 && e.attackCd <= 0) {
        onHitPlayer(e.type.damage, e.type.label);
        e.attackCd = 0.9;
      }
    }

    e.mesh.position.y = Math.sin(performance.now() * 0.006 + e.mesh.position.x) * 0.08;
  }
}

export function hitEnemy(e, damage) {
  if (!e.alive) return false;
  e.hp -= damage;
  e.hitFlash = 0.2;
  if (e.hp <= 0) {
    e.alive = false;
    e.mesh.visible = false;
    return true;
  }
  return false;
}
