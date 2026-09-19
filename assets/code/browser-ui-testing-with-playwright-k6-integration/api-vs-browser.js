import http from 'k6/http';
import { browser } from 'k6/browser';

// ─────────────────────────────────────────────────────────────
//  API VS BROWSER — the same page, two very different tests
//
//  The API scenario sends ONE request and gets the HTML back.
//  The browser scenario opens the page in Chrome, which then downloads
//  the HTML plus scripts, styles, fonts and images, and renders it.
//
//  Compare the two data columns in the summary:
//    data_received / data_sent            ← the API scenario
//    browser_data_received / _sent        ← the browser scenario
//    http_reqs (1)  vs  browser_http_req_duration (many requests)
//
//  Run with:
//    k6 run api-vs-browser.js
// ─────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    api: {
      executor: 'shared-iterations',
      exec: 'apiTest',
      vus: 1,
      iterations: 1,
    },
    ui: {
      executor: 'shared-iterations',
      exec: 'uiTest',
      vus: 1,
      iterations: 1,
      options: { browser: { type: 'chromium' } },
    },
  },
};

export function apiTest() {
  http.get('https://quickpizza.grafana.com/');
}

export async function uiTest() {
  const page = await browser.newPage();
  try {
    await page.goto('https://quickpizza.grafana.com/');
  } finally {
    await page.close();
  }
}
