//! Where the two reference implementations disagree, and which one we follow.
//!
//! The Erlang implementation (`aeb_fate_encoding`, `aeb_fate_data`) is what the
//! node runs, so it decides what the chain accepts and it is what this crate
//! matches. The JavaScript implementation (`@aeternity/aepp-calldata` 1.9.1) is
//! what the SDK — and therefore this repository — ships today.
//!
//! Each case below records the JS behaviour as it was actually measured against
//! 1.9.1, not as it was read out of the source. Two of the four are
//! decode-side leniency and cost nothing but strictness; the other two change
//! the bytes a map serialises to, which means a contract written against one
//! and read by the other disagrees about the same map.

use ae_fate::{deserialize, serialize, Error, FateInt, FateValue};

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// `0x80` is the small-integer form with the sign bit set and a zero magnitude,
/// which is a second encoding of zero.
///
/// Measured: `aepp-calldata` decodes it to `0`. Erlang raises
/// `{illegal_sign, 0}`. Rejected here — a value with two encodings breaks the
/// format's own uniqueness property, which map ordering depends on.
#[test]
fn rejects_negative_zero() {
    assert_eq!(deserialize(&[0x80]), Err(Error::NegativeZero));
}

/// A big integer whose RLP magnitude carries a leading zero byte, or is the
/// empty string.
///
/// Measured: `aepp-calldata` decodes `6f820001` to `65` and `6f80` to `64`.
/// Erlang re-encodes what it read and raises `{none_unique_encoding, …}` when
/// the bytes differ. Rejected here.
#[test]
fn rejects_non_canonical_integers() {
    assert_eq!(
        deserialize(&[0x6f, 0x82, 0x00, 0x01]),
        Err(Error::NonCanonicalInteger)
    );
    assert_eq!(deserialize(&[0x6f, 0x80]), Err(Error::NonCanonicalInteger));
}

/// Strings order by length before content in both implementations, but the JS
/// library measures that length in UTF-16 code units rather than bytes.
///
/// Measured: for a map keyed by `"ä"` and `"xy"` — two bytes each, one and two
/// code units — `aepp-calldata` writes `2f0209c3a40209787904`, putting `"ä"`
/// first. Erlang's `compare_bytes` sees equal byte lengths and falls through to
/// a byte comparison, which puts `"xy"` first. This is the divergence with
/// teeth: the two implementations produce different bytes for the same map.
#[test]
fn orders_string_keys_by_byte_length() {
    let map = FateValue::map([
        (FateValue::string("ä"), FateValue::int(1i32)),
        (FateValue::string("xy"), FateValue::int(2i32)),
    ])
    .expect("builds");
    let encoded = serialize(&map).expect("encodes");
    assert_eq!(hex(&encoded), "2f020978790409c3a402");
    assert_ne!(
        hex(&encoded),
        "2f0209c3a40209787904",
        "this is the aepp-calldata 1.9.1 output"
    );
    assert_eq!(deserialize(&encoded).expect("decodes"), map);
}

/// Two negative bit fields.
///
/// Measured: for a map keyed by `-1` and `-5`, `aepp-calldata` writes
/// `2f02cf0102cf0504`, ordering `-1` before `-5`. Erlang orders two negative
/// bit fields numerically, so `-5` comes first; only the boundary between
/// non-negative and negative is inverted, not the negatives among themselves.
#[test]
fn orders_negative_bit_fields_numerically() {
    let map = FateValue::map([
        (FateValue::Bits(FateInt::from(-1i32)), FateValue::int(1i32)),
        (FateValue::Bits(FateInt::from(-5i32)), FateValue::int(2i32)),
    ])
    .expect("builds");
    let encoded = serialize(&map).expect("encodes");
    assert_eq!(hex(&encoded), "2f02cf0504cf0102");
    assert_ne!(
        hex(&encoded),
        "2f02cf0102cf0504",
        "this is the aepp-calldata 1.9.1 output"
    );
}

/// `EMPTY_MAP` (`0b1101_1111`) is a dead tag.
///
/// Neither implementation writes it — an empty map is `MAP` with a zero length
/// — and neither decodes it: Erlang has no clause for it, and `aepp-calldata`
/// throws `Invalid FATE prefix: 0b11011111` even though its type factory lists
/// it. Rejected here as an unknown tag.
#[test]
fn rejects_the_dead_empty_map_tag() {
    assert_eq!(deserialize(&[0xdf]), Err(Error::UnknownTag(0xdf)));
    assert_eq!(
        hex(&serialize(&FateValue::map([]).unwrap()).unwrap()),
        "2f00"
    );
}
