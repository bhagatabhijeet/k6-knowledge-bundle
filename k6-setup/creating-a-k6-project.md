---
type: Guide
title: Creating a New k6 Project in VS Code / Cursor
description: >
  Step-by-step: why a k6 project is still a Node.js project, installing Node.js,
  creating the project folder with npm init, opening it in VS Code or Cursor,
  and confirming k6 is detected — ready for the first script.
tags:
  - k6
  - setup
  - vscode
  - cursor
  - nodejs
  - npm
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

A k6 project is a **normal folder that also happens to be a Node.js project** — a folder
with a `package.json` in it. Your test scripts live inside it, and `k6 run` executes them.

This guide takes you from an empty disk to a folder that is ready for your first script,
in either **VS Code** or **Cursor** (an AI-first editor built on VS Code — every step below
is identical in both; only the command that opens the folder differs).

## Why it matters

There is an apparent contradiction worth understanding before you type anything:

```
  ┌──────────────────────────────┐        ┌───────────────────────────────┐
  │   RUNNING a test             │        │   BUILDING a test framework   │
  │                              │        │                               │
  │   k6  (a Go binary)          │        │   Node.js + npm               │
  │   • executes your JS/TS      │        │   • package.json              │
  │   • its own JS engine        │        │   • dependencies (@types/k6)  │
  │   • NOT Node.js              │        │   • scripts, tooling, linting │
  │                              │        │   • editor IntelliSense       │
  └──────────────────────────────┘        └───────────────────────────────┘
        needs only the k6 binary               needs Node.js on your machine
```

- **k6 is written in Go**, and the Go engine is what actually runs your script. Your tests
  are written in JavaScript (or TypeScript), but they are *not* run by Node.js — unlike
  Playwright or Cypress, which are built on Node.
- **You still want Node.js** because you won't stop at one standalone script. Real test
  suites grow into a *framework*: shared helpers, test data, several scripts, editor
  autocomplete, CI commands. The standard, well-supported way to organise a JavaScript
  project is a Node project — `package.json`, dependencies, npm scripts.

So: **k6 doesn't need Node.js to run; your project does, to be well organised.**

## How it works — step by step

### Step 1 — Install Node.js

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** (long-term support) installer.
2. Run it and accept the defaults. Node.js includes **npm**, the package manager.
3. Open a **new** terminal and verify:

```bash
node -v     # e.g. v22.x.x
npm -v      # e.g. 10.x.x
```

Both must print a version. If they don't, the terminal is stale (open a new one) or the
install didn't finish.

### Step 2 — Open a terminal

Open VS Code (or Cursor) and open its built-in terminal: **Terminal → New Terminal**, or
**Ctrl+`**. When you first land, the terminal opens in your home directory.

### Step 3 — Create the project folder

These commands are identical on Windows, macOS and Linux:

```bash
cd Documents              # go to a place you keep projects
mkdir k6-load             # make a directory called k6-load
cd k6-load                # move into it
```

> Choose a folder name without spaces. The name becomes your project name.

### Step 4 — Turn the folder into a Node project

```bash
npm init -y
```

`npm init` creates a `package.json`; the `-y` flag says "yes to all the default answers" so
there are no questions. Only the Node *skeleton* is created — no test code yet:

```json
{
  "name": "k6-load",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

(The exact fields vary slightly between npm versions.)

### Step 5 — Open the folder in your editor

The terminal created the folder, but the editor is not yet *looking at* it. Two options:

**From the menu:** *File → Open Folder…* → choose `Documents/k6-load` → *Open*.
(Trust the folder if prompted.)

**From the terminal** — from inside `k6-load`:

```bash
code .        # VS Code
cursor .      # Cursor
```

Now the Explorer panel shows your project with **`package.json`** in it. That file exists
because you ran `npm init -y` in *that folder* — it proves the folder is a Node project.

> If your Explorer is empty or has no `package.json`, you opened the wrong folder.
> Open the folder you created in Step 3, not its parent.

### Step 6 — Confirm k6 is detected

In the editor's terminal (which is now inside `k6-load`):

```bash
k6 version
```

Expected output like `k6.exe v1.x.x (go1.x, windows/amd64)`. Running plain `k6` prints the
Grafana k6 banner and the list of commands.

If the terminal says *"k6 is not recognized"* or *"command not found"*, k6 is installed
but not on your `PATH` — go back to [Installing k6](/k6-setup/installing-k6.md) and fix the
`PATH` (or re-run the `.msi` installer), then open a **new** terminal.

### Step 7 — Checklist

```
  ✅ node -v         prints a version
  ✅ npm -v          prints a version
  ✅ k6 version      prints a version
  ✅ Editor is open on the k6-load folder
  ✅ package.json is visible in the Explorer
```

All five ticked means the environment is ready. In the next step you'll write your first script
in this same `k6-load` folder.

## Optional — tidy the project now

Two small additions that pay off later. Neither is required to run k6.

**Add IntelliSense** (autocomplete for `http.get`, `stages`, `thresholds`):

```bash
npm install --save-dev @types/k6
```

Details in [Setting Up the Editor](/k6-setup/setting-up-the-editor.md).

**Ignore installed packages in Git:** create a `.gitignore` file containing:

```
node_modules/
```

**Wrap k6 commands in npm scripts** — a taste of why a Node project is useful. Edit the
`scripts` section of `package.json`:

```json
"scripts": {
  "smoke": "k6 run scripts/smoke-test.js",
  "load":  "k6 run scripts/load-test.js"
}
```

Then `npm run smoke` runs your smoke test — a short, memorable command that teammates and
CI pipelines can share. (npm merely launches the `k6` binary; the test still runs on k6's engine.)

## Common pitfalls

- **Thinking k6 needs Node.js to run.** It doesn't — the binary is self-contained. Node is for
  project structure and tooling. Don't try to install k6 with `npm install k6`.
- **Skipping Node because "k6 isn't Node".** You can run single scripts without it, but you'll
  lose IntelliSense, dependency management and npm scripts — and you'll have to retrofit them later.
- **Running `npm init -y` in the wrong folder.** It creates `package.json` in whatever folder
  the terminal is in. Check with `pwd` (macOS/Linux) or `cd` (Windows) before running it.
- **Forgetting to open the folder in the editor.** Creating a folder in the terminal doesn't
  make the editor show it — use *Open Folder* or `code .` / `cursor .`.
- **`code .` / `cursor .` "not recognized".** The editor's shell command isn't installed. Open the
  Command Palette (**Ctrl+Shift+P**) and run *"Shell Command: Install 'code' command in PATH"* in VS Code,
  or the equivalent *"Shell Command: Install 'cursor' command"* in Cursor. Then open a new terminal.
  Or skip the command entirely and use *File → Open Folder*.
- **A stale terminal.** After installing Node.js or k6, open a **new** terminal window before
  testing `node -v` / `k6 version`.

## Key takeaways

- k6's engine is written in **Go**, not Node.js — your JS/TS scripts run on k6's own runtime.
- We still install **Node.js** to give the project a proper structure: `package.json`,
  dependencies, IntelliSense and npm scripts.
- Setup is: **install Node.js → `mkdir k6-load` → `cd k6-load` → `npm init -y` → open the folder
  in VS Code/Cursor → `k6 version`.**
- VS Code and Cursor behave identically for this workflow.
- A ready environment shows a version for `node -v`, `npm -v` and `k6 version`, and a
  `package.json` in the Explorer.

## Further reading

- [Node.js — Download](https://nodejs.org)
- [npm — `npm init`](https://docs.npmjs.com/cli/commands/npm-init)
- [Grafana k6 — Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)
- [Installing k6](/k6-setup/installing-k6.md)
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)
