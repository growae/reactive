---
'@growae/reactive': minor
---

**Breaking.** `claimName`, `preclaimName`, `updateName`, `resolveName` and `getNameEntry` each shipped twice — once at `actions/` and once at `actions/aens/`, with different parameters, different return shapes and different error behaviour. There is now one of each, and the duplicates are gone.

Migration:

- `claimName` takes `salt: number` where it took `salt: bigint | string`. It is the sdk's `nameSalt` field, and it round-trips from `preclaimName`, which reports it as a number. It is now optional: since Ceres a name can be claimed without preclaiming.
- `updateName` takes `name` where it took `nameId`, matching every other AENS action. It also gained `extendPointers`, which merges with the pointers already on the name instead of replacing them.
- `claimName`, `preclaimName` and `updateName` return `rawTx` and `blockHeight` alongside `txHash`. Existing fields are unchanged.
- `claimName`, `preclaimName` and `updateName` throw `ClaimNameNoAccountError`, `PreclaimNameNoAccountError` and `UpdateNameNoAccountError` — all `BaseError` subclasses, all exported — where they threw a bare `Error`. Safe for anyone catching `Error`; breaking for anyone matching the message text.
- `updateName` now defaults `nameTtl` to 180000, the protocol maximum and the value the documentation always named, where it hardcoded 50000. Pass `nameTtl` explicitly to keep the old lifetime.
- `resolveName` is unchanged: it still returns `Promise<string | null>` and still does not throw when a name does not resolve. The `aens/` variant's `NameNotResolvedError` and `{ address }` return shape are dropped rather than adopted — a name that is not registered is an ordinary answer for a resolver.
- `getNameEntry` is unchanged.

Two defects went with the duplicates. `preclaimName` reported the block hash as `commitmentId`, which is a different value entirely; it is now derived from the name and the salt, as the posted transaction was. `claimName` accepted a salt and discarded it, posting a claim that no preclaim committed to.

All five now sign through the connector adapter rather than passing the connected address where the sdk requires an `AccountBase`, and each has a test that runs with a connection present and asserts the connector was asked to sign.
