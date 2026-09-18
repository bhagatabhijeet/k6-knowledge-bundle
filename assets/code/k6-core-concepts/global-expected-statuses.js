import http from 'k6/http';

// ─────────────────────────────────────────────────────────────
//  GLOBAL EXPECTED STATUSES — one rule for the whole test
//
//  http.setResponseCallback() changes what "expected" means for EVERY
//  request in the script. Here: any 2xx, plus 404 (we are probing for
//  missing pages on purpose).
//
//  Result: the 302 redirect below is now NOT expected → counts as failed.
//
//  Run with:
//    k6 run global-expected-statuses.js
//  Look for:  http_req_failed = 33.33% (1 out of 3)
// ─────────────────────────────────────────────────────────────

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 404));

export const options = { vus: 1, iterations: 1 };

export default function () {
  http.get('https://quickpizza.grafana.com/');                 // 200 → expected
  http.get('https://quickpizza.grafana.com/does-not-exist');   // 404 → expected (we listed it)
  http.get('https://test.k6.io/', { redirects: 0 });           // 302 → outside 200–299 → FAILED
}
