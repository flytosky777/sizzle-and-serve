// Sizzle & Serve — kitchen logic: moving the chef, working the stations,
// ticking orders and the shift clock. No drawing here; render.js does that.

import { INGREDIENTS, LAYOUT, MAX_ORDERS, ORDER_TIME, PANTRY, RECIPES, dishForPlate, pantryBinRect, recipeById } from './config.js';
import { addBurst, addFloater, loseHeart, spawnOrder } from './state.js';

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function rectsCollide(ax, ay, ar, r) {
  return ax + ar > r.x && ax - ar < r.x + r.w && ay + ar > r.y && ay - ar < r.y + r.h;
}

const SOLID = () => [
  LAYOUT.plate, LAYOUT.window, LAYOUT.trash,
  LAYOUT.pantry, LAYOUT.grill, LAYOUT.board2, LAYOUT.pot, LAYOUT.oven,
];

// Move the chef toward (tx, ty), sliding around station rectangles.
export function moveChef(state, dt) {
  const c = state.chef;
  const dx = c.tx - c.x;
  const dy = c.ty - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return;
  const step = Math.min(dist, c.speed * dt);
  const nx = c.x + (dx / dist) * step;
  const ny = c.y + (dy / dist) * step;
  if (dx !== 0) c.face = dx > 0 ? 1 : -1;
  const r = 20;
  let blocked = false;
  for (const s of SOLID()) {
    if (rectsCollide(nx, c.y, r, s)) { blocked = true; break; }
  }
  if (!blocked) c.x = nx;
  blocked = false;
  for (const s of SOLID()) {
    if (rectsCollide(c.x, ny, r, s)) { blocked = true; break; }
  }
  if (!blocked) c.y = ny;
  c.x = clamp(c.x, 30, 1250);
  c.y = clamp(c.y, 190, 600);
}

function nearRect(state, rect, pad) {
  const c = state.chef;
  const p = pad ?? 46;
  return c.x > rect.x - p && c.x < rect.x + rect.w + p && c.y > rect.y - p && c.y < rect.y + rect.h + p;
}

// Which station the chef stands closest to, or null.
export function nearestStation(state) {
  const c = state.chef;
  const stations = [
    ['plate', LAYOUT.plate], ['window', LAYOUT.window], ['trash', LAYOUT.trash],
    ['pantry', LAYOUT.pantry], ['grill', LAYOUT.grill], ['board', LAYOUT.board2],
    ['pot', LAYOUT.pot], ['oven', LAYOUT.oven],
  ];
  let best = null;
  let bestD = 1e9;
  for (const [name, r] of stations) {
    const cx = clamp(c.x, r.x, r.x + r.w);
    const cy = clamp(c.y, r.y, r.y + r.h);
    const d = Math.hypot(c.x - cx, c.y - cy);
    if (d < bestD) { bestD = d; best = name; }
  }
  return bestD < 70 ? best : null;
}

// Interact with the nearest station: grab, chop, cook, assemble, serve.
export function interact(state) {
  const station = nearestStation(state);
  if (!station) return;
  const c = state.chef;

  if (station === 'pantry') {
    if (c.carrying) return;
    // Grab the ingredient whose bin is nearest the chef.
    let best = null;
    let bestD = 1e9;
    PANTRY.forEach((id, i) => {
      const r = pantryBinRect(i);
      const d = Math.hypot(c.x - (r.x + r.w / 2), c.y - (r.y + r.h / 2));
      if (d < bestD) { bestD = d; best = id; }
    });
    if (best && bestD < 160) {
      c.carrying = best;
      addFloater(state, c.x, c.y - 40, INGREDIENTS[best].name, '#fff');
    }
    return;
  }

  if (station === 'grill') {
    if (state.grill.item === null && c.carrying === 'pattyRaw') {
      state.grill.item = 'pattyRaw';
      state.grill.progress = 0;
      state.grill.burn = 0;
      c.carrying = null;
    } else if (state.grill.item === 'patty' && !c.carrying) {
      c.carrying = 'patty';
      state.grill.item = null;
      state.grill.progress = 0;
      state.grill.burn = 0;
    } else if (state.grill.item === 'burnt' && !c.carrying) {
      state.grill.item = null;
      state.grill.progress = 0;
      state.grill.burn = 0;
      addFloater(state, c.x, c.y - 40, 'Tossed the burnt patty', '#ffb3a7');
    }
    return;
  }

  if (station === 'board') {
    if (state.board.item === null && c.carrying && INGREDIENTS[c.carrying]?.prep?.station === 'board') {
      state.board.item = c.carrying;
      state.board.hits = 0;
      c.carrying = null;
    } else if (state.board.item !== null) {
      state.board.hits += 1;
      addBurst(state, c.x, c.y - 20, '#9be36b', 6);
      const done = INGREDIENTS[state.board.item].prep.hits;
      if (state.board.hits >= done) {
        const result = INGREDIENTS[state.board.item].prep.result;
        state.board.item = null;
        state.board.hits = 0;
        c.carrying = result;
        addFloater(state, c.x, c.y - 40, INGREDIENTS[result].name + '!', '#b6f09a');
      }
    }
    return;
  }

  if (station === 'pot') {
    if (state.pot.item === null && c.carrying === 'pasta') {
      state.pot.item = 'pasta';
      state.pot.progress = 0;
      c.carrying = null;
    } else if (state.pot.item === 'pastaBoiled' && !c.carrying) {
      c.carrying = 'pastaBoiled';
      state.pot.item = null;
      state.pot.progress = 0;
    }
    return;
  }

  if (station === 'oven') {
    // The oven bakes a pizza that is already assembled on the plate.
    if (state.oven.item === null && state.plateDish === 'pizza' && state.plateBaking <= 0) {
      state.oven.item = 'pizza';
      state.oven.progress = 0;
      state.plate = [];
      state.plateDish = null;
    } else if (state.oven.item === 'pizzaDone' && !c.carrying) {
      c.carrying = 'pizzaDish';
      state.oven.item = null;
      state.oven.progress = 0;
    }
    return;
  }

  if (station === 'plate') {
    if (c.carrying) {
      // Add a carried ingredient to the dish being assembled, but only when
      // some recipe actually wants the plate plus this ingredient.
      if (state.plateDish) return; // plate already holds a finished dish
      const next = [...state.plate, c.carrying];
      const wanted = RECIPES.some((r) => next.every((ing) => r.ingredients.includes(ing)) && next.length <= r.ingredients.length);
      if (!wanted) {
        addFloater(state, LAYOUT.plate.x + 120, LAYOUT.plate.y - 10, 'Not in any recipe!', '#ff6b5e');
        return;
      }
      state.plate.push(c.carrying);
      c.carrying = null;
      const dish = dishForPlate(state.plate);
      if (dish) {
        state.plateDish = dish.id;
        if (dish.bake > 0) state.plateBaking = dish.bake;
        addFloater(state, LAYOUT.plate.x + 120, LAYOUT.plate.y - 10, dish.name + (dish.bake > 0 ? ' — to the oven!' : ' ready!'), '#ffd23e');
        addBurst(state, LAYOUT.plate.x + 120, LAYOUT.plate.y + 60, '#ffd23e', 14);
      }
    } else if (state.plateDish && state.plateBaking <= 0) {
      // Pick the finished dish up off the plate.
      c.carrying = state.plateDish + 'Dish';
      state.plate = [];
      state.plateDish = null;
    }
    return;
  }

  if (station === 'window') {
    // Serving is two steps, like a real pass: first plate the finished dish
    // on the counter, then ring it through to the customer.
    const dishId = c.carrying && c.carrying.endsWith('Dish') ? c.carrying.slice(0, -4) : null;
    if (dishId && !state.windowDish) {
      state.windowDish = dishId;
      c.carrying = null;
      addFloater(state, LAYOUT.window.x + 118, LAYOUT.window.y - 10, recipeById(dishId).name + ' plated — serve it!', '#7ed957');
      addBurst(state, LAYOUT.window.x + 118, LAYOUT.window.y + 70, '#7ed957', 12);
    } else if (state.windowDish) {
      serveDish(state, state.windowDish);
      state.windowDish = null;
    }
    return;
  }

  if (station === 'trash') {
    if (c.carrying) {
      c.carrying = null;
      addFloater(state, c.x, c.y - 40, 'Discarded', '#ccc');
    } else if (state.plate.length) {
      state.plate = [];
      state.plateDish = null;
      state.plateBaking = 0;
      addFloater(state, c.x, c.y - 40, 'Plate cleared', '#ccc');
    }
  }
}

function serveDish(state, dishId) {
  const idx = state.orders.findIndex((o) => o.recipeId === dishId);
  const wx = LAYOUT.window.x + 118;
  const wy = LAYOUT.window.y + 70;
  if (idx >= 0) {
    const order = state.orders[idx];
    const bonus = Math.round((order.timeLeft / ORDER_TIME) * 15);
    const price = recipeById(dishId).price + bonus;
    state.orders.splice(idx, 1);
    state.coins += price;
    state.score += price * 10;
    state.combo += 1;
    state.served += 1;
    addFloater(state, wx, wy - 20, '+' + price + ' coins', '#ffd23e');
    addBurst(state, wx, wy, '#ffd23e', 18);
    if (state.coins >= state.target) state.phase = 'won';
  } else {
    state.combo = 0;
    state.score = Math.max(0, state.score - 50);
    addFloater(state, wx, wy - 20, 'Nobody ordered that!', '#ff6b5e');
    state.shake = 0.3;
  }
}

// Advance timers, cooking progress, order countdowns and the shift clock.
export function tick(state, dt) {
  if (state.phase !== 'playing') return;
  state.time += dt;
  state.shiftLeft -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    state.phase = state.coins >= state.target ? 'won' : 'lost';
    return;
  }

  // New orders arrive on a timer, faster as the shift goes on.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state);
    state.spawnIn = Math.max(8, 15 - state.time / 30);
  }

  // Orders count down; an expired order costs a heart.
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const o = state.orders[i];
    o.timeLeft -= dt;
    if (o.timeLeft <= 0) {
      state.orders.splice(i, 1);
      state.expired += 1;
      loseHeart(state, 640, 120);
    }
  }

  // Grill: raw patty cooks in 5 s, then burns after 7 more seconds.
  if (state.grill.item === 'pattyRaw') {
    state.grill.progress += dt / 5;
    if (state.grill.progress >= 1) {
      state.grill.item = 'patty';
      state.grill.progress = 0;
      addFloater(state, LAYOUT.grill.x + 90, LAYOUT.grill.y - 8, 'Patty cooked!', '#ffb26b');
    }
  } else if (state.grill.item === 'patty') {
    state.grill.burn += dt;
    if (state.grill.burn >= 7) {
      state.grill.item = 'burnt';
      addFloater(state, LAYOUT.grill.x + 90, LAYOUT.grill.y - 8, 'Burnt!', '#ff6b5e');
    }
  }

  // Pot: pasta boils in 5 s.
  if (state.pot.item === 'pasta') {
    state.pot.progress += dt / 5;
    if (state.pot.progress >= 1) {
      state.pot.item = 'pastaBoiled';
      state.pot.progress = 0;
      addFloater(state, LAYOUT.pot.x + 80, LAYOUT.pot.y - 8, 'Pasta ready!', '#ffe27a');
    }
  }

  // Oven: a pizza bakes in 6 s.
  if (state.oven.item === 'pizza') {
    state.oven.progress += dt / 6;
    if (state.oven.progress >= 1) {
      state.oven.item = 'pizzaDone';
      state.oven.progress = 0;
      addFloater(state, LAYOUT.oven.x + 106, LAYOUT.oven.y - 8, 'Pizza baked!', '#ffd23e');
    }
  }

  // Floaters and particles fade.
  for (const f of state.floaters) { f.life -= dt; f.y -= 24 * dt; }
  state.floaters = state.floaters.filter((f) => f.life > 0);
  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
}
