import * as THREE from "three";

/** Veggie arsenal — Doom loadout vibes */
export const WEAPONS = [
  {
    id: "pea",
    name: "PEA SHOOTER",
    slot: 1,
    damage: 12,
    pellets: 1,
    spread: 0.018,
    range: 55,
    cooldown: 0.22,
    ammoKey: "pea",
    ammoPerShot: 1,
    startAmmo: 40,
    kick: 0.12,
    color: 0x6ab04c,
    projectile: false,
  },
  {
    id: "shotgun",
    name: "CORN SHOTGUN",
    slot: 2,
    damage: 9,
    pellets: 7,
    spread: 0.12,
    range: 28,
    cooldown: 0.75,
    ammoKey: "corn",
    ammoPerShot: 1,
    startAmmo: 0,
    kick: 0.45,
    color: 0xf1c40f,
    projectile: false,
  },
  {
    id: "launcher",
    name: "COB LAUNCHER",
    slot: 3,
    damage: 85,
    pellets: 1,
    spread: 0.01,
    range: 40,
    cooldown: 1.05,
    ammoKey: "cob",
    ammoPerShot: 1,
    startAmmo: 0,
    kick: 0.7,
    color: 0xe67e22,
    projectile: true,
    splash: 4.5,
  },
];

export function createGunMesh(weaponId) {
  const g = new THREE.Group();
  if (weaponId === "pea") {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 0.55),
      new THREE.MeshLambertMaterial({ color: 0x2d6a2d })
    );
    body.position.z = 0.2;
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6),
      new THREE.MeshLambertMaterial({ color: 0x8fd46a })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.55;
    const pea = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0x7dce4a })
    );
    pea.position.set(0, 0.12, 0.15);
    g.add(body, barrel, pea);
  } else if (weaponId === "shotgun") {
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.2, 0.7),
      new THREE.MeshLambertMaterial({ color: 0xc9a227 })
    );
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.9),
      new THREE.MeshLambertMaterial({ color: 0xf4d03f })
    );
    barrel.position.z = 0.55;
    const kernels = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8),
      new THREE.MeshLambertMaterial({ color: 0xffe082 })
    );
    kernels.rotation.x = Math.PI / 2;
    kernels.position.z = 0.9;
    g.add(stock, barrel, kernels);
  } else {
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 0.95, 8),
      new THREE.MeshLambertMaterial({ color: 0xd68910 })
    );
    tube.rotation.x = Math.PI / 2;
    tube.position.z = 0.45;
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.35, 8),
      new THREE.MeshLambertMaterial({ color: 0x1e8449 })
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = 1.05;
    g.add(tube, tip);
  }
  return g;
}

export function createProjectile(color = 0xe67e22) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8),
    new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function createMuzzleSpark(color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 6),
    new THREE.MeshBasicMaterial({ color })
  );
}
