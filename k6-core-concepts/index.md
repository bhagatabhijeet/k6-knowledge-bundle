---
title: k6 Core Concepts
description: >
  The building blocks every k6 test relies on — what counts as a failed request (expected
  responses), how to set pass/fail goals (thresholds), and how to shape load over time
  (stages: ramp-up, hold and ramp-down).
---

## Concepts

1. [Expected Responses and http_req_failed](/k6-core-concepts/expected-responses.md) — what k6 counts as a failed request, the mysterious `{ expected_response:true }` line, and how to redefine “expected” per request or for the whole test
2. [Thresholds — Pass/Fail Goals for Your Metrics](/k6-core-concepts/thresholds.md) — the anatomy of a threshold, which aggregations work on which metric types, sub-metrics, exit code 99 and `abortOnFail`
3. [Stages — Ramp-up, Hold and Ramp-down](/k6-core-concepts/stages.md) — shaping realistic load over time with the `stages` array, what `target` really means, and why the ramp-down is graceful

## How they fit together

```
   stages         →   shape the LOAD over time          (how many users, when)
   your script    →   requests go out, responses come back
   expected       →   each response is classified: expected ✓ or failed ✗
   responses
   metrics        →   http_req_duration, http_req_failed, checks …
   thresholds     →   goals on those metrics → ✓ / ✗ → exit code 0 or 99
```
