# @growae/reactive-react

## 0.0.6

### Patch Changes

- The manifest now declares `"license": "MIT"`. The licence has not changed and
  the `LICENSE` file was always shipped, but no `license` field reached npm for
  0.0.5, so registry metadata showed the package as unlicensed and dependency
  scanners read that as more restrictive than MIT rather than less.

- **Fix: hooks no longer break the Rules of Hooks when you pass `config`
  explicitly.** Every hook that takes an optional `config` resolves it through
  `useConfig`, which read `parameters.config ?? useContext(ReactiveContext)` —
  so `useContext` was skipped whenever a config was passed. A component that
  passes `config` on one render and omits it on the next changed its own hook
  count, and React reported a Rules-of-Hooks violation coming from library
  code. `useContext` is now called unconditionally and the explicit parameter
  still wins.

  No signature or type change, and the resolution order is unchanged: an
  explicitly passed config still takes precedence, a missing provider still
  throws `ReactiveProviderNotFoundError`. If you saw React warn about a changed
  hook order in a component using `useBalance({ config })` or any other hook
  with an optional `config`, that warning is gone.

- Beyond that fix, no API change in this package. The other fixes you want from
  this release are in `@growae/reactive` 0.0.6 — `spend()` with no payload, the
  `memory()` connector signing with your network id, `Register` becoming
  augmentable, and `callContract()`'s two new errors. `Register` is what made
  the React scaffold template fail to typecheck with `TS2300: Duplicate
  identifier 'Register'`.

- Updated dependencies
  - @growae/reactive@0.0.6

## 0.0.5

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.5

## 0.0.4

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.4

## 0.0.3

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.3

## 0.0.2

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.2
