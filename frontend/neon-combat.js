// Browser-local combat simulation. Coordinates use the 400 × 280 pixel playfield.
export const FLOOR = 232;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function createGame() {
  return { player: { x: 200, y: FLOOR, vy: 0, facing: 1, hp: 100, focus: 100, ammo: 6,
    jumps: 0, invulnerable: 0, dodge: 0, dodgeCooldown: 0, cooldown: 0, pose: '', poseTime: 0 },
    enemies: [], bullets: [], effects: [], events: [], wave: 0, remaining: 0, spawnTime: 0,
    intermission: 1.5, score: 0, combo: 0, comboTime: 0, time: 0, slow: false, status: 'playing', nextId: 0 };
}
function effect(game, x, y, color, text = '') {
  game.effects.push({ x, y, color, text, life: .5, maxLife: .5 });
}
function damageEnemy(game, enemy, damage, direction) {
  if (enemy.hp <= 0) return;
  enemy.hp -= damage;
  enemy.x = clamp(enemy.x + direction * 9, 14, 386);
  enemy.stun = .25;
  effect(game, enemy.x, enemy.y - 14, '#ffdc88');
  game.events.push('hit');
  if (enemy.hp <= 0) {
    game.combo++;
    game.comboTime = 3;
    const points = 100 * Math.min(game.combo, 8);
    game.score += points;
    game.player.focus = Math.min(100, game.player.focus + 18);
    effect(game, enemy.x, enemy.y - 30, '#7fffea', `+${points}`);
    game.events.push('kill');
  }
}
function damagePlayer(game, damage, direction) {
  const p = game.player;
  if (p.invulnerable > 0 || p.dodge > 0 || p.hp <= 0) return;
  p.hp = Math.max(0, p.hp - damage);
  p.invulnerable = .7;
  p.x = clamp(p.x + direction * 10, 14, 386);
  game.combo = 0;
  effect(game, p.x, p.y - 14, '#ff638e');
  game.events.push('hurt');
  if (!p.hp) game.status = 'lost';
}
export function action(game, name) {
  if (game.status !== 'playing' || game.intermission > 0) return false;
  const p = game.player;
  if (name === 'jump' && p.jumps < 2 && p.dodge <= 0) {
    p.vy = p.jumps ? -185 : -225; p.jumps++; game.events.push('jump'); return true;
  }
  if (name === 'dodge' && p.dodgeCooldown <= 0 && p.y === FLOOR) {
    p.dodge = .32; p.dodgeCooldown = 1.2; game.events.push('dodge'); return true;
  }
  if (p.cooldown > 0 || p.dodge > 0) return false;
  if (name === 'punch' || name === 'kick') {
    const kick = name === 'kick';
    p.cooldown = kick ? .48 : .25; p.poseTime = kick ? .25 : .15; p.pose = name;
    const reach = kick ? 43 : 29;
    for (const enemy of game.enemies) {
      const dx = (enemy.x - p.x) * p.facing;
      if (dx >= -6 && dx <= reach && Math.abs(enemy.y - p.y) < 27) damageEnemy(game, enemy, kick ? 30 : 18, p.facing);
    }
    game.events.push('swing'); return true;
  }
  if (name === 'shoot' && p.ammo >= 1) {
    p.ammo--; p.cooldown = .3; p.pose = 'shoot'; p.poseTime = .18;
    game.bullets.push({ x: p.x + p.facing * 12, y: p.y - 17, vx: p.facing * 290, vy: 0, friendly: true });
    game.events.push('shot'); return true;
  }
  return false;
}
// Swept collision avoids bullets skipping a fighter between frames.
export function segmentHits(x0, y0, x1, y1, target) {
  let low = 0, high = 1;
  for (const [start, delta, min, max] of [[x0, x1 - x0, target.x - 8, target.x + 8], [y0, y1 - y0, target.y - 27, target.y]]) {
    if (Math.abs(delta) < .00001) { if (start < min || start > max) return false; }
    else {
      const a = (min - start) / delta, b = (max - start) / delta;
      low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b));
      if (low > high) return false;
    }
  }
  return true;
}
export function step(game, elapsed, input = {}) {
  if (game.status !== 'playing') return;
  const dt = clamp(elapsed, 0, .04), p = game.player;
  game.time += dt;
  game.slow = !!input.slow && p.focus > 1 && game.intermission <= 0;
  const worldDt = dt * (game.slow ? .23 : 1), playerDt = dt * (game.slow ? .8 : 1);
  p.focus = clamp(p.focus + (game.slow ? -30 : 13) * dt, 0, 100);
  p.ammo = Math.min(6, p.ammo + dt * .65);
  for (const key of ['invulnerable', 'dodge', 'dodgeCooldown', 'cooldown', 'poseTime']) p[key] = Math.max(0, p[key] - playerDt);
  game.comboTime -= dt;
  if (game.comboTime <= 0) game.combo = 0;
  for (const e of game.effects) e.life -= dt;
  game.effects = game.effects.filter(e => e.life > 0);
  if (game.intermission > 0) {
    game.intermission -= dt;
    if (game.intermission <= 0) {
      game.wave++; game.remaining = 2 + game.wave; game.spawnTime = 0;
      game.events.push('wave');
    }
    return;
  }
  const movement = clamp(input.move || 0, -1, 1);
  if (p.dodge <= 0 && movement) p.facing = Math.sign(movement);
  p.x = clamp(p.x + (p.dodge > 0 ? p.facing * 235 : movement * 105) * playerDt, 14, 386);
  p.vy += 580 * playerDt; p.y += p.vy * playerDt;
  if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.jumps = 0; }
  game.spawnTime -= worldDt;
  if (game.remaining > 0 && game.spawnTime <= 0 && game.enemies.length < 4) {
    const id = game.nextId++;
    game.enemies.push({ id, x: id % 2 ? 384 : 16, y: FLOOR, hp: 48 + game.wave * 5,
      maxHp: 48 + game.wave * 5, kind: id % 3 === 2 ? 'gunner' : 'brawler', facing: 1,
      cooldown: .9, windup: 0, stun: 0, attack: '' });
    game.remaining--; game.spawnTime = 1.5;
  }
  for (const e of game.enemies) {
    if (e.hp <= 0) continue;
    e.stun = Math.max(0, e.stun - worldDt); e.cooldown -= worldDt;
    e.facing = p.x < e.x ? -1 : 1;
    if (e.stun > 0) { e.windup = 0; continue; }
    const dx = Math.abs(p.x - e.x);
    if (e.windup > 0) {
      e.windup -= worldDt;
      if (e.windup <= 0) {
        if (e.attack === 'shoot') {
          const deltaX = p.x - e.x, deltaY = p.y - e.y, length = Math.hypot(deltaX, deltaY) || 1;
          game.bullets.push({ x: e.x + e.facing * 12, y: e.y - 17,
            vx: deltaX / length * 135, vy: deltaY / length * 135, friendly: false });
          game.events.push('enemyShot');
        } else if (dx < 31 && Math.abs(p.y - e.y) < 26) damagePlayer(game, 10, e.facing);
        e.cooldown = e.kind === 'gunner' ? 1.7 : .8;
      }
    } else if (e.cooldown <= 0 && (e.kind === 'gunner' || dx < 25)) {
      e.attack = e.kind === 'gunner' ? 'shoot' : 'punch'; e.windup = e.kind === 'gunner' ? .7 : .38;
    } else {
      const direction = e.kind === 'gunner' ? (dx < 90 ? -e.facing : dx > 150 ? e.facing : 0) : dx > 22 ? e.facing : 0;
      e.x = clamp(e.x + direction * (28 + game.wave * 3) * worldDt, 14, 386);
    }
  }
  for (const b of game.bullets) {
    const x = b.x, y = b.y;
    b.x += b.vx * worldDt; b.y += b.vy * worldDt;
    const targets = b.friendly ? game.enemies.filter(e => e.hp > 0).sort((a, c) => Math.abs(a.x - x) - Math.abs(c.x - x)) : [p];
    for (const target of targets) {
      if (segmentHits(x, y, b.x, b.y, target)) {
        // Rolling under a bullet lets it continue past the player.
        if (!b.friendly && p.dodge > 0) continue;
        if (b.friendly) damageEnemy(game, target, 22, Math.sign(b.vx));
        else damagePlayer(game, 12, Math.sign(b.vx));
        b.dead = true; break;
      }
    }
  }
  game.bullets = game.bullets.filter(b => !b.dead && b.x > -20 && b.x < 420 && b.y > -20 && b.y < 260);
  game.enemies = game.enemies.filter(e => e.hp > 0);
  if (game.status === 'playing' && !game.remaining && !game.enemies.length) {
    game.bullets = [];
    if (game.wave === 5) { game.status = 'won'; game.score += p.hp * 10; }
    else { game.intermission = 2; p.hp = Math.min(100, p.hp + 18); }
  }
}
