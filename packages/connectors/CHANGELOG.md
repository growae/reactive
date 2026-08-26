# @growae/reactive-connectors

## 0.0.6

### Patch Changes

- The manifest now declares `"license": "MIT"`. The licence has not changed and
  the `LICENSE` file was always shipped, but no `license` field reached npm for
  0.0.5, so registry metadata showed the package as unlicensed and dependency
  scanners read that as more restrictive than MIT rather than less.

- Patched the `uuid` advisory that reaches you through this package:
  `@aeternity/aepp-sdk` → `@metamask/providers` → `@metamask/utils` → `uuid`
  `<11.1.1` (moderate, missing buffer bounds check), pinned to `^11.1.1`.

- No API or behaviour change in this package.

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
