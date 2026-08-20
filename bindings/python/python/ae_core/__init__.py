"""aeternity protocol primitives: transaction serialisation, addresses, signing.

Bytes in, bytes out. There is no node HTTP client here, no async and no
retries — this is the `ae-core` Rust crate through PyO3, native rather than
WASM, and it wraps only what a caller building and signing a transaction
needs. See the ``Value`` and ``TxParams`` classes for the full field-level
surface.
"""

from ._ae_core import (
    NETWORK_ID_MAINNET,
    NETWORK_ID_TESTNET,
    PublicKey,
    SecretKey,
    Signature,
    TxParams,
    Value,
    build_tx,
    build_tx_rlp,
    transaction_hash,
    unpack_tx,
    unpack_tx_as,
)

__all__ = [
    "NETWORK_ID_MAINNET",
    "NETWORK_ID_TESTNET",
    "PublicKey",
    "SecretKey",
    "Signature",
    "TxParams",
    "Value",
    "build_tx",
    "build_tx_rlp",
    "transaction_hash",
    "unpack_tx",
    "unpack_tx_as",
]
