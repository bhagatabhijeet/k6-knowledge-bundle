---
type: Guide
title: Writing and Running Your First k6 Test
description: >
  Write a first k6 test from scratch: the exported options object (how much load) and
  the exported default function (what each user does), a GET request to the QuickPizza
  demo app, think time with sleep, running it with k6 run, and fixing "sleep is not defined".
tags:
  - k6
  - first-test
  - options
  - default-function
  - virtual-users
  - http-get
  - sleep
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Every k6 test is built from **two blocks**, and both must be **exported**:

| Block | Answers the question | In code |
|---|---|---|
| **`options`** | **How much** load? How many users, for how long? | `export const options = { … }` |
| **`default` function** | **What** does each user do? | `export default function () { … }` |

k6 takes the *plan* from `options` and applies it to the *logic* in the `default` function.

![Anatomy of a first k6 test: imports, exported options and exported default function, and what k6 does with three users for ten seconds](/assets/images/k6-first-test-anatomy.svg)

## Why it matters

Keeping the load plan and the user flow in **separate blocks** is one of k6's best ideas:

- A performance owner or business team can decide the load (*“50 users normally, 100 at peak”*) while a
  tester writes the flow. Two people, two blocks, no conflict.
- Later, once the project grows into a framework, the options can move out into a **shared configuration file**
  instead of living beside the flow.
- The same flow can be reused for a smoke test, a load test or a stress test simply by changing the options.

## How it works — step by step

### The demo application

Grafana provides a free demo app for practising k6: **QuickPizza** at `https://quickpizza.grafana.com`. It has web
pages *and* APIs — login, log out, rate pizzas, and more — and its source is on GitHub if you'd rather run it locally.
We will use the hosted URL. First, a plain **GET**:

> **Is my request a GET or a POST?** If you can open the URL in a browser and get a response, it is a **GET**. Anything
> else (submitting a form, logging in) is usually a POST — ask the development team or check the browser's network tab.

### Step 1 — Create the file

In your project folder, create **`first-test.js`**. Every k6 test needs a `default` function, so start with the
skeleton:

```js
export default function () {
  // whatever you write here is executed by every virtual user
}
```

### Step 2 — Import the HTTP module and send a request

```js
import http from 'k6/http';

export default function () {
  http.get('https://quickpizza.grafana.com/');
}
```

Type `http.` — thanks to [IntelliSense](/k6-configuration-options-in-code-editor/enable-k6-intellisense.md) the
editor suggests `get`, `post`… and explains that `get` *makes a GET request*. We pass the URL; k6 does the rest.

### Step 3 — Add the load plan

```js
export const options = {
  vus: 3,          // three virtual users…
  duration: '10s', // …looping for ten seconds
};
```

`vus` is the number of **virtual users**; `duration` is how long they keep going. This is a small
**smoke-test-sized** load: just enough to prove the flow works.

Each virtual user runs the `default` function, then **immediately starts it again**, until 10 seconds are up. A request
might take only a fraction of a second, so each user will repeat it many times — that is what makes it a *load*.

### Step 4 — Add think time

```js
import { sleep } from 'k6';

// …at the end of the default function:
sleep(1);
```

`sleep(1)` pauses the user for one second before the next loop. Real people pause between actions; without `sleep`, each
virtual user would fire requests as fast as the network allows — far more aggressive than real traffic.

### The complete script

```js
// assets/code/k6-configuration-options-in-code-editor/first-test.js
import http from 'k6/http';
import { sleep } from 'k6';

// Block 1 — the load: three virtual users for ten seconds
export const options = {
  vus: 3,
  duration: '10s',
};

// Block 2 — the logic every virtual user repeats
export default function () {
  http.get('https://quickpizza.grafana.com/'); // a simple GET request
  sleep(1);                                    // think time
}
```

[Source](/assets/code/k6-configuration-options-in-code-editor/first-test.js)

### Step 5 — Run it

**Save the file**, then, from the project folder:

```bash
k6 run first-test.js
```

k6 prints a header describing the plan, live progress each second, and finally a results table. Three virtual users loop for
10 seconds, and you will see them keep running until the time is up. (What all those numbers mean is the subject of
[Understanding the k6 Console Output](/k6-console-output/index.md).)

You can also override the plan from the command line without editing the file:

```bash
k6 run --vus 10 --duration 30s first-test.js
```

## The classic first error: “sleep is not defined”

Forget the `import { sleep } from 'k6'` line and run the script:

```
level=error msg="ReferenceError: sleep is not defined
        at default (file:///…/first-test.js:13:8)"
```

![Terminal error ReferenceError: sleep is not defined, with the file, line and column marked, and the one-line import fix](/assets/images/k6-sleep-not-defined.svg)

- **What it means:** you used `sleep`, but JavaScript has never heard of it — it lives in the `k6` module and must be imported.
- **Read the location:** the message ends with the file, line and column. Go straight there.
- **The fix:** `import { sleep } from 'k6';` — then run again. The error disappears.
- The script keeps failing and looping until you stop it with **Ctrl+C**.

You can reproduce it with
[first-test-missing-import.js](/assets/code/k6-configuration-options-in-code-editor/first-test-missing-import.js).
With IntelliSense installed your editor would have warned you *before* running — and offered to add the import.

## Common pitfalls

- **Not exporting `options` or the function.** k6 can only see exported things; without `export`, the load plan and
  the logic can't “talk to each other”.
- **Forgetting to import.** `http` comes from `k6/http`; `sleep`, `check` and `group` come from `k6`.
- **Running an unsaved file.** k6 runs what is on disk. Save first.
- **Wrong folder.** `k6 run first-test.js` looks in the current directory. Use the editor's terminal so you start in the project.
- **Removing `sleep`.** Unrealistically aggressive load, and results that don't resemble real users.
- **A typo in `vus` / `duration`.** Use exactly these names; durations are strings like `'10s'`, `'5m'`, `'1h'`.
- **Confusing the two blocks.** `options` describes *how much*; the default function describes *what*.

## Key takeaways

- A k6 test = **imports + `export const options` + `export default function`**.
- **`options`** is the load plan (`vus`, `duration`, later stages and thresholds); the **default function** is one user's
  journey, repeated again and again.
- **Both must be exported.**
- `http.get(url)` sends a GET request; `sleep(1)` adds think time.
- `sleep is not defined` means a missing `import { sleep } from 'k6'`.
- Run with `k6 run first-test.js`; override options with `--vus` and `--duration`.

## Further reading

- [Grafana k6 — Running k6](https://grafana.com/docs/k6/latest/get-started/running-k6/)
- [QuickPizza demo app](https://quickpizza.grafana.com)
- [The k6 Test Lifecycle](/k6-architecture/k6-test-lifecycle.md) — what happens to your two blocks when k6 runs
- [Understanding the k6 Console Output](/k6-console-output/index.md) — reading the results
- [Enabling k6 IntelliSense in Your Editor](/k6-configuration-options-in-code-editor/enable-k6-intellisense.md)
