/**
 * Classic grid maps — open Doom-style rooms, not a tight maze.
 * # wall  . floor  P player  E enemy  D door
 * 1 pea  2 shotgun  3 launcher  H health  X exit
 *
 * Wall texture ids by cell hash for variety.
 */

export const LEVELS = [
  {
    id: "E1M1",
    name: "Hangar of Hunger",
    grid: [
      "########################",
      "#......................#",
      "#..####..........####..#",
      "#..#................#..#",
      "#..#...##......##...#..#",
      "#......#...E....#......#",
      "#......####D#####......#",
      "#..P................2..#",
      "#..........H...........#",
      "####D##############D####",
      "#......................#",
      "#..E....########....E..#",
      "#.......#......#.......#",
      "#.......#..1...#.......#",
      "#.......##D#####.......#",
      "#......................#",
      "#..####..........####..#",
      "#..#................#..#",
      "#..#......E.........#.X#",
      "#......................#",
      "########################",
    ],
  },
  {
    id: "E1M2",
    name: "Freezer Complex",
    grid: [
      "############################",
      "#..........................#",
      "#..######......######......#",
      "#..#................#..3...#",
      "#..#..E.............D......#",
      "#..######......######......#",
      "#..........................#",
      "#######D########D###########",
      "#............##............#",
      "#..P.........##........H..X#",
      "#............##............#",
      "#..2....E....##....E.......#",
      "#............##............#",
      "#######D########D###########",
      "#..........................#",
      "#..######......######......#",
      "#..#................#......#",
      "#..D......E.........#..1...#",
      "#..######......######......#",
      "#..........................#",
      "############################",
    ],
  },
];

export function parseLevel(def) {
  const rows = def.grid;
  const h = rows.length;
  const w = rows[0].length;
  const tiles = [];
  const wallTex = [];
  const spawns = {
    player: { x: 1.5, y: 1.5, angle: 0 },
    enemies: [],
    pickups: [],
    doors: [],
    exit: null,
  };

  const texCycle = ["tech", "rust", "tile", "freezer"];

  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    wallTex[y] = [];
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      let type = 0; // 0 floor, 1 wall, 2 door, 3 exit wall marker
      if (c === "#") type = 1;
      else if (c === "D") type = 2;
      tiles[y][x] = type;
      wallTex[y][x] = texCycle[(x + y) % texCycle.length];

      const wx = x + 0.5;
      const wy = y + 0.5;
      if (c === "P") spawns.player = { x: wx, y: wy, angle: 0 };
      if (c === "E") spawns.enemies.push({ x: wx, y: wy });
      if (c === "X") {
        spawns.exit = { x: wx, y: wy };
        // Mark adjacent walls as exit textured via special
      }
      if (c === "H") spawns.pickups.push({ x: wx, y: wy, kind: "health" });
      if (c === "1") spawns.pickups.push({ x: wx, y: wy, kind: "pea" });
      if (c === "2") spawns.pickups.push({ x: wx, y: wy, kind: "shotgun" });
      if (c === "3") spawns.pickups.push({ x: wx, y: wy, kind: "launcher" });
      if (c === "D") spawns.doors.push({ x, y, open: false });
    }
  }

  // Paint exit cell floor special — walls around exit use exit tex
  if (spawns.exit) {
    const ex = Math.floor(spawns.exit.x);
    const ey = Math.floor(spawns.exit.y);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const xx = ex + dx;
      const yy = ey + dy;
      if (tiles[yy]?.[xx] === 1) wallTex[yy][xx] = "exit";
    }
  }

  return { id: def.id, name: def.name, w, h, tiles, wallTex, spawns, doors: spawns.doors };
}

export function isBlocked(map, x, y, doors) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (my < 0 || mx < 0 || my >= map.h || mx >= map.w) return true;
  const t = map.tiles[my][mx];
  if (t === 1) return true;
  if (t === 2) {
    const door = doors.find((d) => d.x === mx && d.y === my);
    return !door || !door.open;
  }
  return false;
}
