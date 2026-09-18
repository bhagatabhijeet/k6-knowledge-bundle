---
title: Introduction to Performance Testing
description: >
  What performance testing is, where k6 fits in the ecosystem, and a
  road-map of everything covered in this bundle — from first test to
  CI/CD-integrated cloud load runs.
---

## Concepts

- [What Is Performance Testing?](/introduction-to-performance-testing/what-is-performance-testing.md) — defines performance testing, explains the umbrella term, and lists the key testing types
- [What Is k6?](/introduction-to-performance-testing/what-is-k6.md) — introduces Grafana k6, how it compares to JMeter and LoadRunner, and a preview of the full roadmap of this bundle
- [Smoke Testing](/introduction-to-performance-testing/smoke-testing.md) — the minimal sanity-check load run you always do first on a new build
- [Load Testing](/introduction-to-performance-testing/load-testing.md) — validating system performance under normal and peak concurrent user counts; where non-functional validation truly begins
- [Stress Testing](/introduction-to-performance-testing/stress-testing.md) — pushing beyond normal capacity to find the breaking point, the failure mode, and how the system recovers
- [Spike Testing](/introduction-to-performance-testing/spike-testing.md) — a sudden, extreme surge followed by a return to normal; tests survival and recovery, with `stages` and `ramping-arrival-rate` k6 scripts
- [Soak Testing](/introduction-to-performance-testing/soak-testing.md) — steady, typical load for hours to expose leaks and slow decay; per-hour tagging and sub-metric thresholds in k6
