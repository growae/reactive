---
'@growae/create-reactive': patch
---

Scaffold the `uuid` advisory override per chosen package manager instead of shipping one static key.

Each generated project now gets only the mechanism its own package manager reads: `overrides` in `package.json` for npm and bun, a `pnpm-workspace.yaml` override for pnpm (both 10 and 11 — pnpm 11 dropped the `pnpm.overrides` package.json field pnpm 10 used to read), and a `resolutions` path selector for yarn. Previously only npm and pnpm 10 were protected; pnpm 11 silently stopped reading the old key, and yarn had no working key at all because pnpm and yarn's selector grammars collide within a single field. Yarn users now get the override back.
