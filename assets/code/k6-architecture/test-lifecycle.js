import http from 'k6/http';
import { check, sleep } from 'k6';

// ─────────────────────────────────────────────────────────────
//  TEST LIFECYCLE — the four stages k6 runs your script through
//
//  1. init      : top-level code, runs once for EACH VU (each VU has its own runtime)
//                 — plus a few extra times while k6 itself starts up
//  2. setup()   : runs ONCE per test, before any VU starts
//  3. default() : the VU code — runs over and over, once per iteration
//  4. teardown(): runs ONCE per test, after all VUs have finished
//
//  Run with:
//    k6 run test-lifecycle.js
//
//  Watch the console: "init" prints more than once (at least once per VU,
//  plus k6's own startup runs), setup and teardown print exactly once, and
//  "iteration" prints once per iteration.
// ─────────────────────────────────────────────────────────────

export const options = {
  vus: 3,
  iterations: 6,
};

// 1) INIT — imports, options and top-level code. No HTTP requests allowed here.
console.log('init      : script loaded (runs for every VU)');

// 2) SETUP — once per test. HTTP is allowed. Whatever you return is passed
//    to default() and teardown() as `data`.
export function setup() {
  console.log('setup     : runs once, before the load starts');
  const res = http.get('https://test.k6.io');
  return { startedWithStatus: res.status };
}

// 3) VU CODE — this function is your test. k6 calls it repeatedly.
export default function (data) {
  const res = http.get('https://test.k6.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  console.log(`iteration : setup returned status ${data.startedWithStatus}`);
  sleep(1);
}

// 4) TEARDOWN — once per test, after the last iteration.
export function teardown(data) {
  console.log('teardown  : runs once, after the load ends');
}
