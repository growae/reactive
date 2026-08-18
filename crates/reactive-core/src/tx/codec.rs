//! One function per direction, dispatching on [`FieldKind`].

use crate::aens;
use crate::bytes::{bytes_to_uint, uint_to_bytes};
use crate::encoding::{self, Encoding};
use crate::error::{Error, Result};
use crate::id::{deserialize_id, serialize_id, ID_ENCODINGS};
use crate::protocol::{self, CallKind};
use crate::rlp::Item;
use crate::tx::schema::{FieldKind, SchemaEntry};
use crate::tx::{build_rlp, BuildOptions, Overrides, Pointer, Tag, TxParams, Value};
use num_bigint::BigUint;

const NAME_TTL_MAX: u64 = 180_000;
const POINTERS_MAX: usize = 32;
const POINTER_DATA_MAX: usize = 1024;
const POINTER_ID_TAG: u8 = 1;
const POINTER_DATA_TAG: u8 = 2;

pub(crate) fn serialize(
    name: &'static str,
    kind: &FieldKind,
    params: &TxParams,
    entry: &SchemaEntry,
    options: &BuildOptions<'_>,
    overrides: &Overrides,
) -> Result<Item> {
    let value = params.get(name);
    match kind {
        FieldKind::Address(allowed) => {
            Ok(Item::Bytes(serialize_id(encoded(name, value)?, allowed)?))
        }
        FieldKind::AddressList(allowed) => {
            let items = list(name, value)?;
            let mut out = Vec::with_capacity(items.len());
            for item in items {
                let address = item.as_encoded().ok_or(Error::FieldType {
                    field: name,
                    expected: "a list of encoded addresses",
                })?;
                out.push(Item::Bytes(serialize_id(address, allowed)?));
            }
            Ok(Item::List(out))
        }
        FieldKind::NameId => {
            let raw = value.ok_or(Error::MissingField(name))?;
            let id = match raw {
                Value::Text(text) => aens::produce_name_id(text)?,
                Value::Encoded(encoded) if aens::is_name(encoded) => {
                    aens::produce_name_id(encoded)?
                }
                Value::Encoded(encoded) => encoded.clone(),
                _ => {
                    return Err(Error::FieldType {
                        field: name,
                        expected: "an nm_ name id or an AENS name",
                    })
                }
            };
            Ok(Item::Bytes(serialize_id(&id, &[Encoding::Name])?))
        }
        FieldKind::Name => {
            let text = match value.ok_or(Error::MissingField(name))? {
                Value::Text(text) => text.clone(),
                Value::Encoded(text) => text.clone(),
                _ => {
                    return Err(Error::FieldType {
                        field: name,
                        expected: "an AENS name",
                    })
                }
            };
            Ok(Item::Bytes(text.into_bytes()))
        }
        FieldKind::Str => Ok(Item::Bytes(text(name, value)?.as_bytes().to_vec())),
        FieldKind::Raw => Ok(Item::Bytes(raw(name, value)?.to_vec())),
        FieldKind::RawList => {
            let items = list(name, value)?;
            let mut out = Vec::with_capacity(items.len());
            for item in items {
                let bytes = item.as_bytes().ok_or(Error::FieldType {
                    field: name,
                    expected: "a list of byte strings",
                })?;
                out.push(Item::Bytes(bytes.to_vec()));
            }
            Ok(Item::List(out))
        }
        FieldKind::Encoded(expected) => {
            let string = encoded(name, value)?;
            Ok(Item::Bytes(decode_as(name, string, *expected)?))
        }
        FieldKind::EncodedOptional(expected) => match value {
            None => Ok(Item::Bytes(Vec::new())),
            Some(_) => {
                let string = encoded(name, value)?;
                Ok(Item::Bytes(decode_as(name, string, *expected)?))
            }
        },
        FieldKind::Uint | FieldKind::ShortUInt => Ok(int_item(uint(name, value)?)),
        FieldKind::UintDefault(default) | FieldKind::ShortUIntDefault(default) => {
            Ok(int_item(uint_or(name, value, *default)?))
        }
        FieldKind::CoinAmount => Ok(int_item(uint_or(name, value, 0)?)),
        FieldKind::Ttl => Ok(int_item(uint_or(name, value, 0)?)),
        FieldKind::Deposit => {
            let deposit = uint_or(name, value, 0)?;
            if deposit != BigUint::from(0u8) {
                return Err(Error::FieldValue {
                    field: name,
                    reason: "must equal 0, because a contract deposit is not refundable".into(),
                });
            }
            Ok(int_item(deposit))
        }
        FieldKind::NameTtl => {
            let ttl = uint_or(name, value, NAME_TTL_MAX)?;
            let numeric = u64::try_from(&ttl).unwrap_or(u64::MAX);
            if !(1..=NAME_TTL_MAX).contains(&numeric) {
                return Err(Error::FieldValue {
                    field: name,
                    reason: format!("must be between 1 and {NAME_TTL_MAX} blocks"),
                });
            }
            Ok(int_item(ttl))
        }
        FieldKind::Nonce(_) => {
            let nonce = uint(name, value)?;
            if entry.tag == Tag::GaAttachTx && nonce != BigUint::from(1u8) {
                return Err(Error::FieldValue {
                    field: name,
                    reason: "must equal 1 for a GaAttachTx".into(),
                });
            }
            Ok(int_item(nonce))
        }
        FieldKind::QueryFee => Ok(int_item(uint(name, value)?)),
        FieldKind::GasPrice => {
            let minimum = protocol::params(options.protocol).min_gas_price;
            let price = uint_or(name, value, minimum)?;
            if price < BigUint::from(minimum) {
                return Err(Error::FieldValue {
                    field: name,
                    reason: format!("must be at least the protocol minimum of {minimum}"),
                });
            }
            Ok(int_item(price))
        }
        FieldKind::NameFee => {
            let minimum = match params.get("name") {
                Some(Value::Text(n)) | Some(Value::Encoded(n)) => aens::minimum_name_fee(n)?,
                _ => return Err(Error::MissingField("name")),
            };
            let fee = match value {
                Some(v) => v.as_uint().cloned().ok_or(Error::FieldType {
                    field: name,
                    expected: "an unsigned integer",
                })?,
                None => minimum.clone(),
            };
            if fee < minimum {
                return Err(Error::FieldValue {
                    field: name,
                    reason: format!("must be at least the minimum name fee of {minimum}"),
                });
            }
            Ok(int_item(fee))
        }
        FieldKind::Fee => {
            if let Some(fee) = &overrides.fee {
                return Ok(int_item(fee.clone()));
            }
            if let Some(value) = value {
                return Ok(int_item(value.as_uint().cloned().ok_or(
                    Error::FieldType {
                        field: name,
                        expected: "an unsigned integer",
                    },
                )?));
            }
            let model = options.fee_model.ok_or(Error::ModelRequired {
                field: name,
                model: "fee",
            })?;
            let fee = model.min_fee(params, &|candidate: &BigUint| {
                build_rlp(
                    params,
                    options,
                    &Overrides {
                        fee: Some(candidate.clone()),
                        gas_limit: overrides.gas_limit,
                    },
                )
            })?;
            Ok(int_item(fee))
        }
        FieldKind::GasLimit => {
            if let Some(limit) = overrides.gas_limit {
                return Ok(int_item(BigUint::from(limit)));
            }
            if let Some(value) = value {
                return Ok(int_item(value.as_uint().cloned().ok_or(
                    Error::FieldType {
                        field: name,
                        expected: "an unsigned integer",
                    },
                )?));
            }
            let model = options.fee_model.ok_or(Error::ModelRequired {
                field: name,
                model: "fee",
            })?;
            let limit = model.max_gas_limit(params, &|candidate: u64| {
                build_rlp(
                    params,
                    options,
                    &Overrides {
                        fee: overrides.fee.clone(),
                        gas_limit: Some(candidate),
                    },
                )
            })?;
            Ok(int_item(BigUint::from(limit)))
        }
        FieldKind::AbiVersion => {
            let abi = match value {
                Some(v) => u8::try_from(v.as_u64().ok_or(Error::FieldType {
                    field: name,
                    expected: "a one-byte abi version",
                })?)
                .map_err(|_| Error::FieldValue {
                    field: name,
                    reason: "does not fit in one byte".into(),
                })?,
                None => {
                    protocol::params(options.protocol).abi_version(CallKind::for_tag(entry.tag))
                        as u8
                }
            };
            Ok(Item::Bytes(vec![abi]))
        }
        FieldKind::CtVersion => {
            let (vm, abi) = match value {
                Some(Value::CtVersion {
                    vm_version,
                    abi_version,
                }) => (*vm_version, *abi_version),
                Some(_) => {
                    return Err(Error::FieldType {
                        field: name,
                        expected: "a ctVersion pair",
                    })
                }
                None => {
                    let p = protocol::params(options.protocol);
                    (p.contract_create_vm as u8, p.contract_create_abi as u8)
                }
            };
            Ok(Item::Bytes(vec![vm, 0, abi]))
        }
        FieldKind::OracleTtlType => {
            let ttl_type = uint_or(name, value, 0)?;
            let numeric = u64::try_from(&ttl_type).unwrap_or(u64::MAX);
            if numeric > 1 {
                return Err(Error::FieldValue {
                    field: name,
                    reason: "must be 0 (delta) or 1 (block)".into(),
                });
            }
            Ok(Item::Bytes(vec![numeric as u8]))
        }
        FieldKind::Pointers { allow_raw } => {
            let pointers = match value.ok_or(Error::MissingField(name))? {
                Value::Pointers(pointers) => pointers,
                _ => {
                    return Err(Error::FieldType {
                        field: name,
                        expected: "a pointer list",
                    })
                }
            };
            if pointers.len() > POINTERS_MAX {
                return Err(Error::FieldValue {
                    field: name,
                    reason: format!("expected {POINTERS_MAX} pointers or less"),
                });
            }
            let mut out = Vec::with_capacity(pointers.len());
            for Pointer { key, id } in pointers {
                let payload = if encoding::is_encoded(id, &ID_ENCODINGS) {
                    let mut bytes = if *allow_raw {
                        vec![POINTER_ID_TAG]
                    } else {
                        Vec::new()
                    };
                    bytes.extend_from_slice(&serialize_id(id, &ID_ENCODINGS)?);
                    bytes
                } else if encoding::is_encoded(id, &[Encoding::Bytearray]) {
                    if !allow_raw {
                        return Err(Error::FieldValue {
                            field: name,
                            reason: "raw pointers need name update version 2".into(),
                        });
                    }
                    let data = encoding::decode(id)?;
                    if data.len() > POINTER_DATA_MAX {
                        return Err(Error::FieldValue {
                            field: name,
                            reason: format!(
                                "a raw pointer must be at most {POINTER_DATA_MAX} bytes"
                            ),
                        });
                    }
                    let mut bytes = vec![POINTER_DATA_TAG];
                    bytes.extend_from_slice(&data);
                    bytes
                } else {
                    return Err(Error::FieldValue {
                        field: name,
                        reason: format!("unknown pointer value: {id}"),
                    });
                };
                out.push(Item::List(vec![
                    Item::Bytes(key.as_bytes().to_vec()),
                    Item::Bytes(payload),
                ]));
            }
            Ok(Item::List(out))
        }
        FieldKind::Transaction(expected) => {
            let bytes = match value.ok_or(Error::MissingField(name))? {
                Value::Tx(inner) => {
                    if let Some(expected) = expected {
                        if inner.tag() != *expected {
                            return Err(Error::UnexpectedTag {
                                expected: expected.as_u32(),
                                actual: inner.tag().as_u32(),
                            });
                        }
                    }
                    build_rlp(inner, options, &Overrides::default())?
                }
                Value::Encoded(string) => decode_as(name, string, Encoding::Transaction)?,
                Value::Bytes(bytes) => bytes.clone(),
                _ => {
                    return Err(Error::FieldType {
                        field: name,
                        expected: "a nested transaction",
                    })
                }
            };
            Ok(Item::Bytes(bytes))
        }
        FieldKind::Entry(_) => {
            let bytes = match value.ok_or(Error::MissingField(name))? {
                Value::Bytes(bytes) => bytes.clone(),
                Value::Encoded(string) => encoding::decode(string)?,
                _ => {
                    return Err(Error::FieldType {
                        field: name,
                        expected: "a pre-serialised state-tree entry",
                    })
                }
            };
            Ok(Item::Bytes(bytes))
        }
    }
}

pub(crate) fn deserialize(name: &'static str, kind: &FieldKind, item: &Item) -> Result<Value> {
    match kind {
        FieldKind::Address(allowed) => {
            Ok(Value::Encoded(deserialize_id(item.as_bytes()?, allowed)?))
        }
        FieldKind::NameId => Ok(Value::Encoded(deserialize_id(
            item.as_bytes()?,
            &[Encoding::Name],
        )?)),
        FieldKind::AddressList(allowed) => {
            let mut out = Vec::new();
            for entry in item.as_list()? {
                out.push(Value::Encoded(deserialize_id(entry.as_bytes()?, allowed)?));
            }
            Ok(Value::List(out))
        }
        FieldKind::Name | FieldKind::Str => Ok(Value::Text(
            String::from_utf8(item.as_bytes()?.to_vec()).map_err(|_| Error::FieldType {
                field: name,
                expected: "valid UTF-8",
            })?,
        )),
        FieldKind::Raw => Ok(Value::Bytes(item.as_bytes()?.to_vec())),
        FieldKind::RawList => {
            let mut out = Vec::new();
            for entry in item.as_list()? {
                out.push(Value::Bytes(entry.as_bytes()?.to_vec()));
            }
            Ok(Value::List(out))
        }
        FieldKind::Encoded(expected) => Ok(Value::Encoded(encoding::encode(
            item.as_bytes()?,
            *expected,
        )?)),
        FieldKind::EncodedOptional(expected) => Ok(Value::Encoded(encoding::encode(
            item.as_bytes()?,
            *expected,
        )?)),
        FieldKind::Uint
        | FieldKind::ShortUInt
        | FieldKind::UintDefault(_)
        | FieldKind::ShortUIntDefault(_)
        | FieldKind::CoinAmount
        | FieldKind::Deposit
        | FieldKind::Ttl
        | FieldKind::NameTtl
        | FieldKind::Nonce(_)
        | FieldKind::Fee
        | FieldKind::NameFee
        | FieldKind::GasLimit
        | FieldKind::GasPrice
        | FieldKind::QueryFee
        | FieldKind::OracleTtlType => Ok(Value::Uint(bytes_to_uint(item.as_bytes()?))),
        FieldKind::AbiVersion => {
            let bytes = item.as_bytes()?;
            if bytes.len() != 1 {
                return Err(Error::FieldType {
                    field: name,
                    expected: "a one-byte abi version",
                });
            }
            Ok(Value::uint(bytes[0] as u64))
        }
        FieldKind::CtVersion => {
            let bytes = item.as_bytes()?;
            if bytes.len() != 3 {
                return Err(Error::FieldType {
                    field: name,
                    expected: "a three-byte ctVersion",
                });
            }
            Ok(Value::CtVersion {
                vm_version: bytes[0],
                abi_version: bytes[2],
            })
        }
        FieldKind::Pointers { allow_raw } => {
            let mut out = Vec::new();
            for entry in item.as_list()? {
                let pair = entry.as_list()?;
                if pair.len() != 2 {
                    return Err(Error::FieldType {
                        field: name,
                        expected: "a [key, id] pointer pair",
                    });
                }
                let key = String::from_utf8(pair[0].as_bytes()?.to_vec()).map_err(|_| {
                    Error::FieldType {
                        field: name,
                        expected: "a UTF-8 pointer key",
                    }
                })?;
                let payload = pair[1].as_bytes()?;
                let id = if *allow_raw {
                    let (tag, rest) = payload.split_first().ok_or(Error::FieldType {
                        field: name,
                        expected: "a tagged pointer value",
                    })?;
                    match *tag {
                        POINTER_ID_TAG => deserialize_id(rest, &ID_ENCODINGS)?,
                        POINTER_DATA_TAG => encoding::encode(rest, Encoding::Bytearray)?,
                        other => {
                            return Err(Error::FieldValue {
                                field: name,
                                reason: format!("unknown pointer tag: {other}"),
                            })
                        }
                    }
                } else {
                    deserialize_id(payload, &ID_ENCODINGS)?
                };
                out.push(Pointer { key, id });
            }
            Ok(Value::Pointers(out))
        }
        FieldKind::Transaction(expected) => {
            let inner = crate::tx::unpack_tx_rlp(item.as_bytes()?)?;
            if let Some(expected) = expected {
                if inner.tag() != *expected {
                    return Err(Error::UnexpectedTag {
                        expected: expected.as_u32(),
                        actual: inner.tag().as_u32(),
                    });
                }
            }
            Ok(Value::Tx(Box::new(inner)))
        }
        FieldKind::Entry(_) => Ok(Value::Bytes(item.as_bytes()?.to_vec())),
    }
}

fn int_item(value: BigUint) -> Item {
    Item::Bytes(uint_to_bytes(&value))
}

fn encoded<'a>(name: &'static str, value: Option<&'a Value>) -> Result<&'a str> {
    value
        .ok_or(Error::MissingField(name))?
        .as_encoded()
        .ok_or(Error::FieldType {
            field: name,
            expected: "an xx_-encoded string",
        })
}

fn text<'a>(name: &'static str, value: Option<&'a Value>) -> Result<&'a str> {
    match value.ok_or(Error::MissingField(name))? {
        Value::Text(text) => Ok(text),
        _ => Err(Error::FieldType {
            field: name,
            expected: "a string",
        }),
    }
}

fn raw<'a>(name: &'static str, value: Option<&'a Value>) -> Result<&'a [u8]> {
    value
        .ok_or(Error::MissingField(name))?
        .as_bytes()
        .ok_or(Error::FieldType {
            field: name,
            expected: "raw bytes",
        })
}

fn list<'a>(name: &'static str, value: Option<&'a Value>) -> Result<&'a [Value]> {
    match value.ok_or(Error::MissingField(name))? {
        Value::List(items) => Ok(items),
        _ => Err(Error::FieldType {
            field: name,
            expected: "a list",
        }),
    }
}

fn uint(name: &'static str, value: Option<&Value>) -> Result<BigUint> {
    value
        .ok_or(Error::MissingField(name))?
        .as_uint()
        .cloned()
        .ok_or(Error::FieldType {
            field: name,
            expected: "an unsigned integer",
        })
}

fn uint_or(name: &'static str, value: Option<&Value>, default: u64) -> Result<BigUint> {
    match value {
        None => Ok(BigUint::from(default)),
        Some(value) => value.as_uint().cloned().ok_or(Error::FieldType {
            field: name,
            expected: "an unsigned integer",
        }),
    }
}

fn decode_as(name: &'static str, string: &str, expected: Encoding) -> Result<Vec<u8>> {
    let (encoding, payload) = encoding::decode_any(string)?;
    if encoding != expected {
        return Err(Error::FieldValue {
            field: name,
            reason: format!(
                "expected {}_, got {}_",
                expected.prefix(),
                encoding.prefix()
            ),
        });
    }
    Ok(payload)
}
