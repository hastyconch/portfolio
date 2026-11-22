// Adapted from the Billable. game source (src/levels/sandbox.ts): the first screen of the test
// floor, walled in on the right, with a Leaked Email on the top desk. One screen = one camera width.
import type { StageDef } from './format';

const ROOM = [
  '#.......................#',
  '#.......................#',
  '#.......................#',
  '#.......................#',
  '#.......................#',
  '#..................5....#',
  '#.................1.1.@.#',
  '#................=======#',
  '#.......................#',
  '#..........1.1..........#',
  '#.........=====.........#',
  '#..P...1.1.........s....#',
  '#########################',
  '#########################',
];

export const MINI_ROOM: StageDef = {
  id: 'mini',
  name: 'Floor 12, open plan',
  rooms: [{ id: 'open-plan', at: [0, 0], rows: ROOM }],
  emails: [
    'From: The Partner. Subject: Utilization. "Your chargeability is 0%. A red stapler is loose on Floor 12. Deal with it. Bill it."',
  ],
};
