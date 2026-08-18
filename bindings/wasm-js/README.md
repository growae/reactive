## WIT + JS binding — differential harness prep

Infrastructure, not the JS binding itself. This directory exists so the
`wasm32-unknown-unknown` + `jco` pipeline stays exercised end-to-end while
Core's public surface is still being built (the three Core rows are the
long pole), and gets extended interface-by-interface as Core freezes real
exports.

### What's here

- `wit/world.wit` — the WIT world. Currently a single placeholder export
  (`ping`) with no protocol semantics — real signatures belong to Core and
  land here once frozen, not invented on this side.
- `placeholder-core/` — a minimal `cargo-component` crate implementing that
  world, standing in for Core's eventual crate. Not the crate scaffold
  decision (that's the Technical Lead's call, raised on the Core row that
  owns it) — this one is disposable and gets deleted once a real core
  artifact exists to transpile against.
- `generated/` — the `jco transpile` output (`.core.wasm` + `.js` + `.d.ts`).
  **Committed**, not gitignored: CI has no Rust toolchain
  (`.github/workflows/ci.yml` is Node/pnpm-only), so the differential
  harness and this package's own test load the pre-built glue rather than
  rebuilding it. Regenerate with `pnpm build` after any `wit/` or
  `placeholder-core/` change and commit the result.

### Pinned toolchain — measured, not guessed

- Target: `wasm32-unknown-unknown`, **not** `wasm32-wasip2`. Rust's std
  links the full WASI CLI surface under wasip2 regardless of what the
  function does — roughly 2x the gzipped bundle for identical
  functionality. Confirmed on this repo's own throwaway spike
  (`spike-wasm-bundle-measurement/core-pure` on `spike/wasm-bundle-measurement`):
  32-34 KB gzip vs 58-59 KB, reproduced on two hosts.
- `jco` `1.29.0`, `cargo-component` `0.21.1`, `wit-bindgen-rt` `0.41.0` —
  pinned as devDependencies / in `Cargo.toml` rather than left floating.
- WASM is for the browser only. The core owns the transport *contract*
  (request/response shapes, retry policy as data); each language owns the
  socket. A socket-owning component was measured to silently return wrong
  answers in-browser on the stable `jco` 1.29.0 path (sync canonical-ABI
  lowering can't block on `fetch()`) — disqualifying independent of the
  +121% size cost. Nothing here binds a socket.

### Build

```sh
pnpm install
pnpm build   # cargo component build --release --target wasm32-unknown-unknown, then jco transpile --minify
pnpm test
```

`pnpm build` needs a Rust toolchain with the `wasm32-unknown-unknown`
target and `cargo-component` installed locally — it is a maintainer step,
not a CI dependency. `pnpm test` only needs Node and runs against the
committed `generated/` output.

### Status

No Core surface has landed yet — the three Core rows building the FATE ABI
codec, transaction serialisation, and entry/state/keys are still open. This
pass proves the pipeline holds together on a trivial export; extending
`wit/world.wit` with real Core-defined interfaces is the next increment,
done as each Core row freezes its part of the surface — not held for all
three to finish.
