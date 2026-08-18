//! The slice of RLP that FATE actually uses.
//!
//! FATE only ever RLP-encodes byte strings — never lists — so this is a byte
//! string codec, and an RLP list in the input is an error rather than a value.
//! Decoding is strict: a byte string that could have been written shorter is
//! rejected, matching `aeser_rlp`'s canonicality requirement.

use crate::error::{Error, Result};

/// Encodes a byte string.
pub fn encode_bytes(bytes: &[u8]) -> Vec<u8> {
    if bytes.len() == 1 && bytes[0] < 0x80 {
        return vec![bytes[0]];
    }
    let mut out = Vec::with_capacity(bytes.len() + 9);
    if bytes.len() <= 55 {
        out.push(0x80 + bytes.len() as u8);
    } else {
        let length = (bytes.len() as u64).to_be_bytes();
        let first = length.iter().position(|b| *b != 0).unwrap_or(7);
        let length = &length[first..];
        out.push(0xb7 + length.len() as u8);
        out.extend_from_slice(length);
    }
    out.extend_from_slice(bytes);
    out
}

/// Decodes one byte string, returning it and whatever follows it.
pub fn decode_bytes(input: &[u8]) -> Result<(&[u8], &[u8])> {
    let first = *input.first().ok_or(Error::UnexpectedEnd)?;
    match first {
        0x00..=0x7f => Ok((&input[..1], &input[1..])),
        0x80..=0xb7 => {
            let length = usize::from(first - 0x80);
            let body = input.get(1..1 + length).ok_or(Error::UnexpectedEnd)?;
            // A one byte string below 0x80 has a shorter encoding.
            if length == 1 && body[0] < 0x80 {
                return Err(Error::NonCanonicalRlp);
            }
            Ok((body, &input[1 + length..]))
        }
        0xb8..=0xbf => {
            let length_len = usize::from(first - 0xb7);
            let length_bytes = input.get(1..1 + length_len).ok_or(Error::UnexpectedEnd)?;
            if length_bytes[0] == 0 {
                return Err(Error::NonCanonicalRlp);
            }
            let mut length: usize = 0;
            for byte in length_bytes {
                length = length
                    .checked_shl(8)
                    .and_then(|shifted| shifted.checked_add(usize::from(*byte)))
                    .ok_or(Error::LengthOverflow)?;
            }
            // Anything this short has a shorter encoding.
            if length <= 55 {
                return Err(Error::NonCanonicalRlp);
            }
            let start = 1 + length_len;
            let body = input
                .get(start..start + length)
                .ok_or(Error::UnexpectedEnd)?;
            Ok((body, &input[start + length..]))
        }
        _ => Err(Error::RlpListUnsupported),
    }
}

/// Encodes a non-negative integer given as a big-endian magnitude.
///
/// An empty magnitude is zero, which the reference encoder writes as a single
/// zero byte rather than as the empty string.
pub fn encode_magnitude(magnitude: &[u8]) -> Vec<u8> {
    if magnitude.is_empty() {
        encode_bytes(&[0])
    } else {
        encode_bytes(magnitude)
    }
}

/// Decodes a non-negative integer, returning its normalised big-endian
/// magnitude and whatever follows it.
///
/// Rejects every encoding the reference decoder rejects: the empty string, and
/// any magnitude carrying a leading zero byte.
pub fn decode_magnitude(input: &[u8]) -> Result<(Vec<u8>, &[u8])> {
    let (body, rest) = decode_bytes(input)?;
    if body.is_empty() {
        return Err(Error::NonCanonicalInteger);
    }
    if body.len() > 1 && body[0] == 0 {
        return Err(Error::NonCanonicalInteger);
    }
    let magnitude = if body == [0] {
        Vec::new()
    } else {
        body.to_vec()
    };
    Ok((magnitude, rest))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_the_three_length_classes() {
        assert_eq!(encode_bytes(&[0x7f]), vec![0x7f]);
        assert_eq!(encode_bytes(&[0x80]), vec![0x81, 0x80]);
        assert_eq!(encode_bytes(&[]), vec![0x80]);
        assert_eq!(encode_bytes(&[1, 2, 3]), vec![0x83, 1, 2, 3]);
        assert_eq!(encode_bytes(&[7u8; 32])[0], 0xa0);
        assert_eq!(encode_bytes(&[7u8; 55])[0], 0xb7);
        assert_eq!(&encode_bytes(&[7u8; 56])[..2], &[0xb8, 56]);
        assert_eq!(&encode_bytes(&[7u8; 1024])[..3], &[0xb9, 0x04, 0x00]);
    }

    #[test]
    fn round_trips_every_length_class() {
        for length in [0usize, 1, 2, 55, 56, 300, 70_000] {
            let body = vec![0xa5u8; length];
            let encoded = encode_bytes(&body);
            let (decoded, rest) = decode_bytes(&encoded).expect("decodes");
            assert_eq!(decoded, &body[..], "length {length}");
            assert!(rest.is_empty());
        }
    }

    #[test]
    fn rejects_non_canonical_forms() {
        assert_eq!(decode_bytes(&[0x81, 0x01]), Err(Error::NonCanonicalRlp));
        assert_eq!(
            decode_bytes(&[0xb8, 0x02, 1, 2]),
            Err(Error::NonCanonicalRlp)
        );
        assert_eq!(
            decode_bytes(&[0xb9, 0x00, 0x60]),
            Err(Error::NonCanonicalRlp)
        );
        assert_eq!(decode_bytes(&[0xc0]), Err(Error::RlpListUnsupported));
        assert_eq!(decode_bytes(&[0x83, 1, 2]), Err(Error::UnexpectedEnd));
        assert_eq!(decode_bytes(&[]), Err(Error::UnexpectedEnd));
    }

    #[test]
    fn keeps_the_remainder() {
        let (body, rest) = decode_bytes(&[0x82, 1, 2, 0xff, 0xfe]).expect("decodes");
        assert_eq!(body, &[1, 2]);
        assert_eq!(rest, &[0xff, 0xfe]);
    }

    #[test]
    fn encodes_integers_the_way_the_reference_does() {
        assert_eq!(encode_magnitude(&[]), vec![0x00]);
        assert_eq!(encode_magnitude(&[1]), vec![0x01]);
        assert_eq!(encode_magnitude(&[0x01, 0x00]), vec![0x82, 0x01, 0x00]);
        assert_eq!(decode_magnitude(&[0x00]).unwrap().0, Vec::<u8>::new());
        assert_eq!(decode_magnitude(&[0x01]).unwrap().0, vec![1]);
    }

    #[test]
    fn rejects_non_canonical_integers() {
        // The empty string decodes to zero, which re-encodes differently.
        assert_eq!(decode_magnitude(&[0x80]), Err(Error::NonCanonicalInteger));
        // A leading zero byte.
        assert_eq!(
            decode_magnitude(&[0x82, 0x00, 0x01]),
            Err(Error::NonCanonicalInteger)
        );
    }
}
