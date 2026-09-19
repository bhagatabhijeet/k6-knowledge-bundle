---
okf_version: "0.2"
---

# k6 Performance Testing Knowledge Bundle

**Owner:** bhagatabhijeet  
**Created:** 2026-09-18  
**OKF version:** 0.2

A comprehensive, concept-by-concept guide to performance testing with k6 (Grafana k6).
The bundle takes you from first principles — what performance testing is and why it matters —
through advanced topics like cloud-scale load runs, Grafana dashboards, and CI/CD integration.

## Topics

The bundle is a learning path in ten parts. Read them in order, or jump to the one you need.

1. [Performance Testing Fundamentals](/introduction-to-performance-testing/index.md) — what performance testing is, where k6 fits, and the test types (smoke, load, stress, spike, soak)
2. **k6 Setup**
   - [k6 Setup](/k6-setup/index.md) — install k6, the editor and project, k6 Studio, extensions and debugging
   - [k6 Configuration Options in Code Editor](/k6-configuration-options-in-code-editor/index.md) — IntelliSense and your first test
3. **k6 Core Concepts**
   - [k6 Core Concepts](/k6-core-concepts/index.md) — expected responses, thresholds and stages
   - [Understanding the k6 Console Output](/k6-console-output/index.md) — reading results and the math of percentiles
   - [k6 Architecture](/k6-architecture/index.md) — Go, the Sobek JavaScript engine and the test lifecycle
4. How to Test APIs Using k6 — *coming soon*
5. Building Load Scenarios for Functional API Tests — *coming soon*
6. [Browser UI Testing with Playwright k6 Integration](/browser-ui-testing-with-playwright-k6-integration/index.md) — *in progress*
   - [Using k6 Browser](/browser-ui-testing-with-playwright-k6-integration/using-k6-browser.md) — API load vs browser load, the k6 browser module, web vitals
   - [Using the Playwright Library for E2E Browser Tests](/browser-ui-testing-with-playwright-k6-integration/playwright-e2e-login-flow.md) — an end-to-end login flow, step by step
7. Building Load Scenarios for UI Tests — *coming soon*
8. Building Load Tests for the Grafana Cloud Platform — *coming soon*
9. CI/CD Integration — *coming soon*
10. [Math for Performance Testers](/math-for-performance-testers/index.md) — the maths behind the numbers, in plain language: percentiles first

## Reference guides

- [JavaScript Knowledge Bundle](https://github.com/bhagatabhijeet/javascript-knowledge-bundle) — a companion OKF bundle that teaches JavaScript from beginner to intermediate (variables, functions, objects, arrays, control flow, promises, `async/await`, ES modules). k6 scripts are written in JavaScript, so read it first if you are new to the language, or keep it open as a refresher while you work through this bundle.
