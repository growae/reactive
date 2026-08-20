//! The protocol's total order over FATE values.
//!
//! This is not a convenience: map serialisation is only canonical because the
//! entries are sorted by it, and the *node's* decoder rejects a map sorted any
//! other way — `aebytecode` re-sorts what it read and raises
//! `{unknown_map_serialization_format, …}` when the input did not already
//! match. The JavaScript library does the opposite and validates no order at
//! all, so it is not the implementation this sentence is about; see
//! `tests/divergence.rs`. The order is `aeb_fate_data:lt/2`, including the
//! parts that are
//! surprising — values of different types are ordered by a fixed type ordinal
//! rather than structurally, strings and byte strings order by *length first*
//! and only then lexicographically, and negative bit fields sort after every
//! non-negative one.

use crate::value::{FateValue, FateVariant};
use core::cmp::Ordering;

/// Type ordinals, from `aeb_fate_data`. The gaps are the reference's own — the
/// oracle query id sits at 13, well after the other address-shaped types.
fn ordinal(value: &FateValue) -> u8 {
    match value {
        FateValue::Int(_) => 0,
        FateValue::Bool(_) => 1,
        FateValue::Address(kind, _) => kind.ordinal(),
        FateValue::Bytes(_) => 6,
        FateValue::Bits(_) => 7,
        FateValue::String(_) => 8,
        FateValue::Tuple(_) => 9,
        FateValue::Map(_) => 10,
        FateValue::List(_) => 11,
        FateValue::Variant(_) => 12,
        FateValue::ContractBytearray(_) => 14,
        // The reference has no ordinal for these two: a store map reference is
        // never a map key, and a typerep is not comparable there at all. They
        // are ordered after everything the reference does define so that this
        // stays a total order.
        FateValue::StoreMap(_) => 15,
        FateValue::Typerep(_) => 16,
    }
}

/// Shorter first, then lexicographic. Used for strings, byte strings and
/// contract bytecode.
fn compare_bytes(a: &[u8], b: &[u8]) -> Ordering {
    a.len().cmp(&b.len()).then_with(|| a.cmp(b))
}

fn compare_variants(a: &FateVariant, b: &FateVariant) -> Ordering {
    a.arities()
        .len()
        .cmp(&b.arities().len())
        .then_with(|| a.arities().cmp(b.arities()))
        .then_with(|| a.tag().cmp(&b.tag()))
        .then_with(|| a.values().cmp(b.values()))
}

impl Ord for FateValue {
    fn cmp(&self, other: &Self) -> Ordering {
        let ordering = ordinal(self).cmp(&ordinal(other));
        if ordering != Ordering::Equal {
            return ordering;
        }
        match (self, other) {
            (FateValue::Int(a), FateValue::Int(b)) => a.cmp(b),
            (FateValue::Bool(a), FateValue::Bool(b)) => a.cmp(b),
            // Addresses compare as raw binaries, not by length first.
            (FateValue::Address(_, a), FateValue::Address(_, b)) => a.cmp(b),
            (FateValue::Bytes(a), FateValue::Bytes(b)) => compare_bytes(a, b),
            (FateValue::Bits(a), FateValue::Bits(b)) => match (a.is_negative(), b.is_negative()) {
                (true, false) => Ordering::Greater,
                (false, true) => Ordering::Less,
                _ => a.cmp(b),
            },
            (FateValue::String(a), FateValue::String(b)) => compare_bytes(a, b),
            // Tuples and lists both compare elementwise, but a tuple compares
            // its size first while a list is plain lexicographic.
            (FateValue::Tuple(a), FateValue::Tuple(b)) => {
                a.len().cmp(&b.len()).then_with(|| a.cmp(b))
            }
            (FateValue::List(a), FateValue::List(b)) => a.cmp(b),
            (FateValue::Map(a), FateValue::Map(b)) => a
                .len()
                .cmp(&b.len())
                .then_with(|| a.entries().cmp(b.entries())),
            (FateValue::Variant(a), FateValue::Variant(b)) => compare_variants(a, b),
            (FateValue::ContractBytearray(a), FateValue::ContractBytearray(b)) => {
                compare_bytes(a, b)
            }
            (FateValue::StoreMap(a), FateValue::StoreMap(b)) => a.cmp(b),
            (FateValue::Typerep(a), FateValue::Typerep(b)) => a.cmp(b),
            // Unreachable: equal ordinals imply the same variant.
            _ => Ordering::Equal,
        }
    }
}

impl PartialOrd for FateValue {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::int::FateInt;
    use crate::value::AddressKind;

    #[test]
    fn orders_by_type_before_value() {
        let mut values = vec![
            FateValue::String(b"a".to_vec()),
            FateValue::Bool(false),
            FateValue::int(1_000_000i64),
            FateValue::List(Vec::new()),
            FateValue::Address(AddressKind::Account, vec![0xff; 32]),
            FateValue::Bytes(vec![1]),
        ];
        values.sort();
        assert_eq!(
            values,
            vec![
                FateValue::int(1_000_000i64),
                FateValue::Bool(false),
                FateValue::Address(AddressKind::Account, vec![0xff; 32]),
                FateValue::Bytes(vec![1]),
                FateValue::String(b"a".to_vec()),
                FateValue::List(Vec::new()),
            ]
        );
    }

    #[test]
    fn orders_strings_by_length_first() {
        let mut values = vec![
            FateValue::string("zz"),
            FateValue::string("a"),
            FateValue::string("ab"),
            FateValue::string(""),
        ];
        values.sort();
        assert_eq!(
            values,
            vec![
                FateValue::string(""),
                FateValue::string("a"),
                FateValue::string("ab"),
                FateValue::string("zz"),
            ]
        );
    }

    #[test]
    fn orders_negative_bits_last() {
        let mut values = vec![
            FateValue::Bits(FateInt::from(-5i32)),
            FateValue::Bits(FateInt::from(3i32)),
            FateValue::Bits(FateInt::from(-1i32)),
            FateValue::Bits(FateInt::from(0i32)),
        ];
        values.sort();
        assert_eq!(
            values,
            vec![
                FateValue::Bits(FateInt::from(0i32)),
                FateValue::Bits(FateInt::from(3i32)),
                FateValue::Bits(FateInt::from(-5i32)),
                FateValue::Bits(FateInt::from(-1i32)),
            ]
        );
    }

    #[test]
    fn orders_lists_lexicographically_and_tuples_by_size() {
        assert_eq!(
            FateValue::List(vec![FateValue::int(2i32)]).cmp(&FateValue::List(vec![
                FateValue::int(1i32),
                FateValue::int(1i32)
            ])),
            Ordering::Greater
        );
        assert_eq!(
            FateValue::Tuple(vec![FateValue::int(2i32)]).cmp(&FateValue::Tuple(vec![
                FateValue::int(1i32),
                FateValue::int(1i32)
            ])),
            Ordering::Less
        );
    }

    #[test]
    fn orders_variants_by_arities_then_tag() {
        let a = FateValue::variant(vec![0, 1], 0, Vec::new()).unwrap();
        let b = FateValue::variant(vec![0, 1], 1, vec![FateValue::int(0i32)]).unwrap();
        let c = FateValue::variant(vec![0, 0, 1], 0, Vec::new()).unwrap();
        assert_eq!(a.cmp(&b), Ordering::Less);
        assert_eq!(b.cmp(&c), Ordering::Less);
    }
}
