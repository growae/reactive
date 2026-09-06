---
'@growae/reactive': minor
---

**Breaking, and a correctness fix.** `sendTransaction` and `transferFunds` declared parameters and return fields that were wired to nothing. Three changes:

1. **`sendTransaction`'s surface is narrower.** `connector` and the `options` bag (`options.verify`, `options.waitMined`) are removed from `SendTransactionParameters`. All three were accepted by the type checker and read by nothing. `sendTransaction` posts an already-signed transaction and never reaches the connector, and `options.waitMined` was a second name for the sibling `waitMined` field. Passing any of them is now a compile error, which is the whole of the change a caller sees: they did nothing before. `verify` names a capability nothing in this package implements; it can return later as an additive parameter.

2. **`waitMined` is wired.** `sendTransaction` now waits for the transaction to be mined when `waitMined: true`, and returns `blockHash`, `blockHeight` and `tx` alongside `hash` and `rawTx`. It defaults to `false`, so existing calls behave exactly as before. The wait is bounded by a new `timeout` parameter defaulting to `DEFAULT_WAIT_TIMEOUT` (20 minutes), also newly exported.

3. **`transferFunds` signs before it sends.** It built an unsigned `SpendTx`, passed it to `sendTransaction` along with a connector `sendTransaction` discarded, and posted the unsigned bytes — so the action could not complete a transfer, and its declared `blockHash`, `blockHeight` and `tx` were `undefined` on every call ever made. It now signs through `signTransaction` first. Its `waitMined` default of `true` is honoured rather than dropped, which populates those three fields; `rawTx` is now genuinely the signed transaction. `TransferFundsReturnType` is unchanged.

Migration: remove `connector` and `options` from any `sendTransaction` call — neither had any effect. If you relied on `transferFunds` returning as soon as the node accepted the transaction, pass `waitMined: false`; note that it did not previously succeed at all.
