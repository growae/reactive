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
