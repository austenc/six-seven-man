import * as THREE from "three";
import { addBlock, createRng, voxel } from "./voxel.js";

const BUILDING_PALETTE = [
  0xb0bec5, 0x90a4ae, 0x78909c, 0xcfd8dc, 0xa1887f, 0x8d6e63, 0xffcc80, 0x80cbc4,
];
const WINDOW_COLOR = 0xfff59d;
const ROAD_COLOR = 0x37474f;
const SIDEWALK_COLOR = 0x90a4ae;
const GRASS_COLOR = 0x558b2f;
const OUTSKIRT_COLOR = 0x4a7340;

/**
 * Roomier procedural city — wide roads for a 6'7" voxel dude.
 * Soft play radius fades into fog (no hard wall edge).
 */
export function generateCity(scene, seed = 67) {
  const rng = createRng(seed);
  const colliders = [];
  const openSpots = [];
  const crates = [];

  const citySize = 9;
  const blockSize = 36; // was 18 — much more room between blocks
  const roadWidth = 14; // was 6 — character-sized avenues
  const half = (citySize * blockSize) / 2;
  const softRadius = half - 8;
  const fadeRadius = half + 55;

  // Huge ground so the horizon never ends abruptly
  const ground = voxel(GRASS_COLOR, fadeRadius * 2 + 80, 0.5, fadeRadius * 2 + 80);
  ground.position.set(0, -0.25, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  // Soft skirt ring (darker grass) — reads as outskirts dissolving into fog
  const skirt = voxel(OUTSKIRT_COLOR, fadeRadius * 2 + 40, 0.4, fadeRadius * 2 + 40);
  skirt.position.set(0, -0.35, 0);
  skirt.receiveShadow = true;
  scene.add(skirt);

  for (let bx = 0; bx < citySize; bx++) {
    for (let bz = 0; bz < citySize; bz++) {
      const ox = bx * blockSize - half + blockSize / 2;
      const oz = bz * blockSize - half + blockSize / 2;

      const roadX = voxel(ROAD_COLOR, roadWidth, 0.12, blockSize);
      roadX.position.set(ox, 0.06, oz);
      scene.add(roadX);

      const roadZ = voxel(ROAD_COLOR, blockSize, 0.12, roadWidth);
      roadZ.position.set(ox, 0.06, oz);
      scene.add(roadZ);

      // Sidewalk strips along roads
      const walkW = roadWidth + 4;
      const walkA = voxel(SIDEWALK_COLOR, walkW, 0.1, blockSize);
      walkA.position.set(ox, 0.04, oz);
      scene.add(walkA);
      const walkB = voxel(SIDEWALK_COLOR, blockSize, 0.1, walkW);
      walkB.position.set(ox, 0.04, oz);
      scene.add(walkB);

      const lotOffset = blockSize / 4 + 1;
      const lots = [
        [ox - lotOffset, oz - lotOffset],
        [ox + lotOffset, oz - lotOffset],
        [ox - lotOffset, oz + lotOffset],
        [ox + lotOffset, oz + lotOffset],
      ];

      for (const [lx, lz] of lots) {
        const dist = Math.hypot(lx, lz);
        // Wide open downtown spawn plaza
        if (dist < 32) {
          openSpots.push({ x: lx, z: lz });
          addPlaza(scene, lx, lz, rng, 12);
          continue;
        }

        if (rng() < 0.28) {
          openSpots.push({ x: lx, z: lz });
          addPlaza(scene, lx, lz, rng, 9 + rng() * 4);
          if (rng() < 0.5) {
            crates.push(addCrate(scene, lx + (rng() - 0.5) * 3, lz + (rng() - 0.5) * 3));
          }
        } else {
          const building = addBuilding(scene, lx, lz, rng);
          colliders.push(...building.colliders);
          if (rng() < 0.4) {
            const side = Math.sign(rng() - 0.5) || 1;
            crates.push(
              addCrate(scene, lx + side * (building.w / 2 + 2.5), lz + (rng() - 0.5) * 4)
            );
          }
        }
      }
    }
  }

  for (let i = 0; i < 55; i++) {
    const a = rng() * Math.PI * 2;
    const r = 20 + rng() * (softRadius - 25);
    addLamp(scene, Math.cos(a) * r, Math.sin(a) * r);
  }

  // Distant fog decoys — sparse low props past soft radius so edge feels endless
  for (let i = 0; i < 30; i++) {
    const a = rng() * Math.PI * 2;
    const r = softRadius + 10 + rng() * 40;
    const bush = voxel(0x3d5c34, 2 + rng() * 3, 0.8 + rng(), 2 + rng() * 3);
    bush.position.set(Math.cos(a) * r, 0.4, Math.sin(a) * r);
    scene.add(bush);
  }

  if (crates.length < 8) {
    for (let i = crates.length; i < 10; i++) {
      const a = rng() * Math.PI * 2;
      const r = 16 + rng() * 28;
      crates.push(addCrate(scene, Math.cos(a) * r, Math.sin(a) * r));
    }
  }

  return {
    colliders,
    openSpots,
    crates,
    softRadius,
    fadeRadius,
    halfExtent: softRadius,
  };
}

function addPlaza(scene, x, z, rng, size = 10) {
  const pad = voxel(SIDEWALK_COLOR, size, 0.15, size);
  pad.position.set(x, 0.08, z);
  scene.add(pad);
  if (rng() < 0.35) {
    const bench = voxel(0x5d4037, 2.4, 0.45, 0.55);
    bench.position.set(x, 0.35, z + size * 0.25);
    scene.add(bench);
  }
}

function addBuilding(scene, x, z, rng) {
  // Buildings sit in lots with breathing room — not mega-wide footpaths
  const w = 6 + Math.floor(rng() * 5);
  const d = 6 + Math.floor(rng() * 5);
  const floors = 2 + Math.floor(rng() * 7);
  const h = floors * 2.6;
  const color = BUILDING_PALETTE[Math.floor(rng() * BUILDING_PALETTE.length)];

  const group = new THREE.Group();
  const body = voxel(color, w, h, d);
  body.position.set(0, h / 2, 0);
  group.add(body);

  for (let f = 0; f < floors; f++) {
    const wy = 1.1 + f * 2.6;
    for (let side = 0; side < 2; side++) {
      const wx = side === 0 ? -w / 2 + 0.05 : w / 2 - 0.05;
      for (let i = 0; i < Math.floor(d / 1.8); i++) {
        const wz = -d / 2 + 1.1 + i * 1.8;
        const win = voxel(WINDOW_COLOR, 0.12, 0.9, 0.75);
        win.position.set(wx, wy, wz);
        group.add(win);
      }
    }
  }

  const roof = voxel(0x455a64, w + 0.4, 0.35, d + 0.4);
  roof.position.set(0, h + 0.15, 0);
  group.add(roof);

  group.position.set(x, 0, z);
  scene.add(group);

  return {
    w,
    d,
    colliders: [
      {
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        height: h,
      },
    ],
  };
}

function addLamp(scene, x, z) {
  const g = new THREE.Group();
  addBlock(g, 0x263238, 0, 0.2, 0, 0.5, 0.3, 0.5);
  addBlock(g, 0x37474f, 0, 2.2, 0, 0.18, 4.0, 0.18);
  addBlock(g, 0xfff176, 0, 4.4, 0, 0.55, 0.45, 0.55);
  g.position.set(x, 0, z);
  scene.add(g);
}

function addCrate(scene, x, z) {
  const g = new THREE.Group();
  addBlock(g, 0xc9a227, 0, 0.55, 0, 1.2, 1.1, 1.2);
  addBlock(g, 0x8d6e23, 0, 0.55, 0, 1.35, 0.2, 0.2);
  addBlock(g, 0x8d6e23, 0, 0.55, 0, 0.2, 0.2, 1.35);
  addBlock(g, 0xffe082, 0, 1.2, 0, 0.35, 0.2, 0.35);
  g.position.set(x, 0, z);
  scene.add(g);
  return {
    mesh: g,
    position: new THREE.Vector3(x, 0, z),
    opened: false,
  };
}
