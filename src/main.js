import { Battle, MAX_HP, BOSS_HP } from './game.js';
import { render } from './render.js';

const $ = id => document.getElementById(id);
const canvas = $('battle');
const ctx = canvas.getContext('2d');
const game = new Battle();
const keys = new Set();
const touchDirections = new Set();
const actions = ['fight', 'act', 'item', 'mercy'];
let actionIndex = 0;
let optionIndex = 0;
let optionsKey = '';
let lastDialogue = '';
let lastTime = 0;
let soundEnabled = false;
let audio;
let pointer = null;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
game.reducedMotion = reduceMotion.matches;
reduceMotion.addEventListener('change', e => { game.reducedMotion = e.matches; });

function tone(frequency, duration, type = 'sine', gain = 0.035, delay = 0) {
  if (!soundEnabled || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  const when = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, when);
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime(gain, when + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(envelope).connect(audio.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function cue(event) {
  if (event === 'damage') { tone(100, 0.14, 'sawtooth', 0.045); tone(65, 0.2, 'triangle', 0.04); }
  else if (event === 'strike') { tone(220, 0.07, 'square'); tone(440, 0.15, 'triangle', 0.045, 0.055); }
  else if (event === 'heal') [440, 554, 659].forEach((n, i) => tone(n, 0.22, 'sine', 0.04, i * 0.09));
  else if (event === 'mercy' || event === 'victory') [262, 330, 392, 523].forEach((n, i) => tone(n, 0.65, 'triangle', 0.035, i * 0.17));
  else if (event === 'defeat') [262, 220, 165].forEach((n, i) => tone(n, 0.45, 'sine', 0.04, i * 0.2));
  else if (event === 'turn') tone(523, 0.15, 'sine');
  else if (event === 'wave') tone(165, 0.3, 'triangle');
}

async function toggleSound() {
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    await audio.resume();
    soundEnabled = !soundEnabled;
    if (soundEnabled) tone(523, 0.18);
  } catch {
    soundEnabled = false;
    $('sound-button').textContent = 'AUDIO UNAVAILABLE';
    return;
  }
  syncUI();
}

function togglePause() {
  if (game.state === 'intro' || game.state === 'ending') return;
  game.paused = !game.paused;
  keys.clear();
  touchDirections.clear();
  pointer = null;
  syncUI();
}

function start() {
  game.start();
  canvas.focus({ preventScroll: true });
  syncUI();
}

function restart() {
  game.reset();
  game.reducedMotion = reduceMotion.matches;
  game.start();
  actionIndex = 0;
  optionIndex = 0;
  optionsKey = '';
  keys.clear();
  touchDirections.clear();
  pointer = null;
  canvas.focus({ preventScroll: true });
  syncUI();
}

function pickAction(action) {
  if (game.state !== 'menu' || game.paused) return;
  actionIndex = actions.indexOf(action);
  optionIndex = 0;
  game.action(action);
  canvas.focus({ preventScroll: true });
  tone(330, 0.06, 'triangle');
  syncUI();
}

function selectOption(id) {
  if (game.paused) return;
  game.choose(id);
  canvas.focus({ preventScroll: true });
  tone(392, 0.06, 'triangle');
  syncUI();
}

function confirm() {
  if (game.paused) return;
  if (game.state === 'ending') { restart(); return; }
  if (game.state === 'menu') {
    if (game.submenu) {
      const option = game.options[optionIndex];
      if (option && !option.disabled) selectOption(option.id);
    } else pickAction(actions[actionIndex]);
  } else game.confirm();
  syncUI();
}

$('start-button').addEventListener('click', start);
$('restart-button').addEventListener('click', restart);
$('sound-button').addEventListener('click', toggleSound);
$('pause-button').addEventListener('click', togglePause);
$('continue-button')?.addEventListener('click', confirm);
$('fight-timing').addEventListener('pointerdown', e => { e.preventDefault(); confirm(); });
document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => pickAction(button.dataset.action));
});
$('help-toggle').addEventListener('click', () => {
  $('help-panel').hidden = !$('help-panel').hidden;
  $('help-toggle').setAttribute('aria-expanded', String(!$('help-panel').hidden));
});

const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // Keep native keyboard activation available for tab-focused UI controls.
  if (['Enter', ' '].includes(key) && document.activeElement?.tagName === 'BUTTON') return;
  const direction = directions[key];
  const isConfirm = ['Enter', 'z', ' '].includes(key);
  if (direction || isConfirm || ['Escape', 'x', 'p', 'm', 'Shift'].includes(key)) e.preventDefault();
  keys.add(key);
  if (e.repeat) return;
  if (key === 'p') { togglePause(); return; }
  if (key === 'm') { toggleSound(); return; }
  if (game.paused) return;
  if (isConfirm) { confirm(); return; }
  if (key === 'Escape' || key === 'x') { game.back(); syncUI(); return; }
  if (direction && game.state === 'menu') {
    const step = direction === 'left' || direction === 'up' ? -1 : 1;
    if (game.submenu) {
      const options = game.options;
      let next = optionIndex;
      for (let i = 0; i < options.length; i++) {
        next = (next + step + options.length) % options.length;
        if (!options[next].disabled) break;
      }
      optionIndex = next;
    } else actionIndex = (actionIndex + step + 4) % 4;
    tone(260, 0.04, 'triangle', 0.02);
    syncUI();
  }
});
window.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
window.addEventListener('blur', () => {
  keys.clear(); touchDirections.clear(); pointer = null;
  if (['enemy', 'fight'].includes(game.state) && !game.paused) togglePause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ['enemy', 'fight'].includes(game.state) && !game.paused) togglePause();
});

document.querySelectorAll('[data-dir]').forEach(button => {
  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    touchDirections.add(button.dataset.dir);
    button.classList.add('pressed');
  });
  const release = () => {
    touchDirections.delete(button.dataset.dir);
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

// Drag relative to the SOUL, avoiding a jump when the player first touches the box.
canvas.style.touchAction = 'none';
canvas.addEventListener('pointerdown', e => {
  canvas.focus({ preventScroll: true });
  if (game.state !== 'enemy' || game.paused) return;
  canvas.setPointerCapture(e.pointerId);
  const rect = canvas.getBoundingClientRect();
  pointer = { x: e.clientX, y: e.clientY, scale: canvas.width / rect.width, targetX: game.soul.x, targetY: game.soul.y };
});
canvas.addEventListener('pointermove', e => {
  if (!pointer) return;
  pointer.targetX += (e.clientX - pointer.x) * pointer.scale;
  pointer.targetY += (e.clientY - pointer.y) * pointer.scale;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});
canvas.addEventListener('pointerup', () => { pointer = null; });
canvas.addEventListener('pointercancel', () => { pointer = null; });

const phaseNames = ['I · THE APPROACH', 'II · THE FRACTURE', 'III · THE RECKONING'];
function syncUI() {
  $('intro-panel').hidden = game.state !== 'intro';
  $('end-panel').hidden = game.state !== 'ending';
  $('phase-label').textContent = `PHASE ${phaseNames[game.phase - 1]}`;
  $('boss-hp-fill').style.width = `${game.bossHp / BOSS_HP * 100}%`;
  $('boss-hp-text').textContent = `${game.bossHp} / ${BOSS_HP}`;
  $('player-hp-fill').style.width = `${game.hp / MAX_HP * 100}%`;
  $('player-hp-text').textContent = `${game.hp} / ${MAX_HP}`;
  $('player-hp-fill').style.background = game.hp <= 10 ? '#ff8d60' : '';
  if ($('trust-text')) $('trust-text').textContent = game.mercyReady ? 'READY TO SPARE' : `${game.resolve}%`;
  if ($('trust-fill')) $('trust-fill').style.width = `${game.resolve}%`;
  $('turn-label').textContent = String(game.turn + 1).padStart(2, '0');
  $('status-label').textContent = game.paused ? 'PAUSED' : {
    intro: 'AWAITING YOU', menu: game.mercyReady ? 'MERCY IS POSSIBLE' : 'CHOOSE YOUR ACTION',
    fight: 'TIME YOUR STRIKE', dialogue: 'CONFIRM TO CONTINUE', enemy: 'DODGE · STAY DETERMINED', ending: 'ENCOUNTER COMPLETE'
  }[game.state];
  if (game.dialogue !== lastDialogue) {
    $('dialogue').textContent = game.dialogue;
    lastDialogue = game.dialogue;
  }
  $('fight-timing').hidden = game.state !== 'fight';
  $('fight-hint').hidden = game.state !== 'fight';
  $('timing-marker').style.left = `${game.attackPosition * 100}%`;
  if ($('continue-button')) {
    $('continue-button').hidden = game.state !== 'dialogue';
    $('continue-button').disabled = game.paused;
  }
  $('sound-button').textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
  $('sound-button').setAttribute('aria-pressed', String(soundEnabled));
  $('pause-button').textContent = game.paused ? 'RESUME' : 'PAUSE';
  $('pause-button').disabled = ['intro', 'ending'].includes(game.state);
  $('pause-button').setAttribute('aria-pressed', String(game.paused));
  document.querySelectorAll('[data-action]').forEach((button, index) => {
    button.disabled = game.state !== 'menu' || game.paused;
    const selected = game.state === 'menu' && (game.submenu ? button.dataset.action === game.submenu : index === actionIndex);
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('mercy-ready', button.dataset.action === 'mercy' && game.mercyReady);
  });
  const options = game.options;
  const signature = JSON.stringify([game.state, game.submenu, options, game.paused]);
  if (signature !== optionsKey) {
    $('menu-options').replaceChildren();
    if (game.state === 'menu' && game.submenu) {
      if (optionIndex >= options.length || options[optionIndex]?.disabled) {
        optionIndex = Math.max(0, options.findIndex(o => !o.disabled));
      }
      for (const option of options) {
        const button = document.createElement('button');
        button.dataset.option = option.id;
        const title = document.createElement('strong');
        title.textContent = option.label;
        const detail = document.createElement('small');
        detail.textContent = option.detail;
        detail.style.display = 'block';
        button.append(title, detail);
        button.disabled = !!option.disabled || game.paused;
        button.addEventListener('click', () => { optionIndex = options.findIndex(o => o.id === option.id); selectOption(option.id); });
        $('menu-options').append(button);
      }
      const back = document.createElement('button');
      back.textContent = '← Back';
      back.dataset.back = '';
      back.disabled = game.paused;
      back.addEventListener('click', () => { game.back(); syncUI(); });
      $('menu-options').append(back);
    }
    optionsKey = signature;
  }
  document.querySelectorAll('[data-option]').forEach((button, i) => button.classList.toggle('selected', i === optionIndex));
  if (game.state === 'ending') {
    $('end-title').textContent = { victory: 'The storm breaks.', mercy: 'A promise kept.', defeat: 'Not the end.' }[game.ending];
    $('end-copy').textContent = game.dialogue;
  }
}

function frame(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 1 / 30) : 0;
  lastTime = timestamp;
  const input = {
    left: keys.has('ArrowLeft') || keys.has('a') || touchDirections.has('left'),
    right: keys.has('ArrowRight') || keys.has('d') || touchDirections.has('right'),
    up: keys.has('ArrowUp') || keys.has('w') || touchDirections.has('up'),
    down: keys.has('ArrowDown') || keys.has('s') || touchDirections.has('down'),
    slow: keys.has('Shift')
  };
  if (pointer && game.state === 'enemy') {
    const x = pointer.targetX - game.soul.x;
    const y = pointer.targetY - game.soul.y;
    // Analog axes use the same speed cap and collision path as keyboard input.
    const distance = Math.hypot(x, y);
    const maxStep = 205 * dt;
    input.left = input.up = false;
    input.right = distance > 2 ? x / Math.max(distance, maxStep) : 0;
    input.down = distance > 2 ? y / Math.max(distance, maxStep) : 0;
  }
  game.focus = input.slow;
  game.update(dt, input);
  if (game.event) { cue(game.event); game.event = null; }
  syncUI();
  render(ctx, game, game.reducedMotion ? 0 : timestamp / 1000);
  requestAnimationFrame(frame);
}
syncUI();
requestAnimationFrame(frame);
