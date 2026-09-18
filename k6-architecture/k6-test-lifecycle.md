---
type: Concept
title: The k6 Test Lifecycle
description: >
  The four stages k6 runs every script through — init, setup, VU code, teardown —
  explained with diagrams: what runs when, how many times, what each stage may do,
  how data flows between them, and where your code belongs.
tags:
  - k6
  - architecture
  - lifecycle
  - setup
  - teardown
  - init-context
  - virtual-users
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Every k6 script runs through **four stages, always in the same order**. Each stage is a place
where you can put code, and each one has different rules about **how often it runs** and **what it is
allowed to do**.

![The four k6 lifecycle stages: init, setup, VU code, teardown — when each runs, how often, and whether HTTP is allowed](/assets/images/k6-lifecycle-overview.svg)

If you remember only one picture from this page, make it this one. The rest of the page zooms in on it.

### Words used on this page

| Term | Meaning |
|---|---|
| **VU** (virtual user) | One simulated user. 50 VUs = 50 users acting at the same time. Each VU has its own copy of your script. |
| **Iteration** | One complete run of the VU code — one pass through the `default` function. |
| **Lifecycle function** | A function k6 calls for you at the right moment: `setup()`, `default()`, `teardown()`. |
| **Init context** | The top level of your script file — everything outside those functions. |

### The four stages at a glance

| # | Stage | Where the code lives | Runs | HTTP allowed? |
|---|---|---|---|---|
| 1 | **Init** | Top level of the file | **Once for each VU** (plus a few k6 start-up runs) | ❌ No |
| 2 | **Setup** | `export function setup()` | **Exactly once** per test | ✅ Yes |
| 3 | **VU code** | `export default function (data)` | **Over and over** — every iteration, in every VU | ✅ Yes |
| 4 | **Teardown** | `export function teardown(data)` | **Exactly once** per test | ✅ Yes |

> **Only stage 3 is your actual load test.** The response times k6 reports come from the
> VU code. Init, setup and teardown are preparation and clean-up around it.

## Why it matters

Where you put a line of code decides **how many times it runs** — and whether it counts in your
results:

- A login placed in `setup()` happens **once**. Placed in `default()`, it happens on **every
  iteration of every VU**, and it is measured as part of your test.
- Heavy work at the top of the file runs **for every VU** — 1,000 VUs means 1,000 copies of it.

Put code in the wrong stage and you get wrong numbers, wasted memory, or a test that fails before
it starts. Put it in the right stage and everything just works.

## How it works

### Stage 1 — Init: prepare the script

```js
import http from 'k6/http';                       // ← init
import { check, sleep } from 'k6';                // ← init
export const options = { vus: 3, iterations: 6 }; // ← init
```

Init is **everything at the top level of your file**: imports, `options`, constants, and loading
data files. k6 runs it **once for each VU**, because each VU has its own
[JavaScript runtime](/k6-architecture/how-k6-is-built.md) and needs its own copy of the script.
k6 also runs it a few extra times while starting up (to read your `options`, and to prepare the VU
that runs setup and teardown) — so init runs **at least once per VU**, never an exact number.

**The rule: no HTTP requests in init.** k6 stops with an error:

```
GoError: Making http requests in the init context is not supported
```

### Stage 2 — Setup: do it once before the load

```js
export function setup() {
  const res = http.post('https://example.com/login', { user: 'demo', pass: 'demo' });
  return { token: res.json('token') };   // handed to the VUs and to teardown
}
```

`setup()` runs **exactly once**, after init and before any VU starts working. HTTP is allowed.
Use it to create test data, log in once, or check the system is up. Whatever `setup()` **returns**
is passed on to the VU code and to `teardown()`. It must finish within `setupTimeout` (default
**60 seconds**).

### Stage 3 — VU code: the load test itself

```js
export default function (data) {
  const res = http.get('https://example.com/account', {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

This is the function k6 calls **again and again**. When one run finishes, that VU immediately
starts the next iteration, until the test's stages, duration or iteration count are used up. All
VUs do this at the same time — that *is* the load. Everything here is measured.

### Stage 4 — Teardown: clean up once

```js
export function teardown(data) {
  // e.g. delete the test data created in setup()
}
```

`teardown()` runs **exactly once** after the last iteration finishes. It receives the same `data`
that `setup()` returned.

## See it happen

### On a timeline

Here is one real run: `options = { vus: 3, iterations: 6 }`. Read across each row — that row is one VU.

![Timeline of the lifecycle with 3 VUs and 6 iterations: init per VU, one setup, six iterations across three VUs, one teardown](/assets/images/k6-lifecycle-timeline.svg)

Things to notice:

- **Init** happens in *each* VU lane (three times) — plus a few start-up runs on k6's own lane.
- **Setup** appears **once**, alone. The VUs wait for it to finish.
- **VU code** is the busy part. Six iterations are shared among three VUs (two each), and each VU
  loops straight back to the top as soon as it finishes one.
- **Teardown** appears **once**, after every VU has finished.

### In the console

Here is the script with each stage colour-coded, and exactly what it prints:

![The lifecycle script split into its four stages, each pointing to the console lines it produces and how many times](/assets/images/k6-lifecycle-code-map.svg)

```js
// assets/code/k6-architecture/test-lifecycle.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 3, iterations: 6 };

console.log('init      : script loaded (runs for every VU)');       // ① INIT

export function setup() {                                            // ② SETUP
  console.log('setup     : runs once, before the load starts');
  const res = http.get('https://test.k6.io');
  return { startedWithStatus: res.status };
}

export default function (data) {                                     // ③ VU CODE
  const res = http.get('https://test.k6.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  console.log(`iteration : setup returned status ${data.startedWithStatus}`);
  sleep(1);
}

export function teardown(data) {                                     // ④ TEARDOWN
  console.log('teardown  : runs once, after the load ends');
}
```

[Source](/assets/code/k6-architecture/test-lifecycle.js) — run it yourself with `k6 run test-lifecycle.js`.

> **Why does “init” print more than 3 times for 3 VUs?** k6 runs init once for every VU *and* a few
> extra times of its own (reading `options`, preparing the setup/teardown VU). In a real run with
> 3 VUs it printed 7 times. So plan for **at least one run per VU** — and never write init code that
> breaks if it runs more than once.

## Passing data between stages

Stages don't share variables. The **only** thing that carries data from one stage to the next is
what `setup()` **returns**:

![Data returned by setup is saved as JSON, and each VU and teardown receive a copy](/assets/images/k6-lifecycle-data-flow.svg)

```js
export function setup() {
  return { token: 'abc123', userIds: [1, 2, 3] };
}

export default function (data) {           // ← each VU receives its OWN copy
  console.log(data.token);                 // "abc123"
  data.token = 'changed';                  // only changes THIS VU's copy
}

export function teardown(data) {
  console.log(data.token);                 // still "abc123"
}
```

- What you return must be **JSON-serialisable**: numbers, strings, booleans, `null`, arrays and
  plain objects. Functions and class instances don't survive.
- Each VU works on its **own copy**. Changing `data` in one VU is invisible to the others — VUs
  are isolated from each other.

## Where should my code go?

Ask one question: **"How often should this run?"**

![A guide to where code belongs in each stage, with a worked example showing 1 login in setup versus 6,000 logins in the default function](/assets/images/k6-lifecycle-where-to-put-code.svg)

| If it should run… | Put it in | Examples |
|---|---|---|
| Once per **test**, before the load | `setup()` | Log in once, create test data, check the system is up |
| Once per **iteration**, by every VU | `default()` | The user journey you want to measure |
| Once per test, after the load | `teardown()` | Delete test data, send a notification |
| Once per **VU**, no HTTP | top of the file (init) | Imports, `options`, constants, loading a data file |

### A common mistake, in numbers

You run **100 VUs**, each doing **60 iterations**. If `login()` is inside `default()`, it runs
100 × 60 = **6,000 times** — and those logins are counted in your response-time results. Move it to
`setup()`, pass the token along, and it runs **once**. (The exception: if logging in *is* the
journey you are testing, keep it in `default()`.)

## When things go wrong

| Situation | What happens |
|---|---|
| **HTTP request in init** | k6 stops immediately: `Making http requests in the init context is not supported` |
| **`setup()` throws an error** | The test **aborts**. No VU code runs and **`teardown()` is not called** |
| **`setup()` is too slow** | It must finish within `setupTimeout` (default 60 s); raise it in `options` if legitimately needed |
| **An iteration fails a `check`** | The test **keeps going** — checks record pass/fail, they don't stop the run |

You can verify the second row yourself: when `setup()` throws, k6 reports the error and neither
`default()` nor `teardown()` runs. This is why `teardown()` shouldn't be your *only* line of defence for
critical clean-up.

Errors print the **file, line and column** — start there. For the full toolkit (there is no breakpoint debugger in k6), see
[Debugging k6 Scripts](/k6-setup/debugging-k6-scripts.md).

### With scenarios

By default the VU code is `export default function`. When you use **scenarios**, each scenario
can name its own function with `exec`, and those functions are also "VU code". The rest of the
lifecycle — init once per VU, setup once, teardown once — is unchanged.

## Common pitfalls

- **HTTP requests at the top level.** They belong in `setup()` or `default()`, never init.
- **Logging in inside `default()` and counting it as load.** Log in once in `setup()` and pass the
  token — unless login is the journey you're measuring.
- **Loading big data in init.** It runs per VU: memory × VU count. Load it once and share it
  (for example with `SharedArray`).
- **Expecting VUs to share variables.** A variable changed in one VU is invisible to the others.
  Shared, read-only data goes through `setup()`'s return value.
- **Assuming teardown always runs.** If `setup()` fails, `teardown()` is skipped.
- **Depending on an exact number of init runs.** k6's own start-up runs add extras; init must be safe
  to run more than once.
- **Returning non-JSON things from `setup()`.** Functions and class instances vanish on the way to the VUs.

## Check yourself

Before moving on, you should be able to answer these without looking back:

1. **How many times does `setup()` run in a test with 500 VUs?** — Once.
2. **Where do the response-time numbers in the k6 summary come from?** — The VU code (`default()`).
3. **You need an auth token for every request. Where do you fetch it?** — In `setup()`, and return it.
4. **What happens if you call `http.get()` at the top level of the script?** — k6 stops with an
   "init context" error.
5. **VU 1 changes `data.count`. Does VU 2 see the change?** — No, each VU has its own copy.
6. **`setup()` throws an error. Does `teardown()` run?** — No; the test aborts.

## Key takeaways

- Four stages, in order: **init → setup → VU code → teardown**.
- **Init**: once for each VU, **no HTTP**. **Setup** and **teardown**: exactly once. **VU code**:
  loops, and it *is* the load test.
- Ask **"how often should this run?"** to decide where code goes.
- **Only `setup()`'s return value** travels between stages — as a JSON copy for each VU.
- `setup()` failing aborts the test and skips `teardown()`.

## Further reading

- [Grafana k6 — Test lifecycle](https://grafana.com/docs/k6/latest/using-k6/test-lifecycle/)
- [How k6 Is Built — Go and the Sobek JavaScript Engine](/k6-architecture/how-k6-is-built.md) — why each VU has its own runtime
- [Load Testing](/introduction-to-performance-testing/load-testing.md) — how stages and VUs shape the load
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)
