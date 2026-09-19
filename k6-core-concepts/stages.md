---
type: Concept
title: Stages — Ramp-up, Hold and Ramp-down
description: >
  How the k6 stages option shapes load over time: what duration and target mean, how users are added
  gradually, why 2 → 5 adds three users (not five), why the ramp-down is graceful, and how stages differ
  from the simple vus + duration shortcut.
tags:
  - k6
  - stages
  - ramp-up
  - ramp-down
  - virtual-users
  - load-profile
  - core-concepts
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

In the [first test](/k6-configuration-options-in-code-editor/writing-your-first-k6-test.md) we wrote:

```js
export const options = { vus: 3, duration: '10s' };
```

Three users appear **instantly** and stay for ten seconds. Simple — but not how real traffic behaves. When a flash sale opens, a few users arrive first, then more, then more.
When it ends, they drift away. Nobody presses a button and 500 users show up in the same second.

The **`stages`** option lets you describe that shape. It is a **list**: each item says *“over this much time, move to this many users.”*

```js
export const options = {
  stages: [
    { duration: '4s', target: 2 }, // ramp up   → 2 users over 4 seconds
    { duration: '5s', target: 5 }, // ramp up   → 5 users over the next 5 seconds
    { duration: '3s', target: 0 }, // ramp down → 0 users over the last 3 seconds
  ],
};
```

## Why it matters

- **Realistic traffic.** Gradual ramps mimic real arrival patterns — a much better prediction of production behaviour than an instant wall of users.
- **You can see cause and effect.** With a slow climb you can spot *at which number of users* response times start to bend.
- **You can watch recovery.** A gradual ramp-down shows whether the system releases connections and returns to normal.
- **It is how nearly every real k6 script is written.** `vus` + `duration` is for tiny, minimal runs; anything serious uses stages.

## How it works

### Anatomy: duration and target

![The stages array with three objects mapped to a chart: users climb from 1 to 2 over 4 seconds, from 2 to 5 over 5 seconds, then fall to 0 over 3 seconds; duration is how long a stage takes and target is where it ends](/assets/images/core-stages-anatomy.svg)

Each stage object has just two properties:

| Property | Meaning | Stage 1 above |
|---|---|---|
| **`duration`** | **How long this stage takes** | `'4s'` — this stage lasts 4 seconds |
| **`target`** | **How many users there should be at the END of the stage** | `2` — by the end of these 4 seconds, 2 users are active |

The single most important idea: **`target` is a destination, not an increment.**

- Stage 1 goes from the starting users to **2**.
- Stage 2 has `target: 5`. You already have 2 users, so k6 adds **3 more** to reach 5 — it does **not** add 5 (that would be 7).
- Stage 3 has `target: 0`. Users leave gradually until none are left.

So the **peak** load your application ever sees is **5 users**, reached at the end of stage 2. Total test time is the sum of the durations: **4 + 5 + 3 = 12 seconds**.

### How k6 moves between targets

k6 draws a **straight line** from one target to the next. Stage 2 climbs from 2 to 5 over 5 seconds, so users join steadily — about 0.6 of a user per second:

> **users(t) = start + (target − start) × (time into stage ÷ stage duration)**
>
> 3 seconds into stage 2:  2 + (5 − 2) × 3 ÷ 5 = **3.8 users**

k6 can only run **whole** users, so you see stair-steps (3, then 4), not decimals.

> **Where does it start?** With the `stages` shortcut, k6 starts from **1 user** — the `startVUs` default is 1 — not 0. That is why the first seconds of our run show `1/5 VUs`.
> To start from zero, use a scenario with the `ramping-vus` executor and `startVUs: 0` (we checked: the console then shows 0 users for the first seconds).

### Watching it happen (real run)

Run [stages-demo.js](/assets/code/k6-core-concepts/stages-demo.js):

```js
// assets/code/k6-core-concepts/stages-demo.js
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '4s', target: 2 },
    { duration: '5s', target: 5 },
    { duration: '3s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  http.get('https://quickpizza.grafana.com/');
  sleep(1);
}
```

[Source](/assets/code/k6-core-concepts/stages-demo.js) — `k6 run stages-demo.js`. Here is the real console, with the stages marked:

![The console during a stages run: header stating up to 5 looping VUs over 3 stages, one progress line per second showing the user count rising then falling, thresholds passing and 28 requests](/assets/images/core-stages-console.svg)

Follow the coloured lines:

1. **The header** says *“Up to 5 looping VUs for 12s over 3 stages (gracefulRampDown: 30s, …)”* — the plan in one sentence. (`12 = 4 + 5 + 3`.)
2. **Stage 1** — the progress line shows `1/5 VUs` for the first four seconds: the user count climbing from 1 to 2 in whole steps.
3. **Stage 2** — `2/5 … 3/5 … 4/5 VUs`: users join a few at a time.
4. **The peak** — `5/5 VUs`: the most users the app ever saw.
5. **Stage 3** — `3/5 … 1/5 … 0/5 VUs`: users leave gradually.
6. **Thresholds** pass (`p(95)=88ms < 400ms`, failures `0% < 10%`) — a real-life use of [thresholds](/k6-core-concepts/thresholds.md).

`vus_max=5` in the summary confirms the peak you asked for was actually reached.

### Planned vs. what k6 actually did

![Planned straight-line ramp versus the number of users k6 reported each second: ramp-up follows the plan in whole steps, ramp-down lags because users finish their current iteration](/assets/images/core-stages-observed.svg)

Two details are worth knowing:

- **Ramp-up follows the plan** in whole-user steps.
- **Ramp-down lags the plan a little.** The plan says 3.3 → 1.7 → 0 users, but k6 showed 5 → 3 → 1 → 1 and finished at about **13 s**, not 12. k6 will not cut a user off in the middle of an iteration: it waits for the current iteration to finish. This is **graceful ramp-down**, controlled by `gracefulRampDown` (default **30 seconds** — the header line’s *“42s max duration”* is the 12-second plan plus that 30-second limit; it is a ceiling, not a wait).

It matches what a real crowd does — people finish what they are doing before they leave — and it avoids counting artificial errors from interrupted requests.

### Stages vs. `vus` + `duration`

| | `vus: 3, duration: '10s'` | `stages: [ … ]` |
|---|---|---|
| Shape | a constant number of users | any shape you draw |
| k6 calls it | `constant-vus` executor (shortcut) | `ramping-vus` executor (shortcut) |
| Header says | *“3 looping VUs for 10s”* | *“Up to 5 looping VUs for 12s over 3 stages”* |
| Best for | tiny smoke tests, quick experiments | realistic load, stress, spike and soak tests |

Both are shortcuts for the more general **scenarios** feature. A single-stage `stages` array is possible too, but at that point `vus` + `duration` reads more simply.

### Fewer requests? It is the area under the curve

Run both shapes and count the requests. Our real runs: **27 requests** for 3 users × 10 s, and **27–28 requests** for the 12-second ramp (28 in the run shown above). Why so similar? Because the number of requests depends on the **area under the user curve** — *user-seconds*:

![Static load of 3 users for 10 seconds is about 30 user-seconds and 27 requests; the ramp of 4s to 2, 5s to 5 and 3s to 0 is about 31 user-seconds and 28 requests; requests are roughly user-seconds divided by 1.1 seconds per loop](/assets/images/core-stages-vs-static.svg)

Each user does one loop about every **1.1 s** (a 0.09 s request plus `sleep(1)`), so:

> **requests ≈ user-seconds ÷ 1.1**
>
> static: 3 × 10 = 30 → 30 ÷ 1.1 ≈ 27      ramp: ≈ 31 → 31 ÷ 1.1 ≈ 28

So don’t compare request *counts* between different load shapes; compare **rates and percentiles**. The ramp reaches a *higher peak* (5 vs 3 users) while being gentler at the start and end.

### Stages in k6 Studio

[k6 Studio](/k6-setup/k6-studio.md) shows the same idea as a table — one row per stage, *Target VUs* and *Duration*, with the **Ramping VUs** executor selected by default (ramp to 20 users over 1 minute, hold for 3½ minutes, ramp down over 1 minute):

![The Load profile panel of k6 Studio: Ramping VUs with three rows — 20 VUs for 1m, 20 VUs for 3m30s, 0 VUs for 1m](/assets/images/k6-studio-load-profile.png)

Each row is one `{ target, duration }` object — exactly what you have just learned.

### Designing real stages

For real tests, scale the durations up to **minutes**. A classic shape from the [Load Testing](/introduction-to-performance-testing/load-testing.md) page:

```js
stages: [
  { duration: '5m',  target: 50  }, // ramp up to normal load
  { duration: '10m', target: 50  }, // hold — measure steady state
  { duration: '5m',  target: 100 }, // ramp up to peak
  { duration: '10m', target: 100 }, // hold at peak
  { duration: '5m',  target: 0   }, // ramp down — watch recovery
],
```

The same tool builds every test type: a **hold** stage is a load or soak test, **steps upward** are a [stress test](/introduction-to-performance-testing/stress-testing.md), and a **very short, steep** stage is a
[spike test](/introduction-to-performance-testing/spike-testing.md).

This example uses seconds and tiny numbers on purpose: the goal is to *understand the concept*, not to stress the application. Once the idea is clear, raise the numbers.

## Common pitfalls

- **Reading `target` as “add this many users”.** It is the total at the end of the stage. `2 → 5` adds three.
- **Expecting to start at 0.** Stages start at 1 user unless you configure `startVUs: 0` in a scenario.
- **Ramp-up too fast.** A 5-second ramp to 1000 users is a spike, not a ramp. Give the system minutes to adapt if you want realistic behaviour.
- **Skipping the ramp-down.** You lose the chance to watch recovery.
- **Confusing duration with a running total.** Each stage’s `duration` is its own length; total time is the **sum**.
- **Being surprised the test runs a little longer than the sum.** Graceful ramp-down lets in-flight iterations finish.
- **Comparing request counts across different shapes.** Compare rates and percentiles.
- **Mixing `stages` with `vus` + `duration` in the same options.** Pick one style (or use scenarios).

## Check yourself

1. `stages: [{duration:'10s',target:4},{duration:'20s',target:4},{duration:'10s',target:0}]` — how long does the test last, and what is the peak? *(40 s planned; peak 4 users.)*
2. A stage goes from 3 users to `target: 8`. How many users are **added**? *(5.)*
3. Why can the ramp-down take slightly longer than the plan? *(k6 lets each user finish its current iteration — graceful ramp-down.)*
4. Which is better for modelling a flash sale — `vus/duration` or `stages`? *(Stages.)*
5. With users doing one loop every 2 s, roughly how many requests do 10 users make in 60 s? *(600 user-seconds ÷ 2 s ≈ 300.)*

## Key takeaways

- **`stages`** is a list of `{ duration, target }`: *go to this many users, taking this long*.
- **`duration`** = how long the stage takes; **`target`** = users **at the end** of it (a destination, not an increment).
- k6 moves in a **straight line** between targets, in **whole users**, starting from **1** by default.
- The **ramp-down is graceful**: users finish their current iteration, so the run can end a moment after the plan.
- Requests scale with the **area under the curve** (user-seconds ÷ time per loop).
- `vus` + `duration` is a constant-load shortcut; **stages** is what real tests use.

## Further reading

- [Grafana k6 — Ramping VUs executor](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-vus/)
- [Grafana k6 — Options: stages](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/)
- [Load Testing](/introduction-to-performance-testing/load-testing.md) · [Stress Testing](/introduction-to-performance-testing/stress-testing.md) · [Spike Testing](/introduction-to-performance-testing/spike-testing.md) · [Soak Testing](/introduction-to-performance-testing/soak-testing.md)
- [Thresholds — Pass/Fail Goals for Your Metrics](/k6-core-concepts/thresholds.md)
