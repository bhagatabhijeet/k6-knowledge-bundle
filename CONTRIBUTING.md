# Contributing to the k6 Knowledge Bundle

This bundle follows [OKF v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).

## Frontmatter schema

Every concept file (any `.md` that is not a reserved filename) **must** include YAML frontmatter
with at minimum a `type` field.

```yaml
---
type: Concept          # REQUIRED — Concept | Guide | Reference | Exercise | Overview
title: Human-readable title
description: One-sentence summary of what this concept covers.
tags:
  - k6
  - performance-testing
status: draft          # draft | stable | deprecated
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---
```

## Reserved filenames

The following files are **not** concept files and must not carry a `type` field:

| File | Purpose |
|---|---|
| `index.md` | Bundle or topic table of contents |
| `log.md` | Chronological changelog |

## Concept body structure

```markdown
## What it is
Plain-language definition.

## Why it matters
Consequences of not understanding this concept.

## How it works
Explanation with a minimal code example where relevant.

## Common pitfalls
- Pitfall and how to recognise it.

## Key takeaways
- Takeaway.

## Further reading
- [Link to authoritative source]
```

## Naming conventions

- **Directories:** kebab-case (`introduction-to-performance-testing/`)
- **Concept files:** kebab-case slugs (`what-is-k6.md`)
- **Code files:** kebab-case, descriptive (`first-load-test.js`)
- **Images:** `<slug>.<ext>`, SVG preferred for diagrams

## Cross-linking

Use absolute bundle-relative paths:

```markdown
[What Is k6?](/introduction-to-performance-testing/what-is-k6.md)
```

## Assets

- `assets/images/` — diagrams and screenshots referenced from concepts
- `assets/code/` — runnable code files, mirroring topic structure (e.g. `assets/code/introduction-to-performance-testing/`)

## Commit conventions

- `feat(<topic>): add <concept-slug>` — new concept
- `fix(<topic>): correct <concept-slug>` — correction
- `chore: <description>` — maintenance (structure, log updates, etc.)
