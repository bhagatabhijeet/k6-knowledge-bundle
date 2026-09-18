import http from 'k6/http';
import { check, group, sleep } from 'k6';

// ─────────────────────────────────────────────────────────────
//  ILLUSTRATIVE — the *shape* of a script that k6 Studio exports.
//  Hand-written to show the ideas; a real export is longer and its exact
//  code differs by k6 Studio version. It is ordinary k6, so you can open
//  and edit it in VS Code / Cursor like any other script.
//
//  How the pieces map to k6 Studio:
//    export const options  ← Generator ▸ Test Options (load profile, thresholds)
//    group(...)            ← the groups you named while recording
//    csrf / USERS          ← Correlation rule / Parameterization rule
//    check(...)            ← the default Verification rule (status matches recording)
//
//  Run with:
//    k6 run studio-generated-shape.js
// ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed:   ['rate<0.01'],
  },
};

// Parameterization rule — values that would come from the Test Data tab
const USERS = [
  { user: 'alice', pass: 'pw-1' },
  { user: 'bob',   pass: 'pw-2' },
  { user: 'carol', pass: 'pw-3' },
];

const BASE = 'https://quickpizza.grafana.com';

export default function () {
  // each VU / iteration picks different data
  const creds = USERS[(__VU + __ITER) % USERS.length];

  group('Home page', function () {
    const res = http.get(`${BASE}/`);
    // Verification rule: the recorded status was 200
    check(res, { 'GET / → 200': (r) => r.status === 200 });
  });

  group('Log in', function () {
    // Correlation rule: extract a fresh value from the previous response,
    // instead of replaying the token that was captured while recording.
    const home = http.get(`${BASE}/`);
    const csrf = home.headers['X-Csrf-Token'] || 'no-token-in-this-demo';

    const res = http.post(
      `${BASE}/api/users/token/login`,
      JSON.stringify({ username: creds.user, password: creds.pass, csrf }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    check(res, { 'login responded': (r) => r.status > 0 });
  });

  sleep(1); // think time — Test Options ▸ Think time
}
