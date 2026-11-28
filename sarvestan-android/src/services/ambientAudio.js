/**
 * موتور تولید صداهای محیطی آفلاین با Web Audio API (بدون فایل صوتی اضافه)
 * پشتیبانی از: باران ملایم (rain)، نویز قهوهای (brown)، نویز سفید نرم (white)
 */

let audioCtx = null;
let activeNodes = null;
let currentMode = 'off';

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function stopAmbientSound() {
  currentMode = 'off';
  if (activeNodes) {
    try {
      activeNodes.source?.stop?.();
      activeNodes.lfo?.stop?.();
      activeNodes.source?.disconnect?.();
      activeNodes.gain?.disconnect?.();
      activeNodes.filter?.disconnect?.();
    } catch {}
    activeNodes = null;
  }
}

export function getAmbientMode() {
  return currentMode;
}

export function startAmbientSound(mode = 'rain', volume = 0.22) {
  stopAmbientSound();
  if (!mode || mode === 'off') return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (mode === 'brown' || mode === 'rain') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= mode === 'rain' ? 2.6 : 3.2;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    gain.gain.value = Math.max(0.02, Math.min(0.6, volume));

    let lfo = null;
    if (mode === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 950;
      filter.Q.value = 0.7;
      lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.18;
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
    } else if (mode === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.value = 420;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
    }

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    activeNodes = { source, filter, gain, lfo };
    currentMode = mode;
    return true;
  } catch {
    stopAmbientSound();
    return false;
  }
}
