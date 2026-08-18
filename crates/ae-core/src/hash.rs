//! The two hashes the protocol uses: blake2b-256 everywhere, SHA-256 for the
//! api-encoding checksum only.

use blake2::digest::consts::U32;
use blake2::{Blake2b, Digest};
use sha2::Sha256;

type Blake2b256 = Blake2b<U32>;

/// 256-bit blake2b, unkeyed. This is *the* aeternity hash: transaction hashes,
/// name ids, commitments, contract ids and the buffer that gets signed.
pub fn blake2b_256(input: &[u8]) -> [u8; 32] {
    let mut hasher = Blake2b256::new();
    hasher.update(input);
    hasher.finalize().into()
}

/// SHA-256. Used only to build the four-byte api-encoding checksum.
pub fn sha256(input: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blake2b_256_matches_the_published_vector() {
        // BLAKE2b-256 of the empty string, from the reference test vectors.
        assert_eq!(
            hex::encode(blake2b_256(b"")),
            "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8"
        );
        // BLAKE2b-256 of "abc".
        assert_eq!(
            hex::encode(blake2b_256(b"abc")),
            "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319"
        );
    }

    #[test]
    fn sha256_matches_the_published_vector() {
        assert_eq!(
            hex::encode(sha256(b"abc")),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }
}
