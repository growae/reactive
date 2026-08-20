## WIT + JS binding — the real `ae-core` surface

The first real `wasm32-unknown-unknown` + `jco` build over the frozen
`ae-core` crate, replacing the Phase 1 placeholder. **This directory measured
the browser path, the measurement decided it, and the answer was no.** It is
kept as a frozen reference artifact, not as a live binding — read `## Status`
before building anything on top of it.

### What's here

- `wit/world.wit` — the WIT world: six interfaces (`encoding`, `hash`, `keys`,
  `tx`, `aens`, `fee`) over the parts of the twelve-module `ae-core` surface a
  wallet-less browser caller actually drives. What each one covers, and what
  it deliberately leaves out, is documented inline per interface — the short
  version is that WIT has no recursive types (confirmed empirically:
  `cargo component build` rejects a self-referential variant with "type
  depends on itself"), so the two recursive shapes of `ae_core::tx::Value`
  (`List`, `Tx`) are absent from `field-value`; a nested transaction crosses
  the boundary as its own `tx_...` string instead.
- `core-component/` — the `cargo-component` crate implementing that world
  over `ae-core` by path dependency. Replaces `placeholder-core/`, which is
  deleted.
- `generated/` — the `jco transpile` output (`.core.wasm` + `.js` + `.d.ts`).
  **Committed**, not gitignored, so the component can be loaded and inspected
  without a Rust toolchain. Regenerate with `pnpm build` after any `wit/` or
  `core-component/` change and commit the result.
  `.github/workflows/wasm-bindings.yml` gates it in two parts, because only
  one of them is byte-reproducible: `core-harness.js` and the `.d.ts` files
  are compared byte-exact, while `core-harness.core.wasm` has its currency
  proven functionally — the committed binary must pass the same test suite a
  fresh build just passed. The reason for the split is argued at length in the
  workflow itself; the short version is that `rustc`/LTO's ordering of a path
  dependency's monomorphized code is not reproducible across checkout
  directories, and no remap flag available here closes it.

### Pinned toolchain — unchanged from Phase 1

- Target: `wasm32-unknown-unknown`, **not** `wasm32-wasip2`.
- `jco` `1.29.0`, `cargo-component` `0.21.1`, `wit-bindgen-rt` `0.41.0`.
- No `generate()` in the `keys` interface: `SecretKey::generate()` reads OS
  randomness through `rand_core::OsRng`, and `getrandom` has no
  `wasm32-unknown-unknown` backend that does not pull in `wasm-bindgen`'s ABI
  — a second, incompatible binding mechanism this pipeline does not run. A
  caller draws entropy from `crypto.getRandomValues()` in JS and calls
  `from-seed`, same as `viem`/`noble-curves`. `getrandom` still has to
  *compile* for this target even though nothing calls it; `core-component`
  registers a custom backend (`getrandom/custom`) that traps if it is ever
  reached, which it is not.

### Build

```sh
pnpm install
pnpm build   # cargo component build --release --target wasm32-unknown-unknown, then jco transpile --minify
pnpm test
```

### Status

**Gate A — the 60 KB condition: crossed.** The Technical Lead's ratification
carried a standing condition: the first real `ae-core` WASM build reports its
gzip size, and crossing 60 KB returns the browser path to him and the CTO for
re-decision, with an explicit instruction not to optimise back under the line
before they have seen the number. Measured on this build (`core-harness.core.wasm`
+ `core-harness.js`, minified, gzip -9, summed): **~135.1 KB — more than
double the gate, and roughly 7.9× the 17.2 KB placeholder tax the ratification
was made against.** Nothing past this measurement narrows the exported
surface to chase the line; that call belongs to the Technical Lead and the
CTO, not this row.

**Gate B — the shipping denominator: computed, and worse than Gate A alone.**
The governing figure was `(denominator − displaced) + core`, not today's floor
plus a flat tax. `denominator` = 52.5 KB (`packages/core`'s mandatory floor,
measured in the Phase 1 ratification, not re-measured here); `displaced` = 0,
because nothing had been switched over to the WASM core — dropping
`@aeternity/aepp-sdk` stays gated behind the differential-parity suite. That
made the shipped figure fully additive.

**The re-decision has happened, and the browser path reverses: the Rust core
does not ship to browsers.** The deciding arithmetic was displacement, which
is what the 60 KB condition existed to test. Everything the core could ever
displace lives between the mandatory floor (52,481 B gzip — `Node` pulling in
the generated OpenAPI mappers, which is transport, and transport is
deliberately not the core's) and a write action (85,799 B): **33,318 B**, and
that is generous. Break-even therefore requires a core of 33 KB gzip or less.
This one is 135 KB — **4.06×** — and it is already tuned (`opt-level = "s"`,
`lto = true`, `strip = true`, no name or debug section). The levers left over
recover perhaps 20–25%, which leaves it at roughly 3× break-even. The gap is
structural rather than a tuning problem. In the best case that exists — a
write action with the SDK's whole transaction path displaced — a consumer's
bundle goes from 85,799 B to 187,870 B, **+119%**; for a read action, where
displacement is 204 B, **+257%**, and a read-only dapp pays every byte because
a WASM component does not tree-shake.

The browser keeps `@aeternity/aepp-sdk`, which is ISC, maintained, and already
what ships. That is not a second implementation of anything, so the
duplicated-serialisation risk that argued for WASM in the first place does not
arise. Python (PyO3), Dart/Flutter (`flutter_rust_bridge`) and Rust bind the
core natively and are unaffected — this narrows the core's consumers from four
to three without weakening it.

### What that makes this directory

**A frozen reference artifact with no consumer.** Nothing in the tree imports
it: the differential parity harness (`crates/ae-parity`) links `ae-core` and
`ae-fate` directly as Rust crates and never crosses a WASM boundary, and the
browser binding it was measured for is not being built.

It is kept because the WIT world over the frozen surface is the expensive part
of any future attempt, and the reopen bar below is falsifiable rather than
rhetorical. It is **not** on the mirror-duty list: when `ae-core`'s public
surface changes, `wit/world.wit` and `core-component/` are allowed to go
stale, and whoever next has a reason to touch this directory brings it current
as part of that work. The CI job is path-filtered to `bindings/wasm-js/**`, so
a core change does not fire it — that is deliberate, and it is why the staleness
costs nothing. Do not read a green history here as evidence the binding matches
today's core.

It never enters `packages/`, and it never publishes.

**What would reopen the browser path:** a core under **50 KB gzip** — about
+20% on the write-action bundle, the magnitude already accepted as survivable
— with break-even at 33 KB. Measuring that is not funded; anyone who produces
the number can reopen the decision on it.
