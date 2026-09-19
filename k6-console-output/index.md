---
title: Understanding the k6 Console Output
description: >
  A guided, line-by-line tour of what k6 prints when a test runs — the header, live
  progress and the results table — and a deep dive into http_req_duration and percentiles
  (avg, min, med, max, p90, p95).
---

## Concepts

- [Reading the k6 Summary — a Guided Tour](/k6-console-output/reading-the-k6-summary.md) — walk through a real run from top to bottom: the header (VUs, duration, graceful stop), live progress, and every metric in the results table
- [http_req_duration and Percentiles](/k6-console-output/http-req-duration-and-percentiles.md) — what the response-time line means, how avg / min / med / max / p(90) / p(95) are calculated, and why percentiles beat averages
- **See also:** [Math for Performance Testers](/math-for-performance-testers/index.md) — the picture-first guide to how percentiles are calculated, in its own section (#10 of the learning path)
