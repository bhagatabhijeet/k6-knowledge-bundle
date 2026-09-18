import http from 'k6/http';
import { check, group, fail } from 'k6';

// ─────────────────────────────────────────────────────────────
//  DEBUG DEMO — the techniques you use INSTEAD of breakpoints
//
//  k6 has no built-in step-through debugger, so you debug by making the
//  script talk to you. Try these, from lightest to heaviest:
//
//    k6 inspect debug-demo.js                       # parse only: syntax & options
//    k6 run debug-demo.js                           # normal run: read console + checks
//    k6 run --http-debug debug-demo.js              # + every request/response (no bodies)
//    k6 run --http-debug=full debug-demo.js         # + response bodies (noisy!)
//    k6 run -v debug-demo.js                        # + k6's own verbose logging
//    k6 run --console-output=out.log debug-demo.js  # send console.log to a file
//
//  Always debug with ONE user and ONE iteration (set below) — never at scale.
// ─────────────────────────────────────────────────────────────

export const options = {
  vus: 1,          // one virtual user…
  iterations: 1,   // …one iteration: the "debug run" size
};

export default function () {
  group('Home page', function () {
    const res = http.get('https://test.k6.io/');

    // 1) console.* — print values you want to see (levels: log, info, warn, error, debug)
    console.log(`status=${res.status} duration=${res.timings.duration.toFixed(0)}ms`);
    console.warn(`final URL after redirects: ${res.url}`);

    // 2) check — a named pass/fail line in the summary; the run keeps going on failure
    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'body is not empty': (r) => r.body && r.body.length > 0,
    });

    // 3) fail() — abort THIS iteration right here with a clear message
    if (!ok) {
      fail(`home page check failed (status ${res.status})`);
    }
  });

  // 4) a deliberately failing check, so you can see what a failure looks like
  check(null, { 'demo: this check is meant to fail': () => false });
}
