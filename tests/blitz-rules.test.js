import test from "node:test";
import assert from "node:assert/strict";
import { touchdown, nextDown, winner, ROUTE_NAMES, createRoute, advanceRoute } from "../frontend/blitz-rules.js";
test("touchdowns require the opposing end zone",()=>{
  assert.equal(touchdown(0,740),true);assert.equal(touchdown(0,50),false);
  assert.equal(touchdown(1,50),true);assert.equal(touchdown(1,740),false);
});
test("incompletions preserve the snap spot and fourth down turns over",()=>{
  assert.deepEqual(nextDown(2,true,400,160),{down:3,spot:160,turnover:false});
  assert.deepEqual(nextDown(4,false,400,160),{down:5,spot:400,turnover:true});
  assert.equal(winner([2,2]),-1);assert.equal(winner([3,2]),0);assert.equal(winner([1,3]),1);
});


test("routes mirror for both teams and stay on the field near either end zone", () => {
  for (const name of ROUTE_NAMES) {
    const right = createRoute(name, 200, 150, 1);
    const left = createRoute(name, 600, 410, -1);
    right.points.forEach((p, i) => {
      assert.equal(p.x + left.points[i].x, 800);
      assert.equal(p.y + left.points[i].y, 560);
    });
    for (const direction of [-1, 1]) for (const x of [30, 770]) {
      const route = createRoute(name, x, 150, direction);
      for (const p of route.points) {
        assert.ok(p.x >= 30 && p.x <= 770 && p.y >= 115 && p.y <= 445);
      }
      const finish = advanceRoute(route, x, 150, 10000);
      assert.equal(finish.index, route.points.length);
      assert.equal(finish.x, route.points.at(-1).x);
      assert.equal(finish.y, route.points.at(-1).y);
    }
  }
});

test("a receiver cuts across the field, then stops at a completed curl without oscillating", () => {
  const cross = createRoute('CROSS', 200, 150, 1);
  const turn = advanceRoute(cross, 200, 150, 100);
  assert.ok(turn.y > 150);
  assert.equal(turn.index, 1);
  assert.equal(cross.index, 0);
  const curl = createRoute('CURL', 200, 150, 1);
  const end = advanceRoute(curl, 200, 150, 1000);
  curl.index = end.index;
  assert.deepEqual(advanceRoute(curl, end.x, end.y, 100), end);
});
