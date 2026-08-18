//! The `id` type — a one-byte tag in front of a 32-byte hash.
//!
//! Six things can be an `id`, and the tag is their position in the list below,
//! one-based. Mirrors `aeser_id.erl`.

use crate::encoding::{decode_any, encode, Encoding};
use crate::error::{Error, Result};

/// The encodings that can appear inside an `id`, in id-tag order.
/// Tag `n` is `ID_ENCODINGS[n - 1]`.
pub const ID_ENCODINGS: [Encoding; 6] = [
    Encoding::AccountAddress,
    Encoding::Name,
    Encoding::Commitment,
    Encoding::OracleAddress,
    Encoding::ContractAddress,
    Encoding::Channel,
];

/// The id tag for an encoding, or `None` if that encoding is not id-able.
pub fn id_tag(encoding: Encoding) -> Option<u8> {
    ID_ENCODINGS
        .iter()
        .position(|e| *e == encoding)
        .map(|i| i as u8 + 1)
}

/// The encoding an id tag stands for.
pub fn id_encoding(tag: u8) -> Option<Encoding> {
    if tag == 0 {
        return None;
    }
    ID_ENCODINGS.get(tag as usize - 1).copied()
}

/// Serialise an `xx_...` address to its `id` bytes: `[tag] ++ hash`.
///
/// `allowed` restricts which encodings this position accepts; an empty slice
/// accepts any id-able encoding.
pub fn serialize_id(address: &str, allowed: &[Encoding]) -> Result<Vec<u8>> {
    let (encoding, payload) = decode_any(address)?;
    let tag = id_tag(encoding).ok_or(Error::UnknownPrefix(encoding.prefix().to_string()))?;
    if !allowed.is_empty() && !allowed.contains(&encoding) {
        return Err(Error::FieldValue {
            field: "id",
            reason: format!(
                "expected one of {}, got {}",
                allowed
                    .iter()
                    .map(|e| e.prefix())
                    .collect::<Vec<_>>()
                    .join(", "),
                encoding.prefix()
            ),
        });
    }
    let mut out = Vec::with_capacity(1 + payload.len());
    out.push(tag);
    out.extend_from_slice(&payload);
    Ok(out)
}

/// Read `id` bytes back to an `xx_...` address.
pub fn deserialize_id(bytes: &[u8], allowed: &[Encoding]) -> Result<String> {
    let tag = *bytes.first().ok_or(Error::RlpShape {
        expected: "non-empty id",
    })?;
    let encoding = id_encoding(tag).ok_or(Error::UnknownPrefix(format!("id tag {tag}")))?;
    if !allowed.is_empty() && !allowed.contains(&encoding) {
        return Err(Error::FieldValue {
            field: "id",
            reason: format!("unexpected id encoding {}", encoding.prefix()),
        });
    }
    encode(&bytes[1..], encoding)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tags_are_one_based_and_stable() {
        assert_eq!(id_tag(Encoding::AccountAddress), Some(1));
        assert_eq!(id_tag(Encoding::Name), Some(2));
        assert_eq!(id_tag(Encoding::Commitment), Some(3));
        assert_eq!(id_tag(Encoding::OracleAddress), Some(4));
        assert_eq!(id_tag(Encoding::ContractAddress), Some(5));
        assert_eq!(id_tag(Encoding::Channel), Some(6));
        assert_eq!(id_tag(Encoding::Transaction), None);
        assert_eq!(id_encoding(0), None);
        assert_eq!(id_encoding(7), None);
    }

    #[test]
    fn round_trips_an_account_address() {
        let address = encode(&[7u8; 32], Encoding::AccountAddress).unwrap();
        let bytes = serialize_id(&address, &[Encoding::AccountAddress]).unwrap();
        assert_eq!(bytes.len(), 33);
        assert_eq!(bytes[0], 1);
        assert_eq!(deserialize_id(&bytes, &[]).unwrap(), address);
    }

    #[test]
    fn rejects_an_encoding_the_position_does_not_accept() {
        let oracle = encode(&[7u8; 32], Encoding::OracleAddress).unwrap();
        assert!(serialize_id(&oracle, &[Encoding::AccountAddress]).is_err());
        assert!(serialize_id(&oracle, &[Encoding::OracleAddress]).is_ok());
    }
}
