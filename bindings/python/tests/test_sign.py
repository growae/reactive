"""One real end-to-end example: build and sign a spend transaction from
Python, then verify it locally — the thing a wallet-less caller actually
does with this binding.
"""

import ae_core as core


def test_build_sign_and_verify_a_spend_transaction():
    sender = core.SecretKey.generate()
    recipient = core.SecretKey.generate()

    params = core.TxParams(core.Tag.SPEND_TX)
    params.set("senderId", core.Value.encoded(sender.address()))
    params.set("recipientId", core.Value.encoded(recipient.address()))
    params.set("amount", core.Value.uint(1_000_000_000_000_000_000))
    params.set("fee", core.Value.uint(16_660_000_000_000))
    params.set("nonce", core.Value.uint(1))

    tx = core.build_tx(params)
    assert tx.startswith("tx_")
    assert core.unpack_tx(tx).tag == core.Tag.SPEND_TX

    rlp = core.build_tx_rlp(params)
    signature = sender.sign_transaction(rlp, core.NETWORK_ID_TESTNET)

    assert sender.public_key().verify_transaction(
        rlp, core.NETWORK_ID_TESTNET, signature
    )
    # A signature is bound to its network id...
    assert not sender.public_key().verify_transaction(
        rlp, core.NETWORK_ID_MAINNET, signature
    )
    # ...and to the outer/inner boundary.
    assert not sender.public_key().verify_transaction(
        rlp, core.NETWORK_ID_TESTNET, signature, inner=True
    )

    signed = core.TxParams(core.Tag.SIGNED_TX)
    signed.set(
        "signatures", core.Value.list([core.Value.bytes(signature.to_bytes())])
    )
    signed.set("encodedTx", core.Value.encoded(tx))
    signed_tx = core.build_tx(signed)
    assert signed_tx.startswith("tx_")

    unpacked = core.unpack_tx(signed_tx)
    assert unpacked.tag == core.Tag.SIGNED_TX
    # `encodedTx` round-trips as a nested `TxParams` (`Value.tx`), not the
    # `tx_...` string it was built from — `Value.encoded` and `Value.tx`
    # serialise to the same bytes, but unpacking always recovers the latter.
    assert core.build_tx(unpacked.get("encodedTx").as_tx()) == tx

    tx_hash = core.transaction_hash(signed_tx)
    assert tx_hash.startswith("th_")


def test_secret_key_round_trips_through_its_encoding():
    key = core.SecretKey.generate()
    encoded = key.to_encoded()
    assert encoded.startswith("sk_")
    reparsed = core.SecretKey.from_encoded(encoded)
    assert reparsed.address() == key.address()


def test_secret_key_does_not_print_its_seed():
    key = core.SecretKey.generate()
    assert key.address() in repr(key)
    assert key.to_encoded() not in repr(key)
