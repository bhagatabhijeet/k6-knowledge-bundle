import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

// ─────────────────────────────────────────────────────────────
//  THRESHOLDS — pass/fail goals on any metric, one example per metric type
//
//    Counter → count / rate     Gauge → value
//    Rate    → rate             Trend → avg, min, max, med, p(N)
//
//  Run with:
//    k6 run thresholds-demo.js             → all thresholds pass, exit code 0
//    k6 run -e BREAK=1 thresholds-demo.js  → one impossible goal (p95 < 1 ms):
//                                            ✗ crossed, exit code 99
//
//  Check the exit code:  echo $?   (macOS / Linux / Git Bash)
//                        $LASTEXITCODE   (PowerShell)
// ─────────────────────────────────────────────────────────────

const pizzasRequested = new Counter('pizzas_requested'); // Counter — only goes up
const lastBodySize = new Gauge('last_body_size');        // Gauge   — remembers the latest value
const goodResponses = new Rate('good_responses');        // Rate    — share of "true" values (0–1)
const pageTime = new Trend('page_time', true);           // Trend   — many values, summarised (true = times)

export const options = {
  vus: 2,
  iterations: 4,
  thresholds: {
    // built-in Trend: 95% of requests must finish under 800 ms.
    // With -e BREAK=1 the goal becomes impossible on purpose, so you can watch a ✗ and exit code 99.
    http_req_duration: [__ENV.BREAK ? 'p(95)<1' : 'p(95)<800'],

    http_req_failed: ['rate<0.1'], // built-in Rate: fewer than 10% of requests may fail
    checks: ['rate>0.9'],          // built-in Rate: more than 90% of checks must pass

    // a SUB-METRIC: only requests tagged name:home — and TWO rules that must BOTH hold
    'http_req_duration{name:home}': ['p(95)<800', 'avg<800'],

    // one goal per custom metric type
    pizzas_requested: ['count>=4'],       // Counter
    last_body_size: ['value>0'],          // Gauge
    good_responses: ['rate>0.9'],         // Rate
    page_time: ['med<800', 'p(99)<1000'], // Trend
  },
};

export default function () {
  const res = http.get('https://quickpizza.grafana.com/', { tags: { name: 'home' } });

  pizzasRequested.add(1);
  lastBodySize.add(res.body.length);
  goodResponses.add(res.status === 200);
  pageTime.add(res.timings.duration);

  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.2);
}
