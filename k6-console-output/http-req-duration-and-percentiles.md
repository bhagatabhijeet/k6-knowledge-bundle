---
type: Concept
title: http_req_duration and Percentiles
description: >
  What the http_req_duration line means, what avg, min, med, max, p(90) and p(95) tell you,
  how a percentile is calculated step by step, and why percentiles are a better health check than averages.
tags:
  - k6
  - metrics
  - http-req-duration
  - percentiles
  - p95
  - response-time
  - performance-testing
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

`http_req_duration` is the **response time** of your requests, and it is the single most important line in the k6 output.

```
http_req_duration..............: avg=93.16ms min=63.56ms med=98.67ms max=117.05ms p(90)=106.01ms p(95)=112.21ms
http_reqs......................: 27
```

For **each request**, k6 measures how long it took — the time to **send** the request, **wait** for the server, and **receive** the
response (per the k6 docs, this excludes the one-off DNS lookup and connection set-up). That end-to-end time is one
`http_req_duration` value.

A test makes many requests, so k6 ends up with a *list* of durations — 27 of them in our run — and summarises that list with
six statistics.

![The http_req_duration line colour-coded into avg, min, med, max, p(90) and p(95), placed on a number line with an explanation card for each](/assets/images/console-http-req-duration.svg)

## Why it matters

Response time is what your users feel. “The site is slow” is a `http_req_duration` problem. It is the metric that SLAs are written
in (*“95% of requests under 500 ms”*) and the one thresholds are built on. But a list of 27 numbers isn't easy to reason
about, so you need to know exactly what each summary number tells you — and which ones to trust.

## How it works

### The story of one run

Three users hit the URL. The first request takes, say, 300 ms — k6 records **300**. The next user's takes 346 — recorded. The first
user goes again: 222 — recorded. Every request, every time, is recorded. After 10 seconds there are 27 recordings. Now k6
summarises them:

| Statistic | How it is worked out | What it tells you |
|---|---|---|
| **avg** | Add all 27 values, divide by 27 | The mean. Easy to understand, but **one very slow request drags it up** |
| **min** | The smallest value | The **best** the system did — a lucky, fastest case |
| **med** | Sort the values, take the middle one | Half the requests were faster, half slower — a steadier “typical” |
| **max** | The largest value | The **worst** request of the run |
| **p(90)** | The value that 90% of requests were at or below | “90% of requests took this long **or less**” |
| **p(95)** | The value that 95% of requests were at or below | “95% of requests took this long **or less**” — the industry favourite |

So in our run: **min 63.56 ms** was the fastest request, **max 117.05 ms** the slowest, the average was **93.16 ms**, and
**p(95) = 112.21 ms** means 95% of the 27 requests finished within 112.21 ms — only the slowest ~5% took longer.

### What is a percentile? Sort, count, read

A percentile answers: *“what value do most of my requests stay under?”* Here is the recipe, with 20 example requests
(illustrative values, in milliseconds):

![Twenty sorted response times as bars, showing how the 19th value is the 95th percentile and the 18th the 90th, with steps: sort, compute position, read the value](/assets/images/console-percentiles-how.svg)

1. **Sort** the durations from smallest to largest (k6 does this for you).
2. **Work out the position**: for the 95th percentile, `95 ÷ 100 × 20 requests = 19`. For the 90th: `90 ÷ 100 × 20 = 18`.
3. **Read the value** at that position: the 19th value is **380 ms**, so **p(95) = 380 ms**; the 18th is **346 ms**, so **p(90) = 346 ms**.

“p(95) = 380 ms” therefore means **95% of the requests (19 of 20) took 380 ms or less** — only the last 5% (1 request) took longer.

> **Counting by hand vs. what k6 prints.** For these same 20 values k6 actually prints `p(90)=349.4ms  p(95)=381.6ms`, not
> exactly 346 and 380. k6 **interpolates between neighbouring sorted values** (it places the 95th percentile at position
> 0.95 × (20 − 1) = 18.05, counting from 0, and blends the two values around it). It can therefore land *between* two real
> measurements. The idea is identical, and the count-to-the-19th method is the best way to understand it.
> You can check this yourself with [percentile-demo.js](/assets/code/k6-console-output/percentile-demo.js).

### Why not just use the average?

Because an average can mislead in **both directions**:

![Two examples. One freak request in 100 nudges the average up while p95 stays put; half fast and half slow requests give an average that describes nobody, while p95 shows the slow half](/assets/images/console-average-vs-percentile.svg)

- **Example A — one freak request.** 99 requests take 250 ms and one takes 5000 ms (a network hiccup). k6 prints
  `avg=297.5ms` but `p(95)=250ms`. The average is pushed up 19% by a single request; **p(95) ignores the rare glitch** and
  shows how the app behaves for almost everyone.
- **Example B — half fast, half slow.** Ten requests take 200 ms and ten take 2000 ms. The average *and* the median are
  **1.1 s** — a time **no user ever experienced** — while `p(95)=2s` reveals that half your users wait ten times longer.

So performance engineers usually judge health by **p(90)** or **p(95)** (sometimes p(99)), not by average, min or max. Min is
nice to know but doesn't help you tune anything; max is dominated by one-off blips; the average can hide problems in either direction.

### Choosing which statistics k6 shows

The six statistics are k6's defaults for response-time metrics. You can change them in the script:

```js
export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};
```

or on the command line with `--summary-trend-stats`. Here is the script that produced the numbers above — 20 known values fed
into a k6 `Trend` metric, so you can check the maths yourself:

```js
// assets/code/k6-console-output/percentile-demo.js
import { Trend } from 'k6/metrics';

const responseTime = new Trend('demo_response_time', true); // true = values are times

export const options = {
  vus: 1,
  iterations: 1,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

const SAMPLES = [
  222, 236, 240, 245, 251, 258, 262, 270, 276, 283,
  290, 296, 304, 312, 322, 330, 338, 346, 380, 412,
];

export default function () {
  for (const ms of SAMPLES) responseTime.add(ms);
}
```

[Source](/assets/code/k6-console-output/percentile-demo.js)

```
demo_response_time...: avg=293.64ms min=222ms med=286.5ms max=412ms p(90)=349.4ms p(95)=381.6ms
```

## Ask your AI assistant

A great habit: when a metric isn't clear, ask the AI assistant built into your editor (GitHub Copilot Chat, Cursor’s chat, or
similar) to explain it with an example. For instance:

> *“Explain how the 95th percentile of http_req_duration is calculated in k6, using a list of 20 example response times.”*
> *“Why is p(95) better than the average for judging an API’s health?”*

Ask it to show the sorted list and the position calculation. Then check the answer against this page — and against a real
run, using the demo script above. Being able to figure things out on your own is worth more than memorising definitions.

## Common pitfalls

- **Judging by the average.** It can be dragged up by one outlier or hide a slow group entirely. Look at p(95).
- **Confusing p(95) with “95% of requests are fast”.** It means 95% took *this long or less* — whether that is fast depends on your requirement.
- **Treating `max` as the headline.** One-off spikes dominate it; use it to see how bad the worst moment was, not to judge health.
- **Reading percentiles from tiny samples.** With only 27 requests, p(95) rests on the top one or two values. Longer, larger runs give steadier percentiles.
- **Expecting hand-counted values to match k6 exactly.** k6 interpolates; small differences are normal.
- **Mixing up `http_req_duration` and `iteration_duration`.** The first is one request; the second is the whole loop, including `sleep`.

## Key takeaways

- **`http_req_duration`** = time for one request (send + wait + receive). k6 summarises the list of all requests with **avg, min, med, max, p(90), p(95)**.
- **min** = best, **max** = worst, **avg** = mean, **med** = middle.
- **p(95)** = the time that **95% of requests were at or below**; only the slowest 5% took longer.
- To find a percentile: **sort → position = percentile ÷ 100 × count → read that value** (k6 interpolates slightly).
- Use **p(90)/p(95)** as the health benchmark — averages hide outliers and bimodal behaviour.
- Ask your AI assistant for worked examples whenever a metric is unclear.

## Further reading

- [Grafana k6 — Built-in metrics (http_req_duration)](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/)
- [Grafana k6 — Options: summary trend stats](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/)
- [Reading the k6 Summary — a Guided Tour](/k6-console-output/reading-the-k6-summary.md)
- [Load Testing](/introduction-to-performance-testing/load-testing.md) — thresholds like `p(95)<500`
