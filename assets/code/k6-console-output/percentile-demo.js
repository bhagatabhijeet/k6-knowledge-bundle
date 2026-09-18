import { Trend } from 'k6/metrics';

// ─────────────────────────────────────────────────────────────
//  PERCENTILE DEMO — see how avg, median, p(90) and p(95) are computed
//
//  We feed k6 twenty KNOWN response times (in milliseconds) and let it
//  summarise them, so you can check the maths by hand.
//
//  Run with:
//    k6 run percentile-demo.js
// ─────────────────────────────────────────────────────────────

const responseTime = new Trend('demo_response_time', true); // true = values are times

export const options = {
  vus: 1,
  iterations: 1,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

// 20 response times, already in ascending order for easy reading
const SAMPLES = [
  222, 236, 240, 245, 251, 258, 262, 270, 276, 283,
  290, 296, 304, 312, 322, 330, 338, 346, 380, 412,
];

export default function () {
  for (const ms of SAMPLES) {
    responseTime.add(ms);
  }
}
