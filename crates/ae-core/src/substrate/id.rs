//! The `id()` field type: a one-byte object tag followed by a 32-byte key.
//!
//! Provisional — see [`crate::substrate`].

use crate::error::{Error, Result};
use crate::substrate::encoding::{self, Encoding};

/// What kind of chain object an [`Id`] points at.
///
/// Wire values are fixed by the protocol; see `aeser_id:encode_tag/1`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum IdTag {
    /// `ak_`
    Account = 1,
    /// `nm_`
    Name = 2,
    /// `cm_`
    Commitment = 3,
    /// `ok_`
    Oracle = 4,
    /// `ct_`
    Contract = 5,
    /// `ch_`
    Channel = 6,
}

impl IdTag {
    fn from_wire(byte: u8) -> Result<Self> {
        Ok(match byte {
            1 => Self::Account,
            2 => Self::Name,
            3 => Self::Commitment,
            4 => Self::Oracle,
            5 => Self::Contract,
            6 => Self::Channel,
            other => return Err(Error::UnknownIdTag(other)),
        })
    }

    /// The api encoding prefix that spells this tag.
    pub const fn encoding(self) -> Encoding {
        match self {
            Self::Account => Encoding::AccountAddress,
            Self::Name => Encoding::Name,
            Self::Commitment => Encoding::Commitment,
            Self::Oracle => Encoding::OracleAddress,
            Self::Contract => Encoding::ContractAddress,
            Self::Channel => Encoding::Channel,
        }
    }
}

/// A tagged 32-byte chain object reference.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Id {
    /// What the key points at.
    pub tag: IdTag,
    /// The 32-byte key.
    pub key: [u8; 32],
}

impl Id {
    /// Build an id from its parts.
    pub const fn new(tag: IdTag, key: [u8; 32]) -> Self {
        Self { tag, key }
    }

    /// The 33-byte wire form.
    pub fn to_bytes(self) -> Vec<u8> {
        let mut out = Vec::with_capacity(33);
        out.push(self.tag as u8);
        out.extend_from_slice(&self.key);
        out
    }

    /// Read the 33-byte wire form.
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        if bytes.len() != 33 {
            return Err(Error::PayloadLength {
                expected: 33,
                got: bytes.len(),
            });
        }
        let mut key = [0u8; 32];
        key.copy_from_slice(&bytes[1..]);
        Ok(Self {
            tag: IdTag::from_wire(bytes[0])?,
            key,
        })
    }

    /// The api-encoded spelling, e.g. `ak_…`.
    pub fn to_encoded(self) -> String {
        encoding::encode(self.tag.encoding(), &self.key)
    }

    /// Parse an api-encoded spelling into an id.
    pub fn from_encoded(input: &str) -> Result<Self> {
        let (encoding, payload) = encoding::decode(input)?;
        let tag = match encoding {
            Encoding::AccountAddress => IdTag::Account,
            Encoding::Name => IdTag::Name,
            Encoding::Commitment => IdTag::Commitment,
            Encoding::OracleAddress => IdTag::Oracle,
            Encoding::ContractAddress => IdTag::Contract,
            Encoding::Channel => IdTag::Channel,
            other => return Err(Error::UnknownEncoding(other.prefix().to_owned())),
        };
        let key: [u8; 32] = payload.try_into().map_err(|_| Error::PayloadLength {
            expected: 32,
            got: 0,
        })?;
        Ok(Self { tag, key })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_every_tag_through_bytes_and_text() {
        let tags = [
            IdTag::Account,
            IdTag::Name,
            IdTag::Commitment,
            IdTag::Oracle,
            IdTag::Contract,
            IdTag::Channel,
        ];
        for (index, tag) in tags.into_iter().enumerate() {
            let id = Id::new(tag, [index as u8; 32]);
            let bytes = id.to_bytes();
            assert_eq!(bytes.len(), 33);
            assert_eq!(bytes[0], tag as u8);
            assert_eq!(Id::from_bytes(&bytes).unwrap(), id);
            assert_eq!(Id::from_encoded(&id.to_encoded()).unwrap(), id);
        }
    }

    #[test]
    fn rejects_an_unknown_tag_byte_and_a_short_payload() {
        let mut bytes = Id::new(IdTag::Account, [0u8; 32]).to_bytes();
        bytes[0] = 7;
        assert!(matches!(Id::from_bytes(&bytes), Err(Error::UnknownIdTag(7))));
        assert!(Id::from_bytes(&bytes[..32]).is_err());
    }

    #[test]
    fn oracle_and_account_ids_differ_only_by_their_tag() {
        let key = [9u8; 32];
        let account = Id::new(IdTag::Account, key);
        let oracle = Id::new(IdTag::Oracle, key);
        assert_ne!(account.to_bytes(), oracle.to_bytes());
        assert_eq!(account.to_bytes()[1..], oracle.to_bytes()[1..]);
        assert!(account.to_encoded().starts_with("ak_"));
        assert!(oracle.to_encoded().starts_with("ok_"));
    }
}
