// Sizzle & Serve — game state: orders, score, timers, the chef's hands.
// The state is one plain object; every other module reads or mutates it.

import { MAX_HEARTS, MAX_ORDERS, ORDER_TIME, RECIPES, SHIFT_SECONDS, TARGET_COINS } from './config.js';

let orderCounter = 0;

export function createState() {
  return {
    phase: 'title', // title | playing | won | lost
    time: 0, // seconds since the shift started
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    target: TARGET_COINS,
    hearts: MAX_HEARTS,
    combo: 0,
    orders: [], // { id, recipeId, timeLeft, served }
    spawnIn: 1.5, // seconds until the next order appears
    chef: { x: 640, y: 520, tx: 640, ty: 520, speed: 300, carrying: null, face: 1 },
    plate: [], // ingredient ids on the assembly plate
    plateBaking: 0, // seconds left in the oven for a pizza on the plate
    plateDish: null, // recipe id once the plate matches a recipe
    grill: { item: null, progress: 0, burn: 0 }, // one patty slot
    board: { item: null, hits: 0 }, // chopping board slot
    pot: { item: null, progress: 0 }, // one pasta slot
    oven: { item: null, progress: 0 }, // one pizza slot
    windowDish: null, // finished dish waiting on the serving counter
    floaters: [], // { x, y, text, color, life }
    particles: [], // { x, y, vx, vy, color, life, size }
    shake: 0,
    served: 0,
    expired: 0,
    muted: false,
    selfTest: null, // 'PASS' | 'FAIL: reason' when ?test=1 ran
  };
}

export function startShift(state) {
  const fresh = createState();
  Object.assign(state, fresh, { phase: 'playing' });
  spawnOrder(state);
  spawnOrder(state);
}

export function spawnOrder(state, recipeId) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const recipe = recipeId
    ? RECIPES.find((r) => r.id === recipeId)
    : RECIPES[Math.floor(Math.random() * RECIPES.length)];
  const order = { id: ++orderCounter, recipeId: recipe.id, timeLeft: ORDER_TIME, served: false };
  state.orders.push(order);
  return order;
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color: color ?? '#fff', life: 1.4 });
}

export function addBurst(state, x, y, color, count) {
  for (let i = 0; i < (count ?? 10); i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 90;
    state.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      color, life: 0.7 + Math.random() * 0.4, size: 3 + Math.random() * 4,
    });
  }
}

export function loseHeart(state, x, y) {
  state.hearts -= 1;
  state.combo = 0;
  state.shake = 0.4;
  addFloater(state, x, y, 'Order expired!', '#ff6b5e');
  if (state.hearts <= 0) state.phase = 'lost';
}
