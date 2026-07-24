// Sound design via Web Audio API — synthesized, no audio files to load.
// UI blips are short pentatonic notes (pleasant, never jarring); ambience is a
// soft generative drone that evokes "campfire storytelling" without competing
// with a live table. Both are muteable and default from localStorage.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// ---------- UI sounds ----------

let sfxMuted = false;

export function setSfxMuted(m: boolean) {
  sfxMuted = m;
  try {
    localStorage.setItem("gm-sfx-muted", m ? "1" : "0");
  } catch {
    /* private mode */
  }
}

export function initialSfxMuted(): boolean {
  try {
    return localStorage.getItem("gm-sfx-muted") === "1";
  } catch {
    return false;
  }
}

function blip(freqs: number[], duration = 0.12, gainPeak = 0.08) {
  if (sfxMuted) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  freqs.forEach((f, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, now + i * 0.06);
    gain.gain.linearRampToValueAtTime(gainPeak, now + i * 0.06 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + duration + 0.05);
  });
}

// Pentatonic-ish, so any combination sounds friendly.
export const sfx = {
  click: () => blip([660], 0.08, 0.05),
  accept: () => blip([523, 659, 784], 0.15, 0.07), // rising major triad
  ignore: () => blip([392], 0.1, 0.04),
  send: () => blip([440, 554], 0.12, 0.06),
  arrive: () => blip([784, 659], 0.14, 0.06), // gentle "ta-da" down
  callback: () => blip([587, 494, 659], 0.13, 0.06),
};

// ---------- Ambient music ----------

let ambient: { stop: () => void } | null = null;

export function initialMusicOn(): boolean {
  try {
    return localStorage.getItem("gm-music-on") === "1";
  } catch {
    return false;
  }
}

export function setMusicOn(on: boolean) {
  try {
    localStorage.setItem("gm-music-on", on ? "1" : "0");
  } catch {
    /* private mode */
  }
  if (on) startAmbient();
  else stopAmbient();
}

// A soft generative drone: two detuned sines on a low root, a slow LFO on the
// filter, and an occasional gentle high note. Quiet by design (~-26 dBFS).
function startAmbient() {
  if (ambient) return;
  const ac = audio();
  if (!ac) return;

  const master = ac.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.05, ac.currentTime + 2); // fade in
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  filter.connect(master).connect(ac.destination);

  const oscs: OscillatorNode[] = [];
  [110, 110.7, 164.8].forEach((f) => {
    const o = ac.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    o.connect(filter);
    o.start();
    oscs.push(o);
  });

  // slow filter sweep for movement
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 250;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  oscs.push(lfo);

  // occasional soft high note (pentatonic over A)
  const notes = [440, 523.25, 587.33, 659.25, 783.99];
  const timer = window.setInterval(() => {
    if (!ac || Math.random() < 0.4) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
    const t = ac.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + 3.2);
  }, 5000);

  ambient = {
    stop: () => {
      window.clearInterval(timer);
      master.gain.linearRampToValueAtTime(0, ac.currentTime + 1);
      window.setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        });
      }, 1200);
      ambient = null;
    },
  };
}

function stopAmbient() {
  ambient?.stop();
}
