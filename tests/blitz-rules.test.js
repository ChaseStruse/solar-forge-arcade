import test from "node:test";
import assert from "node:assert/strict";
import { touchdown, nextDown, winner } from "../frontend/blitz-rules.js";
test("touchdowns require the opposing end zone",()=>{
  assert.equal(touchdown(0,740),true);assert.equal(touchdown(0,50),false);
  assert.equal(touchdown(1,50),true);assert.equal(touchdown(1,740),false);
});
test("incompletions preserve the snap spot and fourth down turns over",()=>{
  assert.deepEqual(nextDown(2,true,400,160),{down:3,spot:160,turnover:false});
  assert.deepEqual(nextDown(4,false,400,160),{down:5,spot:400,turnover:true});
  assert.equal(winner([2,2]),-1);assert.equal(winner([3,2]),0);assert.equal(winner([1,3]),1);
});
