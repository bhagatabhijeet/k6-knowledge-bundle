---
type: Guide
title: Installing k6
description: >
  How to install the open-source k6 binary on macOS, Windows, Linux or Docker,
  make sure it is on your PATH, and verify the installation.
tags:
  - k6
  - installation
  - setup
  - homebrew
  - windows
  - docker
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

k6 ships as **a single standalone binary** — there is no server to run and no runtime to
install first. Installing k6 means putting that binary somewhere on your system and making
sure your terminal can find it by typing `k6`.

## Why it matters

Everything else in this bundle — running smoke, load, stress, spike and soak tests —
starts with the `k6` command. If it isn't installed correctly *and* on your `PATH`, every
later step fails with "command not found". Five minutes of setup here saves an hour of
confusion later.

## Where k6 comes from

k6 is developed and owned by **Grafana Labs**. You will see two sites:

| Site | What it is |
|---|---|
| **grafana.com/docs/k6** | The official documentation for **open-source k6** — installation, every feature, API reference. This is the site you'll use most. |
| **k6.io** | The original k6 website. It now leads into Grafana's k6 pages, with the cloud and enterprise offerings. |

Both are official and trustworthy. This bundle teaches **open-source k6** exclusively:
free to use, and everything you learn transfers to the paid cloud version if you later need it.

## How it works — install by platform

![Five ways to install k6 — macOS, Windows, Linux, Docker and manual — all ending in k6 version](/assets/images/k6-install-paths.svg)

The same choices as a text tree:

```
                        Which operating system?
                                  │
        ┌───────────────┬─────────┼───────────┬──────────────┐
        ▼               ▼         ▼           ▼              ▼
     macOS           Windows    Linux       Docker      Any OS (manual)
   brew install    .msi  /     apt / dnf   docker run   GitHub Releases
       k6        winget / choco  (see docs) grafana/k6     .zip / .tar.gz
   PATH: auto     PATH: auto*   PATH: auto  no install   PATH: YOU set it
                                                       (* msi, winget, choco)
```

### macOS — Homebrew

```bash
brew install k6
```

Homebrew places `k6` on your `PATH` for you. If you don't have Homebrew yet, install it
first from the official site, [brew.sh](https://brew.sh), by pasting the one-line install
command shown there into a terminal.

### Windows

Three installer options put k6 on your `PATH` automatically. Pick whichever you prefer:

```powershell
# Option 1 — Windows Package Manager
winget install k6 --source winget

# Option 2 — Chocolatey
choco install k6
```

**Option 3 — the official `.msi` installer.** Download the latest `.msi` from the k6 install
page or the GitHub Releases page, double-click it, and click *Next* through the wizard. It
tells you where k6 is installed and registers it on your `PATH`.

> **Recommendation for Windows:** use the `.msi` (or winget/choco). They handle the `PATH`
> for you. Only use the `.zip` route below if you can't install software.

### Linux

k6 provides `apt` (Debian/Ubuntu) and `dnf`/`yum` (Fedora/RHEL) repositories. The
repository setup steps change over time, so follow the current instructions on the
[k6 installation page](https://grafana.com/docs/k6/latest/set-up/install-k6/) rather than
a copy that may go stale.

### Docker — no install at all

If you have Docker, you don't need to install k6 itself:

```bash
docker run --rm -i grafana/k6 run - <hello-k6.js
```

The script is piped in through standard input. This form is common in CI pipelines, and it
guarantees everyone runs the same k6 version. (For scripts that import local files, mount
the folder as a volume — covered later.)

### Manual install — the binary from GitHub Releases

Every k6 release publishes ready-made binaries on the
[GitHub releases page](https://github.com/grafana/k6/releases) for every platform: Windows
`.zip`, macOS, Linux `.tar.gz`, and the same `.msi` mentioned above.

1. Download the archive for your OS and CPU architecture and extract it.
2. Inside is the `k6` executable (`k6.exe` on Windows).
3. **Add the folder containing that executable to your `PATH`.** This is the step people
   forget — see below.

## Setting the PATH manually (zip / binary installs only)

`PATH` is the list of folders your terminal searches when you type a command. If k6's
folder isn't in it, the terminal says *"k6 is not recognized"* even though the file exists.

**Windows (GUI):** *Start → "Edit the system environment variables" → Environment Variables
→ select `Path` → Edit → New →* paste the **folder** that contains `k6.exe` *→ OK*.
Then **open a new terminal** — existing terminals don't see the change.

**Windows (PowerShell, current user):**

```powershell
$k6Dir = "C:\tools\k6"   # the folder that contains k6.exe
[Environment]::SetEnvironmentVariable(
  "Path",
  [Environment]::GetEnvironmentVariable("Path", "User") + ";$k6Dir",
  "User")
```

**macOS / Linux (manual binary):**

```bash
sudo mv k6 /usr/local/bin/      # a folder that is already on PATH
```

Add the *folder*, not the `.exe` file itself — a path ending in `k6.exe` will not work.

> If you installed with Homebrew, the `.msi`, winget or Chocolatey, **skip this section** —
> the installer already did it.

## Verify the installation

Open a **new** terminal and run:

```bash
k6 version
```

You should see something like `k6 v2.x.x (go1.x, windows/amd64)` (v2 is the current major version).
Any version line means k6 is installed and found:

![Terminal running k6 version, printing k6.exe v1.7.1 with commit, Go version and OS/CPU, each part explained by colour](/assets/images/k6-version-success.svg)

Running plain `k6` (no arguments) prints the Grafana k6 banner and the list of commands — another way to
confirm k6 is detected globally:

![Terminal running k6 with no arguments: the Grafana k6 banner and the command list](/assets/images/k6-banner-help.svg)

### k6 version not working?

If you see an error instead of a version line, k6 is either not installed or not on your `PATH`. This is what
it looks like, and the three-step fix:

![Terminal errors when k6 is not on the PATH — not recognized on Windows, command not found on macOS and Linux — with a three-step fix](/assets/images/k6-version-not-found.svg)

### Run your first script

With a version line showing, run the smallest
possible test to confirm k6 can execute a script and reach the network:

```bash
k6 run assets/code/k6-setup/hello-k6.js
```

```js
// assets/code/k6-setup/hello-k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

[Source](/assets/code/k6-setup/hello-k6.js)

A green `✓ status is 200` line means the setup is complete. This is what a successful run looks like:

![Terminal output of k6 run hello-k6.js with the passing check, zero failed requests and one completed iteration highlighted](/assets/images/k6-run-hello-success.svg)

## Common pitfalls

- **"k6 is not recognized" / "command not found".** The `PATH` is wrong or the terminal
  is stale. Check the folder is on `PATH` and open a *new* terminal.
- **Adding the `.exe` instead of its folder to `PATH`.** The entry must be the directory.
- **Downloading the wrong architecture.** Apple Silicon Macs need `arm64`; most Windows
  and Intel machines need `amd64`.
- **Confusing k6 with an npm package.** `npm install k6` does **not** install the k6
  runner. k6 is a Go binary; the npm `@types/k6` package only provides editor typings.
- **Following an out-of-date blog post.** Install steps change. When in doubt, the
  official k6 docs are the source of truth.

## Key takeaways

- k6 is a **single binary from Grafana Labs**; this bundle uses the free **open-source** version.
- **macOS:** `brew install k6`. **Windows:** `.msi`, `winget install k6`, or `choco install k6`.
  **Docker:** `docker run grafana/k6`.
- Package managers and installers set the `PATH` for you; a manual `.zip`/binary install
  means **you** must add the containing folder to `PATH`.
- Confirm with `k6 version`, then run `hello-k6.js`.

## Further reading

- [Grafana k6 — Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)
- [Setting Up k6 Studio](/k6-setup/k6-studio.md) — the optional record-and-generate desktop app
- [k6 releases on GitHub](https://github.com/grafana/k6/releases)
- [Setting Up the Editor](/k6-setup/setting-up-the-editor.md)
- [What Is k6?](/introduction-to-performance-testing/what-is-k6.md)
