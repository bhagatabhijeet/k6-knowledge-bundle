import http from 'k6/http';
import { sleep } from 'k6';

// ─────────────────────────────────────────────────────────────
//  STAGES — ramp up, hold, ramp down (a realistic, gradual load)
//
//    stage 1:  4 s   → reach 2 users   (ramp up)
//    stage 2:  5 s   → reach 5 users   (ramp up further, then the peak)
//    stage 3:  3 s   → reach 0 users   (ramp down)
//
//  "target" is where the user count ENDS at the end of the stage — not
//  extra users. 2 → 5 adds three users, it does not add five.
//  Total test time: 4 + 5 + 3 = 12 seconds (plus a moment for the last
//  iterations to finish — k6's "graceful ramp down").
//
//  Run with:
//    k6 run stages-demo.js
// ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '4s', target: 2 }, // ramp up   → 2 users over 4 seconds
    { duration: '5s', target: 5 }, // ramp up   → 5 users over the next 5 seconds
    { duration: '3s', target: 0 }, // ramp down → 0 users over the last 3 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% of requests under 400 ms
    http_req_failed: ['rate<0.1'],    // fewer than 10% of requests may fail
  },
};

export default function () {
  http.get('https://quickpizza.grafana.com/');
  sleep(1); // think time — one second between iterations
}
