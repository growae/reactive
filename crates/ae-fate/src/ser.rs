//! Encoding FATE values to bytes.

use crate::error::Result;
use crate::int::FateInt;
use crate::rlp;
use crate::tag;
use crate::types::write_type;
use crate::value::FateValue;

/// Encodes a value.
///
/// The only way this fails is a [`FateValue::Typerep`] carrying a tuple or
/// variant with more than 255 members, which the type format cannot express.
/// Every other illegal value — an unsorted map, a variant whose tag does not
/// match its arities — is rejected when it is constructed, not here.
pub fn serialize(value: &FateValue) -> Result<Vec<u8>> {
    let mut out = Vec::new();
    write_value(&mut out, value)?;
    Ok(out)
}

fn write_value(out: &mut Vec<u8>, value: &FateValue) -> Result<()> {
    match value {
        FateValue::Bool(true) => out.push(tag::TRUE),
        FateValue::Bool(false) => out.push(tag::FALSE),
        FateValue::Int(int) => write_integer(out, int),
        FateValue::Bits(bits) => {
            out.push(if bits.is_negative() {
                tag::NEG_BITS
            } else {
                tag::POS_BITS
            });
            out.extend_from_slice(&rlp::encode_magnitude(bits.magnitude_be()));
        }
        FateValue::String(bytes) => write_string(out, bytes),
        FateValue::Bytes(bytes) => {
            out.push(tag::OBJECT);
            out.push(tag::OTYPE_BYTES);
            write_string(out, bytes);
        }
        FateValue::Address(kind, bytes) => {
            out.push(tag::OBJECT);
            out.push(kind.object_type());
            out.extend_from_slice(&rlp::encode_bytes(bytes));
        }
        FateValue::Tuple(items) => {
            if items.is_empty() {
                out.push(tag::EMPTY_TUPLE);
            } else if (items.len() as u64) < tag::SHORT_TUPLE_SIZE {
                out.push(((items.len() as u8) << 4) | tag::SHORT_TUPLE);
            } else {
                out.push(tag::LONG_TUPLE);
                write_rlp_length(out, items.len() as u64 - tag::SHORT_TUPLE_SIZE);
            }
            for item in items {
                write_value(out, item)?;
            }
        }
        FateValue::List(items) => {
            if (items.len() as u64) < tag::SHORT_LIST_SIZE {
                out.push(((items.len() as u8) << 4) | tag::SHORT_LIST);
            } else {
                out.push(tag::LONG_LIST);
                write_rlp_length(out, items.len() as u64 - tag::SHORT_LIST_SIZE);
            }
            for item in items {
                write_value(out, item)?;
            }
        }
        FateValue::Map(map) => {
            out.push(tag::MAP);
            write_rlp_length(out, map.len() as u64);
            for (key, value) in map.entries() {
                write_value(out, key)?;
                write_value(out, value)?;
            }
        }
        FateValue::StoreMap(id) => {
            out.push(tag::MAP_ID);
            out.extend_from_slice(&rlp::encode_magnitude(id.magnitude_be()));
        }
        FateValue::Variant(variant) => {
            out.push(tag::VARIANT);
            out.extend_from_slice(&rlp::encode_bytes(variant.arities()));
            out.push(variant.tag());
            write_value(out, &FateValue::Tuple(variant.values().to_vec()))?;
        }
        FateValue::ContractBytearray(code) => {
            out.push(tag::CONTRACT_BYTEARRAY);
            write_integer(out, &FateInt::from(code.len()));
            out.extend_from_slice(code);
        }
        FateValue::Typerep(fate_type) => write_type(out, fate_type)?,
    }
    Ok(())
}

/// Writes an integer in the FATE integer form: values below 64 in absolute
/// value ride in the tag byte, everything else spills into an RLP encoded
/// magnitude biased by 64.
pub(crate) fn write_integer(out: &mut Vec<u8>, int: &FateInt) {
    if int.abs_below(tag::SMALL_INT_SIZE) {
        let magnitude = int.magnitude_be().last().copied().unwrap_or(0);
        let sign = if int.is_negative() { 0b1000_0000 } else { 0 };
        out.push(sign | (magnitude << 1));
        return;
    }
    out.push(if int.is_negative() {
        tag::NEG_BIG_INT
    } else {
        tag::POS_BIG_INT
    });
    let biased = int
        .magnitude_minus(tag::SMALL_INT_SIZE)
        .expect("magnitude is at least the bias");
    out.extend_from_slice(&rlp::encode_magnitude(&biased));
}

/// Writes a byte string in the FATE string form.
pub(crate) fn write_string(out: &mut Vec<u8>, bytes: &[u8]) {
    if bytes.is_empty() {
        out.push(tag::EMPTY_STRING);
        return;
    }
    if (bytes.len() as u64) < tag::SHORT_STRING_SIZE {
        out.push(((bytes.len() as u8) << 2) | tag::SHORT_STRING);
    } else {
        out.push(tag::LONG_STRING);
        // Note that this is the FATE integer form, not RLP — the tag table's
        // own comment says "RLP encoded array" and the reference does not.
        write_integer(
            out,
            &FateInt::from(bytes.len() as u64 - tag::SHORT_STRING_SIZE),
        );
    }
    out.extend_from_slice(bytes);
}

fn write_rlp_length(out: &mut Vec<u8>, length: u64) {
    out.extend_from_slice(&rlp::encode_magnitude(FateInt::from(length).magnitude_be()));
}
