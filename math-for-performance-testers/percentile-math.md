---
type: Guide
title: The Math of Percentiles — Explained Simply
description: >
  A picture-first, plain-language guide to percentiles for anyone (10th grade is plenty):
  sorting, "how far along the line", min / max / median / average, the walk-between-two-values trick
  k6 uses, a three-step recipe, the long tail, and three common traps — all with ten easy numbers.
tags:
  - k6
  - percentiles
  - math
  - p95
  - median
  - average
  - beginner
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

> *Part of [Math for Performance Testers](/math-for-performance-testers/index.md) — the plain-language maths behind the numbers k6 prints.*

## What it is

You have already met **p(90)** and **p(95)** in the k6 results. This page explains — slowly, with pictures — where those numbers come from.
You only need to know how to **add, multiply and divide**. No formulas to memorise; each one is built up from a simple idea.

The big idea, in one sentence:

> A **percentile** answers: *“If I line everything up from smallest to largest, what value do I reach after walking a certain
> percent of the way along the line?”*

## Why it matters

When you test a website, k6 records how long **each request** took. That gives you a *list* of times — 27, or 27,000. Nobody can read 27,000
numbers, so we squeeze the list into a few **summary numbers**. Some summaries fool you. Percentiles are the ones that tell you
**what most of your users actually experienced**.

We'll use one tiny, friendly example all the way through: **ten requests** that took

`100 ms, 200 ms, 300 ms … up to 1000 ms`

(*ms* = milliseconds, a thousandth of a second.)

## How it works

### Step 1 — Line them up

Percentiles start with **sorting**: put the times in order from the smallest to the largest — like lining students up by height.

![Ten response times in random order are sorted from smallest to largest, like students lined up by height](/assets/images/percentile-line-them-up.svg)

Why bother? Once everything is in a line, questions like *“where do most of them finish?”* become easy to answer.
(You never sort by hand — k6 does it for you.)

### Step 2 — “Percent” means *how far along the line*

Now walk along the line. The **90th percentile (p90)** is the value you reach after walking **90%** of the way.

![In a line of ten, the first nine are 90 percent. The 9th time, 900 ms, is about the 90th percentile](/assets/images/percentile-what-p90-means.svg)

- Ten requests → each one is **10%** of the line.
- The first **9** requests are **90%** of them; only the last **1** is the slowest 10%.
- So p90 is about the **9th** time: **900 ms**.
- Read it in plain English: **“9 out of 10 requests took 900 ms or less.”**

Three special percentiles have their own names:

| Percentile | How far along | Name |
|---|---|---|
| **p0** | the very start | the **minimum** (fastest) |
| **p50** | half way | the **median** (the middle) |
| **p100** | the very end | the **maximum** (slowest) |

> **Careful with the words.** *Percentile* is a **value** (like 900 ms). The *90* in “90th percentile” is a **share** of the requests
> (90 out of every 100). The value is what you compare with your goals.

### Step 3 — The four everyday numbers

Besides percentiles, k6 prints four other numbers. Here they are on a **seesaw**:

![Min, max, median and average shown on a seesaw: the average is the balance point](/assets/images/percentile-average-median-seesaw.svg)

| Name | What it is | Our ten requests |
|---|---|---|
| **min** | the smallest value | 100 ms |
| **max** | the biggest value | 1000 ms |
| **median** | sort them, take the **middle** one. With two middles (like 10 values) → the average of those two | (500 + 600) ÷ 2 = **550 ms** |
| **average** (mean) | add everything up, divide by how many | (100 + 200 + … + 1000) ÷ 10 = 5500 ÷ 10 = **550 ms** |

Think of the **average as the balance point** of the seesaw. When the times are spread evenly, the average and the median agree (both 550).
But add **one slow request** to nine fast ones and look what happens:

- Nine requests of 100 ms and one of 1000 ms → **average = 190 ms**, but the **median is still 100 ms**.
- One slow request tugged the average almost double — even though **9 out of 10 users** had a fast 100 ms.

That is exactly why performance engineers do not trust the average alone.

### Step 4 — What if the spot lands *between* two requests?

Try p90 with our ten requests: 90% of the way is somewhere around the 9th request — but not *exactly* on one. k6 handles this neatly.
It gives every request a **position number starting from 0**, so our ten requests sit at positions **0, 1, 2 … 9**:

![Positions 0 to 9 for ten sorted requests; p90 lands at 8.1 and p95 at 8.55, which are fractions of the way between 900 ms and 1000 ms](/assets/images/percentile-between-two-bars.svg)

To find where a percentile lands:

> **position = (percentile ÷ 100) × (number of requests − 1)**

For **p90** with 10 requests: `0.90 × (10 − 1) = 8.1`.

- **8.1** means “start at position 8 (that is 900 ms) and walk **0.1** — one tenth — of the way to position 9 (1000 ms)”.
- The gap between them is 100 ms, so we walk `0.1 × 100 = 10 ms`. Answer: `900 + 10 =` **910 ms**. ✅ (k6 prints `p(90)=910ms`.)

For **p95**: `0.95 × 9 = 8.55` → start at 900 and walk **0.55** of the way to 1000 → `900 + 0.55 × 100 =` **955 ms**. ✅

If the position is a **whole number** (like p0 → position 0), you land exactly on a request. No walking needed.

### Step 5 — The whole recipe on one page

![The three-step percentile recipe with a worked table for p25, p50, p75, p90, p95 and p99](/assets/images/percentile-recipe-cheatsheet.svg)

1. **Sort** the times, smallest to largest.
2. **Find the position:** `position = (p ÷ 100) × (n − 1)`.
3. **Walk between two values:** the whole part of the position is the step you stand on; the leftover part (the fraction) is how far to walk toward the next step.
   `answer = lower value + fraction × (upper value − lower value)`

| p | position | between | fraction | answer |
|---|---|---|---|---|
| p25 | 0.25 × 9 = 2.25 | 300 and 400 | 0.25 | **325 ms** |
| p50 | 0.5 × 9 = 4.5 | 500 and 600 | 0.5 | **550 ms** |
| p75 | 0.75 × 9 = 6.75 | 700 and 800 | 0.75 | **775 ms** |
| p90 | 0.9 × 9 = 8.1 | 900 and 1000 | 0.1 | **910 ms** |
| p95 | 0.95 × 9 = 8.55 | 900 and 1000 | 0.55 | **955 ms** |
| p99 | 0.99 × 9 = 8.91 | 900 and 1000 | 0.91 | **991 ms** |

Same recipe for any size. With 1000 requests taking 1, 2, … 1000 ms, p95 sits at `0.95 × 999 = 949.05` → `950 + 0.05 × 1 =` **950.05 ms**.

### Try it yourself

Let k6 do the same maths and check it against ours. This tiny script feeds k6 the ten numbers:

```js
// assets/code/math-for-performance-testers/percentile-math-demo.js
import { Trend } from 'k6/metrics';

const ten = new Trend('ten_requests', true); // true = the values are times (ms)

export const options = {
  vus: 1,
  iterations: 1,
  summaryTrendStats: ['min', 'p(25)', 'med', 'avg', 'p(75)', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  for (let ms = 100; ms <= 1000; ms += 100) {
    ten.add(ms); // one request that took `ms` milliseconds
  }
}
```

[Source](/assets/code/math-for-performance-testers/percentile-math-demo.js) — run it with `k6 run percentile-math-demo.js`. Real output:

```
ten_requests: min=100ms p(25)=325ms med=550ms avg=550ms p(75)=775ms p(90)=910ms p(95)=954.99ms p(99)=991ms max=1s
```

Every number matches the table above. (k6 shows `954.99` instead of `955` only because of tiny rounding in computer arithmetic, and `max=1s` is just `1000 ms` written in seconds.)

## The long tail — why we care about p95 and p99

Real response times are not evenly spread. **Most requests are quick, and a few are slow.** Draw that as a picture and you get a “mountain with a long tail”:

![A histogram of 300 response times: a hill of fast requests and a long tail of slow ones, with median, average, p90, p95 and p99 marked](/assets/images/percentile-long-tail.svg)

- The **average is tugged to the right** by the slow ones (227 ms here, while the median is 200 ms).
- **p95** marks where the slowest **5%** begin: “95 out of every 100 requests took 400 ms or less.”
- **p99** looks further into the tail. Users feel that tail, so teams set goals on it.

Two more examples where the average misleads you, drawn with real k6 numbers:

![One freak request in 100 nudges the average up while p95 stays put; half fast and half slow requests give an average that describes nobody](/assets/images/console-average-vs-percentile.svg)

## Three traps to avoid

![Three traps: never average percentiles; high percentiles need many requests; a percentile is a time, not a share](/assets/images/percentile-traps-easy.svg)

1. **Never average percentiles.** Server A (900 requests, all 100 ms) has p95 = 100 ms; server B (100 requests, all 1000 ms) has
   p95 = 1000 ms. The average of those two is 550 ms — but the p95 of **all 1000 requests together** is **1000 ms**. Always combine the raw numbers first, then work out the percentile once.
2. **High percentiles need many requests.** With only 100 requests, p99 depends on the single slowest one. A longer test gives steadier numbers.
3. **The percentile is a time, not a score.** `p(95)=112ms` means 95 out of 100 requests took 112 ms or less. Whether that is *good* depends on your goal — that is what a
   **threshold** is for (e.g. `p(95)<400`).

## For the curious — other ways to compute a percentile

Different books use slightly different rules. With only ten requests the answers can differ a little:

![Three methods for p90 and p95 on ten requests: nearest rank gives 900 and 1000, average of neighbours gives 900 and 950, and k6's interpolation gives 910 and 955](/assets/images/percentile-methods-compare.svg)

k6 uses the “walk the stairs” method (called **linear interpolation**) from Step 4 — the same method NumPy uses by default and that Excel's `PERCENTILE.INC` uses. With many requests all the methods give almost the same answer,
so just remember **which one your tool uses** when comparing numbers.

## Check yourself

Try these before peeking at the answers:

1. You have 5 requests: 10, 20, 30, 40, 50 ms. What is the **median**? *(30)*
2. Add a sixth request of 60 ms. What is the median now? *(the middle two are 30 and 40 → 35)*
3. Nine requests take 100 ms and one takes 1000 ms. Is the average **more** or **less** than 100? Why? *(More — 190 — the slow one pulls it up.)*
4. A test shows `p(95)=250ms`. In your own words? *(95 out of every 100 requests took 250 ms or less; only the slowest 5% took longer.)*
5. With 5 requests (10, 20, 30, 40, 50), what **position** does p50 land on? *(0.5 × (5 − 1) = 2 → the 3rd request, 30 ms.)*
6. Server A's p95 is 200 ms and server B's is 400 ms. Is the combined p95 exactly 300 ms? *(No — never average percentiles.)*

## Common pitfalls

- **Forgetting to sort first.** Percentiles only make sense on a sorted list (k6 sorts for you; by hand, sort first!).
- **Counting positions from 1 instead of 0** in k6's formula. The first request is position **0**, so the last of *n* is position *n − 1*.
- **Mixing up the share and the value.** The “95” is a share of requests; the answer is a time.
- **Trusting the average alone.** It hides a slow tail *and* half-fast/half-slow splits.
- **Averaging percentiles** across servers or test runs — combine the raw data instead.
- **Reading p99 from tiny samples.** Not enough requests → one blip decides the number.

## Key takeaways

- A **percentile** is what you find by **sorting** the times and walking a **percent of the way** along the line.
- **p90 = 910 ms** means “90 out of 100 requests took 910 ms or less”. **p0 = min, p50 = median, p100 = max.**
- The **average is a seesaw balance point** — one slow request drags it; percentiles are not fooled.
- k6's recipe: **position = p ÷ 100 × (n − 1)**, then **walk** a fraction between the two neighbouring values.
- Judge health with **p(90) / p(95) / p(99)**, never average percentiles, and use enough requests.

## Further reading

- [Grafana k6 — Metrics and percentiles](https://grafana.com/docs/k6/latest/using-k6/metrics/)
- [http_req_duration and Percentiles](/k6-console-output/http-req-duration-and-percentiles.md) — the same ideas applied to a real k6 run
- [Reading the k6 Summary — a Guided Tour](/k6-console-output/reading-the-k6-summary.md)
- [Load Testing](/introduction-to-performance-testing/load-testing.md) — set goals with thresholds like `p(95)<500`
