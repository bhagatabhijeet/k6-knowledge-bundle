import { Trend } from 'k6/metrics';

// ─────────────────────────────────────────────────────────────
//  PERCENTILE MATH DEMO — the ten easy numbers from the guide
//
//  Ten requests that took 100, 200, 300 … 1000 milliseconds.
//  Check the guide's hand-worked answers against what k6 prints:
//
//    min = 100   p(25) = 325   median = 550   average = 550
//    p(75) = 775   p(90) = 910   p(95) ≈ 955   p(99) = 991   max = 1000
//
//  Run with:
//    k6 run percentile-math-demo.js
// ─────────────────────────────────────────────────────────────

const ten = new Trend('ten_requests', true); // true = the values are times (ms)

export const options = {
  vus: 1,
  iterations: 1,
  // ask k6 to print exactly the statistics we are studying
  summaryTrendStats: ['min', 'p(25)', 'med', 'avg', 'p(75)', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  for (let ms = 100; ms <= 1000; ms += 100) {
    ten.add(ms); // one request that took `ms` milliseconds
  }
}
