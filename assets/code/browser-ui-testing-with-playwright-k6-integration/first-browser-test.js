import { browser } from 'k6/browser';
import { check } from 'k6';

// ─────────────────────────────────────────────────────────────
//  FIRST BROWSER TEST — open a real page in a real (headless) Chrome
//
//  Needs: Google Chrome (or another Chromium-based browser) installed.
//
//  Three things are different from an API test:
//    1) the scenario must set  browser: { type: 'chromium' }
//    2) the default function is  async  and every browser call is  await-ed
//    3) results include BROWSER and WEB_VITALS metrics
//
//  Run with:
//    k6 run first-browser-test.js
//  Watch the browser (headful) with:
//    PowerShell:  $env:K6_BROWSER_HEADLESS="false"; k6 run first-browser-test.js
//    bash:        K6_BROWSER_HEADLESS=false k6 run first-browser-test.js
// ─────────────────────────────────────────────────────────────

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
    checks: ['rate==1.0'],                // every check must pass
  },
};

export default async function () {
  const page = await browser.newPage();   // open a new tab (in a fresh browser context)

  try {
    await page.goto('https://quickpizza.grafana.com/');   // navigate and wait for the page to load

    const title = await page.title();
    const buttonText = await page.locator('button').first().textContent();

    console.log(`title = "${title}"  ·  first button = "${buttonText.trim()}"`);

    check(title, { 'page title is QuickPizza': (t) => t === 'QuickPizza' });
    check(buttonText, { 'the page has a pizza button': (t) => t.length > 0 });
  } finally {
    await page.close();                   // always close the tab, even if a step fails
  }
}
