import http from 'k6/http';
import { sleep } from 'k6';

// ─────────────────────────────────────────────────────────────
//  ABORT ON FAIL — stop the test as soon as a goal is lost
//
//  The threshold below is impossible on purpose (p95 < 1 ms). After the
//  3-second grace period (delayAbortEval) k6 sees it is crossed and stops
//  the run immediately instead of loading the system for the full 30 s.
//
//  Run with:
//    k6 run abort-on-fail.js
//  Watch for: "…abortOnFail enabled, stopping test prematurely" and exit code 99.
// ─────────────────────────────────────────────────────────────

export const options = {
  vus: 2,
  duration: '30s',
  thresholds: {
    http_req_duration: [
      {
        threshold: 'p(95)<1', // impossible on purpose
        abortOnFail: true,    // stop the whole test when this is crossed
        delayAbortEval: '3s', // wait 3 s first so k6 has enough samples to judge fairly
      },
    ],
  },
};

export default function () {
  http.get('https://quickpizza.grafana.com/');
  sleep(0.3);
}
