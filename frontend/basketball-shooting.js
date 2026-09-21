// Accuracy is highest within roughly 80 ms of the jump apex.
export function shotAccuracy(player) {
  if (player.onGround) return .25;
  return .3 + .6 * Math.max(0, 1 - Math.abs(player.vy) / 300);
}

export function shotOffset(player, random = Math.random) {
  const accurate = random() < shotAccuracy(player);
  const direction = random() < .5 ? -1 : 1;
  return direction * (accurate ? random() * 14 : 48 + random() * 65);
}
