export function touchdown(team, x) {
  return team === 0 ? x >= 738 : x <= 62;
}
export function nextDown(down, incomplete, spot, start) {
  return { down: down + 1, spot: incomplete ? start : spot, turnover: down >= 4 };
}
export function winner(scores) {
  return scores.findIndex(score => score >= 3);
}

export const ROUTE_NAMES = ['GO', 'SLANT', 'OUT', 'CURL', 'POST', 'CROSS'];

export function createRoute(name, x, y, direction) {
  const inward = y < 280 ? 1 : -1;
  const shapes = {
    GO: [[360, 0]],
    SLANT: [[65, 0], [180, inward * 110], [360, inward * 110]],
    OUT: [[100, 0], [100, -inward * 35], [350, -inward * 35]],
    CURL: [[125, 0], [92, inward * 24]],
    POST: [[110, 0], [270, inward * 125], [360, inward * 125]],
    CROSS: [[45, 0], [65, inward * 220], [340, inward * 220]],
  };
  return { name, index: 0, points: shapes[name].map(([dx, dy]) => ({
    x: Math.max(30, Math.min(770, x + direction * dx)),
    y: Math.max(115, Math.min(445, y + dy)),
  })) };
}

// Used for both receiver movement and pass leading; prediction never advances
// the actual route. Consume each leg exactly, even when a frame crosses a cut.
export function advanceRoute(route, x, y, travel) {
  let index = route.index;
  while (index < route.points.length) {
    const point = route.points[index], dx = point.x - x, dy = point.y - y;
    const length = Math.hypot(dx, dy);
    if (length > travel) {
      x += dx / length * travel; y += dy / length * travel;
      break;
    }
    x = point.x; y = point.y; travel -= length; index++;
  }
  return { x, y, index };
}
