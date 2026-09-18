---
type: Concept
title: Soak Testing
description: >
  Soak testing (endurance testing) runs a steady, typical load for hours to
  expose problems that only appear over time — memory leaks, connection
  exhaustion, growing tables. Covers k6 stages, per-hour tagging and sub-metric thresholds.
tags:
  - performance-testing
  - soak-testing
  - endurance-testing
  - k6
  - stages
  - thresholds
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

A soak test (also called an **endurance test**) applies a **moderate, steady load for a
long time** — typically 4, 8, 12 or even 24+ hours — and asks a different question from
every other test type: *is the system still healthy after hours of use?*

![k6 soak test profile: 50 VUs constant for four hours, healthy latency stays flat, leaking latency creeps up](/assets/images/soak-test-profile.svg)

Where a stress or spike test attacks with *intensity*, a soak test attacks with *time*.
The load is deliberately ordinary — your typical concurrent-user count, not the peak.
If a system that copes at minute 10 is failing at hour 3 **under the same load**, something
is accumulating.

## Why it matters

A 30-minute load test cannot see problems that take 3 hours to develop. Soak tests find:

| Slow-burn problem | What you see in the k6 results |
|---|---|
| **Memory leak** | Latency creeps up steadily, then errors / restarts when memory runs out |
| **Connection or thread-pool leak** | Timeouts and `connection refused` appearing after a fixed number of hours |
| **File-handle / socket exhaustion** | Sudden wall of errors at a specific point |
| **Growing data** | Queries slow down as tables, logs or caches grow |
| **Background jobs** | Latency spikes at regular intervals (log rotation, batch jobs, GC, backups) |
| **Expiring credentials or tokens** | Errors starting exactly when a token TTL is reached |

The signature of a soak problem is in the graph above: **flat load, worsening result**.

## How it works in k6

The load profile is the simplest of all the test types — ramp up, hold for a long time,
ramp down:

```js
// assets/code/introduction-to-performance-testing/soak-test.js
import http from 'k6/http';
import exec from 'k6/execution';
import { sleep, check } from 'k6';

const SOAK_DURATION = __ENV.SOAK_DURATION || '4h';

export const options = {
  discardResponseBodies: true, // save load-generator memory over many hours

  stages: [
    { duration: '5m',          target: 50 }, // ramp up → typical load
    { duration: SOAK_DURATION, target: 50 }, // hold — this is the "soak"
    { duration: '5m',          target: 0  }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],

    // The last hour must be as fast as the first
    'http_req_duration{hour:0}': ['p(95)<500'],
    'http_req_duration{hour:3}': ['p(95)<500'],
  },
};

export default function () {
  const hour = Math.floor(exec.instance.currentTestRunDuration / 3_600_000);

  const res = http.get('https://test.k6.io', {
    tags: { hour: String(hour) },
  });

  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

[Source](/assets/code/introduction-to-performance-testing/soak-test.js)

Three k6 techniques here are specific to soak tests:

### 1. Make the duration a parameter

Nobody wants to wait 4 hours to check a typo. Read the duration from an environment
variable so the same script serves both a quick rehearsal and the real run:

```bash
k6 run -e SOAK_DURATION=10m soak-test.js   # rehearsal — about 20 minutes total
k6 run soak-test.js                        # the real 4-hour soak
```

### 2. Tag requests with the hour, then threshold per hour

A whole-run p95 averages the healthy first hour together with the dying last hour and can
still pass. Tagging each request with `hour` lets you assert that **hour 3 is as fast as
hour 0** using a sub-metric threshold — `http_req_duration{hour:3}`. The same tag lets
Grafana split the latency curve by hour.

### 3. Protect the load generator

The machine running k6 must survive the soak too. `discardResponseBodies: true` stops k6
from holding every response body in memory when you don't inspect it. Also:

- Run from a stable box (a CI runner, VM or cloud) — not a laptop that will sleep at hour 2.
- Stream metrics out as you go (`--out` to Grafana/InfluxDB/Prometheus/JSON) so a crash at
  hour 3 doesn't lose hours 0–3.
- Keep an eye on the generator's own memory — see the leak pitfall below.

### Reading the results

The **time-series view** is the only useful view for a soak test. The end-of-test summary
is nearly worthless because it collapses hours into one number.

```
  What you look for in Grafana (x-axis = hours)

  p95 latency   flat ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬   ✅  healthy
                slow climb ▁▂▂▃▃▄▅▅▆▇█     ⚠️  leak — find which resource
                sawtooth ▁█▁█▁█▁█▁█        ⚠️  periodic job (GC, batch, backup)
                cliff ▬▬▬▬▬▬▬▬▬▬█████      ❌  exhaustion at a specific moment
```

Pair k6's numbers with **server-side monitoring** — memory, CPU, DB connections, open file
handles. k6 tells you *that* the system is degrading; the server metrics tell you *why*.

## Where soak testing fits

![The five test types at a glance: smoke, load, stress, spike and soak load shapes](/assets/images/test-types-at-a-glance.svg)

A sensible order: **smoke → load → stress → spike → soak**. Soak goes last because it is the
most expensive — hours of compute and engineer time — so you want the baseline, capacity and
surge behaviour understood first.

| | Load | Stress | Spike | Soak |
|---|---|---|---|---|
| Users | Normal → peak | Far beyond peak | Instant jump | **Typical, constant** |
| Duration | ~35 min | ~25 min | ~10 min | **4–24+ hours** |
| Finds | SLA violations | Capacity limit | Surge & recovery bugs | **Leaks & slow decay** |

## Common pitfalls

- **Using peak load.** A soak at 100 VUs when normal is 50 turns it into a slow stress test.
  Use typical traffic so any decay is due to *time*, not intensity.
- **Testing with the same user and data every iteration.** A single cached user never
  grows a session table or fills a cache. Vary your data (k6 `SharedArray`, unique IDs per
  VU) so the soak exercises realistic state growth.
- **Trusting the whole-run summary.** Always look at latency and errors *over time*.
- **The load generator leaks.** Storing large responses, huge custom-metric arrays or unbounded
  logs in your script can exhaust k6's own memory at hour 3 — which looks like a target
  failure but isn't. Watch the generator too.
- **Letting it run unwatched, then discovering it never worked.** Do the 10-minute
  rehearsal first, and confirm metrics are actually flowing to your dashboard.
- **Ignoring expected changes.** Deployments, autoscaling events or nightly jobs during the
  soak are real events, not noise — note them so you can explain dips in the graph.

## Key takeaways

- A soak test is **steady, typical load for hours** — the variable under test is *time*.
- It finds what only shows up over time: memory leaks, exhausted pools, growing data,
  periodic jobs and expiring tokens.
- In k6, a soak is `stages` with a very long hold. Parameterise the duration with
  `__ENV`, tag requests with the hour, and use **sub-metric thresholds** to compare late
  hours against early ones.
- Judge it on the **time-series**, together with server-side metrics — not the final summary.

## Further reading

- [Grafana k6 — Soak testing guide](https://grafana.com/docs/k6/latest/testing-guides/test-types/soak-testing/)
- [Grafana k6 — Tags and groups](https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/)
- [Spike Testing](/introduction-to-performance-testing/spike-testing.md)
- [Stress Testing](/introduction-to-performance-testing/stress-testing.md)
- [Load Testing](/introduction-to-performance-testing/load-testing.md)
