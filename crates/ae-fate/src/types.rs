//! FATE type representations.
//!
//! A type is itself a serialisable FATE value (a *typerep*), so this module
//! carries both the type model and its own wire codec.

use crate::error::{Error, Result};
use crate::int::FateInt;
use crate::tag;
use crate::value::AddressKind;
use crate::{de, ser};

/// The declared width of a `bytes` type.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum BytesSize {
    /// `bytes(n)` — exactly `n` bytes.
    Fixed(usize),
    /// `bytes()` — any length. Written as the size `-1`.
    Any,
}

/// A FATE type.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[non_exhaustive]
pub enum FateType {
    /// Arbitrary-precision integer.
    Int,
    /// Boolean.
    Bool,
    /// Bit field.
    Bits,
    /// UTF-8 string, or an unsized byte array.
    String,
    /// Sized byte string.
    Bytes(BytesSize),
    /// One of the address-shaped object types.
    Address(AddressKind),
    /// Homogeneous list.
    List(Box<FateType>),
    /// Map from a key type to a value type.
    Map(Box<FateType>, Box<FateType>),
    /// Fixed-width product type. Sophia records serialise as tuples.
    Tuple(Vec<FateType>),
    /// Sum type. Each member is the type of that constructor's payload.
    Variant(Vec<FateType>),
    /// Compiled contract code.
    ContractBytearray,
    /// A type variable, by id.
    TypeVar(u8),
    /// The top type.
    Any,
}

impl FateType {
    /// Convenience constructor for a list type.
    pub fn list(element: FateType) -> Self {
        FateType::List(Box::new(element))
    }

    /// Convenience constructor for a map type.
    pub fn map(key: FateType, value: FateType) -> Self {
        FateType::Map(Box::new(key), Box::new(value))
    }

    /// The unit type — the empty tuple.
    pub fn unit() -> Self {
        FateType::Tuple(Vec::new())
    }

    /// `option(t)`, as the compiler emits it.
    pub fn option(value: FateType) -> Self {
        FateType::Variant(vec![FateType::unit(), FateType::Tuple(vec![value])])
    }
}

/// Encodes a type.
///
/// Fails only when the type cannot be represented on the wire: a tuple or
/// variant with more than 255 members.
pub fn serialize_type(fate_type: &FateType) -> Result<Vec<u8>> {
    let mut out = Vec::new();
    write_type(&mut out, fate_type)?;
    Ok(out)
}

/// Decodes a type, requiring that it consumes the whole input.
pub fn deserialize_type(input: &[u8]) -> Result<FateType> {
    let (fate_type, rest) = deserialize_type_one(input)?;
    if rest.is_empty() {
        Ok(fate_type)
    } else {
        Err(Error::TrailingBytes {
            remaining: rest.len(),
        })
    }
}

/// Decodes one type, returning it and whatever follows it.
pub fn deserialize_type_one(input: &[u8]) -> Result<(FateType, &[u8])> {
    let tag = *input.first().ok_or(Error::UnexpectedEnd)?;
    let rest = &input[1..];
    match tag {
        tag::TYPE_INTEGER => Ok((FateType::Int, rest)),
        tag::TYPE_BOOLEAN => Ok((FateType::Bool, rest)),
        tag::TYPE_BITS => Ok((FateType::Bits, rest)),
        tag::TYPE_STRING => Ok((FateType::String, rest)),
        tag::TYPE_ANY => Ok((FateType::Any, rest)),
        tag::TYPE_CONTRACT_BYTEARRAY => Ok((FateType::ContractBytearray, rest)),
        tag::TYPE_VAR => {
            let id = *rest.first().ok_or(Error::UnexpectedEnd)?;
            Ok((FateType::TypeVar(id), &rest[1..]))
        }
        tag::TYPE_OBJECT => {
            let object = *rest.first().ok_or(Error::UnexpectedEnd)?;
            let kind = AddressKind::from_object_type(object).ok_or(
                // `bytes` is an object type on the value side but has its own
                // type tag, so it is not a legal operand here.
                Error::UnknownObjectType(object),
            )?;
            Ok((FateType::Address(kind), &rest[1..]))
        }
        tag::TYPE_BYTES => {
            let (size, rest) = de::read_integer(rest)?;
            let size = if size == FateInt::from(-1i32) {
                BytesSize::Any
            } else {
                BytesSize::Fixed(size.to_usize().ok_or(Error::InvalidBytesSize)?)
            };
            Ok((FateType::Bytes(size), rest))
        }
        tag::TYPE_LIST => {
            let (element, rest) = deserialize_type_one(rest)?;
            Ok((FateType::list(element), rest))
        }
        tag::TYPE_MAP => {
            let (key, rest) = deserialize_type_one(rest)?;
            let (value, rest) = deserialize_type_one(rest)?;
            Ok((FateType::map(key, value), rest))
        }
        tag::TYPE_TUPLE => {
            let (members, rest) = read_type_vec(rest)?;
            Ok((FateType::Tuple(members), rest))
        }
        tag::TYPE_VARIANT => {
            let (members, rest) = read_type_vec(rest)?;
            Ok((FateType::Variant(members), rest))
        }
        other => Err(Error::UnknownTag(other)),
    }
}

fn read_type_vec(input: &[u8]) -> Result<(Vec<FateType>, &[u8])> {
    let count = usize::from(*input.first().ok_or(Error::UnexpectedEnd)?);
    let mut rest = &input[1..];
    let mut members = Vec::with_capacity(count);
    for _ in 0..count {
        let (member, tail) = deserialize_type_one(rest)?;
        members.push(member);
        rest = tail;
    }
    Ok((members, rest))
}

pub(crate) fn write_type(out: &mut Vec<u8>, fate_type: &FateType) -> Result<()> {
    match fate_type {
        FateType::Int => out.push(tag::TYPE_INTEGER),
        FateType::Bool => out.push(tag::TYPE_BOOLEAN),
        FateType::Bits => out.push(tag::TYPE_BITS),
        FateType::String => out.push(tag::TYPE_STRING),
        FateType::Any => out.push(tag::TYPE_ANY),
        FateType::ContractBytearray => out.push(tag::TYPE_CONTRACT_BYTEARRAY),
        FateType::TypeVar(id) => {
            out.push(tag::TYPE_VAR);
            out.push(*id);
        }
        FateType::Address(kind) => {
            out.push(tag::TYPE_OBJECT);
            out.push(kind.object_type());
        }
        FateType::Bytes(size) => {
            out.push(tag::TYPE_BYTES);
            let size = match size {
                BytesSize::Any => FateInt::from(-1i32),
                BytesSize::Fixed(n) => FateInt::from(*n),
            };
            ser::write_integer(out, &size);
        }
        FateType::List(element) => {
            out.push(tag::TYPE_LIST);
            write_type(out, element)?;
        }
        FateType::Map(key, value) => {
            out.push(tag::TYPE_MAP);
            write_type(out, key)?;
            write_type(out, value)?;
        }
        FateType::Tuple(members) => {
            out.push(tag::TYPE_TUPLE);
            write_members(out, members)?;
        }
        FateType::Variant(members) => {
            out.push(tag::TYPE_VARIANT);
            write_members(out, members)?;
        }
    }
    Ok(())
}

fn write_members(out: &mut Vec<u8>, members: &[FateType]) -> Result<()> {
    let count = u8::try_from(members.len()).map_err(|_| Error::TypeTooWide)?;
    out.push(count);
    for member in members {
        write_type(out, member)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn round_trip(fate_type: FateType) -> Vec<u8> {
        let encoded = serialize_type(&fate_type).expect("encodes");
        assert_eq!(deserialize_type(&encoded).expect("decodes"), fate_type);
        encoded
    }

    #[test]
    fn encodes_the_basic_types() {
        assert_eq!(round_trip(FateType::Int), vec![tag::TYPE_INTEGER]);
        assert_eq!(round_trip(FateType::Bool), vec![tag::TYPE_BOOLEAN]);
        assert_eq!(round_trip(FateType::Bits), vec![tag::TYPE_BITS]);
        assert_eq!(round_trip(FateType::String), vec![tag::TYPE_STRING]);
        assert_eq!(round_trip(FateType::Any), vec![tag::TYPE_ANY]);
        assert_eq!(
            round_trip(FateType::ContractBytearray),
            vec![tag::TYPE_CONTRACT_BYTEARRAY]
        );
        assert_eq!(round_trip(FateType::TypeVar(3)), vec![tag::TYPE_VAR, 3]);
    }

    #[test]
    fn encodes_the_object_types() {
        for (kind, object) in [
            (AddressKind::Account, tag::OTYPE_ADDRESS),
            (AddressKind::Contract, tag::OTYPE_CONTRACT),
            (AddressKind::Oracle, tag::OTYPE_ORACLE),
            (AddressKind::OracleQuery, tag::OTYPE_ORACLE_QUERY),
            (AddressKind::Channel, tag::OTYPE_CHANNEL),
        ] {
            assert_eq!(
                round_trip(FateType::Address(kind)),
                vec![tag::TYPE_OBJECT, object]
            );
        }
    }

    #[test]
    fn encodes_sized_and_unsized_bytes() {
        // `bytes()` is written as the size -1, which is the small-int form
        // with the sign bit set.
        assert_eq!(
            round_trip(FateType::Bytes(BytesSize::Any)),
            vec![tag::TYPE_BYTES, 0b1000_0010]
        );
        assert_eq!(
            round_trip(FateType::Bytes(BytesSize::Fixed(32))),
            vec![tag::TYPE_BYTES, 64]
        );
        // A size at the small-integer boundary spills into the big-int form.
        round_trip(FateType::Bytes(BytesSize::Fixed(1024)));
    }

    #[test]
    fn encodes_nested_containers() {
        round_trip(FateType::list(FateType::map(
            FateType::String,
            FateType::list(FateType::Int),
        )));
        round_trip(FateType::Tuple(vec![
            FateType::Int,
            FateType::Bool,
            FateType::Address(AddressKind::Account),
        ]));
        round_trip(FateType::unit());
        round_trip(FateType::option(FateType::Int));
    }

    #[test]
    fn rejects_types_too_wide_for_the_wire() {
        let wide = FateType::Tuple(vec![FateType::Int; 256]);
        assert_eq!(serialize_type(&wide), Err(Error::TypeTooWide));
    }

    #[test]
    fn rejects_trailing_bytes() {
        assert_eq!(
            deserialize_type(&[tag::TYPE_INTEGER, tag::TYPE_BOOLEAN]),
            Err(Error::TrailingBytes { remaining: 1 })
        );
    }
}
