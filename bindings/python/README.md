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

params = core.TxParams(12)  # SpendTx
params.set("senderId", core.Value.encoded(key.address()))
params.set("recipientId", core.Value.encoded(recipient))
params.set("amount", core.Value.uint(1_000_000_000_000_000_000))
params.set("fee", core.Value.uint(16_660_000_000_000))
params.set("nonce", core.Value.uint(1))

tx = core.build_tx(params)
assert tx.startswith("tx_")

rlp = core.build_tx_rlp(params)
signature = key.sign_transaction(rlp, core.NETWORK_ID_TESTNET)

signed = core.TxParams(11)  # SignedTx
signed.set("signatures", core.Value.list([core.Value.bytes(signature.to_bytes())]))
signed.set("encodedTx", core.Value.encoded(tx))
signed_tx = core.build_tx(signed)
```

## What is, and is not, bound

The surface mirrors `ae_core::tx::Value`'s eight shapes, `TxParams`, and the
address/signing operations in `ae_core::keys` — what a caller needs to build
and sign a transaction. It does not mirror `mpt`, `protocol`'s internals, or
`aens`'s hashing directly; nothing here reaches for a type the crate doc calls
out as an implementation detail. `ae-fate` (the Sophia ABI) is not wrapped
yet — no vector in the differential corpus needs it, since contract call data
arrives pre-encoded as a `cb_...` string either way.

## Testing against the reference corpus

`tests/test_vectors.py` builds every case in
`crates/ae-core/tests/vectors/transactions.json` — 40 transactions generated
by `@aeternity/aepp-sdk` 14.1.1 — through this binding and asserts byte-for-byte
equality with the reference `tx_...` string, then round-trips each through
`unpack_tx`/`build_tx`. Run it with `pytest` after `maturin develop`.
