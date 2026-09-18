import http from 'k6/http';
import { sleep } from 'k6';

// ─────────────────────────────────────────────────────────────
//  FIRST TEST — two separate blocks, both exported
//
//  1) options          → HOW MUCH load: 3 virtual users for 10 seconds
//  2) default function → WHAT each user does: one GET request, then a pause
//
//  Run with:
//    k6 run first-test.js
// ─────────────────────────────────────────────────────────────

// Block 1 — the load
export const options = {
  vus: 3,          // three virtual users…
  duration: '10s', // …looping for ten seconds
};

// Block 2 — the logic every virtual user repeats
export default function () {
  http.get('https://quickpizza.grafana.com/'); // a simple GET request
  sleep(1);                                    // think time: pause 1 second, then loop again
}
