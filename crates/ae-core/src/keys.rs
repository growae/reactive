//! Keys, addresses and Ed25519 signing.
//!
//! Small on purpose. Almost every connector forwards a `tx_…` string to a
//! wallet and never signs locally, so what a wallet-less caller needs is the
//! address arithmetic and the exact bytes that go under the signature — not a
//! key manager.
//!
//! # What is signed
//!
//! Never the transaction bytes themselves. The signed message is
//!
//! ```text
//! utf8(network_id [ "-inner_tx" ]) || blake2b_256(transaction_bytes)
//! ```
//!
//! so a signature is bound to one network, and a signature taken from an inner
//! transaction cannot be replayed as an outer one. Getting the network id wrong
//! produces a signature that verifies locally and is rejected by every node, so
//! [`SecretKey::sign_transaction`] takes it as an argument with no default.
//!
//! # Key material
//!
//! [`SecretKey`] does not implement `Display`, and its `Debug` prints the
//! address. Nothing here logs, formats or serialises a secret; the only way out
//! is [`SecretKey::to_encoded`], which a caller has to ask for by name.

use core::fmt;

use ed25519_dalek::{Signer as _, SigningKey, Verifier as _, VerifyingKey};

use crate::encoding::{decode_any, encode, Encoding};
use crate::error::{Error, Result};
use crate::hash::blake2b_256;
use crate::id::Id;

/// The mainnet network id.
pub const NETWORK_ID_MAINNET: &str = "ae_mainnet";
/// The testnet network id.
pub const NETWORK_ID_TESTNET: &str = "ae_uat";

/// The suffix that distinguishes an inner transaction's signature from an outer one.
const INNER_TX_SUFFIX: &str = "-inner_tx";

/// The prefix that keeps a signed message from ever being a valid transaction.
const MESSAGE_PREFIX: &[u8] = b"aeternity Signed Message:\n";

/// Whether a transaction is being signed on its own or inside a wrapper.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TxPosition {
    /// Signed as itself.
    #[default]
    Outer,
    /// Wrapped by a `GaMetaTx` or a `PayingForTx`.
    Inner,
}

/// Read a payload of exactly the encoding asked for.
fn decode_exact(input: &str, expected: Encoding) -> Result<Vec<u8>> {
    let (encoding, payload) = decode_any(input)?;
    if encoding != expected {
        return Err(Error::UnknownPrefix(format!(
            "expected {}, got {}",
            expected.prefix(),
            encoding.prefix()
        )));
    }
    Ok(payload)
}

fn exactly<const N: usize>(payload: Vec<u8>) -> Result<[u8; N]> {
    let actual = payload.len();
    payload.try_into().map_err(|_| Error::PayloadLength {
        expected: N,
        actual,
    })
}

/// An account's public key.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct PublicKey([u8; 32]);

impl PublicKey {
    /// Wrap 32 raw bytes.
    pub const fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// The raw bytes.
    pub const fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// The `ak_…` address.
    pub fn to_address(&self) -> Result<String> {
        encode(&self.0, Encoding::AccountAddress)
    }

    /// Parse an `ak_…` address.
    pub fn from_address(address: &str) -> Result<Self> {
        Ok(Self(exactly(decode_exact(
            address,
            Encoding::AccountAddress,
        )?)?))
    }

    /// This account as an `id()` field value.
    pub const fn to_id(&self) -> Id {
        Id::account(self.0)
    }

    /// Verify a detached signature over `message`.
    pub fn verify(&self, message: &[u8], signature: &Signature) -> bool {
        let Ok(key) = VerifyingKey::from_bytes(&self.0) else {
            return false;
        };
        key.verify(message, &ed25519_dalek::Signature::from_bytes(&signature.0))
            .is_ok()
    }

    /// Verify a signature over a transaction, given the network it was signed for.
    pub fn verify_transaction(
        &self,
        transaction: &[u8],
        network_id: &str,
        position: TxPosition,
        signature: &Signature,
    ) -> bool {
        self.verify(
            &transaction_signing_payload(transaction, network_id, position),
            signature,
        )
    }
}

/// A detached Ed25519 signature.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Signature([u8; 64]);

impl Signature {
    /// Wrap 64 raw bytes.
    pub const fn from_bytes(bytes: [u8; 64]) -> Self {
        Self(bytes)
    }

    /// The raw bytes.
    pub const fn as_bytes(&self) -> &[u8; 64] {
        &self.0
    }

    /// The `sg_…` spelling.
    pub fn to_encoded(&self) -> Result<String> {
        encode(&self.0, Encoding::Signature)
    }

    /// Parse an `sg_…` spelling.
    pub fn from_encoded(input: &str) -> Result<Self> {
        Ok(Self(exactly(decode_exact(input, Encoding::Signature)?)?))
    }
}

impl fmt::Debug for Signature {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.to_encoded() {
            Ok(encoded) => write!(f, "Signature({encoded})"),
            Err(_) => write!(f, "Signature(<unencodable>)"),
        }
    }
}

/// An account's secret key.
///
/// The wire form is the 32-byte Ed25519 seed, spelled `sk_…`. The expanded
/// 64-byte form some libraries call a secret key is derived from it and never
/// leaves this type.
pub struct SecretKey(SigningKey);

impl SecretKey {
    /// Build from a 32-byte seed.
    pub fn from_seed(seed: [u8; 32]) -> Self {
        Self(SigningKey::from_bytes(&seed))
    }

    /// Generate a key from the operating system's randomness.
    ///
    /// For tests and for callers that hold their own keys. This crate never
    /// persists one.
    pub fn generate() -> Self {
        let mut seed = [0u8; 32];
        rand_core::RngCore::fill_bytes(&mut rand_core::OsRng, &mut seed);
        Self::from_seed(seed)
    }

    /// Parse an `sk_…` spelling.
    pub fn from_encoded(input: &str) -> Result<Self> {
        Ok(Self::from_seed(exactly(decode_exact(
            input,
            Encoding::AccountSecretKey,
        )?)?))
    }

    /// The `sk_…` spelling.
    ///
    /// The one way key material leaves this type. Callers that only need an
    /// identity want [`Self::public_key`] instead.
    pub fn to_encoded(&self) -> Result<String> {
        encode(&self.0.to_bytes(), Encoding::AccountSecretKey)
    }

    /// The matching public key.
    pub fn public_key(&self) -> PublicKey {
        PublicKey(self.0.verifying_key().to_bytes())
    }

    /// The account's `ak_…` address.
    pub fn to_address(&self) -> Result<String> {
        self.public_key().to_address()
    }

    /// Sign arbitrary bytes.
    ///
    /// Prefer [`Self::sign_transaction`] or [`Self::sign_message`]: both bind
    /// the signature to a domain, and this does not.
    pub fn sign_raw(&self, message: &[u8]) -> Signature {
        Signature(self.0.sign(message).to_bytes())
    }

    /// Sign a serialised transaction for `network_id`.
    pub fn sign_transaction(
        &self,
        transaction: &[u8],
        network_id: &str,
        position: TxPosition,
    ) -> Signature {
        self.sign_raw(&transaction_signing_payload(
            transaction,
            network_id,
            position,
        ))
    }

    /// Sign a human-readable message under the `aeternity Signed Message:` prefix.
    pub fn sign_message(&self, message: &str) -> Signature {
        self.sign_raw(&message_hash(message))
    }
}

impl fmt::Debug for SecretKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.to_address() {
            Ok(address) => write!(f, "SecretKey({address})"),
            Err(_) => write!(f, "SecretKey(<unencodable>)"),
        }
    }
}

/// The exact bytes a transaction signature is taken over.
///
/// Exposed so a caller signing through a hardware wallet or a remote signer can
/// produce the same payload without going through [`SecretKey`].
pub fn transaction_signing_payload(
    transaction: &[u8],
    network_id: &str,
    position: TxPosition,
) -> Vec<u8> {
    let mut payload = Vec::with_capacity(network_id.len() + INNER_TX_SUFFIX.len() + 32);
    payload.extend_from_slice(network_id.as_bytes());
    if position == TxPosition::Inner {
        payload.extend_from_slice(INNER_TX_SUFFIX.as_bytes());
    }
    payload.extend_from_slice(&blake2b_256(transaction));
    payload
}

/// The `th_…` hash of a signed transaction's rlp.
pub fn transaction_hash(rlp_signed_tx: &[u8]) -> Result<String> {
    encode(&blake2b_256(rlp_signed_tx), Encoding::TxHash)
}

/// The hash a signed message is taken over.
pub fn message_hash(message: &str) -> [u8; 32] {
    let message = message.as_bytes();
    let mut buffer = var_uint(MESSAGE_PREFIX.len() as u64);
    buffer.extend_from_slice(MESSAGE_PREFIX);
    buffer.extend_from_slice(&var_uint(message.len() as u64));
    buffer.extend_from_slice(message);
    blake2b_256(&buffer)
}

/// Verify a message signature against an address.
pub fn verify_message(message: &str, signature: &Signature, address: &str) -> Result<bool> {
    Ok(PublicKey::from_address(address)?.verify(&message_hash(message), signature))
}

/// Bitcoin-style compact length prefix, little-endian above one byte.
fn var_uint(value: u64) -> Vec<u8> {
    if value < 0xfd {
        vec![value as u8]
    } else if value <= u64::from(u16::MAX) {
        let mut out = vec![0xfd];
        out.extend_from_slice(&(value as u16).to_le_bytes());
        out
    } else if value <= u64::from(u32::MAX) {
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

    /// RFC 8032 test vector 1: the seed and the public key it derives.
    const RFC8032_SEED: &str = "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60";
    const RFC8032_PUBLIC: &str = "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";

    fn rfc8032_key() -> SecretKey {
        let seed: [u8; 32] = hex::decode(RFC8032_SEED).unwrap().try_into().unwrap();
        SecretKey::from_seed(seed)
    }

    #[test]
    fn derives_the_published_ed25519_public_key_from_its_seed() {
        let key = rfc8032_key();
        assert_eq!(hex::encode(key.public_key().as_bytes()), RFC8032_PUBLIC);
    }

    #[test]
    fn signs_the_published_ed25519_vector() {
        // RFC 8032 vector 2: a one-byte message and its signature.
        let seed: [u8; 32] =
            hex::decode("4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb")
                .unwrap()
                .try_into()
                .unwrap();
        let key = SecretKey::from_seed(seed);
        let signature = key.sign_raw(&[0x72]);
        assert_eq!(
            hex::encode(signature.as_bytes()),
            "92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da\
             085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00"
        );
        assert!(key.public_key().verify(&[0x72], &signature));
    }

    #[test]
    fn address_round_trips_through_its_encoding() {
        let key = rfc8032_key();
        let address = key.to_address().unwrap();
        assert!(address.starts_with("ak_"));
        assert_eq!(PublicKey::from_address(&address).unwrap(), key.public_key());
        assert_eq!(
            key.public_key().to_id().to_encoded().unwrap(),
            address,
            "an account id spells the same as its address"
        );
    }

    #[test]
    fn secret_key_round_trips_and_never_prints_itself() {
        let key = rfc8032_key();
        let encoded = key.to_encoded().unwrap();
        assert!(encoded.starts_with("sk_"));
        let reparsed = SecretKey::from_encoded(&encoded).unwrap();
        assert_eq!(reparsed.public_key(), key.public_key());
        // Debug shows the address, never the seed.
        let debug = format!("{key:?}");
        assert!(debug.contains("ak_"));
        assert!(!debug.contains(RFC8032_SEED));
        assert!(!debug.contains(&encoded));
    }

    #[test]
    fn the_signing_payload_is_the_network_id_and_the_transaction_hash() {
        let transaction = b"not really a transaction";
        let payload =
            transaction_signing_payload(transaction, NETWORK_ID_MAINNET, TxPosition::Outer);
        assert_eq!(&payload[..10], b"ae_mainnet");
        assert_eq!(&payload[10..], &blake2b_256(transaction));
        assert_eq!(payload.len(), 10 + 32);

        let inner = transaction_signing_payload(transaction, NETWORK_ID_MAINNET, TxPosition::Inner);
        assert_eq!(&inner[..19], b"ae_mainnet-inner_tx");
        assert_eq!(inner.len(), 19 + 32);
    }

    #[test]
    fn a_signature_does_not_carry_across_networks_or_across_the_inner_boundary() {
        let key = rfc8032_key();
        let transaction = b"not really a transaction";
        let mainnet = key.sign_transaction(transaction, NETWORK_ID_MAINNET, TxPosition::Outer);

        let public = key.public_key();
        assert!(public.verify_transaction(
            transaction,
            NETWORK_ID_MAINNET,
            TxPosition::Outer,
            &mainnet
        ));
        assert!(!public.verify_transaction(
            transaction,
            NETWORK_ID_TESTNET,
            TxPosition::Outer,
            &mainnet
        ));
        assert!(!public.verify_transaction(
            transaction,
            NETWORK_ID_MAINNET,
            TxPosition::Inner,
            &mainnet
        ));
        assert!(!public.verify_transaction(
            b"a different transaction",
            NETWORK_ID_MAINNET,
            TxPosition::Outer,
            &mainnet
        ));
    }

    #[test]
    fn signature_round_trips_through_its_encoding() {
        let key = rfc8032_key();
        let signature = key.sign_raw(b"payload");
        let encoded = signature.to_encoded().unwrap();
        assert!(encoded.starts_with("sg_"));
        assert_eq!(Signature::from_encoded(&encoded).unwrap(), signature);
    }

    #[test]
    fn a_signed_message_cannot_be_replayed_as_a_transaction() {
        let key = rfc8032_key();
        let signature = key.sign_message("hello");
        let address = key.to_address().unwrap();
        assert!(verify_message("hello", &signature, &address).unwrap());
        assert!(!verify_message("hello!", &signature, &address).unwrap());
        // The prefix means the hashed bytes are not the message's own bytes.
        assert_ne!(message_hash("hello"), blake2b_256(b"hello"));
    }

    #[test]
    fn message_length_prefixes_switch_form_at_the_documented_boundaries() {
        assert_eq!(var_uint(0), vec![0]);
        assert_eq!(var_uint(0xfc), vec![0xfc]);
        assert_eq!(var_uint(0xfd), vec![0xfd, 0xfd, 0x00]);
        assert_eq!(var_uint(0x1_0000), vec![0xfe, 0x00, 0x00, 0x01, 0x00]);
        assert_eq!(var_uint(0x1_0000_0000)[0], 0xff);
        // A long message stays verifiable across the boundary.
        let key = rfc8032_key();
        let long = "a".repeat(300);
        let signature = key.sign_message(&long);
        assert!(verify_message(&long, &signature, &key.to_address().unwrap()).unwrap());
    }

    #[test]
    fn a_transaction_hash_is_the_blake2b_of_its_rlp() {
        let hash = transaction_hash(b"rlp bytes").unwrap();
        assert!(hash.starts_with("th_"));
        assert_eq!(
            decode_exact(&hash, Encoding::TxHash).unwrap(),
            blake2b_256(b"rlp bytes")
        );
    }

    #[test]
    fn generated_keys_differ() {
        let a = SecretKey::generate();
        let b = SecretKey::generate();
        assert_ne!(a.public_key(), b.public_key());
    }
}
