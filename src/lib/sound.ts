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

interface BlipOpts {
  duration?: number;
  gainPeak?: number;
  type?: OscillatorType;
  gap?: number; // seconds between notes in a sequence
  glide?: boolean; // slide pitch to the next note instead of retriggering
}

function blip(freqs: number[], opts: BlipOpts = {}) {
  if (sfxMuted) return;
  const ac = audio();
  if (!ac) return;
  const { duration = 0.12, gainPeak = 0.08, type = "sine", gap = 0.06, glide = false } = opts;
  const now = ac.currentTime;

  // Glide mode: one oscillator sweeping through the notes (whoosh / zap feel).
  if (glide && freqs.length > 1) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqs[0], now);
    const total = duration;
    freqs.forEach((f, i) => {
      if (i === 0) return;
      osc.frequency.exponentialRampToValueAtTime(f, now + (total * i) / (freqs.length - 1));
    });
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + total);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + total + 0.05);
    return;
  }

  freqs.forEach((f, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = f;
    const t = now + i * gap;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  });
}

// Each action has its own recognizable character — timbre + shape, not just
// pitch — so a GM learns the sounds without them ever getting loud.
export const sfx = {
  // soft rounded tick
  click: () => blip([620], { duration: 0.07, gainPeak: 0.045, type: "sine" }),
  // warm rising major triad — a satisfying "yes, kept it"
  accept: () =>
    blip([523, 659, 784], { duration: 0.16, gainPeak: 0.07, type: "triangle", gap: 0.05 }),
  // short low woody thunk — dismissive but gentle
  ignore: () => blip([300, 220], { duration: 0.1, gainPeak: 0.05, type: "sine", glide: true }),
  // quick upward "whoosh" — sending the request off
  send: () =>
    blip([392, 587, 880], { duration: 0.18, gainPeak: 0.05, type: "sawtooth", glide: true }),
  // bright sparkly arpeggio — the suggestions have arrived
  arrive: () =>
    blip([659, 880, 1047, 1319], { duration: 0.13, gainPeak: 0.05, type: "sine", gap: 0.05 }),
  // shimmering reverse-ish sweep — a thread woven back in
  callback: () =>
    blip([494, 659, 988], { duration: 0.22, gainPeak: 0.05, type: "triangle", glide: true }),
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
