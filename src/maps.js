/**
 * Classic grid maps.
 * # wall  . floor  P player  E enemy  D door
 * 1 pea pickup  2 corn shotgun  3 cob launcher
 * H health  X exit
 */

export const LEVELS = [
  {
    id: "E1M1",
    name: "Kitchen of Torment",
    music: true,
    grid: [
      "####################",
      "#P....#....E......X#",
      "#.###.#.######.###.#",
      "#.#...#......#...#.#",
      "#.#.######.#.#.#.#.#",
      "#.#........#.#.#...#",
      "#.##########.#.###.#",
      "#......E....D....2.#",
      "######.#######.#####",
      "#H...#.#.....#.....#",
      "#.##.#.#.###.#.###.#",
      "#.#E...#.#1#...#E..#",
      "#.######.#.#####.#.#",
      "#........#.......#.#",
      "#.######.#######D#.#",
      "#.#....#E........#.#",
      "#.#.##.###########.#",
      "#...##.............#",
      "####################",
    ],
  },
  {
    id: "E1M2",
    name: "Freezer of the Damned",
    music: true,
    grid: [
      "########################",
      "#P........##.........HX#",
      "#.######..##..#######..#",
      "#.#....#......#.....3..#",
      "#.#.##.#.######.###.##.#",
      "#...##D.........#....#.#",
      "#####.#########.#.##.#.#",
      "#...#.#...E.....#.##...#",
      "#.#.#.#.#####.#.#.######",
      "#.#...#.#...#.#.#......#",
      "#.#####.#.#.#.#.######.#",
      "#.E....D#.#...#......#.#",
      "#######.#.############.#",
      "#2....#.#........E.....#",
      "#.###.#.##############.#",
      "#.#...#................#",
      "#.#.##################.#",
      "#.#E........H........E.#",
      "#.####################.#",
      "#......................#",
      "########################",
    ],
  },
];

export function parseLevel(levelDef) {
  const rows = levelDef.grid;
  const h = rows.length;
  const w = rows[0].length;
  const tiles = [];
  const spawns = {
    player: { x: 1.5, z: 1.5 },
    enemies: [],
    pickups: [],
    doors: [],
    exit: null,
  };

  for (let z = 0; z < h; z++) {
    tiles[z] = [];
    for (let x = 0; x < w; x++) {
      const c = rows[z][x];
      let type = "floor";
      if (c === "#") type = "wall";
      else if (c === "D") type = "door";
      tiles[z][x] = type;

      const wx = x + 0.5;
      const wz = z + 0.5;
      if (c === "P") spawns.player = { x: wx, z: wz };
      if (c === "E") spawns.enemies.push({ x: wx, z: wz });
      if (c === "X") spawns.exit = { x: wx, z: wz };
      if (c === "H") spawns.pickups.push({ x: wx, z: wz, kind: "health" });
      if (c === "1") spawns.pickups.push({ x: wx, z: wz, kind: "pea" });
      if (c === "2") spawns.pickups.push({ x: wx, z: wz, kind: "shotgun" });
      if (c === "3") spawns.pickups.push({ x: wx, z: wz, kind: "launcher" });
      if (c === "D") spawns.doors.push({ x, z, open: false });
    }
  }

  return { id: levelDef.id, name: levelDef.name, w, h, tiles, spawns };
}
