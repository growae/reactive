/// aeternity protocol primitives: transaction serialisation, addresses,
/// signing.
///
/// Bytes in, bytes out. There is no node HTTP client here, no async and no
/// retries — this is the `ae-core` Rust crate through `flutter_rust_bridge`,
/// native rather than WASM, and it wraps only what a caller building and
/// signing a transaction needs. See [Value] and [TxParams] for the full
/// field-level surface.
///
/// A consumer calls [RustLib.init] once, before touching anything else in
/// this library — that is what loads the native library `flutter_rust_bridge`
/// generated, from `RustLib.kDefaultExternalLibraryLoaderConfig`'s
/// `ioDirectory`.
library;

export 'src/rust/api/core.dart';
export 'src/rust/frb_generated.dart' show RustLib;
