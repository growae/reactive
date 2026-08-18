//! The `xx_...` api encoding: 27 prefixes over base58check and base64check.
//!
//! Mirrors `aeser_api_encoder.erl`. Which prefix takes base58 and which takes
//! base64 is not derivable from anything — it is a table, and it is reproduced
//! verbatim below. The checksum is the first four bytes of a double SHA-256,
//! appended to the payload before the alphabet is applied.

use crate::error::{Error, Result};
use crate::hash::sha256;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine as _;

/// One of the 27 api encodings, identified by its two-character prefix.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum Encoding {
    /// `kh_` key block hash
    KeyBlockHash,
    /// `mh_` micro block hash
    MicroBlockHash,
    /// `bf_` block proof-of-fraud hash
    BlockPofHash,
    /// `bx_` block transaction hash
    BlockTxHash,
    /// `bs_` block state hash
    BlockStateHash,
    /// `ch_` state channel
    Channel,
    /// `ct_` contract address
    ContractAddress,
    /// `cb_` contract bytearray
    ContractBytearray,
    /// `ck_` contract store key
    ContractStoreKey,
    /// `cv_` contract store value
    ContractStoreValue,
    /// `tx_` transaction
    Transaction,
    /// `th_` transaction hash
    TxHash,
    /// `ok_` oracle address
    OracleAddress,
    /// `ov_` oracle query
    OracleQuery,
    /// `oq_` oracle query id
    OracleQueryId,
    /// `or_` oracle response
    OracleResponse,
    /// `ak_` account address
    AccountAddress,
    /// `sk_` account secret key
    AccountSecretKey,
    /// `sg_` signature
    Signature,
    /// `cm_` AENS commitment
    Commitment,
    /// `pp_` peer pubkey
    PeerPubkey,
    /// `nm_` AENS name
    Name,
    /// `st_` state hash
    State,
    /// `pi_` proof of inclusion
    Poi,
    /// `ss_` state trees
    StateTrees,
    /// `cs_` call state tree
    CallStateTree,
    /// `ba_` bytearray
    Bytearray,
}

/// Every encoding, in the order `aeser_api_encoder.erl` lists them.
pub const ALL_ENCODINGS: [Encoding; 27] = [
    Encoding::KeyBlockHash,
    Encoding::MicroBlockHash,
    Encoding::BlockPofHash,
    Encoding::BlockTxHash,
    Encoding::BlockStateHash,
    Encoding::Channel,
    Encoding::ContractAddress,
    Encoding::ContractBytearray,
    Encoding::ContractStoreKey,
    Encoding::ContractStoreValue,
    Encoding::Transaction,
    Encoding::TxHash,
    Encoding::OracleAddress,
    Encoding::OracleQuery,
    Encoding::OracleQueryId,
    Encoding::OracleResponse,
    Encoding::AccountAddress,
    Encoding::AccountSecretKey,
    Encoding::Signature,
    Encoding::Commitment,
    Encoding::PeerPubkey,
    Encoding::Name,
    Encoding::State,
    Encoding::Poi,
    Encoding::StateTrees,
    Encoding::CallStateTree,
    Encoding::Bytearray,
];

/// Which alphabet an encoding's payload is written in.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Alphabet {
    Base58,
    Base64,
}

impl Encoding {
    /// The two-character prefix, without the underscore.
    pub const fn prefix(self) -> &'static str {
        match self {
            Encoding::KeyBlockHash => "kh",
            Encoding::MicroBlockHash => "mh",
            Encoding::BlockPofHash => "bf",
            Encoding::BlockTxHash => "bx",
            Encoding::BlockStateHash => "bs",
            Encoding::Channel => "ch",
            Encoding::ContractAddress => "ct",
            Encoding::ContractBytearray => "cb",
            Encoding::ContractStoreKey => "ck",
            Encoding::ContractStoreValue => "cv",
            Encoding::Transaction => "tx",
            Encoding::TxHash => "th",
            Encoding::OracleAddress => "ok",
            Encoding::OracleQuery => "ov",
            Encoding::OracleQueryId => "oq",
            Encoding::OracleResponse => "or",
            Encoding::AccountAddress => "ak",
            Encoding::AccountSecretKey => "sk",
            Encoding::Signature => "sg",
            Encoding::Commitment => "cm",
            Encoding::PeerPubkey => "pp",
            Encoding::Name => "nm",
            Encoding::State => "st",
            Encoding::Poi => "pi",
            Encoding::StateTrees => "ss",
            Encoding::CallStateTree => "cs",
            Encoding::Bytearray => "ba",
        }
    }

    /// Look an encoding up by its two-character prefix.
    pub fn from_prefix(prefix: &str) -> Option<Encoding> {
        ALL_ENCODINGS.into_iter().find(|e| e.prefix() == prefix)
    }

    const fn alphabet(self) -> Alphabet {
        match self {
            Encoding::ContractBytearray
            | Encoding::ContractStoreKey
            | Encoding::ContractStoreValue
            | Encoding::Transaction
            | Encoding::OracleQuery
            | Encoding::OracleResponse
            | Encoding::State
            | Encoding::Poi
            | Encoding::StateTrees
            | Encoding::CallStateTree
            | Encoding::Bytearray => Alphabet::Base64,
            _ => Alphabet::Base58,
        }
    }

    /// The exact payload length this encoding requires, when it fixes one.
    pub const fn byte_size(self) -> Option<usize> {
        match self {
            Encoding::KeyBlockHash
            | Encoding::MicroBlockHash
            | Encoding::BlockPofHash
            | Encoding::BlockTxHash
            | Encoding::BlockStateHash
            | Encoding::Channel
            | Encoding::ContractAddress
            | Encoding::TxHash
            | Encoding::OracleAddress
            | Encoding::OracleQueryId
            | Encoding::AccountAddress
            | Encoding::AccountSecretKey
            | Encoding::Commitment
            | Encoding::PeerPubkey
            | Encoding::State => Some(32),
            Encoding::Signature => Some(64),
            _ => None,
        }
    }
}

impl core::fmt::Display for Encoding {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.write_str(self.prefix())
    }
}

fn checksum(payload: &[u8]) -> [u8; 4] {
    let digest = sha256(&sha256(payload));
    [digest[0], digest[1], digest[2], digest[3]]
}

fn ensure_valid_length(data: &[u8], encoding: Encoding) -> Result<()> {
    match encoding.byte_size() {
        Some(expected) if data.len() != expected => Err(Error::PayloadLength {
            expected,
            actual: data.len(),
        }),
        _ => Ok(()),
    }
}

/// Encode raw bytes as an `xx_...` string.
pub fn encode(data: &[u8], encoding: Encoding) -> Result<String> {
    ensure_valid_length(data, encoding)?;
    let mut with_checksum = data.to_vec();
    with_checksum.extend_from_slice(&checksum(data));
    let body = match encoding.alphabet() {
        Alphabet::Base58 => bs58::encode(&with_checksum).into_string(),
        Alphabet::Base64 => BASE64.encode(&with_checksum),
    };
    Ok(format!("{}_{}", encoding.prefix(), body))
}

/// Decode an `xx_...` string back to raw bytes, checking prefix, checksum and length.
pub fn decode(data: &str) -> Result<Vec<u8>> {
    Ok(decode_any(data)?.1)
}

/// Decode an `xx_...` string, also reporting which encoding it carried.
pub fn decode_any(data: &str) -> Result<(Encoding, Vec<u8>)> {
    let mut parts = data.split('_');
    let prefix = parts
        .next()
        .ok_or_else(|| Error::Decode(data.to_string()))?;
    let body = parts
        .next()
        .ok_or_else(|| Error::Decode(format!("encoded string missing payload: {data}")))?;
    if parts.next().is_some() {
        return Err(Error::Decode(format!(
            "encoded string has extra parts: {data}"
        )));
    }
    let encoding =
        Encoding::from_prefix(prefix).ok_or_else(|| Error::UnknownPrefix(prefix.to_string()))?;

    let raw = match encoding.alphabet() {
        Alphabet::Base58 => bs58::decode(body)
            .into_vec()
            .map_err(|e| Error::InvalidPayload {
                kind: "base58",
                reason: e.to_string(),
            })?,
        Alphabet::Base64 => BASE64.decode(body).map_err(|e| Error::InvalidPayload {
            kind: "base64",
            reason: e.to_string(),
        })?,
    };
    if raw.len() < 4 {
        return Err(Error::InvalidChecksum);
    }
    let (payload, found) = raw.split_at(raw.len() - 4);
    if checksum(payload) != found {
        return Err(Error::InvalidChecksum);
    }
    ensure_valid_length(payload, encoding)?;
    Ok((encoding, payload.to_vec()))
}

/// Whether `data` decodes cleanly as one of `encodings`.
pub fn is_encoded(data: &str, encodings: &[Encoding]) -> bool {
    match decode_any(data) {
        Ok((encoding, _)) => encodings.is_empty() || encodings.contains(&encoding),
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_prefix_is_two_chars_and_unique() {
        let mut prefixes: Vec<&str> = ALL_ENCODINGS.iter().map(|e| e.prefix()).collect();
        assert_eq!(prefixes.len(), 27);
        prefixes.sort_unstable();
        prefixes.dedup();
        assert_eq!(prefixes.len(), 27);
        assert!(ALL_ENCODINGS.iter().all(|e| e.prefix().len() == 2));
    }

    #[test]
    fn round_trips_every_encoding() {
        for encoding in ALL_ENCODINGS {
            let payload = vec![0x2au8; encoding.byte_size().unwrap_or(7)];
            let encoded = encode(&payload, encoding).unwrap();
            assert!(encoded.starts_with(&format!("{}_", encoding.prefix())));
            assert_eq!(decode(&encoded).unwrap(), payload);
            assert_eq!(decode_any(&encoded).unwrap().0, encoding);
        }
    }

    #[test]
    fn matches_the_reference_dry_run_account() {
        // `DRY_RUN_ACCOUNT.pub` from the reference SDK, an all-zero public key.
        let address = "ak_11111111111111111111111111111111273Yts";
        assert_eq!(decode(address).unwrap(), vec![0u8; 32]);
        assert_eq!(
            encode(&[0u8; 32], Encoding::AccountAddress).unwrap(),
            address
        );
    }

    #[test]
    fn rejects_a_corrupted_checksum() {
        let mut encoded = encode(&[1u8; 32], Encoding::AccountAddress).unwrap();
        let last = encoded.pop().unwrap();
        encoded.push(if last == 'a' { 'b' } else { 'a' });
        assert_eq!(decode(&encoded), Err(Error::InvalidChecksum));
    }

    #[test]
    fn rejects_the_wrong_payload_length() {
        assert_eq!(
            encode(&[0u8; 31], Encoding::AccountAddress),
            Err(Error::PayloadLength {
                expected: 32,
                actual: 31
            })
        );
    }

    #[test]
    fn rejects_a_missing_payload_and_extra_parts() {
        assert!(matches!(decode("ak"), Err(Error::Decode(_))));
        assert!(matches!(decode("ak_aaa_aaa"), Err(Error::Decode(_))));
        assert!(matches!(decode("zz_aaa"), Err(Error::UnknownPrefix(_))));
    }
}
