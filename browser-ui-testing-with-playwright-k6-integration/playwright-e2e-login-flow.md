---
type: Guide
title: Using the Playwright Library for E2E Browser Tests
description: >
  Script a complete end-to-end login flow with the Playwright-style API in k6: async and await, browser
  context and page, CSS locators, fill and click, waiting for a condition instead of a clock, and verifying
  the result with a k6 check.
tags:
  - k6
  - browser
  - playwright
  - e2e
  - locators
  - async-await
  - login-flow
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Time to make the browser **do something**. In this guide you will write a test that behaves exactly like a person logging in:

> open the login page → type a username → type a password → click **Sign in** → confirm you are logged in.

Only **six lines of real actions** — but each one teaches an idea you will use in every browser test you ever write. And because it runs *inside k6*, the
same script that checks the flow also **measures** it: web vitals, request timings and a pass/fail verdict.

We will log in to **QuickPizza**, Grafana’s public demo app. It prints its demo login on the page itself (*“Username (hint: default)”*, *“Password (hint: 12345678)”*),
so it is safe to use and to publish.

![The QuickPizza login page rendered by k6 browser: a Username field, a Password field and a Sign in button, with the demo login hints printed on the page](/assets/images/browser-quickpizza-login.png)

## Why it matters

An **end-to-end (E2E) test** follows a whole user journey through the real interface — not one request, but the *whole chain*: the page loads, the fields accept input, the button works,
the server answers, the next screen appears. Login is the classic first journey because almost everything else in an application sits behind it.

Wrapping the journey in k6 gives you two things at once:

- **Functional confidence** — checks prove the flow really works.
- **Performance data** — the same run records how long each part took and how the page felt.

## How it works

The whole script is [login-flow-test.js](/assets/code/browser-ui-testing-with-playwright-k6-integration/login-flow-test.js). We will build it piece by piece.

### Step 1 — Start a new file with the same two blocks

Create **`login-flow-test.js`** (any name works). It has the same two building blocks as every k6 script:

- **`options`** — how much load and *which browser* (`browser: { type: 'chromium' }`, exactly as in [Using k6 Browser](/browser-ui-testing-with-playwright-k6-integration/using-k6-browser.md)).
- **The default function** — the user journey.

In this lecture style we give the default function a **name** — `browserTest`. It works the same as an anonymous one:

```js
export default async function browserTest() {
  // the journey goes here
}
```

(Naming it becomes useful later, when a scenario picks a specific function to run with `exec` — you will see that in the next parts.)

### Step 2 — `async` and `await`: making the script patient

Everything a browser does takes real time — loading a page, waiting for a field, waiting for a click to take effect. In JavaScript such actions return a **Promise** (“I’ll finish later”).
Two small words make your script wait for them:

- **`await`** goes before each browser step: *“finish this before moving on.”*
- **`async`** goes before the function: *“this function contains awaits.”*

![Without await, browser steps all fire at once and race each other; with await they run one after another in order](/assets/images/browser-async-await.svg)

The rule is simple: **`async` on the function, `await` before every browser call.** Forget one and the steps race — you might fill a form before the page has even loaded.

### Step 3 — Open a window (context) and a tab (page)

Think about opening a **private/incognito window** in your browser. You get an empty window first — no cookies, no history — and *then* you open a tab in it. k6 uses exactly those two words:

![A browser context is like an incognito window and a page is a tab inside it, with the matching lines of code](/assets/images/browser-context-page-analogy.svg)

```js
import { browser } from 'k6/browser';

export default async function browserTest() {
  const context = await browser.newContext();   // the fresh incognito-style window
  const page = await context.newPage();         // a tab inside it
  // …
}
```

- A **context** is the isolated window — every virtual user gets clean cookies, like a brand-new visitor.
- A **page** is the tab you actually work with. Almost every action goes through `page`.
- Shortcut: `browser.newPage()` creates both in one call — fine for simple scripts.

### Step 4 — Go to the page

```js
await page.goto('https://quickpizza.grafana.com/login');
```

That is *typing the address and pressing Enter*. Then let the page **finish loading its JavaScript** before touching it:

```js
await page.waitForLoadState('networkidle');   // wait until the page has gone quiet
```

> **Why wait here?** A page can be *visible* before its scripts have finished setting up the form. During our own exploration, typing immediately after `goto` once submitted the form the old-fashioned way — the credentials ended up in the address bar
> and the login didn’t happen. It didn’t happen every time (that’s what makes it a *timing race*), but a test that fails “sometimes” is worse than one that fails always. Waiting for the page to settle removes the race.

### Step 5 — Find the fields with CSS locators

To type into a field, you must tell k6 **which** element. That is what a **locator** does. Open your browser, **right-click the field → Inspect**, and look at its attributes:

```html
<input id="username" name="username" type="text">
<input id="password" name="password" type="password">
<button type="submit">Sign in</button>
```

Turn what you see into **CSS**:

![The login form with the username field, password field and Sign in button highlighted and matched to their CSS locators, plus a table of locator styles that work in k6](/assets/images/browser-locators-cheatsheet.svg)

| Element | Attribute you spot | CSS locator |
|---|---|---|
| Username box | `id="username"` | **`#username`** — put a `#` before the id |
| Password box | `name="password"` | **`input[name='password']`** — `tag[attribute='value']` |
| Sign in button | `type="submit"` | **`button[type='submit']`** |

Two patterns cover nearly everything:

- **By id →** `#` + the id. IDs are unique, so this is the best choice when one exists.
- **By attribute →** `tag[attribute='value']`. Pick *any* attribute/value pair that identifies the element uniquely. (`.name` selects by class.)

**Test a locator before you use it:** in Chrome’s DevTools **Console**, run `document.querySelectorAll("input[name='password']")` — if it returns **exactly one** element, you have a good locator.
Browser extensions that generate selectors can speed this up if you’re new to CSS.

> **Good to know (tested on k6 v1.7.1):** plain **CSS**, **XPath** and `locator('button', { hasText: 'Logout' })` all work. Playwright’s text selectors — `'text=Logout'` and `'button:has-text("Logout")'` — **raised errors**
> in this version. It’s the “Playwright-*style*, not Playwright” difference in action: when a Playwright shortcut fails, fall back to CSS or XPath.

### Step 6 — Type the username and password

```js
await page.locator('#username').fill('default');
await page.locator("input[name='password']").fill('12345678');
```

`page.locator(css)` finds the element; `.fill(text)` puts text in it. There is also **`.type(text)`**, which presses the keys **one at a time** like a real typist.
Both work — we measured `type('default')` at about **68 ms** and `fill('12345678')` at about **3 ms**. Use `fill` for speed; use `type` only when you need to simulate real keystrokes (for example for a field that reacts to each key).

### Step 7 — Click Sign in

```js
await page.locator("button[type='submit']").click();
```

Same locator idea, different action: **`.click()`**. This is the moment the browser logs you in.

### Step 8 — Narrate with `console.log`

To *see* what the test is doing while it runs, add `console.log` between the steps — nothing fancy, just plain text:

```js
console.log('Step 2: filling in the username');
```

These lines appear in the terminal in order, so you always know **where** the test is — invaluable when something goes wrong halfway.

### Step 9 — Wait for proof, not for a clock

After the click the app needs a moment to log in and redraw the page. A tempting fix is a fixed pause — `await page.waitForTimeout(2000)` (“wait two seconds”). It works… until it doesn’t:

![Fixed sleep versus waiting for a condition: a two second sleep wastes time on fast runs and fails on slow ones, while waiting for an element continues exactly when the page is ready](/assets/images/browser-wait-strategies.svg)

A fixed sleep is **too short** on a slow day (flaky failures) and **too long** on a fast one (wasted time, multiplied by every user). Wait for a **condition** instead — something that exists *only* after success:

```js
await page.locator('button', { hasText: 'Logout' }).waitFor();
```

The **Logout** button appears only when you are logged in, so this waits **exactly as long as needed**. (We ran the finished script three times in a row; it passed every time.)

### Step 10 — Verify with a k6 `check()`

Last, prove the login worked. Read something from the page, then assert on it with the same `check()` you used for API responses:

```js
const heading = await page.locator('h2').textContent();
const logoutVisible = await page.locator('button', { hasText: 'Logout' }).isVisible();

check(heading, { 'logged in: ratings heading is shown': (h) => h.includes('Your Pizza Ratings') });
check(logoutVisible, { 'logged in: Logout button is visible': (v) => v === true });
```

After a successful login QuickPizza shows the **“Your Pizza Ratings:”** heading and a **Logout** button:

![The QuickPizza page after logging in, showing the Your Pizza Ratings heading and a list of ratings](/assets/images/browser-quickpizza-after-login.png)

Notice the pattern: the Playwright-style calls **read** the page, and the k6 **`check()`** does the **asserting**. That is how “E2E test” and “k6 test” fit together.

### The complete script

```js
// assets/code/browser-ui-testing-with-playwright-k6-integration/login-flow-test.js
import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: { checks: ['rate==1.0'] },
};

export default async function browserTest() {
  const context = await browser.newContext();   // 1) a fresh window
  const page = await context.newPage();         // 2) a tab in it

  try {
    console.log('Step 1: opening the login page');
    await page.goto('https://quickpizza.grafana.com/login');
    await page.waitForLoadState('networkidle');

    console.log('Step 2: filling in the username');
    await page.locator('#username').fill('default');

    console.log('Step 3: filling in the password');
    await page.locator("input[name='password']").fill('12345678');

    console.log('Step 4: clicking Sign in');
    await page.locator("button[type='submit']").click();

    await page.locator('button', { hasText: 'Logout' }).waitFor();
    console.log('Step 5: login finished');

    const heading = await page.locator('h2').textContent();
    const logoutVisible = await page.locator('button', { hasText: 'Logout' }).isVisible();
    console.log(`Step 6: heading = "${heading.trim()}", Logout button visible = ${logoutVisible}`);

    check(heading, { 'logged in: ratings heading is shown': (h) => h.includes('Your Pizza Ratings') });
    check(logoutVisible, { 'logged in: Logout button is visible': (v) => v === true });
  } finally {
    await page.close();
    await context.close();
  }
}
```

[Source](/assets/code/browser-ui-testing-with-playwright-k6-integration/login-flow-test.js)

### Run it and read the result

```bash
k6 run login-flow-test.js
```

Want to watch Chrome do it? Run with the window visible: `K6_BROWSER_HEADLESS=false` (PowerShell: `$env:K6_BROWSER_HEADLESS="false"; k6 run login-flow-test.js`).

Here is the real console, narrated:

![The login test's real console output: numbered Step messages, the two passing checks and the iteration duration, each explained](/assets/images/browser-login-flow-console.svg)

What you get from this single run:

- **Six Step lines** showing the flow, in order.
- **Both checks ✓** — the E2E verdict — and the `checks` threshold holding at 100%.
- **`iteration_duration` ≈ 2.75 s** — one complete user journey, start to finish.
- **BROWSER metrics and web vitals** — 24 requests, ≈ 500 kB, TTFB ≈ 1.27 s, FCP/LCP ≈ 1.64 s, and (because we clicked and typed) **INP ≈ 32 ms** — all explained in [Using k6 Browser](/browser-ui-testing-with-playwright-k6-integration/using-k6-browser.md).

## Common pitfalls

- **Missing `await`.** The single most common bug. A step that isn’t awaited runs in the background while the script races ahead.
- **Typing before the page is ready.** Use `waitForLoadState('networkidle')` (or wait for a specific element) after `goto`.
- **Fixed sleeps as a fix.** `waitForTimeout` hides the problem; wait for a condition instead.
- **Fragile locators.** Prefer ids and stable attributes over long CSS chains or generated class names (like Tailwind classes) that change with the design.
- **Locators that match more than one element.** Check with `querySelectorAll` in DevTools first — you want **exactly one** match.
- **Using Playwright-only selector shortcuts.** `text=…` and `:has-text()` failed in the tested k6 version; use CSS, XPath or the `hasText` option.
- **Not closing the page and context.** Always `finally { … close() }`.
- **Asserting on brittle text.** Check a stable landmark (a Logout button, a heading) rather than a sentence marketing may reword.
- **Real credentials in a script.** Use demo accounts, and pass secrets through environment variables (`__ENV`), never hard-coded in a committed file.

## Key takeaways

- An **E2E browser test** follows a whole user journey; in k6 it runs inside the **default function**, with the **`browser`** option in `options`.
- **`async` on the function, `await` before every browser call** — that keeps the steps in order.
- **Context = incognito-style window; page = tab.** `browser.newContext()` → `context.newPage()` (or `browser.newPage()` as a shortcut).
- **Locators are CSS:** `#id` for an id, `tag[attribute='value']` for anything else; verify with `querySelectorAll` in DevTools.
- **`fill()`** sets a value instantly; **`type()`** presses keys one by one; **`click()`** clicks.
- **Wait for a condition** (`locator.waitFor()`, `waitForLoadState`), not for a clock.
- Read the page with Playwright-style calls and **assert with `check()`** — you get a functional verdict and performance metrics in one run.

## Further reading

- [Grafana k6 — Browser module](https://grafana.com/docs/k6/latest/using-k6-browser/)
- [Grafana k6 — Browser API reference](https://grafana.com/docs/k6/latest/javascript-api/k6-browser/)
- [Using k6 Browser](/browser-ui-testing-with-playwright-k6-integration/using-k6-browser.md)
- [Expected Responses and http_req_failed](/k6-core-concepts/expected-responses.md) · [Thresholds](/k6-core-concepts/thresholds.md) — the `check()` and threshold ideas used above
