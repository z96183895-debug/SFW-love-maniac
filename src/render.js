import { BOX } from './game.js';

const PALETTES = [
  { accent: '#b9a477', muted: '#746853', glow: 'rgba(192,159,102,.09)' },
  { accent: '#d6a066', muted: '#85674f', glow: 'rgba(214,127,73,.10)' },
  { accent: '#dd8d7d', muted: '#815950', glow: 'rgba(217,93,77,.11)' }
];
const mono = '"Courier New", monospace';

function text(ctx, message, x, y, color = '#b5b0a3', size = 10, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${mono}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(message, x, y);
}

function heart(ctx, x, y, size = 1, color = '#ef565c') {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(size, size);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(-7, -1);
  ctx.lineTo(-7, -5);
  ctx.lineTo(-5, -7);
  ctx.lineTo(-2, -7);
  ctx.lineTo(0, -4);
  ctx.lineTo(2, -7);
  ctx.lineTo(5, -7);
  ctx.lineTo(7, -5);
  ctx.lineTo(7, -1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// An original sprite, drawn in a 40 × 47 pixel coordinate system.
function chara(ctx, x, y, time, game) {
  const gentle = game.ending === 'mercy';
  const motion = game.reducedMotion ? 0 : Math.sin(time * 1.8) * 1.5;
  ctx.save();
  ctx.translate(Math.round(x - 80), Math.round(y + motion));
  ctx.scale(4, 4);
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const edge = '#161515';

  // Boots, trousers and legs.
  r(12, 36, 16, 6, edge);
  r(13, 35, 6, 7, '#292624'); r(22, 35, 5, 7, '#322b27');
  r(13, 40, 5, 4, '#c7a98d'); r(23, 40, 4, 4, '#d9bca0');
  r(11, 43, 8, 3, edge); r(22, 43, 8, 3, edge);
  r(12, 43, 6, 2, '#5f4a3a'); r(23, 43, 6, 2, '#6e5440');

  // Sweater silhouette, cuffs and open hands.
  r(8, 23, 24, 12, edge); r(6, 26, 5, 10, edge); r(29, 26, 5, 10, edge);
  r(7, 27, 5, 7, '#688257'); r(28, 26, 5, 8, '#779267');
  r(7, 31, 4, 2, '#b8ae77'); r(29, 31, 4, 2, '#c8bb82');
  r(7, 34, 4, 4, '#bda085'); r(29, 34, 4, 4, '#d9bda2');
  r(8, 37, 2, 1, '#8d715c'); r(30, 37, 2, 1, '#a98c72');
  r(11, 23, 18, 14, '#7b9464');
  r(11, 24, 3, 12, '#657c51'); r(27, 24, 2, 12, '#9ba476');
  r(14, 23, 11, 2, '#a2ac7a'); r(16, 23, 7, 2, '#d5bea1');
  r(11, 29, 18, 4, '#d2bf79'); r(11, 29, 3, 4, '#b7a468');
  r(14, 29, 13, 1, '#e2d299'); r(11, 36, 18, 1, '#475b3c');

  // Rounded dark-brown bob with deliberately asymmetric highlights.
  r(10, 1, 19, 1, edge); r(7, 2, 24, 2, edge); r(5, 4, 28, 15, edge);
  r(6, 18, 7, 6, edge); r(27, 18, 6, 6, edge);
  r(8, 3, 21, 2, '#6f4937'); r(6, 5, 26, 12, '#65412f');
  r(7, 17, 6, 5, '#54382b'); r(27, 16, 5, 6, '#593929');
  r(10, 3, 15, 1, '#946a4c'); r(8, 5, 6, 2, '#80563b');
  r(7, 8, 3, 9, '#7d5136'); r(29, 9, 2, 9, '#805539');

  // Face, cheeks and expression.
  r(11, 9, 18, 11, '#e5c7a4'); r(13, 20, 13, 2, '#d4ae8e');
  r(15, 22, 9, 1, '#b98e73'); r(11, 10, 2, 8, '#c69e7c');
  r(14, 11, 13, 5, '#eed4b0'); r(27, 10, 2, 8, '#d8b18b');
  r(12, 17, 3, 1, '#d5a389'); r(25, 17, 3, 1, '#d5a389');
  if (gentle) {
    r(14, 14, 4, 1, '#6c4c40'); r(23, 14, 4, 1, '#6c4c40');
    r(18, 18, 5, 1, '#946950'); r(19, 19, 3, 1, '#946950');
  } else {
    r(14, 13, 4, 1, '#795344'); r(23, 13, 4, 1, '#795344');
    r(14, 14, 4, 2, '#713d35'); r(23, 14, 4, 2, '#713d35');
    r(16, 14, 1, 2, '#bc5e4d'); r(24, 14, 1, 2, '#bc5e4d');
    r(16, 14, 1, 1, '#e6a38b'); r(24, 14, 1, 1, '#e6a38b');
    r(19, 18, 4, 1, '#a7775c');
  }
  // Fringe rests over the face rather than forming a flat cap.
  r(10, 6, 19, 3, '#6f4934'); r(10, 8, 4, 3, '#65412f');
  r(14, 8, 5, 2, '#724c34'); r(19, 7, 5, 3, '#765039');
  r(24, 8, 5, 3, '#674330'); r(28, 9, 2, 5, '#5d3c2d');
  r(12, 6, 8, 1, '#8c6343'); r(22, 5, 5, 1, '#805b3e');
  if (game.bossFlash > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,234,194,${game.bossFlash * 0.65})`;
    ctx.fillRect(6, 0, 28, 46);
  }
  ctx.restore();
}

function background(ctx, game, time, palette) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#101111';
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(450, 155, 20, 450, 210, 330);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, 'rgba(16,17,17,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

  // Broken pillars and horizontal masonry make a quiet, invented setting.
  ctx.fillStyle = '#171918';
  ctx.fillRect(56, 80, 34, 178); ctx.fillRect(810, 80, 34, 178);
  ctx.fillStyle = '#1e211e';
  ctx.fillRect(51, 77, 44, 6); ctx.fillRect(805, 77, 44, 6);
  ctx.fillRect(52, 253, 42, 5); ctx.fillRect(806, 253, 42, 5);
  ctx.fillStyle = '#20211e';
  ctx.fillRect(64, 88, 2, 154); ctx.fillRect(818, 88, 2, 154);
  ctx.strokeStyle = '#24251f'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(102, 257.5); ctx.lineTo(798, 257.5); ctx.stroke();
  for (let i = 0; i < 30; i++) {
    const x = 115 + (i * 131 + 17) % 670;
    const y = 38 + (i * 71 + 9) % 191;
    const alpha = game.reducedMotion ? 0.35 : 0.18 + (Math.sin(time * 0.6 + i * 1.7) + 1) * 0.17;
    ctx.fillStyle = `rgba(196,179,142,${alpha})`;
    ctx.fillRect(x, y, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1);
  }
  ctx.strokeStyle = `${palette.muted}3a`;
  ctx.beginPath(); ctx.arc(450, 154, 106, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.beginPath(); ctx.arc(450, 154, 115, Math.PI * 1.22, Math.PI * 1.78); ctx.stroke();
  ctx.fillStyle = '#090b0a';
  ctx.beginPath(); ctx.ellipse(450, 253, 69, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22251e'; ctx.fillRect(415, 253, 70, 1);

  text(ctx, '01 / THE LAST PROMISE', 28, 26, '#8c897c', 10);
  text(ctx, `PHASE 0${game.phase}  ·  ${['THE APPROACH', 'THE FRACTURE', 'THE RECKONING'][game.phase - 1]}`, 872, 26, palette.accent, 10, 'right');
  text(ctx, 'C H A R A', 450, 44, '#e1d8c4', 11, 'center');

  // Tiny indicators are positional ornaments, not invented game metrics.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < game.phase ? palette.accent : '#35352d';
    ctx.fillRect(864 + i * 5, 47, 2, 8);
  }
}

function arena(ctx, game, time, palette) {
  const b = BOX;
  const enemy = game.state === 'enemy';
  const frame = game.hitFlash > 0 ? '#e36c62' : enemy ? '#dfd8c4' : '#928d7e';
  text(ctx, enemy ? game.patternName.toUpperCase() : 'YOUR SOUL / YOUR CHOICE', b.x, b.y - 17, palette.accent, 10);
  if (enemy && game.pattern) {
    const remaining = Math.max(0, game.pattern.duration - game.pattern.elapsed);
    text(ctx, `${remaining.toFixed(1)}s`, b.x + b.w, b.y - 17, '#a5a08f', 10, 'right');
  } else text(ctx, 'D E T E R M I N A T I O N', b.x + b.w, b.y - 17, '#6f7065', 8, 'right');
  ctx.fillStyle = '#0b0d0c'; ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = '#151a16'; ctx.lineWidth = 1;
  for (let x = b.x + 30; x < b.x + b.w; x += 30) {
    ctx.beginPath(); ctx.moveTo(x + .5, b.y); ctx.lineTo(x + .5, b.y + b.h); ctx.stroke();
  }
  for (let y = b.y + 25; y < b.y + b.h; y += 25) {
    ctx.beginPath(); ctx.moveTo(b.x, y + .5); ctx.lineTo(b.x + b.w, y + .5); ctx.stroke();
  }
  ctx.strokeStyle = frame; ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = palette.accent;
  for (const [x, y] of [[b.x - 5, b.y - 5], [b.x + b.w + 3, b.y - 5], [b.x - 5, b.y + b.h + 3], [b.x + b.w + 3, b.y + b.h + 3]]) ctx.fillRect(x, y, 2, 2);

  ctx.save();
  ctx.beginPath(); ctx.rect(b.x + 1, b.y + 1, b.w - 2, b.h - 2); ctx.clip();
  if (enemy && game.pattern) {
    for (const w of game.pattern.warnings) {
      if (w.active) {
        ctx.fillStyle = '#fff1ce'; ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#e2ab76';
        if (w.h > w.w) ctx.fillRect(w.x + w.w * .35, w.y, w.w * .3, w.h);
        else ctx.fillRect(w.x, w.y + w.h * .35, w.w, w.h * .3);
      } else {
        const alpha = game.reducedMotion ? .15 : .1 + .12 * (Math.sin(time * 16) + 1) / 2;
        ctx.fillStyle = `rgba(227,158,97,${alpha})`; ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#d89760'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
        ctx.strokeRect(w.x + .5, w.y + .5, w.w - 1, w.h - 1); ctx.setLineDash([]);
      }
    }
    for (const bullet of game.pattern.bullets) {
      ctx.save(); ctx.translate(Math.round(bullet.x), Math.round(bullet.y));
      ctx.fillStyle = bullet.color || '#f4e6ca';
      if (bullet.kind === 'diamond') {
        ctx.beginPath(); ctx.moveTo(0, -bullet.r - 1); ctx.lineTo(bullet.r + 1, 0); ctx.lineTo(0, bullet.r + 1); ctx.lineTo(-bullet.r - 1, 0); ctx.closePath(); ctx.fill();
      } else if (bullet.kind === 'petal') {
        ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
        ctx.beginPath(); ctx.ellipse(0, 0, bullet.r + 2, bullet.r * .65, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-bullet.r + 1, -bullet.r, bullet.r * 2 - 2, bullet.r * 2);
        ctx.fillRect(-bullet.r, -bullet.r + 1, bullet.r * 2, bullet.r * 2 - 2);
      }
      ctx.restore();
    }
  }
  const showSoul = game.ending !== 'defeat' && (!enemy || game.invulnerable <= 0 || Math.floor(time * 15) % 2 === 0 || game.reducedMotion);
  if (showSoul) {
    const { x, y } = game.soul;
    ctx.fillStyle = 'rgba(233,69,83,.08)';
    ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    heart(ctx, x, y, 1, game.ending === 'mercy' ? '#eed39c' : '#ed5762');
    if (game.focus) { ctx.fillStyle = '#ffe4cc'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
  }
  if (!enemy && !['intro', 'ending'].includes(game.state)) {
    text(ctx, game.state === 'fight' ? 'MAKE YOUR MOMENT COUNT' : game.state === 'dialogue' ? 'THE NEXT WAVE IS WAITING' : 'A QUIET MOMENT BETWEEN STORMS', 450, 461, '#686c60', 9, 'center');
  }
  ctx.restore();
  text(ctx, enemy ? 'MOVE  ↑ ↓ ← →     HOLD SHIFT TO FOCUS' : 'EVERY CHOICE LEAVES A LIGHT.', 450, 523, '#77796c', 9, 'center');

  if (game.paused) {
    ctx.fillStyle = 'rgba(10,12,10,.82)'; ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    text(ctx, 'P A U S E D', 450, 390, '#e8dfc9', 17, 'center');
    text(ctx, 'P / RESUME TO CONTINUE', 450, 417, '#9a9a86', 10, 'center');
  }
}

export function render(ctx, game, now = 0) {
  const time = game.paused ? game.time : now;
  const palette = PALETTES[Math.max(0, Math.min(2, game.phase - 1))];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  background(ctx, game, time, palette);
  chara(ctx, 450, 62, time, game);
  arena(ctx, game, time, palette);
  ctx.restore();
}
