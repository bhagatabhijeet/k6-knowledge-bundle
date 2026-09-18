---
type: Concept
title: What Is Performance Testing?
description: >
  Performance testing is a non-functional discipline that validates how an
  application behaves under expected and extreme traffic conditions.
tags:
  - performance-testing
  - fundamentals
  - load-testing
  - stress-testing
  - soak-testing
status: stable
generated:
  by: human:bhagatabhijeet
  at: 2026-09-18T00:00:00Z
verified:
  - by: human:bhagatabhijeet
    at: 2026-09-18T00:00:00Z
---

## What it is

Performance testing is a **non-functional** testing discipline. Where functional testing
asks "does the application do the right thing?", performance testing asks "how does the
application behave when it is under load?"

The goal is to push the system with a realistic — or deliberately extreme — number of
concurrent users and observe how the server responds, how the application scales, and how
reliably it loads components and returns results.

Performance testing is a broad umbrella term. Beneath it sit several distinct testing
types — load testing, stress testing, soak testing, and others — each designed to answer
a different question about the system's behaviour. These types are covered in detail in
subsequent concepts.

## Why it matters

By the time real users encounter failures in production, the damage is already done.
Performance testing lets you discover those failure modes in a controlled environment —
before the application goes live — so that capacity, scalability, and reliability problems
can be fixed on your schedule, not the user's.

## How it works

A performance test works by simulating a number of virtual users (VUs) that make requests
to the application simultaneously. The test tool records how the system responds:

- **Response times** — how long does the server take to reply?
- **Error rates** — what percentage of requests fail?
- **Throughput** — how many requests per second can the system handle?
- **Resource utilisation** — how does CPU, memory, and network behave under load?

The test is repeated under different traffic profiles (normal load, peak load, sustained
load) to build a complete picture of the system's performance envelope.

## Common pitfalls

- **Testing too late.** Performance testing is most valuable when it is part of the
  development cycle, not an afterthought before release.
- **Confusing testing types.** "Load test" is often used as a synonym for all performance
  testing, but load, stress, and soak tests answer different questions. Using the right
  type for the right question matters.
- **Ignoring think time.** Real users pause between actions. Virtual users that fire
  requests with no delay produce unrealistically high load and misleading results.

## Key takeaways

- Performance testing validates how an application behaves under traffic — it is
  non-functional by nature.
- It is an umbrella term covering load testing, stress testing, soak testing, and more.
- The objective is to surface capacity and reliability problems before real users do.

## Further reading

- [k6 Documentation — What is performance testing?](https://grafana.com/docs/k6/latest/)
- [What Is Performance Testing?](/introduction-to-performance-testing/what-is-performance-testing.md)
- [What Is k6?](/introduction-to-performance-testing/what-is-k6.md)
