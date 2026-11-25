// Sizzle & Serve — every pixel the game draws: the kitchen floor, the
// order board, the stations, the chef, and the title and end screens.
// All food is drawn with vector shapes so the game needs no image files.

import { INGREDIENTS, LAYOUT, PANTRY, VIEW, pantryBinRect, recipeById } from './config.js';
import { nearestStation } from './kitchen.js';

const ctxCache = new WeakMap();

export function getCtx(canvas) {
  let ctx = ctxCache.get(canvas);
  if (!ctx) {
    ctx = canvas.getContext('2d');
    ctxCache.set(canvas, ctx);
  }
  return ctx;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtTime(s) {
  const m = Math.floor(Math.max(0, s) / 60);
  const ss = Math.floor(Math.max(0, s) % 60);
  return m + ':' + String(ss).padStart(2, '0');
}

// One vector icon per ingredient, drawn at (x, y) with radius r.
export function drawIngredientIcon(ctx, id, x, y, r) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = ing.dark;
  ctx.lineWidth = 2;
  switch (id) {
    case 'bun':
      ctx.beginPath(); ctx.arc(0, 2, r, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillRect(-r, 2, r * 2, r * 0.35);
      ctx.fillStyle = '#fff'; ctx.fillRect(-r * 0.5, -r * 0.55, 3, 3); ctx.fillRect(0, -r * 0.7, 3, 3); ctx.fillRect(r * 0.45, -r * 0.5, 3, 3);
      break;
    case 'pattyRaw':
    case 'patty':
      rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = ing.dark;
      ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
      if (id === 'pattyRaw') { ctx.fillStyle = '#ffb3b3'; ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.2, r * 0.18, 0, 7); ctx.fill(); }
      break;
    case 'burnt':
      ctx.fillStyle = '#2b2b2b'; rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4); ctx.fill();
      break;
    case 'lettuce':
    case 'lettuceChopped':
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * 0.8;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = ing.dark;
      ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.quadraticCurveTo(0, -r * 0.4, r * 0.6, 0); ctx.stroke();
      break;
    case 'tomato':
    case 'tomatoChopped':
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3f9e3f';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(-r * 0.45, -r * 0.95); ctx.lineTo(0, -r * 0.7); ctx.lineTo(r * 0.45, -r * 0.95); ctx.closePath(); ctx.fill();
      break;
    case 'cucumber':
    case 'cucumberChopped':
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d7f5dd';
      ctx.beginPath(); ctx.ellipse(-r * 0.35, 0, r * 0.22, r * 0.3, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.35, 0, r * 0.22, r * 0.3, 0, 0, 7); ctx.fill();
      break;
    case 'cheese':
      ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(0, -r * 0.9); ctx.lineTo(r, r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.dark;
      ctx.beginPath(); ctx.arc(-r * 0.25, r * 0.1, r * 0.14, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.3, r * 0.25, r * 0.12, 0, 7); ctx.fill();
      break;
    case 'dough':
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.7, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.15, r * 0.3, r * 0.18, -0.4, 0, 7); ctx.fill();
      break;
    case 'pasta':
    case 'pastaBoiled':
      ctx.strokeStyle = ing.dark; ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r + i * 4, -r * 0.5);
        ctx.quadraticCurveTo(0, r * 0.7 + i * 6, r - i * 4, -r * 0.5);
        ctx.stroke();
      }
      break;
    case 'sauce':
      rr(ctx, -r * 0.55, -r * 0.7, r * 1.1, r * 1.5, r * 0.25); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; rr(ctx, -r * 0.4, -r * 0.35, r * 0.8, r * 0.4, 2); ctx.fill();
      break;
    case 'shell':
      ctx.beginPath(); ctx.arc(0, r * 0.4, r, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = ing.dark;
      ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.1); ctx.lineTo(r * 0.6, r * 0.1); ctx.stroke();
      break;
    default:
      ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, 7); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawStation(ctx, r, title, accent) {
  ctx.fillStyle = '#3a2c22';
  rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 12);
  ctx.fill();
  ctx.fillStyle = '#5d4632';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = accent;
  rr(ctx, r.x, r.y, r.w, 26, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, r.x + 10, r.y + 14);
}

function progressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = '#241a12';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    rr(ctx, x + 2, y + 2, Math.max(6, (w - 4) * Math.min(1, frac)), h - 4, (h - 4) / 2);
    ctx.fill();
  }
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = recipeById(order.recipeId);
  const urgent = order.timeLeft < 15;
  ctx.fillStyle = urgent ? '#5a2320' : '#fff8ec';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#ff6b5e' : '#d9c39a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = urgent ? '#ffd7d2' : '#3a2c22';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('#' + order.id + '  ' + recipe.name, x + 12, y + 26);
  ctx.fillStyle = '#8a6d4b';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(recipe.price + ' coins', x + 12, y + 46);
  // Ingredient dots for the recipe.
  recipe.ingredients.forEach((ing, i) => {
    drawIngredientIcon(ctx, ing, x + 26 + i * 44, y + 68, 15);
  });
  progressBar(ctx, x + 12, y + h - 16, w - 24, 8, order.timeLeft / 75, urgent ? '#ff6b5e' : '#7ed957');
  ctx.fillStyle = urgent ? '#ff8a7a' : '#5d4632';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(order.timeLeft) + 's', x + w - 12, y + 46);
  ctx.textAlign = 'left';
}

function drawChef(ctx, state) {
  const c = state.chef;
  ctx.save();
  ctx.translate(c.x, c.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 20, 22, 7, 0, 0, 7); ctx.fill();
  // Body and apron.
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.arc(0, 4, 19, 0, 7); ctx.fill();
  ctx.fillStyle = '#4a90d9';
  rr(ctx, -14, 2, 28, 20, 8); ctx.fill();
  // Face.
  ctx.fillStyle = '#ffd9b3';
  ctx.beginPath(); ctx.arc(0, -14, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-5 * c.face, -16, 1.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * c.face, -16, 1.8, 0, 7); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#fff';
  rr(ctx, -13, -36, 26, 13, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(-8, -32, 7, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -35, 8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -32, 7, 0, 7); ctx.fill();
  // Carried item above the hat.
  if (c.carrying) {
    const label = c.carrying.endsWith('Dish')
      ? recipeById(c.carrying.slice(0, -4))?.name ?? c.carrying
      : INGREDIENTS[c.carrying]?.name ?? c.carrying;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    rr(ctx, -52, -72, 104, 24, 12); ctx.fill();
    ctx.fillStyle = '#3a2c22';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -55);
    ctx.textAlign = 'left';
    if (c.carrying.endsWith('Dish')) {
      ctx.fillStyle = '#fdfdf6';
      ctx.beginPath(); ctx.ellipse(0, -44, 12, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath(); ctx.arc(0, -46, 5, 0, 7); ctx.fill();
    } else {
      drawIngredientIcon(ctx, c.carrying, 0, -44, 11);
    }
  }
  ctx.restore();
}

function drawPlate(ctx, state) {
  const r = LAYOUT.plate;
  drawStation(ctx, r, 'ASSEMBLY PLATE', '#c96a2e');
  // The plate itself.
  ctx.fillStyle = '#fdfdf6';
  ctx.beginPath(); ctx.ellipse(r.x + 120, r.y + 92, 96, 44, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (state.plateDish) {
    const recipe = recipeById(state.plateDish);
    ctx.fillStyle = '#3a2c22';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(recipe.name + (state.plateBaking > 0 ? ' — needs the oven!' : ' — ready to pick up!'), r.x + 120, r.y + 52);
    ctx.textAlign = 'left';
    recipe.ingredients.forEach((ing, i) => {
      drawIngredientIcon(ctx, ing, r.x + 52 + i * 44, r.y + 92, 16);
    });
  } else if (state.plate.length) {
    state.plate.forEach((ing, i) => {
      drawIngredientIcon(ctx, ing, r.x + 52 + i * 44, r.y + 92, 16);
    });
    ctx.fillStyle = '#8a6d4b';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.plate.length + ' ingredient' + (state.plate.length > 1 ? 's' : '') + ' on the plate', r.x + 120, r.y + 52);
    ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = '#a08a6a';
    ctx.font = 'italic 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Build a dish here', r.x + 120, r.y + 92);
    ctx.textAlign = 'left';
  }
}

function drawWindow(ctx, state) {
  const r = LAYOUT.window;
  const ready = !!state.windowDish || (state.chef.carrying && state.chef.carrying.endsWith('Dish'));
  drawStation(ctx, r, 'SERVING WINDOW', ready ? '#2f9e44' : '#7a5c3e');
  ctx.fillStyle = '#e9dcc3';
  rr(ctx, r.x + 12, r.y + 40, r.w - 24, 58, 8);
  ctx.fill();
  if (state.windowDish) {
    const recipe = recipeById(state.windowDish);
    ctx.fillStyle = '#2f9e44';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(recipe.name + ' — SERVE IT!', r.x + r.w / 2, r.y + 118);
    ctx.textAlign = 'left';
    recipe.ingredients.forEach((ing, i) => {
      drawIngredientIcon(ctx, ing, r.x + 52 + i * 40, r.y + 68, 14);
    });
  } else if (ready) {
    ctx.fillStyle = '#2f9e44';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Serve the dish!', r.x + r.w / 2, r.y + 118);
    ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = '#8a6d4b';
    ctx.font = 'italic 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Finished dishes go here', r.x + r.w / 2, r.y + 118);
    ctx.textAlign = 'left';
  }
}

export function render(state, canvas) {
  const ctx = getCtx(canvas);
  const W = VIEW.w;
  const H = VIEW.h;
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake * 24, (Math.random() - 0.5) * state.shake * 24);
  }

  // Floor: warm checker tiles.
  for (let y = 0; y < H / 64; y++) {
    for (let x = 0; x < W / 64; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#f2e3c6' : '#e9d6b0';
      ctx.fillRect(x * 64, y * 64, 64, 64);
    }
  }
  // Wall band behind the order board.
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 60, W, 8);

  // Top bar.
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, W, 60);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SIZZLE & SERVE', 24, 40);
  // Shift timer.
  const shiftFrac = state.shiftLeft / 180;
  progressBar(ctx, 300, 20, 260, 20, shiftFrac, shiftFrac < 0.25 ? '#ff6b5e' : '#ffd23e');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(fmtTime(state.shiftLeft), 570, 37);
  // Score, coins, target, hearts.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Score ' + state.score, 660, 37);
  ctx.fillStyle = '#ffd23e';
  ctx.fillText('Coins ' + state.coins + ' / ' + state.target, 800, 37);
  ctx.fillStyle = '#ff8a7a';
  ctx.fillText('♥'.repeat(Math.max(0, state.hearts)) + '♡'.repeat(Math.max(0, 3 - state.hearts)), 990, 37);
  ctx.fillStyle = '#9be36b';
  if (state.combo > 1) ctx.fillText('Combo x' + state.combo, 1120, 37);
  ctx.fillStyle = '#bbb';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(state.muted ? 'M: sound off' : 'M: sound on', 1180, 55);

  // Order board.
  const b = LAYOUT.board;
  ctx.fillStyle = '#4a3421';
  rr(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('ORDER BOARD', b.x + 8, b.y - 12);
  if (!state.orders.length) {
    ctx.fillStyle = '#c9b896';
    ctx.font = 'italic 15px system-ui, sans-serif';
    ctx.fillText('No orders yet — customers are on their way…', b.x + 16, b.y + 56);
  }
  state.orders.forEach((o, i) => {
    drawOrderTicket(ctx, o, b.x + 12 + i * 304, b.y + 8, 288, 88);
  });

  // Trash bin.
  drawStation(ctx, LAYOUT.trash, 'TRASH', '#666');
  ctx.fillStyle = '#999';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Drop it here', LAYOUT.trash.x + 12, LAYOUT.trash.y + 62);

  drawPlate(ctx, state);
  drawWindow(ctx, state);

  // Pantry bins.
  drawStation(ctx, LAYOUT.pantry, 'PANTRY — grab an ingredient', '#3f7d3a');
  PANTRY.forEach((id, i) => {
    const r = pantryBinRect(i);
    ctx.fillStyle = '#fff8ec';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#d9c39a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawIngredientIcon(ctx, id, r.x + r.w / 2, r.y + 22, 13);
    ctx.fillStyle = '#3a2c22';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(INGREDIENTS[id].name, r.x + r.w / 2, r.y + 46);
    ctx.textAlign = 'left';
  });

  // Grill.
  drawStation(ctx, LAYOUT.grill, 'GRILL', '#c0392b');
  const g = state.grill;
  if (g.item) {
    drawIngredientIcon(ctx, g.item, LAYOUT.grill.x + 90, LAYOUT.grill.y + 78, 24);
    if (g.item === 'pattyRaw') progressBar(ctx, LAYOUT.grill.x + 20, LAYOUT.grill.y + 122, 140, 12, g.progress, '#ff8a3c');
    if (g.item === 'patty') {
      ctx.fillStyle = '#ff8a7a';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cooked! Grab it before it burns', LAYOUT.grill.x + 90, LAYOUT.grill.y + 132);
      ctx.textAlign = 'left';
    }
    if (g.item === 'burnt') {
      ctx.fillStyle = '#ff6b5e';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Burnt — take it to the trash', LAYOUT.grill.x + 90, LAYOUT.grill.y + 132);
      ctx.textAlign = 'left';
    }
  } else {
    ctx.fillStyle = '#a08a6a';
    ctx.font = 'italic 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Raw patties cook here', LAYOUT.grill.x + 90, LAYOUT.grill.y + 90);
    ctx.textAlign = 'left';
  }

  // Chopping board.
  drawStation(ctx, LAYOUT.board2, 'CHOPPING BOARD', '#8a6d4b');
  const bd = state.board;
  if (bd.item) {
    drawIngredientIcon(ctx, bd.item, LAYOUT.board2.x + 90, LAYOUT.board2.y + 78, 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Chop! ' + bd.hits + ' / ' + INGREDIENTS[bd.item].prep.hits, LAYOUT.board2.x + 90, LAYOUT.board2.y + 132);
    ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = '#a08a6a';
    ctx.font = 'italic 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Lettuce, tomato, cucumber', LAYOUT.board2.x + 90, LAYOUT.board2.y + 90);
    ctx.textAlign = 'left';
  }

  // Pot.
  drawStation(ctx, LAYOUT.pot, 'POT — BOIL', '#2e6da4');
  const p = state.pot;
  if (p.item) {
    drawIngredientIcon(ctx, p.item, LAYOUT.pot.x + 80, LAYOUT.pot.y + 78, 24);
    if (p.item === 'pasta') progressBar(ctx, LAYOUT.pot.x + 20, LAYOUT.pot.y + 122, 120, 12, p.progress, '#7ec8f7');
    if (p.item === 'pastaBoiled') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ready!', LAYOUT.pot.x + 80, LAYOUT.pot.y + 132);
      ctx.textAlign = 'left';
    }
  } else {
    ctx.fillStyle = '#a08a6a';
    ctx.font = 'italic 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pasta boils here', LAYOUT.pot.x + 80, LAYOUT.pot.y + 90);
    ctx.textAlign = 'left';
  }

  // Oven.
  drawStation(ctx, LAYOUT.oven, 'OVEN — BAKE', '#7a4a9e');
  const ov = state.oven;
  if (ov.item) {
    if (ov.item === 'pizza') {
      ctx.fillStyle = '#f7ead0';
      ctx.beginPath(); ctx.ellipse(LAYOUT.oven.x + 106, LAYOUT.oven.y + 84, 52, 30, 0, 0, 7); ctx.fill();
      progressBar(ctx, LAYOUT.oven.x + 26, LAYOUT.oven.y + 128, 160, 12, ov.progress, '#e8a33d');
    } else {
      drawIngredientIcon(ctx, 'dough', LAYOUT.oven.x + 106, LAYOUT.oven.y + 84, 26);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pizza baked — grab it!', LAYOUT.oven.x + 106, LAYOUT.oven.y + 132);
      ctx.textAlign = 'left';
    }
  } else {
    ctx.fillStyle = '#a08a6a';
    ctx.font = 'italic 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pizzas bake here', LAYOUT.oven.x + 106, LAYOUT.oven.y + 90);
    ctx.textAlign = 'left';
  }

  // Highlight the station the chef can use right now.
  const near = state.phase === 'playing' ? nearestStation(state) : null;
  if (near) {
    const rects = { plate: LAYOUT.plate, window: LAYOUT.window, trash: LAYOUT.trash, pantry: LAYOUT.pantry, grill: LAYOUT.grill, board: LAYOUT.board2, pot: LAYOUT.pot, oven: LAYOUT.oven };
    const r = rects[near];
    if (r) {
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      rr(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Press E or click to use', r.x + r.w / 2, r.y + r.h + 16);
      ctx.textAlign = 'left';
    }
  }

  drawChef(ctx, state);

  // Particles and floating score texts.
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.fillStyle = f.color;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1;

  // Help line.
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  rr(ctx, 24, 584, 460, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Move: WASD / arrows / click  •  Use station: E / Space / click  •  R: restart', 34, 602);

  // Self-test banner.
  if (state.selfTest) {
    ctx.fillStyle = state.selfTest === 'PASS' ? 'rgba(47,158,68,0.92)' : 'rgba(200,40,30,0.92)';
    rr(ctx, 340, 330, 600, 90, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SELF-TEST ' + state.selfTest, 640, 385);
    ctx.textAlign = 'left';
  }

  // Title and end screens.
  if (state.phase === 'title') {
    ctx.fillStyle = 'rgba(30,20,12,0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SIZZLE & SERVE', 640, 250);
    ctx.fillStyle = '#fff';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText('A rush-hour cooking game', 640, 300);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Take orders, chop and grill, build the dish, serve it before the timer runs out.', 640, 350);
    ctx.fillText('Earn ' + state.target + ' coins in 3 minutes to win. Three expired orders and the shift is over.', 640, 380);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('Click or press Enter to start', 640, 450);
    ctx.fillStyle = '#ccc';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Move with WASD / arrows / mouse click — use a station with E, Space or a click.', 640, 490);
    ctx.textAlign = 'left';
  } else if (state.phase === 'won' || state.phase === 'lost') {
    ctx.fillStyle = 'rgba(30,20,12,0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = state.phase === 'won' ? '#7ed957' : '#ff6b5e';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.phase === 'won' ? 'SHIFT COMPLETE!' : 'SHIFT OVER', 640, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('Score ' + state.score + '   •   Coins ' + state.coins + ' / ' + state.target + '   •   Dishes served ' + state.served, 640, 360);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Press R to play again', 640, 420);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}
