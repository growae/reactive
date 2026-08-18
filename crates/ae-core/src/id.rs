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

/// A tagged 32-byte chain object reference, as a value.
///
/// The functions above are the transaction serialiser's view, where a field
/// arrives as an already-encoded `ak_…` string and leaves as bytes. State
/// entries want the other view: a value that has been checked once and can be
/// carried around without re-parsing. Both spell the same bytes — the tag table
/// lives in [`ID_ENCODINGS`] and neither has a copy of it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Id {
    encoding: Encoding,
    key: [u8; 32],
}

impl Id {
    /// Build an id, or fail if `encoding` is not one of the six.
    pub fn new(encoding: Encoding, key: [u8; 32]) -> Result<Self> {
        if id_tag(encoding).is_none() {
            return Err(Error::UnknownPrefix(encoding.prefix().to_string()));
        }
        Ok(Self { encoding, key })
    }

    /// An account id, `ak_…`.
    pub const fn account(key: [u8; 32]) -> Self {
        Self {
            encoding: Encoding::AccountAddress,
            key,
        }
    }

    /// A contract id, `ct_…`.
    pub const fn contract(key: [u8; 32]) -> Self {
        Self {
            encoding: Encoding::ContractAddress,
            key,
        }
    }

    /// An oracle id, `ok_…`.
    pub const fn oracle(key: [u8; 32]) -> Self {
        Self {
            encoding: Encoding::OracleAddress,
            key,
        }
    }

    /// A name id, `nm_…`.
    pub const fn name(key: [u8; 32]) -> Self {
        Self {
            encoding: Encoding::Name,
            key,
        }
    }

    /// A channel id, `ch_…`.
    pub const fn channel(key: [u8; 32]) -> Self {
        Self {
            encoding: Encoding::Channel,
            key,
        }
    }

    /// What this id points at.
    pub const fn encoding(&self) -> Encoding {
        self.encoding
    }

    /// The 32-byte key.
    pub const fn key(&self) -> &[u8; 32] {
        &self.key
    }

    /// The 33-byte wire form: tag byte, then key.
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(33);
        // Infallible: every constructor checks the encoding is an id encoding.
        out.push(id_tag(self.encoding).unwrap_or_default());
        out.extend_from_slice(&self.key);
        out
    }

    /// Read the 33-byte wire form.
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        if bytes.len() != 33 {
            return Err(Error::PayloadLength {
                expected: 33,
                actual: bytes.len(),
            });
        }
        let encoding = id_encoding(bytes[0])
            .ok_or_else(|| Error::UnknownPrefix(format!("id tag {}", bytes[0])))?;
        let mut key = [0u8; 32];
        key.copy_from_slice(&bytes[1..]);
        Ok(Self { encoding, key })
    }

    /// The api-encoded spelling, e.g. `ak_…`.
    pub fn to_encoded(&self) -> Result<String> {
        encode(&self.key, self.encoding)
    }

    /// Parse an api-encoded spelling.
    pub fn from_encoded(input: &str) -> Result<Self> {
        let (encoding, payload) = decode_any(input)?;
        let key: [u8; 32] = payload
            .as_slice()
            .try_into()
            .map_err(|_| Error::PayloadLength {
                expected: 32,
                actual: payload.len(),
            })?;
        Self::new(encoding, key)
    }
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
    fn the_value_form_and_the_field_form_spell_the_same_bytes() {
        let id = Id::account([7u8; 32]);
        let address = encode(&[7u8; 32], Encoding::AccountAddress).unwrap();
        assert_eq!(id.to_bytes(), serialize_id(&address, &[]).unwrap());
        assert_eq!(id.to_encoded().unwrap(), address);
        assert_eq!(Id::from_bytes(&id.to_bytes()).unwrap(), id);
        assert_eq!(Id::from_encoded(&address).unwrap(), id);
    }

    #[test]
    fn every_id_encoding_round_trips_as_a_value() {
        for (index, encoding) in ID_ENCODINGS.into_iter().enumerate() {
            let id = Id::new(encoding, [index as u8; 32]).unwrap();
            assert_eq!(id.to_bytes()[0], index as u8 + 1);
            assert_eq!(Id::from_bytes(&id.to_bytes()).unwrap(), id);
            assert_eq!(Id::from_encoded(&id.to_encoded().unwrap()).unwrap(), id);
        }
        // Not one of the six.
        assert!(Id::new(Encoding::Transaction, [0u8; 32]).is_err());
        // A tag byte outside 1..=6, and a payload of the wrong length.
        let mut bytes = Id::account([0u8; 32]).to_bytes();
        bytes[0] = 9;
        assert!(Id::from_bytes(&bytes).is_err());
        assert!(Id::from_bytes(&bytes[..32]).is_err());
    }

    #[test]
    fn rejects_an_encoding_the_position_does_not_accept() {
        let oracle = encode(&[7u8; 32], Encoding::OracleAddress).unwrap();
        assert!(serialize_id(&oracle, &[Encoding::AccountAddress]).is_err());
        assert!(serialize_id(&oracle, &[Encoding::OracleAddress]).is_ok());
    }
}
