# @growae/reactive-connectors

## 0.1.0

### Minor Changes

- ae108e0: **Breaking, and a correctness fix.** Every connector now signs with exactly the
  account it was told to sign with, on both signing paths, or throws
  `ConnectorAccountUnavailableError`. None of them falls back to another account.
  
  `Connector.signTransaction` and `Connector.signMessage` both take an optional
  `onAccount`. `iframe`, `superhero` and `webExtension` resolved a name they did
  not hold to `accounts[0]`; `ledger`, `metamaskSnap`, `memory` and `mock`
  accepted the parameter and ignored it, signing from their configured index,
  derivation path or first account. Either way a caller who named one account got
  back a valid signature from a different one, reported as a success.
  
  The two actions no longer leave the choice to the connector either.
  `signTransaction` and `signMessage` default `onAccount` to the connection's
  `activeAccount` — the account `getActiveAccount` reports and
  `switchActiveAccount` sets. Nothing propagated `switchActiveAccount` to a
  connector, so before this a caller who switched accounts had the transaction
  built for the new account and signed by the old one, and the message signed by
  the old one while they verified against the new. `signTypedData` already pinned
  that field and is unchanged.
  
  What a caller sees:
  
  - Naming an account the connector does not hold now throws
    `ConnectorAccountUnavailableError` where it previously returned another
    account's signature. `ConnectorAccountUnavailableError` is a `BaseError`
    subclass and is exported, so `instanceof` narrows it.
  - After `switchActiveAccount`, transactions and messages are signed by the
    active account rather than the connector's first one. Code that switched
    accounts and relied on the first account still signing was relying on the
    defect; pass `onAccount` explicitly to name an account other than the active
    one.
  - `ledger` and `metamaskSnap` hold exactly one account, so a named account
    other than that one throws rather than being signed from the configured path.
  - `mock` enforces the same rule, so a test that pins an account outside the
    mock's list now fails in the test rather than in whatever the mock stands in
    for.
  
  Callers that never passed `onAccount` and never call `switchActiveAccount` are
  unaffected: the active account is the first account until something changes it.
  
  Third-party connectors are unaffected at the type level — `onAccount` was
  already declared and stays optional — but the obligation is now written into
  `createConnector`'s contract and its API page: sign with exactly that account
  or throw, on both methods.

### Patch Changes

- 91ce459: Emit ESM that Node can actually resolve.
  
  `dist/esm` and `dist/types` shipped extensionless relative import specifiers.
  `tsc` never rewrites a specifier, so `from '../createConfig'` in the source
  became `from '../createConfig'` in the emitted JavaScript, and Node's ESM
  resolver does no extension inference. Every published version so far —
  0.0.1 through 0.0.6 — throws on the first import:
  
  ```
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module
    .../@growae/reactive/dist/esm/createConfig
    imported from .../@growae/reactive/dist/esm/exports/index.js
  ```
  
  This never surfaced in development because vite, webpack, esbuild and rollup
  all infer the extension. It surfaces wherever Node's own resolver runs: a plain
  Node script, a Next.js server component or route handler, any SSR entry,
  Vitest in `node` environment without an alias, `node --import`. The declarations
  carried the same specifiers, so a consumer on `moduleResolution: node16` or
  `nodenext` also saw the public type surface collapse to nothing — silently,
  with no error to read.
  
  **Consumer-visible fix, no API change.** Every export, name and signature is
  what it was; the same imports that already worked under a bundler keep working
  unchanged, and the ones that failed under Node now resolve.
  
  Relative imports in the sources now carry explicit `.js` extensions, and both
  packages build under `moduleResolution: nodenext`, which makes omitting one a
  compile error rather than something a reviewer has to notice. A new
  `Node Resolution` CI job packs real tarballs, installs them into a scratch
  `"type": "module"` package and imports every `exports` subpath under Node,
  then type-checks the shipped declarations under `nodenext`; the same check runs
  in the release workflow before anything is published.
- Updated dependencies [de3d9f5]
- Updated dependencies [d2eb066]
- Updated dependencies [7150cec]
- Updated dependencies [ae108e0]
- Updated dependencies [91ce459]
- Updated dependencies [3ceaf95]
  - @growae/reactive@0.1.0

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
