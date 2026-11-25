// Sizzle & Serve — keyboard and mouse input: the chef walks with WASD or
// the arrow keys, or clicks a spot to walk there; E, Space or a click on a
// station uses it. The canvas is scaled to fit the window, so clicks are
// mapped back into the game's logical coordinates.

import { VIEW } from './config.js';
import { interact, moveChef } from './kitchen.js';
import { startShift } from './state.js';

export function bindInput(state, canvas, sounds) {
  const keys = new Set();
  let mouseDown = false;

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW.w,
      y: ((clientY - rect.top) / rect.height) * VIEW.h,
    };
  }

  function useStation() {
    if (state.phase === 'playing') {
      interact(state);
      sounds.blip();
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      state.muted = !state.muted;
      return;
    }
    if (state.phase === 'title' && (e.key === 'Enter' || e.key === ' ')) {
      startShift(state);
      return;
    }
    if ((state.phase === 'won' || state.phase === 'lost') && (e.key === 'r' || e.key === 'R')) {
      startShift(state);
      return;
    }
    if (state.phase === 'playing' && (e.key === 'r' || e.key === 'R')) {
      startShift(state);
      return;
    }
    if (state.phase !== 'playing') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') useStation();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('pointerdown', (e) => {
    mouseDown = true;
    const p = toLogical(e.clientX, e.clientY);
    if (state.phase === 'title') {
      startShift(state);
      return;
    }
    if (state.phase === 'won' || state.phase === 'lost') {
      startShift(state);
      return;
    }
    // Clicking a station walks the chef to it and uses it; clicking the
    // open floor just walks there.
    state.chef.tx = p.x;
    state.chef.ty = p.y;
    state.chef.clickUse = true;
  });
  window.addEventListener('pointerup', () => { mouseDown = false; });

  // Each frame, keyboard movement overrides the click target.
  return function pollKeyboard(dt) {
    if (state.phase !== 'playing') return;
    const c = state.chef;
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      c.tx = c.x + (dx / len) * 60;
      c.ty = c.y + (dy / len) * 60;
      c.clickUse = false;
    }
    moveChef(state, dt);
    // Arrived at a clicked station: use it once.
    if (c.clickUse && Math.hypot(c.tx - c.x, c.ty - c.y) < 6) {
      c.clickUse = false;
      useStation();
    }
    void mouseDown;
  };
}
