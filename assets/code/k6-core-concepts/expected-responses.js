import http from 'k6/http';
import { check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  EXPECTED RESPONSES — which HTTP statuses count as "failed"?
//
//  By default k6 treats status 200–399 as EXPECTED. Anything else
//  (404, 500, …) is a FAILED request and raises http_req_failed.
//
//  Three requests, three outcomes:
//    1) GET /                 → 200  expected         → not failed
//    2) GET /does-not-exist   → 404  NOT expected     → FAILED
//    3) the same 404 URL, but we say "404 is expected here" → not failed
//
//  Run with:
//    k6 run expected-responses.js
//  Look for:  http_req_failed = 33.33% (1 out of 3)
//             and the extra { expected_response:true } line under http_req_duration
// ─────────────────────────────────────────────────────────────

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    // fails the test if more than half the requests fail
    http_req_failed: ['rate<0.5'],
    // response times, judged on EXPECTED responses only (a sub-metric)
    'http_req_duration{expected_response:true}': ['p(95)<800'],
  },
};

export default function () {
  // 1) a normal page — 200 is inside the default expected range
  const ok = http.get('https://quickpizza.grafana.com/');

  // 2) a missing page — 404 is NOT expected by default, so it counts as failed
  const missing = http.get('https://quickpizza.grafana.com/does-not-exist');

  // 3) same missing page, but for THIS request we declare 404 to be expected
  const expected404 = http.get('https://quickpizza.grafana.com/does-not-exist', {
    responseCallback: http.expectedStatuses(404),
  });

  console.log(`statuses: ${ok.status} ${missing.status} ${expected404.status}`);

  // A check is separate: it can pass even though http_req_failed counted the request
  check(missing, {
    'missing page is 404': (r) => r.status === 404,
  });
}
