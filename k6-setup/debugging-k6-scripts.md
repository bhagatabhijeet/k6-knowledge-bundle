---
type: Guide
title: Debugging k6 Scripts — How It Differs from Playwright
description: >
  k6 runs on a Go binary with an embedded JavaScript engine, not Node.js, so there is no
  F5-and-breakpoints workflow. This guide shows what to do instead: k6 inspect, one-user runs,
  console logging, checks, --http-debug, and the k6 Studio Debugger.
tags:
  - k6
  - debugging
  - console-log
  - http-debug
  - troubleshooting
  - playwright
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

If you have debugged **Playwright** (or Cypress, or any Node.js code), you are used to this: set a
breakpoint, press **F5**, step through the code, hover over variables, maybe drop in `page.pause()`.

**That workflow does not carry over to k6.** Debugging a k6 script means something different: instead of
*pausing* the script to look inside it, you make the script *report* what it is doing — through logs,
checks, and request/response dumps.

![Debugging k6 versus Playwright: no built-in step debugger in k6; a six-tool ladder from k6 inspect to the k6 Studio Debugger](/assets/images/k6-debugging-toolkit.svg)

## Why it is different

| | Playwright / Node.js | k6 |
|---|---|---|
| **What runs your script** | Node.js (V8 engine) | The `k6` **Go binary** with an embedded JavaScript VM, [Sobek](/k6-architecture/how-k6-is-built.md) |
| **IDE debugger (F5, breakpoints, step over)** | ✅ Attaches to Node's inspector | ❌ Not provided — k6 has no built-in step-through debugger |
| **Pause and inspect mid-run** | ✅ `page.pause()`, breakpoints | ❌ Not available — observe output instead |
| **How you debug** | Pause, step, inspect | Log, check, dump requests, run tiny |
| **Node modules in the script** | ✅ | ❌ — k6 modules like `k6/http` **don't exist in Node**, so pointing a Node debugger at a k6 script fails at the first `import` |

Two facts from [How k6 Is Built](/k6-architecture/how-k6-is-built.md) explain the whole difference:

1. k6 is **not Node.js**, so Node's debugging tools (the inspector, VS Code's JavaScript debugger)
   have nothing to attach to.
2. A k6 test is many virtual users running **at the same time**. Pausing one at a breakpoint would
   distort the timings you are trying to measure — so k6 is designed around **observing** runs, not stopping them.

The k6 documentation's debugging techniques are the ones below: logging, checks, HTTP debug output, and
(in k6 Studio) a visual Debugger.

## How it works — the six-tool ladder

Start with the lightest tool. Move down only when the previous one doesn't answer your question.

### 1 · `k6 inspect` — does the script even load?

```bash
k6 inspect script.js
```

Parses the script and prints its resolved options **without generating load**. Catches syntax errors,
bad imports and a broken `options` block in a fraction of a second.

### 2 · Shrink the run — one user, one iteration

```bash
k6 run --vus 1 --iterations 1 script.js
```

Or bake it into the script while debugging:

```js
export const options = { vus: 1, iterations: 1 };
```

A debug run should take seconds, not minutes, and produce output you can actually read. **Never debug
at full scale.**

### 3 · `console.log` — print what you need to see

```js
const res = http.get('https://test.k6.io/');
console.log(`status=${res.status} duration=${res.timings.duration.toFixed(0)}ms`);
console.warn(`final URL after redirects: ${res.url}`);
```

Real output:

```
level=info    msg="status=200 duration=72ms"                                  source=console
level=warning msg="final URL after redirects: https://quickpizza.grafana.com/" source=console
```

`console.log/info` , `console.warn` and `console.error` map to log levels; k6's `-v` / `--verbose`
switches on more detail. Useful flags:

| Flag | Effect |
|---|---|
| `--console-output=out.log` | Send `console.*` output to a file instead of the terminal |
| `--log-output=stdout` | Choose where k6's own logs go (`stderr`, `stdout`, a file…) |
| `-v` / `--verbose` | More detailed k6 logging |
| `-q` / `--quiet` | Hide progress updates |

> **Remove or reduce logs before real load tests.** Printing on every iteration of hundreds of VUs floods
> the terminal and uses load-generator CPU.

### 4 · `check()` and `fail()` — turn expectations into named lines

```js
import { check, fail } from 'k6';

const ok = check(res, {
  'status is 200':     (r) => r.status === 200,
  'body is not empty': (r) => r.body && r.body.length > 0,
});
if (!ok) fail(`home page check failed (status ${res.status})`);
```

Each check becomes a line in the summary — `✓` when it passes, `✗` when it doesn't:

```
✓ status is 200
✓ body is not empty
✗ demo: this check is meant to fail
  ↳  0% — ✓ 0 / ✗ 1
```

A failed check **does not stop the run** — it just records the failure. `fail(message)` does stop:
it throws, aborting the **current iteration** at that line, and logs the message (`GoError: …`).
The next iteration starts normally. (`fail()` on its own doesn't make k6 exit with an error code;
use **thresholds** for automatic pass/fail — see [Load Testing](/introduction-to-performance-testing/load-testing.md).)

### 5 · `--http-debug` — see every request and response

```bash
k6 run --vus 1 --iterations 1 --http-debug script.js       # headers, no bodies
k6 run --vus 1 --iterations 1 --http-debug=full script.js  # + response bodies
```

k6 prints each request and its response, tagged with the VU, iteration and a `request_id`. Real output
from `hello-k6.js` (trimmed) — note how it reveals a **redirect** you would never see otherwise:

```
Request:  GET / HTTP/1.1            Host: test.k6.io
Response: HTTP/2.0 302 Found        Location: https://quickpizza.grafana.com/
Request:  GET / HTTP/1.1            Host: quickpizza.grafana.com
Response: HTTP/2.0 200 OK           Content-Type: text/html; charset=utf-8
```

This is the go-to tool when a check fails and you need to know **what was actually sent and received**:
a missing header, a redirect to a login page, a 4xx body explaining what was wrong.

> **Secrets warning.** HTTP debug output includes headers and cookies — often auth tokens. Don't paste it
> into tickets or commit log files. `--http-debug=full` also produces very large output.

### 6 · k6 Studio Debugger — the visual option

If you use [k6 Studio](/k6-setup/k6-studio.md), its **Debugger** runs **one iteration** of your script and shows the
requests, responses, logs and check results in a UI. It is the closest k6 gets to a graphical debugger, and
is ideal for scripts you recorded rather than hand-wrote.

## The demo script

[debug-demo.js](/assets/code/k6-setup/debug-demo.js) combines the techniques so you can try each flag:

```js
// assets/code/k6-setup/debug-demo.js
import http from 'k6/http';
import { check, group, fail } from 'k6';

export const options = { vus: 1, iterations: 1 };   // the "debug run" size

export default function () {
  group('Home page', function () {
    const res = http.get('https://test.k6.io/');

    console.log(`status=${res.status} duration=${res.timings.duration.toFixed(0)}ms`);
    console.warn(`final URL after redirects: ${res.url}`);

    const ok = check(res, {
      'status is 200':     (r) => r.status === 200,
      'body is not empty': (r) => r.body && r.body.length > 0,
    });
    if (!ok) fail(`home page check failed (status ${res.status})`);
  });

  // a deliberately failing check, so you can see what a failure looks like
  check(null, { 'demo: this check is meant to fail': () => false });
}
```

[Source](/assets/code/k6-setup/debug-demo.js)

```bash
k6 inspect debug-demo.js                         # 1. loads?
k6 run debug-demo.js                             # 3–4. console + checks
k6 run --http-debug debug-demo.js                # 5. every request/response
k6 run --console-output=out.log debug-demo.js    # logs to a file
```

## Reading common errors

| You see | It means |
|---|---|
| `GoError: Making http requests in the init context is not supported` | An HTTP call at the top level of the script. Move it into `setup()` or `default()` — see [the lifecycle](/k6-architecture/k6-test-lifecycle.md) |
| `GoError: <your message>` from `fail()` | Your own `fail()` fired — read the message and the stack line pointing to your file and line number |
| `Error: … at setup (file:///…:2:63)` | An exception in `setup()`; the test aborts and `teardown()` is skipped |
| `k6 is not recognized` / `command not found` | Not a script bug — k6 isn't on your PATH ([Installing k6](/k6-setup/installing-k6.md)) |
| Squiggly underline in the editor | A typo or wrong API usage caught **before** running — needs `@types/k6` ([Setting Up the Editor](/k6-setup/setting-up-the-editor.md)) |

Error messages include the **file, line and column** — start there.

## Other help

- **Editor IntelliSense** catches many mistakes before a run: install `@types/k6`.
- **AI assistants:** the k6 MCP server (see [Editor Extensions & AI Assistants](/k6-setup/k6-editor-extensions.md))
  can **validate** a script and run it locally for you, catching syntax errors and missing imports.
- **A web proxy** (such as the one k6 Studio uses when recording) lets you see traffic from outside the
  script; the k6 docs link to a "Debugging using a web proxy" article for this.

## A debugging workflow that works

```
  1. Editor shows no red squiggles                 ← IntelliSense
  2. k6 inspect script.js                          ← loads & options OK
  3. k6 run --vus 1 --iterations 1 script.js       ← does the journey work once?
  4. Add console.log / named checks                ← what values? which step fails?
  5. Add --http-debug                              ← what was actually on the wire?
  6. Fix → repeat 3–5 until clean
  7. REMOVE noisy logs and --http-debug
  8. Smoke test (1–2 VUs) → load test              ← only now add real load
```

## Common pitfalls

- **Pressing F5 with the Node debugger.** It won't work: the script imports `k6/http`, which Node doesn't have.
  Use the techniques above.
- **Debugging at scale.** 500 VUs each logging every iteration produces unreadable output. Debug with one VU.
- **Leaving debug output in load tests.** Logging costs CPU on the load generator and can skew results.
- **Forgetting that a failed `check()` doesn't stop anything.** Watch the `✗` lines, or use `fail()` /
  thresholds when you need a hard stop.
- **Sharing `--http-debug` output.** It contains tokens and cookies.
- **Expecting `page.pause()`-style interactivity.** There is nothing like it in a load test; use Studio's
  Debugger for a visual, single-iteration view.

## Key takeaways

- k6 runs on **Go + an embedded JS engine, not Node.js**, so there is **no built-in step-through debugger**
  and no F5-and-breakpoints workflow.
- You debug by **observing**: `k6 inspect`, a **one-user, one-iteration** run, `console.log`, named `check()`s /
  `fail()`, and **`--http-debug`**.
- **k6 Studio's Debugger** gives a visual single-iteration view for recorded scripts.
- Debug **small**, then **remove** the noise and treat debug output as **sensitive**.

## Further reading

- [Grafana k6 — HTTP debugging](https://grafana.com/docs/k6/latest/using-k6/http-debugging/)
- [Grafana k6 Studio — Debugger](https://grafana.com/docs/k6-studio/components/debugger/)
- [How k6 Is Built](/k6-architecture/how-k6-is-built.md) — why there is no Node.js debugger
- [The k6 Test Lifecycle](/k6-architecture/k6-test-lifecycle.md)
- [Editor Extensions & AI Assistants](/k6-setup/k6-editor-extensions.md)
