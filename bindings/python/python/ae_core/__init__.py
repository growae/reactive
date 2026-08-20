"""aeternity protocol primitives: transaction serialisation, addresses, signing.

Bytes in, bytes out. There is no node HTTP client here, no async and no
retries — this is the `ae-core` Rust crate through PyO3, native rather than
WASM, and it wraps only what a caller building and signing a transaction
needs. See the ``Value`` and ``TxParams`` classes for the full field-level
surface.
"""

from enum import IntEnum

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
    minimum_transaction_fee,
    transaction_hash,
    unpack_tx,
    unpack_tx_as,
)


class Tag(IntEnum):
    """Every transaction tag the node serialises, with its on-chain numeric
    value — pure Python, no FFI, so it stays in step with
    ``ae_core::tx::Tag`` in the Rust crate by hand. Mirrors
    ``aeser_chain_objects.erl``; the numbers are protocol constants and are
    not consecutive.

    ``TxParams`` accepts any of these directly — ``TxParams(Tag.SPEND_TX)``
    reads the same as ``TxParams(12)``, since ``Tag`` is an ``int``.
    """

    SIGNED_TX = 11
    SPEND_TX = 12
    ORACLE_REGISTER_TX = 22
    ORACLE_QUERY_TX = 23
    ORACLE_RESPOND_TX = 24
    ORACLE_EXTEND_TX = 25
    NAME_CLAIM_TX = 32
    NAME_PRECLAIM_TX = 33
    NAME_UPDATE_TX = 34
    NAME_REVOKE_TX = 35
    NAME_TRANSFER_TX = 36
    CONTRACT_CREATE_TX = 42
    CONTRACT_CALL_TX = 43
    CHANNEL_CREATE_TX = 50
    CHANNEL_DEPOSIT_TX = 51
    CHANNEL_WITHDRAW_TX = 52
    CHANNEL_CLOSE_MUTUAL_TX = 53
    CHANNEL_CLOSE_SOLO_TX = 54
    CHANNEL_SLASH_TX = 55
    CHANNEL_SETTLE_TX = 56
    CHANNEL_OFF_CHAIN_TX = 57
    CHANNEL_SNAPSHOT_SOLO_TX = 59
    CHANNEL_FORCE_PROGRESS_TX = 521
    GA_ATTACH_TX = 80
    GA_META_TX = 81
    PAYING_FOR_TX = 82


__all__ = [
    "NETWORK_ID_MAINNET",
    "NETWORK_ID_TESTNET",
    "PublicKey",
    "SecretKey",
    "Signature",
    "Tag",
    "TxParams",
    "Value",
    "build_tx",
    "build_tx_rlp",
    "minimum_transaction_fee",
    "transaction_hash",
    "unpack_tx",
    "unpack_tx_as",
]
