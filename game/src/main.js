// Sizzle & Serve — boot and game loop: size the canvas, wire input, run
// the clock, and draw every frame. ?shot=<name> opens a fixed kitchen for
// screenshots; ?test=1 plays a whole order and reports PASS or FAIL.

import { VIEW } from './config.js';
import { makeSounds } from './audio.js';
import { bindInput } from './input.js';
import { tick } from './kitchen.js';
import { render } from './render.js';
import { applyShot, runSelfTest } from './shots.js';
import { createState } from './state.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const state = createState();
const sounds = makeSounds(state);
const pollKeyboard = bindInput(state, canvas, sounds);

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);
  canvas.width = VIEW.w;
  canvas.height = VIEW.h;
  canvas.style.width = Math.floor(VIEW.w * scale) + 'px';
  canvas.style.height = Math.floor(VIEW.h * scale) + 'px';
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

if (params.get('shot')) {
  applyShot(state, params.get('shot'));
  render(state, canvas);
} else if (params.get('test') === '1') {
  runSelfTest(state);
  render(state, canvas);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.phase === 'playing') {
    pollKeyboard(dt);
    tick(state, dt);
  }
  render(state, canvas);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
