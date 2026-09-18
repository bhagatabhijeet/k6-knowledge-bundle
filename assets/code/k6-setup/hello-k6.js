import http from 'k6/http';
import { check, sleep } from 'k6';

// ─────────────────────────────────────────────────────────────
//  HELLO k6 — the smallest script that proves your setup works
//
//  1. `k6 version` prints a version  → k6 is installed and on your PATH
//  2. `k6 run hello-k6.js` passes    → k6 can execute a script and reach the network
//  3. Hovering over `http.get` in VS Code shows a signature
//                                    → editor IntelliSense is working
// ─────────────────────────────────────────────────────────────

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
