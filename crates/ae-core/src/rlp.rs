//! RLP, as the aeternity node uses it.
//!
//! This is the ordinary Ethereum RLP grammar — aeternity did not fork it — so the
//! rules below are the canonical ones. Decoding is strict: a non-canonical length
//! prefix is an error rather than something we quietly accept, because the whole
//! point of this layer is that two implementations agree byte for byte.

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
            Item::Bytes(b) => Ok(b),
            Item::List(_) => Err(Error::RlpShape {
                expected: "byte string",
            }),
        }
    }

    /// Borrow the item as a list, or fail if it is a byte string.
    pub fn as_list(&self) -> Result<&[Item]> {
        match self {
            Item::List(items) => Ok(items),
            Item::Bytes(_) => Err(Error::RlpShape { expected: "list" }),
        }
    }
}

impl From<Vec<u8>> for Item {
    fn from(value: Vec<u8>) -> Self {
        Item::Bytes(value)
    }
}

impl From<Vec<Item>> for Item {
    fn from(value: Vec<Item>) -> Self {
        Item::List(value)
    }
}

/// Encode an item to its RLP byte string.
pub fn encode(item: &Item) -> Vec<u8> {
    let mut out = Vec::new();
    encode_into(item, &mut out);
    out
}

fn encode_into(item: &Item, out: &mut Vec<u8>) {
    match item {
        Item::Bytes(bytes) => {
            if bytes.len() == 1 && bytes[0] < 0x80 {
                out.push(bytes[0]);
            } else {
                encode_length(bytes.len(), 0x80, out);
                out.extend_from_slice(bytes);
            }
        }
        Item::List(items) => {
            let mut payload = Vec::new();
            for item in items {
                encode_into(item, &mut payload);
            }
            encode_length(payload.len(), 0xc0, out);
            out.extend_from_slice(&payload);
        }
    }
}

fn encode_length(len: usize, offset: u8, out: &mut Vec<u8>) {
    if len < 56 {
        out.push(offset + len as u8);
    } else {
        let len_bytes = minimal_be(len);
        out.push(offset + 55 + len_bytes.len() as u8);
        out.extend_from_slice(&len_bytes);
    }
}

fn minimal_be(mut value: usize) -> Vec<u8> {
    let mut bytes = Vec::new();
    while value > 0 {
        bytes.push((value & 0xff) as u8);
        value >>= 8;
    }
    bytes.reverse();
    bytes
}

/// Decode exactly one RLP item, rejecting trailing bytes.
pub fn decode(input: &[u8]) -> Result<Item> {
    let (item, rest) = decode_item(input)?;
    if !rest.is_empty() {
        return Err(Error::Rlp(format!("{} trailing byte(s)", rest.len())));
    }
    Ok(item)
}

fn decode_item(input: &[u8]) -> Result<(Item, &[u8])> {
    let prefix = *input
        .first()
        .ok_or_else(|| Error::Rlp("unexpected end of input".into()))?;

    match prefix {
        0x00..=0x7f => Ok((Item::Bytes(vec![prefix]), &input[1..])),
        0x80..=0xb7 => {
            let len = (prefix - 0x80) as usize;
            let body = take(&input[1..], len)?;
            if len == 1 && body[0] < 0x80 {
                return Err(Error::Rlp(
                    "single byte below 0x80 must be encoded as itself".into(),
                ));
            }
            Ok((Item::Bytes(body.to_vec()), &input[1 + len..]))
        }
        0xb8..=0xbf => {
            let (len, consumed) = decode_long_length(input, 0xb7)?;
            let body = take(&input[consumed..], len)?;
            Ok((Item::Bytes(body.to_vec()), &input[consumed + len..]))
        }
        0xc0..=0xf7 => {
            let len = (prefix - 0xc0) as usize;
            let body = take(&input[1..], len)?;
            Ok((Item::List(decode_list(body)?), &input[1 + len..]))
        }
        0xf8..=0xff => {
            let (len, consumed) = decode_long_length(input, 0xf7)?;
            let body = take(&input[consumed..], len)?;
            Ok((Item::List(decode_list(body)?), &input[consumed + len..]))
        }
    }
}

/// Reads the multi-byte length that follows a `0xb8..`/`0xf8..` prefix.
/// Returns the length and how many bytes of `input` the header occupied.
fn decode_long_length(input: &[u8], offset: u8) -> Result<(usize, usize)> {
    let len_of_len = (input[0] - offset) as usize;
    let len_bytes = take(&input[1..], len_of_len)?;
    if len_bytes[0] == 0 {
        return Err(Error::Rlp("length has a leading zero byte".into()));
    }
    if len_of_len > core::mem::size_of::<usize>() {
        return Err(Error::Rlp("length does not fit in usize".into()));
    }
    let len = len_bytes
        .iter()
        .fold(0usize, |acc, b| (acc << 8) | *b as usize);
    if len < 56 {
        return Err(Error::Rlp("length below 56 must use the short form".into()));
    }
    Ok((len, 1 + len_of_len))
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

fn take(input: &[u8], len: usize) -> Result<&[u8]> {
    input
        .get(..len)
        .ok_or_else(|| Error::Rlp("unexpected end of input".into()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn b(bytes: &[u8]) -> Item {
        Item::Bytes(bytes.to_vec())
    }

    #[test]
    fn canonical_vectors() {
        // The vectors from the Ethereum yellow paper appendix / ethereum tests,
        // which is the same grammar the aeternity node serialises with.
        let cases: Vec<(Item, Vec<u8>)> = vec![
            (b(b"dog"), vec![0x83, b'd', b'o', b'g']),
            (b(&[]), vec![0x80]),
            (b(&[0x00]), vec![0x00]),
            (b(&[0x0f]), vec![0x0f]),
            (b(&[0x04, 0x00]), vec![0x82, 0x04, 0x00]),
            (
                Item::List(vec![b(b"cat"), b(b"dog")]),
                vec![0xc8, 0x83, b'c', b'a', b't', 0x83, b'd', b'o', b'g'],
            ),
            (Item::List(vec![]), vec![0xc0]),
            (
                Item::List(vec![
                    Item::List(vec![]),
                    Item::List(vec![Item::List(vec![])]),
                ]),
                vec![0xc3, 0xc0, 0xc1, 0xc0],
            ),
        ];

        for (item, expected) in cases {
            assert_eq!(encode(&item), expected, "encoding {item:?}");
            assert_eq!(decode(&expected).unwrap(), item, "decoding {expected:?}");
        }
    }

    #[test]
    fn long_string_uses_the_long_form() {
        let payload = vec![0xaau8; 1024];
        let encoded = encode(&b(&payload));
        assert_eq!(&encoded[..3], &[0xb9, 0x04, 0x00]);
        assert_eq!(decode(&encoded).unwrap(), b(&payload));
    }

    #[test]
    fn rejects_non_canonical_input() {
        // 0x81 0x00: single byte below 0x80 wrapped in a length prefix.
        assert!(decode(&[0x81, 0x00]).is_err());
        // 0xb8 0x01 0xff: long form used for a length the short form covers.
        assert!(decode(&[0xb8, 0x01, 0xff]).is_err());
        // trailing bytes after a complete item.
        assert!(decode(&[0x00, 0x00]).is_err());
        // truncated payload.
        assert!(decode(&[0x83, b'd', b'o']).is_err());
    }
}
