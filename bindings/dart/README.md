# ae-core (Dart / Flutter)

A native [`flutter_rust_bridge`](https://cjycode.com/flutter_rust_bridge/) 2.12.0
binding over `ae-core`'s protocol primitives: transaction serialisation,
addresses and Ed25519 signing. Bytes in, bytes out — there is no node HTTP
client here, no async and no retries. Those belong to a caller's own
ergonomics layer, in Dart's own idiom, not to this crate. Same scope as
`bindings/python`, mirrored shape-for-shape — see that binding's README for
the reasoning behind what is, and is not, bound.

Native, not WASM: `flutter_rust_bridge` binds the Rust core directly and
never reads the WIT file the (now frozen, off-duty) browser binding was
generated from, so this package is independent of that pipeline. See
`crates/README.md` for the shape of `ae-core` itself, and its "public surface
is frozen" section before changing any signature this binding mirrors.

## Install (from source, for now)

Nothing here is published to pub.dev. Build the native library and fetch the
Dart dependencies:

```sh
cd bindings/dart/rust
cargo build --release
cd ..
dart pub get
```

The generated Dart glue (`lib/src/rust/`) looks for the built library next to
where it was built — `rust/target/release/` — by default, so run `dart` /
`flutter` commands from `bindings/dart` (the package root) unless you wire up
your own `ExternalLibrary` loader.

A Flutter app consuming this package on a real device needs the native
library bundled for its target platforms — see "What is, and is not, built"
below for what this row built and measured, and
[`cargokit`](https://github.com/irondash/cargokit) or an equivalent
build-time compile step for wiring a `.so`/`.dylib`/`.dll` per platform into
an app bundle. That packaging step is out of scope here, same as the Python
binding does not publish a manylinux wheel matrix from this row alone.

## What is, and is not, built

Verified locally on this row, linux x86_64: `cargo build --release` produces
`rust/target/release/libae_core_dart.so`, and the full Dart test suite below
passes against it — 92 assertions, including every case in the differential
vector corpus.

CI (`.github/workflows/dart-bindings.yml`) extends that to a `Build` job
across three desktop targets, the artifact-only half of the matrix
`bindings/python/README.md` documents for wheels:

| Platform | Built | Why |
|---|---|---|
| Linux x86_64 | yes | verified locally on this row, and in CI |
| macOS arm64 | yes, in CI | not verified on this row's own host — no macOS runner here |
| macOS x86_64 | yes, in CI | not verified on this row's own host |
| Linux aarch64 | no | no reported consumer yet, same reasoning as the Python matrix's musllinux gap |
| Windows x86_64 | no | no reported consumer yet; `ae-core` itself is platform-neutral, so this is a CI-job addition, not a portability problem |
| Android (arm64-v8a, armeabi-v7a, x86_64) | no | needs the Android NDK cross-compile toolchain and a device or emulator to prove the artifact loads — not attempted this row |
| iOS (arm64, simulator) | no | needs Xcode and a macOS host with the Apple toolchain — not attempted this row |

Mobile is the actual target for a `flutter_rust_bridge` binding and it is
also the platform this row did not reach — flagged rather than assumed.
Platform artifacts, not the FFI boundary itself, are the long pole for this
binding mechanism.

## Usage

```dart
import 'package:ae_core/ae_core.dart' as core;

Future<void> main() async {
  await core.RustLib.init(); // once, before touching anything else below

  final key = core.SecretKey.generate();
  final recipient = core.SecretKey.generate().address();

  final params = core.TxParams(tag: core.Tag.spendTx);
  params.set_(key: 'senderId', value: core.Value.encoded(value: key.address()));
  params.set_(key: 'recipientId', value: core.Value.encoded(value: recipient));
  params.set_(
      key: 'amount',
      value: core.Value.uint(value: BigInt.parse('1000000000000000000')));
  params.set_(
      key: 'fee', value: core.Value.uint(value: BigInt.from(16660000000000)));
  params.set_(key: 'nonce', value: core.Value.uint(value: BigInt.one));

  final tx = core.buildTx(params: params);
  assert(tx.startsWith('tx_'));

  final rlp = core.buildTxRlp(params: params);
  final signature = key.signTransaction(
      transaction: rlp, networkId: core.networkIdTestnet(), inner: false);

  final signed = core.TxParams(tag: core.Tag.signedTx);
  signed.set_(
      key: 'signatures',
      value: core.Value.list(
          values: [core.Value.bytes(value: signature.toBytes())]));
  signed.set_(key: 'encodedTx', value: core.Value.encoded(value: tx));
  final signedTx = core.buildTx(params: signed);
}
```

Run the full walkthrough, including pricing a `ContractCallTx`, with
`dart run example/main.dart` after the build step above.

`set_`/`get_` carry a trailing underscore — `set`/`get` collide with names
`flutter_rust_bridge` reserves on the generated opaque wrapper, same reason a
few Rust standard-library methods land as `_` variants in bindgen output
elsewhere.

`u64` fields (`Value.uint`, amounts, nonces, fees, gas) take a Dart `BigInt`,
not `int` — the safe default across this FFI boundary for a value that can
exceed what fits in a signed 64-bit `int` on every Dart platform, web
included. `Value.uintStr` still exists for values wider than `u64`, same as
Python.

## Computing the minimum fee

`minimumTransactionFee` forwards `ae_core::fee`'s joined entry point rather
than this binding hand-writing a `RebuildTx` bridge — the ABI a contract call
is priced at is read off the byte `buildTx` will actually serialise, not off
whether the caller's `TxParams` happens to carry an explicit `abiVersion`:

```dart
final call = core.TxParams(tag: core.Tag.contractCallTx);
call.set_(key: 'callerId', value: core.Value.encoded(value: callerAddress));
call.set_(key: 'nonce', value: core.Value.uint(value: BigInt.one));
call.set_(key: 'contractId', value: core.Value.encoded(value: contractAddress));
call.set_(key: 'abiVersion', value: core.Value.uint(value: BigInt.from(3)));
call.set_(key: 'amount', value: core.Value.uint(value: BigInt.zero));
call.set_(key: 'gasLimit', value: core.Value.uint(value: BigInt.from(25000)));
call.set_(key: 'gasPrice', value: core.Value.uint(value: BigInt.from(1000000000)));
call.set_(key: 'callData', value: core.Value.encoded(value: callData));

final fee = core.minimumTransactionFee(params: call); // a decimal string, in aettos
call.set_(key: 'fee', value: core.Value.uint(value: BigInt.parse(fee)));
```

Returned as a decimal `String` rather than a Dart `int`, for the same reason
`u64` fields take `BigInt`: the minimum fee can exceed 64 bits. Throws when
`gasLimit` is absent on a contract transaction (no default is invented) and
when an oracle ttl is given as an absolute block height (convert it to a
delta first — this function does not look up the current height).

## What is, and is not, bound

The surface mirrors `ae_core::tx::Value`'s eight shapes, `TxParams`, the
address/signing operations in `ae_core::keys`, and the fee model's joined
entry point, `ae_core::fee::minimum_transaction_fee` — what a caller needs to
build, price and sign a transaction. It does not mirror `mpt`, `protocol`'s
internals, or `aens`'s hashing directly; nothing here reaches for a type the
crate doc calls out as an implementation detail. `TxGasInputs`, `RebuildTx`
and `calculate_min_fee` stay unmirrored too — that seam is for a caller who
wants to drive the fixed point itself (an absolute oracle ttl it can resolve
against a node, say), and this binding does not hand-write it. `ae-fate` (the
Sophia ABI) is not wrapped yet, same as Python — no vector in the
differential corpus needs it, since contract call data arrives pre-encoded
as a `cb_...` string either way.

`PublicKey.verifyTransaction` accepts either payload a node accepts: the
transaction's hash under the network id, which is what this library signs,
and the transaction itself under the network id, which the node's own
state-channel FSM signs. Both still carry the network id and the `inner`
flag, so a signature does not carry across a network or across the inner
boundary. Signing is unaffected — `SecretKey.signTransaction` emits the
hashed payload only.

## Testing against the reference corpus

`test/vectors_test.dart` builds every case in
`crates/ae-core/tests/vectors/transactions.json` — the same 41-case corpus
`bindings/python/tests/test_vectors.py` runs, generated by
`@aeternity/aepp-sdk` 14.1.1 — through this binding and asserts byte-for-byte
equality with the reference `tx_...` string, then round-trips each through
`unpackTx`/`buildTx`. Run it with `dart test` after the build step above.

`test/fee_test.dart` has one test per parameter `minimumTransactionFee`
mirrors, checked against fees computed independently of that function — from
the Ceres constants in `crates/ae-core/src/protocol.rs` and this binding's
own `buildTxRlp` for real serialised sizes, never a second call into the
function under test. The omitted-`abiVersion` and unrecognised-`abiVersion`
cases are pinned to their own reference fees directly (not asserted equal to
a sibling arm) — the Technical Lead's review note on the Python mirror: an
equality-with-a-sibling assertion moves when both arms move together and is
anchored only transitively, so it can pass while the parameter it is meant
to check has silently stopped being threaded through.
