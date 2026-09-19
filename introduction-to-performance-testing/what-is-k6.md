---
type: Concept
title: What Is k6?
description: >
  k6 (Grafana k6) is a modern, JavaScript-based performance testing library
  that lets you write and run load tests from a code editor, with optional
  cloud execution and Grafana dashboard integration.
tags:
  - k6
  - grafana
  - performance-testing
  - javascript
  - tooling
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

**k6** — officially known as **Grafana k6** — is a modern, JavaScript-based performance
testing library owned and maintained by Grafana Labs. Despite being called a "performance
testing tool", k6 is fundamentally a library: you write scripts in JavaScript that describe
your load scenario, and k6 executes them.

k6 can performance-test both **APIs** and **web applications** (via its Playwright
integration for browser-based load testing).

## Why it matters

Traditional performance testing tools like **Apache JMeter** and **LoadRunner** come with
dedicated GUI applications that you download, install, and operate through a visual
interface. k6 takes a code-first approach: your test lives in plain `.js` files that you
edit in any code editor such as VS Code. This makes tests:

- **Version-controllable** — test scripts live alongside application code in Git.
- **Lightweight** — no heavyweight GUI to install; k6 itself is a single binary.
- **CI/CD-friendly** — scripts run from the command line and slot naturally into pipelines.

A minimal load test in k6 requires only a few lines of code, which significantly lowers
the barrier to getting started.

## How it works

A k6 script exports a default function that represents the behaviour of one virtual user
(VU). k6 spawns as many VUs as the scenario demands and runs that function concurrently:

```js
// assets/code/introduction-to-performance-testing/first-load-test.js
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,        // 10 virtual users
  duration: '30s' // run for 30 seconds
};

export default function () {
  http.get('https://test.k6.io');
  sleep(1);
}
```

[Source](/assets/code/introduction-to-performance-testing/first-load-test.js)

k6 collects metrics (response time, error rate, throughput) during the run and prints a
summary to the terminal. Results can also be streamed to **Grafana Cloud** for rich,
interactive dashboards.

## Bundle roadmap

This bundle follows a step-by-step progression in nine parts:

| # | Part | What you learn |
|---|---|---|
| 1 | Performance testing fundamentals | What performance testing is and the test types: smoke, load, stress, spike and soak |
| 2 | k6 setup | Installing k6, the editor, a project, k6 Studio; IntelliSense and your first test |
| 3 | k6 core concepts | Expected responses, thresholds, stages; reading the console; architecture and the test lifecycle |
| 4 | How to test APIs using k6 | Requests, parameterisation, data-driven tests and assertions against real API endpoints |
| 5 | Building load scenarios for functional API tests | Registration, check-in, order placement — measuring performance across full user journeys |
| 6 | Browser UI testing with Playwright k6 integration | The k6 browser module for UI-level testing and browser metrics |
| 7 | Building load scenarios for UI tests | Browser scenarios at scale, alongside protocol-level load |
| 8 | Building load tests for the Grafana Cloud platform | Streaming results to the cloud, dashboards, reports and cloud-scale runs |
| 9 | CI/CD integration | Embedding tests in pipelines with automatic pass/fail on threshold breach |

## Common pitfalls

- **Treating k6 as just a CLI tool.** k6 is a library; understanding it as such helps you
  write better, more modular test code.
- **Skipping the options block.** Without defining `vus` and `duration` (or stages), k6
  defaults to a single VU for a single iteration — not a meaningful load test.
- **Not using `sleep()`.** Omitting think time between requests causes unrealistically
  aggressive load and skewed results.

## Key takeaways

- k6 is a JavaScript-based performance testing library owned by Grafana Labs.
- It tests both APIs and web UIs, runs from the command line, and integrates with Grafana Cloud.
- Its code-first design makes it lightweight, version-controllable, and CI/CD-ready.
- No prior k6 knowledge is assumed; the bundle builds from fundamentals upward.

## Further reading

- [Grafana k6 official documentation](https://grafana.com/docs/k6/latest/)
- [k6 GitHub repository](https://github.com/grafana/k6)
- [What Is Performance Testing?](/introduction-to-performance-testing/what-is-performance-testing.md)
