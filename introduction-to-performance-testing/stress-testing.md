---
type: Concept
title: Stress Testing
description: >
  Stress testing pushes a system beyond its normal operational capacity to find
  the exact point where it breaks, how it fails, and how well it recovers.
tags:
  - performance-testing
  - stress-testing
  - fundamentals
  - k6
  - capacity
  - recovery
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Stress testing pushes your system **beyond normal operational capacity** to find out
where it actually breaks — and to observe how it behaves once it does.

Compare it with the test you already know:

- **Load test** — you know normal traffic is 50 users and the peak is 100, and the
  application is designed to handle up to 100. You confirm it does.
- **Stress test** — you go past 100: 120, 140, 200, 300, 500 — and keep going until
  response times or error rates fall apart.

The name says it all: **stress is about breaking the system.**

## Why it matters

Load testing tells you the system works *inside* its design envelope. It does not tell
you where the envelope ends. Stress testing answers that, and three follow-up questions:

1. **What is the maximum capacity?** Say the system handles 100 users comfortably and
   breaks at 300. Now you know the real ceiling. If the business grows past that
   number, you know the system needs to change *before* it fails in production.
2. **Which component fails first?** When the system breaks, is it the API tier, the
   database connection pool, memory, or a downstream service? That is the part to fix.
3. **How does it recover?** Breaking the system is only half the goal. The other half
   is recovery — how quickly are users served normally again?
   - Does the system recover on its own once load drops?
   - Does it need a restart?
   - Or is it a catastrophic failure that leaves lasting damage?

   Observing this is often called **recovery testing**, and a stress test is where you
   get it for free.

## How it works

A stress test uses the same building blocks as a load test — `stages`, `thresholds`,
`checks` — but the stages climb well past the known peak, in steps, and then ramp down
so you can watch recovery.

```
Stress test timeline (25 min)
──────────────────────────────────────────────────────────────────────

 VUs
 500 │                                          ░░░░░░
 400 │                                ░░░░░░░░░░
 300 │                      ░░░░░░░░░░
 200 │            ░░░░░░░░░░
 100 │  ░░░░░░░░░░                                     ░░░░
   0 │░░                                                     ░░░░░░░░░░
     └────────────────────────────────────────────────────────────────▶
       ← known good →  ← beyond peak, watch for degradation →  ← recovery →

       Step 1     Step 2     Step 3     Step 4     Step 5     Ramp-down
      100 VUs    200 VUs    300 VUs    400 VUs    500 VUs     500 → 0
```

Each step ramps up for 2 minutes and holds for 2 minutes. The hold gives the system time
to settle so you can tell whether it is genuinely coping at that level or only surviving
the ramp.

```js
// assets/code/introduction-to-performance-testing/stress-test.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // ramp up → peak load
    { duration: '2m', target: 100 }, // hold      peak load (known good baseline)
    { duration: '2m', target: 200 }, // ramp up → beyond peak
    { duration: '2m', target: 200 }, // hold
    { duration: '2m', target: 300 }, // ramp up → higher stress
    { duration: '2m', target: 300 }, // hold
    { duration: '2m', target: 400 }, // ramp up → even higher
    { duration: '2m', target: 400 }, // hold
    { duration: '2m', target: 500 }, // ramp up → maximum stress
    { duration: '2m', target: 500 }, // hold      — expect degradation or failure here
    { duration: '5m', target: 0   }, // ramp down → observe recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1 s
    http_req_failed:   ['rate<0.05'],  // error rate under 5%
  },
};

export default function () {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status is 200':          (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

[Source](/assets/code/introduction-to-performance-testing/stress-test.js)

The first step (100 VUs) is your known-good peak. Everything above it is uncharted.
Thresholds and checks are how you *identify* the breaking point — the step at which
they first start failing is where the system begins to degrade. Thresholds get a full
treatment in the scripting section.

### What to watch while it runs

| Signal | What it tells you |
|---|---|
| Response time climbing steeply between steps | You are approaching the capacity limit |
| Error rate jumping from ~0% to a large value | The system has passed its breaking point |
| Errors that are timeouts vs. 5xx responses | *How* it fails — hanging, or actively rejecting |
| Metrics during the ramp-down | Whether it recovers on its own, or stays degraded |

Server-side monitoring (CPU, memory, DB connections) alongside the k6 output is what
pinpoints *which* component gave way.

## Stress vs Load vs Smoke

```
┌────────────────┬──────────────────┬──────────────────┬───────────────────────┐
│                │  Smoke           │  Load            │  Stress               │
├────────────────┼──────────────────┼──────────────────┼───────────────────────┤
│ Users          │ 1–2 VUs          │ Normal → peak    │ Well beyond peak      │
│                │                  │ (50–100)         │ (200–500+)            │
│ Duration       │ ~1 min           │ 15–35 min        │ 10–25+ min            │
│ Goal           │ "Is it alive?"   │ "Does it meet    │ "Where does it break, │
│                │                  │  the SLA?"       │  and does it recover?"│
│ Failure means  │ Stop — fix build │ Diagnose the     │ Expected — it tells   │
│                │                  │ bottleneck       │ you the limit         │
└────────────────┴──────────────────┴──────────────────┴───────────────────────┘
```

## When to reach for a stress test

If your manager or client asks any of these, the answer is the same — *run a stress test*:

- What is the maximum capacity of our application?
- How does the system fail — immediately, or gradually, one piece at a time?
- Can the system recover automatically?
- What errors occur under extreme load?

## Common pitfalls

- **Stress testing before load testing passes.** If the system misses its SLA at normal
  load, a stress test only tells you what you already know. Establish the baseline first.
- **Jumping straight to the maximum.** Stepping up gradually is what lets you pinpoint
  *which* level caused the break. A single jump to 500 tells you it failed, not where.
- **Skipping the ramp-down.** Without watching recovery, you know the limit but not
  whether the system survives hitting it.
- **Running against production.** You are deliberately trying to break the system —
  use a production-like test environment.
- **Treating failure as a test failure.** In a stress test, breaking is the *expected*
  outcome. The deliverable is the capacity number, the failure mode, and the recovery
  behaviour.

## Key takeaways

- Stress testing pushes **beyond normal and peak load** to find where the system breaks.
- It answers three questions: *what is the maximum capacity, how does it fail, and how
  does it recover?*
- Use **stepped stages** so you can pinpoint the load level at which degradation starts,
  and finish with a **ramp-down** to observe recovery.
- The result is a **capacity number** the business can plan against as it grows.

## Further reading

- [Grafana k6 — Stress testing guide](https://grafana.com/docs/k6/latest/testing-guides/test-types/stress-testing/)
- [Load Testing](/introduction-to-performance-testing/load-testing.md)
- [Smoke Testing](/introduction-to-performance-testing/smoke-testing.md)
- [What Is Performance Testing?](/introduction-to-performance-testing/what-is-performance-testing.md)
