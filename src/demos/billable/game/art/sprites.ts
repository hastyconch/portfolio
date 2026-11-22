// Vendored from the Billable. game source: the sprites one room needs, gathered from
// src/art/sprites/{associate,enemies,items,tiles,cast}.ts. Grids are unchanged; the Associate
// keeps only frames 0-11 (no ladders or specials), the tile sheet keeps only the tiles this room
// draws (in the default "Floor 12" palette) and the portrait sheet keeps only the email.
import { compose, flipH, paint, recolor, type Part, type SpriteDef } from './raster';
import { pal } from './palette';

/* ===================================================================== *
 * The Associate (src/art/sprites/associate.ts). Frames are 20×24, facing right.
 * ===================================================================== */

const HEAD: Part = [
  '..hhhhhh..',
  '.hHHHhhhhh',
  'hhhhhhhhhh',
  'hhhhhhhhhs',
  'hhhhssssss',
  'hhhsskssks',
  'hhSssvssvs',
  '.hSsssssss',
  '..SssssSss',
  '...SSSSS..',
];
const HEAD_HURT: Part = [
  '..hhhhhh..',
  '.hHHHhhhhh',
  'hhhhhhhhhh',
  'hhhhhhhhhs',
  'hhhhssssss',
  'hhhsSkSSkS',
  'hhSssvssvs',
  '.hSssssKKs',
  '..SsssKKKs',
  '...SSSSS..',
];
const COWLICK: Part = ['h.', '.h'];

const TORSO_IDLE: Part = [
  '...Wwsswww..',
  '..Wwwwgwwww.',
  '.lLwwwgwwwW.',
  '.lLwwwgwwwW.',
  '.lLwwwiGwwWs',
  '.lLWwwwwwWWs',
  '..LCcccccccC',
];
const TORSO_RUN: Part = [
  '...Wwsswww..',
  '..Wwwwgwwww.',
  '.lLwwwgwwwWs',
  '.lLwwwgwwwWs',
  '.lLwwwiGwwW.',
  '.lLWwwwwwWW.',
  '..LCcccccccC',
];
const TORSO_RAISE: Part = [
  '...Wwsswww..',
  '..Wwwwgwwww.',
  '..WwwwgwwwW.',
  '..WwwwgwwwW.',
  '..WwwwiGwwW.',
  '..WWwwwwwWW.',
  '..CcccccccC.',
];
const TORSO_SWING: Part = [
  '...Wwsswww....',
  '..WwwwgwwwwWss',
  '..WwwwgwwwWWSS',
  '..WwwwgwwwW...',
  '..WwwwiGwwW...',
  '..WWwwwwwWW...',
  '..CcccccccC...',
];
const TORSO_POGO: Part = [
  '...Wwsswww..',
  '..Wwwwgwwww.',
  '..WwwwgwwwW.',
  '..WwwwgwwwW.',
  '..WwwssswwW.',
  '..WWwssswWW.',
  '..CcccccccC.',
];
const TORSO_HURT: Part = [
  's..Wwsswww.s',
  'W.Wwwwgwwww.',
  'WWwwwwgwwwWW',
  '..WwwwgwwwW.',
  '..WwwwiGwwW.',
  '..WWwwwwwWW.',
  '..CcccccccC.',
];

const LEGS_STAND: Part = [
  '..cccccccC..',
  '..ccC..ccC..',
  '..ccC..ccC..',
  '..ccC..ccC..',
  '..KKKK.KKKK.',
];
const LEGS_STRIDE: Part = [
  '..cccccccC..',
  '.cCc...ccC..',
  'cCc.....ccC.',
  'Cc.......ccC',
  'KK.......KKK',
];
const LEGS_PASS_A: Part = [
  '..cccccccC..',
  '..ccCcccccC.',
  '..ccC....cC.',
  '..ccC....KKK',
  '..KKKK......',
];
const LEGS_PASS_B: Part = [
  '..cccccccC..',
  '.ccccC.ccC..',
  '.cC....ccC..',
  '.KK....ccC..',
  '......KKKK..',
];
const LEGS_JUMP: Part = [
  '..cccccccC..',
  '..ccCC.ccCC.',
  '..ccC...KKK.',
  '..KKK.......',
  '............',
];
const LEGS_FALL: Part = [
  '..cccccccC..',
  '.ccC...ccC..',
  '.ccC....ccC.',
  '.cC......cC.',
  '.KK......KKK',
];
const LEGS_TUCK: Part = [
  '..cccccccC..',
  '..ccC..ccC..',
  '..cC....cC..',
  '..KK....KK..',
  '............',
];

const W = 20;
const H = 24;
/** Build a frame; `bob` shifts the upper body down by that many pixels. */
const frame = (head: Part, torso: Part, legs: Part, bob = 0) =>
  compose(W, H, [
    [legs, 4, 18],
    [torso, 4, 11 + bob],
    [head, 5, 1 + bob],
    [COWLICK, 11, 0 + bob],
  ]);

export const ASSOCIATE: SpriteDef = {
  key: 'associate',
  w: W,
  h: H,
  palette: pal(),
  frames: [
    frame(HEAD, TORSO_IDLE, LEGS_STAND),
    frame(HEAD, TORSO_IDLE, LEGS_STAND, 1),
    frame(HEAD, TORSO_RUN, LEGS_STRIDE, 1),
    frame(HEAD, TORSO_IDLE, LEGS_PASS_A),
    frame(HEAD, TORSO_RUN, LEGS_STRIDE, 1),
    frame(HEAD, TORSO_IDLE, LEGS_PASS_B),
    frame(HEAD, TORSO_RUN, LEGS_JUMP),
    frame(HEAD, TORSO_IDLE, LEGS_FALL),
    frame(HEAD, TORSO_RAISE, LEGS_STAND),
    frame(HEAD, TORSO_SWING, LEGS_STRIDE, 1),
    frame(HEAD, TORSO_POGO, LEGS_TUCK),
    frame(HEAD_HURT, TORSO_HURT, LEGS_FALL),
  ],
};

/* Weapon overlay: 48×36 canvas. The player's 20×24 frame sits at (14, 6). */

const LAPTOP_OPEN: Part = [
  '....LLLLLLLLLLLL..',
  '....LllllllllllL..',
  '...Llbbbbbbbbbl...',
  '...Lbiibbbbbbbl...',
  '...Lbibbbbbbbbl...',
  '..Llbbbbbbbbbl....',
  '..Lbbbbbbbbgbl....',
  '..Llllllllllll....',
  '..KfKKKKKKKKfK....',
  '.lllllllllllllll..',
  '.lEkEkEkEkEkEkEl..',
  'lkEkEkEkEkEkEkEl..',
  'llllllfffffflllll.',
  'LLLLLLLLLLLLLLLLL.',
];
const LAPTOP_POGO: Part = [
  'ss..ss',
  'llllEL',
  'liilEL',
  'lillEL',
  'llllEL',
  'llglEL',
  'llllEL',
  'llllEL',
  'llllEL',
  'llllEL',
  'llllEL',
  'KfKKfK',
  '.KKKK.',
];
const ARC: Part = [
  '..ii..............',
  '...iiz............',
  '....iiizz.........',
  '.....iiizz........',
  '......iiizz.......',
  '.......iiizz......',
  '........iiiz......',
  '.........iiiz.....',
  '..........iiz.....',
  '..........iiiz....',
  '...........iiz....',
  '...........iiz....',
  '...........iiz....',
  '...........iiz....',
  '..........iiiz....',
  '..........iiz.....',
  '.........iiiz.....',
  '........iiiz......',
  '.......iiizz......',
  '......iiizz.......',
  '.....iiizz........',
  '....iiizz.........',
  '...iiz............',
  '..ii..............',
];

export const ASSOCIATE_WEAPON: SpriteDef = {
  key: 'associate-fx',
  w: 48,
  h: 36,
  palette: pal(),
  frames: [
    compose(48, 36, [
      [flipH(LAPTOP_OPEN), 2, 0],
      [['ss'], 17, 11],
      [['ss'], 13, 12],
    ]),
    compose(48, 36, [
      [ARC, 22, 5],
      [LAPTOP_OPEN, 26, 12],
      [['ss'], 25, 22],
    ]),
    compose(48, 36, [[LAPTOP_POGO, 21, 20]]),
  ],
};

/* ===================================================================== *
 * The Red Stapler (src/art/sprites/enemies.ts): chomps along desks. 22×14, facing right.
 * ===================================================================== */

export const STAPLER: SpriteDef = {
  key: 'stapler',
  w: 22,
  h: 14,
  palette: pal(),
  frames: [
    [
      '......................',
      '..............rrrr....',
      '...........rrrrrwwk...',
      '........rrrrrrrrwkkr..',
      '.....rrrrrrrrrrrrrrr..',
      '...rrrrrrrrrRRRRRff...',
      '..eRrrrrRRRR.....f....',
      '..eeRRRR.........z....',
      '..EEEEEEEEEEEEEEEfff..',
      '..EeeeeeeeeeeeeeeeeE..',
      '...EEEEEEEEEEEEEEEE...',
      '....KK...KK...KK..KK..',
      '....K.....K...K....K..',
      '......................',
    ],
    [
      '......................',
      '......................',
      '...........rrrrrrrr...',
      '.......rrrrrrrrrrwwk..',
      '....rrrrrrrrrrrrrwkkr.',
      '...rrrrrrrrrrrrrRRRf..',
      '..eRrrrrRRRRRRRR..f...',
      '..eeRRRR..........z...',
      '..EEEEEEEEEEEEEEEfff..',
      '..EeeeeeeeeeeeeeeeeE..',
      '...EEEEEEEEEEEEEEEE...',
      '.....KK...KK..KK..KK..',
      '......K....K...K...K..',
      '......................',
    ],
  ],
};

/* ===================================================================== *
 * Items (src/art/sprites/items.ts)
 * ===================================================================== */

/* Billable Hours: clock coins. '1' rim, '2' rim shade. */
const CLOCK_A: Part = [
  '..........',
  '...1111...',
  '..1wwww2..',
  '.1wwkwww2.',
  '.1wwkwww2.',
  '.1wwkkkw2.',
  '.1wwwwww2.',
  '..2wwww2..',
  '...2222...',
  '..........',
];
const CLOCK_B: Part = [
  '..........',
  '...1111...',
  '..1iwww2..',
  '.1iwkwww2.',
  '.1wwkwww2.',
  '.1wwkkkw2.',
  '.1wwwwww2.',
  '..2wwww2..',
  '...2222...',
  '..........',
];
const CLOCK_C: Part = [
  '..........',
  '....11....',
  '...1ww2...',
  '...1kw2...',
  '...1kw2...',
  '...1kk2...',
  '...1ww2...',
  '...1ww2...',
  '....22....',
  '..........',
];
const clock = (key: string, rim: string, shade: string): SpriteDef => ({
  key,
  w: 10,
  h: 10,
  palette: pal({ '1': rim, '2': shade }),
  frames: [CLOCK_A, CLOCK_B, CLOCK_A, CLOCK_C],
});
export const HOURS_GREEN = clock('hours-1', '#8cc63f', '#4f8a1f');
export const HOURS_BLUE = clock('hours-5', '#5aa8ff', '#24519c');
export const HOURS_GOLD = clock('hours-20', '#f5c542', '#c98f1e');

/** Hit spark. */
export const SPARK: SpriteDef = {
  key: 'spark',
  w: 11,
  h: 11,
  outline: null,
  palette: pal(),
  frames: [
    [
      '...........',
      '...........',
      '...........',
      '.....i.....',
      '....iyi....',
      '...iyiyi...',
      '....iyi....',
      '.....i.....',
      '...........',
      '...........',
      '...........',
    ],
    [
      '.....i.....',
      '.....i.....',
      '..i..y..i..',
      '...i.i.i...',
      '....iyi....',
      'iiyiiiiiyii',
      '....iyi....',
      '...i.i.i...',
      '..i..y..i..',
      '.....i.....',
      '.....i.....',
    ],
  ],
};

/** 2×2 white pixel for particles. */
export const PIX: SpriteDef = {
  key: 'pix',
  w: 2,
  h: 2,
  outline: null,
  palette: pal(),
  frames: [['ii', 'ii']],
};

const MAIL: Part = [
  '..............',
  '.wwwwwwwwwwrr.',
  '.wWwwwwwwwWrir',
  '.wwWwwwwwWwrr.',
  '.wwwWwwwWwwww.',
  '.wwwwWwWwwwww.',
  '.wwwwwWwwwwww.',
  '.wwwwwwwwwwww.',
  '.zzzzzzzzzzzz.',
  '..............',
];
/** Leaked email collectable: an envelope with an unread badge. Frame 1 blinks the badge. */
export const EMAIL: SpriteDef = {
  key: 'email',
  w: 14,
  h: 10,
  palette: pal(),
  frames: [MAIL, recolor(MAIL, { r: 'w', i: 'w' })],
};

/* ===================================================================== *
 * Terrain tiles (src/art/sprites/tiles.ts), Floor 12 palette. Only the tiles this room uses.
 * ===================================================================== */

export const TILE = {
  floorTop: 0,
  floorFill: 1,
  wallLeft: 2,
  wallRight: 3,
  slab: 4,
  ceiling: 5,
  ceilingLight: 6,
  fillDuct: 7,
  fillPipes: 8,
  desk: 9,
  deskMid: 10,
  deskRight: 11,
  deskSingle: 12,
} as const;

export const SOLID_TILES: number[] = [
  TILE.floorTop,
  TILE.floorFill,
  TILE.wallLeft,
  TILE.wallRight,
  TILE.slab,
  TILE.ceiling,
  TILE.ceilingLight,
  TILE.fillDuct,
  TILE.fillPipes,
];
export const DESK_TILES: number[] = [TILE.desk, TILE.deskMid, TILE.deskRight, TILE.deskSingle];

const SURFACE: Part = [
  'aaaaaaaaaaaaaaaa',
  'aAaaaaaAaaaaaaAa',
  'aaaaAaaaaaaAaaaa',
  'kkkkkkkkkkkkkkkk',
];
const CONCRETE: Part = [
  'cccccccccccccccc',
  'cqcccccccqcccccc',
  'cccccqcccccccqcc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
];
const PLENUM: Part = [
  'vvvvvvvvvvvvvvvv',
  'vVvvvvvvvvVvvvvv',
  'vvvvvvVvvvvvvvvv',
  'vvvvvvvvvvvvvVvv',
  'vvvVvvvvvvvvvvvv',
  'vvvvvvvvVvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'vVvvvvvvvvvVvvvv',
];
const CEIL: Part = [
  'CCCCCCCCCCCCCCCC',
  'pppppppPpppppppP',
  'pppppppPpppppppP',
  'pppppppPpppppppP',
  'pppppppPpppppppP',
  'PPPPPPPPPPPPPPPP',
];
const CEIL_LIGHT: Part = [
  'CCCCCCCCCCCCCCCC',
  'pppppppPpppppppP',
  'ppllllllllllllpP',
  'ppllllllllllllpP',
  'pppppppPpppppppP',
  'PPPPPPPPPPPPPPPP',
];
const DUCT: Part = [
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'UUUUUUUUUUUUUUUU',
  'uuuuuuuUuuuuuuuU',
  'uuuuuuuUuuuuuuuU',
  'uuuuuuuUuuuuuuuU',
  'uuuuuuuUuuuuuuuU',
  'UUUUUUUUUUUUUUUU',
];
const PIPES: Part = [
  'vvvvvvvvvvvvvvvv',
  'qqqqqqqqqqqqqqqq',
  'CCCCCCCCCCCCCCCC',
  'vvvvvvvvvvvvvvvv',
  'vvkvvvvvvvkkvvvv',
  'vkvkvvvvvkvvkvvv',
  'kvvvkkvvkvvvvkkk',
  'vvvvvvkkvvvvvvvv',
];
const pillar = (edge: 'left' | 'right'): Part =>
  Array.from({ length: 16 }, (_, y) => {
    const joint = y % 8 === 7;
    const body = joint ? 'CCCCCCCCCCCCCCCC' : y % 8 === 3 ? 'ccqccccccccqcccc' : 'cccccccccccccccc';
    return edge === 'left' ? 'kq' + body.slice(2) : body.slice(0, 14) + 'Ck';
  });
const desk = (left: boolean, right: boolean): Part => {
  const leg = (y: number) => {
    const row = [...'................'];
    if (left) row[1] = 'j';
    if (right) row[14] = 'j';
    if (y === 15) {
      if (left) row[0] = row[2] = 'j';
      if (right) row[13] = row[15] = 'j';
    }
    return row.join('');
  };
  return [
    'hhhhhhhhhhhhhhhh',
    'hhhhhhhhhhhhhhhh',
    'HHHHHHHHHHHHHHHH',
    'jjjjjjjjjjjjjjjj',
    `${left ? 'j' : 'H'}HHHHHHHHHHHHHH${right ? 'j' : 'H'}`,
    `${left ? 'j' : 'H'}HHHHHHHHHHHHHH${right ? 'j' : 'H'}`,
    `${left ? 'j' : 'H'}HHHHHHHHHHHHHH${right ? 'j' : 'H'}`,
    'jjjjjjjjjjjjjjjj',
    ...Array.from({ length: 8 }, (_, i) => leg(i + 8)),
  ];
};

/** Floor 12 (the game's default theme) colours for the tile drawing characters. */
const FLOOR12 = {
  a: '#4fb393',
  A: '#2f7d6a',
  k: '#1d1a24',
  c: '#454b5e',
  C: '#2c3040',
  q: '#5a6175',
  v: '#1f2230',
  V: '#171923',
  u: '#3a4052',
  U: '#2a2e3c',
  p: '#a7b0ba',
  P: '#6b7380',
  l: '#e8f4ff',
  h: '#f2f4f7',
  H: '#b4bfcc',
  j: '#4b5260',
};

export const TILES: SpriteDef = {
  key: 'tiles',
  w: 16,
  h: 16,
  outline: null,
  palette: pal(FLOOR12),
  frames: [
    [...SURFACE, ...CONCRETE, ...PLENUM.slice(0, 7)],
    [...PLENUM, ...PLENUM],
    pillar('left'),
    pillar('right'),
    [...SURFACE, ...CONCRETE, 'vvvvvvvvvvvvvvvv', ...CEIL],
    [...PLENUM, 'vvvvvvvvvvvvvvvv', 'vvvvvvvvvvvvvvvv', ...CEIL],
    [...PLENUM, 'vvvvvvvvvvvvvvvv', 'vvvvvvvvvvvvvvvv', ...CEIL_LIGHT],
    [...PLENUM, ...DUCT],
    [...PLENUM.slice(0, 4), ...PIPES, ...PLENUM.slice(0, 4)],
    desk(true, false),
    desk(false, false),
    desk(false, true),
    desk(true, true),
  ],
};

/* ===================================================================== *
 * Dialogue portrait (src/art/sprites/cast.ts): 18×18, shown at 2×. Only the email.
 * ===================================================================== */

export const PORTRAITS: SpriteDef = {
  key: 'portraits',
  w: 18,
  h: 18,
  outline: null,
  palette: pal({ '1': '#2a2740' }),
  frames: [
    compose(18, 18, [
      [paint(18, 18, (p) => p.rect(0, 0, 18, 18, '1')), 0, 0],
      [
        paint(14, 10, (p) => {
          p.rect(0, 0, 14, 10, 'w');
          for (let i = 0; i < 7; i++) {
            p.set(i, i, 'W');
            p.set(13 - i, i, 'W');
          }
          p.rect(5, 6, 4, 2, 'r');
        }),
        2,
        4,
      ],
    ]),
  ],
};

/** Every sprite compiled at boot. */
export const ALL_SPRITES: SpriteDef[] = [
  ASSOCIATE,
  ASSOCIATE_WEAPON,
  STAPLER,
  HOURS_GREEN,
  HOURS_BLUE,
  HOURS_GOLD,
  SPARK,
  PIX,
  EMAIL,
  TILES,
  PORTRAITS,
];
