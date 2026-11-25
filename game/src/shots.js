// Sizzle & Serve — deterministic demo states for screenshots, plus a
// scripted self-test that plays the real game end to end.
// ?shot=cover|assembly|serve|rush sets the kitchen to a fixed state so a
// screenshot shows exactly one moment of play. ?test=1 plays a whole burger
// order through the real interact() calls and reports PASS or FAIL.

import { LAYOUT, PANTRY, pantryBinRect } from './config.js';
import { interact, tick } from './kitchen.js';
import { spawnOrder, startShift } from './state.js';

function setOrder(state, recipeId, timeLeft) {
  const order = spawnOrder(state, recipeId);
  if (order) order.timeLeft = timeLeft;
  return order;
}

function putChef(state, x, y) {
  state.chef.x = x;
  state.chef.y = y;
  state.chef.tx = x;
  state.chef.ty = y;
}

function step(state, seconds) {
  for (let t = 0; t < seconds; t += 0.1) tick(state, 0.1);
}

// One fixed kitchen per screenshot name. Every field is a real game field,
// so each shot is a render of the game itself, not a mockup.
export function applyShot(state, name) {
  startShift(state);
  state.orders = [];
  state.plate = [];
  state.plateDish = null;
  state.plateBaking = 0;
  state.windowDish = null;
  state.grill = { item: null, progress: 0, burn: 0 };
  state.board = { item: null, hits: 0 };
  state.pot = { item: null, progress: 0 };
  state.oven = { item: null, progress: 0 };
  state.floaters = [];
  state.particles = [];
  state.combo = 0;

  if (name === 'cover') {
    state.shiftLeft = 151;
    state.score = 145;
    state.coins = 85;
    setOrder(state, 'burger', 42);
    setOrder(state, 'pizza', 58);
    setOrder(state, 'salad', 30);
    state.plate = ['bun', 'patty'];
    state.grill = { item: 'pattyRaw', progress: 0.6, burn: 0 };
    state.pot = { item: 'pasta', progress: 0.4 };
    putChef(state, 430, 400);
    state.chef.carrying = 'tomatoChopped';
  } else if (name === 'assembly') {
    state.shiftLeft = 118;
    state.score = 96;
    state.coins = 55;
    setOrder(state, 'burger', 50);
    setOrder(state, 'taco', 44);
    state.plate = ['bun', 'patty', 'lettuceChopped'];
    putChef(state, 430, 400);
    state.chef.carrying = 'tomatoChopped';
  } else if (name === 'serve') {
    state.shiftLeft = 72;
    state.score = 210;
    state.coins = 130;
    setOrder(state, 'pizza', 40);
    setOrder(state, 'taco', 55);
    state.windowDish = 'burger';
    putChef(state, 980, 300);
    state.chef.carrying = null;
  } else if (name === 'rush') {
    state.shiftLeft = 47;
    state.score = 320;
    state.coins = 190;
    state.hearts = 2;
    setOrder(state, 'burger', 8);
    setOrder(state, 'pizza', 22);
    setOrder(state, 'pasta', 35);
    setOrder(state, 'taco', 48);
    state.grill = { item: 'pattyRaw', progress: 0.9, burn: 0 };
    state.oven = { item: 'pizza', progress: 0.5 };
    state.plate = ['lettuceChopped', 'tomatoChopped'];
    putChef(state, 820, 520);
    state.chef.carrying = 'cheese';
    state.combo = 3;
  }
}

// Play one burger order through the real stations and check the result.
// Returns 'PASS' or 'FAIL: <reason>' and writes it into document.title.
export function runSelfTest(state) {
  const fail = (why) => {
    state.selfTest = 'FAIL: ' + why;
    document.title = 'SELFTEST FAIL: ' + why;
    return state.selfTest;
  };
  try {
    startShift(state);
    state.orders = [];
    state.spawnIn = 999;
    const order = spawnOrder(state, 'burger');
    if (!order) return fail('no order spawned');
    order.timeLeft = 70;

    const stationCenter = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
    const go = (r) => { const p = stationCenter(r); putChef(state, p.x, p.y); interact(state); };

    // 1. Grab the bun from the pantry and put it on the plate.
    const bunBin = pantryBinRect(PANTRY.indexOf('bun'));
    putChef(state, bunBin.x + 34, bunBin.y + 26);
    interact(state);
    if (state.chef.carrying !== 'bun') return fail('could not grab bun');
    go(LAYOUT.plate);
    if (!state.plate.includes('bun')) return fail('bun did not land on plate');

    // 2. Grill a patty: raw patty on, wait, take the cooked one off, plate it.
    const pattyBin = pantryBinRect(PANTRY.indexOf('pattyRaw'));
    putChef(state, pattyBin.x + 34, pattyBin.y + 26);
    interact(state);
    if (state.chef.carrying !== 'pattyRaw') return fail('could not grab raw patty');
    go(LAYOUT.grill);
    if (state.grill.item !== 'pattyRaw') return fail('patty did not reach grill');
    step(state, 6);
    if (state.grill.item !== 'patty') return fail('patty did not cook');
    go(LAYOUT.grill);
    if (state.chef.carrying !== 'patty') return fail('could not take cooked patty');
    go(LAYOUT.plate);
    if (!state.plate.includes('patty')) return fail('patty did not land on plate');

    // 3. Chop lettuce and tomato, one at a time, and plate each.
    for (const [raw, done] of [['lettuce', 'lettuceChopped'], ['tomato', 'tomatoChopped']]) {
      const bin = pantryBinRect(PANTRY.indexOf(raw));
      putChef(state, bin.x + 34, bin.y + 26);
      interact(state);
      if (state.chef.carrying !== raw) return fail('could not grab ' + raw);
      go(LAYOUT.board2);
      if (state.board.item !== raw) return fail(raw + ' did not reach board');
      interact(state); interact(state); interact(state);
      if (state.chef.carrying !== done) return fail(raw + ' did not chop');
      go(LAYOUT.plate);
      if (!state.plate.includes(done)) return fail(done + ' did not land on plate');
    }

    // 4. The plate should now be a finished burger: pick it up, plate it at
    // the window, then serve it.
    if (state.plateDish !== 'burger') return fail('plate is not a burger: ' + state.plate.join(','));
    go(LAYOUT.plate);
    if (state.chef.carrying !== 'burgerDish') return fail('could not pick up burger');
    go(LAYOUT.window);
    if (state.windowDish !== 'burger') return fail('burger did not reach window');
    go(LAYOUT.window);
    if (state.orders.length !== 0) return fail('order was not served');
    if (state.score <= 0 || state.coins <= 0) return fail('no score for serving');

    state.selfTest = 'PASS';
    document.title = 'SELFTEST PASS';
    return 'PASS';
  } catch (err) {
    return fail(String(err && err.message ? err.message : err));
  }
}
