"""Per-parameter proof for `minimum_transaction_fee` — the joined fee-model
mirror this binding forwards rather than reimplements.

A declared-but-unused parameter and a correctly threaded one produce the same
signature and the same green build; only a test that actually varies the
value and checks the resulting fee tells them apart. Each test below exists
for exactly one mirrored parameter and fails if that parameter stops being
threaded through to `ae_core::fee::minimum_transaction_fee`.

The expected fees are computed independently of `minimum_transaction_fee`
itself, from the published Ceres constants in `crates/ae-core/src/protocol.rs`
(`base_gas`, `gas_per_byte`, `min_gas_price`) and this binding's own
`build_tx_rlp`, which measures real serialised bytes rather than a guessed
size — `reference_minimum_fee` below runs the same fixed-point iteration the
crate does, but against those constants, not against the function under
test. `bindings/wasm-js/pipeline.test.ts` pins the same ABI table the same
way, at the lower-level `estimate-gas` primitive that binding exposes and
this one deliberately does not — Python mirrors the joined entry point only,
so the reference here drives the fixed point itself instead of reading a
`size` argument off a call this binding has no equivalent of.
"""

import ae_core as core

BASE_GAS = 15_000
GAS_PER_BYTE = 20
MIN_GAS_PRICE = 1_000_000_000

SENDER = "ak_SeLqn3UAUoRymWmwW7axrzJK7JfNaBR2cHCryA6cFsgFkHEF"
CONTRACT = "ct_2Kw2XL8QVSQHwJYKpWLktaxtwKuz7iYF5pqcauUHpmcvhHUVd"
BYTEARRAY = "cb_yv6aT3/a"


def reference_minimum_fee(build, multiplier_num, multiplier_den, inner_size=0):
    """Independently converge the same size/fee fixed point `ae_core::fee`
    converges, using this binding's own serialiser for real byte counts and
    the Ceres constants for the gas formula — never a second call into
    `minimum_transaction_fee`.
    """
    fee = 0
    for _ in range(64):
        size = len(core.build_tx_rlp(build(fee)))
        gas_size = max(0, size - inner_size) * GAS_PER_BYTE
        gas = (BASE_GAS * multiplier_num // multiplier_den) + gas_size
        next_fee = gas * MIN_GAS_PRICE
        if next_fee == fee:
            return fee
        fee = next_fee
    raise AssertionError("reference fixed point did not converge")


def contract_call(fee=None, abi=3, omit_abi=False):
    params = core.TxParams(core.Tag.CONTRACT_CALL_TX)
    params.set("callerId", core.Value.encoded(SENDER))
    params.set("nonce", core.Value.uint(10))
    params.set("contractId", core.Value.encoded(CONTRACT))
    if not omit_abi:
        params.set("abiVersion", core.Value.uint(abi))
    params.set("amount", core.Value.uint(0))
    params.set("gasLimit", core.Value.uint(25_000))
    params.set("gasPrice", core.Value.uint(1_000_000_000))
    params.set("callData", core.Value.encoded(BYTEARRAY))
    if fee is not None:
        params.set("fee", core.Value.uint(fee))
    return params


def contract_create(fee=None, abi=3):
    params = core.TxParams(core.Tag.CONTRACT_CREATE_TX)
    params.set("ownerId", core.Value.encoded(SENDER))
    params.set("nonce", core.Value.uint(9))
    params.set("code", core.Value.encoded(BYTEARRAY))
    params.set("ctVersion", core.Value.ct_version(8, abi))
    params.set("deposit", core.Value.uint(0))
    params.set("amount", core.Value.uint(0))
    params.set("gasLimit", core.Value.uint(76))
    params.set("gasPrice", core.Value.uint(1_000_000_000))
    params.set("callData", core.Value.encoded(BYTEARRAY))
    if fee is not None:
        params.set("fee", core.Value.uint(fee))
    return params


def ga_attach(fee=None, abi=3):
    params = core.TxParams(core.Tag.GA_ATTACH_TX)
    params.set("ownerId", core.Value.encoded(SENDER))
    params.set("nonce", core.Value.uint(1))
    params.set("code", core.Value.encoded(BYTEARRAY))
    params.set("authFun", core.Value.bytes(bytes.fromhex("09" * 34)))
    params.set("ctVersion", core.Value.ct_version(8, abi))
    params.set("gasLimit", core.Value.uint(1_000))
    params.set("gasPrice", core.Value.uint(1_000_000_000))
    params.set("callData", core.Value.encoded(BYTEARRAY))
    if fee is not None:
        params.set("fee", core.Value.uint(fee))
    return params


def signed_spend():
    """A minimal `SignedTx` wrapping a `SpendTx`, for `GaMetaTx.tx`. The
    signature never has to verify against anything on chain here — the fee
    model prices bytes, not validity.
    """
    sender = core.SecretKey.generate()
    recipient = core.SecretKey.generate()
    spend = core.TxParams(core.Tag.SPEND_TX)
    spend.set("senderId", core.Value.encoded(sender.address()))
    spend.set("recipientId", core.Value.encoded(recipient.address()))
    spend.set("amount", core.Value.uint(1))
    spend.set("fee", core.Value.uint(16_660_000_000_000))
    spend.set("nonce", core.Value.uint(1))
    tx = core.build_tx(spend)
    signature = sender.sign_transaction(
        core.build_tx_rlp(spend), core.NETWORK_ID_TESTNET
    )
    signed = core.TxParams(core.Tag.SIGNED_TX)
    signed.set(
        "signatures", core.Value.list([core.Value.bytes(signature.to_bytes())])
    )
    signed.set("encodedTx", core.Value.encoded(tx))
    return signed, sender


def ga_meta(signed, sender, fee=None, abi=3, omit_abi=False):
    params = core.TxParams(core.Tag.GA_META_TX)
    params.set("gaId", core.Value.encoded(sender.address()))
    params.set("authData", core.Value.encoded(BYTEARRAY))
    if not omit_abi:
        params.set("abiVersion", core.Value.uint(abi))
    params.set("gasLimit", core.Value.uint(1_000))
    params.set("gasPrice", core.Value.uint(1_000_000_000))
    params.set("tx", core.Value.tx(signed))
    if fee is not None:
        params.set("fee", core.Value.uint(fee))
    return params


# ---------------------------------------------------------------------------
# ContractCallTx: the one tag whose multiplier moves with the ABI.
# ---------------------------------------------------------------------------


def test_contract_call_prices_the_fate_abi_at_12x_base_gas():
    expected = reference_minimum_fee(lambda fee: contract_call(fee, abi=3), 12, 1)
    assert core.minimum_transaction_fee(contract_call(abi=3)) == expected


def test_contract_call_prices_a_non_fate_abi_at_30x_base_gas():
    expected = reference_minimum_fee(lambda fee: contract_call(fee, abi=1), 30, 1)
    assert core.minimum_transaction_fee(contract_call(abi=1)) == expected


def test_contract_call_omitted_abi_defaults_to_the_wire_byte_not_the_dear_arm():
    """`abiVersion` is required by the schema but has a wire default, and on
    Ceres that default is FATE. A hand-written `RebuildTx` bridge that read
    `TxGasInputs.abi_version` as `None` for an omitted field would take the
    30x arm here — 2.5x too high, and never rejected, because a fee above the
    minimum is always accepted. This is the exact defect the joined function
    exists to close: it reads the byte the wire will actually serialise.
    """
    fate = core.minimum_transaction_fee(contract_call(abi=3))
    omitted = core.minimum_transaction_fee(contract_call(omit_abi=True))
    assert omitted == fate


def test_contract_call_unrecognised_abi_takes_the_dear_arm():
    non_fate = core.minimum_transaction_fee(contract_call(abi=1))
    unrecognised = core.minimum_transaction_fee(contract_call(abi=99))
    assert unrecognised == non_fate


# ---------------------------------------------------------------------------
# ContractCreateTx, GaAttachTx, GaMetaTx: 5x on every arm, unmoved by the ABI.
# ---------------------------------------------------------------------------


def test_contract_create_is_priced_flat_at_5x_base_gas_regardless_of_abi():
    expected = reference_minimum_fee(lambda fee: contract_create(fee, abi=3), 5, 1)
    for abi in (3, 1, 99, 0):
        assert core.minimum_transaction_fee(contract_create(abi=abi)) == expected


def test_ga_attach_is_priced_flat_at_5x_base_gas_regardless_of_abi():
    expected = reference_minimum_fee(lambda fee: ga_attach(fee, abi=3), 5, 1)
    for abi in (3, 1, 99, 0):
        assert core.minimum_transaction_fee(ga_attach(abi=abi)) == expected


def test_ga_meta_is_priced_flat_at_5x_base_gas_regardless_of_abi():
    # One fixed wrapped tx shared across every arm below: the wrapper's own
    # bytes must stay identical so a fee difference could only come from the
    # multiplier this test is checking, not from re-randomised key material.
    signed, sender = signed_spend()
    inner_size = len(core.build_tx_rlp(signed))
    expected = reference_minimum_fee(
        lambda fee: ga_meta(signed, sender, fee, abi=3), 5, 1, inner_size=inner_size
    )
    for abi in (3, 1, 99):
        actual = core.minimum_transaction_fee(ga_meta(signed, sender, abi=abi))
        assert actual == expected
    omitted = core.minimum_transaction_fee(ga_meta(signed, sender, omit_abi=True))
    assert omitted == expected


# ---------------------------------------------------------------------------
# Errors the joined function surfaces rather than papering over.
# ---------------------------------------------------------------------------


def test_missing_gas_limit_on_a_contract_call_errors_rather_than_defaulting():
    params = core.TxParams(core.Tag.CONTRACT_CALL_TX)
    params.set("callerId", core.Value.encoded(SENDER))
    params.set("nonce", core.Value.uint(10))
    params.set("contractId", core.Value.encoded(CONTRACT))
    params.set("abiVersion", core.Value.uint(3))
    params.set("amount", core.Value.uint(0))
    params.set("gasPrice", core.Value.uint(1_000_000_000))
    params.set("callData", core.Value.encoded(BYTEARRAY))
    try:
        core.minimum_transaction_fee(params)
    except ValueError:
        pass
    else:
        raise AssertionError("expected a ValueError for the missing gasLimit")


def test_an_absolute_oracle_ttl_errors_rather_than_being_priced_wrong():
    params = core.TxParams(core.Tag.ORACLE_REGISTER_TX)
    params.set("accountId", core.Value.encoded(SENDER))
    params.set("nonce", core.Value.uint(1))
    params.set("queryFormat", core.Value.text("string"))
    params.set("responseFormat", core.Value.text("string"))
    params.set("queryFee", core.Value.uint(0))
    params.set("oracleTtlType", core.Value.uint(1))  # absolute (block) ttl
    params.set("oracleTtlValue", core.Value.uint(500))
    params.set("abiVersion", core.Value.uint(0))
    try:
        core.minimum_transaction_fee(params)
    except ValueError:
        pass
    else:
        raise AssertionError("expected a ValueError for the absolute oracle ttl")
