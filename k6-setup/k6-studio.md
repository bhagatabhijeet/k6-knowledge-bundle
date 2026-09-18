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

Here is the real application. Its start screen offers the three components as three doors — **Record flow**, **Generate test** and
**Open script** — with your files listed in the sidebar (recordings, test generators, scripts and data files):

![k6 Studio start screen with the Recorder, Generator and Validator cards and an empty file sidebar](/assets/images/k6-studio-home.png)

> *Screenshots on this page were taken from k6 Studio v1.13.0 with a small QuickPizza recording. Newer versions may look slightly different.*

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

The Recorder screen is refreshingly simple — a **Starting URL** box and a **Start recording** button. There is also a
**Capture browser events** option (marked *Preview*) that records clicks and typing alongside the network requests:

![k6 Studio Recorder screen with a Starting URL field, a Start recording button and a Capture browser events checkbox](/assets/images/k6-studio-recorder.png)

k6 Studio saves the recording as a **HAR file** (an industry-standard log of HTTP requests) together
with the browser events. The recording opens as a list of requests, **organised into the groups you named** — here *Home page* (1 request)
and *Get pizza data* (2 requests):

![A k6 Studio recording listing three requests grouped under Home page and Get pizza data](/assets/images/k6-studio-recording.png)

Click any request to inspect its headers, payload, cookies and response. Rename a recording with the pencil icon beside its name.

![k6 Studio request inspector showing the request URL, method and headers on top and the response status and headers below](/assets/images/k6-studio-request-details.png)

> **Where are my files?** k6 Studio keeps everything in a `k6-studio` folder inside your **Documents** folder — sub-folders
> `Recordings` (`.har` files), `Generators` (`.k6g` files), `Scripts` and `Data`.

> **Tip:** record exactly the journey you want to load-test, once, cleanly — no wrong turns, no
> refreshing. What you record is what every virtual user will replay.

### Step 3 — Create a test with the Generator

From the recording choose **Create test → HTTP test**, then pick which hosts to include (there is also a *Include static assets* option) and click **Continue**. The
Generator opens with your requests in the recorded order and a **Test rules** list underneath:

![The k6 Studio Generator showing the recorded requests grouped, a Test options / Test data / Allowed hosts toolbar, and a default Verification rule](/assets/images/k6-studio-generator.png)

Key areas of the real window:

1. **Title bar** — the generator's name plus **Save**, **Export**, **Validate** and **Run in Grafana Cloud**.
2. **Requests / Script tabs** — *Requests* shows the recorded requests (choose the source **Recording** at the top); *Script* shows the k6 code being generated.
3. **Toolbar on the right** — three buttons that open panels:
   - **Test options** — the **load profile**, **thresholds**, **think time** and **load zones**.
   - **Test data** — variables and CSV/JSON data files for parameterization.
   - **Allowed hosts** — how many of the recorded hosts are included (here `[1/1]`); drop CDNs and third-party noise.
4. **Test rules** — how the raw recording is transformed into a robust test. A **Verification** rule is already there.

For orientation, here is the same layout as a schematic:

![Schematic of the k6 Studio Generator window: name and actions, requests inspector, options panels and the rules list](/assets/images/k6-studio-generator-anatomy.svg)

#### The load profile — stages in a form

Open **Test options → Load profile**. The default executor is **Ramping VUs**, pre-filled with three stages — ramp to 20 users over 1 minute, stay at
20 for 3 minutes 30 seconds, ramp down to 0 over 1 minute. Add or edit stages with **Add stage**:

![The Load profile panel of k6 Studio showing the Ramping VUs executor with three stages: 20 VUs for 1m, 20 VUs for 3m30s and 0 VUs for 1m](/assets/images/k6-studio-load-profile.png)

That is exactly the [stages](/k6-core-concepts/index.md) idea in a table: each row is one `{ target, duration }` object. The other executor, **Shared iterations**,
is the fixed-work style (`vus` + `iterations`).

#### Thresholds in a form

The **Thresholds** tab turns k6 [thresholds](/k6-core-concepts/index.md) into a row of drop-downs — *Metric*, *Statistic*, *Condition*, *Value* and a **Stop test** checkbox
(which is `abortOnFail`). Here is **Response time · 95th percentile · < · 400 ms**, with Stop test ticked:

![The Thresholds panel of k6 Studio with one row: Response time, 95th percentile, less than 400 ms, Stop test checked](/assets/images/k6-studio-thresholds.png)

Everything in these panels is the point-and-click equivalent of the `options` object you would write in a script — compare it with
[Load Testing](/introduction-to-performance-testing/load-testing.md).

### Step 4 — Add rules

A recording replays *yesterday's* values. Rules make it work *today*, for every user:

Click **Add rule** to see the four rule types (or use **Autocorrelate** to let Studio suggest correlation rules):

![The Add rule menu in k6 Studio listing Correlation, Parameterization, Custom code and Verification](/assets/images/k6-studio-add-rule.png)

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

Click **Validate** to open the **Validator** window. It runs your script for **one iteration** with your local k6, and you can
inspect every request and response, plus k6 logs, check results and the generated script. Typical discoveries: a login that
fails because a token was not correlated, or a request that returns 404.

![The k6 Studio Validator showing three requests with status 200 and tabs for Logs, Checks and Script](/assets/images/k6-studio-validator.png)

The **Checks** tab shows each check with its success rate — here the default *status equals 200* Verification check passed for every request:

![The Checks tab of the k6 Studio Validator: status equals 200 with a 100 percent success rate for both groups](/assets/images/k6-studio-validator-checks.png)

Fix the rules, validate again, and repeat until it's clean. Validating with one user first is far
cheaper than discovering the problem 10 minutes into a load run.

### Step 6 — Export and run

The **Script** tab shows the k6 code as you change settings, with a syntax-highlighted editor:

![The Script tab of k6 Studio showing the generated k6 code: imports, the options object with stages and a p(95) threshold](/assets/images/k6-studio-script.png)

Click **Export** to save a plain `.js` file, then run it exactly like any script:

```bash
k6 run my-recorded-test.js
```

Open the file in VS Code or Cursor to read, learn from, and refine it — it is ordinary k6. The Grafana
docs note you can also run scripts in **Grafana Cloud k6**.

### The real exported script

This is the **unedited script k6 Studio generated** for the three-request recording above, with the default load profile and the
`p(95)<400` threshold from the screenshots:

```js
// assets/code/k6-setup/studio-generated-example.js  (Studio v1.13.0 export)
import { group, sleep, check } from "k6";
import http from "k6/http";
import execution from "k6/execution";

export const options = {
  stages: [
    { target: 20, duration: "1m" },
    { target: 20, duration: "3m30s" },
    { target: 0, duration: "1m" },
  ],
  thresholds: {
    http_req_duration: [{ threshold: "p(95)<400", abortOnFail: true }],
  },
};

export default function () {
  let params;
  let resp;
  let match;
  let regex;
  let url;
  const correlation_vars = {};

  group("Home page", function () {
    params = {
      headers: { Accept: `text/html,application/xhtml+xml` },
      cookies: {},
    };

    url = http.url`https://quickpizza.grafana.com/`;
    resp = http.request("GET", url, null, params);

    check(resp, { "status equals 200": (r) => r.status === 200 });
  });
  sleep(1);
  // …the "Get pizza data" group (two more requests, each with a check) and another sleep(1)
}
```

[Source](/assets/code/k6-setup/studio-generated-example.js) — the file contains the full script. I ran it with a short profile
(`k6 run --stage 3s:2,3s:0 studio-generated-example.js`): the threshold passed and all checks succeeded.

Map it back to the screens you just used:

| In the script | Comes from |
|---|---|
| `stages: [ … ]` | **Test options → Load profile** (Ramping VUs table) |
| `thresholds: { http_req_duration: [{ threshold: "p(95)<400", abortOnFail: true }] }` | **Test options → Thresholds** (95th percentile · < · 400 ms · Stop test ✔) |
| `group("Home page", …)` | The group you named while recording |
| `http.request("GET", url, null, params)` | Each recorded request, with its recorded headers |
| `check(resp, { "status equals 200": … })` | The default **Verification** rule |
| `sleep(1)` after each group | The **Think time** setting (default 1 second) |

You already know every piece from the earlier topics: `stages`, `thresholds`, `check`, `group`,
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
