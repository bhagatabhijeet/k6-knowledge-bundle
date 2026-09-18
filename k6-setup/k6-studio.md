---
type: Guide
title: Setting Up k6 Studio
description: >
  Grafana k6 Studio is a free desktop app that records a browser session and turns it
  into a k6 script — no hand-written code. Covers installing it on macOS, Windows and Linux,
  the Recorder → Generator → Validator workflow, rules, and exporting the script.
tags:
  - k6
  - k6-studio
  - setup
  - recorder
  - generator
  - har
  - correlation
  - low-code
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

**Grafana k6 Studio** is an open-source **desktop application** (macOS, Windows, Linux) that
helps you create k6 test scripts **without writing code by hand**. Instead of typing
`http.get(...)` yourself, you *use your application in a browser* and k6 Studio turns what you did
into a k6 script.

![k6 Studio workflow: record, generate, validate, export, run](/assets/images/k6-studio-workflow.svg)

It has three main components, per the Grafana docs:

| Component | Job |
|---|---|
| **Recorder** | Captures a user flow in a browser and saves every request as a **HAR file** (plus the browser events). It uses a proxy to intercept traffic from a dedicated Chrome window. |
| **Generator** | Converts a recording into a k6 script. You shape it with **rules**, choose a **load profile**, and set **thresholds** — all through the UI. |
| **Validator** | Runs the script for **one iteration** and shows every request, response, log line and check, so you can confirm the script works *before* you run load. |

k6 Studio also has a browser-test editor for k6's browser module, which we skip here. It is licensed
**AGPL-3.0** and, like k6 itself, free to use.

## Why it matters

Hand-writing a script for a real application flow is slow and error-prone. Modern apps make dozens of
requests per page — cookies, tokens, redirects, IDs — and you would have to discover and replay each
one. k6 Studio helps when:

- **You don't know exactly what the app sends.** Record it and *see* every request.
- **The flow is long or has dynamic values** (login tokens, CSRF, generated IDs) that must be
  extracted and reused — Studio's rules automate this.
- **You are new to k6 or JavaScript.** You get a working script first and learn from reading it.
- **You want a starting point.** The exported file is a normal k6 script you can extend by hand.

It does **not** replace the k6 CLI and the editor: the recorded script still runs on k6, and
serious test suites usually end up hand-edited. Think of Studio as a very fast way to get the first
version.

## How it works

### Step 1 — Install k6 Studio

**Prerequisite:** **Google Chrome** must be installed — the Recorder drives a Chrome window. (On ARM64
Linux, Chromium works in place of Chrome.)

Download the installer for your system from the
[k6 Studio releases page](https://github.com/grafana/k6-studio/releases) (the docs' *Install*
page links there). File names follow this pattern:

| OS | Download | Then |
|---|---|---|
| **macOS — Apple silicon** | `k6.Studio-<version>-arm64.dmg` | Open it and **drag k6 Studio into Applications** (needed so updates install correctly) |
| **macOS — Intel** | `k6.Studio-<version>-x64.dmg` | Same |
| **Windows** | `k6.Studio-<version>-Setup.exe` | Run the installer |
| **Linux — Debian/Ubuntu** | `k6.Studio-<version>-amd64.deb` | `sudo dpkg -i <downloaded-file>` |
| **Linux — Red Hat/Fedora** | `k6.Studio-<version>-x86_64.rpm` | Install with your distribution's rpm tooling |

Updates: macOS and Windows update **automatically**. On Linux you repeat the install with the latest
release.

> **Also install k6.** Studio produces scripts that you run with the k6 CLI. Make sure `k6 version`
> works — see [Installing k6](/k6-setup/installing-k6.md).

### Step 2 — Record a flow

1. Open k6 Studio and click **Record flow**.
2. Enter your application's **URL** and click **Start recording**.
3. A **Chrome window** opens after a few seconds. k6 Studio now watches its network traffic.
4. Create **named groups** in Studio — e.g. *Home page*, *Log in*, *Checkout* — and click through
   your app in Chrome as a real user would. Requests land in whichever group is active.
5. Click **Stop recording**.

k6 Studio saves the recording as a **HAR file** (an industry-standard log of HTTP requests) together
with the browser events. Click any request to inspect its headers, payload, cookies and response.
Right-click a recording in the sidebar to rename it.

> **Tip:** record exactly the journey you want to load-test, once, cleanly — no wrong turns, no
> refreshing. What you record is what every virtual user will replay.

### Step 3 — Create a test with the Generator

From the recording choose **Create test → HTTP test** and select the hosts you care about. The
Generator window opens:

![Anatomy of the k6 Studio Generator window](/assets/images/k6-studio-generator-anatomy.svg)

Key areas (numbers match the illustration):

1. **Name and actions** — save, export, validate and run.
2. **Requests inspector** — every recorded request, in order, in your groups.
3. **Options tabs**
   - **Test Options** — the **load profile** (*ramping VUs* or *shared iterations*),
     **thresholds** (your pass/fail criteria) and **think time**.
   - **Test Data** — variables and CSV/JSON data files (up to 10 MB) for parameterization.
   - **Allowed Hosts** — include or exclude hosts, typically to drop CDNs and third-party noise.
4. **Rules list** — how the raw recording is transformed into a robust test.

Everything on the *Test Options* tab is the point-and-click equivalent of the `options` object you
would write in a script — compare it with [Load Testing](/introduction-to-performance-testing/load-testing.md).

### Step 4 — Add rules

A recording replays *yesterday's* values. Rules make it work *today*, for every user:

![Correlation and parameterization rules in k6 Studio](/assets/images/k6-studio-rules.svg)

| Rule | What it does |
|---|---|
| **Verification** | Added by default. Adds a **check** after every request that the status code matches the recording. |
| **Correlation** | Extracts a dynamic value (a CSRF token, an ID) from one response and **replaces** it in later requests. Extractors can use *begin–end*, *regex* or *JSON* selectors. |
| **Parameterization** | Replaces a fixed value with **text, a variable, a data-file column, or custom code**, so each VU sends different data. |
| **Custom code** | Inserts your own JavaScript **before or after** matching requests. |

**Why correlation matters:** if every virtual user replays the token captured during recording, the
server rejects them, and your test measures a wall of errors instead of performance.

### Step 5 — Validate

Click **Validate** to open the **Debugger**. It runs your script for **one iteration**, and you can
inspect every request and response, plus k6 logs and check results. Typical discoveries: a login that
fails because a token was not correlated, or a request that returns 404.

Fix the rules, validate again, and repeat until it's clean. Validating with one user first is far
cheaper than discovering the problem 10 minutes into a load run.

### Step 6 — Export and run

Open the **Script** tab and click **Export script** to save a plain `.js` file. Then run it exactly
like any script:

```bash
k6 run my-recorded-test.js
```

Open the file in VS Code or Cursor to read, learn from, and refine it — it is ordinary k6. The Grafana
docs note you can also run scripts in **Grafana Cloud k6**.

### What the exported script looks like

The code below is a **hand-written illustration** of the shape (a real export is longer and varies by
version). Compare the comments with the Generator settings above:

```js
// assets/code/k6-setup/studio-generated-shape.js  (illustrative)
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {                 // ← Generator ▸ Test Options
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: { http_req_duration: ['p(95)<800'], http_req_failed: ['rate<0.01'] },
};

const USERS = [ /* ← Parameterization rule: data from Test Data */
  { user: 'alice', pass: 'pw-1' }, { user: 'bob', pass: 'pw-2' }, { user: 'carol', pass: 'pw-3' },
];

export default function () {
  const creds = USERS[(__VU + __ITER) % USERS.length];

  group('Home page', function () {       // ← the group you named while recording
    const res = http.get('https://quickpizza.grafana.com/');
    check(res, { 'GET / → 200': (r) => r.status === 200 });   // ← Verification rule
  });
  // …Log in group with a correlated token, then sleep(1) for think time
}
```

[Source](/assets/code/k6-setup/studio-generated-shape.js)

You already know every piece of it from the earlier topics: `stages`, `thresholds`, `check`, `group`,
and the [test lifecycle](/k6-architecture/k6-test-lifecycle.md).

## Studio or hand-written scripts?

| | k6 Studio | Hand-written in VS Code / Cursor |
|---|---|---|
| Best for | Getting a first working script fast; unfamiliar apps; long flows with tokens | Precise control, reuse, code review, large suites |
| Skill needed | Know your app | Know JavaScript and k6 |
| Version control | Export, then commit the `.js` | Native |
| Typical use | **Start here**, then export | **Refine and maintain here** |

They combine well: **record in Studio → export → edit in your editor → run in CI.**

## Common pitfalls

- **Chrome not installed.** The Recorder needs Google Chrome (or Chromium on ARM64 Linux).
- **Recording noise.** Extra clicks, refreshes and third-party traffic all end up in the test. Record a
  clean journey and use **Allowed Hosts** to drop analytics and CDNs.
- **Skipping correlation.** A recorded token/session ID replayed by every VU produces failures — validate
  and add correlation rules.
- **Skipping parameterization.** All VUs logging in as the same user gives unrealistically good, cached
  results.
- **Load-testing without validating.** Always run **Validate** (one iteration) before any real load.
- **Recording production with real credentials.** A HAR file contains headers, cookies and payloads —
  treat it as sensitive, use test accounts, and don't commit recordings to Git.
- **Expecting Studio to replace k6.** It generates k6 scripts; running load is still k6's job.

## Key takeaways

- **k6 Studio** is a free desktop app that records a browser flow and **generates a k6 script** through
  a UI.
- Its three components: **Recorder** (→ HAR), **Generator** (rules, load profile, thresholds),
  **Validator** (one-iteration debugger).
- Install with a `.dmg` (macOS), `Setup.exe` (Windows) or `.deb` / `.rpm` (Linux) — **Chrome is
  required**.
- **Correlation** and **parameterization** rules are what make a recording work for many users.
- The result is a normal k6 script: export it, edit it in VS Code or Cursor, and run it with `k6 run`.

## Further reading

- [Grafana k6 Studio — documentation](https://grafana.com/docs/k6-studio/)
- [Grafana k6 Studio — Get started](https://grafana.com/docs/k6-studio/get-started/)
- [Grafana k6 Studio — Generator](https://grafana.com/docs/k6-studio/components/generator/)
- [k6 Studio on GitHub](https://github.com/grafana/k6-studio)
- [Installing k6](/k6-setup/installing-k6.md)
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)
