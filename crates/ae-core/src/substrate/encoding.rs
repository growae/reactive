//! The `prefix_payload` api encoding.
//!
//! Provisional — see [`crate::substrate`]. Only the prefixes this row's modules
//! need are defined here; the full 27-prefix table belongs to the substrate row.

use base64::Engine as _;
use sha2::{Digest, Sha256};

use crate::error::{Error, Result};

/// How a prefix's payload is spelled.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Alphabet {
    Base58,
    Base64,
}

/// An api encoding prefix.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[non_exhaustive]
pub enum Encoding {
    /// `ak_` — account address.
    AccountAddress,
    /// `sk_` — account secret key seed.
    AccountSecretKey,
    /// `ct_` — contract address.
    ContractAddress,
    /// `ok_` — oracle address.
    OracleAddress,
    /// `oq_` — oracle query id.
    OracleQueryId,
    /// `nm_` — name.
    Name,
    /// `cm_` — name commitment.
    Commitment,
    /// `ch_` — state channel.
    Channel,
    /// `th_` — transaction hash.
    TxHash,
    /// `sg_` — signature.
    Signature,
    /// `st_` — state hash.
    State,
    /// `cb_` — contract bytearray.
    ContractBytearray,
    /// `ba_` — bytearray.
    Bytearray,
    /// `tx_` — transaction.
    Transaction,
    /// `pi_` — proof of inclusion.
    Poi,
}

impl Encoding {
    /// The literal prefix, without the underscore.
    pub const fn prefix(self) -> &'static str {
        match self {
            Self::AccountAddress => "ak",
            Self::AccountSecretKey => "sk",
            Self::ContractAddress => "ct",
            Self::OracleAddress => "ok",
            Self::OracleQueryId => "oq",
            Self::Name => "nm",
            Self::Commitment => "cm",
            Self::Channel => "ch",
            Self::TxHash => "th",
            Self::Signature => "sg",
            Self::State => "st",
            Self::ContractBytearray => "cb",
            Self::Bytearray => "ba",
            Self::Transaction => "tx",
            Self::Poi => "pi",
        }
    }

    const fn alphabet(self) -> Alphabet {
        match self {
            Self::ContractBytearray
            | Self::Bytearray
            | Self::Transaction
            | Self::Poi
            | Self::State => Alphabet::Base64,
            _ => Alphabet::Base58,
        }
    }

    /// The exact payload length this prefix requires, if it has one.
    pub const fn byte_size(self) -> Option<usize> {
        match self {
            Self::AccountAddress
            | Self::AccountSecretKey
            | Self::ContractAddress
            | Self::OracleAddress
            | Self::OracleQueryId
            | Self::Commitment
            | Self::Channel
            | Self::TxHash
            | Self::State => Some(32),
            Self::Signature => Some(64),
            _ => None,
        }
    }

    fn from_prefix(prefix: &str) -> Option<Self> {
        const ALL: &[Encoding] = &[
            Encoding::AccountAddress,
            Encoding::AccountSecretKey,
            Encoding::ContractAddress,
            Encoding::OracleAddress,
            Encoding::OracleQueryId,
            Encoding::Name,
            Encoding::Commitment,
            Encoding::Channel,
            Encoding::TxHash,
            Encoding::Signature,
            Encoding::State,
            Encoding::ContractBytearray,
            Encoding::Bytearray,
            Encoding::Transaction,
            Encoding::Poi,
        ];
        ALL.iter().copied().find(|e| e.prefix() == prefix)
    }
}

/// The first four bytes of `sha256(sha256(payload))`.
fn checksum(payload: &[u8]) -> [u8; 4] {
    let once = Sha256::digest(payload);
    let twice = Sha256::digest(once);
    [twice[0], twice[1], twice[2], twice[3]]
}

/// Encode `payload` under `encoding`.
///
/// # Panics
///
/// Never; a payload of the wrong length is caller error and is reported by
/// [`decode`] on the way back rather than rejected here, matching the reference
/// implementation.
pub fn encode(encoding: Encoding, payload: &[u8]) -> String {
    let mut with_checksum = payload.to_vec();
    with_checksum.extend_from_slice(&checksum(payload));
    let body = match encoding.alphabet() {
        Alphabet::Base58 => bs58::encode(&with_checksum).into_string(),
        Alphabet::Base64 => base64::engine::general_purpose::STANDARD.encode(&with_checksum),
    };
    format!("{}_{}", encoding.prefix(), body)
}

/// Decode `input`, checking the checksum, the prefix and the payload length.
pub fn decode(input: &str) -> Result<(Encoding, Vec<u8>)> {
    let (prefix, body) = input
        .split_once('_')
        .ok_or_else(|| Error::UnknownEncoding(input.to_owned()))?;
    let encoding =
        Encoding::from_prefix(prefix).ok_or_else(|| Error::UnknownEncoding(prefix.to_owned()))?;
    let raw = match encoding.alphabet() {
        Alphabet::Base58 => bs58::decode(body)
            .into_vec()
            .map_err(|_| Error::BadPayload("not base58"))?,
        Alphabet::Base64 => base64::engine::general_purpose::STANDARD
            .decode(body)
            .map_err(|_| Error::BadPayload("not base64"))?,
    };
    if raw.len() < 4 {
        return Err(Error::BadPayload("shorter than its checksum"));
    }
    let (payload, found) = raw.split_at(raw.len() - 4);
    if checksum(payload) != found {
        return Err(Error::InvalidChecksum);
    }
    if let Some(expected) = encoding.byte_size() {
        if payload.len() != expected {
            return Err(Error::PayloadLength {
                expected,
                got: payload.len(),
            });
        }
    }
    Ok((encoding, payload.to_vec()))
}

/// Decode `input` and require it to carry `expected`.
pub fn decode_as(expected: Encoding, input: &str) -> Result<Vec<u8>> {
    let (encoding, payload) = decode(input)?;
    if encoding != expected {
        return Err(Error::UnknownEncoding(encoding.prefix().to_owned()));
    }
    Ok(payload)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The all-zero account, which the reference sdk uses as its dry-run account.
    const ZERO_ACCOUNT: &str = "ak_11111111111111111111111111111111273Yts";

    #[test]
    fn matches_the_published_dry_run_account_encoding() {
        assert_eq!(encode(Encoding::AccountAddress, &[0u8; 32]), ZERO_ACCOUNT);
        assert_eq!(
            decode_as(Encoding::AccountAddress, ZERO_ACCOUNT).unwrap(),
            vec![0u8; 32]
        );
    }

    #[test]
    fn round_trips_both_alphabets() {
        let payload: Vec<u8> = (0u8..=255).collect();
        let encoded = encode(Encoding::Bytearray, &payload);
        assert!(encoded.starts_with("ba_"));
        assert_eq!(decode_as(Encoding::Bytearray, &encoded).unwrap(), payload);

        let key = [7u8; 32];
        let encoded = encode(Encoding::ContractAddress, &key);
        assert!(encoded.starts_with("ct_"));
        assert_eq!(decode_as(Encoding::ContractAddress, &encoded).unwrap(), key);
    }

    #[test]
    fn rejects_a_flipped_bit() {
        let good = encode(Encoding::AccountAddress, &[1u8; 32]);
        let mut chars: Vec<char> = good.chars().collect();
        let last = chars.len() - 1;
        chars[last] = if chars[last] == 'a' { 'b' } else { 'a' };
        let tampered: String = chars.into_iter().collect();
        assert!(decode(&tampered).is_err());
    }

    #[test]
    fn rejects_the_wrong_prefix_and_the_wrong_length() {
        let account = encode(Encoding::AccountAddress, &[1u8; 32]);
        assert!(matches!(
            decode_as(Encoding::ContractAddress, &account),
            Err(Error::UnknownEncoding(_))
        ));
        let short = encode(Encoding::AccountAddress, &[1u8; 31]);
        assert!(matches!(
            decode(&short),
            Err(Error::PayloadLength {
                expected: 32,
                got: 31
            })
        ));
        assert!(matches!(decode("nope"), Err(Error::UnknownEncoding(_))));
    }
}
