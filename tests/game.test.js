import test from 'node:test';
import assert from 'node:assert/strict';
import { Battle, BOX, MAX_HP, BOSS_HP } from '../src/game.js';
import { PATTERNS, createPattern } from '../src/patterns.js';

function seededRandom(seed = 2718) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function started() {
  const game = new Battle(seededRandom());
  game.confirm();
  assert.equal(game.state, 'menu');
  return game;
}

function beginAct(game, id = 'listen') {
  game.action('act');
  game.choose(id);
  assert.equal(game.state, 'dialogue');
  game.confirm();
  assert.equal(game.state, 'enemy');
}

// Damage is tested independently below. Long invulnerability isolates the real
// pattern/turn lifecycle from the player's ability to dodge during route tests.
function completeWave(game) {
  game.invulnerable = 100;
  let frames = 0;
  while (game.state === 'enemy' && frames++ < 1000) game.update(1 / 60);
  assert.ok(frames < 1000, 'enemy wave must terminate');
  assert.equal(game.state, 'menu');
}

test('intro, menus, back, and dialogue enforce the turn sequence', () => {
  const game = new Battle(seededRandom());
  assert.equal(game.state, 'intro');
  game.action('fight');
  assert.equal(game.state, 'intro');
  game.confirm();
  game.action('item');
  assert.equal(game.options.length, 2);
  game.back();
  assert.equal(game.submenu, null);
  beginAct(game);
  const phase = game.state;
  game.action('fight');
  game.choose('tea');
  assert.equal(game.state, phase, 'menus cannot interrupt the enemy');
  assert.equal(game.items.tea, 2);
  completeWave(game);
  assert.equal(game.turn, 1);
  assert.equal(game.resolve, 28);
});

test('SOUL movement is normalized, clamped, and slower with focus', () => {
  const game = started();
  beginAct(game);
  const initial = { ...game.soul };
  game.update(1 / 60, { right: true, down: true });
  assert.ok(Math.abs(Math.hypot(game.soul.x - initial.x, game.soul.y - initial.y) - 205 / 60) < 1e-8);
  game.soul.x = initial.x;
  game.soul.y = initial.y;
  game.update(1 / 60, { right: true, slow: true });
  assert.ok(Math.abs(game.soul.x - initial.x - 105 / 60) < 1e-8);
  game.invulnerable = 100;
  for (let frame = 0; frame < 150; frame++) game.update(1 / 60, { left: true, up: true });
  assert.equal(game.soul.x, BOX.x + game.soul.r + 4);
  assert.equal(game.soul.y, BOX.y + game.soul.r + 4);
});

test('bullet collision applies damage once, then grants invulnerability', () => {
  const game = started();
  beginAct(game);
  game.invulnerable = 0;
  game.pattern.bullets.push({ x: game.soul.x, y: game.soul.y, vx: 0, vy: 0, r: 4 });
  game.update(1 / 60);
  assert.equal(game.hp, MAX_HP - 3);
  assert.ok(game.invulnerable > 1);
  game.update(1 / 60);
  assert.equal(game.hp, MAX_HP - 3, 'overlapping frames do not multiply damage');
  game.invulnerable = 0;
  game.hp = 2;
  game.update(1 / 60);
  assert.equal(game.hp, 0);
  assert.equal(game.state, 'ending');
  assert.equal(game.ending, 'defeat');
});

test('telegraphs only damage the SOUL after the beam activates', () => {
  const game = started();
  beginAct(game);
  game.pattern = createPattern('beams', 1, BOX, seededRandom());
  game.invulnerable = 0;
  let activeSeen = false;
  for (let frame = 0; frame < 180; frame++) {
    const before = game.hp;
    const activeBefore = game.pattern.warnings.some(warning => warning.active);
    game.update(1 / 60);
    const activeAfter = game.pattern.warnings.some(warning => warning.active);
    activeSeen ||= activeAfter;
    if (!activeBefore && !activeAfter) assert.equal(game.hp, before);
  }
  assert.ok(activeSeen);
  assert.ok(game.hp < MAX_HP);
});

test('healing consumes a usable item once, clamps HP, and preserves full-health inventory', () => {
  const game = started();
  game.action('item');
  game.choose('tea');
  assert.equal(game.items.tea, 2);
  assert.equal(game.state, 'menu');
  game.hp = 10;
  game.choose('tea');
  assert.equal(game.hp, 26);
  assert.equal(game.items.tea, 1);
  assert.equal(game.state, 'dialogue');
  game.confirm();
  completeWave(game);
  game.action('item');
  game.choose('bread');
  assert.equal(game.hp, MAX_HP);
  assert.equal(game.items.bread, 0);
  game.confirm();
  completeWave(game);
  game.hp = 1;
  game.action('item');
  game.choose('bread');
  assert.equal(game.hp, 1);
  assert.equal(game.items.bread, 0);
  assert.equal(game.state, 'menu');
});

test('FIGHT timing changes damage and a final strike reaches victory', () => {
  const accurate = started();
  accurate.action('fight');
  for (let frame = 0; frame < 49; frame++) accurate.update(1 / 60);
  accurate.confirm();
  const preciseDamage = BOSS_HP - accurate.bossHp;
  assert.ok(preciseDamage >= 42);
  assert.equal(accurate.state, 'dialogue');

  const glancing = started();
  glancing.action('fight');
  glancing.confirm();
  assert.equal(BOSS_HP - glancing.bossHp, 14);
  assert.ok(preciseDamage > BOSS_HP - glancing.bossHp);

  const finalStrike = started();
  finalStrike.bossHp = 14;
  finalStrike.action('fight');
  finalStrike.confirm();
  assert.equal(finalStrike.bossHp, 0);
  assert.equal(finalStrike.state, 'ending');
  assert.equal(finalStrike.ending, 'victory');
});

test('unconfirmed FIGHT resolves rather than trapping the turn', () => {
  const game = started();
  game.action('fight');
  for (let frame = 0; frame < 110; frame++) game.update(1 / 60);
  assert.equal(game.state, 'dialogue');
  assert.ok(game.bossHp < BOSS_HP);
});

test('phases advance over turns, select every pattern, and never regress', () => {
  const game = started();
  const expectedPhases = [1, 1, 2, 2, 2, 3];
  const seen = [];
  for (const phase of expectedPhases) {
    beginAct(game, 'breathe');
    assert.equal(game.phase, phase);
    seen.push(game.pattern.id);
    completeWave(game);
  }
  assert.deepEqual(seen, PATTERNS.map(pattern => pattern.id));
  assert.equal(game.turn, 6);

  const damagedBoss = started();
  damagedBoss.bossHp = 60;
  beginAct(damagedBoss);
  assert.equal(damagedBoss.phase, 3, 'boss HP can accelerate phases');
});

test('a nonviolent route requires both trust and five completed turns before mercy', () => {
  const game = started();
  game.action('mercy');
  game.choose('spare');
  assert.equal(game.state, 'dialogue', 'early peace must not end the fight');
  game.confirm();
  completeWave(game);
  for (const act of ['listen', 'remember', 'breathe', 'remember']) {
    beginAct(game, act);
    completeWave(game);
  }
  assert.equal(game.turn, 5);
  assert.equal(game.bossHp, BOSS_HP);
  assert.equal(game.resolve, 100);
  assert.equal(game.mercyReady, true);
  game.action('mercy');
  game.choose('spare');
  assert.equal(game.state, 'ending');
  assert.equal(game.ending, 'mercy');
  assert.equal(game.bossHp, BOSS_HP);
});

test('pause freezes movement, timing, and actions; reset restores a new encounter', () => {
  const game = started();
  beginAct(game);
  game.paused = true;
  const snapshot = { x: game.soul.x, time: game.time, elapsed: game.pattern.elapsed, hp: game.hp };
  game.update(1, { right: true });
  game.confirm();
  game.action('fight');
  assert.deepEqual({ x: game.soul.x, time: game.time, elapsed: game.pattern.elapsed, hp: game.hp }, snapshot);
  game.hp = 1;
  game.bossHp = 1;
  game.resolve = 100;
  game.items.tea = 0;
  game.reset();
  assert.equal(game.state, 'intro');
  assert.equal(game.hp, MAX_HP);
  assert.equal(game.bossHp, BOSS_HP);
  assert.equal(game.resolve, 0);
  assert.equal(game.turn, 0);
  assert.equal(game.pattern, null);
  assert.equal(game.paused, false);
  assert.deepEqual(game.items, { tea: 2, bread: 1 });
});

for (const definition of PATTERNS) {
  for (const phase of [1, 2, 3]) {
    test(`${definition.name}, phase ${phase}: telegraphed start, finite hazards, bounded lifetime`, () => {
      const pattern = createPattern(definition.id, phase, BOX, seededRandom());
      const soul = { x: BOX.x + BOX.w / 2, y: BOX.y + BOX.h / 2, r: 5 };
      let emitted = false;
      let activeWarning = false;
      let frames = 0;
      while (!pattern.done && frames++ < 1000) {
        pattern.update(1 / 60, soul);
        if (pattern.elapsed < 0.5) {
          assert.equal(pattern.bullets.length, 0);
          assert.equal(pattern.warnings.length, 0);
        }
        emitted ||= pattern.bullets.length > 0 || pattern.warnings.length > 0;
        activeWarning ||= pattern.warnings.some(warning => warning.active);
        assert.ok(pattern.bullets.length <= 180);
        assert.ok(pattern.warnings.length <= 4);
        for (const bullet of pattern.bullets) {
          for (const key of ['x', 'y', 'vx', 'vy', 'r']) assert.ok(Number.isFinite(bullet[key]));
          assert.ok(bullet.r > 0);
        }
        for (const warning of pattern.warnings) {
          for (const key of ['x', 'y', 'w', 'h', 'remaining', 'total']) assert.ok(Number.isFinite(warning[key]));
          assert.ok(warning.w > 0 && warning.h > 0);
          if (warning.active) assert.ok(warning.remaining <= warning.activeTime);
        }
      }
      assert.ok(frames < 1000);
      assert.ok(emitted, 'the pattern must actually emit hazards');
      assert.ok(pattern.elapsed >= definition.duration);
      if (definition.id === 'beams') assert.ok(activeWarning, 'beam warning must become an active hazard');
      const elapsed = pattern.elapsed;
      pattern.update(1 / 60, soul);
      assert.equal(pattern.elapsed, elapsed, 'completed pattern must remain complete');
    });
  }
}
