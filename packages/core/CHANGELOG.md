# @growae/reactive

## 0.1.0

### Minor Changes

- 7150cec: **Breaking.** `claimName`, `preclaimName`, `updateName`, `resolveName` and `getNameEntry` each shipped twice — once at `actions/` and once at `actions/aens/`, with different parameters, different return shapes and different error behaviour. There is now one of each, and the duplicates are gone.
  
  Migration:
  
  - `claimName` takes `salt: number` where it took `salt: bigint | string`. It is the sdk's `nameSalt` field, and it round-trips from `preclaimName`, which reports it as a number. It is now optional: since Ceres a name can be claimed without preclaiming.
  - `preclaimName` returns `salt: number` where it returned `salt: bigint`. It is the same value the sdk generated, in the type `claimName` now takes, so the round-trip needs no conversion — but code that did arithmetic on it, or passed it somewhere typed `bigint`, has to drop the conversion.
  - `updateName` takes `name` where it took `nameId`, matching every other AENS action. It also gained `extendPointers`, which merges with the pointers already on the name instead of replacing them.
  - `claimName`, `preclaimName` and `updateName` return `rawTx` and `blockHeight` alongside `txHash`. Existing fields are unchanged.
  - `claimName`, `preclaimName` and `updateName` throw `ClaimNameNoAccountError`, `PreclaimNameNoAccountError` and `UpdateNameNoAccountError` — all `BaseError` subclasses, all exported — where they threw a bare `Error`. Safe for anyone catching `Error`; breaking for anyone matching the message text.
  - `updateName` now defaults `nameTtl` to 180000, the protocol maximum and the value the documentation always named, where it hardcoded 50000. Pass `nameTtl` explicitly to keep the old lifetime.
  - `resolveName` is unchanged: it still returns `Promise<string | null>` and still does not throw when a name does not resolve. The `aens/` variant's `NameNotResolvedError` and `{ address }` return shape are dropped rather than adopted — a name that is not registered is an ordinary answer for a resolver.
  - `getNameEntry` is unchanged.
  
  Two defects went with the duplicates. `preclaimName` reported the block hash as `commitmentId`, which is a different value entirely; it is now derived from the name and the salt, as the posted transaction was. `claimName` accepted a salt and discarded it, posting a claim that no preclaim committed to.
  
  All five now sign through the connector adapter rather than passing the connected address where the sdk requires an `AccountBase`, and each has a test that runs with a connection present and asserts the connector was asked to sign.
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
- 3ceaf95: **Breaking, and a correctness fix.** `sendTransaction` and `transferFunds` declared parameters and return fields that were wired to nothing. Three changes:
  
  1. **`sendTransaction`'s surface is narrower.** `connector` and the `options` bag (`options.verify`, `options.waitMined`) are removed from `SendTransactionParameters`. All three were accepted by the type checker and read by nothing. `sendTransaction` posts an already-signed transaction and never reaches the connector, and `options.waitMined` was a second name for the sibling `waitMined` field. Passing any of them is now a compile error, which is the whole of the change a caller sees: they did nothing before. `verify` names a capability nothing in this package implements; it can return later as an additive parameter.
  
  2. **`waitMined` is wired.** `sendTransaction` now waits for the transaction to be mined when `waitMined: true`, and returns `blockHash`, `blockHeight` and `tx` alongside `hash` and `rawTx`. It defaults to `false`, so existing calls behave exactly as before. The wait is bounded by a new `timeout` parameter defaulting to `DEFAULT_WAIT_TIMEOUT` (20 minutes), also newly exported.
  
  3. **`transferFunds` signs before it sends.** It built an unsigned `SpendTx`, passed it to `sendTransaction` along with a connector `sendTransaction` discarded, and posted the unsigned bytes — so the action could not complete a transfer, and its declared `blockHash`, `blockHeight` and `tx` were `undefined` on every call ever made. It now signs through `signTransaction` first. Its `waitMined` default of `true` is honoured rather than dropped, which populates those three fields; `rawTx` is now genuinely the signed transaction. `TransferFundsReturnType` is unchanged.
  
  Migration: remove `connector` and `options` from any `sendTransaction` call — neither had any effect. If you relied on `transferFunds` returning as soon as the node accepted the transaction, pass `waitMined: false`; note that it did not previously succeed at all.

### Patch Changes

- de3d9f5: Fix `bidName`, `revokeName` and `transferName`, which failed for every caller.
  
  All three passed the connected address — a plain string — where `@aeternity/aepp-sdk` requires an `AccountBase`, so the transaction was built with no sender and the call failed at the node. They now sign through a new internal `AccountBase` adapter over the connector, which carries the connected address and forwards to the connector's `signTransaction` and `signMessage`. No public API changed.
- d2eb066: Fix `waitForTransaction`, which never returned on the path its own defaults took.
  
  Called with no `timeout`, it read the transaction's `ttl`, and on a non-zero one skipped its height check for the rest of the run — nothing then detected the ttl expiring, so it polled a transaction that was never mined forever. Every action in this library builds with `DEFAULT_TTL`, so that was the default path, not an edge case. The `blocks` bound only ever applied to transactions built with `ttl: 0`.
  
  `blocks` now bounds the wait whenever the caller passes it or passes no bound at all, and the transaction's ttl height caps it on top of that whenever the ttl is nearer — past it the transaction can never be mined, so the wait ends with a distinct message saying so. An explicit `timeout` is still the caller's own bound and the default `blocks` does not tighten it; passing both leaves both in force, whichever fires first. No path through the function is unbounded any more, and no path that terminated before terminates sooner than it did.
  
  One change goes the other way, and it is the only one: passing `timeout` on its own used to *add* the default 5-block bound on a transaction built with `ttl: 0`, and now replaces it, so that call waits up to your `timeout` rather than to whichever of the two came first. Pass `blocks` alongside `timeout` to keep both in force.
  
  The same fix reaches `useWaitForTransaction` in `@growae/reactive-react`, `@growae/reactive-solid` and `@growae/reactive-vue`: all three forward their parameters to this action and supply no timeout of their own, so `useWaitForTransaction({ hash })` was the unbounded default in each of them and is now bounded by the same 5 key blocks.
  
  These errors are still plain `Error`s and their message strings are not a stable API — do not match on them. They will change when this action's errors become `BaseError` subclasses.
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
- Updated dependencies [ae108e0]
- Updated dependencies [91ce459]
  - @growae/reactive-connectors@0.1.0

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

- **`callContract()` refuses a `map` argument the node would reject, instead of
  spending the gas limit finding out.** `@aeternity/aepp-calldata` sorts a map's
  entries itself, and for `map(string, _)` and `map(bits, _)` its order is not
  the one the node's decoder requires — it orders string keys by UTF-16 length
  where the node orders them by UTF-8 byte length, and it inverts the negative
  half of the `bits` order. The node then refuses the call inside its decoder,
  after the transaction is mined and after the whole `gasLimit` has been
  charged for it, with no reason and no hash reaching you.

  `callContract()` now checks the two orders for the keys you actually passed
  and throws `CallContractMapKeyOrderError` before building or posting
  anything, listing both orders per offending argument.

  **This is not a fix and does not make the call work.** The encoder sorts the
  entries, so no insertion order avoids it and there is nothing to change on
  your side — the call cannot be made until the encoding is fixed upstream.
  What changed is that it costs nothing instead of the gas limit, and that the
  refusal has a name you can catch. Only the keys present are compared, so a
  map whose keys the two implementations happen to agree about — `{"ä" → 1,
  "ö" → 2}`, or any all-ASCII key set — is unaffected and still goes out.

  `deployContract()`, `simulateContract()`, `readContract()` and
  `readContracts()` reach the same encoder and are not guarded yet.

- **`callContract()` now throws `CallContractInvocationError` where it
  previously let `NodeInvocationError` through.** `@aeternity/aepp-sdk` reports
  a call the node executed and refused as `NodeInvocationError`, which carries
  the node's reason nowhere but its own message and sets its `transaction`
  property only on the static path — so an on-chain failure arrived with
  neither the reason legible nor a hash to look the call up by. The new error
  carries both, as `reason` and `transactionHash`.

  **If you catch `NodeInvocationError` from `callContract()` today, that
  `instanceof` stops matching.** The original is preserved unchanged as
  `cause`, so `catch (error) { if (error.cause instanceof NodeInvocationError)
  … }` is the migration; matching on `CallContractInvocationError` is the
  replacement. Nothing else about the call path changed, and no other action
  wraps it.

  `CallContractMapKeyOrderError`, `CallContractInvocationError` and their
  `…Type` aliases are exported from the package root. Both are members of the
  `CallContractErrorType` union, which never named `NodeInvocationError`.

- The `zustand` dependency range moves from `^5.0.0` to `^5.0.15`. Same major,
  no API change on our side; it raises the minimum zustand your install
  resolves. If you pin zustand yourself, a pin below `5.0.15` no longer
  satisfies this package.

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
