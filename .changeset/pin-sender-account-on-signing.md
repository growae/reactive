---
'@growae/reactive': minor
'@growae/reactive-connectors': minor
---

**Breaking, and a correctness fix.** Every connector now signs with exactly the
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
