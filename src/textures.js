/** Procedural Doom-ish textures & sprites — stone castle + veggie guns. */

function makeCanvas(w = 64, h = 64) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function noise(x, y, seed = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.1) * 43758.5453;
  return n - Math.floor(n);
}

export function createTextures() {
  return {
    brick: wallBrick(),
    stone: wallStone(),
    stone2: wallStone2(),
    support: wallSupport(),
    door: wallDoor(),
    exit: wallExit(),
    floor: floorStone(),
    nukage: floorNukage(),
    ceil: ceilDark(),
  };
}

function wallBrick() {
  // Doom STAR-ish brown tech brick
  const c = makeCanvas();
  const g = c.getContext("2d");
  g.fillStyle = "#4a3428";
  g.fillRect(0, 0, 64, 64);
  for (let row = 0; row < 8; row++) {
    const off = row % 2 === 0 ? 0 : 8;
    for (let col = -1; col < 5; col++) {
      const x = col * 16 + off;
      const y = row * 8;
      const n = noise(col + 3, row, 1);
      const r = 98 + n * 36;
      const gg = 62 + n * 18;
      const b = 38 + n * 10;
      g.fillStyle = `rgb(${r},${gg},${b})`;
      g.fillRect(x + 1, y + 1, 14, 6);
      g.strokeStyle = "#1e140e";
      g.strokeRect(x, y, 16, 8);
    }
  }
  // Tech vent plate
  g.fillStyle = "#2a2218";
  g.fillRect(22, 22, 20, 20);
  g.fillStyle = "#6a5038";
  g.fillRect(26, 26, 12, 12);
  g.fillStyle = "#1a1008";
  g.fillRect(28, 28, 8, 8);
  return c;
}

function wallStone() {
  // Grey metal panel — Doom computer-room vibe
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 2);
      const v = 78 + n * 40;
      g.fillStyle = `rgb(${v},${v * 0.92},${v * 0.82})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  g.strokeStyle = "#2a2a2a";
  g.lineWidth = 2;
  g.strokeRect(2, 2, 28, 28);
  g.strokeRect(34, 2, 28, 28);
  g.strokeRect(2, 34, 28, 28);
  g.strokeRect(34, 34, 28, 28);
  g.fillStyle = "#3a8a3a";
  g.fillRect(8, 10, 6, 4);
  g.fillStyle = "#8a2a2a";
  g.fillRect(40, 42, 6, 4);
  return c;
}

function wallStone2() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 7);
      const v = 58 + n * 32;
      g.fillStyle = `rgb(${v * 0.95},${v * 0.72},${v * 0.5})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = "#2a2010";
  g.fillRect(0, 18, 64, 5);
  g.fillRect(0, 42, 64, 5);
  g.fillStyle = "#8a6a30";
  g.fillRect(0, 19, 64, 2);
  return c;
}

function wallSupport() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  g.fillStyle = "#2a2218";
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#5a4830";
  g.fillRect(6, 0, 18, 64);
  g.fillRect(40, 0, 18, 64);
  g.fillStyle = "#8a7048";
  g.fillRect(10, 0, 4, 64);
  g.fillRect(44, 0, 4, 64);
  g.fillStyle = "#1a1810";
  for (let y = 4; y < 64; y += 10) {
    g.fillRect(0, y, 64, 2);
  }
  return c;
}

function wallDoor() {
  // Classic blue Doom door with warning stripe
  const c = makeCanvas();
  const g = c.getContext("2d");
  g.fillStyle = "#141c30";
  g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 === 0 ? "#3a5088" : "#243868";
    g.fillRect(6 + i * 14, 4, 12, 56);
  }
  g.fillStyle = "#c9a227";
  g.fillRect(0, 24, 64, 14);
  g.fillStyle = "#1a1008";
  g.fillRect(0, 28, 64, 2);
  g.fillRect(0, 34, 64, 2);
  g.fillStyle = "#1a1008";
  g.font = "bold 9px monospace";
  g.fillText("DOOR", 18, 34);
  g.fillStyle = "#e8d080";
  g.fillRect(28, 12, 8, 6);
  g.fillRect(28, 46, 8, 6);
  g.strokeStyle = "#88aaff";
  g.lineWidth = 3;
  g.strokeRect(2, 2, 60, 60);
  return c;
}

function wallExit() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  g.fillStyle = "#0a2810";
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#33ff66";
  g.font = "bold 12px monospace";
  g.fillText("EXIT", 16, 28);
  g.fillText(">>>", 18, 46);
  g.strokeStyle = "#1a8b3a";
  g.lineWidth = 4;
  g.strokeRect(2, 2, 60, 60);
  return c;
}

function floorStone() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 5);
      const v = 42 + n * 28;
      g.fillStyle = `rgb(${v},${v * 0.72},${v * 0.48})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  g.strokeStyle = "#2a1810";
  g.strokeRect(0, 0, 32, 32);
  g.strokeRect(32, 32, 32, 32);
  return c;
}

function floorNukage() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 9);
      g.fillStyle = `rgb(${10 + n * 25},${140 + n * 90},${20 + n * 30})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = "rgba(180,255,80,0.35)";
  g.fillRect(8, 20, 18, 6);
  g.fillRect(36, 40, 14, 5);
  return c;
}

function ceilDark() {
  const c = makeCanvas();
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = noise(x, y, 6);
      const v = 28 + n * 18;
      g.fillStyle = `rgb(${v},${v * 0.6},${v * 0.5})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

export function createSprites() {
  return {
    cake: spriteCake(),
    ice: spriteIce(),
    cookie: spriteCookie(),
    health: spriteMedkit(),
    armor: spriteArmor(),
    pea: spriteGunPickupPea(),
    shotgun: spriteGunPickupCorn(),
    launcher: spriteGunPickupCob(),
    peaBall: spritePeaBall(),
    cornKernel: spriteCornKernel(),
    cobRocket: spriteCobRocket(),
    fireball: spriteFireball(),
    weapons: {
      pea: weaponPea(false),
      peaFlash: weaponPea(true),
      shotgun: weaponCorn(false),
      shotgunFlash: weaponCorn(true),
      launcher: weaponCob(false),
      launcherFlash: weaponCob(true),
    },
  };
}

function spriteCake() {
  // Demonic layered cake — horns, fangs, red eyes (Pinky energy)
  const c = makeCanvas(64);
  const g = c.getContext("2d");
  // Horns
  g.fillStyle = "#8b1a1a";
  g.beginPath();
  g.moveTo(14, 18);
  g.lineTo(8, 2);
  g.lineTo(22, 14);
  g.fill();
  g.beginPath();
  g.moveTo(50, 18);
  g.lineTo(56, 2);
  g.lineTo(42, 14);
  g.fill();
  // Cake layers
  g.fillStyle = "#6b3410";
  g.fillRect(10, 40, 44, 18);
  g.fillStyle = "#f5e6c8";
  g.fillRect(8, 36, 48, 8);
  g.fillStyle = "#a05018";
  g.fillRect(12, 26, 40, 12);
  g.fillStyle = "#fff0d0";
  g.fillRect(10, 22, 44, 6);
  g.fillStyle = "#c46820";
  g.fillRect(14, 14, 36, 10);
  // Face
  g.fillStyle = "#ff2200";
  g.fillRect(20, 28, 8, 8);
  g.fillRect(36, 28, 8, 8);
  g.fillStyle = "#1a0505";
  g.fillRect(22, 30, 4, 4);
  g.fillRect(38, 30, 4, 4);
  // Fanged mouth
  g.fillStyle = "#2a0808";
  g.fillRect(22, 44, 20, 8);
  g.fillStyle = "#f5f5f0";
  g.fillRect(24, 44, 4, 7);
  g.fillRect(36, 44, 4, 7);
  g.fillStyle = "#ff3344";
  g.fillRect(28, 48, 8, 3);
  return c;
}

function spriteIce() {
  // Imp-like ice cream cone demon
  const c = makeCanvas(64);
  const g = c.getContext("2d");
  // Horns
  g.fillStyle = "#5a1010";
  g.beginPath();
  g.moveTo(18, 16);
  g.lineTo(10, 0);
  g.lineTo(26, 12);
  g.fill();
  g.beginPath();
  g.moveTo(46, 16);
  g.lineTo(54, 0);
  g.lineTo(38, 12);
  g.fill();
  // Cone body
  g.fillStyle = "#c4894a";
  g.beginPath();
  g.moveTo(32, 60);
  g.lineTo(14, 30);
  g.lineTo(50, 30);
  g.fill();
  g.strokeStyle = "#8a6020";
  g.beginPath();
  g.moveTo(22, 48);
  g.lineTo(42, 36);
  g.moveTo(28, 52);
  g.lineTo(44, 42);
  g.stroke();
  // Scoops
  g.fillStyle = "#ff8fab";
  g.beginPath();
  g.arc(32, 24, 16, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#b8e0ff";
  g.beginPath();
  g.arc(32, 12, 12, 0, Math.PI * 2);
  g.fill();
  // Eyes + claws vibe
  g.fillStyle = "#ffee44";
  g.fillRect(24, 20, 6, 6);
  g.fillRect(36, 20, 6, 6);
  g.fillStyle = "#111";
  g.fillRect(26, 22, 3, 3);
  g.fillRect(38, 22, 3, 3);
  g.fillStyle = "#2a1010";
  g.fillRect(26, 28, 12, 4);
  g.fillStyle = "#fff";
  g.fillRect(27, 28, 3, 5);
  g.fillRect(34, 28, 3, 5);
  return c;
}

function spriteCookie() {
  // Cacodemon-style floating cookie: round, one big eye, fanged maw
  const c = makeCanvas(64);
  const g = c.getContext("2d");
  // Body
  g.fillStyle = "#6b3f14";
  g.beginPath();
  g.arc(32, 34, 26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#a0672a";
  g.beginPath();
  g.arc(32, 34, 22, 0, Math.PI * 2);
  g.fill();
  // Chocolate chips
  g.fillStyle = "#2a1508";
  for (const [cx, cy] of [
    [18, 22],
    [46, 20],
    [14, 40],
    [48, 42],
    [22, 48],
    [40, 16],
  ]) {
    g.beginPath();
    g.arc(cx, cy, 3, 0, Math.PI * 2);
    g.fill();
  }
  // Single huge eye (cacodemon)
  g.fillStyle = "#f5f0e0";
  g.beginPath();
  g.arc(32, 26, 11, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e03020";
  g.beginPath();
  g.arc(32, 26, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#100808";
  g.beginPath();
  g.arc(32, 26, 3.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(29, 23, 2, 0, Math.PI * 2);
  g.fill();
  // Huge fanged mouth
  g.fillStyle = "#1a0808";
  g.beginPath();
  g.ellipse(32, 46, 14, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f0e8d8";
  for (let i = 0; i < 5; i++) {
    const tx = 22 + i * 5;
    g.beginPath();
    g.moveTo(tx, 40);
    g.lineTo(tx + 2.5, 48);
    g.lineTo(tx + 5, 40);
    g.fill();
  }
  g.fillStyle = "#ff3344";
  g.beginPath();
  g.ellipse(32, 48, 6, 3, 0, 0, Math.PI);
  g.fill();
  return c;
}

function spriteFireball() {
  const c = makeCanvas(24);
  const g = c.getContext("2d");
  g.fillStyle = "#ff2200";
  g.beginPath();
  g.arc(12, 12, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ff8800";
  g.beginPath();
  g.arc(12, 12, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffff88";
  g.beginPath();
  g.arc(12, 12, 3.5, 0, Math.PI * 2);
  g.fill();
  return c;
}

function spriteMedkit() {
  const c = makeCanvas(32);
  const g = c.getContext("2d");
  g.fillStyle = "#e8e8e8";
  g.fillRect(4, 8, 24, 18);
  g.fillStyle = "#c0392b";
  g.fillRect(14, 10, 4, 14);
  g.fillRect(8, 15, 16, 4);
  g.strokeStyle = "#111";
  g.strokeRect(4, 8, 24, 18);
  return c;
}

function spriteArmor() {
  const c = makeCanvas(32);
  const g = c.getContext("2d");
  g.fillStyle = "#2ecc71";
  g.fillRect(6, 6, 20, 22);
  g.fillStyle = "#27ae60";
  g.fillRect(10, 10, 12, 14);
  g.fillStyle = "#fff";
  g.font = "bold 10px monospace";
  g.fillText("A", 12, 22);
  return c;
}

function spriteGunPickupPea() {
  const c = makeCanvas(48);
  const g = c.getContext("2d");
  // Mini pistol + pea pod
  g.fillStyle = "#3d6b2d";
  g.fillRect(8, 18, 28, 10);
  g.fillStyle = "#2a5020";
  g.fillRect(30, 20, 12, 6);
  g.fillStyle = "#1a3010";
  g.fillRect(12, 28, 8, 12);
  g.fillStyle = "#6ab04c";
  g.beginPath();
  g.ellipse(18, 14, 10, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#8fd46a";
  g.beginPath();
  g.arc(14, 14, 2, 0, Math.PI * 2);
  g.arc(20, 14, 2, 0, Math.PI * 2);
  g.fill();
  return c;
}

function spriteGunPickupCorn() {
  const c = makeCanvas(48);
  const g = c.getContext("2d");
  g.fillStyle = "#c9a227";
  g.fillRect(6, 20, 32, 10);
  g.fillStyle = "#ffe082";
  for (let i = 0; i < 5; i++) g.fillRect(10 + i * 5, 22, 4, 6);
  g.fillStyle = "#5a4010";
  g.fillRect(30, 30, 8, 10);
  g.fillStyle = "#1e8449";
  g.fillRect(34, 14, 8, 8);
  return c;
}

function spriteGunPickupCob() {
  const c = makeCanvas(48);
  const g = c.getContext("2d");
  g.fillStyle = "#d68910";
  g.fillRect(4, 18, 36, 12);
  g.fillStyle = "#e67e22";
  for (let i = 0; i < 6; i++) g.fillRect(8 + i * 5, 20, 4, 8);
  g.fillStyle = "#1e8449";
  g.beginPath();
  g.moveTo(4, 18);
  g.lineTo(0, 24);
  g.lineTo(4, 30);
  g.fill();
  return c;
}

function spritePeaBall() {
  const c = makeCanvas(24);
  const g = c.getContext("2d");
  g.fillStyle = "#3d6b20";
  g.beginPath();
  g.arc(12, 12, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#7dce4a";
  g.beginPath();
  g.arc(12, 12, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#c8ff90";
  g.beginPath();
  g.arc(9, 9, 3, 0, Math.PI * 2);
  g.fill();
  return c;
}

function spriteCornKernel() {
  const c = makeCanvas(18);
  const g = c.getContext("2d");
  g.fillStyle = "#b8860b";
  g.beginPath();
  g.ellipse(9, 9, 7, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f4d03f";
  g.beginPath();
  g.ellipse(9, 9, 5, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffe082";
  g.fillRect(6, 5, 4, 4);
  return c;
}

function spriteCobRocket() {
  const c = makeCanvas(40);
  const g = c.getContext("2d");
  g.fillStyle = "#a04000";
  g.fillRect(4, 12, 26, 16);
  g.fillStyle = "#e67e22";
  g.fillRect(6, 14, 22, 12);
  g.fillStyle = "#ffe082";
  for (let i = 0; i < 4; i++) g.fillRect(8 + i * 5, 16, 3, 8);
  g.fillStyle = "#1e8449";
  g.beginPath();
  g.moveTo(30, 12);
  g.lineTo(40, 20);
  g.lineTo(30, 28);
  g.fill();
  g.fillStyle = "#ff4422";
  g.beginPath();
  g.moveTo(4, 14);
  g.lineTo(0, 20);
  g.lineTo(4, 26);
  g.fill();
  return c;
}

function weaponPea(flash) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");

  // Foreshortened Doom pistol silhouette — bottom third
  g.fillStyle = "#c4896a";
  g.beginPath();
  g.moveTo(168, 200);
  g.lineTo(168, 172);
  g.lineTo(210, 168);
  g.lineTo(220, 200);
  g.fill();

  // Grip
  g.fillStyle = "#1a2010";
  g.fillRect(172, 162, 28, 32);
  g.fillStyle = "#2a3820";
  g.fillRect(175, 165, 8, 26);

  // Receiver
  g.fillStyle = "#3d5a28";
  g.fillRect(120, 148, 88, 22);
  g.fillStyle = "#2a4018";
  g.fillRect(122, 150, 84, 6);
  g.fillStyle = "#4a6a38";
  g.fillRect(122, 162, 84, 4);

  // Pea pod mag on top
  g.fillStyle = "#4a8030";
  g.beginPath();
  g.ellipse(158, 142, 32, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6ab04c";
  g.beginPath();
  g.ellipse(158, 140, 28, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#9fd86a";
  for (const px of [142, 158, 174]) {
    g.beginPath();
    g.arc(px, 140, 4, 0, Math.PI * 2);
    g.fill();
  }

  // Barrel
  g.fillStyle = "#3a5020";
  g.fillRect(88, 152, 36, 12);
  g.fillStyle = "#101808";
  g.fillRect(84, 154, 8, 8);

  // Muzzle pea
  g.fillStyle = "#7dce4a";
  g.beginPath();
  g.arc(86, 152, 6, 0, Math.PI * 2);
  g.fill();

  if (flash) {
    g.fillStyle = "#ffffcc";
    g.beginPath();
    g.moveTo(84, 158);
    g.lineTo(48, 142);
    g.lineTo(54, 158);
    g.lineTo(48, 174);
    g.closePath();
    g.fill();
    g.fillStyle = "#ff9944";
    g.beginPath();
    g.arc(62, 158, 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffff88";
    g.beginPath();
    g.arc(58, 158, 6, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

function weaponCorn(flash) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");

  g.fillStyle = "#c4896a";
  g.beginPath();
  g.moveTo(178, 200);
  g.lineTo(178, 170);
  g.lineTo(228, 166);
  g.lineTo(236, 200);
  g.fill();

  g.fillStyle = "#4a3010";
  g.fillRect(182, 164, 34, 30);

  // Pump shotgun body as corn cob
  g.fillStyle = "#a07818";
  g.fillRect(100, 146, 112, 24);
  g.fillStyle = "#c9a227";
  g.fillRect(104, 148, 104, 20);
  g.fillStyle = "#ffe082";
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 2; j++) {
      g.fillRect(110 + i * 9, 152 + j * 8, 7, 6);
    }
  }

  // Dual barrel
  g.fillStyle = "#6a5810";
  g.fillRect(68, 150, 36, 16);
  g.fillStyle = "#101008";
  g.fillRect(64, 152, 8, 5);
  g.fillRect(64, 160, 8, 5);

  g.fillStyle = "#1e8449";
  g.beginPath();
  g.moveTo(205, 146);
  g.lineTo(230, 138);
  g.lineTo(220, 158);
  g.fill();

  if (flash) {
    g.fillStyle = "#fff0a0";
    g.beginPath();
    g.arc(58, 158, 16, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffcc44";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.beginPath();
      g.moveTo(58, 158);
      g.lineTo(58 + Math.cos(a) * 30, 158 + Math.sin(a) * 18);
      g.lineTo(58 + Math.cos(a + 0.35) * 18, 158 + Math.sin(a + 0.35) * 10);
      g.fill();
    }
  }
  return c;
}

function weaponCob(flash) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d");

  g.fillStyle = "#c4896a";
  g.beginPath();
  g.moveTo(190, 200);
  g.lineTo(190, 168);
  g.lineTo(240, 164);
  g.lineTo(248, 200);
  g.fill();

  g.fillStyle = "#4a2810";
  g.fillRect(194, 162, 36, 32);

  // RPG tube = giant cob
  g.fillStyle = "#a05010";
  g.fillRect(88, 144, 140, 28);
  g.fillStyle = "#d68910";
  g.fillRect(92, 148, 132, 20);
  g.fillStyle = "#e67e22";
  for (let i = 0; i < 12; i++) {
    g.fillRect(98 + i * 10, 150, 8, 7);
    g.fillRect(102 + i * 10, 160, 8, 7);
  }

  g.fillStyle = "#1e8449";
  g.beginPath();
  g.moveTo(88, 144);
  g.lineTo(60, 158);
  g.lineTo(88, 172);
  g.fill();

  g.fillStyle = "#6a4010";
  g.fillRect(224, 150, 28, 16);
  g.fillStyle = "#201008";
  g.fillRect(246, 154, 8, 8);

  if (flash) {
    g.fillStyle = "#ff5522";
    g.beginPath();
    g.arc(54, 158, 18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffff88";
    g.beginPath();
    g.arc(48, 158, 9, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

export function drawMugshot(canvas, status = "ok") {
  const g = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#1a1008";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#2a1810";
  g.fillRect(2, 2, w - 4, h - 4);

  const skin = status === "bad" ? "#c08070" : "#e0a888";
  const shirt = "#2f6db5";

  g.fillStyle = skin;
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.78, w * 0.28, h * 0.18, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.82, w * 0.18, h * 0.1, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = shirt;
  g.fillRect(w * 0.22, h * 0.42, w * 0.56, h * 0.28);

  g.fillStyle = skin;
  g.fillRect(w * 0.42, h * 0.34, w * 0.16, h * 0.12);
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.26, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#f5d0b8";
  g.beginPath();
  g.ellipse(w * 0.56, h * 0.18, w * 0.06, h * 0.04, 0.3, 0, Math.PI * 2);
  g.fill();

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

  g.fillStyle = skin;
  g.fillRect(w * 0.26, h * 0.24, w * 0.05, h * 0.08);
  g.fillRect(w * 0.69, h * 0.24, w * 0.05, h * 0.08);
}
