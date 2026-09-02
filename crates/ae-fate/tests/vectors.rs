//! Cross-implementation vectors.
//!
//! Every case below is built twice: once here through this crate, and once in
//! `tests/vectors/generate.mjs` through `@aeternity/aepp-calldata` 1.9.1, the
//! JavaScript implementation the aeternity SDK depends on. The test asserts
//! that both produce the same bytes and that those bytes decode back to the
//! value.
//!
//! This is a fixed corpus, not the differential harness — it does not generate
//! inputs and it does not run the reference on every change. Regenerate it when
//! the reference version moves; see the header of `generate.mjs`.
//!
//! The `call/…` and `return/…` cases come from a different reference path to
//! the rest. They are generated through `AciContractCallEncoder`, the class
//! `@aeternity/aepp-sdk` drives from `Contract.$call`, from a contract ACI and
//! JavaScript-shaped arguments — so the reference, not the generator, decides
//! which wire type each Sophia type maps to. That is the surface
//! `packages/core` actually calls, and it is the half a vector written to match
//! this crate's own output could not be evidence about.

use ae_fate::{
    deserialize, deserialize_type, serialize, serialize_type, AddressKind, BytesSize, FateInt,
    FateType, FateValue,
};

const CORPUS: &str = include_str!("vectors/aepp-calldata-1.9.1.json");

const ADDRESS_A: [u8; 32] = [0xaa; 32];

fn address_b() -> Vec<u8> {
    (0u8..32).collect()
}

fn int(decimal: &str) -> FateValue {
    FateValue::Int(FateInt::parse_decimal(decimal).expect("decimal literal"))
}

fn bits(decimal: &str) -> FateValue {
    FateValue::Bits(FateInt::parse_decimal(decimal).expect("decimal literal"))
}

fn ints(count: i32) -> Vec<FateValue> {
    (0..count).map(FateValue::int).collect()
}

/// Reads the `{"name", "hex"}` pairs out of the corpus. The file's shape is
/// fixed by the generator, so this stays a scanner rather than a JSON parser
/// and the crate keeps its empty dependency list.
fn corpus() -> Vec<(String, Vec<u8>)> {
    let mut pairs = Vec::new();
    let mut name: Option<String> = None;
    for line in CORPUS.lines() {
        let line = line.trim();
        if let Some(value) = field(line, "\"name\":") {
            name = Some(value);
        } else if let Some(value) = field(line, "\"hex\":") {
            let hex = value;
            let bytes = (0..hex.len())
                .step_by(2)
                .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).expect("hex"))
                .collect();
            pairs.push((name.take().expect("name precedes hex"), bytes));
        }
    }
    assert!(!pairs.is_empty(), "corpus is empty");
    pairs
}

fn field(line: &str, key: &str) -> Option<String> {
    let rest = line.strip_prefix(key)?.trim();
    let rest = rest.strip_prefix('"')?;
    let end = rest.find('"')?;
    Some(rest[..end].to_string())
}

fn values() -> Vec<(&'static str, FateValue)> {
    vec![
        ("int/zero", int("0")),
        ("int/one", int("1")),
        ("int/minus-one", int("-1")),
        ("int/small-max", int("63")),
        ("int/small-min", int("-63")),
        ("int/small-boundary", int("64")),
        ("int/small-boundary-negative", int("-64")),
        ("int/byte-boundary", int("255")),
        ("int/two-bytes", int("256")),
        // 2^440 + 64 — the magnitude minus the bias is 56 bytes, one past the
        // point where RLP switches to a long form.
        (
            "int/rlp-length-boundary",
            int("2839213766779714416208296124562517712318911565184836172974571090549372219192960637992933791850638927971728600024477257552869537611840"),
        ),
        ("int/u64-overflow", int("18446744073709551616")),
        (
            "int/u256-max",
            int("115792089237316195423570985008687907853269984665640564039457584007913129639935"),
        ),
        (
            "int/negative-large",
            int("-340282366920938463463374607431768211456"),
        ),
        ("bool/true", FateValue::Bool(true)),
        ("bool/false", FateValue::Bool(false)),
        ("bits/zero", bits("0")),
        ("bits/positive", bits("11")),
        ("bits/negative", bits("-1")),
        ("bits/negative-large", bits("-255")),
        ("string/empty", FateValue::string("")),
        ("string/one-char", FateValue::string("a")),
        ("string/short-max", FateValue::string("a".repeat(63))),
        ("string/long-boundary", FateValue::string("a".repeat(64))),
        ("string/long-127", FateValue::string("a".repeat(127))),
        (
            "string/long-boundary-plus-64",
            FateValue::string("a".repeat(128)),
        ),
        ("string/long-300", FateValue::string("b".repeat(300))),
        ("string/utf8", FateValue::string("æternity — ünïcode")),
        (
            "string/embedded-nul",
            FateValue::String(vec![0, 1, 0, 2]),
        ),
        ("bytes/empty", FateValue::Bytes(Vec::new())),
        ("bytes/one", FateValue::Bytes(vec![0xff])),
        ("bytes/thirty-two", FateValue::Bytes(vec![0x5a; 32])),
        ("bytes/sixty-four", FateValue::Bytes(vec![0x5a; 64])),
        ("address/account", FateValue::account(ADDRESS_A)),
        ("address/account-counting", FateValue::account(address_b())),
        ("address/contract", FateValue::contract(ADDRESS_A)),
        (
            "address/oracle",
            FateValue::Address(AddressKind::Oracle, ADDRESS_A.to_vec()),
        ),
        (
            "address/oracle-query",
            FateValue::Address(AddressKind::OracleQuery, ADDRESS_A.to_vec()),
        ),
        (
            "address/channel",
            FateValue::Address(AddressKind::Channel, ADDRESS_A.to_vec()),
        ),
        ("tuple/unit", FateValue::unit()),
        ("tuple/one", FateValue::Tuple(vec![FateValue::int(1i32)])),
        (
            "tuple/mixed",
            FateValue::Tuple(vec![
                FateValue::int(-7i32),
                FateValue::Bool(true),
                FateValue::string("ok"),
            ]),
        ),
        ("tuple/fifteen", FateValue::Tuple(ints(15))),
        ("tuple/sixteen", FateValue::Tuple(ints(16))),
        ("tuple/seventeen", FateValue::Tuple(ints(17))),
        (
            "tuple/nested",
            FateValue::Tuple(vec![
                FateValue::Tuple(vec![FateValue::int(1i32)]),
                FateValue::int(2i32),
            ]),
        ),
        ("list/empty", FateValue::List(Vec::new())),
        ("list/one", FateValue::List(vec![FateValue::int(1i32)])),
        ("list/fifteen", FateValue::List(ints(15))),
        ("list/sixteen", FateValue::List(ints(16))),
        ("list/two-hundred", FateValue::List(ints(200))),
        (
            "list/of-strings",
            FateValue::List(vec![FateValue::string("one"), FateValue::string("two")]),
        ),
        (
            "list/nested",
            FateValue::List(vec![
                FateValue::List(vec![FateValue::int(1i32)]),
                FateValue::List(Vec::new()),
            ]),
        ),
        ("map/empty", FateValue::map([]).unwrap()),
        (
            "map/int-keys-unsorted",
            FateValue::map([
                (FateValue::int(10i32), FateValue::string("ten")),
                (FateValue::int(-3i32), FateValue::string("minus three")),
                (FateValue::int(2i32), FateValue::string("two")),
                (FateValue::int(1000i32), FateValue::string("thousand")),
            ])
            .unwrap(),
        ),
        (
            "map/string-keys-unsorted",
            FateValue::map([
                (FateValue::string("bbb"), FateValue::int(3i32)),
                (FateValue::string("a"), FateValue::int(1i32)),
                (FateValue::string("zz"), FateValue::int(2i32)),
                (FateValue::string(""), FateValue::int(0i32)),
            ])
            .unwrap(),
        ),
        (
            "map/address-keys",
            FateValue::map([
                (FateValue::account(ADDRESS_A), FateValue::int(1i32)),
                (FateValue::account(address_b()), FateValue::int(2i32)),
            ])
            .unwrap(),
        ),
        (
            "map/set-shape",
            FateValue::set([FateValue::int(3i32), FateValue::int(1i32)]).unwrap(),
        ),
        (
            "map/nested-values",
            FateValue::map([
                (
                    FateValue::int(2i32),
                    FateValue::List(vec![FateValue::int(20i32)]),
                ),
                (FateValue::int(1i32), FateValue::List(Vec::new())),
            ])
            .unwrap(),
        ),
        (
            "map/eighteen-entries",
            FateValue::map(
                (0..18i32).map(|i| (FateValue::int(17 - i), FateValue::int(i))),
            )
            .unwrap(),
        ),
        ("variant/none", FateValue::none()),
        ("variant/some", FateValue::some(FateValue::int(42i32))),
        (
            "variant/three-constructors",
            FateValue::variant(
                vec![0, 2, 1],
                1,
                vec![FateValue::int(1i32), FateValue::string("x")],
            )
            .unwrap(),
        ),
        (
            "variant/wide-arities",
            FateValue::variant(
                (0..20u8).map(|i| i % 3).collect(),
                19,
                vec![FateValue::int(9i32)],
            )
            .unwrap(),
        ),
    ]
}

fn types() -> Vec<(&'static str, FateType)> {
    vec![
        ("type/int", FateType::Int),
        ("type/bool", FateType::Bool),
        ("type/bits", FateType::Bits),
        ("type/string", FateType::String),
        ("type/any", FateType::Any),
        ("type/bytes-32", FateType::Bytes(BytesSize::Fixed(32))),
        ("type/bytes-1024", FateType::Bytes(BytesSize::Fixed(1024))),
        ("type/tvar", FateType::TypeVar(3)),
        (
            "type/account-address",
            FateType::Address(AddressKind::Account),
        ),
        (
            "type/contract-address",
            FateType::Address(AddressKind::Contract),
        ),
        (
            "type/oracle-address",
            FateType::Address(AddressKind::Oracle),
        ),
        (
            "type/oracle-query-address",
            FateType::Address(AddressKind::OracleQuery),
        ),
        (
            "type/channel-address",
            FateType::Address(AddressKind::Channel),
        ),
        ("type/list-of-int", FateType::list(FateType::Int)),
        (
            "type/map-string-to-list",
            FateType::map(FateType::String, FateType::list(FateType::Int)),
        ),
        ("type/unit", FateType::unit()),
        (
            "type/tuple",
            FateType::Tuple(vec![FateType::Int, FateType::Bool]),
        ),
        ("type/option-int", FateType::option(FateType::Int)),
        (
            "type/nested-list",
            FateType::list(FateType::list(FateType::String)),
        ),
    ]
}

/// A Sophia record — a tuple on the wire, with its field names lost.
fn record(label: &str, score: i32, active: bool) -> FateValue {
    FateValue::Tuple(vec![
        FateValue::string(label),
        FateValue::int(score),
        FateValue::Bool(active),
    ])
}

/// The `Registry.choice` typedef in `generate.mjs`: `Nothing | One(int) |
/// Both(int, string)`.
fn choice(tag: u8, values: Vec<FateValue>) -> FateValue {
    FateValue::variant(vec![0, 1, 2], tag, values).expect("well formed")
}

/// The four byte function id the reference derives from a function's name.
///
/// Computing it here rather than pinning the bytes makes every `call/…` case a
/// check on the derivation as well as on the encoding — the hash lives in
/// `ae-core`, and a corpus that carried the id as a literal would agree with
/// the reference even if the two disagreed about how it is produced.
fn function_id(name: &str) -> Vec<u8> {
    ae_core::hash::blake2b_256(name.as_bytes())[..4].to_vec()
}

/// Calls as `packages/core` makes them, named by the ACI function they call.
fn aci_calls() -> Vec<(&'static str, &'static str, Vec<FateValue>)> {
    vec![
        (
            "call/transfer",
            "transfer",
            vec![FateValue::account(ADDRESS_A), FateValue::int(1_000_000i32)],
        ),
        (
            "call/register",
            "register",
            vec![FateValue::account(address_b()), record("alice", -7, true)],
        ),
        (
            "call/set-flags",
            "set_flags",
            vec![FateValue::List(vec![
                FateValue::Bool(true),
                FateValue::Bool(false),
                FateValue::Bool(true),
            ])],
        ),
        (
            "call/bulk-unsorted-map",
            "bulk",
            vec![FateValue::map([
                (FateValue::string("zz"), FateValue::int(3i32)),
                (FateValue::string("a"), FateValue::int(1i32)),
                (FateValue::string("mm"), FateValue::int(2i32)),
            ])
            .unwrap()],
        ),
        (
            "call/maybe-some",
            "maybe",
            vec![FateValue::some(FateValue::int(42i32))],
        ),
        ("call/maybe-none", "maybe", vec![FateValue::none()]),
        (
            "call/verify",
            "verify",
            vec![
                FateValue::Bytes(vec![0x11; 32]),
                FateValue::Bytes(vec![0x22; 64]),
            ],
        ),
        (
            "call/blob",
            "blob",
            vec![FateValue::Bytes((1u8..=8).collect())],
        ),
        ("call/pick-nothing", "pick", vec![choice(0, Vec::new())]),
        (
            "call/pick-both",
            "pick",
            vec![choice(
                2,
                vec![FateValue::int(5i32), FateValue::string("five")],
            )],
        ),
        (
            "call/pair",
            "pair",
            vec![FateValue::Tuple(vec![
                FateValue::int(1i32),
                FateValue::string("x"),
            ])],
        ),
        (
            "call/nested",
            "nested",
            vec![FateValue::List(vec![
                record("a", 1, false),
                record("b", 2, true),
            ])],
        ),
        (
            "call/watch",
            "watch",
            vec![FateValue::Address(AddressKind::Oracle, ADDRESS_A.to_vec())],
        ),
        ("call/ping", "ping", Vec::new()),
    ]
}

/// Return values, encoded against the ACI's declared return type.
fn aci_returns() -> Vec<(&'static str, FateValue)> {
    vec![
        ("return/bool", FateValue::Bool(true)),
        ("return/record", record("alice", -7, true)),
        ("return/int", FateValue::int(3i32)),
        (
            "return/map-address-keys",
            FateValue::map([
                (FateValue::account(ADDRESS_A), FateValue::int(2i32)),
                (FateValue::account(address_b()), FateValue::int(1i32)),
            ])
            .unwrap(),
        ),
        (
            "return/option-some",
            FateValue::some(FateValue::string("yes")),
        ),
        ("return/option-none", FateValue::none()),
        ("return/bytes", FateValue::Bytes(vec![0x5a; 4])),
        ("return/variant-nullary", choice(0, Vec::new())),
        (
            "return/variant-payload",
            choice(2, vec![FateValue::int(5i32), FateValue::string("five")]),
        ),
        (
            "return/tuple",
            FateValue::Tuple(vec![FateValue::string("s"), FateValue::Bool(false)]),
        ),
        (
            "return/nested-containers",
            FateValue::List(vec![FateValue::map([
                (
                    FateValue::string("k"),
                    FateValue::List(vec![FateValue::int(1i32), FateValue::int(2i32)]),
                ),
                (FateValue::string("j"), FateValue::List(Vec::new())),
            ])
            .unwrap()]),
        ),
        ("return/address", FateValue::account(ADDRESS_A)),
        ("return/unit", FateValue::unit()),
        (
            "return/state-map",
            FateValue::map([(FateValue::account(ADDRESS_A), record("a", 1, false))]).unwrap(),
        ),
    ]
}

/// Calldata cases, which the reference builds through its own calldata type.
fn calls() -> Vec<(&'static str, Vec<u8>, Vec<FateValue>)> {
    vec![
        ("calldata/no-args", vec![0xb2, 0xba, 0x9d, 0x59], Vec::new()),
        (
            "calldata/two-args",
            vec![0x9f, 0x03, 0x37, 0x36],
            vec![FateValue::int(1_000_000i32), FateValue::string("hello")],
        ),
        (
            "calldata/address-arg",
            vec![0x00, 0x11, 0x22, 0x33],
            vec![FateValue::account(ADDRESS_A)],
        ),
    ]
}

#[test]
fn matches_the_reference_implementation() {
    let corpus = corpus();
    let mut checked = 0;

    for (name, expected) in &corpus {
        if let Some((_, value)) = values().into_iter().find(|(case, _)| case == name) {
            let encoded = serialize(&value).expect("encodes");
            assert_eq!(hex(&encoded), hex(expected), "encoding mismatch for {name}");
            assert_eq!(
                deserialize(expected).expect("decodes"),
                value,
                "decoding mismatch for {name}"
            );
            checked += 1;
        } else if let Some((_, fate_type)) = types().into_iter().find(|(case, _)| case == name) {
            let encoded = serialize_type(&fate_type).expect("encodes");
            assert_eq!(hex(&encoded), hex(expected), "type mismatch for {name}");
            assert_eq!(
                deserialize_type(expected).expect("decodes"),
                fate_type,
                "type decoding mismatch for {name}"
            );
            checked += 1;
        } else if let Some((_, function_id, arguments)) =
            calls().into_iter().find(|(case, _, _)| case == name)
        {
            let encoded = ae_fate::encode_calldata(&function_id, &arguments).expect("encodes");
            assert_eq!(hex(&encoded), hex(expected), "calldata mismatch for {name}");
            let decoded = ae_fate::decode_calldata(expected).expect("decodes");
            assert_eq!(decoded.function_id, function_id, "function id for {name}");
            assert_eq!(decoded.arguments, arguments, "arguments for {name}");
            checked += 1;
        } else if let Some((_, function, arguments)) =
            aci_calls().into_iter().find(|(case, _, _)| case == name)
        {
            let id = function_id(function);
            let encoded = ae_fate::encode_calldata(&id, &arguments).expect("encodes");
            assert_eq!(hex(&encoded), hex(expected), "call mismatch for {name}");
            let decoded = ae_fate::decode_calldata(expected).expect("decodes");
            assert_eq!(decoded.function_id, id, "function id for {name}");
            assert_eq!(decoded.arguments, arguments, "arguments for {name}");
            checked += 1;
        } else if let Some((_, value)) = aci_returns().into_iter().find(|(case, _)| case == name) {
            let encoded = serialize(&value).expect("encodes");
            assert_eq!(hex(&encoded), hex(expected), "return mismatch for {name}");
            assert_eq!(
                deserialize(expected).expect("decodes"),
                value,
                "return decoding mismatch for {name}"
            );
            checked += 1;
        } else {
            panic!("corpus case {name} has no counterpart in this test");
        }
    }

    assert_eq!(
        checked,
        corpus.len(),
        "every corpus case must be checked exactly once"
    );
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}
