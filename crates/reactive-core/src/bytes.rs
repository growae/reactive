//! Integer ↔ bytes, with the reference implementation's exact edge cases.
//!
//! The one that bites: **zero serialises to a single `0x00` byte, not to an
//! empty string.** Ethereum RLP would write an empty string; `binary:encode_unsigned/1`
//! and the reference SDK's `toBytes` both write `<<0>>`, and that one byte is the
//! difference between a transaction the node accepts and one it does not.

use num_bigint::BigUint;

/// Big-endian minimal-width encoding of an unsigned integer, with `0` → `[0x00]`.
pub fn uint_to_bytes(value: &BigUint) -> Vec<u8> {
    let bytes = value.to_bytes_be();
    // `BigUint::to_bytes_be` already returns `[0]` for zero and is minimal
    // otherwise, so it agrees with the reference. Asserted by the tests below.
    bytes
}

/// Big-endian bytes back to an unsigned integer. An empty slice reads as `0`,
/// which is what `binary:decode_unsigned(<<>>)` does; the reference SDK throws
/// there instead, and no well-formed record contains an empty integer field.
pub fn bytes_to_uint(bytes: &[u8]) -> BigUint {
    BigUint::from_bytes_be(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_is_one_zero_byte() {
        assert_eq!(uint_to_bytes(&BigUint::from(0u8)), vec![0x00]);
    }

    #[test]
    fn is_minimal_big_endian() {
        assert_eq!(uint_to_bytes(&BigUint::from(1u8)), vec![0x01]);
        assert_eq!(uint_to_bytes(&BigUint::from(255u16)), vec![0xff]);
        assert_eq!(uint_to_bytes(&BigUint::from(256u16)), vec![0x01, 0x00]);
        assert_eq!(
            uint_to_bytes(&BigUint::parse_bytes(b"1000000000000000000", 10).unwrap()),
            vec![0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]
        );
    }

    #[test]
    fn round_trips() {
        for value in ["0", "1", "255", "256", "18446744073709551616"] {
            let n = BigUint::parse_bytes(value.as_bytes(), 10).unwrap();
            assert_eq!(bytes_to_uint(&uint_to_bytes(&n)), n);
        }
    }
}
