export function touchdown(team, x) {
  return team === 0 ? x >= 738 : x <= 62;
}
export function nextDown(down, incomplete, spot, start) {
  return { down: down + 1, spot: incomplete ? start : spot, turnover: down >= 4 };
}
export function winner(scores) {
  return scores.findIndex(score => score >= 3);
}
