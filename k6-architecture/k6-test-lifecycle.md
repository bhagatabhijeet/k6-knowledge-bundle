---
type: Concept
title: The k6 Test Lifecycle
description: >
  The four stages k6 runs every script through — init, setup, VU code, teardown —
  what runs how many times, and which of them may make HTTP requests.
tags:
  - k6
  - architecture
  - lifecycle
  - setup
  - teardown
  - init-context
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Every k6 script is executed through **four lifecycle stages**, always in the same order. Each
stage is a place to put code, with different rules about *how often* it runs and *what it may do*.

```
   ┌─────────┐    ┌─────────┐    ┌───────────────────────┐    ┌───────────┐
   │  INIT   │───▶│  SETUP  │───▶│  VU CODE              │───▶│ TEARDOWN  │
   │         │    │         │    │  default() function   │    │           │
   │ once per│    │  once   │    │  loops, once per      │    │   once    │
   │  VU     │    │  per    │    │  iteration, in every  │    │   per     │
   │         │    │  test   │    │  VU                   │    │   test    │
   └─────────┘    └─────────┘    └───────────────────────┘    └───────────┘
   imports,       create data,   THE TEST — the user          clean up,
   options,       log in once    journey you are measuring     report
   file loading   HTTP allowed   HTTP allowed                  HTTP allowed
   NO HTTP
```

| Stage | Runs | Code lives in | HTTP allowed? | Typical use |
|---|---|---|---|---|
| **1. Init** | Once **per VU** | Top level of the script | ❌ No | `import`, `export const options`, loading files, building shared data |
| **2. Setup** | **Once** per test | `export function setup()` | ✅ Yes | Create test data, obtain a token, check the system is up |
| **3. VU code** | **Repeatedly**, once per iteration, in every VU | `export default function ()` | ✅ Yes | The user journey being load-tested |
| **4. Teardown** | **Once** per test | `export function teardown(data)` | ✅ Yes | Delete test data, send a notification |

## Why it matters

This is the k6 architecture showing through. Because
[each VU has its own JavaScript runtime](/k6-architecture/how-k6-is-built.md), your script's top-level
code runs *for every VU* — so where you put code decides whether it costs you one time or a thousand
times, and whether it is measured as part of your test.

- **Expensive work in `default()`** repeats on every iteration and pollutes your response-time results.
- **Expensive work in init** repeats per VU and multiplies memory and start-up time.
- **Work in `setup()`** happens exactly once and isn't part of the load you're measuring.

## How it works

The script below prints a line at each stage. Run it and count the lines:

```js
// assets/code/k6-architecture/test-lifecycle.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 3, iterations: 6 };

// 1) INIT — top-level code. No HTTP requests allowed here.
console.log('init      : script loaded (runs for every VU)');

// 2) SETUP — once per test. Return value is passed on as `data`.
export function setup() {
  console.log('setup     : runs once, before the load starts');
  const res = http.get('https://test.k6.io');
  return { startedWithStatus: res.status };
}

// 3) VU CODE — your test; k6 calls it repeatedly.
export default function (data) {
  const res = http.get('https://test.k6.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  console.log(`iteration : setup returned status ${data.startedWithStatus}`);
  sleep(1);
}

// 4) TEARDOWN — once per test, after the last iteration.
export function teardown(data) {
  console.log('teardown  : runs once, after the load ends');
}
```

[Source](/assets/code/k6-architecture/test-lifecycle.js)

Running `k6 run test-lifecycle.js` prints, in this order:

```
init      : script loaded (runs for every VU)    ← several times (see note)
setup     : runs once, before the load starts    ← exactly once
iteration : setup returned status 200            ← 6 times (6 iterations across 3 VUs)
teardown  : runs once, after the load ends       ← exactly once
```

> **Why does init print more than 3 times for 3 VUs?** k6 runs the init code once for every
> VU, and also a few extra times during its own start-up — to read your `options` and to prepare
> the VU that runs `setup()` and `teardown()`. So expect *at least* one run per VU. Never rely
> on init running an exact number of times.

### Passing data between stages

`setup()` can **return** data. k6 hands it to every VU's `default(data)` and to `teardown(data)`:

```js
export function setup() {
  const res = http.post('https://test.k6.io/login', { user: 'demo', pass: 'demo' });
  return { token: res.json('token') };   // JSON-serialisable data only
}

export default function (data) {
  http.get('https://test.k6.io/account', {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}
```

The data is a **copy** for each VU, and only JSON-serialisable values survive (no functions,
no class instances).

### What happens if setup fails?

- `setup()` must finish within **`setupTimeout`** (default **60 seconds**); raise it in `options` if needed.
- If `setup()` ends abnormally, the test aborts and **`teardown()` is not called**.

### `default` is not the only VU function

By default, the VU code is `export default function`. When you use **scenarios**, each scenario can
name its own function with `exec`, and those functions are also "VU code". The lifecycle is otherwise identical.

## Common pitfalls

- **Making HTTP requests in the init context.** Not allowed — k6 fails with an error. Move it to `setup()` or `default()`.
- **Logging in inside `default()` and measuring it.** If every iteration logs in, login load
  dominates your results. Log in once in `setup()` and pass the token — *unless* login is
  part of the journey you want to measure.
- **Putting heavy data loading in init.** It runs per VU (memory × VU count). Use
  `SharedArray` for large read-only datasets.
- **Expecting VUs to share variables.** A variable changed in one VU's `default()` is invisible
  to others. Shared state has to travel through `setup()` data or dedicated k6 features.
- **Assuming teardown always runs.** If `setup()` fails, `teardown()` is skipped — don't rely on it for critical cleanup.
- **Counting on exact init run counts.** Extra startup runs mean init code must be safe to run more than once.

## Key takeaways

- Four stages, in order: **init → setup → VU code → teardown**.
- **Init** runs per VU (no HTTP); **setup** and **teardown** run **once**; **VU code** repeats — it *is* the load test.
- Put one-time preparation in **`setup()`**, per-iteration behaviour in **`default()`**, and only imports/options/constants in **init**.
- `setup()`'s return value flows to `default(data)` and `teardown(data)` as JSON-serialisable data.

## Further reading

- [Grafana k6 — Test lifecycle](https://grafana.com/docs/k6/latest/using-k6/test-lifecycle/)
- [How k6 Is Built — Go and the Sobek JavaScript Engine](/k6-architecture/how-k6-is-built.md)
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)
