# @growae/create-reactive

## 0.0.6

### Patch Changes

- **New: the scaffolder warns when your npm is below a template's floor, and
  steers you to pnpm.** `nuxt >= 3.20.1` crashes npm 10's dependency resolver
  with `Cannot read properties of null (reading 'edgesOut')` while building the
  ideal tree. That is an upstream npm bug, and it happens *before* npm evaluates
  the `engines` field, so npm prints no `EBADENGINE` warning to explain
  itself — even under `--engine-strict`. You got a null dereference and no
  context.

  `create-reactive` now reads the scaffolded template's own `engines.npm`
  against the npm you actually invoked it with. When your npm is below the
  floor it explains the crash and prints `pnpm install` / `pnpm run dev` as the
  next steps instead of an `npm install` that is known to fail. The check reads
  the template rather than hard-coding `nuxt`, so it keeps working when another
  template acquires a floor.

- **Fix: the nuxt template installs cleanly from a fresh scaffold.** It was the
  only Vue template without a direct `vue` entry — Vue arrived transitively
  through nuxt. In that shape npm resolves `@tanstack/vue-query`'s optional
  `@vue/composition-api` peer, which hard-requires `vue ">= 2.5 < 2.7"`, pins
  `vue@2.6.14`, and then collides with the `vue >=3.0.0` peer that
  `@growae/reactive-vue` requires — so `npm install` failed `ERESOLVE` from a
  clean clone. Declaring `vue` directly anchors Vue 3 before the optional peer
  chain is walked. Verified against the real registry with npm 11: clean
  resolve, `vue@3.5.41`, `@vue/composition-api` absent.

- The nuxt template declares `engines.npm: ">=11"`, naming the requirement
  rather than pinning nuxt below the version that trips the npm 10 bug.

- **Fix: scaffolds are reproducible.** All six templates resolved their tooling
  through the `latest` dist-tag, so two scaffolds a week apart produced
  different trees. `vite`, `typescript` and each framework's toolchain are now
  caret-pinned. `@growae/*` entries stay on `latest` — they track this
  repository's own releases.

  `vite` is pinned to `^8.2.2`, clearing four open advisories. `typescript` is
  held at `^5.7.0` in the four templates whose toolchain cannot take the current
  major — `next`, `nuxt`, `vite-react` and `vite-vue` — because `vue-tsc`
  crashes under TypeScript 7 with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The two
  templates with no such constraint, `vite-solid` and `vite-vanilla`, are on
  `^7.0.2`.

- The templates' `uuid` override is scoped to the vulnerable range
  (`uuid@<11.1.1`) instead of being unbounded, so it no longer force-upgrades
  `uuid` for every dependency your generated app adds later.

  The `resolutions` key is gone. pnpm and yarn read that field with mutually
  exclusive selector grammars — a yarn-shaped key hard-fails `pnpm install` and
  a pnpm-shaped key hard-fails `yarn install`, and no key satisfies both.
  `overrides` and `pnpm.overrides` cover npm and pnpm. **Yarn users:** you lose
  this override and `yarn audit` will surface one moderate `uuid` finding via
  `@metamask/utils`; install and resolution are otherwise identical.

- Template tooling floors moved again before this candidate: `next` `^16.3.2`,
  `vite` `^8.2.2`, `@vitejs/plugin-react` `^6.1.0` and `vue-tsc` `^3.3.11`. All
  within-major, and they change only what a *new* scaffold installs — nothing
  is upgraded in a project you already generated.

- The manifest now declares `"license": "MIT"`. The licence has not changed, but
  no `license` field reached npm for 0.0.5, so registry metadata showed the
  package as unlicensed.

## 0.0.5

### Patch Changes

- Release patch bump

## 0.0.4

### Patch Changes

- Release patch bump

## 0.0.3

### Patch Changes

- Release patch bump

## 0.0.2

### Patch Changes

- Release patch bump
