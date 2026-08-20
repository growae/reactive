## WIT + JS binding — the real `ae-core` surface

The first real `wasm32-unknown-unknown` + `jco` build over the frozen
`ae-core` crate, replacing the Phase 1 placeholder. **This directory measures;
it does not ship.** No browser JS binding is built on top of `generated/`
until Gate B's number (below) clears — see `## Status`.

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
  **Committed**, not gitignored, for the same reason as Phase 1: the
  differential harness and this package's own test load the pre-built glue
  rather than rebuilding it, so a Rust toolchain is never a runtime dependency
  for consumers. Regenerate with `pnpm build` after any `wit/` or
  `core-component/` change and commit the result —
  `.github/workflows/wasm-bindings.yml` fails the gate on any diff between a
  fresh build and the committed copy.

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

**Gate B — the shipping denominator: computed, and it is worse than Gate A
alone.** The governing figure is `(denominator − displaced) + core`, not
today's floor plus a flat tax. Today: `denominator` = 52.5 KB (`packages/core`'s
mandatory floor, as measured in the Phase 1 ratification — not re-measured
here, per the hold on `packages/core/src/createConfig.ts`); `displaced` = 0,
because nothing has actually been switched over to the WASM core yet —
dropping `@aeternity/aepp-sdk` stays gated behind the differential-parity
suite (still open), so every byte of JS serialisation code the core would
eventually replace is still in the shipped bundle today. `core` = the Gate A
number above. `(52.5 − 0) + 135.1 = 187.6 KB` gzip if a browser binding shipped
today — additive in full, exactly what "no JS binding ships on the additive
number" was written to prevent.

No browser JS binding is built on top of this directory until the Technical
Lead and CTO have re-decided the browser path against the Gate A crossing.
