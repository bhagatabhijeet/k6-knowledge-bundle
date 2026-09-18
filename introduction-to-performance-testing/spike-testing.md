---
type: Concept
title: Spike Testing
description: >
  Spike testing hits a system with a sudden, extreme surge of traffic and then
  drops back to normal, to see whether it survives the surge and — just as
  important — recovers afterwards. Covers k6 stages and arrival-rate spike scripts.
tags:
  - performance-testing
  - spike-testing
  - k6
  - stages
  - scenarios
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

A spike test simulates a **sudden, dramatic jump in traffic** — a flash sale going live, a
push notification landing on a million phones, a link hitting the front page of a news
site — followed by an equally abrupt return to normal.

![k6 spike test profile: VUs hold at 100, jump to 1000, then return to 100](/assets/images/spike-test-profile.svg)

In k6 terms, a spike test is a `stages` profile where **one stage is very short and its
target is very high**. That single design decision — the size of the jump relative to its
duration — is what separates a spike test from a stress test.

| | Stress test | Spike test |
|---|---|---|
| Shape | Staircase — climbs gradually | Cliff — jumps in seconds |
| Question | *Where is the capacity limit?* | *Does it survive an instant surge, and recover?* |
| Ramp duration | Minutes per step | ~10 seconds for the whole jump |
| Key stage | The highest step | The stage **after** the spike |

## Why it matters

Systems can pass a load test and a stress test and still fall over in a spike, because a
gradual ramp gives everything time to adapt: autoscalers add instances, connection pools
grow, caches warm up, JIT compilers kick in. A spike gives them **no time**. It exposes:

- **Slow or absent autoscaling** — new instances take 2 minutes to boot; the surge lasts 30 seconds.
- **Cold caches and empty pools** — every request suddenly misses the cache and opens a new connection.
- **Queue and thread-pool saturation** — requests pile up faster than they drain.
- **Failed recovery** — the most damaging finding. The surge ends, but the system stays slow
  or keeps throwing errors, because queues are still draining or a crashed dependency never restarted.

## How it works in k6

### Version 1 — `stages` (virtual users)

The simplest spike test changes the target VU count in a few seconds:

```js
// assets/code/introduction-to-performance-testing/spike-test.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '1m',  target: 100  }, // warm-up
    { duration: '3m',  target: 100  }, // baseline
    { duration: '10s', target: 1000 }, // ⚡ spike — almost instant
    { duration: '2m',  target: 1000 }, // sustain the surge
    { duration: '10s', target: 100  }, // surge ends
    { duration: '3m',  target: 100  }, // recovery — the most important stage
    { duration: '1m',  target: 0    }, // cool-off
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // looser than a load test
    http_req_failed:   ['rate<0.10'],
  },
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

[Source](/assets/code/introduction-to-performance-testing/spike-test.js)

Read the stages as a story:

```
  stage        VUs             what you are testing
  ─────────────────────────────────────────────────────────────
  warm-up      0 → 100         nothing yet — get to baseline
  baseline     100 (3 min)     how does "normal" look? (your reference numbers)
  ⚡ spike     100 → 1000      how does it react to an instant surge?
  sustain      1000 (2 min)    can it hold, or does it degrade?
  drop         1000 → 100      surge over
  recovery     100 (3 min)     do latency & errors return to the baseline?
```

### Version 2 — `ramping-arrival-rate` (requests per second)

With `stages`, k6 controls the number of **users**. But real surges are defined by **arrival
rate**: 400 new requests per second keep arriving, no matter how slow the server gets.
With a VU-based test, a slow server makes each VU take longer per iteration, so the
request rate *falls* just when you want it to hold. The `ramping-arrival-rate` executor
fixes that by keeping the request rate constant and borrowing as many VUs as needed:

```js
// assets/code/introduction-to-performance-testing/spike-test-arrival-rate.js
export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 20,          // begin at 20 iterations…
      timeUnit: '1s',         // …per second
      preAllocatedVUs: 200,   // VUs ready at start
      maxVUs: 2000,           // ceiling k6 may grow to
      stages: [
        { target: 20,  duration: '3m'  }, // baseline
        { target: 400, duration: '10s' }, // ⚡ spike: 20 → 400 iterations/s
        { target: 400, duration: '2m'  }, // sustain
        { target: 20,  duration: '10s' }, // surge ends
        { target: 20,  duration: '3m'  }, // recovery
      ],
    },
  },
  thresholds: {
    http_req_duration:  ['p(95)<2000'],
    http_req_failed:    ['rate<0.10'],
    dropped_iterations: ['count<100'], // k6 couldn't start iterations fast enough
  },
};
```

[Source](/assets/code/introduction-to-performance-testing/spike-test-arrival-rate.js)

> **Which one?** Use `stages` when you think in *"how many users"*. Use
> `ramping-arrival-rate` when you think in *"how many requests per second"* — usually the
> more honest model of a real surge. Scenarios and executors get a full treatment in the
> scripting section.

### Reading the results

k6 gives you the spike's numbers, but you must compare **across phases**, not just read the
final summary — a single p95 for the whole run blends baseline, spike and recovery into one
meaningless number. Stream results to Grafana (or any `--out` target) and split the time
series by phase.

| Metric | During the spike | After the spike (recovery) |
|---|---|---|
| `http_req_duration` p95 | Will rise — how far? | **Must return to baseline** |
| `http_req_failed` | Some errors may be tolerable | **Must return to ~0%** |
| `vus` | Confirms the surge actually reached its target | Should track the drop |
| `dropped_iterations` *(arrival-rate)* | > 0 means k6 hit `maxVUs`, or the load generator is saturated | Should be 0 |

```
  Healthy spike                          Failed recovery
  p95                                    p95
   │        ╱╲                            │        ╱╲
   │       ╱  ╲                           │       ╱  ╲_____________  ← stays high
   │______╱    ╲______  ← back to base    │______╱
   └────────────────────▶ time            └────────────────────▶ time
```

## Common pitfalls

- **Making the spike too gentle.** A 5-minute ramp to 1000 VUs is a stress test with extra
  steps. If the jump isn't seconds long, you're not testing a spike.
- **No recovery stage.** Ending the test at the peak throws away the most valuable data.
  Always drop back to baseline and keep watching for several minutes.
- **The load generator becomes the bottleneck.** 1000 VUs on a laptop can saturate CPU or
  network before the target system feels anything. If `dropped_iterations` climbs or k6
  warns about insufficient VUs, the test is measuring your machine — use a bigger
  generator or distributed/cloud execution.
- **Judging with steady-state thresholds.** A p95 < 500 ms threshold from your load test
  will fail every spike. Set thresholds that reflect what is acceptable *during a surge*, and
  check recovery separately.
- **Forgetting `maxVUs`.** With arrival-rate executors, if `maxVUs` is too low k6 cannot
  reach the target rate and silently tests less than you think.

## Key takeaways

- A spike test is a **very short, very steep** jump in load followed by a return to normal.
- The question isn't only *"did it survive?"* but *"did it **recover**?"* — the stage after
  the spike matters most.
- In k6 use `stages` for a VU-based spike, or the `ramping-arrival-rate` executor to
  model a fixed requests-per-second surge.
- Compare metrics **per phase** (baseline vs spike vs recovery), never only as a whole-run average.

## Further reading

- [Grafana k6 — Spike testing guide](https://grafana.com/docs/k6/latest/testing-guides/test-types/spike-testing/)
- [Grafana k6 — Ramping arrival rate executor](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-arrival-rate/)
- [Stress Testing](/introduction-to-performance-testing/stress-testing.md)
- [Load Testing](/introduction-to-performance-testing/load-testing.md)
