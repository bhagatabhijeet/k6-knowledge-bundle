import http from 'k6/http';
import { check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  SPIKE TEST — arrival-rate version (requests per second)
//
//  `stages` on their own drive the number of VUs. A real surge is really
//  "requests arriving per second", regardless of how slow the system gets.
//  The ramping-arrival-rate executor models exactly that: k6 keeps starting
//  new iterations at the target rate, borrowing VUs from a pool as needed.
//
//  Run with:
//    k6 run spike-test-arrival-rate.js
// ─────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 20,          // begin at 20 iterations…
      timeUnit: '1s',         // …per second
      preAllocatedVUs: 200,   // VUs ready at start
      maxVUs: 2000,           // ceiling — if the system slows down k6 needs more VUs
      stages: [
        { target: 20,  duration: '3m'  }, // baseline: 20 iterations/s
        { target: 400, duration: '10s' }, // ⚡ spike: 20 → 400 iterations/s
        { target: 400, duration: '2m'  }, // sustain
        { target: 20,  duration: '10s' }, // surge ends
        { target: 20,  duration: '3m'  }, // recovery
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.10'],
    dropped_iterations: ['count<100'], // k6 could not start iterations fast enough
  },
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  // No sleep() — the executor controls the arrival rate, not think time
}
