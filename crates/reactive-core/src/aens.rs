//! AENS names: normalisation, name id, commitment hash, minimum name fee.

use crate::encoding::{decode, encode, Encoding};
use crate::error::{Error, Result};
use crate::hash::blake2b_256;
use num_bigint::BigUint;

/// The only AENS suffix the protocol accepts, including the dot.
pub const AENS_SUFFIX: &str = ".chain";

/// The name length at or above which the base name fee stops decreasing.
pub const NAME_MAX_LENGTH_FEE: usize = 31;

/// One AE, in aettos — the multiplier applied to the name bid range table.
const NAME_FEE_MULTIPLIER: u64 = 100_000_000_000_000;

/// Base name fee by name length, indexed by `length - 1`, before the multiplier.
/// Lengths above [`NAME_MAX_LENGTH_FEE`] all use the last entry.
const NAME_BID_RANGES: [u64; NAME_MAX_LENGTH_FEE] = [
    5_702_887, 3_524_578, 2_178_309, 1_346_269, 832_040, 514_229, 317_811, 196_418, 121_393,
    75_025, 46_368, 28_657, 17_711, 10_946, 6_765, 4_181, 2_584, 1_597, 987, 610, 377, 233, 144,
    89, 55, 34, 21, 13, 8, 5, 3,
];

/// Normalise an AENS name to the form that gets hashed.
///
/// **Known gap, deliberately not guessed:** the reference implementation runs the
/// label through the WHATWG URL host parser, which applies IDNA/UTS-46 to
/// non-ASCII labels. This function rejects non-ASCII labels rather than
/// implementing a partial punycode conversion that would silently produce a
/// different name id. Everything the ASCII path does is reproduced exactly.
pub fn name_to_punycode(name: &str) -> Result<String> {
    let mut parts = name.split('.');
    let label = parts
        .next()
        .ok_or_else(|| Error::Name(format!("{name} is not a name")))?;
    let suffix = parts
        .next()
        .ok_or_else(|| Error::Name(format!("{name} must be suffixed with {AENS_SUFFIX}")))?;
    if parts.next().is_some() {
        return Err(Error::Name(format!("{name} must include only one dot")));
    }
    if suffix != &AENS_SUFFIX[1..] {
        return Err(Error::Name(format!(
            "{name} must be suffixed with {AENS_SUFFIX}"
        )));
    }
    if label.is_empty() {
        return Err(Error::Name(format!("{name} has an empty label")));
    }
    if !label.is_ascii() {
        return Err(Error::Name(format!(
            "{name}: non-ASCII names need IDNA conversion, which this crate does not implement yet"
        )));
    }
    let label = label.to_ascii_lowercase();
    let bytes = label.as_bytes();
    if bytes.get(2) == Some(&b'-') && bytes.get(3) == Some(&b'-') {
        return Err(Error::Name(format!(
            "{name} must not have '-' in both the third and fourth positions"
        )));
    }
    if bytes[0] == b'-' {
        return Err(Error::Name(format!("{name} must not start with '-'")));
    }
    if bytes[bytes.len() - 1] == b'-' {
        return Err(Error::Name(format!("{name} must not end with '-'")));
    }
    if !bytes
        .iter()
        .all(|c| c.is_ascii_alphanumeric() || *c == b'-')
    {
        return Err(Error::Name(format!("{name} contains illegal characters")));
    }
    if label.len() > 63 {
        return Err(Error::Name(format!("{name} is too long")));
    }
    Ok(format!("{label}{AENS_SUFFIX}"))
}

/// Whether `name` is a well-formed AENS name.
pub fn is_name(name: &str) -> bool {
    name_to_punycode(name).is_ok()
}

/// The `nm_` name id: blake2b-256 of the normalised name.
pub fn produce_name_id(name: &str) -> Result<String> {
    encode(
        &blake2b_256(name_to_punycode(name)?.as_bytes()),
        Encoding::Name,
    )
}

/// The `cm_` commitment hash: blake2b-256 of the normalised name followed by the
/// salt as a 32-byte big-endian value.
pub fn commitment_hash(name: &str, salt: &BigUint) -> Result<String> {
    let mut buffer = name_to_punycode(name)?.into_bytes();
    buffer.extend_from_slice(&to_32_bytes_be(salt, "salt")?);
    encode(&blake2b_256(&buffer), Encoding::Commitment)
}

/// Left-pad an unsigned integer to exactly 32 big-endian bytes.
fn to_32_bytes_be(value: &BigUint, what: &str) -> Result<[u8; 32]> {
    let bytes = value.to_bytes_be();
    if bytes.len() > 32 {
        return Err(Error::Name(format!("{what} does not fit in 32 bytes")));
    }
    let mut out = [0u8; 32];
    out[32 - bytes.len()..].copy_from_slice(&bytes);
    Ok(out)
}

/// The minimum fee, in aettos, that a `NameClaimTx` for this name must carry.
pub fn minimum_name_fee(name: &str) -> Result<BigUint> {
    let length = name_to_punycode(name)?.len() - AENS_SUFFIX.len();
    let index = length.min(NAME_MAX_LENGTH_FEE) - 1;
    Ok(BigUint::from(NAME_BID_RANGES[index]) * BigUint::from(NAME_FEE_MULTIPLIER))
}

/// The `ct_` contract address a `ContractCreateTx` or `GaAttachTx` will produce.
pub fn build_contract_id(owner: &str, nonce: &BigUint) -> Result<String> {
    let mut buffer = decode(owner)?;
    buffer.extend_from_slice(&crate::bytes::uint_to_bytes(nonce));
    encode(&blake2b_256(&buffer), Encoding::ContractAddress)
}

/// The `oq_` query id an `OracleQueryTx` will produce.
pub fn oracle_query_id(sender: &str, nonce: &BigUint, oracle: &str) -> Result<String> {
    let mut buffer = decode(sender)?;
    buffer.extend_from_slice(&to_32_bytes_be(nonce, "nonce")?);
    buffer.extend_from_slice(&decode(oracle)?);
    encode(&blake2b_256(&buffer), Encoding::OracleQueryId)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalises_and_lowercases() {
        assert_eq!(name_to_punycode("Foo.chain").unwrap(), "foo.chain");
        assert_eq!(name_to_punycode("a-b-c.chain").unwrap(), "a-b-c.chain");
    }

    #[test]
    fn rejects_what_the_reference_rejects() {
        for bad in [
            "foo",           // no suffix
            "foo.test",      // wrong suffix
            "a.b.chain",     // two dots
            ".chain",        // empty label
            "-foo.chain",    // leading dash
            "foo-.chain",    // trailing dash
            "ab--cd.chain",  // dash in third and fourth position
            "foo bar.chain", // illegal character
            "😀.chain",      // non-ASCII, see name_to_punycode's doc comment
        ] {
            assert!(name_to_punycode(bad).is_err(), "{bad} should be rejected");
        }
        assert!(name_to_punycode(&format!("{}.chain", "a".repeat(64))).is_err());
        assert!(name_to_punycode(&format!("{}.chain", "a".repeat(63))).is_ok());
    }

    #[test]
    fn name_fee_follows_the_fibonacci_table() {
        // A one-character name is the most expensive; 31 characters and above the
        // cheapest, and the table stops decreasing there.
        assert_eq!(
            minimum_name_fee("a.chain").unwrap(),
            BigUint::from(5_702_887u64) * BigUint::from(100_000_000_000_000u64)
        );
        assert_eq!(
            minimum_name_fee(&format!("{}.chain", "a".repeat(31))).unwrap(),
            BigUint::from(3u64) * BigUint::from(100_000_000_000_000u64)
        );
        assert_eq!(
            minimum_name_fee(&format!("{}.chain", "a".repeat(63))).unwrap(),
            minimum_name_fee(&format!("{}.chain", "a".repeat(31))).unwrap()
        );
        assert_eq!(
            minimum_name_fee("abcdefghijkl.chain").unwrap(),
            BigUint::from(28_657u64) * BigUint::from(100_000_000_000_000u64)
        );
    }

    #[test]
    fn name_id_is_stable_and_case_insensitive() {
        let id = produce_name_id("test.chain").unwrap();
        assert!(id.starts_with("nm_"));
        assert_eq!(produce_name_id("TEST.chain").unwrap(), id);
        assert_ne!(produce_name_id("other.chain").unwrap(), id);
        assert_eq!(decode(&id).unwrap(), blake2b_256(b"test.chain"));
    }

    #[test]
    fn commitment_hash_pads_the_salt_to_32_bytes() {
        let hash = commitment_hash("test.chain", &BigUint::from(1u8)).unwrap();
        let mut expected = b"test.chain".to_vec();
        expected.extend_from_slice(&{
            let mut salt = [0u8; 32];
            salt[31] = 1;
            salt
        });
        assert_eq!(decode(&hash).unwrap(), blake2b_256(&expected));
    }

    #[test]
    fn contract_id_hashes_owner_and_nonce() {
        let owner = encode(&[3u8; 32], Encoding::AccountAddress).unwrap();
        let id = build_contract_id(&owner, &BigUint::from(1u8)).unwrap();
        assert!(id.starts_with("ct_"));
        let mut expected = vec![3u8; 32];
        expected.push(1);
        assert_eq!(decode(&id).unwrap(), blake2b_256(&expected));
    }

    #[test]
    fn oracle_query_id_pads_the_nonce_to_32_bytes() {
        let sender = encode(&[1u8; 32], Encoding::AccountAddress).unwrap();
        let oracle = encode(&[2u8; 32], Encoding::OracleAddress).unwrap();
        let id = oracle_query_id(&sender, &BigUint::from(5u8), &oracle).unwrap();
        let mut expected = vec![1u8; 32];
        expected.extend_from_slice(&[0u8; 31]);
        expected.push(5);
        expected.extend_from_slice(&[2u8; 32]);
        assert_eq!(decode(&id).unwrap(), blake2b_256(&expected));
    }
}
