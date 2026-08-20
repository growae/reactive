//! Integer ↔ bytes, with the reference implementation's exact edge cases.
//!
//! The one that bites: **zero serialises to a single `0x00` byte, not to an
//! empty string.** Ethereum RLP would write an empty string; `binary:encode_unsigned/1`
//! and the reference SDK's `toBytes` both write `<<0>>`, and that one byte is the
//! difference between a transaction the node accepts and one it does not.

use num_bigint::BigUint;

use crate::error::{Error, Result};

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

/// The same encoding for a value that already fits in 128 bits.
///
/// A convenience over [`uint_to_bytes`], not a second implementation — the test
/// below pins the two together. State entries carry balances and amounts that
/// are bounded by the total supply, so making every one of them a `BigUint`
/// would cost allocation and type noise for no reach.
pub fn u128_to_bytes(value: u128) -> Vec<u8> {
    uint_to_bytes(&BigUint::from(value))
}

/// Read an integer field that must fit in 128 bits, rejecting a non-minimal encoding.
///
/// Stricter than [`bytes_to_uint`] on purpose, and the strictness is the node's:
/// `aeserialization:decode_field/2` errors on a leading zero byte *unless
/// nothing follows it*, which is why a lone `<<0>>` stays legal and `<<0, 1>>`
/// does not. An empty slice reads as zero, as it does there.
pub fn bytes_to_u128(bytes: &[u8]) -> Result<u128> {
    if bytes.first() == Some(&0) && bytes.len() > 1 {
        return Err(Error::FieldValue {
            field: "int",
            reason: "leading zero byte in an integer field".into(),
        });
    }
    if bytes.len() > 16 {
        return Err(Error::FieldValue {
            field: "int",
            reason: format!("{} bytes is wider than 128 bits", bytes.len()),
        });
    }
    let mut acc: u128 = 0;
    for byte in bytes {
        acc = (acc << 8) | u128::from(*byte);
    }
    Ok(acc)
}

/// [`bytes_to_u128`], narrowed to 64 bits.
pub fn bytes_to_u64(bytes: &[u8]) -> Result<u64> {
    u64::try_from(bytes_to_u128(bytes)?).map_err(|_| Error::FieldValue {
        field: "int",
        reason: "wider than 64 bits".into(),
    })
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

    #[test]
    fn the_fixed_width_helpers_agree_with_the_bigint_ones() {
        for value in [0u128, 1, 255, 256, 1_000_000_000, u128::from(u64::MAX)] {
            assert_eq!(u128_to_bytes(value), uint_to_bytes(&BigUint::from(value)));
            assert_eq!(bytes_to_u128(&u128_to_bytes(value)).unwrap(), value);
        }
        assert_eq!(u128_to_bytes(0), vec![0x00]);
    }

    #[test]
    fn a_non_minimal_integer_field_is_refused() {
        // A lone zero byte is the canonical zero and stays legal.
        assert_eq!(bytes_to_u128(&[0x00]).unwrap(), 0);
        assert_eq!(bytes_to_u128(&[]).unwrap(), 0);
        // A zero with something after it is not.
        assert!(bytes_to_u128(&[0x00, 0x01]).is_err());
        assert!(bytes_to_u128(&[0xff; 17]).is_err());
        assert!(bytes_to_u64(&[0xff; 9]).is_err());
    }
}
