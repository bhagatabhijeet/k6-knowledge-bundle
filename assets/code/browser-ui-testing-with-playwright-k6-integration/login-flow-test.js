import { browser } from 'k6/browser';
import { check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  E2E BROWSER TEST — log in to QuickPizza with the Playwright-style API
//
//  The flow, exactly as a person would do it:
//    1. open a browser window        → browser.newContext()
//    2. open a tab in it             → context.newPage()
//    3. go to the login page         → page.goto(url)
//    4. type the username + password → page.locator(css).fill(text)
//    5. click "Sign in"              → page.locator(css).click()
//    6. confirm we are logged in     → read the page, then k6 check()
//
//  QuickPizza prints its demo login on the page itself
//  ("hint: default" / "hint: 12345678"), so this is safe to publish.
//
//  Run with:
//    k6 run login-flow-test.js
//  Watch it happen in a real window:
//    PowerShell:  $env:K6_BROWSER_HEADLESS="false"; k6 run login-flow-test.js
// ─────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

// `async` because every browser step returns a Promise; `await` makes each step finish before the next begins
export default async function browserTest() {
  // 1) a fresh "incognito-style" window — no cookies, no history
  const context = await browser.newContext();

  // 2) a new tab inside that window
  const page = await context.newPage();

  try {
    // 3) open the login page and let the page finish loading its JavaScript
    console.log('Step 1: opening the login page');
    await page.goto('https://quickpizza.grafana.com/login');
    await page.waitForLoadState('networkidle'); // don't type before the page is truly ready

    // 4) fill in the two fields. CSS locators: #id  or  tag[attribute='value']
    console.log('Step 2: filling in the username');
    await page.locator('#username').fill('default');

    console.log('Step 3: filling in the password');
    await page.locator("input[name='password']").fill('12345678');

    // 5) submit the form
    console.log('Step 4: clicking Sign in');
    await page.locator("button[type='submit']").click();

    // wait until the Logout button appears — it exists ONLY after a successful login,
    // so this waits exactly as long as needed (no fixed sleeping, no guessing)
    await page.locator('button', { hasText: 'Logout' }).waitFor();
    console.log('Step 5: login finished');

    // 6) prove it worked: the "Your Pizza Ratings" heading and a Logout button appear only when logged in
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
