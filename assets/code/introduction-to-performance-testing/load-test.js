import http from 'k6/http';
import { sleep, check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  LOAD TEST — realistic 35-minute traffic pattern
//
//  Stage 1 ( 5 min) : ramp up   0 → 50  VUs  (normal load)
//  Stage 2 (10 min) : hold     50 VUs         (baseline)
//  Stage 3 ( 5 min) : ramp up  50 → 100 VUs  (peak load)
//  Stage 4 (10 min) : hold    100 VUs         (pressure check)
//  Stage 5 ( 5 min) : ramp down 100 → 0 VUs  (graceful cool-off)
//
//  Thresholds (your SLA — test fails if these are breached):
//    p(95) response time < 500 ms
//    error rate          < 1%
//
//  Run with:
//    k6 run load-test.js
// ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '5m',  target: 50  }, // ramp up  → normal load (50 VUs)
    { duration: '10m', target: 50  }, // hold       normal load — observe steady state
    { duration: '5m',  target: 100 }, // ramp up  → peak load (100 VUs)
    { duration: '10m', target: 100 }, // hold       peak load — observe under pressure
    { duration: '5m',  target: 0   }, // ramp down → graceful cool-off
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must finish under 500 ms
    http_req_failed:   ['rate<0.01'], // error rate must stay below 1%
  },
};

export default function () {
  // 👇 Replace with your application's end-to-end user journey
  //    e.g. login → browse → add to cart → place order
  const res = http.get('https://test.k6.io');

  // Check every response — don't just fire-and-forget
  check(res, {
    'status is 200':         (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // think time — real users pause between actions
}
