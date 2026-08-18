Binding proof — one Rust core, four targets
===========================================

A throwaway costing prototype. It is not the shippable core and must never be
merged into `develop` or `main`. It exists to answer one question with numbers:
does one Rust core plus one interface definition yield bindings for JavaScript,
Rust, Dart/Flutter and Python without hand-maintained divergence?

Everything here is a byte-in/byte-out stand-in. There is no aeternity protocol
code, no cryptography and no key material of any kind.

Layout
------

    crates/ae-core     the core under test. pure computation, zero target deps.
    crates/ae-wasm     WASM component. wit-bindgen guest + wit/world.wit.
    crates/ae-py       PyO3 extension module.
    crates/ae-dart     flutter_rust_bridge api crate.
    js/                jco transpile output + Node round trip.
    py/                Python round trip.
    dart/              pure-Dart round trip (no Flutter needed).

The core exports two signatures deliberately: `transform` returns bytes, and
`decode` returns a record and can fail. The second one is the measurement that
matters — binding cost lives in non-primitive types and error channels, not in
`Vec<u8> -> Vec<u8>`.

Reproducing it
--------------

Toolchain resolved on `MacBook-Pro.local`, arm64, macOS 26.6.1, 2026-08-18:
rustc 1.97.1, wit-bindgen 0.60.0, jco 1.29.0, pyo3 0.29.2, maturin 1.14.1,
flutter_rust_bridge 2.12.0, Dart 3.13.0, Node 22.22.3, CPython 3.12.13.

    # Rust — it is a crate, there is no boundary
    cargo test -p ae-core

    # Browser JS — variant A, wasm32-wasip2
    cargo build -p ae-wasm --target wasm32-wasip2 --release
    jco transpile target/wasm32-wasip2/release/ae_wasm.wasm -o js/gen
    node js/test.mjs

    # Browser JS — variant B, wasm32-unknown-unknown, no WASI
    cargo build -p ae-wasm --target wasm32-unknown-unknown --release
    jco new target/wasm32-unknown-unknown/release/ae_wasm.wasm -o js/nowasi.component.wasm
    jco transpile js/nowasi.component.wasm -o js/gen-nowasi
    node js/test-nowasi.mjs

    # Python
    maturin develop -m crates/ae-py/Cargo.toml
    python py/test.py

    # Dart
    flutter_rust_bridge_codegen generate --rust-input crate::api \
      --rust-root crates/ae-dart --dart-output dart/lib/src/rust \
      --dart-root dart --no-build-runner
    cargo build -p ae-dart
    cd dart && dart pub get && dart run bin/test.dart

What it measured
----------------

All four round trips pass, both signatures, error channel included.

Variant B drops WASI entirely: the transpiled JS has no imports at all, against
variant A's fourteen `wasi:*` interfaces and a hard dependency on
`@bytecodealliance/preview2-shim`. Gzipped, core wasm plus JS glue: 32,469 bytes
for B against 58,252 for A.

Three of the four targets do not read the WIT file. Python binds the Rust API
through PyO3, Dart binds it through flutter_rust_bridge, and Rust has no
boundary. WIT is consumed by the browser path alone.

`Frame` and `DecodeError` are each declared four times — once in `ae-core` where
they are true, and once more per binding — with a hand-written conversion in
each. `wit-bindgen`'s `with` remapping does not remove the WASM copy; it applies
to imported interfaces only, and rejects an exported type with
`unused remappings provided via 'with'`.
