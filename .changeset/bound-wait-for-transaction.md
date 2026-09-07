---
'@growae/reactive': patch
---

Fix `waitForTransaction`, which never returned on the path its own defaults took.

Called with no `timeout`, it read the transaction's `ttl`, and on a non-zero one skipped its height check for the rest of the run — nothing then detected the ttl expiring, so it polled a transaction that was never mined forever. Every action in this library builds with `DEFAULT_TTL`, so that was the default path, not an edge case. The `blocks` bound only ever applied to transactions built with `ttl: 0`.

`blocks` now bounds the wait whenever the caller passes it or passes no bound at all, and the transaction's ttl height caps it on top of that whenever the ttl is nearer — past it the transaction can never be mined, so the wait ends with a distinct message saying so. An explicit `timeout` is still the caller's own bound and the default `blocks` does not tighten it; passing both leaves both in force, whichever fires first. No path through the function is unbounded any more, and no path that terminated before terminates sooner than it did.

The same fix reaches `useWaitForTransaction` in `@growae/reactive-react`, `@growae/reactive-solid` and `@growae/reactive-vue`: all three forward their parameters to this action and supply no timeout of their own, so `useWaitForTransaction({ hash })` was the unbounded default in each of them and is now bounded by the same 5 key blocks.

These errors are still plain `Error`s and their message strings are not a stable API — do not match on them. They will change when this action's errors become `BaseError` subclasses.
