---
type: Concept
title: Load Testing
description: >
  Load testing evaluates system performance under expected normal and peak
  traffic conditions — the core non-functional validation that tells you
  how your application behaves when real users show up simultaneously.
tags:
  - performance-testing
  - load-testing
  - fundamentals
  - k6
  - concurrency
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Load testing is where **actual non-functional validation begins**. Once smoke testing has
confirmed the system is alive and the basic flow works, load testing answers the next
question: *how does the system behave when the expected number of real users is on it at
the same time?*

The key word is **concurrent** — not sequential. You are not testing whether one user can
place an order; you are testing whether 50 users can place an order *simultaneously*, and
whether the system stays fast and stable while they do.

Load testing covers two traffic bands:

| Band | Description | Example |
|---|---|---|
| **Normal load** | The average number of concurrent users on a typical day | 50 users during business hours |
| **Peak load** | The maximum expected spike under known high-traffic conditions | 75–100 users on a Friday night or a sale event |

## Why it matters

With a single user the API might respond in 2 ms. With 70 concurrent users hitting the
same endpoint simultaneously, that same call might take 8 ms. Is 8 ms acceptable? That
depends on the agreement with your stakeholders — but you will never know the number
without running the test.

Load testing surfaces:

- **Slow response times** under concurrency that are invisible under light load.
- **Bottleneck services** — the one endpoint or database query that degrades first.
- **Capacity confirmation** — evidence that the system meets its SLAs at normal and peak load.

The QA role here is to **capture the metrics and identify which service is the culprit**.
Fixing the bottleneck — tuning the backend code, database queries, or infrastructure — is
the development team's domain. Load testing gives them the evidence they need to act.

## How it works

A load test runs your entire end-to-end user journey — login → browse → add to cart →
place order — but with the target number of concurrent virtual users, sustained for long
enough to observe stable behaviour.

```
Timeline of a typical load test
─────────────────────────────────────────────────────────────────────

 VUs
 100 │                    ████████████████████
  75 │             ████████                   ████████
  50 │      ████████                                   ████
   0 │──────┴────────┴──────────────────────────────────┴────▶ time
        ramp-up   normal load (50 VUs)    peak (100 VUs)  ramp-down
```

In k6, you model this with load **stages**:

```js
// assets/code/introduction-to-performance-testing/load-test.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // ramp up to normal load (50 VUs)
    { duration: '5m', target: 50 },  // hold normal load — observe steady state
    { duration: '2m', target: 100 }, // ramp up to peak load (100 VUs)
    { duration: '5m', target: 100 }, // hold peak load — observe under pressure
    { duration: '2m', target: 0 },   // ramp down gracefully
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must finish under 500 ms
    http_req_failed:   ['rate<0.01'], // error rate must stay below 1%
  },
};

export default function () {
  // Simulate a realistic user journey — replace with your application's flow
  const res = http.get('https://test.k6.io');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // think time between steps
}
```

[Source](/assets/code/introduction-to-performance-testing/load-test.js)

### Reading the output

After the run, k6 prints a summary. The key metrics to watch:

```
✓ http_req_duration........: avg=210ms  p(90)=420ms  p(95)=490ms
✓ http_req_failed..........: 0.00%
  http_reqs..................: 14 320   total requests sent
  vus_max....................: 100      peak virtual users
```

- `p(95)` — 95th-percentile response time. The most important single number.
- `http_req_failed` — the error rate. Any value above your threshold is a red flag.
- `vus_max` — confirms you actually reached your intended peak load.

## Smoke vs Load — the difference at a glance

```
┌────────────────┬────────────────────────┬────────────────────────────┐
│                │  Smoke Test            │  Load Test                 │
├────────────────┼────────────────────────┼────────────────────────────┤
│ When           │ Immediately on new     │ After smoke passes         │
│                │ build                  │                            │
│ Users          │ 1–2 VUs                │ Normal + peak (e.g. 50–100)│
│ Duration       │ ~1 minute              │ 15–30+ minutes             │
│ Goal           │ "Is the system alive?" │ "How does it behave at     │
│                │                        │  real traffic volumes?"    │
│ Failure means  │ Stop — fix the build   │ Diagnose the bottleneck    │
└────────────────┴────────────────────────┴────────────────────────────┘
```

## Common pitfalls

- **Skipping normal load and jumping straight to peak.** Normal load establishes your
  baseline. Without it, peak-load numbers have no reference point.
- **Not using stages.** Instant ramp-up to full load does not reflect real traffic and
  can mask gradual degradation patterns.
- **Ignoring think time.** Removing `sleep()` means virtual users fire requests as fast
  as the network allows — far more aggressive than real users and unrealistic.
- **Forgetting thresholds.** Without `thresholds`, k6 always exits with code 0. Define
  your SLA as a threshold so the test fails automatically when the system misses it.

## Key takeaways

- Load testing validates performance under **normal and peak concurrent user counts** —
  both bands must be tested.
- It is the primary non-functional test; everything else (stress, soak, spike) builds on it.
- The output is a set of **metrics** — response times, error rates, throughput — that
  identify which part of the system is the bottleneck.
- In k6, load profiles are defined with `stages` and pass/fail criteria with `thresholds`.

## Further reading

- [Grafana k6 — Load testing guide](https://grafana.com/docs/k6/latest/testing-guides/test-types/load-testing/)
- [Smoke Testing](/introduction-to-performance-testing/smoke-testing.md)
- [What Is Performance Testing?](/introduction-to-performance-testing/what-is-performance-testing.md)
