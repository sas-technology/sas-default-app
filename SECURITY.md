# Security Policy

## Reporting a vulnerability

Email **[security@nyuchi.com](mailto:security@nyuchi.com)** (the
maintainer) with:

- A clear description of the issue
- Steps to reproduce, if possible
- Affected versions / commits
- Your suggested remediation if you have one

We aim to acknowledge within **2 business days** and to ship a fix or
workaround within **30 days** for high-severity issues.

Please do NOT open a public GitHub issue for suspected vulnerabilities.
Once an issue is fixed and released we'll credit you in the changelog
unless you'd prefer to stay anonymous.

## Supported versions

This is a template, not a library. Each downstream project is responsible
for keeping their fork up to date. We publish notable security fixes in
[CHANGELOG.md](CHANGELOG.md).

## What's in scope

- The app code under `apps/web/`, `apps/sheets/`
- The shared packages under `packages/`
- The Docker build (`Dockerfile`, `docker-entrypoint.sh`)
- The CI workflows under `.github/workflows/`

## What's out of scope

- Third-party dependencies (report to the upstream maintainer; we accept
  PRs that bump vulnerable deps)
- Infrastructure operated by adopters (Vercel, Netlify, Cloudflare, Turso,
  Google Apps Script accounts)
- Misconfiguration on your own deployment

See [docs/security.md](docs/security.md) for the security architecture and
controls.
