---
title: k6 Architecture
description: >
  What k6 is made of and how it runs your script — the Go engine, the embedded
  Sobek JavaScript VM, per-VU runtimes, modules and extensions, and the
  four-stage test lifecycle.
---

## Concepts

- [How k6 Is Built — Go and the Sobek JavaScript Engine](/k6-architecture/how-k6-is-built.md) — k6 is a Go program embedding a JavaScript VM; why it isn't Node.js, how VUs map to runtimes, modules, TypeScript and extensions
- [The k6 Test Lifecycle](/k6-architecture/k6-test-lifecycle.md) — init, setup, VU code and teardown: what runs how often and what each stage may do
