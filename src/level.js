import * as THREE from "three";

const CELL = 4; // world units per map cell — roomy Doom corridors

export { CELL };

function makeWallMat(color, emissive = 0x000000) {
  return new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: 0.15 });
}

/**
 * Build a Wolfenstein/Doom-style textured corridor level from a parsed map.
 */
export function buildLevel(scene, parsed) {
  const root = new THREE.Group();
  root.name = "level";
  scene.add(root);

  const colliders = []; // AABB in world space
  const doorMeshes = new Map(); // "x,z" -> mesh

  const floorMat = makeWallMat(0x3a2a22);
  const ceilMat = makeWallMat(0x1a1210, 0x221510);
  const wallMats = [
    makeWallMat(0x6b3a2a, 0x2a1010),
    makeWallMat(0x4a5a3a, 0x1a2010),
    makeWallMat(0x3a3a5a, 0x101028),
    makeWallMat(0x5a4a2a, 0x201808),
  ];

  const floorGeo = new THREE.PlaneGeometry(parsed.w * CELL, parsed.h * CELL);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((parsed.w * CELL) / 2, 0, (parsed.h * CELL) / 2);
  floor.receiveShadow = true;
  root.add(floor);

  const ceil = new THREE.Mesh(floorGeo, ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set((parsed.w * CELL) / 2, 5.2, (parsed.h * CELL) / 2);
  root.add(ceil);

  const wallH = 5.2;
  const boxGeo = new THREE.BoxGeometry(CELL, wallH, CELL);

  for (let z = 0; z < parsed.h; z++) {
    for (let x = 0; x < parsed.w; x++) {
      const t = parsed.tiles[z][x];
      const wx = (x + 0.5) * CELL;
      const wz = (z + 0.5) * CELL;

      if (t === "wall") {
        const mat = wallMats[(x + z) % wallMats.length];
        const wall = new THREE.Mesh(boxGeo, mat);
        wall.position.set(wx, wallH / 2, wz);
        wall.castShadow = true;
        wall.receiveShadow = true;
        root.add(wall);
        // Decorative strip
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(CELL * 0.98, 0.35, CELL * 0.98),
          new THREE.MeshLambertMaterial({ color: 0x8b1a1a, emissive: 0x400808, emissiveIntensity: 0.4 })
        );
        strip.position.set(wx, 2.4, wz);
        root.add(strip);

        colliders.push(aabb(wx, wz, CELL * 0.98, CELL * 0.98));
      } else if (t === "door") {
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(CELL * 0.9, wallH * 0.92, 0.4),
          new THREE.MeshLambertMaterial({ color: 0x8b6914, emissive: 0x3a2a08, emissiveIntensity: 0.25 })
        );
        door.position.set(wx, wallH * 0.46, wz);
        door.castShadow = true;
        root.add(door);
        doorMeshes.set(`${x},${z}`, { mesh: door, x, z, open: false, openT: 0 });
        colliders.push({
          ...aabb(wx, wz, CELL * 0.9, 0.5),
          doorKey: `${x},${z}`,
        });
      }
    }
  }

  // Dim corridor lights
  for (let z = 2; z < parsed.h; z += 4) {
    for (let x = 2; x < parsed.w; x += 4) {
      if (parsed.tiles[z]?.[x] !== "floor" && parsed.tiles[z]?.[x] !== "door") continue;
      const light = new THREE.PointLight(0xff6633, 1.1, 18, 2);
      light.position.set((x + 0.5) * CELL, 4.2, (z + 0.5) * CELL);
      root.add(light);
    }
  }

  // Exit pad
  let exitMesh = null;
  if (parsed.spawns.exit) {
    const ex = parsed.spawns.exit;
    exitMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16),
      new THREE.MeshLambertMaterial({ color: 0x33ff66, emissive: 0x118833, emissiveIntensity: 0.8 })
    );
    exitMesh.position.set(ex.x * CELL, 0.12, ex.z * CELL);
    root.add(exitMesh);
    const beacon = new THREE.PointLight(0x33ff66, 1.4, 14);
    beacon.position.set(ex.x * CELL, 3, ex.z * CELL);
    root.add(beacon);
  }

  return {
    root,
    colliders,
    doorMeshes,
    exitMesh,
    parsed,
    cell: CELL,
    toWorld(mx, mz) {
      return { x: mx * CELL, z: mz * CELL };
    },
  };
}

function aabb(cx, cz, w, d) {
  return {
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
  };
}

export function isSolidAt(level, wx, wz, ignoreOpenDoors = true) {
  for (const c of level.colliders) {
    if (ignoreOpenDoors && c.doorKey) {
      const door = level.doorMeshes.get(c.doorKey);
      if (door?.open) continue;
    }
    if (wx > c.minX && wx < c.maxX && wz > c.minZ && wz < c.maxZ) return true;
  }
  return false;
}

export function tryUseDoor(level, px, pz) {
  let opened = false;
  for (const [key, door] of level.doorMeshes) {
    if (door.open) continue;
    const dx = (door.x + 0.5) * CELL - px;
    const dz = (door.z + 0.5) * CELL - pz;
    if (dx * dx + dz * dz < (CELL * 1.4) ** 2) {
      door.open = true;
      opened = true;
    }
  }
  return opened;
}

export function updateDoors(level, dt) {
  for (const door of level.doorMeshes.values()) {
    if (!door.open) continue;
    door.openT = Math.min(1, door.openT + dt * 1.5);
    // Slide up
    door.mesh.position.y = 5.2 * 0.46 + door.openT * 5.5;
  }
}

export function disposeLevel(scene, level) {
  if (!level) return;
  scene.remove(level.root);
  level.root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material.dispose();
    }
  });
}
