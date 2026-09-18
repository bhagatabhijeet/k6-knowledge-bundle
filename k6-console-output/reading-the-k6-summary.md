---
type: Guide
title: Reading the k6 Summary — a Guided Tour
description: >
  A line-by-line walk through the console output of a real k6 run (3 virtual users, 10 seconds):
  what the header says, what the live progress shows, and what each metric in the results table
  means, with colour-coded, labelled console images.
tags:
  - k6
  - console-output
  - metrics
  - results
  - http-reqs
  - iterations
  - vus
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

When a k6 test finishes, it prints a report to the terminal. It looks busy the first time, but it has a simple
structure — and once you know it, you can read any k6 run in seconds.

Everything below comes from one real run: the [first test](/k6-configuration-options-in-code-editor/writing-your-first-k6-test.md)
— **3 virtual users, looping for 10 seconds**, each doing one GET request and a 1-second sleep.

```bash
k6 run first-test.js
```

## Why it matters

The console output is your first performance report. It tells you **what you asked for**, **what actually
happened**, and **how fast and how reliable the system was**. Reading it correctly is the foundation for everything
that follows — thresholds, stress tests, dashboards.

## How it works — the tour

Imagine I'm standing next to you, pointing at the screen. Follow the coloured lines:

![A guided tour of the k6 console: run header, live progress and each result metric, marked with numbered coloured labels](/assets/images/console-output-tour.svg)

The output has three parts: **① what you asked for** → **② what is happening live** → **③–⑩ the final scoreboard**.

### ① The header — “what did I ask for?”

Before anything runs, k6 restates the plan:

```
     execution: local
        script: first-test.js
        output: -
     scenarios: (100.00%) 1 scenario, 3 max VUs, 40s max duration (incl. graceful stop):
              * default: 3 looping VUs for 10s (gracefulStop: 30s)
```

Read it as a sentence: *“Run **first-test.js** locally as **one scenario** with up to **3 virtual users**, looping for **10
seconds**.”* The interesting part is the timing:

![The scenarios line colour-coded piece by piece, with a clock showing 10 seconds of testing plus up to 30 seconds of graceful stop](/assets/images/console-header-explained.svg)

| Piece | Meaning | Where it comes from |
|---|---|---|
| `1 scenario` | One load plan | Your script (a plain `vus` + `duration` creates one scenario called `default`) |
| `3 max VUs` / `3 looping VUs` | Three virtual users, each repeating your function | `vus: 3` |
| `for 10s` | How long they loop | `duration: '10s'` |
| `gracefulStop: 30s` | Users still mid-request at the 10-second mark get up to 30 seconds to finish (the default) | k6 default |
| `40s max duration` | **10s + 30s** — the *worst-case* length | Calculated |

> **Is the test going to take 40 seconds?** No. 40 seconds is a safety **ceiling**. The graceful-stop window is only used if some
> user is still in the middle of a request at 10 seconds. In this run everything finished at **10.1 seconds**.

### ② Live progress — “what is happening now?”

While the test runs, k6 updates a couple of lines every second:

```
running (04.0s), 3/3 VUs, 9 complete and 0 interrupted iterations
default   [  40% ] 3 VUs  04.0s/10s
```

That means: 4 seconds in, all 3 users are active, 9 loops finished so far, none cut short — and 40% of the 10 seconds has elapsed.
It is a progress bar, nothing more.

### ③ TOTAL RESULTS — the final scoreboard

When the time is up, k6 prints the results, grouped into three headings: **HTTP**, **EXECUTION** and **NETWORK**.

```
  █ TOTAL RESULTS

    HTTP
    http_req_duration..............: avg=93.16ms min=63.56ms med=98.67ms max=117.05ms p(90)=106.01ms p(95)=112.21ms
    http_req_failed................: 0.00%  0 out of 27
    http_reqs......................: 27     2.670024/s

    EXECUTION
    iteration_duration.............: avg=1.12s   min=1.06s   med=1.1s    max=1.34s    p(90)=1.2s     p(95)=1.34s
    iterations.....................: 27     2.670024/s
    vus............................: 3      min=3       max=3
    vus_max........................: 3      min=3       max=3

    NETWORK
    data_received..................: 102 kB 10 kB/s
    data_sent......................: 6.6 kB 655 B/s
```

Each line is a **metric** — a measurement k6 collected. Take them one at a time.

#### ④ `http_req_duration` — how long requests took

The **most important** line: the time each request took, summarised as average, minimum, median, maximum and two percentiles.
It deserves its own page: [http_req_duration and Percentiles](/k6-console-output/http-req-duration-and-percentiles.md).

#### ⑤ `http_req_failed` — how many requests failed

`0.00%  0 out of 27` — none of the 27 requests failed. A request counts as failed when it gets an error status or no response. If you
see a non-zero rate, something is wrong; the number tells you how wrong.

#### ⑥ `http_reqs` — how many requests were made

`27  2.670024/s` — k6 sent **27 requests** in total, which works out to about **2.67 requests per second**. That second number is
**throughput**: how much work the system got done per second.

#### ⑦ `iteration_duration` — how long one whole loop took

Time for one complete run of your `default` function. Here that is about **1.12 seconds**: the request (~0.09 s) **plus** the 1-second `sleep(1)` we added.

#### ⑧ `iterations` — how many loops were completed

`27` — the `default` function ran 27 times. Because each run makes exactly one request, **27 iterations = 27 requests**.

#### ⑨ `vus` and `vus_max` — how many users

`3  min=3  max=3` — three virtual users all the way through. When you use ramping stages, these show the minimum and maximum
reached, so you can confirm you really hit your target load.

#### ⑩ `data_received` / `data_sent` — network traffic

`102 kB` came back and `6.6 kB` went out, with the per-second rates beside them. Handy for spotting unexpectedly heavy responses.

### Where do “27 requests” come from?

This is the question every beginner asks, so here it is drawn out:

![Three virtual users each looping for ten seconds; every loop is a short request plus a one second sleep, giving about 27 iterations and 27 requests](/assets/images/console-vus-iterations-story.svg)

1. One loop = one request (~0.09 s) + `sleep(1)` (1 s) ≈ **1.12 s** → that is `iteration_duration`.
2. In 10 seconds each user completes about 10 ÷ 1.12 ≈ **9 loops**.
3. Three users → **≈ 27 loops** → `iterations: 27`.
4. One request per loop → `http_reqs: 27`.

Your exact numbers will differ from run to run (network speed, server load) — but the *relationships* between them always hold.

### The duplicate `{ expected_response:true }` line

Under `http_req_duration` you may see a second line labelled `{ expected_response:true }` with the same numbers. It is the same metric,
filtered to requests that got an *expected* (non-error) response. It is explained fully in [Expected Responses and http_req_failed](/k6-core-concepts/expected-responses.md); for now, if it matches the line above it, all
responses were fine.

### Choosing how much k6 prints

k6 has a summary mode you can pick (`compact`, `full` or `disabled`) with `--summary-mode`, and you can choose which
statistics appear for response-time metrics with `--summary-trend-stats`. See
`k6 run --help` for the current list.

## Common pitfalls

- **Mistaking the 40 s “max duration” for the run time.** It is the ceiling including graceful stop, not a wait.
- **Reading only the average.** The `p(95)` and `max` numbers tell you far more — see the next page.
- **Comparing runs with different loads.** Iterations and requests scale with users and duration; compare rates and percentiles, not raw counts.
- **Ignoring `http_req_failed`.** Fast responses that are all errors look great on speed and are useless.
- **Expecting the same numbers twice.** Response times vary; run more than once and look at the pattern.
- **Forgetting `sleep`.** Without think time, `iterations` and `http_reqs` balloon, because each user fires requests back to back.

## Key takeaways

- The console has **three parts**: the **header** (the plan), **live progress**, and the **TOTAL RESULTS** table.
- **`40s max duration`** = test duration + graceful stop — a ceiling, not the expected length.
- **`http_req_duration`** is response time; **`http_req_failed`** is the error rate; **`http_reqs`** is the request count and throughput.
- **`iterations`** counts completed loops; with one request per loop, iterations = requests.
- **`iteration_duration`** ≈ request time + `sleep` time.

## Further reading

- [Grafana k6 — Results output](https://grafana.com/docs/k6/latest/results-output/)
- [Grafana k6 — Built-in metrics](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/)
- [http_req_duration and Percentiles](/k6-console-output/http-req-duration-and-percentiles.md)
- [Writing and Running Your First k6 Test](/k6-configuration-options-in-code-editor/writing-your-first-k6-test.md)
