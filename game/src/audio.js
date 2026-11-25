// Sizzle & Serve — tiny synthesized sound effects. No audio files: every
// sound is an oscillator blip through the Web Audio API, so the game stays
// offline and file-free. Everything is guarded: no audio context, no crash.

export function makeSounds(state) {
  let ctx = null;

  function audio() {
    if (state.muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, dur, type, vol) {
    const ac = audio();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type ?? 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol ?? 0.08, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch {
      // Sound is garnish; a failure must never break the game.
    }
  }

  return {
    blip() { tone(660, 0.07, 'sine', 0.06); },
    chop() { tone(180, 0.06, 'square', 0.05); },
    ding() { tone(880, 0.18, 'sine', 0.09); tone(1320, 0.22, 'sine', 0.06); },
    alarm() { tone(220, 0.25, 'sawtooth', 0.07); },
  };
}
