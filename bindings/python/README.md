# ae-core (Python)

A native [PyO3](https://pyo3.rs) binding over `ae-core`'s protocol primitives:
transaction serialisation, addresses and Ed25519 signing. Bytes in, bytes
out — there is no node HTTP client here, no async and no retries. Those
belong to a caller's own ergonomics layer, in Python's own idiom, not to this
crate.

Native, not WASM: PyO3 binds the Rust core directly and never reads the WIT
file the browser binding is generated from, so this package is independent of
that pipeline. See `crates/README.md` for the shape of `ae-core` itself.

## Install (from source, for now)

Nothing here is published to PyPI. Build a wheel locally:

```sh
pip install maturin
maturin build --release
pip install target/wheels/ae_core-*.whl
```

or, for local iteration inside a virtualenv:

```sh
maturin develop --release
```

## CI wheel matrix (`.github/workflows/python-bindings.yml`)

Built with `abi3-py39`: one wheel per platform is loadable by every CPython
3.9 and later, so the matrix is OS × arch, not OS × CPython minor.

| Platform | Built | Why |
|---|---|---|
| Linux x86_64 (manylinux) | yes | |
| Linux aarch64 (manylinux) | yes | |
| macOS x86_64 | yes | |
| macOS arm64 | yes | |
| Linux musllinux (Alpine) | no | no reported consumer yet; add on request, same `maturin-action` job with `manylinux: musllinux_1_2` |
| Windows x86_64 | no | no reported consumer yet; `ae-core` itself is platform-neutral, so this is a CI-job addition, not a portability problem |
| Linux x86 (32-bit), Windows arm64 | no | no realistic caller on either target |

Nothing here is published to PyPI or TestPyPI — the `Build` job uploads wheels
as workflow artifacts for inspection, and stops there.

## Usage

```python
import ae_core as core

key = core.SecretKey.generate()
recipient = core.SecretKey.generate().address()

params = core.TxParams(core.Tag.SPEND_TX)
params.set("senderId", core.Value.encoded(key.address()))
params.set("recipientId", core.Value.encoded(recipient))
params.set("amount", core.Value.uint(1_000_000_000_000_000_000))
params.set("fee", core.Value.uint(16_660_000_000_000))
params.set("nonce", core.Value.uint(1))

tx = core.build_tx(params)
assert tx.startswith("tx_")

rlp = core.build_tx_rlp(params)
signature = key.sign_transaction(rlp, core.NETWORK_ID_TESTNET)

signed = core.TxParams(core.Tag.SIGNED_TX)
signed.set("signatures", core.Value.list([core.Value.bytes(signature.to_bytes())]))
signed.set("encodedTx", core.Value.encoded(tx))
signed_tx = core.build_tx(signed)
```

## Computing the minimum fee

`minimum_transaction_fee` forwards `ae_core::fee`'s joined entry point rather
than this binding hand-writing a `RebuildTx` bridge — the ABI a contract call
is priced at is read off the byte `build_tx` will actually serialise, not off
whether the caller's `TxParams` happens to carry an explicit `abiVersion`:

```python
params = core.TxParams(core.Tag.CONTRACT_CALL_TX)
params.set("callerId", core.Value.encoded(caller_address))
params.set("nonce", core.Value.uint(1))
params.set("contractId", core.Value.encoded(contract_address))
params.set("abiVersion", core.Value.uint(3))
params.set("amount", core.Value.uint(0))
params.set("gasLimit", core.Value.uint(25_000))
params.set("gasPrice", core.Value.uint(1_000_000_000))
params.set("callData", core.Value.encoded(call_data))

fee = core.minimum_transaction_fee(params)  # an int, in aettos
params.set("fee", core.Value.uint(fee))
```

Raises `ValueError` when `gasLimit` is absent on a contract transaction (no
default is invented) and when an oracle ttl is given as an absolute block
height (convert it to a delta first — this function does not look up the
current height).

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
Sophia ABI) is not wrapped yet — no vector in the differential corpus needs
it, since contract call data arrives pre-encoded as a `cb_...` string either
way.

## Testing against the reference corpus

`tests/test_vectors.py` builds every case in
`crates/ae-core/tests/vectors/transactions.json` — 40 transactions generated
by `@aeternity/aepp-sdk` 14.1.1 — through this binding and asserts byte-for-byte
equality with the reference `tx_...` string, then round-trips each through
`unpack_tx`/`build_tx`. Run it with `pytest` after `maturin develop`.

`tests/test_fee.py` has one test per parameter `minimum_transaction_fee`
mirrors, checked against fees computed independently of that function —
from the Ceres constants in `crates/ae-core/src/protocol.rs` and this
binding's own `build_tx_rlp` for real serialised sizes, never a second call
into the function under test.
