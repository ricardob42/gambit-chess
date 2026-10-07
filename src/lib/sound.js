let ctx;

function audio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq, type = 'sine', dur = 0.12, gain = 0.2, slide = 0, delay = 0 }) {
  const c = audio();
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ dur = 0.05, gain = 0.2, freq = 1500, delay = 0 }) {
  const c = audio();
  const t = c.currentTime + delay;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const amp = c.createGain();
  src.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(amp).connect(c.destination);
  src.start(t);
}

const move = (delay = 0) => {
  tone({ freq: 190, type: 'triangle', dur: 0.09, gain: 0.3, slide: -90, delay });
  noise({ dur: 0.04, gain: 0.18, freq: 1400, delay });
};

export const sfx = {
  move: () => move(),
  castle: () => {
    move();
    move(0.12);
  },
  capture: () => {
    noise({ dur: 0.1, gain: 0.4, freq: 900 });
    tone({ freq: 130, type: 'square', dur: 0.12, gain: 0.16, slide: -60 });
  },
  check: () => {
    move();
    tone({ freq: 660, dur: 0.14, gain: 0.16, delay: 0.08 });
    tone({ freq: 880, dur: 0.2, gain: 0.14, delay: 0.18 });
  },
  promote: () => {
    [523, 659, 784, 1046].forEach((freq, i) => tone({ freq, dur: 0.16, gain: 0.14, delay: i * 0.07 }));
  },
  end: () => {
    [392, 330, 262].forEach((freq, i) => tone({ freq, type: 'triangle', dur: 0.5, gain: 0.18, delay: i * 0.16 }));
  }
};
