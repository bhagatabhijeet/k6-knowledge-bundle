import http from 'k6/http';
import { sleep, check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  STRESS TEST — push beyond normal capacity until something breaks
//
//  Known capacity: normal = 50 VUs, peak = 100 VUs (from the load test)
//
//  Step 1 ( 2 min ramp + 2 min hold) : 100 VUs  (peak load — known good)
//  Step 2 ( 2 min ramp + 2 min hold) : 200 VUs  (2× peak)
//  Step 3 ( 2 min ramp + 2 min hold) : 300 VUs  (3× peak)
//  Step 4 ( 2 min ramp + 2 min hold) : 400 VUs  (4× peak)
//  Step 5 ( 2 min ramp + 2 min hold) : 500 VUs  (5× peak)
//  Recovery ( 5 min)                 : 500 → 0 VUs  (can the system recover?)
//
//  Total: 25 minutes.
//
//  Thresholds: the same SLA as the load test. The step where these first
//  start failing is where your system begins to degrade.
//
//  Run with:
//    k6 run stress-test.js
// ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // ramp up → peak load
    { duration: '2m', target: 100 }, // hold      peak load (known good baseline)
    { duration: '2m', target: 200 }, // ramp up → beyond peak
    { duration: '2m', target: 200 }, // hold
    { duration: '2m', target: 300 }, // ramp up → higher stress
    { duration: '2m', target: 300 }, // hold
    { duration: '2m', target: 400 }, // ramp up → even higher
    { duration: '2m', target: 400 }, // hold
    { duration: '2m', target: 500 }, // ramp up → maximum stress
    { duration: '2m', target: 500 }, // hold      — expect degradation or failure here
    { duration: '5m', target: 0   }, // ramp down → observe recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1 s
    http_req_failed:   ['rate<0.05'],  // error rate under 5%
  },
};

export default function () {
  // 👇 Replace with your application's end-to-end user journey
  //    e.g. login → browse → add to cart → place order
  const res = http.get('https://test.k6.io');

  // Under stress, failures are expected — the checks tell you *what* failed
  check(res, {
    'status is 200':          (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1); // think time — real users pause between actions
}
