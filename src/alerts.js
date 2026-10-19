let audioEl = null;
let unlocked = false;

// Builds a short "beep beep beep" WAV in memory, so no audio file is needed.
function buildBeepWav() {
  const rate = 22050;
  const pattern = [
    [0.18, true], [0.12, false],
    [0.18, true], [0.12, false],
    [0.18, true],
  ];
  const total = pattern.reduce((sum, [d]) => sum + d, 0);
  const n = Math.floor(total * rate);
  const samples = new Int16Array(n);

  let offset = 0;
  for (const [dur, on] of pattern) {
    const len = Math.floor(dur * rate);
    if (on) {
      for (let i = 0; i < len; i++) {
        const env = Math.min(1, i / 200, (len - i) / 200); // avoids clicks
        samples[offset + i] = Math.sin((2 * Math.PI * 880 * i) / rate) * 0.6 * 32767 * env;
      }
    }
    offset += len;
  }

  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const write = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  write(36, "data");
  v.setUint32(40, n * 2, true);
  new Int16Array(buf, 44).set(samples);

  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(bin);
}

function getAudio() {
  if (!audioEl) {
    audioEl = new Audio(buildBeepWav());
    audioEl.preload = "auto";
  }
  return audioEl;
}

// Must be called from inside a tap (click / touchend / submit).
// Asks iOS to treat the page as media playback, so the silent switch is ignored.
export function enableSound({ audible = false } = {}) {
  try {
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch {
    // not supported
  }
  const audio = getAudio();
  audio.currentTime = 0;
  const p = audio.play();
  if (!p) return Promise.resolve(false);
  return p
    .then(() => {
      unlocked = true;
      if (!audible) {
        audio.pause();
        audio.currentTime = 0;
      }
      return true;
    })
    .catch(() => false);
}

export function isSoundUnlocked() {
  return unlocked;
}

// Plays the alert later, without a tap (works once unlocked by an earlier tap).
export function playAlert() {
  navigator.vibrate?.([300, 150, 300, 150, 300]);
  const audio = getAudio();
  audio.currentTime = 0;
  return audio.play().catch(() => false);
}