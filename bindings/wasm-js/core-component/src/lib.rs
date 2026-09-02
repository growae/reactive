mod bindings;

use bindings::exports::growae::core_harness::{aens, encoding, fee, hash, keys, tx};
use bindings::growae::core_harness::types::{FieldValue, Pointer, TxField};

use ae_core::protocol::{AbiVersion, ConsensusProtocolVersion};
use ae_core::tx::{Tag, Value};
use num_bigint::BigUint;

/// `SecretKey::generate()` is not exported (see `wit/world.wit`'s `keys` doc),
/// so this never runs — but `getrandom` still has to compile for this target,
/// and bare `wasm32-unknown-unknown` has no default backend.
fn unreachable_getrandom(_buf: &mut [u8]) -> Result<(), getrandom::Error> {
    Err(getrandom::Error::UNSUPPORTED)
}
getrandom::register_custom_getrandom!(unreachable_getrandom);

fn parse_biguint(s: &str) -> Result<BigUint, String> {
    BigUint::parse_bytes(s.as_bytes(), 10)
        .ok_or_else(|| format!("`{s}` is not a decimal unsigned integer"))
}

/// The `abiVersion` a caller passed as a bare `u8`, as the `tx` interface
/// already carries it.
///
/// An unrecognised value is `None` rather than an error, and `None` is charged
/// the node's 30x base-gas arm for a `ContractCallTx` — which is the answer the
/// node itself gives an ABI it does not recognise. Erroring instead would refuse
/// to price a transaction the node would happily accept.
fn abi_version_from_u8(abi_version: u8) -> Option<AbiVersion> {
    match abi_version {
        0 => Some(AbiVersion::NoAbi),
        1 => Some(AbiVersion::Sophia),
        3 => Some(AbiVersion::Fate),
        _ => None,
    }
}

fn tag_from_name(name: &str) -> Option<Tag> {
    use Tag::*;
    Some(match name {
        "SignedTx" => SignedTx,
        "SpendTx" => SpendTx,
        "OracleRegisterTx" => OracleRegisterTx,
        "OracleQueryTx" => OracleQueryTx,
        "OracleRespondTx" => OracleRespondTx,
        "OracleExtendTx" => OracleExtendTx,
        "NameClaimTx" => NameClaimTx,
        "NamePreclaimTx" => NamePreclaimTx,
        "NameUpdateTx" => NameUpdateTx,
        "NameRevokeTx" => NameRevokeTx,
        "NameTransferTx" => NameTransferTx,
        "ContractCreateTx" => ContractCreateTx,
        "ContractCallTx" => ContractCallTx,
        "ChannelCreateTx" => ChannelCreateTx,
        "ChannelDepositTx" => ChannelDepositTx,
        "ChannelWithdrawTx" => ChannelWithdrawTx,
        "ChannelCloseMutualTx" => ChannelCloseMutualTx,
        "ChannelCloseSoloTx" => ChannelCloseSoloTx,
        "ChannelSlashTx" => ChannelSlashTx,
        "ChannelSettleTx" => ChannelSettleTx,
        "ChannelOffChainTx" => ChannelOffChainTx,
        "ChannelSnapshotSoloTx" => ChannelSnapshotSoloTx,
        "ChannelForceProgressTx" => ChannelForceProgressTx,
        "GaAttachTx" => GaAttachTx,
        "GaMetaTx" => GaMetaTx,
        "PayingForTx" => PayingForTx,
        _ => return None,
    })
}

fn value_to_field_value(name: &str, value: &Value) -> Result<FieldValue, String> {
    match value {
        Value::Uint(n) => Ok(FieldValue::Uint(n.to_string())),
        Value::Text(s) => Ok(FieldValue::Text(s.clone())),
        Value::Encoded(s) => Ok(FieldValue::Encoded(s.clone())),
        Value::Bytes(b) => Ok(FieldValue::Bytes(b.clone())),
        Value::CtVersion {
            vm_version,
            abi_version,
        } => Ok(FieldValue::CtVersion((*vm_version, *abi_version))),
        Value::Pointers(pointers) => Ok(FieldValue::Pointers(
            pointers
                .iter()
                .map(|p| Pointer {
                    key: p.key.clone(),
                    id: p.id.clone(),
                })
                .collect(),
        )),
        // A nested transaction crosses the boundary as its own encoded
        // string — `field-value` has no case that could hold it directly.
        Value::Tx(inner) => {
            let encoded = ae_core::tx::build_tx(inner).map_err(|e| e.to_string())?;
            Ok(FieldValue::Encoded(encoded))
        }
        Value::List(_) => Err(format!(
            "field `{name}` is a repeated value (an address list or raw byte list) — \
             not exposed to WASM in this pass; ChannelCreateTx's delegate ids and \
             SignedTx's signatures are out of scope (see wit/world.wit)"
        )),
    }
}

fn field_value_to_value(fv: FieldValue) -> Result<Value, String> {
    match fv {
        FieldValue::Uint(s) => Value::uint_str(&s).map_err(|e| e.to_string()),
        FieldValue::Text(s) => Ok(Value::Text(s)),
        FieldValue::Encoded(s) => Ok(Value::Encoded(s)),
        FieldValue::Bytes(b) => Ok(Value::Bytes(b)),
        FieldValue::CtVersion((vm_version, abi_version)) => Ok(Value::CtVersion {
            vm_version,
            abi_version,
        }),
        FieldValue::Pointers(pointers) => Ok(Value::Pointers(
            pointers
                .into_iter()
                .map(|p| ae_core::tx::Pointer {
                    key: p.key,
                    id: p.id,
                })
                .collect(),
        )),
    }
}

struct Component;

impl encoding::Guest for Component {
    fn encode(data: Vec<u8>, prefix: String) -> Result<String, String> {
        let encoding = ae_core::encoding::Encoding::from_prefix(&prefix)
            .ok_or_else(|| format!("unknown encoding prefix: {prefix}"))?;
        ae_core::encoding::encode(&data, encoding).map_err(|e| e.to_string())
    }

    fn decode(data: String) -> Result<Vec<u8>, String> {
        ae_core::encoding::decode(&data).map_err(|e| e.to_string())
    }

    fn decode_any(data: String) -> Result<(String, Vec<u8>), String> {
        let (encoding, bytes) = ae_core::encoding::decode_any(&data).map_err(|e| e.to_string())?;
        Ok((encoding.prefix().to_string(), bytes))
    }
}

impl hash::Guest for Component {
    fn blake2b256(input: Vec<u8>) -> Vec<u8> {
        ae_core::hash::blake2b_256(&input).to_vec()
    }

    fn sha256(input: Vec<u8>) -> Vec<u8> {
        ae_core::hash::sha256(&input).to_vec()
    }
}

impl keys::Guest for Component {
    fn from_seed(seed: Vec<u8>) -> Result<(String, String), String> {
        let seed_len = seed.len();
        let seed: [u8; 32] = seed
            .try_into()
            .map_err(|_| format!("seed must be exactly 32 bytes, got {seed_len}"))?;
        let secret_key = ae_core::keys::SecretKey::from_seed(seed);
        let secret = secret_key.to_encoded().map_err(|e| e.to_string())?;
        let address = secret_key.to_address().map_err(|e| e.to_string())?;
        Ok((secret, address))
    }

    fn address_from_secret(secret: String) -> Result<String, String> {
        ae_core::keys::SecretKey::from_encoded(&secret)
            .and_then(|sk| sk.to_address())
            .map_err(|e| e.to_string())
    }

    fn sign_transaction(
        secret: String,
        encoded_tx: String,
        network_id: String,
        inner: bool,
    ) -> Result<String, String> {
        let secret_key =
            ae_core::keys::SecretKey::from_encoded(&secret).map_err(|e| e.to_string())?;
        let tx_bytes = ae_core::encoding::decode(&encoded_tx).map_err(|e| e.to_string())?;
        let position = if inner {
            ae_core::keys::TxPosition::Inner
        } else {
            ae_core::keys::TxPosition::Outer
        };
        secret_key
            .sign_transaction(&tx_bytes, &network_id, position)
            .to_encoded()
            .map_err(|e| e.to_string())
    }

    fn sign_message(secret: String, message: String) -> Result<String, String> {
        let secret_key =
            ae_core::keys::SecretKey::from_encoded(&secret).map_err(|e| e.to_string())?;
        secret_key
            .sign_message(&message)
            .to_encoded()
            .map_err(|e| e.to_string())
    }

    fn verify_message(message: String, signature: String, address: String) -> Result<bool, String> {
        let signature =
            ae_core::keys::Signature::from_encoded(&signature).map_err(|e| e.to_string())?;
        ae_core::keys::verify_message(&message, &signature, &address).map_err(|e| e.to_string())
    }
}

impl tx::Guest for Component {
    fn build(tag: String, version: Option<u32>, fields: Vec<TxField>) -> Result<String, String> {
        let tag_enum =
            tag_from_name(&tag).ok_or_else(|| format!("unknown transaction tag: {tag}"))?;
        let mut params = ae_core::tx::TxParams::new(tag_enum);
        if let Some(version) = version {
            params = params.with_version(version);
        }
        for field in fields {
            let value = field_value_to_value(field.value)?;
            params.set(&field.key, value);
        }
        ae_core::tx::build_tx(&params).map_err(|e| e.to_string())
    }

    fn unpack(encoded_tx: String) -> Result<(String, u32, Vec<TxField>), String> {
        let params = ae_core::tx::unpack_tx(&encoded_tx).map_err(|e| e.to_string())?;
        let tag = format!("{:?}", params.tag());
        let version = params.version().unwrap_or(0);
        let mut fields = Vec::with_capacity(params.fields().len());
        for (key, value) in params.fields() {
            fields.push(TxField {
                key: key.clone(),
                value: value_to_field_value(key, value)?,
            });
        }
        Ok((tag, version, fields))
    }

    fn transaction_hash(encoded_tx: String) -> Result<String, String> {
        ae_core::tx::transaction_hash(&encoded_tx).map_err(|e| e.to_string())
    }

    fn wrap_signed(signatures: Vec<Vec<u8>>, encoded_tx: String) -> Result<String, String> {
        let mut params = ae_core::tx::TxParams::new(Tag::SignedTx);
        params.set(
            "signatures",
            Value::List(signatures.into_iter().map(Value::Bytes).collect()),
        );
        params.set("encodedTx", Value::Encoded(encoded_tx));
        ae_core::tx::build_tx(&params).map_err(|e| e.to_string())
    }

    fn unpack_signed(encoded_tx: String) -> Result<(Vec<Vec<u8>>, String), String> {
        let params =
            ae_core::tx::unpack_tx_as(&encoded_tx, Tag::SignedTx).map_err(|e| e.to_string())?;
        let signatures = match params.get("signatures") {
            Some(Value::List(items)) => items
                .iter()
                .map(|item| {
                    item.as_bytes()
                        .map(|b| b.to_vec())
                        .ok_or_else(|| "a signature must be raw bytes".to_string())
                })
                .collect::<Result<Vec<_>, _>>()?,
            _ => return Err("SignedTx is missing its signatures field".to_string()),
        };
        let inner = match params.get("encodedTx") {
            Some(Value::Tx(inner)) => ae_core::tx::build_tx(inner).map_err(|e| e.to_string())?,
            Some(Value::Encoded(s)) => s.clone(),
            _ => return Err("SignedTx is missing its encodedTx field".to_string()),
        };
        Ok((signatures, inner))
    }
}

impl aens::Guest for Component {
    fn is_name(name: String) -> bool {
        ae_core::aens::is_name(&name)
    }

    fn produce_name_id(name: String) -> Result<String, String> {
        ae_core::aens::produce_name_id(&name).map_err(|e| e.to_string())
    }

    fn commitment_hash(name: String, salt: String) -> Result<String, String> {
        let salt = parse_biguint(&salt)?;
        ae_core::aens::commitment_hash(&name, &salt).map_err(|e| e.to_string())
    }

    fn minimum_name_fee(name: String) -> Result<String, String> {
        ae_core::aens::minimum_name_fee(&name)
            .map(|fee| fee.to_string())
            .map_err(|e| e.to_string())
    }

    fn build_contract_id(owner: String, nonce: String) -> Result<String, String> {
        let nonce = parse_biguint(&nonce)?;
        ae_core::aens::build_contract_id(&owner, &nonce).map_err(|e| e.to_string())
    }

    fn oracle_query_id(sender: String, nonce: String, oracle: String) -> Result<String, String> {
        let nonce = parse_biguint(&nonce)?;
        ae_core::aens::oracle_query_id(&sender, &nonce, &oracle).map_err(|e| e.to_string())
    }
}

impl fee::Guest for Component {
    fn estimate_gas(
        tag: String,
        size: u32,
        relative_ttl: u64,
        inner_tx_size: u32,
        abi_version: Option<u8>,
    ) -> Result<u64, String> {
        let tag = tag_from_name(&tag).ok_or_else(|| format!("unknown transaction tag: {tag}"))?;
        let inputs = ae_core::fee::TxGasInputs {
            tag,
            size: size as usize,
            relative_ttl,
            inner_tx_size: inner_tx_size as usize,
            abi_version: abi_version.and_then(abi_version_from_u8),
        };
        Ok(ae_core::fee::transaction_gas(
            ConsensusProtocolVersion::default(),
            inputs,
        ))
    }

    fn fee_for_gas(gas: u64) -> String {
        ae_core::fee::fee_for_gas(ConsensusProtocolVersion::default(), gas).to_string()
    }

    fn minimum_bid_fee(current_fee: String) -> Result<String, String> {
        let current_fee: u128 = parse_biguint(&current_fee)?
            .try_into()
            .map_err(|_| "current-fee does not fit in 128 bits".to_string())?;
        Ok(
            ae_core::fee::minimum_bid_fee(ConsensusProtocolVersion::default(), current_fee)
                .to_string(),
        )
    }

    fn auction_end_height(label_length: u32, claim_height: u64) -> u64 {
        ae_core::fee::auction_end_height(
            ConsensusProtocolVersion::default(),
            label_length as usize,
            claim_height,
        )
    }

    fn is_auction_name(label_length: u32) -> bool {
        ae_core::fee::is_auction_name(ConsensusProtocolVersion::default(), label_length as usize)
    }
}

bindings::export!(Component with_types_in bindings);
