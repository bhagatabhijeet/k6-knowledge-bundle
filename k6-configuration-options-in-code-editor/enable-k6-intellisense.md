---
type: Guide
title: Enabling k6 IntelliSense in Your Editor
description: >
  Install the @types/k6 type definitions in your Node project so VS Code or Cursor
  can auto-complete k6 functions, add imports for you, and show k6 documentation as
  you type — and why this needs a package.json.
tags:
  - k6
  - intellisense
  - types-k6
  - npm
  - vscode
  - cursor
  - package-json
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

**IntelliSense** is the family of editor features that make writing code comfortable: **intelligent
code completion** and **quick access to documentation**. For k6, the Grafana docs list three notable
features:

- **Auto-completion** of k6 functions, methods and classes.
- **Auto-imports** of k6 modules.
- **Access to k6 documentation** while writing and hovering.

![The three IntelliSense features for k6: auto-completion, auto-imports and hover documentation, compared with an editor without k6 types](/assets/images/k6-intellisense-features.svg)

k6's modules (`k6/http`, `k6`, `k6/metrics`, …) are built into the k6 binary, so your editor has no idea what
they contain — until you give it a description. That description is a package of **TypeScript type definitions**
called **`@types/k6`**, and installing it is a two-command job.

## Why it matters

Before you write your first script you want the editor to help you: suggest `http.get` when you type
`http.`, add `import { sleep } from 'k6'` when you use `sleep`, and show what each function does when you
hover. Without it you have to remember every name and spelling, and mistakes only show up when you *run*
the script.

It also explains **why we made the project a Node project**. The type definitions are an **npm package**, and
npm can only add a dependency to a folder that has a **`package.json`**. So the Node project you created with
`npm init` is not just tidiness — it is what makes this feature possible. (k6 itself still doesn't need Node.js to
run; see [Creating a New k6 Project](/k6-setup/creating-a-k6-project.md).)

## How it works — step by step

Do this in the project folder you created earlier (for example `k6-load`), from the editor's built-in terminal.

### Step 1 — Make sure the folder is a Node project

```bash
npm init --yes
```

This creates `package.json` if it doesn't exist yet. If you already created the project (see [Creating a New k6 Project](/k6-setup/creating-a-k6-project.md)), skip it —
running it again is harmless.

### Step 2 — Install the k6 type definitions

```bash
npm install --save-dev @types/k6
```

`--save-dev` marks it as a **development helper** — something your editor needs while you write code, but that is
not needed to run the test. Real output:

```
added 1 package, and audited 2 packages in 551ms
found 0 vulnerabilities
```

![The two npm commands, the package.json before and after, and the files that appear: package-lock.json and node_modules/@types/k6](/assets/images/k6-types-install-flow.svg)

### Step 3 — See what changed

Three things changed in your project:

| What | Where | Meaning |
|---|---|---|
| A **new entry** in `package.json` | `"devDependencies": { "@types/k6": "^2.2.1" }` (your version number may differ) | The project now *declares* that it uses these type definitions |
| A **`node_modules/`** folder | `node_modules/@types/k6/…` | The downloaded definitions — `.d.ts` files describing `http`, `metrics`, `check`, `sleep` and the rest |
| A **`package-lock.json`** file | project root | Pins the exact versions installed, so everyone gets the same ones |

Open `package.json` and you will see the new block:

```json
"devDependencies": {
  "@types/k6": "^2.2.1"
}
```

Every external dependency of a Node project is recorded in this file. That is the reason it is called the
“heart” of the project.

### Step 4 — Check that it works

Create a new file (or use the [first test](/k6-configuration-options-in-code-editor/writing-your-first-k6-test.md)), then:

1. Type `import http from 'k6/http';` — the editor should recognise the module.
2. On a new line, type `http.` — a list including `get`, `post`, `put`, `patch`, `del`, `batch`, `request` should pop up.
3. Hover over a function name — a tooltip such as *“Make GET request. @param url — Request URL.”* appears.

If nothing happens, run **Reload Window** from the Command Palette (**Ctrl+Shift+P**) so the editor re-reads
`node_modules`, and make sure you opened the project **folder** (not a single file) in the editor.

## When the install misbehaves

Sometimes the install fails or the editor complains that it *failed to save* `package.json` — for example
because the file is open in the editor or a stale lock is left over from an earlier attempt. The reliable fix is a clean reinstall:

```bash
# macOS / Linux / Git Bash
rm -rf node_modules package-lock.json

# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
```

Then close any open `package.json` tab and run `npm install --save-dev @types/k6` again. It takes seconds, and
afterwards the `devDependencies` entry and the `node_modules` folder are back.

## Other editors

The k6 docs say the same setup works in **Visual Studio Code** and **IntelliJ IDEA Ultimate**. **Cursor**, being built
on VS Code, behaves exactly like VS Code here. TypeScript files (`.ts`) benefit from the same definitions.

## Common pitfalls

- **Running `npm install` in the wrong folder.** It installs into whatever folder the terminal is in. Check you are in
  your project (`pwd` on macOS/Linux, `cd` on Windows).
- **No `package.json`.** npm cannot save a dependency without one — run `npm init --yes` first.
- **Expecting `@types/k6` to run k6.** It adds editor help only; it does not install or change the k6 binary.
- **Opening a single file instead of the folder.** The editor then never sees `node_modules`, so no IntelliSense.
- **Committing `node_modules/`.** Add it to `.gitignore`; teammates recreate it with `npm install`.
- **Editing `package.json` while installing.** Close it during the install to avoid save conflicts.

## Key takeaways

- IntelliSense = **auto-completion + auto-imports + inline docs** for k6.
- It is enabled by installing the **`@types/k6`** npm package: `npm init --yes`, then
  `npm install --save-dev @types/k6`.
- That requires a **Node project (`package.json`)** — the real reason we create one.
- Installing adds a **`devDependencies`** entry, a **`node_modules/`** folder and a **`package-lock.json`**.
- If the install fails, delete `node_modules` and `package-lock.json` and reinstall.

## Further reading

- [Grafana k6 — Configure your code editor](https://grafana.com/docs/k6/latest/set-up/configure-your-code-editor/)
- [`@types/k6` on npm](https://www.npmjs.com/package/@types/k6)
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)
- [Creating a New k6 Project in VS Code / Cursor](/k6-setup/creating-a-k6-project.md)
- [Writing and Running Your First k6 Test](/k6-configuration-options-in-code-editor/writing-your-first-k6-test.md)
