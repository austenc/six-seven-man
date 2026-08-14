/**
 * Grid approximations of classic Doom Knee-Deep maps.
 * Layouts follow the iconic room flow (not sector geometry).
 * # stone wall  = tech support  . floor  ~ nukage (slow/hurt)
 * P player  E enemy  D door  X exit
 * 1 pea pistol  2 corn shotgun  3 cob launcher  H health  A armor
 */

export const LEVELS = [
  {
    id: "E1M1",
    name: "Hangar",
    // Classic Hangar flow (south→north):
    // start room → west armor alcove → computer room → zig-zag nukage → exit
    grid: [
      "########################################",
      "#......................#............X..#",
      "#..##################..#..E............#",
      "#..#................#..######D##########",
      "#..#..E.............D..................#",
      "#..#................#..#################",
      "#..######D###########..#...............#",
      "#.......................#..E...........#",
      "#..##################~~~#..............#",
      "#..#................#~.~######D#########",
      "#..#..E.............D~.~..............2#",
      "#..#................#~.~#..............#",
      "#..######D###########~.~#..#############",
      "#.....................~.~#..............#",
      "#..A....#.............~.~#..E...........#",
      "#.......D.............~.D...............#",
      "#..H....#.............~.~#..............#",
      "#..######.............~.~######D#########",
      "#.....................~.~...............#",
      "#..P..................~.~..E............#",
      "#.....................~.~...............#",
      "#.......1.............~.~...............#",
      "########################################",
    ],
  },
  {
    id: "E1M2",
    name: "Nuclear Plant",
    // Start hall → outdoor nukage → serpentine → plant core → exit
    grid: [
      "################################################",
      "#..............................................#",
      "#..############..................############..#",
      "#..#..........#~~~~~~~~~~~~~~~~~~#..........#..#",
      "#..#..E.......#~~~~~~~~~~~~~~~~~~#....E.....#..#",
      "#..#..........########D###########..........#..#",
      "#..######D#####..................######D#####..#",
      "#.......#..............................#.......#",
      "#..P....D........E..........E..........D...H...#",
      "#.......#..............................#.......#",
      "#..######........##########............######..#",
      "#..#.............#........#.................#..#",
      "#..#..2..........D........D........3........#..#",
      "#..#.............#........#.................#..#",
      "#..###############~~~~~~~~###############......#",
      "#.................~~~~~~~~.....................#",
      "#..######D########~~~~~~~~########D#######.....#",
      "#..#....#........#~~~~~~~~#..............#.....#",
      "#..#..E.D...E....D~~~~~~~~D....E.........#..A..#",
      "#..#....#........#~~~~~~~~#..............#.....#",
      "#..######........##########..............#######",
      "#..............................................#",
      "#..##################D###################......#",
      "#..#....................................#......#",
      "#..#..E........1...........H......E.....#..X...#",
      "#..#....................................#......#",
      "#..######################################......#",
      "#..............................................#",
      "################################################",
    ],
  },
];

export function parseLevel(def) {
  const maxW = Math.max(...def.grid.map((r) => r.length));
  const rows = def.grid.map((r) => r.padEnd(maxW, "#"));
  const h = rows.length;
  const w = maxW;
  const tiles = [];
  const wallTex = [];
  const floorTex = [];
  const spawns = {
    player: { x: 1.5, y: 1.5, angle: 0 },
    enemies: [],
    pickups: [],
    doors: [],
    exit: null,
  };

  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    wallTex[y] = [];
    floorTex[y] = [];
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      let type = 0;
      if (c === "#" || c === "=") type = 1;
      else if (c === "D") type = 2;
      else if (c === "~") type = 3;
      tiles[y][x] = type;

      if (c === "D") wallTex[y][x] = "door";
      else if (c === "=") wallTex[y][x] = "support";
      else if ((x + y) % 5 === 0) wallTex[y][x] = "stone2";
      else if ((x + y) % 3 === 0) wallTex[y][x] = "stone";
      else wallTex[y][x] = "brick";

      floorTex[y][x] = c === "~" ? "nukage" : "floor";

      const wx = x + 0.5;
      const wy = y + 0.5;
      // Face into the map (north) like classic Hangar start
      if (c === "P") spawns.player = { x: wx, y: wy, angle: -Math.PI / 2 };
      if (c === "E") spawns.enemies.push({ x: wx, y: wy });
      if (c === "X") spawns.exit = { x: wx, y: wy };
      if (c === "H") spawns.pickups.push({ x: wx, y: wy, kind: "health" });
      if (c === "A") spawns.pickups.push({ x: wx, y: wy, kind: "armor" });
      if (c === "1") spawns.pickups.push({ x: wx, y: wy, kind: "pea" });
      if (c === "2") spawns.pickups.push({ x: wx, y: wy, kind: "shotgun" });
      if (c === "3") spawns.pickups.push({ x: wx, y: wy, kind: "launcher" });
      if (c === "D") spawns.doors.push({ x, y, open: false });
    }
  }

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

  return {
    id: def.id,
    name: def.name,
    w,
    h,
    tiles,
    wallTex,
    floorTex,
    spawns,
    doors: spawns.doors,
  };
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

export function isNukage(map, x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  return map.tiles[my]?.[mx] === 3;
}
