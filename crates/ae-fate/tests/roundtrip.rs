//! Round trips, boundaries, and what the decoder refuses.
//!
//! The vector corpus proves agreement with the reference on the values both
//! implementations can build. These cover the rest: the two wire forms the JS
//! library has no encoder for, the size boundaries either side of every inline
//! length field, and the malformed inputs a decoder reachable from the network
//! has to reject rather than trust.

use ae_fate::{
    deserialize, deserialize_one, serialize, AddressKind, BytesSize, Error, FateInt, FateType,
    FateValue,
};

fn round_trip(value: FateValue) -> Vec<u8> {
    let encoded = serialize(&value).expect("encodes");
    assert_eq!(deserialize(&encoded).expect("decodes"), value);
    encoded
}

#[test]
fn round_trips_every_integer_boundary() {
    for value in [
        "0",
        "1",
        "-1",
        "63",
        "-63",
        "64",
        "-64",
        "65",
        "-65",
        "255",
        "256",
        "65535",
        "65536",
        "18446744073709551615",
        "18446744073709551616",
        "-115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ] {
        let int = FateInt::parse_decimal(value).expect("parses");
        let encoded = round_trip(FateValue::Int(int.clone()));
        // Below the bias the whole value rides in one byte.
        if int.abs_below(64) {
            assert_eq!(encoded.len(), 1, "{value} should be a small integer");
        }
    }
}

#[test]
fn round_trips_every_length_boundary() {
    for length in [0usize, 1, 63, 64, 65, 127, 128, 300] {
        round_trip(FateValue::String(vec![b'x'; length]));
        round_trip(FateValue::Bytes(vec![b'x'; length]));
        round_trip(FateValue::ContractBytearray(vec![0xfe; length]));
    }
    for count in [0usize, 1, 15, 16, 17, 100] {
        let items: Vec<FateValue> = (0..count as i32).map(FateValue::int).collect();
        round_trip(FateValue::List(items.clone()));
        round_trip(FateValue::Tuple(items));
    }
    for count in [0i32, 1, 15, 16, 17, 100] {
        let entries = (0..count).map(|i| (FateValue::int(i), FateValue::int(-i)));
        round_trip(FateValue::map(entries).expect("builds"));
    }
}

/// Neither of these has an encoder in `aepp-calldata`, so the corpus cannot
/// cover them and this is the only check they get.
#[test]
fn round_trips_the_forms_the_js_library_cannot_write() {
    round_trip(FateValue::StoreMap(FateInt::from(0u8)));
    round_trip(FateValue::StoreMap(FateInt::from(4096u32)));
    round_trip(FateValue::ContractBytearray(vec![0xca, 0xfe]));
    round_trip(FateValue::Typerep(FateType::Int));
    round_trip(FateValue::Typerep(FateType::option(FateType::String)));
    round_trip(FateValue::Typerep(FateType::Bytes(BytesSize::Any)));
    round_trip(FateValue::Typerep(FateType::map(
        FateType::Address(AddressKind::Account),
        FateType::list(FateType::Bits),
    )));
}

#[test]
fn round_trips_deeply_nested_values() {
    let mut value = FateValue::int(1i32);
    for _ in 0..64 {
        value = FateValue::List(vec![FateValue::Tuple(vec![value])]);
    }
    round_trip(value);
}

#[test]
fn reads_one_value_out_of_a_stream() {
    let mut stream = serialize(&FateValue::int(7i32)).unwrap();
    stream.extend_from_slice(&serialize(&FateValue::string("tail")).unwrap());
    let (first, rest) = deserialize_one(&stream).expect("decodes");
    assert_eq!(first, FateValue::int(7i32));
    let (second, rest) = deserialize_one(rest).expect("decodes");
    assert_eq!(second, FateValue::string("tail"));
    assert!(rest.is_empty());
    // The whole-input entry point refuses the same bytes.
    assert!(matches!(
        deserialize(&stream),
        Err(Error::TrailingBytes { .. })
    ));
}

#[test]
fn refuses_truncated_input() {
    let cases: Vec<Vec<u8>> = vec![
        vec![],
        vec![0x05],                   // a five byte string with no bytes
        vec![0x01],                   // a long string with no length
        vec![0x6f],                   // a big integer with no magnitude
        vec![0x9f],                   // an object with no type
        vec![0x9f, 0x00],             // an address with no payload
        vec![0x1b],                   // a one element tuple with no element
        vec![0x13],                   // a one element list with no element
        vec![0x2f, 0x02, 0x00, 0x02], // a two entry map holding one
        vec![0xaf, 0x82, 0x00, 0x01], // a variant with no tag
    ];
    for case in cases {
        assert_eq!(
            deserialize(&case),
            Err(Error::UnexpectedEnd),
            "should be truncated: {case:02x?}"
        );
    }
}

#[test]
fn refuses_malformed_maps() {
    // Keys out of canonical order.
    assert_eq!(
        deserialize(&[0x2f, 0x02, 0x04, 0x00, 0x02, 0x00]),
        Err(Error::MapNotSorted)
    );
    // The same key twice.
    assert_eq!(
        deserialize(&[0x2f, 0x02, 0x02, 0x00, 0x02, 0x00]),
        Err(Error::DuplicateMapKey)
    );
    // A map used as a key.
    let inner = FateValue::map([(FateValue::int(1i32), FateValue::int(1i32))]).unwrap();
    assert_eq!(
        FateValue::map([(inner, FateValue::int(0i32))]),
        Err(Error::MapAsMapKey)
    );
}

#[test]
fn refuses_malformed_variants() {
    // Tag 2 with only two arities declared.
    assert_eq!(
        deserialize(&[0xaf, 0x82, 0x00, 0x01, 0x02, 0x3f]),
        Err(Error::VariantTagOutOfRange { tag: 2, arities: 2 })
    );
    // Tag 1 declares arity 1 but carries the empty tuple.
    assert_eq!(
        deserialize(&[0xaf, 0x82, 0x00, 0x01, 0x01, 0x3f]),
        Err(Error::VariantArityMismatch {
            tag: 1,
            expected: 1,
            found: 0
        })
    );
    // The same checks apply when building one.
    assert_eq!(
        FateValue::variant(vec![0, 1], 1, Vec::new()),
        Err(Error::VariantArityMismatch {
            tag: 1,
            expected: 1,
            found: 0
        })
    );
}

#[test]
fn refuses_unknown_tags_and_object_types() {
    assert_eq!(deserialize(&[0xdf]), Err(Error::UnknownTag(0xdf)));
    assert_eq!(deserialize(&[0x9f, 0x09]), Err(Error::UnknownObjectType(9)));
    // Sized bytes must carry a string, not an integer.
    assert_eq!(deserialize(&[0x9f, 0x01, 0x02]), Err(Error::ExpectedString));
}

#[test]
fn refuses_a_length_it_cannot_hold() {
    // A map whose declared size overflows when doubled into a key/value count.
    let mut input = vec![0x2f, 0x88];
    input.extend_from_slice(&[0x80, 0, 0, 0, 0, 0, 0, 0]);
    assert_eq!(deserialize(&input), Err(Error::LengthOverflow));

    // A list claiming seventy quadrillion elements has to fail on the read of
    // the first one, not on an allocation sized from the header.
    let mut input = vec![0x1f, 0x87];
    input.extend_from_slice(&[0xff; 7]);
    assert_eq!(deserialize(&input), Err(Error::UnexpectedEnd));

    // A long string claiming far more bytes than are present.
    let input = vec![0x01, 0x6f, 0x84, 0x7f, 0xff, 0xff, 0xff];
    assert_eq!(deserialize(&input), Err(Error::UnexpectedEnd));
}

#[test]
fn keeps_map_lookup_consistent_with_the_canonical_order() {
    let map = FateValue::map([
        (FateValue::string("bb"), FateValue::int(2i32)),
        (FateValue::string("a"), FateValue::int(1i32)),
        // A later entry with the same key wins, as it does in the reference.
        (FateValue::string("a"), FateValue::int(9i32)),
    ])
    .expect("builds");
    let FateValue::Map(map) = &map else {
        unreachable!()
    };
    assert_eq!(map.len(), 2);
    assert_eq!(
        map.get(&FateValue::string("a")),
        Some(&FateValue::int(9i32))
    );
    assert_eq!(map.get(&FateValue::string("zzz")), None);
    assert_eq!(map.entries()[0].0, FateValue::string("a"));
}
