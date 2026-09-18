---
title: k6 Setup
description: >
  Everything needed to go from nothing to a working k6 environment — installing
  the k6 binary on Mac, Windows, Linux or Docker, and setting up VS Code or Cursor to write
  scripts with IntelliSense, plus the optional k6 Studio recorder.
---

![Your k6 setup journey: install k6, pick an editor, create a project, optionally add k6 Studio, run your first script](/assets/images/k6-setup-roadmap.svg)

## Concepts

- [Installing k6](/k6-setup/installing-k6.md) — where k6 comes from (Grafana), the open-source vs cloud distinction, and how to install on macOS, Windows, Linux and Docker
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md) — why k6 scripts are JavaScript (and optionally TypeScript), installing VS Code or Cursor, and adding k6 IntelliSense
- [Creating a New k6 Project in VS Code / Cursor](/k6-setup/creating-a-k6-project.md) — why k6 projects are still Node projects, and step-by-step: install Node.js, `npm init -y`, open the folder, verify k6
- [Setting Up k6 Studio](/k6-setup/k6-studio.md) — the free desktop app that records a browser flow and generates a k6 script: install, Recorder, Generator rules, Validator, export
- [Editor Extensions & AI Assistants for k6](/k6-setup/k6-editor-extensions.md) — the official VS Code extension, what is (and isn't) available in Cursor, run-current-file tasks for both, and `k6 x agent` + the k6 MCP server
- [Debugging k6 Scripts](/k6-setup/debugging-k6-scripts.md) — why there is no F5-and-breakpoints workflow in k6 (unlike Playwright), and the tools to use instead
