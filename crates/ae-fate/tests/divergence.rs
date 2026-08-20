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
//!
//! # What is ruled, and what is not
//!
//! All four are re-measured against an installed 1.9.1 rather than carried
//! forward from the earlier note, and all four reproduced exactly.
//!
//! The two decode-side cases are **closed**: strict. The closing evidence is
//! not the tests below — those only assert the strictness — but the round-trip
//! sweep in `tests/sweep.rs`, where the reference's own encoder wrote 337
//! integer cases spanning ±(2^441) and 60 seeded large magnitudes and produced
//! neither a negative zero nor a non-canonical magnitude once. The reference
//! accepts these forms; it never emits them. Rejecting them therefore costs a
//! consumer nothing, which is what makes this ours to rule.
//!
//! The two ordering cases are **not ruled here**, and the code below is the
//! standing behaviour pending that ruling rather than its conclusion. They
//! change the bytes, so they are a consumer-visible compatibility decision.
//! Two measurements bear on it and both are recorded on the tests themselves:
//! how far the disagreement actually reaches, and — the one that matters most —
//! that `MapSerializer.deserializeStream` performs no order validation at all,
//! so the reference reads a map written in either order and recovers the same
//! mapping. The direction that is still unmeasured is whether the *node's*
//! decoder is equally forgiving; nothing in this repository can answer that
//! without a chain.

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
///
/// How far it reaches, measured over every pair drawn from five pools of
/// realistic map keys:
///
/// | key pool | pairs that disagree |
/// |---|---|
/// | ASCII only | 0 / 45 |
/// | Latin-1 accents (`café`, `über`, `ä`) | 5 / 45 |
/// | CJK (`名前`, `東京`) | 8 / 28 |
/// | emoji and astral (`🚀`, `𝔞`) | 3 / 15 |
/// | currency and brand (`€`, `₿`, `æternity`) | 10 / 45 |
///
/// The boundary is exact rather than statistical: an all-ASCII key set cannot
/// disagree, because that is precisely where a string's byte length and its
/// UTF-16 length coincide. Every disagreement needs a non-ASCII key.
///
/// The reference reads either order — its map deserialiser does no order check
/// — so what this crate writes stays readable by every `aepp-calldata`
/// consumer. Which order the *node* accepts is the open half.
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
///
/// Where the string case is a fringe, this one is total: across the pairs drawn
/// from `{-1, -2, -5, -64, -255, 0, 1, 7}`, **every** pair of two negatives
/// disagrees — 10 of 10 — and every pair with a non-negative agrees. The JS
/// comparator negates the whole comparison as soon as either operand is
/// negative, which happens to restore the correct non-negative-before-negative
/// boundary and to invert everything inside the negative half.
///
/// The reach is narrower than the rate suggests: it needs a Sophia `map` keyed
/// by `bits`, holding two keys that are both negative. As above, the reference
/// reads either order.
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

/// The read-direction cost of the two ordering rules, stated as behaviour
/// rather than left in prose.
///
/// A map the reference wrote is rejected here whenever its keys are ordered the
/// way only the reference orders them — which is what "we follow the node"
/// means when the bytes are already on chain. The reference is asymmetric about
/// this: it writes one order and reads both, so the reverse never happens and
/// nothing this crate writes is unreadable there.
///
/// If the node turns out to read both orders too, these two rules are free and
/// the case for strictness is unopposed. If it does not, this rejection is the
/// correct behaviour and the JS output is the broken side. Either way the
/// decision is about which of those is true, not about what this test asserts.
#[test]
fn rejects_a_map_written_in_the_js_order() {
    let js_string_keys = [0x2f, 0x02, 0x09, 0xc3, 0xa4, 0x02, 0x09, 0x78, 0x79, 0x04];
    assert_eq!(deserialize(&js_string_keys), Err(Error::MapNotSorted));

    let js_bit_field_keys = [0x2f, 0x02, 0xcf, 0x01, 0x02, 0xcf, 0x05, 0x04];
    assert_eq!(deserialize(&js_bit_field_keys), Err(Error::MapNotSorted));
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
