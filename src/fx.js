import * as THREE from "three";

/**
 * Lightweight juice: particles, floating text, screen shake.
 */

const particles = [];
const floaters = [];
const _geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);

export const shake = {
  trauma: 0,
  add(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  },
  update(dt) {
    if (this.trauma <= 0) return { x: 0, y: 0, z: 0 };
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    const mag = this.trauma * this.trauma * 0.55;
    return {
      x: (Math.random() * 2 - 1) * mag,
      y: (Math.random() * 2 - 1) * mag * 0.6,
      z: (Math.random() * 2 - 1) * mag,
    };
  },
};

export function spawnBurst(scene, position, color = 0xff6b35, count = 14) {
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
    });
    const mesh = new THREE.Mesh(_geo, mat);
    mesh.position.copy(position);
    mesh.position.y += 1.2 + Math.random();
    scene.add(mesh);
    particles.push({
      mesh,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        3 + Math.random() * 6,
        (Math.random() - 0.5) * 8
      ),
      life: 0.35 + Math.random() * 0.35,
      age: 0,
    });
  }
}

export function spawnFloater(scene, position, text, color = "#ffe08a") {
  // CSS2D would need extra dependency — use sprite-like canvas texture
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 128);
  ctx.font = "bold 64px Space Grotesk, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "#1a100c";
  ctx.lineWidth = 10;
  ctx.strokeText(text, 128, 64);
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 64);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.position.copy(position);
  sprite.position.y += 2.5;
  sprite.scale.set(2.4, 1.2, 1);
  scene.add(sprite);
  floaters.push({ sprite, age: 0, life: 0.85, vy: 2.8 });
}

export function updateFx(dt, scene) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    p.vel.y -= 18 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.x += dt * 8;
    p.mesh.rotation.y += dt * 6;
    const k = 1 - p.age / p.life;
    p.mesh.scale.setScalar(Math.max(0.01, k));
    if (p.age >= p.life) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }

  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.age += dt;
    f.sprite.position.y += f.vy * dt;
    f.sprite.material.opacity = 1 - f.age / f.life;
    if (f.age >= f.life) {
      scene.remove(f.sprite);
      f.sprite.material.map.dispose();
      f.sprite.material.dispose();
      floaters.splice(i, 1);
    }
  }
}
