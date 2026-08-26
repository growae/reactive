# @growae/reactive

## 0.0.6

### Patch Changes

- **`spend()` no longer sends an empty `payload` field.** The action set
  `payload: ''` unconditionally, and `buildTx` in `@aeternity/aepp-sdk` rejects
  `''` as an encoded bytearray — so every `spend()` call made without a payload
  threw `DecodeError`, across the whole `^14` SDK range. The field is now
  omitted when you pass no payload and the SDK applies its own empty-payload
  default.

  If you assert on serialised transaction bytes, a payload-less spend now
  serialises to different bytes than it did on 0.0.5 — regenerate those
  fixtures.

- **The `memory()` connector now signs with your config's network.** It called
  `signTransaction(tx)` without forwarding `networkId` or `innerTx`, so the
  account signed against the SDK's default network whatever network your config
  was on. Signatures produced for any non-default network — a devnet, a private
  network, anything that is not the SDK default — were computed over the wrong
  network id and a node would reject them. Both values are now forwarded.

  No API change. If you produced signatures through `memory()` on a non-default
  network before 0.0.6, they were invalid and need re-signing.

- **`Register` is declared as an `interface`, so module augmentation works.** It
  exists only to be augmented, and declaring it as a type alias made the
  documented pattern illegal — TypeScript reported `TS2300: Duplicate identifier
  'Register'`:

  ```ts
  declare module '@growae/reactive' {
    interface Register {
      config: typeof config
    }
  }
  ```

  That now compiles. An empty interface and an empty object type are
  structurally identical everywhere else, so `ResolvedRegister` and every
  existing usage are unaffected — nothing that compiled against 0.0.5 stops
  compiling.

- **The manifest now declares `"license": "MIT"`.** The licence has not changed
  and the `LICENSE` file was always shipped, but no `license` field reached npm
  for 0.0.5, so registry metadata showed the package as unlicensed and
  dependency scanners read that as more restrictive than MIT rather than less.

- Patched the `uuid` advisory that reaches you through this package:
  `@aeternity/aepp-sdk` → `@metamask/providers` → `@metamask/utils` → `uuid`
  `<11.1.1` (moderate, missing buffer bounds check), pinned to `^11.1.1`.

- Updated dependencies
  - @growae/reactive-connectors@0.0.6

## 0.0.5

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive-connectors@0.0.5

## 0.0.4

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive-connectors@0.0.4

## 0.0.3

### Patch Changes

- Release patch bump

## 0.0.2

### Patch Changes

- Release patch bump
