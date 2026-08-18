//! Behaviour the vector corpus cannot express: nested parameter records, the
//! signing path end to end, and the seams this crate deliberately leaves open.

use ae_core::encoding::{decode, encode, Encoding};
use ae_core::keys::{SecretKey, TxPosition, NETWORK_ID_TESTNET};
use ae_core::tx::{
    build_tx, build_tx_rlp, unpack_tx, unpack_tx_as, BuildOptions, Tag, TxParams, Value,
};
use ae_core::Error;

/// RFC 8032 §7.1 test 1. A published test vector, not key material.
const TEST_SEED: [u8; 32] = [
    0x9d, 0x61, 0xb1, 0x9d, 0xef, 0xfd, 0x5a, 0x60, 0xba, 0x84, 0x4a, 0xf4, 0x92, 0xec, 0x2c, 0xc4,
    0x44, 0x49, 0xc5, 0x69, 0x7b, 0x32, 0x69, 0x19, 0x70, 0x3b, 0xac, 0x03, 0x1c, 0xae, 0x7f, 0x60,
];

fn address(byte: u8) -> String {
    encode(&[byte; 32], Encoding::AccountAddress).unwrap()
}

fn spend() -> TxParams {
    TxParams::new(Tag::SpendTx)
        .with("senderId", address(1).as_str())
        .with("recipientId", address(2).as_str())
        .with("amount", 1u64)
        .with("fee", 16_660_000_000_000u64)
        .with("nonce", 1u64)
}

#[test]
fn a_nested_parameter_record_builds_the_same_as_a_pre_encoded_one() {
    let inner = spend();
    let encoded_inner = build_tx(&inner).unwrap();

    let from_params = build_tx(
        &TxParams::new(Tag::SignedTx)
            .with(
                "signatures",
                Value::List(vec![Value::Bytes(vec![0xab; 64])]),
            )
            .with("encodedTx", inner),
    )
    .unwrap();

    let from_string = build_tx(
        &TxParams::new(Tag::SignedTx)
            .with(
                "signatures",
                Value::List(vec![Value::Bytes(vec![0xab; 64])]),
            )
            .with("encodedTx", encoded_inner.as_str()),
    )
    .unwrap();

    assert_eq!(from_params, from_string);
}

#[test]
fn a_nested_transaction_unpacks_to_a_nested_record() {
    let signed = build_tx(
        &TxParams::new(Tag::SignedTx)
            .with(
                "signatures",
                Value::List(vec![Value::Bytes(vec![0xab; 64])]),
            )
            .with("encodedTx", spend()),
    )
    .unwrap();

    let unpacked = unpack_tx_as(&signed, Tag::SignedTx).unwrap();
    let inner = unpacked.get("encodedTx").unwrap().as_tx().unwrap();
    assert_eq!(inner.tag(), Tag::SpendTx);
    assert_eq!(inner.get("amount").unwrap().as_u64(), Some(1));
    assert_eq!(
        inner.get("senderId").unwrap().as_encoded(),
        Some(address(1).as_str())
    );
}

#[test]
fn unpack_as_rejects_the_wrong_tag() {
    let tx = build_tx(&spend()).unwrap();
    assert!(matches!(
        unpack_tx_as(&tx, Tag::SignedTx),
        Err(Error::UnexpectedTag { .. })
    ));
}

#[test]
fn a_signature_covers_the_transaction_and_the_network() {
    let options = BuildOptions::default();
    let rlp = build_tx_rlp(&spend(), &options).unwrap();
    let key = SecretKey::from_seed(TEST_SEED);
    let address = key.to_address().unwrap();

    let signature = key.sign_transaction(&rlp, NETWORK_ID_TESTNET, TxPosition::Outer);
    assert!(key.public_key().verify_transaction(
        &rlp,
        NETWORK_ID_TESTNET,
        TxPosition::Outer,
        &signature
    ));
    assert_eq!(
        ae_core::keys::PublicKey::from_address(&address).unwrap(),
        key.public_key()
    );

    // The signed transaction is an ordinary SignedTx around the same bytes.
    let signed = build_tx(
        &TxParams::new(Tag::SignedTx)
            .with(
                "signatures",
                Value::List(vec![Value::Bytes(signature.as_bytes().to_vec())]),
            )
            .with("encodedTx", Value::Bytes(rlp.clone())),
    )
    .unwrap();
    let unpacked = unpack_tx(&signed).unwrap();
    assert_eq!(
        unpacked.get("signatures").unwrap(),
        &Value::List(vec![Value::Bytes(signature.as_bytes().to_vec())])
    );
    assert_eq!(
        build_tx_rlp(
            unpacked.get("encodedTx").unwrap().as_tx().unwrap(),
            &options
        )
        .unwrap(),
        rlp
    );
}

#[test]
fn a_transaction_hash_is_the_hash_of_the_rlp_not_of_the_string() {
    let tx = build_tx(&spend()).unwrap();
    let hash = ae_core::tx::transaction_hash(&tx).unwrap();
    assert!(hash.starts_with("th_"));
    assert_eq!(
        decode(&hash).unwrap(),
        ae_core::hash::blake2b_256(&decode(&tx).unwrap())
    );
}

#[test]
fn an_absent_fee_names_the_model_that_owns_it() {
    let mut params = TxParams::new(Tag::SpendTx)
        .with("senderId", address(1).as_str())
        .with("recipientId", address(2).as_str())
        .with("amount", 1u64)
        .with("nonce", 1u64);
    assert!(matches!(
        build_tx(&params),
        Err(Error::ModelRequired {
            field: "fee",
            model: "fee"
        })
    ));

    // …and an explicit fee builds, so nothing is blocked on that model landing.
    params.set("fee", 16_660_000_000_000u64);
    assert!(build_tx(&params).is_ok());
}

#[test]
fn a_missing_required_field_names_the_field() {
    let params = TxParams::new(Tag::SpendTx).with("senderId", address(1).as_str());
    assert_eq!(build_tx(&params), Err(Error::MissingField("recipientId")));
}

#[test]
fn an_address_in_a_position_that_does_not_accept_it_is_rejected() {
    let params = spend().with(
        "senderId",
        encode(&[1; 32], Encoding::Channel).unwrap().as_str(),
    );
    assert!(matches!(build_tx(&params), Err(Error::FieldValue { .. })));
}

#[test]
fn a_name_may_be_given_instead_of_a_name_id() {
    let by_name = build_tx(
        &TxParams::new(Tag::NameRevokeTx)
            .with("accountId", address(1).as_str())
            .with("nonce", 1u64)
            .with("nameId", Value::Text("test.chain".into()))
            .with("fee", 16_620_000_000_000u64),
    )
    .unwrap();
    let by_id = build_tx(
        &TxParams::new(Tag::NameRevokeTx)
            .with("accountId", address(1).as_str())
            .with("nonce", 1u64)
            .with(
                "nameId",
                ae_core::aens::produce_name_id("test.chain")
                    .unwrap()
                    .as_str(),
            )
            .with("fee", 16_620_000_000_000u64),
    )
    .unwrap();
    assert_eq!(by_name, by_id);
}

#[test]
fn a_ga_attach_nonce_must_be_one() {
    let base = TxParams::new(Tag::GaAttachTx)
        .with("ownerId", address(1).as_str())
        .with(
            "code",
            encode(&[0xca, 0xfe], Encoding::ContractBytearray)
                .unwrap()
                .as_str(),
        )
        .with("authFun", Value::Bytes(vec![9; 32]))
        .with("fee", 78_500_000_000_000u64)
        .with("gasLimit", 1000u64)
        .with(
            "callData",
            encode(&[0xca, 0xfe], Encoding::ContractBytearray)
                .unwrap()
                .as_str(),
        );
    assert!(build_tx(&base.clone().with("nonce", 1u64)).is_ok());
    assert!(matches!(
        build_tx(&base.with("nonce", 2u64)),
        Err(Error::FieldValue { field: "nonce", .. })
    ));
}

#[test]
fn a_contract_deposit_must_be_zero() {
    let base = TxParams::new(Tag::ContractCreateTx)
        .with("ownerId", address(1).as_str())
        .with("nonce", 1u64)
        .with(
            "code",
            encode(&[0xca, 0xfe], Encoding::ContractBytearray)
                .unwrap()
                .as_str(),
        )
        .with("fee", 78_500_000_000_000u64)
        .with("amount", 0u64)
        .with("gasLimit", 76u64)
        .with(
            "callData",
            encode(&[0xca, 0xfe], Encoding::ContractBytearray)
                .unwrap()
                .as_str(),
        );
    assert!(build_tx(&base.clone()).is_ok());
    assert!(matches!(
        build_tx(&base.with("deposit", 1u64)),
        Err(Error::FieldValue {
            field: "deposit",
            ..
        })
    ));
}

#[test]
fn a_raw_pointer_needs_name_update_version_two() {
    let raw = encode(b"hello", Encoding::Bytearray).unwrap();
    let params = TxParams::new(Tag::NameUpdateTx)
        .with("accountId", address(1).as_str())
        .with("nonce", 1u64)
        .with("nameId", Value::Text("test.chain".into()))
        .with(
            "pointers",
            Value::Pointers(vec![ae_core::tx::Pointer {
                key: "raw".into(),
                id: raw,
            }]),
        )
        .with("fee", 17_800_000_000_000u64);
    assert!(matches!(
        build_tx(&params.clone()),
        Err(Error::FieldValue {
            field: "pointers",
            ..
        })
    ));
    assert!(build_tx(&params.with_version(2)).is_ok());
}

#[test]
fn a_gas_price_below_the_protocol_minimum_is_rejected() {
    let params = TxParams::new(Tag::ContractCallTx)
        .with("callerId", address(1).as_str())
        .with("nonce", 1u64)
        .with(
            "contractId",
            encode(&[3; 32], Encoding::ContractAddress)
                .unwrap()
                .as_str(),
        )
        .with("fee", 182_000_000_000_000u64)
        .with("amount", 0u64)
        .with("gasLimit", 25_000u64)
        .with("gasPrice", 1u64)
        .with(
            "callData",
            encode(&[0xca, 0xfe], Encoding::ContractBytearray)
                .unwrap()
                .as_str(),
        );
    assert!(matches!(
        build_tx(&params),
        Err(Error::FieldValue {
            field: "gasPrice",
            ..
        })
    ));
}

#[test]
fn a_record_with_the_wrong_number_of_fields_is_rejected() {
    // Drop a SpendTx's last field, keeping the RLP itself well-formed.
    let tx = build_tx(&spend()).unwrap();
    let mut items = match ae_core::rlp::decode(&decode(&tx).unwrap()).unwrap() {
        ae_core::rlp::Item::List(items) => items,
        other => panic!("expected a list, got {other:?}"),
    };
    items.pop().expect("a spend has fields");
    let truncated = ae_core::rlp::encode(&ae_core::rlp::Item::List(items));
    assert!(matches!(
        ae_core::tx::unpack_tx_rlp(&truncated),
        Err(Error::RecordLength { .. })
    ));
}
