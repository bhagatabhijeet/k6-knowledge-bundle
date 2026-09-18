---
type: Concept
title: Expected Responses and http_req_failed
description: >
  How k6 decides whether an HTTP response was "expected" (default status 200–399), what the
  { expected_response:true } line in the summary means, how http_req_failed is calculated, and how to
  redefine "expected" per request or for a whole test.
tags:
  - k6
  - expected-response
  - http-req-failed
  - http-expectedstatuses
  - metrics
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

In the [console tour](/k6-console-output/reading-the-k6-summary.md) you saw a mysterious second line under `http_req_duration`:

```
http_req_duration..............: avg=93.16ms  …
  { expected_response:true }...: avg=93.16ms  …
http_req_failed................: 0.00%  0 out of 27
```

This page explains it. The idea is simple:

> Every time k6 gets a response back, it asks one question — **“is this HTTP status one I was expecting?”**
> If yes, the request is **expected**. If no, it counts as **failed**.

By default, **status codes 200 to 399 are expected**. That covers normal pages (200), created resources (201), and redirects (301, 302).
Everything else — **404 Not Found, 500 Server Error, 401 Unauthorized** … — is *not* expected, so those requests are **failed requests**.

## Why it matters

A load test that only measures speed can lie. Imagine your server, under heavy load, starts answering **every** request with a quick `500 Server Error`.
The responses are fast — so `http_req_duration` looks wonderful! — but every one is a failure. The expected-response rule is what exposes this:

- **`http_req_failed`** tells you what share of requests failed (the error rate).
- **`{ expected_response:true }`** gives you response times for the *successful* requests only, so failures can't flatter (or ruin) your speed numbers.

Together they answer the two questions that matter: *“How fast?”* and *“How reliably?”*

## How it works

![How k6 decides whether a response was expected: the status is compared with the expected list, the request is tagged expected_response true or false, and false ones count towards http_req_failed](/assets/images/core-expected-response-flow.svg)

### The decision, step by step

1. A response arrives with a status code (200, 404, 302 …).
2. k6 compares it with the **expected list** — **200–399** unless you change it.
3. In the list → the request gets the tag **`expected_response = true`**. Not in the list → **`expected_response = false`**, and it is a **failed request**.
4. **`http_req_failed`** is simply: `failed requests ÷ total requests`. (It is a built-in **Rate** metric.)

### Seeing it in a real run

The script [expected-responses.js](/assets/code/k6-core-concepts/expected-responses.js) sends three requests to the QuickPizza demo app:

```js
// assets/code/k6-core-concepts/expected-responses.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.5'],
    'http_req_duration{expected_response:true}': ['p(95)<800'],
  },
};

export default function () {
  // 1) a normal page — 200 is inside the default expected range
  const ok = http.get('https://quickpizza.grafana.com/');

  // 2) a missing page — 404 is NOT expected by default, so it counts as failed
  const missing = http.get('https://quickpizza.grafana.com/does-not-exist');

  // 3) same missing page, but for THIS request we declare 404 to be expected
  const expected404 = http.get('https://quickpizza.grafana.com/does-not-exist', {
    responseCallback: http.expectedStatuses(404),
  });

  check(missing, { 'missing page is 404': (r) => r.status === 404 });
}
```

[Source](/assets/code/k6-core-concepts/expected-responses.js)

| # | Request | Status | Expected? | Counts as failed? |
|---|---|---|---|---|
| 1 | `GET /` | 200 | ✓ (inside 200–399) | no |
| 2 | `GET /does-not-exist` | 404 | ✗ (outside 200–399) | **yes** |
| 3 | same URL, `expectedStatuses(404)` | 404 | ✓ (we said so) | no |

And here is what the real console printed, with the lines marked up:

![The expected-response lines of the console explained: all three requests timed, only the two expected ones on the expected_response:true line, and 1 of 3 failed](/assets/images/core-expected-response-console.svg)

Read the four lines:

- **`http_req_duration`** — timings of **all 3** requests.
- **`{ expected_response:true }`** — timings of only the **2 expected** ones (the 200 and the 404 we declared expected). Its average (96.5 ms) differs from the line above because the unexpected 404 is left out.
- **`http_req_failed: 33.33%  1 out of 3`** — one failure in three requests (`1 ÷ 3`).
- **`http_reqs: 3`** — the total, i.e. the denominator.

> **When nothing fails,** the two `http_req_duration` lines are identical — that is exactly what you saw in the first run of the [first test](/k6-configuration-options-in-code-editor/writing-your-first-k6-test.md):
> all 27 requests were expected, so `{ expected_response:true }` repeated the same numbers.

### Changing what “expected” means

Sometimes a 404 (or a 401) is *exactly what you want*: probing for missing pages, testing that unauthenticated users are rejected, or checking a delete returns 204. Tell k6 with **`http.expectedStatuses()`**.

**For one request** — pass a `responseCallback`:

```js
http.get(url, { responseCallback: http.expectedStatuses(404) });          // only 404
http.get(url, { responseCallback: http.expectedStatuses(200, 201, 404) }); // a list of statuses
http.get(url, { responseCallback: http.expectedStatuses({ min: 200, max: 299 }) }); // a range
```

**For the whole test** — set a global callback once, at the top of the script:

```js
// assets/code/k6-core-concepts/global-expected-statuses.js
import http from 'k6/http';

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 404));

export default function () {
  http.get('https://quickpizza.grafana.com/');                 // 200 → expected
  http.get('https://quickpizza.grafana.com/does-not-exist');   // 404 → expected (we listed it)
  http.get('https://test.k6.io/', { redirects: 0 });           // 302 → outside 200–299 → FAILED
}
```

[Source](/assets/code/k6-core-concepts/global-expected-statuses.js)

Notice the third request: with the default range (200–399) a `302` is fine, but the global rule above narrows the range to 2xx — so it now counts as **failed** (`http_req_failed = 33.33%`).
`expectedStatuses` accepts single status numbers and `{ min, max }` ranges, in any combination.

> **Verified:** with k6’s defaults, a `302` (redirect, with redirects switched off) counted as *expected*, while a `404` counted as *failed*. Changing the callback changed the result exactly as described.

### Using it in thresholds

Because `http_req_failed` is a normal metric, you can set goals on it — and on the expected-only timings:

```js
thresholds: {
  http_req_failed: ['rate<0.01'],                                  // fewer than 1% failed requests
  'http_req_duration{expected_response:true}': ['p(95)<500'],      // speed of the GOOD responses only
},
```

More in [Thresholds](/k6-core-concepts/thresholds.md).

### Expected response vs. check — not the same thing

New users often mix these up. They are separate mechanisms:

![Three gates compared: check asserts about one response, the expected-response rule classifies each request as failed or not, and a threshold judges the whole test with an exit code](/assets/images/core-checks-vs-thresholds-vs-expected.svg)

| | **Expected response** | **`check()`** |
|---|---|---|
| Who decides? | **k6**, from the status code and the expected list | **You**, with any assertion (body text, header, JSON field…) |
| Feeds | `http_req_failed` and the `expected_response` tag | the `checks` metric (a pass percentage) |
| Example | “404 is not in 200–399 → failed” | “the body contains `pizza`” |

The demo shows it: the check `status is 404` **passes (100%)**, yet `http_req_failed` still counts that same 404 as a failure. Use **both** — expected responses for HTTP-level health, checks for correctness of content.

## Common pitfalls

- **Assuming a 404 or 401 “test” shows 0% errors.** By default they count as failed. If you *expect* them, say so with `expectedStatuses`.
- **Thinking `http_req_failed` covers checks.** It does not — a failed `check()` never changes it (and vice versa).
- **Reading only `http_req_duration`.** Fast errors look great on speed. Always read `http_req_failed` next to it.
- **Forgetting redirects are 3xx.** With default settings k6 follows redirects and 3xx are expected; with `redirects: 0` you see the 302 itself.
- **Narrowing the global range by accident.** `setResponseCallback` applies to *every* request in the script — including ones you forgot about.
- **Confusing `expected_response:true` with success of your business logic.** It only means the HTTP status was acceptable.

## Key takeaways

- k6 classifies every response: **expected** (default status **200–399**) or **failed**.
- **`http_req_failed`** = failed ÷ total; a built-in **Rate** metric.
- The **`{ expected_response:true }`** summary line shows timings for expected responses only.
- Redefine “expected” with **`http.expectedStatuses(...)`** — per request via `responseCallback`, or globally via `http.setResponseCallback`.
- **Checks are separate** from expected responses; use both, and set **thresholds** on `http_req_failed`.

## Further reading

- [Grafana k6 — Built-in metrics](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/)
- [Grafana k6 — Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Thresholds — Pass/Fail Goals for Your Metrics](/k6-core-concepts/thresholds.md)
- [Reading the k6 Summary — a Guided Tour](/k6-console-output/reading-the-k6-summary.md)
