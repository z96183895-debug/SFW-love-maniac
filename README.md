# The Last Promise

A standalone, strictly SFW, Undertale-inspired 1v1 Chara encounter. Everything shipped here—code, dialogue, pixel drawing, attack patterns, and synthesized sound cues—is original to this prototype. No assets, dialogue, or code were taken from the uploaded game. This is an unofficial fan prototype, not an official Undertale release.

## Play locally

Requires **Node.js 20 or newer** and a modern browser. There are no package dependencies, downloads, credentials, or external services.

```sh
cd /workspace/SFW-love-maniac
npm start
```

Open the server on port **3000** in your local development environment. `PORT=4000 npm start` selects a different port. `npm run dev` watches the server; refresh the browser after client changes. A static web server can also serve this folder. Opening `index.html` directly as a file is unsupported because the game uses ES modules.

## Controls

| Input | Action |
| --- | --- |
| Arrows / WASD | Move during attacks; select menu entries between turns |
| Z / Enter / Space | Confirm; stop the FIGHT marker |
| X / Escape | Return from a submenu |
| Shift | Move slowly for precise dodging |
| P | Pause / resume |
| M | Toggle original synthesized sound cues |
| Mouse / touch | Select commands, items, and Continue; tap the FIGHT meter to strike |
| Touch arrows / drag canvas | Move during attacks |

Sound starts off. The game automatically pauses an attack when the browser loses focus. Reduced-motion preferences disable decorative movement and flashing; projectiles continue moving as required for gameplay. Keyboard and touch movement share the same speed limit.

## The encounter

- **FIGHT** opens a timing meter. Confirm near its center for up to 44 damage. A missed timing window resolves as a glancing strike, so turns never stall.
- **ACT** offers Listen, Remember, and Breathe. Each builds trust. Breathe also restores 3 HP.
- **ITEM** contains two Ember teas (+16 HP each) and one Star bread (+26 HP). Full-health use preserves the item and your turn.
- **MERCY** ends the encounter peacefully at 100% trust after at least five completed attack turns. An early offer builds a little trust and continues the encounter.
- Survive the incoming pattern after every action. Hits cost 3 / 4 / 5 HP by phase, followed by roughly one second of invulnerability. Defeat offers a complete restart.
- Reduce Chara's 180 HP to zero for a combat victory. Both endings are non-graphic and have original dialogue.

Three phases increase intensity as turns pass or boss HP falls. Six attacks rotate in order: **Falling embers**, **Pendulum**, **Compass rose**, **Crosscurrent**, **Afterimage**, and **Paper garden**. Marked lanes are harmless until they light up; they lock onto your position when placed, so move out before the beam fires.

## Validate

```sh
npm test
```

The existing test suite covers 28 cases: movement limits, damage and invulnerability, healing inventory, action sequencing, FIGHT timing, all three endings, phases, pause/reset, and each of the six patterns across three phases. On runners that group Node's child-process test output, `node tests/game.test.js` displays each case individually.

The prototype was also exercised in headless Chromium for actual UI startup, keyboard movement, pause, sound, collisions, item use, all endings, and narrow/mobile layouts. Route tests isolate wave survival from human dexterity; they are not a claim that a human playthrough was completed.

## Files

- `src/game.js`: deterministic battle state, rules, and collision detection.
- `src/patterns.js`: six time-based original bullet patterns and beam telegraphs.
- `src/render.js`: procedural canvas scenery and pixel character drawing.
- `src/main.js`: browser controls, DOM interface, animation loop, and optional audio.
- `index.html`, `style.css`: responsive interface and touch controls.
- `server.js`: small dependency-free development server.

The uploaded `The Game.zip` exceeded the file tool's 32 MiB transfer limit and was not opened, extracted, or included. This project is an independent implementation, rather than an edited or sanitized copy of that archive.
