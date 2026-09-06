---
'@growae/reactive': patch
---

Fix `bidName`, `revokeName` and `transferName`, which failed for every caller.

All three passed the connected address — a plain string — where `@aeternity/aepp-sdk` requires an `AccountBase`, so the transaction was built with no sender and the call failed at the node. They now sign through a new internal `AccountBase` adapter over the connector, which carries the connected address and forwards to the connector's `signTransaction` and `signMessage`. No public API changed.
