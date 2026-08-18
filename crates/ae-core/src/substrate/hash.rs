//! blake2b-256, the chain's object hash.
//!
//! Provisional — see [`crate::substrate`].

use blake2::digest::consts::U32;
use blake2::{Blake2b, Digest};

type Blake2b256 = Blake2b<U32>;

/// 256-bit blake2b of `input`, unkeyed.
pub fn blake2b_256(input: &[u8]) -> [u8; 32] {
    let mut hasher = Blake2b256::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_the_published_blake2b_256_vectors() {
        // RFC 7693 / BLAKE2 reference vectors for the unkeyed 32-byte digest.
        assert_eq!(
            hex::encode(blake2b_256(b"")),
            "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8"
        );
        assert_eq!(
            hex::encode(blake2b_256(b"abc")),
            "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319"
        );
        assert_eq!(
            hex::encode(blake2b_256(b"The quick brown fox jumps over the lazy dog")),
            "01718cec35cd3d796dd00020e0bfecb473ad23457d063b75eff29c0ffa2e58a9"
        );
    }
}
