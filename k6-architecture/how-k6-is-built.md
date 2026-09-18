---
type: Concept
title: How k6 Is Built — Go and the Sobek JavaScript Engine
description: >
  k6 is a Go program that embeds a JavaScript VM (Sobek, a fork of goja) to run test
  scripts. Explains what that means: it is not Node.js, how virtual users map onto
  runtimes, why modules work differently, and how Go extensions fit in.
tags:
  - k6
  - architecture
  - go
  - sobek
  - goja
  - javascript-engine
  - internals
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

The Grafana k6 documentation states it plainly:

> "the k6 engine is written in Go and embeds a JavaScript VM ([Sobek]) to execute
> JavaScript test code."
> — *Grafana k6 docs, Modules*

Two languages, two jobs:

| Layer | Language | Job |
|---|---|---|
| **The engine** — the `k6` binary | **Go** | Loads scripts, schedules virtual users, sends network traffic, collects metrics, evaluates thresholds |
| **Your test script** | **JavaScript** (or TypeScript) | Describes *what* a virtual user does and *how much* load to apply |
| **The bridge** — the JS engine | **Sobek** (Go) | Runs your JavaScript *inside* the Go program |

![k6 architecture: script, Go engine, per-VU Sobek runtimes, built-in Go modules, metrics engine and outputs](/assets/images/k6-architecture.svg)

## The JavaScript engine: Sobek

k6 does not use V8 (Chrome, Node.js) or any engine written in C. It uses
**Sobek** — a JavaScript engine written **entirely in Go** and maintained by Grafana. Sobek is
a fork of **goja**, the popular Go JavaScript engine; older k6 material and blog posts say
"goja", and it is the same lineage.

Why a Go-native engine rather than V8?

- **No cgo.** The Sobek project notes that being pure Go removes cgo dependencies, which
  makes cross-platform compilation easy — k6 ships as a single, self-contained binary for
  Windows, macOS and Linux.
- **Cheap Go ↔ JavaScript calls.** When your script calls `http.get(...)`, that call
  crosses from JavaScript into Go code. With a pure-Go engine, that crossing has low overhead,
  which matters when thousands of virtual users are making calls constantly.
- **Modest memory.** The k6 docs suggest budgeting roughly **1–5 MB of RAM per virtual
  user**, depending on script complexity and dependencies.

Trade-offs come with the choice: Sobek is an ECMAScript *interpreter*, so it is not as
fast at raw JavaScript number-crunching as V8's JIT — but a load test is dominated by network
waiting, not by JavaScript execution, so this rarely matters in practice.

## Why it matters

Knowing the architecture explains behaviours that otherwise look arbitrary:

| What you observe | Why — architecture explains it |
|---|---|
| `require('fs')` or `process.env` fails | k6 is **not Node.js**. The docs: *"k6 isn't Node.js or a browser. Packages that rely on APIs provided by Node.js won't work in k6."* |
| Most npm packages don't work | k6 uses **browser-like module resolution**, not Node's algorithm; it only loads built-in modules, local files and remote HTTP(S) scripts |
| `__ENV.MY_VAR` instead of `process.env` | Environment variables are exposed by the Go engine as `__ENV` |
| 1000 VUs need gigabytes of RAM | Each VU has its own JavaScript runtime and its own copy of your script and imports |
| `http.get` is fast, JS helpers are slower | HTTP is Go code; your JS runs in an interpreter |
| Your laptop can generate lots of traffic | Go's concurrency runs many VUs efficiently on modest hardware |
| A k6 test can't drive a real browser by itself | The core engine speaks protocols. Browser testing comes from the separate `k6/browser` module |

## How it works

### One JS runtime per virtual user

A Sobek runtime can only be used by **one goroutine at a time** (Go's lightweight thread),
and its values cannot be shared with another runtime. k6 therefore gives **each virtual user
its own runtime**. Consequences:

- VUs are **isolated** — one VU's variables are invisible to the others. Sharing data needs
  explicit tools such as `SharedArray` or `setup()`'s return value.
- Your script's top-level (*init*) code executes **for each VU**. That is why heavy
  work in the init context multiplies with VU count — see
  [The k6 Test Lifecycle](/k6-architecture/k6-test-lifecycle.md).
- Memory grows **linearly with VUs**: 10× the VUs, roughly 10× the RAM.

### Modules: two kinds, one import syntax

```js
import http from 'k6/http';            // built-in: Go code exposed to JavaScript
import { check, sleep } from 'k6';     // built-in
import { helper } from './helpers.js'; // local file — full filename required
```

- **Built-in modules** (`k6`, `k6/http`, `k6/metrics`, `k6/execution`, …) are written in **Go**
  and surfaced as JavaScript. This is why `http.get` is fast: the request is made by Go's networking code.
- **Local modules** use browser-like paths — you must write the full filename (`./helpers.js`).
- **Remote modules** load over HTTP(S) at run time. The docs warn to trust the code you import.
- **npm packages** are not resolved automatically. If you need one, **bundle** it (Webpack,
  Rollup, esbuild) into a single file first, and only if it doesn't depend on Node.js APIs.

### TypeScript: transpiled, not type-checked

k6's JS engine only understands JavaScript. For files ending in `.ts`, the docs say k6 uses
**esbuild** to transpile them. That transpile step **strips the type annotations but doesn't
type-check** — so `k6 run script.ts` works, but a type error won't stop it. Type-checking comes
from your editor and `@types/k6` (see [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)).

### Extensions: when JavaScript isn't enough

Because the engine is Go, k6 can be **extended in Go**. With the **xk6** build tool you compile a
custom k6 binary that includes extra Go modules, exposed to your scripts as JavaScript. The docs
list four extension types:

| Type | Adds |
|---|---|
| **JavaScript extensions** | New scripting APIs — new protocols, faster libraries |
| **Output extensions** | New destinations for metrics |
| **Secret source extensions** | Ways to supply credentials to tests |
| **Subcommand extensions** | New commands under `k6 x` |

### Everything else is Go, too

Around the JS runtimes sits the rest of the engine, all Go: the **scheduler** that runs
*executors* and creates VUs, the **metrics engine** that aggregates results and checks
thresholds, and the **output** system that sends results to the terminal summary, Grafana,
Prometheus, JSON and others via `--out`.

## Common pitfalls

- **Assuming Node.js APIs exist.** `fs`, `path`, `process`, `Buffer` and `require` of npm
  packages don't work. Use k6's own modules and `__ENV`.
- **Installing an npm package and expecting `import` to find it.** Bundle it first, or use
  a k6 built-in equivalent.
- **Ignoring per-VU memory.** Large data loaded in the init context is copied per VU.
  Load it once and share it (e.g. `SharedArray`).
- **Assuming a TypeScript error will fail the run.** Types are stripped, not checked.
- **Blaming k6 for slow numeric JS.** Heavy computation inside `default()` runs in an interpreter and
  eats load-generator CPU. Keep VU code thin: call the network, check, sleep.
- **Searching for "goja" and finding outdated advice.** Sobek is the fork k6 uses now; the
  concepts carry over, but check the k6 docs for current behaviour.

## Key takeaways

- **k6 is written in Go** and **embeds a JavaScript VM called Sobek** (a fork of goja, pure Go).
- Your JS/TS is **not run by Node.js or V8**; k6 is neither Node.js nor a browser.
- **Each VU gets its own JS runtime**, so VUs are isolated, and memory scales with VU count
  (≈1–5 MB each per the k6 docs).
- Built-in modules (`k6/http` etc.) are **Go code exposed to JavaScript**; npm packages need
  bundling; **Go extensions (xk6)** add new capabilities.
- TypeScript is **transpiled with esbuild** — types are stripped, not checked.

## Further reading

- [Grafana k6 — Modules](https://grafana.com/docs/k6/latest/using-k6/modules/)
- [Grafana k6 — JavaScript and TypeScript compatibility](https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/)
- [Grafana k6 — Extensions](https://grafana.com/docs/k6/latest/extensions/)
- [Grafana k6 — Fine-tuning OS](https://grafana.com/docs/k6/latest/misc/fine-tuning-os/) (per-VU memory guidance)
- [Sobek on GitHub](https://github.com/grafana/sobek) · [k6 on GitHub](https://github.com/grafana/k6)
- [The k6 Test Lifecycle](/k6-architecture/k6-test-lifecycle.md)
- [What Is k6?](/introduction-to-performance-testing/what-is-k6.md)
