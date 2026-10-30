import { PATTERNS, createPattern } from './patterns.js';

export const BOX = Object.freeze({ x: 255, y: 300, w: 390, h: 200 });
export const MAX_HP = 36;
export const BOSS_HP = 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Battle {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.state = 'intro';
    this.paused = false;
    this.hp = MAX_HP;
    this.bossHp = BOSS_HP;
    this.resolve = 0;
    this.turn = 0;
    this.phase = 1;
    this.time = 0;
    this.invulnerable = 0;
    this.hitFlash = 0;
    this.bossFlash = 0;
    this.attackTime = 0;
    this.attackPosition = 0;
    this.pattern = null;
    this.patternName = 'Awaiting your choice';
    this.submenu = null;
    this.pending = null;
    this.ending = null;
    this.items = { tea: 2, bread: 1 };
    this.acts = { listen: 0, remember: 0, breathe: 0 };
    this.soul = { x: BOX.x + BOX.w / 2, y: BOX.y + BOX.h / 2, r: 5 };
    this.dialogue = 'At the edge of a quiet world, one last promise remains.';
    this.event = null;
  }

  start() {
    if (this.state !== 'intro') return;
    this.state = 'menu';
    this.dialogue = 'Chara draws a line across the silence. “Show me what you choose to protect.”';
  }

  get mercyReady() { return this.resolve >= 100 && this.turn >= 5; }
  get options() {
    if (this.submenu === 'act') return [
      { id: 'listen', label: 'Listen', detail: 'Hear what lies beneath the challenge.' },
      { id: 'remember', label: 'Remember', detail: 'Offer a memory of a kinder world.' },
      { id: 'breathe', label: 'Breathe', detail: 'Recover 3 HP. Show patient resolve.' }
    ];
    if (this.submenu === 'item') return [
      { id: 'tea', label: `Ember tea ×${this.items.tea}`, detail: 'Restore 16 HP.', disabled: !this.items.tea },
      { id: 'bread', label: `Star bread ×${this.items.bread}`, detail: 'Restore 26 HP.', disabled: !this.items.bread }
    ];
    if (this.submenu === 'mercy') return [
      { id: 'spare', label: this.mercyReady ? 'Spare Chara' : 'Offer peace', detail: this.mercyReady ? 'The promise can end here.' : `Build trust with ACT, then endure 5 turns. (${this.resolve}% trust)` }
    ];
    return [];
  }

  action(action) {
    if (this.state !== 'menu' || this.paused) return;
    if (action === 'fight') {
      this.submenu = null;
      this.state = 'fight';
      this.attackTime = 0;
      this.attackPosition = 0;
      this.dialogue = 'A single opening. Confirm when the marker meets the center.';
    } else if (['act', 'item', 'mercy'].includes(action)) {
      this.submenu = action;
      this.dialogue = { act: 'A choice can reach farther than a blade.', item: 'Something warm for the road ahead.', mercy: this.mercyReady ? 'Chara lowers their guard. The choice is yours.' : 'Peace takes patience. ACT builds trust; endure at least five turns.' }[action];
    }
  }

  choose(id) {
    if (this.state !== 'menu' || !this.submenu || this.paused) return;
    const option = this.options.find(o => o.id === id);
    if (!option || option.disabled) return;
    if (this.submenu === 'act') {
      this.acts[id]++;
      const gain = { listen: 24, remember: this.acts.listen ? 28 : 20, breathe: 20 }[id];
      this.resolve = clamp(this.resolve + gain, 0, 100);
      if (id === 'breathe') this.hp = Math.min(MAX_HP, this.hp + 3);
      const lines = {
        listen: ['You let the silence speak. Chara’s grip softens. “You’re really staying?”', 'You listen without an answer ready. “I thought no one remembered this place.”'],
        remember: ['You describe a window full of morning light. Chara looks up.', 'You offer a memory with room for both of you. “Maybe there is still a way back.”'],
        breathe: ['You steady your SOUL. The room seems a little less cold.', 'You take another breath. Patience becomes its own kind of courage.']
      };
      this.queueEnemy(lines[id][Math.min(this.acts[id] - 1, 1)]);
    } else if (this.submenu === 'item') {
      if (this.hp === MAX_HP) {
        this.dialogue = 'Your HP is full. Save it for a harder moment.';
        return;
      }
      const restored = Math.min(MAX_HP - this.hp, id === 'tea' ? 16 : 26);
      this.hp += restored;
      this.items[id]--;
      this.event = 'heal';
      this.queueEnemy(`You ${id === 'tea' ? 'sip the ember tea' : 'share a piece of star bread with the silence'}. Recovered ${restored} HP.`);
    } else if (id === 'spare') {
      if (this.mercyReady) this.finish('mercy');
      else {
        this.resolve = clamp(this.resolve + 8, 0, 100);
        this.queueEnemy('You offer an open hand. Chara hesitates. “Give me a reason to believe it will be different.”');
      }
    }
  }

  queueEnemy(text) {
    this.submenu = null;
    this.state = 'dialogue';
    this.pending = 'enemy';
    this.dialogue = text;
  }

  confirm() {
    if (this.paused) return;
    if (this.state === 'intro') this.start();
    else if (this.state === 'fight') this.strike();
    else if (this.state === 'dialogue' && this.pending === 'enemy') this.beginEnemy();
  }

  back() {
    if (this.state === 'menu' && this.submenu) {
      this.submenu = null;
      this.dialogue = 'Your SOUL is steady. What will you do?';
    }
  }

  strike() {
    if (this.state !== 'fight' || this.paused) return;
    const precision = clamp(1 - Math.abs(this.attackPosition - 0.5) * 2, 0, 1);
    const damage = Math.round(14 + precision ** 2 * 30);
    this.bossHp = Math.max(0, this.bossHp - damage);
    this.bossFlash = 0.5;
    this.event = 'strike';
    if (!this.bossHp) { this.finish('victory'); return; }
    this.queueEnemy(`${precision > 0.85 ? 'A precise strike.' : precision > 0.45 ? 'Your strike connects.' : 'A glancing strike.'} ${damage} damage. Chara takes a breath and answers with light.`);
  }

  beginEnemy() {
    this.phase = Math.max(this.turn >= 5 || this.bossHp <= 60 ? 3 : this.turn >= 2 || this.bossHp <= 120 ? 2 : 1, this.phase);
    const patternId = PATTERNS[this.turn % PATTERNS.length].id;
    this.pattern = createPattern(patternId, this.phase, BOX, this.random);
    this.patternName = PATTERNS.find(p => p.id === patternId).name;
    this.soul.x = BOX.x + BOX.w / 2;
    this.soul.y = BOX.y + BOX.h / 2;
    this.invulnerable = 0.65;
    this.state = 'enemy';
    this.pending = null;
    this.dialogue = PATTERNS.find(p => p.id === patternId).description;
    this.event = 'wave';
  }

  damage() {
    if (this.invulnerable > 0 || this.state !== 'enemy') return;
    this.hp = Math.max(0, this.hp - (this.phase + 2));
    this.invulnerable = 1.05;
    this.hitFlash = 0.22;
    this.event = 'damage';
    if (this.hp === 0) this.finish('defeat');
  }

  finish(ending) {
    this.state = 'ending';
    this.submenu = null;
    this.ending = ending;
    this.event = ending;
    this.dialogue = {
      victory: 'The storm breaks. Chara rests their hand at their side. “You made your choice. Make the next one count.”',
      mercy: 'You leave your hand open. This time, Chara takes it. The room fills with the possibility of morning.',
      defeat: 'Your SOUL flickers, but the promise remains. Take a breath. You can try again.'
    }[ending];
  }

  update(delta, input = {}) {
    if (this.paused || this.state === 'intro' || this.state === 'ending') return;
    const dt = Math.max(0, Math.min(delta, 1 / 30));
    this.time += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.bossFlash = Math.max(0, this.bossFlash - dt);
    if (this.state === 'fight') {
      this.attackTime += dt;
      this.attackPosition = Math.min(1, this.attackTime / 1.65);
      if (this.attackTime >= 1.65) this.strike();
    }
    if (this.state !== 'enemy') return;
    const dx = Number(input.right || 0) - Number(input.left || 0);
    const dy = Number(input.down || 0) - Number(input.up || 0);
    const length = Math.max(1, Math.hypot(dx, dy));
    const speed = input.slow ? 105 : 205;
    const s = this.soul;
    s.x = clamp(s.x + dx / length * speed * dt, BOX.x + s.r + 4, BOX.x + BOX.w - s.r - 4);
    s.y = clamp(s.y + dy / length * speed * dt, BOX.y + s.r + 4, BOX.y + BOX.h - s.r - 4);
    this.pattern.update(dt, s);
    for (const bullet of this.pattern.bullets) {
      if (Math.hypot(s.x - bullet.x, s.y - bullet.y) < s.r + bullet.r) this.damage();
    }
    for (const w of this.pattern.warnings) {
      if (w.active && s.x + s.r > w.x && s.x - s.r < w.x + w.w && s.y + s.r > w.y && s.y - s.r < w.y + w.h) this.damage();
    }
    if (this.state === 'enemy' && this.pattern.done) {
      this.turn++;
      this.resolve = Math.min(100, this.resolve + 4);
      this.state = 'menu';
      this.dialogue = this.mercyReady ? 'The storm has quieted. Chara is ready to listen. MERCY is available.' : ['Your SOUL holds its ground. Choose your next step.', 'Beyond the falling light, Chara waits for your answer.', 'Every choice leaves a small light behind.'][this.turn % 3];
      this.event = 'turn';
    }
  }
}
