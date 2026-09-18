---
type: Guide
title: Editor Extensions & AI Assistants for k6 (VS Code and Cursor)
description: >
  Which k6 extensions exist for VS Code, whether they are available in Cursor, how to run k6 scripts
  from the editor with tasks, and how to connect an AI assistant to k6 with k6 x agent and the k6 MCP server.
tags:
  - k6
  - vscode
  - cursor
  - extensions
  - tasks
  - mcp
  - ai-assistant
  - open-vsx
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Besides [IntelliSense](/k6-configuration-options-in-code-editor/enable-k6-intellisense.md), editors can help you **run**
k6 scripts and even **write** them. This page covers what is actually available today for **VS Code** and **Cursor**
— including what is *not* — so you don't waste time hunting for an extension that doesn't exist for your editor.

![k6 tooling map: what works in VS Code and in Cursor — official extension, Test Explorer, tasks, AI assistant setup and IntelliSense](/assets/images/k6-editor-tooling-map.svg)

## Why it matters

Running `k6 run script.js` in the terminal always works, so extensions are conveniences, not requirements. But it helps
to know the landscape, because two facts surprise people:

1. The **official k6 VS Code extension** exists but is **small and no longer maintained**.
2. **Cursor doesn't use the same extension marketplace as VS Code**, so a VS Code extension may not be installable there.

Knowing this up front tells you what to use instead: **tasks** for a “run current file” button in *both* editors, and the
newer **k6 AI-assistant integration** for AI-driven authoring.

## How it works

### The official k6 extension for VS Code

| | |
|---|---|
| **Name** | *k6 for Visual Studio Code* |
| **Publisher / ID** | `k6` · `k6.k6` |
| **Install** | Extensions panel (**Ctrl+Shift+X**) → search *k6* → Install — or Quick Open (**Ctrl+P**) and run `ext install k6.k6` |
| **Requires** | k6 installed and on your `PATH`; the file must be **saved** on disk |
| **Version / status** | v0.6.0, last updated **March 2023**; its source repository has been moved to a “cold storage” archive and is **read-only** |

The k6 docs still list it under *Code editor extensions*, and it does what it says: it **runs the current file** with your local
k6 and streams the output to an output panel. It contributes three commands, found in the Command Palette
(**Ctrl+Shift+P**):

| Command | What it does |
|---|---|
| **k6: Run current file** | Runs the open script locally — equivalent to `k6 run <file>` |
| **k6: Run current file in k6 cloud** | Runs it in Grafana Cloud (needs an account and a token) |
| **k6: Open Settings** | Opens the extension settings |

The single setting is **`k6.cloudToken`**; if left empty the extension reads the **`K6_CLOUD_TOKEN`** environment variable.

**Honest assessment:** it is fine for “press a command, run the script”, but it hasn't been updated since 2023 and adds nothing
you can't get from a task (below). Don't expect new k6 features to be supported.

### A community alternative: k6 Test Explorer (VS Code)

*Grafana K6 Test Explorer* (`moonolgerd.k6-test-explorer`) is a **community** extension — not an official Grafana product — that lists
your k6 tests in VS Code's **Test Explorer** panel so you can run one or all of them. It needs VS Code **1.100 or later** and k6 on your
`PATH`. Settings include `k6TestExplorer.testPattern` (default `**/*{.test,-test}.{js,ts}`, which happens to match names like
`smoke-test.js`), `k6TestExplorer.k6Path`, `k6TestExplorer.defaultArgs` and `k6TestExplorer.secretsFile`.

### What about Cursor?

Cursor is built on VS Code, but for third-party extensions it uses the **Open VSX** registry instead of Microsoft's marketplace
(Microsoft's marketplace terms restrict it to VS Code products). Not every VS Code extension is on Open VSX. When checked in
September 2026, **neither `k6.k6` nor the Test Explorer was found on Open VSX**, so you won't find them by searching in Cursor.

Your options in Cursor, best first:

1. **Use tasks** (next section) — the same “run current file” convenience, no extension needed, identical in VS Code.
2. **Use the AI-assistant integration** (below) — Cursor is a first-class target.
3. **Sideload a `.vsix`** — Cursor supports *Command Palette → “Extensions: Install from VSIX…”*. It is possible for the official k6
   extension, but since that extension is unmaintained we don't recommend it.

> Availability changes. To re-check, open Cursor's Extensions panel and search “k6”, or query Open VSX for the extension ID.

### Run k6 from the editor with tasks — works in both

A **task** is a saved terminal command. It gives you a “run this file” menu entry in **VS Code and Cursor**, with no extension. Create
`.vscode/tasks.json` in your project:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "k6: run current file",
      "type": "shell",
      "command": "k6 run \"${file}\"",
      "group": { "kind": "test", "isDefault": true },
      "presentation": { "reveal": "always", "panel": "dedicated", "clear": true },
      "problemMatcher": []
    },
    {
      "label": "k6: debug run (1 VU, 1 iteration, HTTP debug)",
      "type": "shell",
      "command": "k6 run --vus 1 --iterations 1 --http-debug \"${file}\"",
      "group": "test",
      "presentation": { "reveal": "always", "panel": "dedicated", "clear": true },
      "problemMatcher": []
    },
    {
      "label": "k6: inspect current file",
      "type": "shell",
      "command": "k6 inspect \"${file}\"",
      "group": "test",
      "presentation": { "reveal": "always", "panel": "dedicated", "clear": true },
      "problemMatcher": []
    }
  ]
}
```

[Source](/assets/code/k6-setup/k6-tasks.json)

`${file}` is the file open in the editor. To use it: open a k6 script, then **Terminal → Run Task…** (or Command Palette →
*Tasks: Run Task*) and pick a task. The “default test task” is also available as **Tasks: Run Test Task**.

![Three ways to run a k6 script from the editor — the extension command, a task, or the terminal — all ending in the same k6 run](/assets/images/k6-run-from-editor.svg)

The three tasks mirror the [debugging ladder](/k6-setup/debugging-k6-scripts.md): **inspect** (does it load?), **run** (normal run), and
**debug run** (one user, one iteration, every request printed).

### Connect an AI assistant: `k6 x agent` and the k6 MCP server

Grafana describes k6 as “AI-native”: a dedicated toolset that plugs into modern AI editors. Two subcommands power it:

- **`k6 x agent`** — bootstraps your editor **in one command**, installing portable *skills* (planning, smoke/load/browser
  tests, Playwright-to-k6 conversion) and registering the MCP server.
- **`k6 x mcp`** — runs the **k6 MCP server** (*Model Context Protocol*; currently **in preview**), the bridge that lets an assistant
  call k6 tools.

**Requirements:** **k6 v2.0 or later** on your `PATH`, a project folder, and a supported editor. (Check yours with `k6 version`; if it says
v1.x, upgrade first.) Supported editors include **Cursor**, **GitHub Copilot in VS Code**, Claude Code, Codex CLI, OpenCode and Cline.

```bash
# from your project folder
k6 x agent init cursor            # Cursor
k6 x agent init vscode-copilot    # VS Code with GitHub Copilot
k6 x agent init --all             # every supported editor
k6 x agent status                 # verify what was installed
```

Useful flags: `--dry-run` (preview without writing anything), `--force` (overwrite files you edited locally).

![k6 x agent init writes MCP configuration and skill files into your project, then the assistant can validate, run and write k6 scripts through the k6 MCP server](/assets/images/k6-ai-assistant-setup.svg)

**Files it writes**, per the k6 docs:

| Editor | MCP configuration | Skills |
|---|---|---|
| Cursor | `.cursor/mcp.json` | `.cursor/rules/<name>.mdc` |
| VS Code + GitHub Copilot | `.vscode/mcp.json` | `.github/copilot/skills/<name>/` |

**What the assistant can then do**, through the MCP server: write scripts using the **embedded k6 documentation and TypeScript
definitions** (fewer invented APIs), **validate** syntax errors and missing imports, **run scripts locally** and read the results, generate
tests that follow k6 best practices, and convert Playwright tests into k6 browser scripts. Try a prompt in the chat such as:

> *“Write a smoke test for GET /api/orders, validate it, then run it and summarise the p(95) latency.”*

If you prefer to configure it by hand, the MCP server can also run from Docker (`docker run --rm -i grafana/mcp-k6`) and be listed
in the editor's MCP configuration file.

> **Stay in charge.** An assistant can write and run load tests — read what it produces, keep thresholds sensible, and point it only at
> environments you are allowed to test. Never aim generated load at production or third-party systems.

### JetBrains

If you use IntelliJ IDEA, the k6 docs also list a **k6 plugin** for JetBrains IDEs — see the plugin page for its features.

## Common pitfalls

- **Searching Cursor for the VS Code k6 extension and concluding “k6 isn't supported”.** k6 works fine in Cursor: use tasks, the
  terminal, and `@types/k6`.
- **Expecting new k6 features from the official extension.** It has not been updated since 2023.
- **Running a task on an unsaved file.** k6 runs what is on disk — save first.
- **`k6 x agent` fails on k6 v1.x.** It needs **k6 v2.0+**.
- **`k6` not found inside tasks.** The task uses your PATH; if `k6 version` fails in a terminal it will fail in the task ([Installing k6](/k6-setup/installing-k6.md)).
- **Trusting AI output blindly.** Validate and read every generated script before running it against a real system.
- **Committing tokens.** Keep `K6_CLOUD_TOKEN` in an environment variable, not in `settings.json` or the repo.

## Key takeaways

- The **official k6 VS Code extension** (`k6.k6`) runs the current file locally or in Grafana Cloud, but is **unmaintained since 2023**.
- It is **not available on Open VSX**, which Cursor uses — so in Cursor rely on **tasks**, the terminal and **`@types/k6`**.
- A **`.vscode/tasks.json`** gives a “run current file” action in **both** editors with no extension.
- **`k6 x agent init cursor|vscode-copilot`** (k6 v2.0+) connects an AI assistant to the **k6 MCP server** so it can validate, run and write scripts.
- IntelliSense with **`@types/k6`** is the docs' recommended editor setup for both.

## Further reading

- [Grafana k6 — Configure your code editor](https://grafana.com/docs/k6/latest/set-up/configure-your-code-editor/)
- [Grafana k6 — Configure your AI assistant](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/)
- [Grafana k6 — Bootstrap your editor with k6 x agent](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/bootstrap-with-k6-x-agent/)
- [k6 for Visual Studio Code — Marketplace](https://marketplace.visualstudio.com/items?itemName=k6.k6)
- [Cursor — Extensions](https://cursor.com/help/customization/extensions)
- [Debugging k6 Scripts](/k6-setup/debugging-k6-scripts.md)
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)
