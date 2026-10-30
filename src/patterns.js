// Original, time-based patterns. World coordinates match the battle canvas.
export const PATTERNS = Object.freeze([
  { id: 'rain', name: 'Falling embers', description: 'Follow the opening in the falling rows.', duration: 8 },
  { id: 'fan', name: 'Pendulum', description: 'Slip between the sweeping fans.', duration: 8 },
  { id: 'orbit', name: 'Compass rose', description: 'Keep moving around the crossing spokes.', duration: 8.5 },
  { id: 'cross', name: 'Crosscurrent', description: 'Find the gap as the current changes direction.', duration: 8 },
  { id: 'beams', name: 'Afterimage', description: 'Leave the marked lanes before they light up.', duration: 8.5 },
  { id: 'petals', name: 'Paper garden', description: 'Weave through the drifting petals.', duration: 9 },
]);

const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function createPattern(id, phase = 1, box, random = Math.random) {
  const definition = PATTERNS.find(pattern => pattern.id === id) || PATTERNS[0];
  const level = clamp(Math.floor(phase) || 1, 1, 3);
  const area = { ...box };
  const bullets = [];
  const warnings = [];
  let elapsed = 0;
  let nextEmission = 0.7;
  let wave = 0;

  const add = (x, y, vx, vy, r = 4, kind = 'orb', color = '#f4e6ca') => {
    // A hard cap keeps malformed/extremely long update loops harmless.
    if (bullets.length < 180) bullets.push({ x, y, vx, vy, r, kind, color });
  };

  function emit(soul) {
    const { x, y, w, h } = area;
    const speed = 76 + level * 9;
    let interval = 0.9;

    if (definition.id === 'rain') {
      const gap = x + w * (0.5 + 0.28 * Math.sin(wave * 0.75));
      const gapWidth = 90 - level * 5;
      for (let px = x + 12; px < x + w; px += 27) {
        if (Math.abs(px - gap) > gapWidth / 2) add(px, y - 12, 0, speed, 4, 'diamond');
      }
      interval = 0.78 - level * 0.035;
    } else if (definition.id === 'fan') {
      const origin = x + w * (0.5 + 0.32 * Math.sin(wave * 0.65));
      const lean = Math.sin(wave * 0.7) * 0.15;
      const count = 5 + (level === 3 ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const angle = 0.37 + (Math.PI - 0.74) * k / (count - 1) + lean;
        add(origin, y - 12, Math.cos(angle) * speed * 0.95, Math.sin(angle) * speed * 0.95);
      }
      interval = 0.82;
    } else if (definition.id === 'orbit') {
      const angle = wave * 0.51;
      for (let k = 0; k < 4; k++) {
        const theta = angle + k * Math.PI / 2;
        const px = x + w / 2 + Math.cos(theta) * (w / 2 + 10);
        const py = y + h / 2 + Math.sin(theta) * (h / 2 + 10);
        // Rotated slightly off-centre so that the four paths do not all overlap.
        const tx = x + w / 2 + Math.sin(theta) * 38;
        const ty = y + h / 2 - Math.cos(theta) * 26;
        const distance = Math.hypot(tx - px, ty - py);
        add(px, py, (tx - px) / distance * speed * 0.82, (ty - py) / distance * speed * 0.82, 4, 'diamond');
      }
      interval = 0.72;
    } else if (definition.id === 'cross') {
      const fromLeft = wave % 2 === 0;
      const gap = y + h * (0.5 + 0.25 * Math.sin(wave * 0.95));
      for (let py = y + 11; py < y + h; py += 23) {
        if (Math.abs(py - gap) > 32) {
          add(fromLeft ? x - 10 : x + w + 10, py, (fromLeft ? 1 : -1) * speed * 1.2, 0, 4, 'diamond');
        }
      }
      interval = 0.94 - level * 0.03;
    } else if (definition.id === 'beams') {
      const vertical = wave % 2 === 0;
      const warmup = 0.92 - level * 0.045;
      const activeTime = 0.24;
      // A marked lane tracks the SOUL only when placed, never while charging.
      const laneX = clamp(soul?.x ?? x + w / 2, x + 14, x + w - 14);
      const laneY = clamp(soul?.y ?? y + h / 2, y + 10, y + h - 10);
      warnings.push({
        x: vertical ? laneX - 12 : x,
        y: vertical ? y : laneY - 8,
        w: vertical ? 24 : w,
        h: vertical ? h : 16,
        remaining: warmup + activeTime,
        total: warmup + activeTime,
        active: false,
        activeTime,
      });
      // A tiny drifting pair keeps the open space interesting in later phases.
      if (level > 1 && wave % 2 === 0) {
        add(x + w * 0.22, y - 10, 10, 63, 4);
        add(x + w * 0.78, y - 10, -10, 63, 4);
      }
      interval = 1.06;
    } else if (definition.id === 'petals') {
      const top = wave % 2 === 0;
      const originX = x + w * (0.5 + 0.3 * Math.sin(wave * 1.4));
      const originY = top ? y - 14 : y + h + 14;
      const offset = wave * 0.38 + random() * 0.12;
      const count = 10 + level;
      for (let k = 0; k < count; k++) {
        const angle = k / count * TAU + offset;
        add(originX, originY, Math.cos(angle) * speed * 0.82, Math.sin(angle) * speed * 0.82, 4, 'petal', '#f3c78f');
      }
      interval = 0.95;
    }
    wave++;
    nextEmission += interval;
  }

  return {
    id: definition.id,
    name: definition.name,
    bullets,
    warnings,
    duration: definition.duration,
    get elapsed() { return elapsed; },
    get done() { return elapsed >= definition.duration; },
    update(dt, soul) {
      if (!Number.isFinite(dt) || dt <= 0 || elapsed >= definition.duration) return;
      // Substeps preserve warning timing, culling and pattern pacing after lag.
      let remaining = Math.min(dt, 0.25);
      while (remaining > 0.00001 && elapsed < definition.duration) {
        const step = Math.min(remaining, 1 / 60, definition.duration - elapsed);
        elapsed += step;
        remaining -= step;
        // Leave a brief quiet end so that turns resolve cleanly.
        while (elapsed >= nextEmission && nextEmission < definition.duration - 0.7) emit(soul);
        for (let i = bullets.length - 1; i >= 0; i--) {
          const bullet = bullets[i];
          bullet.x += bullet.vx * step;
          bullet.y += bullet.vy * step;
          if (bullet.x < area.x - 36 || bullet.x > area.x + area.w + 36 || bullet.y < area.y - 36 || bullet.y > area.y + area.h + 36) bullets.splice(i, 1);
        }
        for (let i = warnings.length - 1; i >= 0; i--) {
          const warning = warnings[i];
          warning.remaining -= step;
          warning.active = warning.remaining <= warning.activeTime && warning.remaining > 0;
          if (warning.remaining <= 0) warnings.splice(i, 1);
        }
      }
    },
  };
}
