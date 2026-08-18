//! RLP, as the chain object serialisation uses it.
//!
//! Provisional — see [`crate::substrate`].

use crate::error::{Error, Result};

/// An RLP item: either a byte string or a list of items.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Item {
    /// A byte string.
    Bytes(Vec<u8>),
    /// A list of items.
    List(Vec<Item>),
}

impl Item {
    /// Borrow the item as a byte string, or fail if it is a list.
    pub fn as_bytes(&self) -> Result<&[u8]> {
        match self {
            Self::Bytes(b) => Ok(b),
            Self::List(_) => Err(Error::RlpShape {
                expected: "byte string",
                got: "list",
            }),
        }
    }

    /// Borrow the item as a list, or fail if it is a byte string.
    pub fn as_list(&self) -> Result<&[Item]> {
        match self {
            Self::List(l) => Ok(l),
            Self::Bytes(_) => Err(Error::RlpShape {
                expected: "list",
                got: "byte string",
            }),
        }
    }

    /// Encode to bytes.
    pub fn encode(&self) -> Vec<u8> {
        let mut out = Vec::new();
        self.encode_into(&mut out);
        out
    }

    fn encode_into(&self, out: &mut Vec<u8>) {
        match self {
            Self::Bytes(b) => {
                if b.len() == 1 && b[0] < 0x80 {
                    out.push(b[0]);
                } else {
                    encode_length(b.len(), 0x80, out);
                    out.extend_from_slice(b);
                }
            }
            Self::List(items) => {
                let mut payload = Vec::new();
                for item in items {
                    item.encode_into(&mut payload);
                }
                encode_length(payload.len(), 0xc0, out);
                out.extend_from_slice(&payload);
            }
        }
    }

    /// Decode exactly one item from `input`, rejecting trailing bytes.
    pub fn decode(input: &[u8]) -> Result<Self> {
        let (item, rest) = decode_item(input)?;
        if !rest.is_empty() {
            return Err(Error::Rlp("trailing bytes after item"));
        }
        Ok(item)
    }
}

fn encode_length(len: usize, offset: u8, out: &mut Vec<u8>) {
    if len < 56 {
        out.push(offset + len as u8);
    } else {
        let len_be = minimal_be(len as u64);
        out.push(offset + 55 + len_be.len() as u8);
        out.extend_from_slice(&len_be);
    }
}

/// Big-endian bytes of `value` with no leading zeroes; empty for zero.
pub fn minimal_be(value: u64) -> Vec<u8> {
    let bytes = value.to_be_bytes();
    let first = bytes.iter().position(|b| *b != 0).unwrap_or(bytes.len());
    bytes[first..].to_vec()
}

/// Big-endian bytes of a 128-bit `value` with no leading zeroes; empty for zero.
pub fn minimal_be_u128(value: u128) -> Vec<u8> {
    let bytes = value.to_be_bytes();
    let first = bytes.iter().position(|b| *b != 0).unwrap_or(bytes.len());
    bytes[first..].to_vec()
}

/// Encode an unsigned integer as a chain object `int()` field.
///
/// Note the zero case: an `int()` field holding zero is **one 0x00 byte**, not
/// the empty string that plain RLP would use for it. Both the node
/// (`binary:encode_unsigned/1`) and the reference sdk (`toBytes`, which pads an
/// odd-length hex string) produce `<<0>>`, so anything else is a parity bug
/// waiting to happen on every zero-balance account.
pub fn encode_int_field(value: u128) -> Vec<u8> {
    let bytes = minimal_be_u128(value);
    if bytes.is_empty() {
        vec![0]
    } else {
        bytes
    }
}

/// Read an unsigned integer field.
///
/// Leading zeroes are rejected, but a lone `<<0>>` is the canonical spelling of
/// zero and is accepted — matching `decode_field(int, …)` in `aeserialization`,
/// whose guard only fires when bytes follow the zero.
pub fn read_u128(bytes: &[u8]) -> Result<u128> {
    if bytes.first() == Some(&0) && bytes.len() > 1 {
        return Err(Error::IntegerRange("leading zero in integer field"));
    }
    if bytes.len() > 16 {
        return Err(Error::IntegerRange("wider than 128 bits"));
    }
    let mut acc: u128 = 0;
    for byte in bytes {
        acc = (acc << 8) | u128::from(*byte);
    }
    Ok(acc)
}

/// Read a minimally-encoded unsigned integer field that must fit in 64 bits.
pub fn read_u64(bytes: &[u8]) -> Result<u64> {
    let value = read_u128(bytes)?;
    u64::try_from(value).map_err(|_| Error::IntegerRange("wider than 64 bits"))
}

fn decode_item(input: &[u8]) -> Result<(Item, &[u8])> {
    let first = *input.first().ok_or(Error::Rlp("empty input"))?;
    match first {
        0x00..=0x7f => Ok((Item::Bytes(vec![first]), &input[1..])),
        0x80..=0xb7 => {
            let len = usize::from(first - 0x80);
            let body = take(input, 1, len)?;
            if len == 1 && body[0] < 0x80 {
                return Err(Error::Rlp("single byte below 0x80 must be encoded bare"));
            }
            Ok((Item::Bytes(body.to_vec()), &input[1 + len..]))
        }
        0xb8..=0xbf => {
            let (len, header) = long_length(input, first - 0xb7)?;
            let body = take(input, header, len)?;
            Ok((Item::Bytes(body.to_vec()), &input[header + len..]))
        }
        0xc0..=0xf7 => {
            let len = usize::from(first - 0xc0);
            let body = take(input, 1, len)?;
            Ok((Item::List(decode_list(body)?), &input[1 + len..]))
        }
        0xf8..=0xff => {
            let (len, header) = long_length(input, first - 0xf7)?;
            let body = take(input, header, len)?;
            Ok((Item::List(decode_list(body)?), &input[header + len..]))
        }
    }
}

fn long_length(input: &[u8], len_of_len: u8) -> Result<(usize, usize)> {
    let len_of_len = usize::from(len_of_len);
    let raw = take(input, 1, len_of_len)?;
    if raw.first() == Some(&0) {
        return Err(Error::Rlp("leading zero in length prefix"));
    }
    let mut len: usize = 0;
    for byte in raw {
        len = len
            .checked_shl(8)
            .and_then(|shifted| shifted.checked_add(usize::from(*byte)))
            .ok_or(Error::Rlp("length prefix overflows usize"))?;
    }
    if len < 56 {
        return Err(Error::Rlp("long form used for a short payload"));
    }
    Ok((len, 1 + len_of_len))
}

fn take(input: &[u8], from: usize, len: usize) -> Result<&[u8]> {
    input
        .get(from..from + len)
        .ok_or(Error::Rlp("truncated payload"))
}

fn decode_list(mut body: &[u8]) -> Result<Vec<Item>> {
    let mut items = Vec::new();
    while !body.is_empty() {
        let (item, rest) = decode_item(body)?;
        items.push(item);
        body = rest;
    }
    Ok(items)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn bytes(hex: &str) -> Vec<u8> {
        hex::decode(hex).unwrap()
    }

    #[test]
    fn round_trips_the_ethereum_yellow_paper_vectors() {
        let cases: &[(Item, &str)] = &[
            (Item::Bytes(b"dog".to_vec()), "83646f67"),
            (
                Item::List(vec![
                    Item::Bytes(b"cat".to_vec()),
                    Item::Bytes(b"dog".to_vec()),
                ]),
                "c88363617483646f67",
            ),
            (Item::Bytes(Vec::new()), "80"),
            (Item::List(Vec::new()), "c0"),
            (Item::Bytes(vec![0x00]), "00"),
            (Item::Bytes(vec![0x0f]), "0f"),
            (Item::Bytes(vec![0x04, 0x00]), "820400"),
            (
                Item::List(vec![
                    Item::List(Vec::new()),
                    Item::List(vec![Item::List(Vec::new())]),
                    Item::List(vec![
                        Item::List(Vec::new()),
                        Item::List(vec![Item::List(Vec::new())]),
                    ]),
                ]),
                "c7c0c1c0c3c0c1c0",
            ),
        ];
        for (item, expected) in cases {
            assert_eq!(hex::encode(item.encode()), *expected);
            assert_eq!(Item::decode(&bytes(expected)).unwrap(), *item);
        }
    }

    #[test]
    fn encodes_a_55_byte_string_short_and_a_56_byte_string_long() {
        let short = Item::Bytes(vec![0x61; 55]).encode();
        assert_eq!(short[0], 0x80 + 55);
        let long = Item::Bytes(vec![0x61; 56]).encode();
        assert_eq!(&long[..2], &[0xb8, 56]);
        let very_long = Item::Bytes(vec![0x61; 1024]).encode();
        assert_eq!(&very_long[..3], &[0xb9, 0x04, 0x00]);
    }

    #[test]
    fn rejects_non_canonical_encodings() {
        // 0x81 0x00 — a single byte below 0x80 that should have been encoded bare.
        assert!(Item::decode(&bytes("8100")).is_err());
        // long form for a payload that fits the short form.
        assert!(Item::decode(&bytes("b8016f")).is_err());
        // trailing garbage after a complete item.
        assert!(Item::decode(&bytes("83646f6700")).is_err());
        // truncated payload.
        assert!(Item::decode(&bytes("83646f")).is_err());
    }

    #[test]
    fn integer_fields_must_be_minimally_encoded() {
        assert_eq!(read_u128(&[]).unwrap(), 0);
        assert_eq!(read_u128(&[0x01, 0x00]).unwrap(), 256);
        assert!(read_u128(&[0x00, 0x01]).is_err());
        assert!(read_u64(&[0xff; 9]).is_err());
        assert_eq!(minimal_be(0), Vec::<u8>::new());
        assert_eq!(minimal_be(256), vec![0x01, 0x00]);
    }

    #[test]
    fn a_zero_int_field_is_one_zero_byte_not_the_empty_string() {
        // Both the node and the reference sdk spell zero this way; plain RLP
        // would use the empty string and produce different bytes.
        assert_eq!(encode_int_field(0), vec![0x00]);
        assert_eq!(read_u128(&encode_int_field(0)).unwrap(), 0);
        assert_eq!(encode_int_field(1), vec![0x01]);
        assert_eq!(encode_int_field(u128::MAX).len(), 16);
        for value in [0u128, 1, 255, 256, 1_000_000_000, u128::from(u64::MAX)] {
            assert_eq!(read_u128(&encode_int_field(value)).unwrap(), value);
        }
    }
}
