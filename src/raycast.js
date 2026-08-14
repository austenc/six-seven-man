/**
 * Classic DDA raycaster — Wolfenstein / Doom 2.5D look.
 */

const FOV = Math.PI / 3;
const TEX = 64;

export function createRenderer(canvas, textures, sprites) {
  const ctx = canvas.getContext("2d", { alpha: false });
  // Offscreen buffer at classic low res, then scale up crunchy
  const buf = document.createElement("canvas");
  const W = 320;
  const H = 200;
  buf.width = W;
  buf.height = H;
  const bctx = buf.getContext("2d", { alpha: false });
  const img = bctx.createImageData(W, H);
  const data = img.data;

  // Cache texture ImageData
  const texData = {};
  for (const [k, c] of Object.entries(textures)) {
    const tctx = c.getContext("2d");
    texData[k] = tctx.getImageData(0, 0, TEX, TEX).data;
  }

  const zBuf = new Float32Array(W);

  function setPixel(x, y, r, g, b) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }

  function shade(r, g, b, dist) {
    const f = Math.max(0.15, Math.min(1, 1 - dist / 18));
    return [(r * f) | 0, (g * f) | 0, (b * f) | 0];
  }

  function sampleTex(name, u, v, sideShade) {
    const td = texData[name] || texData.tech;
    let tx = Math.floor(u * TEX) & 63;
    let ty = Math.floor(v * TEX) & 63;
    const i = (ty * TEX + tx) * 4;
    let r = td[i];
    let g = td[i + 1];
    let b = td[i + 2];
    if (sideShade) {
      r = (r * 0.7) | 0;
      g = (g * 0.7) | 0;
      b = (b * 0.7) | 0;
    }
    return [r, g, b];
  }

  function render(player, map, doors, entities, weaponId, gunKick) {
    // Ceiling / floor flat (fast Doom look)
    for (let y = 0; y < H; y++) {
      const isCeil = y < H / 2;
      const shadeY = isCeil
        ? 0.25 + (y / (H / 2)) * 0.15
        : 0.2 + ((H - y) / (H / 2)) * 0.25;
      const r = isCeil ? (30 * shadeY) | 0 : (55 * shadeY) | 0;
      const g = isCeil ? (18 * shadeY) | 0 : (38 * shadeY) | 0;
      const b = isCeil ? (14 * shadeY) | 0 : (22 * shadeY) | 0;
      for (let x = 0; x < W; x++) setPixel(x, y, r, g, b);
    }

    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);
    const planeX = -dirY * Math.tan(FOV / 2);
    const planeY = dirX * Math.tan(FOV / 2);

    for (let x = 0; x < W; x++) {
      const camX = (2 * x) / W - 1;
      const rayDirX = dirX + planeX * camX;
      const rayDirY = dirY + planeY * camX;

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

      let stepX;
      let stepY;
      let sideDistX;
      let sideDistY;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (player.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1 - player.x) * deltaDistX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (player.y - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1 - player.y) * deltaDistY;
      }

      let hit = 0;
      let side = 0;
      let doorHit = false;

      for (let i = 0; i < 64 && hit === 0; i++) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        if (mapY < 0 || mapX < 0 || mapY >= map.h || mapX >= map.w) {
          hit = 1;
          break;
        }
        const t = map.tiles[mapY][mapX];
        if (t === 1) hit = 1;
        else if (t === 2) {
          const door = doors.find((d) => d.x === mapX && d.y === mapY);
          if (!door || !door.open) {
            hit = 1;
            doorHit = true;
          }
        }
      }

      let perpWallDist;
      if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
      else perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
      if (perpWallDist < 0.05) perpWallDist = 0.05;

      zBuf[x] = perpWallDist;

      const lineHeight = Math.min(H * 4, Math.floor(H / perpWallDist));
      let drawStart = ((H - lineHeight) / 2) | 0;
      let drawEnd = ((H + lineHeight) / 2) | 0;
      if (drawStart < 0) drawStart = 0;
      if (drawEnd >= H) drawEnd = H - 1;

      let wallX;
      if (side === 0) wallX = player.y + perpWallDist * rayDirY;
      else wallX = player.x + perpWallDist * rayDirX;
      wallX -= Math.floor(wallX);

      let texName = doorHit ? "door" : map.wallTex[mapY]?.[mapX] || "tech";
      if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
        // flip
      }

      for (let y = drawStart; y <= drawEnd; y++) {
        const d = y * 256 - H * 128 + lineHeight * 128;
        const texY = ((d * TEX) / lineHeight / 256) & 63;
        const [r0, g0, b0] = sampleTex(texName, wallX, texY / TEX, side === 1);
        const [r, g, b] = shade(r0, g0, b0, perpWallDist);
        setPixel(x, y, r, g, b);
      }
    }

    bctx.putImageData(img, 0, 0);

    // Sprites (enemies + pickups)
    const spritesToDraw = entities
      .filter((e) => e.alive !== false && !e.taken)
      .map((e) => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx, dy);
        return { e, dx, dy, dist };
      })
      .filter((s) => s.dist > 0.2)
      .sort((a, b) => b.dist - a.dist);

    for (const s of spritesToDraw) {
      const invDet = 1 / (planeX * dirY - dirX * planeY);
      const transformX = invDet * (dirY * s.dx - dirX * s.dy);
      const transformY = invDet * (-planeY * s.dx + planeX * s.dy);
      if (transformY <= 0.05) continue;

      const spriteScreenX = Math.floor((W / 2) * (1 + transformX / transformY));
      const spriteH = Math.abs(Math.floor(H / transformY));
      const spriteW = spriteH;
      const drawStartY = Math.max(0, ((H - spriteH) / 2) | 0);
      const drawEndY = Math.min(H - 1, ((H + spriteH) / 2) | 0);
      const drawStartX = Math.max(0, ((spriteScreenX - spriteW / 2) | 0));
      const drawEndX = Math.min(W - 1, ((spriteScreenX + spriteW / 2) | 0));

      const spr = sprites[s.e.sprite] || sprites.cake;
      const shadeF = Math.max(0.2, Math.min(1, 1 - s.dist / 16));

      for (let stripe = drawStartX; stripe <= drawEndX; stripe++) {
        if (transformY >= zBuf[stripe]) continue;
        const texX = Math.floor(((stripe - (spriteScreenX - spriteW / 2)) * spr.width) / spriteW);
        bctx.globalAlpha = 1;
        // draw column via drawImage slice
        bctx.save();
        bctx.beginPath();
        bctx.rect(stripe, drawStartY, 1, drawEndY - drawStartY + 1);
        bctx.clip();
        bctx.filter = `brightness(${shadeF})`;
        bctx.drawImage(
          spr,
          texX,
          0,
          1,
          spr.height,
          stripe,
          drawStartY,
          1,
          drawEndY - drawStartY + 1
        );
        bctx.restore();
      }
    }

    // Weapon overlay — stays in bottom third; slight walk bob / recoil
    const gun = sprites.weapons[weaponId] || sprites.weapons.pea;
    const bob = Math.sin(player.bob || 0) * 3;
    const kick = (gunKick || 0) * 12;
    bctx.drawImage(gun, bob * 0.4, bob + kick);

    // Scale to full canvas with nearest-neighbor crunch
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / W, canvas.height / H);
    const dw = (W * scale) | 0;
    const dh = (H * scale) | 0;
    const ox = ((canvas.width - dw) / 2) | 0;
    const oy = ((canvas.height - dh) / 2) | 0;
    ctx.drawImage(buf, ox, oy, dw, dh);

    return { zBuf, W, H };
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  return { render, resize, W, H };
}

/** Hitscan along player look for first entity */
export function hitscan(player, map, doors, entities, maxDist = 14) {
  const step = 0.08;
  let x = player.x;
  let y = player.y;
  const dx = Math.cos(player.angle) * step;
  const dy = Math.sin(player.angle) * step;
  for (let d = 0; d < maxDist; d += step) {
    x += dx;
    y += dy;
    const mx = Math.floor(x);
    const my = Math.floor(y);
    if (my < 0 || mx < 0 || my >= map.h || mx >= map.w) return null;
    const t = map.tiles[my][mx];
    if (t === 1) return null;
    if (t === 2) {
      const door = doors.find((dd) => dd.x === mx && dd.y === my);
      if (!door || !door.open) return null;
    }
    for (const e of entities) {
      if (e.alive === false || e.taken) continue;
      if (!e.hp) continue; // pickups skip
      if (Math.hypot(e.x - x, e.y - y) < 0.45) return e;
    }
  }
  return null;
}
