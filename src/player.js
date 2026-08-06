import * as THREE from "three";
import { addBlock } from "./voxel.js";

const SKIN = 0xe8b896;
const SHIRT = 0x3a7bd5;
const PANTS = 0x2c3e50;
const SHOES = 0x1a1a1a;

/**
 * 6-7 Man — bald, 6'7", pot belly. Articulated limbs for walk + attacks.
 * Units: 1 ≈ 1 foot.
 */
export function createPlayer() {
  const root = new THREE.Group();
  root.name = "sixSevenMan";

  // --- Legs (pivot at hips) ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.35, 2.15, 0);
  addBlock(leftLeg, PANTS, 0, -1.05, 0, 0.45, 2.0, 0.45);
  addBlock(leftLeg, SHOES, 0, -1.95, 0.12, 0.5, 0.35, 0.7);
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.35, 2.15, 0);
  addBlock(rightLeg, PANTS, 0, -1.05, 0, 0.45, 2.0, 0.45);
  addBlock(rightLeg, SHOES, 0, -1.95, 0.12, 0.5, 0.35, 0.7);
  root.add(rightLeg);

  // --- Torso + belly + head (static) ---
  const torso = new THREE.Group();
  addBlock(torso, SHIRT, 0, 3.05, 0, 1.5, 1.5, 0.85);
  addBlock(torso, SKIN, 0, 2.15, 0.35, 1.35, 0.9, 0.9);
  addBlock(torso, SKIN, 0, 2.0, 0.55, 0.9, 0.55, 0.55);
  addBlock(torso, SKIN, 0, 4.35, 0, 1.1, 1.15, 1.1);
  addBlock(torso, SKIN, -0.65, 4.3, 0, 0.2, 0.35, 0.25);
  addBlock(torso, SKIN, 0.65, 4.3, 0, 0.2, 0.35, 0.25);
  addBlock(torso, 0x1a1a1a, -0.28, 4.4, 0.52, 0.22, 0.22, 0.15);
  addBlock(torso, 0x1a1a1a, 0.28, 4.4, 0.52, 0.22, 0.22, 0.15);
  addBlock(torso, 0xc0392b, 0, 4.05, 0.55, 0.45, 0.12, 0.12);
  root.add(torso);

  // --- Arms (pivot at shoulders; hang down along -Y) ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-1.05, 3.55, 0);
  addBlock(leftArm, SHIRT, 0, -0.45, 0, 0.4, 1.0, 0.4);
  addBlock(leftArm, SKIN, 0, -1.35, 0, 0.38, 0.9, 0.38);
  const leftHand = new THREE.Group();
  leftHand.position.set(0, -1.85, 0);
  leftArm.add(leftHand);
  root.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(1.05, 3.55, 0);
  addBlock(rightArm, SHIRT, 0, -0.45, 0, 0.4, 1.0, 0.4);
  addBlock(rightArm, SKIN, 0, -1.35, 0, 0.38, 0.9, 0.38);
  const rightHand = new THREE.Group();
  rightHand.position.set(0, -1.85, 0);
  rightArm.add(rightHand);
  root.add(rightArm);

  root.userData = {
    height: 6.7,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    leftHand,
    rightHand,
    torso,
    walkPhase: 0,
    // Rest pose caches
    rest: {
      leftLeg: { x: 0, y: 0, z: 0 },
      rightLeg: { x: 0, y: 0, z: 0 },
      leftArm: { x: 0, y: 0, z: 0 },
      rightArm: { x: 0, y: 0, z: 0 },
    },
  };

  return root;
}

export function createCarrotSword() {
  const g = new THREE.Group();
  // Blade extends along +Y from grip (will be reoriented when held)
  addBlock(g, 0xf39c12, 0, 0.95, 0, 0.28, 1.9, 0.28);
  addBlock(g, 0xe67e22, 0, 1.8, 0, 0.22, 0.4, 0.22);
  addBlock(g, 0xe67e22, 0, 2.15, 0, 0.16, 0.3, 0.16);
  addBlock(g, 0x27ae60, 0, 0.05, 0, 0.45, 0.25, 0.45);
  addBlock(g, 0x2ecc71, -0.25, 0.3, 0, 0.2, 0.45, 0.15);
  addBlock(g, 0x2ecc71, 0.25, 0.3, 0, 0.2, 0.45, 0.15);
  addBlock(g, 0x2ecc71, 0, 0.35, -0.2, 0.15, 0.4, 0.2);
  Object.assign(g.userData, {
    weaponId: "carrotSword",
    damage: 30,
    range: 3.5,
    label: "Carrot Sword",
    style: "sword",
    twoHanded: false,
    attackDuration: 0.38,
  });
  return g;
}

export function createAsparagusSpear() {
  const g = new THREE.Group();
  // Shaft along +Y; tip at high Y — will point forward when arms are raised
  addBlock(g, 0x6ab04c, 0, 1.35, 0, 0.18, 2.7, 0.18);
  addBlock(g, 0x27ae60, 0, 2.6, 0, 0.22, 0.35, 0.22);
  addBlock(g, 0x1e8449, 0, 2.95, 0, 0.28, 0.4, 0.28);
  addBlock(g, 0x145a32, 0, 3.3, 0, 0.2, 0.35, 0.2);
  addBlock(g, 0x8e44ad, 0, 0.35, 0, 0.3, 0.4, 0.3);
  addBlock(g, 0x8e44ad, 0, 1.0, 0, 0.26, 0.25, 0.26);
  Object.assign(g.userData, {
    weaponId: "asparagusSpear",
    damage: 26,
    range: 5.4,
    label: "Asparagus Spear",
    style: "spear",
    twoHanded: true,
    attackDuration: 0.34,
  });
  return g;
}

export const WEAPON_DEFS = {
  fists: {
    id: "fists",
    label: "Fists",
    damage: 14,
    range: 2.3,
    style: "fist",
    twoHanded: false,
    attackDuration: 0.26,
    builder: null,
  },
  carrotSword: {
    id: "carrotSword",
    label: "Carrot Sword",
    damage: 30,
    range: 3.5,
    style: "sword",
    twoHanded: false,
    attackDuration: 0.38,
    builder: createCarrotSword,
  },
  asparagusSpear: {
    id: "asparagusSpear",
    label: "Asparagus Spear",
    damage: 26,
    range: 5.4,
    style: "spear",
    twoHanded: true,
    attackDuration: 0.34,
    builder: createAsparagusSpear,
  },
};

export const WEAPON_BUILDERS = {
  carrotSword: createCarrotSword,
  asparagusSpear: createAsparagusSpear,
};

/** Hotbar slot layout: 1=Fists, 2=Sword, 3=Spear, 4=empty reserve */
export const HOTBAR_SLOT_IDS = ["fists", "carrotSword", "asparagusSpear", null];

/**
 * Walk cycle + attack posing.
 * aimPitch: radians, positive = aiming up (from weapon toward crosshair).
 */
export function updatePlayerAnim(player, opts) {
  const { leftLeg, rightLeg, leftArm, rightArm } = player.userData;
  const { moving, sprint, attacking, attackT, attackDuration, weaponStyle, dt, aimPitch = 0 } =
    opts;

  const ud = player.userData;
  if (moving && !attacking) {
    const cadence = sprint ? 14 : 10;
    ud.walkPhase += dt * cadence;
  } else if (!attacking) {
    ud.walkPhase *= 1 - Math.min(1, dt * 6);
  }

  const swing = moving && !attacking ? Math.sin(ud.walkPhase) : 0;
  const legAmp = moving && !attacking ? (sprint ? 0.7 : 0.55) : 0;
  const armAmp = moving && !attacking ? (sprint ? 0.55 : 0.45) : 0;

  leftLeg.rotation.x = swing * legAmp;
  rightLeg.rotation.x = -swing * legAmp;

  // Clamp look pitch contribution so arms stay readable
  const pitch = THREE.MathUtils.clamp(aimPitch, -0.85, 0.95);

  if (attacking) {
    const t = 1 - attackT / attackDuration;
    applyAttackPose(leftArm, rightArm, weaponStyle, t, player, pitch);
  } else {
    applyIdleHoldPose(leftArm, rightArm, weaponStyle, swing, armAmp, player, pitch);
  }
}

function applyIdleHoldPose(leftArm, rightArm, style, swing, armAmp, player, pitch) {
  const weaponMesh = player.userData.weaponMesh;

  leftArm.position.set(-1.05, 3.55, 0);
  rightArm.position.set(1.05, 3.55, 0);

  if (style === "spear") {
    // Two-handed — arms track crosshair pitch
    const base = -Math.PI * 0.5 - pitch;
    leftArm.rotation.set(base, 0.18, 0.35);
    rightArm.rotation.set(base, -0.18, -0.35);
    leftArm.rotation.x += swing * 0.06;
    rightArm.rotation.x -= swing * 0.06;
    if (weaponMesh) {
      weaponMesh.position.set(-1.0, 0.55, 0.05);
      weaponMesh.rotation.set(Math.PI, 0, 0);
    }
  } else if (style === "sword") {
    leftArm.rotation.set(swing * armAmp, 0, 0.08);
    rightArm.rotation.set(-0.4 - pitch * 0.65 + -swing * armAmp * 0.3, 0, -0.2);
    if (weaponMesh) {
      weaponMesh.position.set(0.1, 0.05, 0.05);
      weaponMesh.rotation.set(Math.PI, 0, -0.35);
    }
  } else {
    leftArm.rotation.set(-swing * armAmp, 0, 0.1);
    rightArm.rotation.set(swing * armAmp - pitch * 0.35, 0, -0.1);
  }
}

function applyAttackPose(leftArm, rightArm, style, t, player, pitch) {
  const weaponMesh = player.userData.weaponMesh;

  if (style === "sword") {
    let armX;
    let armZ;
    if (t < 0.3) {
      const u = t / 0.3;
      armX = THREE.MathUtils.lerp(-0.35 - pitch * 0.4, -Math.PI * 0.98 - pitch * 0.15, u);
      armZ = THREE.MathUtils.lerp(-0.2, -0.45, u);
    } else if (t < 0.65) {
      const u = (t - 0.3) / 0.35;
      const eased = u * u * (3 - 2 * u);
      armX = THREE.MathUtils.lerp(-Math.PI * 0.98 - pitch * 0.15, -0.05 - pitch, eased);
      armZ = THREE.MathUtils.lerp(-0.45, 0.55, eased);
    } else {
      const u = (t - 0.65) / 0.35;
      armX = THREE.MathUtils.lerp(-0.05 - pitch, -0.4 - pitch * 0.5, u);
      armZ = THREE.MathUtils.lerp(0.55, -0.2, u);
    }
    rightArm.position.set(1.05, 3.55, 0);
    leftArm.position.set(-1.05, 3.55, 0);
    rightArm.rotation.set(armX, 0.15, armZ);
    leftArm.rotation.set(0.35, 0, 0.2);
    if (weaponMesh) {
      weaponMesh.position.set(0.1, 0.05, 0.05);
      weaponMesh.rotation.set(Math.PI, 0, -0.25);
    }
  } else if (style === "spear") {
    const thrust =
      t < 0.18
        ? THREE.MathUtils.lerp(0, -0.25, t / 0.18)
        : t < 0.5
          ? THREE.MathUtils.lerp(-0.25, 1.15, (t - 0.18) / 0.32)
          : THREE.MathUtils.lerp(1.15, 0, (t - 0.5) / 0.5);

    const base = -Math.PI * 0.5 - pitch;
    leftArm.position.set(-1.05, 3.55, thrust);
    rightArm.position.set(1.05, 3.55, thrust);
    leftArm.rotation.set(base - thrust * 0.12, 0.18, 0.3);
    rightArm.rotation.set(base - thrust * 0.12, -0.18, -0.3);
    if (weaponMesh) {
      weaponMesh.position.set(-1.0, 0.55 + thrust * 0.15, 0.05);
      weaponMesh.rotation.set(Math.PI, 0, 0);
    }
  } else {
    const u = t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.55;
    const jab = THREE.MathUtils.lerp(0, -Math.PI * 0.7 - pitch, u);
    const reach = u * 0.7;
    rightArm.position.set(1.05, 3.55, reach);
    leftArm.position.set(-1.05, 3.55, 0);
    rightArm.rotation.set(jab, 0, -0.25);
    leftArm.rotation.set(0.35, 0, 0.2);
  }
}

/** Attach / clear weapon meshes on hand sockets based on equipped def */
export function attachWeaponMeshes(player, def) {
  const { leftHand, rightHand } = player.userData;

  while (rightHand.children.length) rightHand.remove(rightHand.children[0]);
  while (leftHand.children.length) leftHand.remove(leftHand.children[0]);
  player.userData.weaponMesh = null;

  // Reset shoulder seats
  player.userData.leftArm.position.set(-1.05, 3.55, 0);
  player.userData.rightArm.position.set(1.05, 3.55, 0);

  if (!def?.builder) return;

  const mesh = def.builder();
  player.userData.weaponMesh = mesh;
  rightHand.add(mesh);

  if (def.twoHanded) {
    // Tip along -Y so when arms raise forward it points at the enemy
    mesh.rotation.set(Math.PI, 0, 0);
    mesh.position.set(-1.0, 0.55, 0.05);
  } else {
    // Sword tip past fingers (-Y); raises skyward on overhead swing
    mesh.rotation.set(Math.PI, 0, -0.35);
    mesh.position.set(0.1, 0.05, 0.05);
  }
}
