---
type: Guide
title: Setting Up the Editor
description: >
  Why k6 scripts are written in JavaScript (with optional TypeScript), how to install
  VS Code or Cursor, and how to add k6 type definitions for autocomplete and inline docs.
tags:
  - k6
  - vscode
  - cursor
  - javascript
  - typescript
  - intellisense
  - setup
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

k6 has no GUI. Your tests are **code files** — so besides the k6 binary you need a **code
editor** to write them in. This bundle supports two, and every step works in both:

| Editor | What it is | Cost |
|---|---|---|
| **Visual Studio Code (VS Code)** | Microsoft's free, open-source editor with excellent JavaScript/TypeScript support built in | Free |
| **Cursor** | An AI-first editor **built on VS Code** — same layout, shortcuts and terminal, with built-in AI chat and code generation | Free tier + paid plans |

![VS Code and Cursor compared: what is different and what is identical for k6 work](/assets/images/editor-vscode-cursor.svg)

Both run on Windows, macOS and Linux. Because Cursor is built on VS Code, the k6 setup,
IntelliSense, integrated terminal and `@types/k6` all behave the same. Pick whichever you prefer.

## Why it matters

A good editor setup turns k6 scripting from guesswork into guided typing: autocomplete for
`http.get(...)`, hover-docs for every option, and red underlines for typos *before* you run
a 30-minute test and find out it never started.

## How it works

### Which language: JavaScript or TypeScript?

k6 scripts are written in **JavaScript** — all official documentation and every example in
this bundle uses it.

```
   JavaScript (.js)  ───────────────►  runs on k6
   TypeScript (.ts)  ── esbuild strips types ─►  JavaScript  ──►  runs on k6
```

**TypeScript** isn't a different language: it is JavaScript plus optional type annotations.
k6's JavaScript engine only understands JavaScript, so `.ts` files must be transpiled first.
Historically you did that yourself (webpack, esbuild); the k6 docs now state that k6 uses
**esbuild** to transpile every file with a `.ts` extension. That step **strips the type
annotations but does not type-check** — your editor does the checking. This bundle starts with
JavaScript, and converting to TypeScript later is straightforward.

> **k6 is not Node.js** (see [How k6 Is Built](/k6-architecture/how-k6-is-built.md)). k6 runs your script in its own embedded JavaScript engine. You
> can't `require('fs')` or install arbitrary npm packages into a test. You import k6's own
> modules — `k6`, `k6/http`, `k6/metrics`. Node isn't needed to *run* a
> test, but it is what organises your project (`package.json`, dependencies, IntelliSense) —
> see [Creating a New k6 Project](/k6-setup/creating-a-k6-project.md).

### Install your editor

**VS Code**

1. Go to [code.visualstudio.com](https://code.visualstudio.com) and click **Download** — the
   site detects your operating system.
2. Run the installer (Windows), or drag the app into Applications (macOS).
3. Open it. No `PATH` setup is needed.

**Cursor**

1. Go to [cursor.com](https://cursor.com) and download the installer for your operating system.
2. Run the installer (Windows), or drag the app into Applications (macOS).
3. Open it. On first launch Cursor offers to import your VS Code settings and extensions —
   accept if you're switching from VS Code, skip otherwise. Signing in is only needed for the AI features.

That's all that's required to start writing k6 scripts.

### Add k6 IntelliSense (recommended)

k6 modules (`k6/http`, `k6/metrics`, …) are built in to k6, so your editor doesn't know what
they contain. Installing the type definitions fixes that:

```bash
# in your project folder (needs Node.js installed, for npm)
npm init -y
npm install --save-dev @types/k6
```

This gives you **type definitions only** — it does *not* install the k6 runner and does not
change how your script executes. What you gain:

| Without `@types/k6` | With `@types/k6` |
|---|---|
| No suggestions for `http.` | Autocomplete: `get`, `post`, `put`, `batch`… |
| No hint about `options` shape | Hover-docs for `stages`, `thresholds`, `scenarios` |
| Typos found only at run time | Typos underlined immediately |

Verify it: open [hello-k6.js](/assets/code/k6-setup/hello-k6.js) in your editor, hover over
`http.get`, and a signature tooltip should appear. The full walk-through, with screenshots-style diagrams and
troubleshooting, is in [Enabling k6 IntelliSense in Your Editor](/k6-configuration-options-in-code-editor/enable-k6-intellisense.md).

### Suggested project layout (same in both editors)

```
  my-k6-project/
  ├── package.json            ← created by npm init, holds @types/k6
  ├── node_modules/           ← @types/k6 lives here (don't commit this)
  ├── .gitignore              ← contains: node_modules/
  └── scripts/
      ├── smoke-test.js
      ├── load-test.js
      └── ...
```

Run scripts from the editor's built-in terminal (**Ctrl+`** in both VS Code and Cursor) — it opens in
your project folder, so `k6 run scripts/smoke-test.js` just works.

### Optional: editor extensions

Nothing beyond `@types/k6` is required. Two conveniences many people add:

- **ESLint** — flags mistakes in your scripts as you type.
- **Prettier** — keeps formatting consistent across a team.

Both editors have an Extensions panel (**Ctrl+Shift+X**). Cursor uses the **Open VSX** registry rather than Microsoft's
marketplace, so some VS Code extensions (including the official k6 one) aren't listed there — see
[Editor Extensions & AI Assistants for k6](/k6-setup/k6-editor-extensions.md) for what to use instead.

## Common pitfalls

- **Expecting `npm install k6` to install the runner.** It doesn't. Install the k6 binary
  ([Installing k6](/k6-setup/installing-k6.md)); use npm only for `@types/k6`.
- **Skipping the type definitions, then thinking "IntelliSense is broken."** Without
  `@types/k6` the editor can't know k6's built-in modules.
- **Writing Node.js code in a script.** `require('fs')`, `process.env`, and most npm
  libraries don't exist in k6. Use k6's `__ENV` for environment variables and its own modules.
- **Committing `node_modules/`.** Add it to `.gitignore`; teammates re-create it with `npm install`.
- **Opening the wrong folder.** Open the *project folder* in VS Code or Cursor (File → Open Folder), not a
  single file, so the terminal and IntelliSense see `package.json`.

## Key takeaways

- k6 tests are **code**, so you need an editor; use **VS Code** or **Cursor** (built on VS Code — the workflow is identical).
- Scripts are **JavaScript**; TypeScript is an optional layer that k6 transpiles with esbuild (types stripped, not checked).
- k6 is **not Node.js** — it has its own runtime and its own built-in modules.
- `npm install --save-dev @types/k6` adds autocomplete and hover-docs without changing
  how tests run.
- With k6 and your editor installed, you're ready to create a project and write your first script.

## Further reading

- [Visual Studio Code — Download](https://code.visualstudio.com)
- [Cursor — Download](https://cursor.com)
- [Grafana k6 — Using TypeScript](https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/)
- [Grafana k6 — Modules](https://grafana.com/docs/k6/latest/using-k6/modules/)
- [Installing k6](/k6-setup/installing-k6.md)
