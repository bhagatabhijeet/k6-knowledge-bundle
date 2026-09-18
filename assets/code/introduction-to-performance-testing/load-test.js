import http from 'k6/http';
import { sleep, check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  LOAD TEST
//  Purpose : validate system performance under normal and peak
//            concurrent user counts
//
//  Stages  :
//    1. Ramp up to normal load  (50 VUs over 2 min)
//    2. Hold normal load        (50 VUs for 5 min)  ← steady-state baseline
//    3. Ramp up to peak load    (100 VUs over 2 min)
//    4. Hold peak load          (100 VUs for 5 min) ← pressure check
//    5. Ramp down               (0 VUs over 2 min)
//
//  Thresholds (pass/fail SLA):
//    - 95th-percentile response time < 500 ms
//    - Error rate < 1%
//
//  Run with:
//    k6 run load-test.js
// ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // ramp up → normal load
    { duration: '5m', target: 50 },  // hold    → normal load (baseline)
    { duration: '2m', target: 100 }, // ramp up → peak load
    { duration: '5m', target: 100 }, // hold    → peak load
    { duration: '2m', target: 0 },   // ramp down → cool off
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must finish under 500 ms
    http_req_failed:   ['rate<0.01'], // error rate must stay below 1%
  },
};

export default function () {
  // 👇 Replace with your application's end-to-end user journey
  const res = http.get('https://test.k6.io');

  // Verify the response at each step — don't just fire-and-forget
  check(res, {
    'status is 200':        (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // think time — real users pause between actions
}
