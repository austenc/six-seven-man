import * as THREE from "three";

/**
 * Visible third-person 6-7 Man — stylized low-poly, not chunky voxels.
 * Tall, bald, pot belly peeking under a short tee.
 */
export function createPlayerModel() {
  const root = new THREE.Group();
  root.name = "sixSevenMan";

  const skin = new THREE.MeshLambertMaterial({ color: 0xe0a888 });
  const shirt = new THREE.MeshLambertMaterial({ color: 0x2f6db5 });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2a3540 });
  const shoe = new THREE.MeshLambertMaterial({ color: 0x151515 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.85, 4, 8), shirt);
  torso.position.y = 3.15;
  root.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), skin);
  belly.scale.set(1.15, 0.85, 1.25);
  belly.position.set(0, 2.35, 0.28);
  root.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), skin);
  head.position.y = 4.35;
  root.add(head);

  // Bald shine
  const shine = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xf5d0b8, emissive: 0x332211, emissiveIntensity: 0.2 })
  );
  shine.position.set(0.12, 4.7, 0.1);
  root.add(shine);

  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const le = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), eyeMat);
  le.position.set(-0.16, 4.4, 0.42);
  const re = le.clone();
  re.position.x = 0.16;
  root.add(le, re);

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.1, 4, 6), pants);
  legL.position.set(-0.28, 1.15, 0);
  const legR = legL.clone();
  legR.position.x = 0.28;
  root.add(legL, legR);

  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.55), shoe);
  shoeL.position.set(-0.28, 0.2, 0.08);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.28;
  root.add(shoeL, shoeR);

  const armL = new THREE.Group();
  armL.position.set(-0.85, 3.5, 0);
  const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 4, 6), skin);
  armLMesh.position.y = -0.55;
  armL.add(armLMesh);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.85, 3.5, 0);
  const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 4, 6), skin);
  armRMesh.position.y = -0.55;
  armR.add(armRMesh);
  const hand = new THREE.Group();
  hand.position.set(0, -1.15, 0);
  armR.add(hand);
  root.add(armR);

  root.userData = { armL, armR, hand, legL, legR, walkPhase: 0, height: 4.8 };
  return root;
}

export function updatePlayerPose(model, { moving, sprint, dt, firing }) {
  const ud = model.userData;
  if (moving) {
    ud.walkPhase += dt * (sprint ? 14 : 10);
    const s = Math.sin(ud.walkPhase);
    ud.legL.rotation.x = s * 0.55;
    ud.legR.rotation.x = -s * 0.55;
    if (!firing) {
      ud.armL.rotation.x = -s * 0.4;
      ud.armR.rotation.x = s * 0.25 - 0.35;
    }
  } else {
    ud.walkPhase *= 1 - Math.min(1, dt * 8);
    ud.legL.rotation.x *= 0.85;
    ud.legR.rotation.x *= 0.85;
    if (!firing) {
      ud.armL.rotation.x *= 0.9;
      ud.armR.rotation.x = THREE.MathUtils.lerp(ud.armR.rotation.x, -0.4, 0.15);
    }
  }
  if (firing) {
    ud.armR.rotation.x = -1.1;
    ud.armR.rotation.z = -0.15;
  } else {
    ud.armR.rotation.z *= 0.9;
  }
}
