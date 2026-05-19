# Overview

## What this is

MiniApp Template is a self-hosted starter web application. You install it on
your own computer or server (no third-party hosting required), turn it on,
configure sign-in, and you have a working app with users, authentication,
AI-safety guardrails, and accessibility baked in. It's designed for schools,
small teams, and anyone who wants a safe, auditable foundation to build on.

## What you can do with it today (out of the box)

- Sign-in with Google accounts (works with Google Workspace, including school
  accounts) and/or email one-time codes
- A protected dashboard area that only signed-in users can reach
- Built-in AI safety guardrails for any AI features you add — rate limits,
  prompt-injection protection, PII redaction, output filtering, content
  moderation, and token budgets (see [docs/ai-safety.md](ai-safety.md))
- Dark/light mode with a keyboard shortcut
- AAA accessibility (APCA contrast, keyboard navigation, screen-reader support)
- A SQLite database that lives entirely on your machine
- Installs in three commands; runs in a Docker container so it doesn't touch
  the rest of your system

## What you can build on top of it

- **Classroom companion app.** Teachers create lesson plans and an AI
  assistant helps draft activities, with safety filters and PII redaction on
  every request.
- **Small-team internal tool.** Sign in with a Google Workspace domain, add
  role-based access, and ship a private app for a department or club.
- **Reading-feedback service for students.** Students submit short writing
  samples and receive safe, moderated AI summaries and prompts.
- **Back-office data entry app.** A no-frills internal form-and-list tool
  with audit-friendly defaults and a single-file database.

## What this is NOT

- **Not a multi-tenant SaaS.** One container per organisation; tenants are
  not isolated inside a shared instance.
- **Not a hosted product.** You run it yourself on your own hardware or in
  your own cloud account.
- **Not a moderation API.** The bundled content-safety component is a
  baseline. Serious deployments should wire in an external moderation API —
  we document how in [docs/ai-safety.md](ai-safety.md).
- **Not a substitute for professional security review.** Treat this as a
  solid starting point, not a finished, certified system.

## How it's architected (one paragraph)

The app is a Next.js 16 application using the App Router and React Server
Components, with authentication handled by NextAuth (Google OAuth and Resend
email OTP). Application data is stored in a single SQLite file. AI-powered
routes pass through an AI safety middleware pipeline that handles rate
limiting, input sanitisation, PII redaction, output filtering, and token
budgets. Everything ships as a single Docker image — one process, one port,
one volume. See [docs/architecture.md](architecture.md) for the deep dive.

## What auditors and IT need to know

| Topic | Detail |
| --- | --- |
| Data residency | All app data lives in a single SQLite file inside the Docker volume. |
| Network surface | One HTTP port (default `11000`). |
| Secrets | `AUTH_SECRET` auto-generated at first boot; provider secrets in `/app/data/.env` (mode 600). |
| AI provider | None bundled. You bring your own key if you add AI features. |
| Logs | stdout/stderr only — capture with your existing Docker logging driver. |
| Authentication | NextAuth v5 with Google OAuth and/or Resend email OTP; the setup endpoint is gated by a one-time token printed at first boot. |
| Accessibility | APCA AAA 3.0 contrast; keyboard navigation; live regions for screen readers. |

## Where to go next

- **Install and run it:** [the README](../README.md)
- **Develop on it:** [docs/getting-started.md](getting-started.md)
- **Architecture:** [docs/architecture.md](architecture.md)
- **AI safety reference:** [docs/ai-safety.md](ai-safety.md)
