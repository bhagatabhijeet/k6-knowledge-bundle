import http from 'k6/http';
import exec from 'k6/execution';
import { sleep, check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  SOAK TEST — steady, typical load for a long time
//
//  Ramp up 5 min → hold 50 VUs for SOAK_DURATION → ramp down 5 min
//
//  The default hold is 4 hours. To try the script quickly, override it:
//    k6 run -e SOAK_DURATION=10m soak-test.js
//
//  Every request is tagged with the hour of the test it was sent in, so
//  you can compare "hour 0" with "hour 3" and see if latency crept up.
// ─────────────────────────────────────────────────────────────

const SOAK_DURATION = __ENV.SOAK_DURATION || '4h';

export const options = {
  // Response bodies are not inspected here — dropping them saves memory
  // on the load generator, which matters over many hours
  discardResponseBodies: true,

  stages: [
    { duration: '5m',          target: 50 }, // ramp up → typical load
    { duration: SOAK_DURATION, target: 50 }, // hold — this is the "soak"
    { duration: '5m',          target: 0  }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],

    // Sub-metric thresholds: the last hour must be as fast as the first.
    // If a leak slows the system down, hour 3 fails while hour 0 passes.
    'http_req_duration{hour:0}': ['p(95)<500'],
    'http_req_duration{hour:3}': ['p(95)<500'],
  },
};

export default function () {
  // Whole hours elapsed since the test started (currentTestRunDuration is in ms)
  const hour = Math.floor(exec.instance.currentTestRunDuration / 3_600_000);

  const res = http.get('https://test.k6.io', {
    tags: { hour: String(hour) },
  });

  check(res, { 'status is 200': (r) => r.status === 200 });

  sleep(1); // think time
}
