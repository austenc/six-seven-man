import * as THREE from "three";

const geoCache = new Map();

function boxGeo(sx, sy, sz) {
  const key = `${sx},${sy},${sz}`;
  if (!geoCache.has(key)) {
    geoCache.set(key, new THREE.BoxGeometry(sx, sy, sz));
  }
  return geoCache.get(key);
}

export function voxel(color, sx = 1, sy = 1, sz = 1) {
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(boxGeo(sx, sy, sz), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function addBlock(group, color, x, y, z, sx = 1, sy = 1, sz = 1) {
  const block = voxel(color, sx, sy, sz);
  block.position.set(x, y, z);
  group.add(block);
  return block;
}

/** Simple seeded PRNG (mulberry32) */
export function createRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
