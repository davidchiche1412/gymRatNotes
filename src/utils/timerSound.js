const BASE = import.meta.env.BASE_URL;

let _audioCtx = null;
let _currentMaster = null;
let _currentAudio = null;

function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

function stopCurrent() {
  if (_currentMaster) {
    _currentMaster.disconnect();
    _currentMaster = null;
  }
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
  }
}

function playDing(vol) {
  stopCurrent();
  const audio = new Audio(BASE + 'ding.mp3');
  audio.volume = vol;
  audio.play().catch(() => undefined);
  _currentAudio = audio;
}

function playBell(vol) {
  stopCurrent();
  const ctx = getAudioCtx();
  const master = ctx.createGain();
  master.gain.value = vol;
  master.connect(ctx.destination);
  _currentMaster = master;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 340;
  g1.gain.setValueAtTime(0.6, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  osc1.connect(g1);
  g1.connect(master);
  osc1.start(now);
  osc1.stop(now + 1.2);

  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 340;
  g2.gain.setValueAtTime(0.0, now);
  g2.gain.setValueAtTime(0.5, now + 0.3);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
  osc2.connect(g2);
  g2.connect(master);
  osc2.start(now + 0.3);
  osc2.stop(now + 1.3);
}

function playBeep(vol) {
  stopCurrent();
  const ctx = getAudioCtx();
  const master = ctx.createGain();
  master.gain.value = vol;
  master.connect(ctx.destination);
  _currentMaster = master;
  const now = ctx.currentTime;

  [0, 0.2, 0.4].forEach(offset => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1000;
    g.gain.setValueAtTime(0.2, now + offset);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
    osc.connect(g);
    g.connect(master);
    osc.start(now + offset);
    osc.stop(now + offset + 0.15);
  });
}

export function playSound(soundType, vol = 0.7) {
  if (soundType === 'none') {
    stopCurrent();
    return;
  }
  switch (soundType) {
    case 'ding': playDing(vol); break;
    case 'bell': playBell(vol); break;
    case 'beep': playBeep(vol); break;
    default: break;
  }
}
