---
type: Concept
title: Thresholds — Pass/Fail Goals for Your Metrics
description: >
  Thresholds turn k6 metrics into pass/fail goals. Covers the anatomy of a threshold, which aggregation
  methods work on Counter, Gauge, Rate and Trend metrics, sub-metric tags, reading the THRESHOLDS block,
  exit code 99, abortOnFail, and how thresholds differ from checks.
tags:
  - k6
  - thresholds
  - metrics
  - abortonfail
  - exit-code
  - sla
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

A **threshold** is a **pass/fail goal** for a metric. You say *“the 95th percentile of response time must be under 400 ms”*, and after the test
k6 tells you whether the goal was met.

```js
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<400'],   // 95% of requests must finish under 400 ms
    http_req_failed:   ['rate<0.1'],    // fewer than 10% of requests may fail
  },
};
```

Without thresholds, k6 prints numbers and always finishes “successfully”. **With** thresholds, your test has a **verdict** — and that verdict is what turns k6
into an automatic quality gate.

## Why it matters

- **Your SLA becomes code.** “95% of requests under 500 ms” stops being a sentence in a document and becomes a rule that runs on every build.
- **Automation needs a verdict.** A CI pipeline can’t read a report; it can check an **exit code**. A crossed threshold makes k6 exit with code **99**, so the pipeline fails.
- **You stop eyeballing.** Instead of scanning 20 metrics, you look for ✓ or ✗.

## How it works

### The anatomy of a threshold

![Anatomy of a k6 threshold: the metric, an optional tag filter, then rules made of an aggregation, an operator and a value; plus a table of aggregations by metric type](/assets/images/core-threshold-anatomy.svg)

```js
'http_req_duration{name:home}': ['p(95)<800', 'avg<800'],
//  ①metric        ②tag filter    ③agg ④op ⑤value
```

| Part | What it is | Examples |
|---|---|---|
| ① **metric** | What to measure | `http_req_duration`, `http_req_failed`, `checks`, or your own custom metric |
| ② **`{tag filter}`** | *Optional.* Judge only samples with that tag | `{name:home}`, `{expected_response:true}` |
| ③ **aggregation** | Boil many samples down to one number | `avg`, `med`, `p(95)`, `count`, `rate`, `value` |
| ④ **operator** | Compare | `<`  `<=`  `>`  `>=` |
| ⑤ **value** | Your goal | `800` (ms), `0.1` (10%) |

Several rules in the list are combined with **AND** — *all* must hold.

### Which aggregation works on which metric?

k6 has four **metric types**, and each allows different aggregations:

| Type | What it is | Allowed aggregations | Built-in example | Example threshold |
|---|---|---|---|---|
| **Counter** | a number that only goes up | `count`, `rate` | `http_reqs`, `data_sent` | `pizzas_requested: ['count>=4']` |
| **Gauge** | remembers the latest value | `value` | `vus`, `vus_max` | `last_body_size: ['value>0']` |
| **Rate** | the share of “true” values (0 – 1) | `rate` | `http_req_failed`, `checks` | `good_responses: ['rate>0.9']` |
| **Trend** | many values, summarised | `avg`, `min`, `max`, `med`, `p(N)` | `http_req_duration` | `page_time: ['med<800', 'p(99)<1000']` |

Units matter: **times are in milliseconds** (`p(95)<800` = 800 ms) and **rates are fractions from 0 to 1** (`rate<0.1` = 10%).
The percentile `p(N)` is exactly the value explained in [The Math of Percentiles](/math-for-performance-testers/percentile-math.md).

### A complete example

[thresholds-demo.js](/assets/code/k6-core-concepts/thresholds-demo.js) uses one goal for each metric type:

```js
// assets/code/k6-core-concepts/thresholds-demo.js  (excerpt)
const pizzasRequested = new Counter('pizzas_requested'); // Counter
const lastBodySize    = new Gauge('last_body_size');     // Gauge
const goodResponses   = new Rate('good_responses');      // Rate
const pageTime        = new Trend('page_time', true);    // Trend

export const options = {
  vus: 2,
  iterations: 4,
  thresholds: {
    http_req_duration: [__ENV.BREAK ? 'p(95)<1' : 'p(95)<800'],  // BREAK=1 → impossible goal
    http_req_failed: ['rate<0.1'],
    checks: ['rate>0.9'],
    'http_req_duration{name:home}': ['p(95)<800', 'avg<800'],    // sub-metric, two rules
    pizzas_requested: ['count>=4'],
    last_body_size: ['value>0'],
    good_responses: ['rate>0.9'],
    page_time: ['med<800', 'p(99)<1000'],
  },
};
```

[Source](/assets/code/k6-core-concepts/thresholds-demo.js)

```bash
k6 run thresholds-demo.js             # every goal met   → exit code 0
k6 run -e BREAK=1 thresholds-demo.js  # p(95) < 1 ms     → ✗ crossed → exit code 99
```

### Reading the THRESHOLDS block

k6 prints a **THRESHOLDS** section before the results. Here is real output from the `BREAK=1` run, with the markers a teacher would draw on the screen:

![The THRESHOLDS block of the console explained: a failed goal with a red cross, a sub-metric with two rules, built-in and custom metrics, and the exit code 99 verdict](/assets/images/core-thresholds-console.svg)

- **✓** — the goal was met. **✗** — it was **crossed** (missed).
- Each metric is listed with its rules and the **actual value** next to it, so you see *how* close you were (`p(95)=112.34ms` against a goal of `< 1`).
- Rules with a **`{tag}`** appear indented under their metric.
- **One ✗ anywhere = the test failed.** k6 logs *“thresholds on metrics ‘http_req_duration’ have been crossed”* and exits with **code 99**.

### Exit code 99 — what your pipeline sees

| Result | k6 exit code | A CI pipeline… |
|---|---|---|
| All thresholds passed (or none set) | **0** | continues |
| One or more thresholds crossed | **99** | **fails the build** |

Check it yourself: `echo $?` (macOS / Linux / Git Bash) or `$LASTEXITCODE` (PowerShell) right after the run.
(This bundle’s later CI topic builds on exactly this.)

### Sub-metrics: goals for a single request or tag

Tag a request and you can set a goal for *just that request*:

```js
export const options = {
  thresholds: {
    http_req_duration:                ['p(95)<500'],   // everything
    'http_req_duration{name:home}':   ['p(95)<300'],   // only the home page — stricter
    'http_req_duration{name:search}': ['p(95)<800'],   // only search — more lenient
  },
};

http.get(url, { tags: { name: 'home' } });   // the tag k6 matches against
```

> **Careful — a goal with no data passes silently.** If no request ever carries the tag (a typo like `name:hme`, or a stage that never happens), k6 has no samples to judge and the threshold shows ✓ with `0`.
> We saw exactly this in a short run: `http_req_duration{hour:3}` reported `p(95)=0s` ✓ because no request had reached hour 3. Always check that the tag really exists.

### abortOnFail — stop early

By default k6 finishes the whole test and *then* judges. To stop the moment a goal is lost, use the object form:

```js
thresholds: {
  http_req_duration: [{
    threshold: 'p(95)<1',   // impossible on purpose
    abortOnFail: true,      // stop the whole test when crossed
    delayAbortEval: '3s',   // wait 3 s first so there are enough samples
  }],
},
```

![abortOnFail timeline: a 30 second test with a 3 second delayAbortEval stopped at about 4 seconds when the threshold was crossed, exiting with code 99](/assets/images/core-abort-on-fail.svg)

Real result with [abort-on-fail.js](/assets/code/k6-core-concepts/abort-on-fail.js): a 30-second test **stopped after about 4 seconds** with exit code 99 and the message
*“…abortOnFail enabled, stopping test prematurely”*. It saves time and protects a shared environment from being hammered when the test is already lost.
`delayAbortEval` matters: without it, one slow first request could abort the test before enough data exists to judge fairly.

### Thresholds, checks and expected responses

Three mechanisms, three questions — they work best together:

![Three gates compared: check asserts about one response, expected response classifies a request as failed, threshold judges the whole test](/assets/images/core-checks-vs-thresholds-vs-expected.svg)

- **`check()`** — *was THIS response right?* Failing a check does **not** stop or fail the test.
- **Expected response** — *was the HTTP status acceptable?* Feeds `http_req_failed` (see [Expected Responses](/k6-core-concepts/expected-responses.md)).
- **Threshold** — *did the WHOLE test meet its goals?* The only one that changes the exit code.

The link between them: to make failed **checks** fail the test, put a threshold on the built-in `checks` metric: `checks: ['rate>0.9']`.

### Thresholds in k6 Studio

If you build tests with [k6 Studio](/k6-setup/k6-studio.md), thresholds are a small form: pick a *Metric*, a *Statistic* (e.g. *95th percentile*), a *Condition*, a *Value*, and tick **Stop test** for `abortOnFail`:

![The Thresholds panel of k6 Studio: Response time, 95th percentile, less than 400 ms, with Stop test checked](/assets/images/k6-studio-thresholds.png)

That single row generates exactly `http_req_duration: [{ threshold: "p(95)<400", abortOnFail: true }]`.

## Common pitfalls

- **Setting no thresholds.** The test then can never fail — CI will always be green.
- **Wrong units.** `p(95)<0.5` means 0.5 *milliseconds*. Times are in ms; rates are 0–1.
- **Using the wrong aggregation for the metric type.** `avg` works on a Trend; a Rate only has `rate`. (k6 reports an error rather than running.)
- **A tag that never appears.** The threshold passes on zero samples — verify the tag exists.
- **Setting only speed goals.** Add `http_req_failed` so fast errors can’t pass.
- **Impossible or arbitrary numbers.** Base goals on your SLA or a measured baseline, not a guess; a goal that always fails is ignored by the team.
- **`abortOnFail` without `delayAbortEval`.** An early outlier may stop a healthy test.
- **Judging a tiny sample.** With few requests, high percentiles are unstable (see [Percentile traps](/math-for-performance-testers/percentile-math.md)).

## Key takeaways

- A **threshold** = *metric* + optional *{tag}* + *aggregation* + *operator* + *value* — a pass/fail goal.
- Aggregations depend on the **metric type**: Counter (`count`, `rate`), Gauge (`value`), Rate (`rate`), Trend (`avg`, `min`, `max`, `med`, `p(N)`).
- The console shows **✓ / ✗** per rule; **any ✗ → exit code 99**, which fails a CI pipeline.
- Use **`{tag}` sub-metrics** for per-request goals and **`abortOnFail` + `delayAbortEval`** to stop a failing test early.
- **Checks, expected responses and thresholds** are different tools — combine them.

## Further reading

- [Grafana k6 — Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Grafana k6 — Metrics](https://grafana.com/docs/k6/latest/using-k6/metrics/)
- [Expected Responses and http_req_failed](/k6-core-concepts/expected-responses.md)
- [The Math of Percentiles — Explained Simply](/math-for-performance-testers/percentile-math.md)
- [Load Testing](/introduction-to-performance-testing/load-testing.md)
