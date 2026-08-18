//! Ed25519 over the network-id prefix rule.
//!
//! The bytes that get signed are **not** the transaction. They are
//! `network_id ++ blake2b_256(rlp_tx)`, and for a transaction wrapped in a
//! `GaMetaTx` or `PayingForTx` the prefix becomes `network_id ++ "-inner_tx"`.
//! Getting this wrong produces a signature that verifies locally and is rejected
//! by every node, which is why it lives next to the encoding substrate rather
//! than in a wallet.
//!
//! This module signs with key bytes the caller supplies. It reads no files and
//! generates no keys; tests use fixed all-zero and RFC 8032 seeds.

use crate::encoding::{decode, encode, Encoding};
use crate::error::{Error, Result};
use crate::hash::blake2b_256;
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};

/// The mainnet network id.
pub const NETWORK_ID_MAINNET: &str = "ae_mainnet";
/// The public testnet network id.
pub const NETWORK_ID_TESTNET: &str = "ae_uat";

/// Whether the transaction being signed is the inner transaction of a
/// `GaMetaTx` or `PayingForTx`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TxPosition {
    /// A top-level transaction.
    Outer,
    /// A transaction wrapped by `GaMetaTx` or `PayingForTx`.
    Inner,
}

/// Build the exact byte buffer a signature is taken over.
///
/// `rlp_tx` is the *decoded* transaction — the RLP bytes, not the `tx_` string.
pub fn buffer_to_sign(rlp_tx: &[u8], network_id: &str, position: TxPosition) -> Vec<u8> {
    let prefix = match position {
        TxPosition::Outer => network_id.to_string(),
        TxPosition::Inner => format!("{network_id}-inner_tx"),
    };
    let mut buffer = prefix.into_bytes();
    buffer.extend_from_slice(&blake2b_256(rlp_tx));
    buffer
}

/// Sign a transaction with a 32-byte Ed25519 seed.
///
/// The seed is the payload of an `sk_` string. Returns the raw 64-byte signature.
pub fn sign_transaction(
    rlp_tx: &[u8],
    seed: &[u8; 32],
    network_id: &str,
    position: TxPosition,
) -> [u8; 64] {
    let key = SigningKey::from_bytes(seed);
    key.sign(&buffer_to_sign(rlp_tx, network_id, position))
        .to_bytes()
}

/// Verify a transaction signature against an `ak_` address.
pub fn verify_transaction(
    rlp_tx: &[u8],
    signature: &[u8; 64],
    address: &str,
    network_id: &str,
    position: TxPosition,
) -> Result<bool> {
    verify(
        &buffer_to_sign(rlp_tx, network_id, position),
        signature,
        address,
    )
}

/// Verify a detached Ed25519 signature over arbitrary data, against an `ak_` address.
pub fn verify(data: &[u8], signature: &[u8; 64], address: &str) -> Result<bool> {
    let key_bytes: [u8; 32] = decode(address)?
        .try_into()
        .map_err(|_| Error::Crypto("address payload is not 32 bytes".into()))?;
    let key = VerifyingKey::from_bytes(&key_bytes)
        .map_err(|e| Error::Crypto(format!("not a valid public key: {e}")))?;
    Ok(key.verify(data, &Signature::from_bytes(signature)).is_ok())
}

/// The `ak_` address for a 32-byte Ed25519 seed.
pub fn address_from_seed(seed: &[u8; 32]) -> Result<String> {
    let key = SigningKey::from_bytes(seed);
    encode(key.verifying_key().as_bytes(), Encoding::AccountAddress)
}

/// The blake2b-256 hash of a signed transaction, `th_`-encoded.
pub fn transaction_hash(rlp_signed_tx: &[u8]) -> Result<String> {
    encode(&blake2b_256(rlp_signed_tx), Encoding::TxHash)
}

/// Hash a human-readable message the way `verifyMessageSignature` expects.
///
/// The message is length-prefixed twice — once for the constant prefix, once for
/// the message — using Bitcoin-style varints.
pub fn hash_message(message: &str) -> [u8; 32] {
    const PREFIX: &[u8] = b"aeternity Signed Message:\n";
    let mut buffer = encode_var_uint(PREFIX.len() as u64);
    buffer.extend_from_slice(PREFIX);
    buffer.extend_from_slice(&encode_var_uint(message.len() as u64));
    buffer.extend_from_slice(message.as_bytes());
    blake2b_256(&buffer)
}

/// Verify a signature over a human-readable message.
pub fn verify_message(message: &str, signature: &[u8; 64], address: &str) -> Result<bool> {
    verify(&hash_message(message), signature, address)
}

fn encode_var_uint(value: u64) -> Vec<u8> {
    if value < 0xfd {
        vec![value as u8]
    } else if value <= 0xffff {
        let mut out = vec![0xfd];
        out.extend_from_slice(&(value as u16).to_le_bytes());
        out
    } else if value <= 0xffff_ffff {
        let mut out = vec![0xfe];
        out.extend_from_slice(&(value as u32).to_le_bytes());
        out
    } else {
        let mut out = vec![0xff];
        out.extend_from_slice(&value.to_le_bytes());
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A fixed, published test seed — RFC 8032 §7.1 test 1. Never a real key.
    const RFC8032_SEED: [u8; 32] =
        hex_literal(b"9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60");

    const fn hex_literal(hex: &[u8; 64]) -> [u8; 32] {
        let mut out = [0u8; 32];
        let mut i = 0;
        while i < 32 {
            out[i] = nibble(hex[i * 2]) * 16 + nibble(hex[i * 2 + 1]);
            i += 1;
        }
        out
    }

    const fn nibble(c: u8) -> u8 {
        match c {
            b'0'..=b'9' => c - b'0',
            b'a'..=b'f' => c - b'a' + 10,
            _ => 0,
        }
    }

    #[test]
    fn public_key_matches_rfc_8032() {
        // RFC 8032 §7.1 test 1 public key.
        let address = address_from_seed(&RFC8032_SEED).unwrap();
        assert_eq!(
            hex::encode(decode(&address).unwrap()),
            "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"
        );
    }

    #[test]
    fn the_signed_buffer_carries_the_network_id() {
        let tx = b"rlp-bytes";
        let outer = buffer_to_sign(tx, NETWORK_ID_TESTNET, TxPosition::Outer);
        let inner = buffer_to_sign(tx, NETWORK_ID_TESTNET, TxPosition::Inner);
        assert_eq!(&outer[..NETWORK_ID_TESTNET.len()], b"ae_uat");
        assert_eq!(outer.len(), NETWORK_ID_TESTNET.len() + 32);
        assert_eq!(&inner[..15], b"ae_uat-inner_tx");
        assert_ne!(outer, inner);
        assert_eq!(&outer[6..], &blake2b_256(tx));
    }

    #[test]
    fn a_signature_is_bound_to_its_network_id() {
        let tx = b"rlp-bytes";
        let address = address_from_seed(&RFC8032_SEED).unwrap();
        let signature = sign_transaction(tx, &RFC8032_SEED, NETWORK_ID_TESTNET, TxPosition::Outer);

        assert!(verify_transaction(
            tx,
            &signature,
            &address,
            NETWORK_ID_TESTNET,
            TxPosition::Outer
        )
        .unwrap());
        // Same key, same transaction, different chain — must not verify.
        assert!(!verify_transaction(
            tx,
            &signature,
            &address,
            NETWORK_ID_MAINNET,
            TxPosition::Outer
        )
        .unwrap());
        // Same key, same chain, wrapped as an inner transaction — must not verify.
        assert!(!verify_transaction(
            tx,
            &signature,
            &address,
            NETWORK_ID_TESTNET,
            TxPosition::Inner
        )
        .unwrap());
    }

    #[test]
    fn signing_is_deterministic() {
        let tx = b"rlp-bytes";
        let a = sign_transaction(tx, &RFC8032_SEED, NETWORK_ID_TESTNET, TxPosition::Outer);
        let b = sign_transaction(tx, &RFC8032_SEED, NETWORK_ID_TESTNET, TxPosition::Outer);
        assert_eq!(a, b);
    }

    #[test]
    fn message_signatures_use_the_double_length_prefix() {
        let address = address_from_seed(&RFC8032_SEED).unwrap();
        let signature = ed25519_dalek::SigningKey::from_bytes(&RFC8032_SEED)
            .sign(&hash_message("hello"))
            .to_bytes();
        assert!(verify_message("hello", &signature, &address).unwrap());
        assert!(!verify_message("hell0", &signature, &address).unwrap());
    }

    #[test]
    fn var_uint_widths() {
        assert_eq!(encode_var_uint(0), vec![0x00]);
        assert_eq!(encode_var_uint(0xfc), vec![0xfc]);
        assert_eq!(encode_var_uint(0xfd), vec![0xfd, 0xfd, 0x00]);
        assert_eq!(
            encode_var_uint(0x1_0000),
            vec![0xfe, 0x00, 0x00, 0x01, 0x00]
        );
    }
}
