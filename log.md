# Changelog

## 2026-09-18 (update 11)

- Added topic **k6 Core Concepts** (`k6-core-concepts/`): "Expected Responses and http_req_failed", "Thresholds — Pass/Fail Goals for Your Metrics" and "Stages — Ramp-up, Hold and Ramp-down".
- Added five verified scripts (`assets/code/k6-core-concepts/`) and ten diagrams, including teacher-style annotated consoles from real runs.
- Verified in k6: default expected range 200–399, global `setResponseCallback`, threshold aggregations per metric type, exit code 99, `abortOnFail` with `delayAbortEval`, stages starting at 1 VU (`startVUs` default) and graceful ramp-down.

## 2026-09-18 (update 10)

- Replaced the illustrative k6 Studio script with a **real export** (`assets/code/k6-setup/studio-generated-example.js`) and added **real k6 Studio screenshots** (home, recorder, recording, request inspector, generator, load profile, thresholds, script, add-rule menu, validator and checks) to `k6-setup/k6-studio.md`. Screenshots are from k6 Studio v1.13.0.

## 2026-09-18 (update 9)

- Added guide: "The Math of Percentiles — Explained Simply" (`k6-console-output/percentile-math.md`) with `percentile-math-demo.js` and eight diagrams, written for a 10th-grade reading level.
- Added a percentile-math marketing section to the root `README.md`; added the JavaScript Knowledge Bundle callout and reference-guide entry.
- Added a `.gitignore` rule for zip archives.

## 2026-09-18 (update 8)

- Added topic **k6 Configuration Options in Code Editor** (`k6-configuration-options-in-code-editor/`): "Enabling k6 IntelliSense in Your Editor" and "Writing and Running Your First k6 Test", with `first-test.js` and `first-test-missing-import.js`.
- Added topic **Understanding the k6 Console Output** (`k6-console-output/`): "Reading the k6 Summary — a Guided Tour" and "http_req_duration and Percentiles", with `percentile-demo.js` and colour-annotated console diagrams.
- Added guides to `k6-setup/`: "Editor Extensions & AI Assistants for k6" (with `k6-tasks.json`) and "Debugging k6 Scripts" (with `debug-demo.js`).
- Added terminal-style images for `k6 version` success/failure, the k6 banner and a first `k6 run`; embedded in the install and project guides.
- Added 15+ SVG diagrams (IntelliSense, npm install flow, first-test anatomy, console tour and zooms, percentiles, debugging toolkit, editor tooling map, AI-assistant setup).
- Wording: renamed "Course curriculum overview" to "Bundle roadmap" in `what-is-k6.md`; updated root, topic and setup indexes and the README bundle map.

## 2026-09-18 (update 7)

- Rewrote `k6-architecture/k6-test-lifecycle.md` for clarity: glossary, stage-by-stage walkthrough, "when things go wrong" table, self-check questions.
- Added five lifecycle diagrams to `assets/images/`: `k6-lifecycle-overview`, `k6-lifecycle-timeline`, `k6-lifecycle-data-flow`, `k6-lifecycle-where-to-put-code`, `k6-lifecycle-code-map`.
- Verified with k6 that HTTP in init raises "Making http requests in the init context is not supported" and that a throwing `setup()` skips both `default()` and `teardown()`.

## 2026-09-18 (update 6)

- Added guide: "Setting Up k6 Studio" (`k6-setup/k6-studio.md`) with the illustrative `studio-generated-shape.js`.
- Added SVG graphics for the setup topic: `k6-setup-roadmap`, `k6-install-paths`, `editor-vscode-cursor`, `node-vs-k6-engine`, `k6-studio-workflow`, `k6-studio-generator-anatomy`, `k6-studio-rules`; embedded them in the setup pages.
- Re-verified the JavaScript engine against the latest sources: k6 uses **Sobek** (Grafana's fork of goja) since v0.52; the current `go.mod` has no goja dependency. Added the goja to Sobek history to `how-k6-is-built.md` and the architecture diagram.
- Updated version examples to k6 v2.x (latest release v2.2.0).

## 2026-09-18 (update 5)

- Extended `k6-setup/` to cover both VS Code and Cursor: install steps, extensions, shell commands and terminal in `setting-up-the-editor.md`; clearer shell-command guidance in `creating-a-k6-project.md`.

## 2026-09-18 (update 4)

- Added topic **k6 Architecture** (`k6-architecture/`) with concepts "How k6 Is Built — Go and the Sobek JavaScript Engine" and "The k6 Test Lifecycle", sourced from the Grafana k6 docs and the Sobek repository.
- Added `assets/images/k6-architecture.svg` and `assets/code/k6-architecture/test-lifecycle.js`.
- Corrected TypeScript guidance in `k6-setup/setting-up-the-editor.md`: k6 transpiles `.ts` with esbuild (types stripped, not checked).

## 2026-09-18 (update 3)

- Added concept: "Stress Testing" (`introduction-to-performance-testing/stress-testing.md`).
- Added code snippet: `assets/code/introduction-to-performance-testing/stress-test.js`.
- Updated `introduction-to-performance-testing/index.md` with the stress testing entry.
- Updated the `README.md` bundle map to list load and stress testing.
- Added concept: "Spike Testing" (`introduction-to-performance-testing/spike-testing.md`) with `spike-test.js` and `spike-test-arrival-rate.js`.
- Added concept: "Soak Testing" (`introduction-to-performance-testing/soak-testing.md`) with `soak-test.js`.
- Added SVG graphics: `spike-test-profile.svg`, `soak-test-profile.svg`, `test-types-at-a-glance.svg` in `assets/images/`.
- Added topic **k6 Setup** (`k6-setup/`) with guides "Installing k6" and "Setting Up the Editor", plus `assets/code/k6-setup/hello-k6.js`.
- Updated root `index.md`, the introduction topic `index.md` and the `README.md` bundle map.
- Added guide: "Creating a New k6 Project in VS Code / Cursor" (`k6-setup/creating-a-k6-project.md`); clarified Node.js's role in `setting-up-the-editor.md`.

## 2026-09-18 (update 2)

- Rewrote `README.md` with magnetic marketing content, ASCII banner, learning path table, AI-aided learning guide, and bundle map.
- Added concept: "Load Testing" (`introduction-to-performance-testing/load-testing.md`).
- Added code snippet: `assets/code/introduction-to-performance-testing/load-test.js`.
- Updated `introduction-to-performance-testing/index.md` with smoke testing and load testing entries.

## 2026-09-18

- Initialised bundle root: `index.md`, `log.md`, `README.md`, `CONTRIBUTING.md`.
- Added topic **Introduction to Performance Testing** with its directory index.
- Added concept: "What Is Performance Testing?" (`introduction-to-performance-testing/what-is-performance-testing.md`).
- Added concept: "What Is k6?" (`introduction-to-performance-testing/what-is-k6.md`).
- Created `assets/` folder structure (`assets/images/`, `assets/code/`).
