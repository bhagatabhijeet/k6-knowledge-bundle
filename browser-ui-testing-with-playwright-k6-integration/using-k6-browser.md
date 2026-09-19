---
type: Concept
title: Using k6 Browser
description: >
  Why load testing must also happen at the browser level, how the k6 browser module drives a real Chrome
  with a Playwright-style API, a first browser test, and the BROWSER metrics and web vitals it adds to the results.
tags:
  - k6
  - browser
  - web-vitals
  - playwright
  - chromium
  - ui-testing
  - core-web-vitals
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Picture this: your API responds in **70 milliseconds**. Every dashboard is green. And yet users complain that *“the site feels slow.”*

Both can be true — because an API test only measures **the server**. It never draws a page, never downloads an image, never runs a line of the page’s JavaScript.
The **k6 browser module** closes that gap. It opens a **real Chrome**, walks through your website like a human, and measures **what the user actually experiences**.

> Until now in this bundle we tested the **API side**: `http.get`, `http.post` — lightweight, fast, and the right place to start.
> Now we add the layer above it: the **screen**.

## Why it matters

Take the same page and test it two ways. These are **real numbers** from running k6 against the QuickPizza demo app:

![The same page tested as an API request (1 request, about 7 kB) and in a real browser (15 to 17 requests, about 110 kB, with rendering and web vitals)](/assets/images/browser-api-vs-ui-load.svg)

| | API test (`http.get`) | Browser test (`page.goto`) |
|---|---|---|
| Requests | **1** | **15–17** (HTML, scripts, styles, fonts, images) |
| Downloaded | ≈ **7 kB** | ≈ **110 kB** |
| Page JavaScript runs? | no | **yes** |
| Anything drawn on screen? | no | **yes** |
| Measures | *server* speed | *user experience*: images, front-end errors, interactions |

Browser tests catch problems an API test **cannot** see:

- **Slow rendering** — a fast API behind a heavy, script-laden page.
- **Big images and assets** that dominate load time.
- **Front-end errors** and broken interactions.
- **How the page feels** — when content appears, whether it jumps around, how quickly it reacts to a click.

You still keep your API tests (they’re cheap and precise). Browser tests are the **second layer** — fewer, deliberate, and focused on real user journeys.

## How it works

### Your script remote-controls a real browser

![Your script runs in k6, which talks over the Chrome DevTools Protocol to a real Chromium browser; results flow back as k6 metrics](/assets/images/browser-how-it-works.svg)

1. You write the journey in JavaScript — `await page.goto(url)`, `await page.locator(…).click()`.
2. **k6** (written in Go) runs your virtual users and starts a real **Chromium/Chrome** for them.
3. k6 talks to the browser over the **Chrome DevTools Protocol (CDP)** — the same channel Chrome’s own developer tools use.
4. The browser renders the pages, runs their JavaScript and downloads their assets. Timings and **web vitals** flow back and become **k6 metrics**.

### The Playwright question

If you know **Playwright**, the API will feel familiar: *browser context → page → locators → click / fill / goto*. Here is the honest picture:

| | |
|---|---|
| ✅ **Playwright-style API** | Same vocabulary and shape, so Playwright knowledge transfers. The k6 project deliberately aims for “rough API compatibility” with Playwright. |
| ❌ **Not the Playwright library** | k6 has its **own implementation** (in Go) that speaks CDP. It is *not* Playwright running underneath, and some Playwright features are missing. |
| 🔧 **Different around the edges** | k6’s own imports, `options`, `check()` and `thresholds` replace Playwright’s test runner; scripts run under `k6 run`, not `npx playwright test`. |

So you can’t simply paste a Playwright test into k6 and expect it to run unchanged — but you *can* reuse your understanding, and most everyday actions look the same.
(You’ll meet a concrete example in the [next page](/browser-ui-testing-with-playwright-k6-integration/playwright-e2e-login-flow.md): some Playwright selector shortcuts are not available.)

### Before you start: two things you need

- **k6** — the browser module is **built in** (bundled since k6 v0.52); nothing extra to install. Everything here was run on k6 v1.7.1.
- **A Chromium-based browser installed** — for example Google Chrome. k6 finds and launches it for you.

### Your first browser test

![Anatomy of a first k6 browser test with five callouts: importing browser, the scenario browser option, async and await, the user journey, and cleaning up in finally](/assets/images/browser-script-anatomy.svg)

```js
// assets/code/browser-ui-testing-with-playwright-k6-integration/first-browser-test.js
import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',      // required for browser scenarios
      options: {
        browser: { type: 'chromium' },    // required: which browser to drive
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const page = await browser.newPage();   // open a new tab

  try {
    await page.goto('https://quickpizza.grafana.com/');

    const title = await page.title();
    const buttonText = await page.locator('button').first().textContent();

    console.log(`title = "${title}"  ·  first button = "${buttonText.trim()}"`);

    check(title, { 'page title is QuickPizza': (t) => t === 'QuickPizza' });
    check(buttonText, { 'the page has a pizza button': (t) => t.length > 0 });
  } finally {
    await page.close();                   // always close the tab, even if a step fails
  }
}
```

[Source](/assets/code/browser-ui-testing-with-playwright-k6-integration/first-browser-test.js)

Five things to notice — they are the whole difference from an API test:

1. **`import { browser } from 'k6/browser'`** — a built-in module.
2. **`options` must contain `browser: { type: 'chromium' }`**, together with an executor. Without it k6 won’t start a browser.
3. **`async function` + `await`** — every browser action takes real time, so each step is awaited. (The [next page](/browser-ui-testing-with-playwright-k6-integration/playwright-e2e-login-flow.md) explains this in depth.)
4. **The journey** is what a user does — here: open the page, read the title, read a button.
5. **`finally { await page.close() }`** — always close what you open.

Run it, and this is the page the browser saw (a real screenshot taken through the k6 browser module):

![The QuickPizza home page rendered in headless Chrome by k6: headline, a Pizza Please button and a Login link](/assets/images/browser-quickpizza-home.png)

```bash
k6 run first-browser-test.js
```

Real output (trimmed):

```
title = "QuickPizza"  ·  first button = "Pizza, Please!"

✓ page title is QuickPizza
✓ the page has a pizza button

BROWSER
browser_data_received.......: 537 kB
browser_http_req_duration...: avg=292.74ms min=70.17ms med=292.71ms max=1.28s p(95)=473.92ms
browser_http_req_failed.....: 0.00%  0 out of 25

WEB_VITALS
browser_web_vital_fcp.......: avg=2.07s
browser_web_vital_lcp.......: avg=2.07s
browser_web_vital_ttfb......: avg=1.28s
```

> **Want to watch it happen?** By default the browser is **headless** (no window). Show the window with
> `K6_BROWSER_HEADLESS=false` — PowerShell: `$env:K6_BROWSER_HEADLESS="false"; k6 run first-browser-test.js` · bash: `K6_BROWSER_HEADLESS=false k6 run first-browser-test.js`.

### The new metrics: BROWSER and WEB_VITALS

The results now have two extra sections. Here they are on a real run, with the lines marked up:

![The BROWSER and WEB_VITALS sections of the k6 console explained: plain HTTP counters at zero, browser data, request timings, failures, loading vitals, layout shift and interaction vitals](/assets/images/browser-console-annotated.svg)

**Browser network metrics** — the browser’s own counters, separate from `http_*`:

| Metric | Meaning |
|---|---|
| `browser_http_req_duration` | Timing of **every request Chrome made** — avg, min, med, max, p(90), p(95) — the same stats you know from [`http_req_duration`](/k6-console-output/http-req-duration-and-percentiles.md) |
| `browser_http_req_failed` | Share of failed browser requests |
| `browser_data_received` / `browser_data_sent` | Data downloaded / uploaded by the browser |

Notice that the plain `data_received` stays at **0 B** in a pure browser test — the browser keeps its own books.

**Web vitals** — what the user *feels*:

![Web vitals explained on a real timeline: TTFB at 1.27 seconds, FCP and LCP at 1.64 seconds, plus cards for CLS, INP, TTFB and FID with Google's good thresholds](/assets/images/browser-web-vitals.svg)

| Vital | Question it answers |
|---|---|
| **TTFB** — Time to First Byte | Is the server even awake? |
| **FCP** — First Contentful Paint | When did *anything* first appear? |
| **LCP** — Largest Contentful Paint | When did the biggest thing appear — “the page is here”? |
| **CLS** — Cumulative Layout Shift | Did the page jump around while loading? (lower is steadier) |
| **INP** — Interaction to Next Paint | How quickly does the page react to my click? |
| **FID** — First Input Delay | The older cousin of INP |

FID and INP only appear once your script **interacts** with the page (clicks, types) — a load-only test has no interactions to measure.
Percentiles work on these too, so your [thresholds](/k6-core-concepts/thresholds.md) can guard them, for example `browser_web_vital_lcp: ['p(75)<2500']` (LCP under 2.5 s for 75% of visits — Google’s commonly used goal).

### The price: browsers are heavy

A browser test starts a **whole Chrome** for each virtual user, rendering pages and running JavaScript. That costs real CPU and memory, so:

- Use **far fewer** browser VUs than API VUs — a handful, not thousands.
- Keep browser tests for **critical user journeys** (login, search, checkout), not every endpoint.
- Close pages and contexts you open, or a long run slowly leaks memory.
- Run the machine’s monitoring alongside a big browser test — the *load generator* can become the bottleneck.

The winning pattern is **both together**: lots of cheap API load to stress the server, plus a few browser users measuring what the experience feels like *while* the server is busy. You’ll build that in a later part of this section.

### Try it: API versus browser side by side

[api-vs-browser.js](/assets/code/browser-ui-testing-with-playwright-k6-integration/api-vs-browser.js) runs the same page as one API scenario and one browser scenario, so you can compare `http_reqs` and `data_received` against `browser_http_req_*` and `browser_data_received` yourself:

```bash
k6 run api-vs-browser.js
```

## Common pitfalls

- **No Chrome installed.** The test can’t start a browser. Install Chrome (or another Chromium-based browser) first.
- **Forgetting `browser: { type: 'chromium' }`** in the scenario options — browser calls then fail.
- **Forgetting `await`** (or `async`). Steps race each other and the test becomes flaky.
- **Not closing pages.** Leaked tabs eat memory over a long test.
- **Using too many VUs.** Browser VUs are heavy; hundreds will overwhelm most machines.
- **Expecting Playwright code to paste in unchanged.** It is Playwright-*style*, not Playwright.
- **Comparing raw numbers between machines or locations.** TTFB and load times depend on distance and network; compare like with like.
- **Trusting a `checks` threshold with zero checks.** `checks: ['rate==1.0']` passes when *no* checks ran at all — make sure your checks actually execute.

## Key takeaways

- **API tests measure the server; browser tests measure the experience.** You need both — API first, browser for key journeys.
- The **k6 browser module** drives a **real Chromium** through the **Chrome DevTools Protocol**, with a **Playwright-style** API (but it is **not** Playwright itself).
- It’s **built into k6**; you only need Chrome installed.
- A browser scenario needs **`browser: { type: 'chromium' }`**, an **`async`** default function and **`await`** on every browser call.
- Results add **BROWSER** metrics and **web vitals** (TTFB, FCP, LCP, CLS, INP, FID).
- Browsers are **heavy** — use few, and close what you open.

## Further reading

- [Grafana k6 — Browser module](https://grafana.com/docs/k6/latest/using-k6-browser/)
- [Grafana k6 — Running browser tests](https://grafana.com/docs/k6/latest/using-k6-browser/running-browser-tests/)
- [Grafana k6 — Browser metrics](https://grafana.com/docs/k6/latest/using-k6-browser/metrics/)
- [xk6-browser on GitHub](https://github.com/grafana/xk6-browser)
- [Using the Playwright Library for E2E Browser Tests](/browser-ui-testing-with-playwright-k6-integration/playwright-e2e-login-flow.md)
- [Reading the k6 Summary — a Guided Tour](/k6-console-output/reading-the-k6-summary.md)
