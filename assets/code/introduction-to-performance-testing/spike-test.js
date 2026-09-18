import http from 'k6/http';
import { sleep, check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  SPIKE TEST — a sudden, extreme surge, then back to normal
//
//  Stage 1 (  1 min) : ramp up   0 → 100 VUs   (warm-up)
//  Stage 2 (  3 min) : hold     100 VUs         (baseline — normal behaviour)
//  Stage 3 ( 10 sec) : SPIKE   100 → 1000 VUs   (the surge — note the tiny duration)
//  Stage 4 (  2 min) : hold    1000 VUs         (sustain the surge)
//  Stage 5 ( 10 sec) : drop    1000 → 100 VUs   (surge ends abruptly)
//  Stage 6 (  3 min) : hold     100 VUs         (recovery — does it return to baseline?)
//  Stage 7 (  1 min) : ramp down 100 → 0 VUs
//
//  Total: ≈ 10 min 20 sec
//
//  Run with:
//    k6 run spike-test.js
// ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '1m',  target: 100  }, // warm-up
    { duration: '3m',  target: 100  }, // baseline
    { duration: '10s', target: 1000 }, // ⚡ spike — almost instant
    { duration: '2m',  target: 1000 }, // sustain the surge
    { duration: '10s', target: 100  }, // surge ends
    { duration: '3m',  target: 100  }, // recovery — the most important stage
    { duration: '1m',  target: 0    }, // cool-off
  ],
  thresholds: {
    // Looser than a load test: some degradation during a spike is acceptable
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.10'],
  },
};

export default function () {
  // 👇 Replace with a hot endpoint — the page or API a real surge would hit
  const res = http.get('https://test.k6.io');

  check(res, {
    'status is 200':          (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
