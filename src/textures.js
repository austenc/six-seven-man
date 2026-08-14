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
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");
  // Doom-style centered gun
  g.fillStyle = "#2d5a2d";
  g.fillRect(130, 80, 60, 90);
  g.fillStyle = "#6ab04c";
  g.fillRect(145, 40, 30, 50);
  g.fillStyle = "#8fd46a";
  g.fillRect(152, 20, 16, 30);
  g.fillStyle = "#1a301a";
  g.fillRect(140, 150, 40, 30);
  // peas
  g.fillStyle = "#7dce4a";
  g.beginPath();
  g.arc(160, 70, 8, 0, Math.PI * 2);
  g.fill();
  return c;
}

function weaponCorn() {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");
  g.fillStyle = "#c9a227";
  g.fillRect(110, 90, 100, 70);
  g.fillStyle = "#f4d03f";
  g.fillRect(125, 50, 70, 50);
  g.fillStyle = "#ffe082";
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      g.fillRect(132 + i * 10, 55 + j * 12, 8, 10);
    }
  }
  g.fillStyle = "#1e8449";
  g.fillRect(148, 30, 24, 25);
  return c;
}

function weaponCob() {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");
  g.fillStyle = "#d68910";
  g.fillRect(100, 100, 120, 55);
  g.fillStyle = "#e67e22";
  g.fillRect(120, 60, 80, 50);
  g.fillStyle = "#1e8449";
  g.beginPath();
  g.moveTo(160, 25);
  g.lineTo(140, 60);
  g.lineTo(180, 60);
  g.fill();
  g.fillStyle = "#5a3010";
  g.fillRect(145, 150, 30, 35);
  return c;
}
