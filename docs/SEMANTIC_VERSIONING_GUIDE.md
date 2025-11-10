SemVer Guide
============

Overview
--------
- Semantic Versioning (SemVer) follows `MAJOR.MINOR.PATCH`.
- Increment **MAJOR** for breaking changes that are not backward compatible.
- Increment **MINOR** for new, backward-compatible features.
- Increment **PATCH** for backward-compatible bug fixes.
- Pre-release tags (e.g. `-alpha`, `-beta`) mark unstable builds before the final release; build metadata (`+build.5`) adds informational context without changing ordering.

Current Versioning Scheme
-------------------------
- The app is currently pre-release and tagged as `0.1.0-alpha`.
- `0` indicates the product is not yet production-stable.
- `1` reflects the first milestone of functionality in early development.
- `alpha` communicates limited testing/instability; move to `beta` when confidence increases but stability is not final.

Source Of Truth
---------------
- Maintain the canonical version string in `package.json` (`"version": "0.1.0-alpha"`).
- Mirror the same value in `.env` as `APP_VERSION=0.1.0-alpha` only when overriding a build; the Expo config reads `.env` first and falls back to `package.json`.
- In `app.config.js`, Expo loads dotenv, derives `version` from `process.env.APP_VERSION ?? pkg.version`, and exposes `extra.appVersion` so the runtime can read the same value.
- UI surfaces (e.g. `app/(jobs)/profile.tsx`) consume the runtime value via `expo-constants`, ensuring what users see matches the release.

Releasing & Tagging
-------------------
- Bump the version when you intend to distribute a new build (TestFlight, Play internal testing, QA, production).
- Typical flow: update `package.json`, build, commit, tag (e.g. `git tag v0.1.0-alpha`), and push `git push origin v0.1.0-alpha`.
- Tags are immutable pointers to a specific commit; they are not branches. They mark release points for changelogs, deployment pipelines, or historical reference.

When To Increment
-----------------
- **Everyday development:** no bump required for normal commits; keep the existing version until it’s time to ship a build.
- **Pre-release cadence:** decide on the bump when packaging a release. Example decisions:
  - Bug fixes only → `0.1.1-alpha`.
  - Backward-compatible feature additions → `0.2.0-alpha` (or switch to `-beta` if quality improved).
  - Breaking changes (post-1.0) → increment MAJOR.
- Update the pre-release tag as stability improves (`-alpha` → `-beta` → final release).

Best Practices
--------------
- Keep `package.json` the single source of truth; let scripts/configuration derive from it.
- Document release notes tagged with the exact version string (GitHub releases work well).
- Automate version bumps when feasible (`npm version`, Changesets, or custom scripts) to avoid manual mismatches.

