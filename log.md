# Changelog

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
