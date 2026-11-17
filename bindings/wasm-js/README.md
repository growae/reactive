# JavaScript binding for ae-core

The `@growae/reactive/protocol` entry point loads this Rust component in Node or a browser. Its generated files are committed under [the core package](../../packages/core/protocol-generated/), so consumers install a single npm package with its WASM asset. Core actions load it lazily.

The [WIT interface](wit/world.wit) exposes transaction building and unpacking, minimum fees, signing, address encodings, hashes, AENS primitives, FATE value/calldata encoding and AE typed-data signing and verification. The FATE interface links ae-fate by path; recursive values cross as encoded child bytes. Repeated fields carry encoded delegate IDs or raw signature bytes. Nested transactions cross as encoded transactions. Supply integers as decimal strings.

## Build and check

Install Rust 1.97.1, its wasm32-unknown-unknown target, and cargo-component 0.21.1. From this directory run `pnpm build` and `pnpm test` after installing the root workspace. The component links ae-core by path. The pinned jco transpiler emits the JS, type declarations and binary with an explicit initialization promise. The package entry point awaits it before returning the protocol API.

The [pipeline tests](pipeline.test.ts) compare all 41 shared transaction vectors through the JS boundary, exercise signing and fees, and also run against the committed binary in CI. The [packed consumer test](../../packages/core/scripts/test-node-resolution.mjs) loads the installed asset. The browser server must serve WASM as `application/wasm`.

## Browser size history

The original proof measured approximately 135 KB gzipped against a 60 KB budget. That decision kept the 0.1 JS toolkit on the SDK. In 0.2 the maintainer chose a smaller Rust-based API and accepted shipping the component lazily. See the [historical measurement](https://github.com/growae/reactive/blob/v0.1.0/bindings/wasm-js/README.md) and [release scope](../../ROADMAP.md).
