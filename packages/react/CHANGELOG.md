# @growae/reactive-react

## 0.0.6

### Patch Changes

- The manifest now declares `"license": "MIT"`. The licence has not changed and
  the `LICENSE` file was always shipped, but no `license` field reached npm for
  0.0.5, so registry metadata showed the package as unlicensed and dependency
  scanners read that as more restrictive than MIT rather than less.

- No API or behaviour change in this package. The fixes you want from this
  release are in `@growae/reactive` 0.0.6 — `spend()` with no payload, the
  `memory()` connector signing with your network id, and `Register` becoming
  augmentable. The last of those is what made the React scaffold template fail
  to typecheck with `TS2300: Duplicate identifier 'Register'`.

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
