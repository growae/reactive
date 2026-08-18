//! Decoding FATE values from bytes.

use crate::error::{Error, Result};
use crate::int::FateInt;
use crate::rlp;
use crate::tag;
use crate::types::deserialize_type_one;
use crate::value::{AddressKind, FateMap, FateValue, FateVariant};

/// Decodes a value, requiring that it consumes the whole input.
///
/// The reference implementation states this as a property of the format: a
/// valid byte sequence must not contain trailing bytes. Use
/// [`deserialize_one`] to read one value out of a longer stream.
pub fn deserialize(input: &[u8]) -> Result<FateValue> {
    let (value, rest) = deserialize_one(input)?;
    if rest.is_empty() {
        Ok(value)
    } else {
        Err(Error::TrailingBytes {
            remaining: rest.len(),
        })
    }
}

/// Decodes one value, returning it and whatever follows it.
pub fn deserialize_one(input: &[u8]) -> Result<(FateValue, &[u8])> {
    let first = *input.first().ok_or(Error::UnexpectedEnd)?;
    let rest = &input[1..];

    if first & 1 == tag::SMALL_INT {
        return Ok((FateValue::Int(read_small_integer(first)?), rest));
    }

    match first {
        tag::TRUE => Ok((FateValue::Bool(true), rest)),
        tag::FALSE => Ok((FateValue::Bool(false), rest)),
        tag::EMPTY_TUPLE => Ok((FateValue::Tuple(Vec::new()), rest)),
        tag::EMPTY_STRING => Ok((FateValue::String(Vec::new()), rest)),

        tag::POS_BIG_INT | tag::NEG_BIG_INT => {
            let (magnitude, rest) = rlp::decode_magnitude(rest)?;
            let negative = first == tag::NEG_BIG_INT;
            Ok((
                FateValue::Int(FateInt::from_magnitude_plus(
                    negative,
                    &magnitude,
                    tag::SMALL_INT_SIZE,
                )),
                rest,
            ))
        }

        tag::POS_BITS | tag::NEG_BITS => {
            let (magnitude, rest) = rlp::decode_magnitude(rest)?;
            let negative = first == tag::NEG_BITS;
            if negative && magnitude.is_empty() {
                return Err(Error::NegativeZeroBits);
            }
            Ok((
                FateValue::Bits(FateInt::from_sign_magnitude(negative, &magnitude)),
                rest,
            ))
        }

        tag::LONG_STRING => {
            let (length, rest) = read_length(rest, tag::SHORT_STRING_SIZE)?;
            let bytes = rest.get(..length).ok_or(Error::UnexpectedEnd)?;
            Ok((FateValue::String(bytes.to_vec()), &rest[length..]))
        }

        tag::CONTRACT_BYTEARRAY => {
            let (length, rest) = read_length(rest, 0)?;
            let bytes = rest.get(..length).ok_or(Error::UnexpectedEnd)?;
            Ok((
                FateValue::ContractBytearray(bytes.to_vec()),
                &rest[length..],
            ))
        }

        tag::OBJECT => {
            let object_type = *rest.first().ok_or(Error::UnexpectedEnd)?;
            let rest = &rest[1..];
            if object_type == tag::OTYPE_BYTES {
                // Sized bytes carry a whole FATE string, not a bare RLP array.
                let (value, rest) = deserialize_one(rest)?;
                match value {
                    FateValue::String(bytes) => Ok((FateValue::Bytes(bytes), rest)),
                    _ => Err(Error::ExpectedString),
                }
            } else {
                let kind = AddressKind::from_object_type(object_type)
                    .ok_or(Error::UnknownObjectType(object_type))?;
                let (bytes, rest) = rlp::decode_bytes(rest)?;
                Ok((FateValue::Address(kind, bytes.to_vec()), rest))
            }
        }

        tag::LONG_TUPLE => {
            let (length, rest) = read_rlp_length(rest, tag::SHORT_TUPLE_SIZE)?;
            let (items, rest) = read_elements(rest, length)?;
            Ok((FateValue::Tuple(items), rest))
        }

        tag::LONG_LIST => {
            let (length, rest) = read_rlp_length(rest, tag::SHORT_LIST_SIZE)?;
            let (items, rest) = read_elements(rest, length)?;
            Ok((FateValue::List(items), rest))
        }

        tag::MAP => {
            let (length, rest) = read_rlp_length(rest, 0)?;
            let pairs = length.checked_mul(2).ok_or(Error::LengthOverflow)?;
            let (items, rest) = read_elements(rest, pairs)?;
            Ok((FateValue::Map(collect_map(items)?), rest))
        }

        tag::MAP_ID => {
            let (magnitude, rest) = rlp::decode_magnitude(rest)?;
            Ok((
                FateValue::StoreMap(FateInt::from_sign_magnitude(false, &magnitude)),
                rest,
            ))
        }

        tag::VARIANT => {
            let (arities, rest) = rlp::decode_bytes(rest)?;
            let arities = arities.to_vec();
            let variant_tag = *rest.first().ok_or(Error::UnexpectedEnd)?;
            let (payload, rest) = deserialize_one(&rest[1..])?;
            let values = match payload {
                FateValue::Tuple(values) => values,
                _ => return Err(Error::ExpectedTuple),
            };
            Ok((
                FateValue::Variant(FateVariant::new(arities, variant_tag, values)?),
                rest,
            ))
        }

        other if tag::is_type_tag(other) => {
            let (fate_type, rest) = deserialize_type_one(input)?;
            Ok((FateValue::Typerep(fate_type), rest))
        }

        other if other & 0b11 == tag::SHORT_STRING => {
            let length = usize::from(other >> 2);
            let bytes = rest.get(..length).ok_or(Error::UnexpectedEnd)?;
            Ok((FateValue::String(bytes.to_vec()), &rest[length..]))
        }

        other if other & 0x0f == tag::SHORT_TUPLE => {
            let (items, rest) = read_elements(rest, usize::from(other >> 4))?;
            Ok((FateValue::Tuple(items), rest))
        }

        other if other & 0x0f == tag::SHORT_LIST => {
            let (items, rest) = read_elements(rest, usize::from(other >> 4))?;
            Ok((FateValue::List(items), rest))
        }

        other => Err(Error::UnknownTag(other)),
    }
}

/// Reads one integer in the FATE integer form.
pub(crate) fn read_integer(input: &[u8]) -> Result<(FateInt, &[u8])> {
    match deserialize_one(input)? {
        (FateValue::Int(int), rest) => Ok((int, rest)),
        _ => Err(Error::InvalidInteger),
    }
}

fn read_small_integer(tag_byte: u8) -> Result<FateInt> {
    let magnitude = (tag_byte & 0b0111_1110) >> 1;
    let negative = tag_byte & 0b1000_0000 != 0;
    // Zero has one encoding, so the sign bit with a zero magnitude is illegal.
    if negative && magnitude == 0 {
        return Err(Error::NegativeZero);
    }
    Ok(FateInt::from_sign_magnitude(negative, &[magnitude]))
}

/// Reads a FATE-encoded length and adds `bias`.
fn read_length(input: &[u8], bias: u64) -> Result<(usize, &[u8])> {
    let (int, rest) = read_integer(input)?;
    if int.is_negative() {
        return Err(Error::NegativeLength);
    }
    let length = int
        .to_usize()
        .and_then(|value| value.checked_add(bias as usize))
        .ok_or(Error::LengthOverflow)?;
    Ok((length, rest))
}

/// Reads an RLP-encoded length and adds `bias`.
fn read_rlp_length(input: &[u8], bias: u64) -> Result<(usize, &[u8])> {
    let (magnitude, rest) = rlp::decode_magnitude(input)?;
    let length = FateInt::from_sign_magnitude(false, &magnitude)
        .to_usize()
        .and_then(|value| value.checked_add(bias as usize))
        .ok_or(Error::LengthOverflow)?;
    Ok((length, rest))
}

fn read_elements(input: &[u8], count: usize) -> Result<(Vec<FateValue>, &[u8])> {
    let mut rest = input;
    // Deliberately not pre-allocated: `count` is attacker-controlled and a
    // short input has to fail on the read, not on the allocation.
    let mut items = Vec::new();
    for _ in 0..count {
        let (item, tail) = deserialize_one(rest)?;
        items.push(item);
        rest = tail;
    }
    Ok((items, rest))
}

/// Pairs up a flat key/value sequence and checks it is canonical.
///
/// The reference decoder re-sorts what it read and rejects the input unless it
/// was already in that order, which also rejects duplicate keys.
fn collect_map(items: Vec<FateValue>) -> Result<FateMap> {
    let mut entries: Vec<(FateValue, FateValue)> = Vec::with_capacity(items.len() / 2);
    let mut items = items.into_iter();
    while let (Some(key), Some(value)) = (items.next(), items.next()) {
        entries.push((key, value));
    }
    for window in entries.windows(2) {
        match window[0].0.cmp(&window[1].0) {
            core::cmp::Ordering::Less => {}
            core::cmp::Ordering::Equal => return Err(Error::DuplicateMapKey),
            core::cmp::Ordering::Greater => return Err(Error::MapNotSorted),
        }
    }
    let canonical = FateMap::new(entries)?;
    Ok(canonical)
}
