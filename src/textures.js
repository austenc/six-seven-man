/** Procedural old-school Doom-ish textures (64×64 indexed-look canvases). */

function makeCanvas(size = 64) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}

function noise(x, y, seed = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.1) * 43758.5453;
  return n - Math.floor(n);
}

export function createTextures() {
  return {
    tech: wallTech(),
    rust: wallRust(),
    tile: wallTile(),
    freezer: wallFreezer(),
    door: wallDoor(),
    exit: wallExit(),
    floor: floorDirt(),
    ceil: ceilDark(),
  };
}

function wallTech() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  // Base metal grey-brown like Doom techbase
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 1);
      const v = 70 + n * 40;
      g.fillStyle = `rgb(${v},${v * 0.75},${v * 0.55})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  // Panel lines
  g.strokeStyle = "#2a1810";
  g.lineWidth = 2;
  g.strokeRect(2, 2, 60, 60);
  g.strokeRect(8, 8, 48, 48);
  // Red hazard strip (Doom computer panel vibe)
  g.fillStyle = "#8b1a1a";
  g.fillRect(12, 28, 40, 8);
  g.fillStyle = "#c9a227";
  for (let i = 0; i < 5; i++) g.fillRect(14 + i * 8, 30, 4, 4);
  // Rivets
  g.fillStyle = "#1a1008";
  for (const [x, y] of [
    [6, 6],
    [58, 6],
    [6, 58],
    [58, 58],
  ]) {
    g.beginPath();
    g.arc(x, y, 2, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

function wallRust() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 2);
      const r = 90 + n * 50;
      g.fillStyle = `rgb(${r},${40 + n * 20},${25})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = "#5a2010";
  g.fillRect(0, 0, 64, 4);
  g.fillRect(0, 60, 64, 4);
  g.fillStyle = "#3a1008";
  for (let i = 0; i < 8; i++) g.fillRect(i * 8, 20 + (i % 3) * 6, 7, 3);
  return c;
}

function wallTile() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  g.fillStyle = "#6a5a4a";
  g.fillRect(0, 0, 64, 64);
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const n = noise(tx, ty, 3);
      g.fillStyle = `rgb(${120 + n * 30},${100 + n * 20},${80})`;
      g.fillRect(tx * 16 + 1, ty * 16 + 1, 14, 14);
      g.strokeStyle = "#2a2018";
      g.strokeRect(tx * 16, ty * 16, 16, 16);
    }
  }
  return c;
}

function wallFreezer() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 4);
      const b = 90 + n * 50;
      g.fillStyle = `rgb(${b * 0.55},${b * 0.7},${b})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  g.strokeStyle = "#cfe8ff";
  g.lineWidth = 2;
  g.strokeRect(4, 4, 56, 56);
  g.fillStyle = "rgba(200,230,255,0.25)";
  g.fillRect(10, 10, 20, 44);
  return c;
}

function wallDoor() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  g.fillStyle = "#5a4018";
  g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) {
    g.fillStyle = y % 16 === 0 ? "#8b6914" : "#6a5010";
    g.fillRect(4, y, 56, 7);
  }
  g.fillStyle = "#c9a227";
  g.fillRect(28, 26, 8, 12);
  g.fillStyle = "#1a1008";
  g.fillRect(30, 28, 4, 8);
  return c;
}

function wallExit() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  g.fillStyle = "#14331a";
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#33ff66";
  g.font = "bold 14px monospace";
  g.fillText("EXIT", 16, 28);
  g.fillText(">>>", 18, 46);
  g.strokeStyle = "#1a8b3a";
  g.lineWidth = 3;
  g.strokeRect(3, 3, 58, 58);
  return c;
}

function floorDirt() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 5);
      const v = 45 + n * 35;
      g.fillStyle = `rgb(${v},${v * 0.7},${v * 0.45})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function ceilDark() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 6);
      const v = 25 + n * 20;
      g.fillStyle = `rgb(${v},${v * 0.6},${v * 0.5})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** Tiny enemy / pickup sprites drawn as pixel canvases */
export function createSprites() {
  return {
    cake: spriteCake(),
    ice: spriteIce(),
    cookie: spriteCookie(),
    health: spritePickup("#e74c3c", "+"),
    peaAmmo: spritePickup("#6ab04c", "P"),
    cornAmmo: spritePickup("#f1c40f", "C"),
    cobAmmo: spritePickup("#e67e22", "R"),
    weapons: {
      pea: weaponPea(),
      shotgun: weaponCorn(),
      launcher: weaponCob(),
    },
  };
}

function spriteCake() {
  const c = makeCanvas(64);
  const g = c.getContext("2d");
  g.fillStyle = "#c4891a";
  g.fillRect(12, 28, 40, 28);
  g.fillStyle = "#f5e6c8";
  g.fillRect(10, 24, 44, 8);
  g.fillStyle = "#c4891a";
  g.fillRect(14, 16, 36, 10);
  g.fillStyle = "#f5e6c8";
  g.fillRect(12, 12, 40, 6);
  // eyes
  g.fillStyle = "#ff2222";
  g.fillRect(20, 30, 6, 6);
  g.fillRect(38, 30, 6, 6);
  g.fillStyle = "#111";
  g.fillRect(22, 32, 3, 3);
  g.fillRect(40, 32, 3, 3);
  g.fillStyle = "#5c1a1a";
  g.fillRect(24, 42, 16, 4);
  return c;
}

function spriteIce() {
  const c = makeCanvas(64);
  const g = c.getContext("2d");
  g.fillStyle = "#e0a86c";
  g.beginPath();
  g.moveTo(32, 56);
  g.lineTo(18, 28);
  g.lineTo(46, 28);
  g.fill();
  g.fillStyle = "#ffb6c1";
  g.beginPath();
  g.arc(32, 22, 14, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#add8e6";
  g.beginPath();
  g.arc(32, 12, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e74c3c";
  g.beginPath();
  g.arc(32, 4, 4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ff2222";
  g.fillRect(24, 20, 5, 5);
  g.fillRect(35, 20, 5, 5);
  return c;
}

function spriteCookie() {
  const c = makeCanvas(64);
  const g = c.getContext("2d");
  g.fillStyle = "#1a5276";
  g.beginPath();
  g.arc(32, 34, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(24, 26, 7, 0, Math.PI * 2);
  g.arc(40, 26, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#111";
  g.beginPath();
  g.arc(24, 26, 3, 0, Math.PI * 2);
  g.arc(40, 26, 3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#c4a35a";
  g.fillRect(40, 40, 12, 6);
  g.fillStyle = "#111";
  g.fillRect(22, 40, 20, 8);
  return c;
}

function spritePickup(color, letter) {
  const c = makeCanvas(32);
  const g = c.getContext("2d");
  g.fillStyle = color;
  g.fillRect(4, 4, 24, 24);
  g.strokeStyle = "#111";
  g.strokeRect(4, 4, 24, 24);
  g.fillStyle = "#111";
  g.font = "bold 14px monospace";
  g.fillText(letter, 11, 22);
  return c;
}

function weaponPea() {
  // Gun only occupies bottom ~1/3 of the 200px view
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");

  // Right-hand Doom-style pistol silhouette — pea themed
  // Grip
  g.fillStyle = "#1a3010";
  g.fillRect(168, 168, 28, 32);
  g.fillStyle = "#2d4a1a";
  g.fillRect(170, 170, 24, 28);

  // Receiver / body
  g.fillStyle = "#3d6b2d";
  g.fillRect(148, 148, 70, 24);
  g.fillStyle = "#2a5020";
  g.fillRect(150, 150, 66, 8);

  // Pea magazine hanging down
  g.fillStyle = "#6ab04c";
  g.fillRect(158, 170, 18, 22);
  g.fillStyle = "#8fd46a";
  g.fillRect(160, 172, 6, 6);
  g.fillRect(168, 178, 6, 6);
  g.fillRect(160, 184, 6, 6);

  // Barrel
  g.fillStyle = "#4a8030";
  g.fillRect(128, 152, 24, 12);
  g.fillStyle = "#8fd46a";
  g.fillRect(118, 154, 12, 8);

  // Front pea "muzzle"
  g.fillStyle = "#7dce4a";
  g.beginPath();
  g.arc(118, 158, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2d5a2d";
  g.beginPath();
  g.arc(118, 158, 3, 0, Math.PI * 2);
  g.fill();

  // Sight
  g.fillStyle = "#1a3010";
  g.fillRect(190, 144, 4, 6);
  g.fillRect(152, 146, 3, 4);

  return c;
}

function weaponCorn() {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");

  // Pump shotgun silhouette — corn cob receiver
  g.fillStyle = "#5a4010";
  g.fillRect(175, 170, 32, 30);

  g.fillStyle = "#c9a227";
  g.fillRect(130, 152, 100, 22);

  // Corn kernel detail on receiver
  g.fillStyle = "#ffe082";
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 2; j++) {
      g.fillRect(145 + i * 9, 156 + j * 8, 7, 6);
    }
  }

  // Barrel
  g.fillStyle = "#8a7010";
  g.fillRect(95, 156, 40, 12);
  g.fillStyle = "#f4d03f";
  g.fillRect(88, 158, 10, 8);

  // Leaf tip / foresight
  g.fillStyle = "#1e8449";
  g.fillRect(198, 146, 14, 10);
  g.beginPath();
  g.moveTo(212, 146);
  g.lineTo(222, 151);
  g.lineTo(212, 156);
  g.fill();

  return c;
}

function weaponCob() {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");

  // Rocket launcher — whole cob on shoulder
  g.fillStyle = "#5a3010";
  g.fillRect(170, 172, 36, 28);

  g.fillStyle = "#d68910";
  g.fillRect(110, 150, 120, 26);

  // Cob rows
  g.fillStyle = "#e67e22";
  for (let i = 0; i < 10; i++) {
    g.fillRect(120 + i * 10, 154, 8, 8);
    g.fillRect(125 + i * 10, 164, 8, 8);
  }

  // Green husk tip (nose)
  g.fillStyle = "#1e8449";
  g.beginPath();
  g.moveTo(110, 150);
  g.lineTo(90, 163);
  g.lineTo(110, 176);
  g.fill();

  // Tube back
  g.fillStyle = "#8a5010";
  g.fillRect(220, 154, 24, 18);

  return c;
}

/** Doom-style mugshot: bald 6-7 Man + pot belly. status: ok | hurt | bad */
export function drawMugshot(canvas, status = "ok") {
  const g = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);

  // Backdrop
  g.fillStyle = "#1a1008";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#2a1810";
  g.fillRect(2, 2, w - 4, h - 4);

  const skin = status === "bad" ? "#c08070" : "#e0a888";
  const shirt = "#2f6db5";

  // Pot belly (signature) — hangs below shirt
  g.fillStyle = skin;
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.78, w * 0.28, h * 0.18, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.82, w * 0.18, h * 0.1, 0, 0, Math.PI * 2);
  g.fill();

  // Shirt torso (short — belly shows)
  g.fillStyle = shirt;
  g.fillRect(w * 0.22, h * 0.42, w * 0.56, h * 0.28);

  // Neck
  g.fillStyle = skin;
  g.fillRect(w * 0.42, h * 0.34, w * 0.16, h * 0.12);

  // Bald head
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.26, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
  g.fill();

  // Bald shine
  g.fillStyle = "#f5d0b8";
  g.beginPath();
  g.ellipse(w * 0.56, h * 0.18, w * 0.06, h * 0.04, 0.3, 0, Math.PI * 2);
  g.fill();

  // Eyes
  if (status === "hurt") {
    g.fillStyle = "#111";
    g.fillRect(w * 0.38, h * 0.24, w * 0.08, h * 0.02);
    g.fillRect(w * 0.54, h * 0.24, w * 0.08, h * 0.02);
  } else {
    g.fillStyle = "#fff";
    g.fillRect(w * 0.38, h * 0.22, w * 0.08, h * 0.06);
    g.fillRect(w * 0.54, h * 0.22, w * 0.08, h * 0.06);
    g.fillStyle = "#111";
    g.fillRect(w * 0.4, h * 0.24, w * 0.04, h * 0.04);
    g.fillRect(w * 0.56, h * 0.24, w * 0.04, h * 0.04);
  }

  // Angry brows / mouth
  g.fillStyle = "#3b0a0a";
  if (status === "ok") {
    g.fillRect(w * 0.36, h * 0.18, w * 0.1, h * 0.025);
    g.fillRect(w * 0.54, h * 0.18, w * 0.1, h * 0.025);
    g.fillStyle = "#c0392b";
    g.fillRect(w * 0.44, h * 0.32, w * 0.12, h * 0.025);
  } else if (status === "hurt") {
    g.fillRect(w * 0.36, h * 0.19, w * 0.28, h * 0.02);
    g.fillStyle = "#c0392b";
    g.fillRect(w * 0.42, h * 0.31, w * 0.16, h * 0.04);
  } else {
    g.fillStyle = "#111";
    g.fillRect(w * 0.38, h * 0.2, w * 0.08, 2);
    g.fillRect(w * 0.54, h * 0.2, w * 0.08, 2);
    g.fillStyle = "#8b1a1a";
    g.fillRect(w * 0.4, h * 0.3, w * 0.2, h * 0.05);
  }

  // Ear nubs
  g.fillStyle = skin;
  g.fillRect(w * 0.26, h * 0.24, w * 0.05, h * 0.08);
  g.fillRect(w * 0.69, h * 0.24, w * 0.05, h * 0.08);
}

