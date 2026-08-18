//! The transaction schema: 27 entries over 26 tags.
//!
//! Field **order is the wire format** — this table is transcribed from the
//! reference schema in declaration order and reordering a row changes what goes
//! on chain. Each entry lists only the payload fields; every record is serialised
//! as `[tag, version] ++ fields`.

use crate::encoding::Encoding;
use crate::error::{Error, Result};
use crate::id::ID_ENCODINGS;
use crate::tx::Tag;

/// A field codec. One variant per distinct serialisation behaviour.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FieldKind {
    /// An `id`: a one-byte tag then a 32-byte hash. The slice restricts which
    /// encodings this position accepts.
    Address(&'static [Encoding]),
    /// A repeated `id`.
    AddressList(&'static [Encoding]),
    /// An AENS name id — an `id` that also accepts a bare name and hashes it.
    NameId,
    /// A bare AENS name, serialised as its raw string bytes.
    Name,
    /// A plain string.
    Str,
    /// Raw bytes, passed through.
    Raw,
    /// Repeated raw bytes.
    RawList,
    /// An `xx_...` string, serialised as its decoded payload.
    Encoded(Encoding),
    /// The same, but absent serialises to an empty byte string.
    EncodedOptional(Encoding),
    /// An unsigned integer, required.
    Uint,
    /// An unsigned integer defaulting to a constant.
    UintDefault(u64),
    /// An amount in aettos, defaulting to zero.
    CoinAmount,
    /// A `ContractCreateTx` deposit — an amount that must be zero, because it is
    /// not refundable.
    Deposit,
    /// A small unsigned integer, required.
    ShortUInt,
    /// A small unsigned integer defaulting to a constant.
    ShortUIntDefault(u64),
    /// A transaction TTL: absolute block height, defaulting to zero (no TTL).
    Ttl,
    /// An AENS name TTL in blocks, defaulting to 180000 and capped there.
    NameTtl,
    /// An account nonce. The string names the field holding the account whose
    /// nonce it is, which a caller with node access needs to resolve it.
    Nonce(&'static str),
    /// The transaction fee. Computing it when absent needs the fee model.
    Fee,
    /// The AENS name fee, defaulting to the minimum for the name.
    NameFee,
    /// A contract gas limit. Computing it when absent needs the fee model.
    GasLimit,
    /// A gas price, defaulting to the protocol minimum and floored there.
    GasPrice,
    /// An oracle query fee. Resolving it when absent needs node access.
    QueryFee,
    /// A one-byte ABI version, defaulting from the protocol version.
    AbiVersion,
    /// A three-byte VM/ABI version pair, defaulting from the protocol version.
    CtVersion,
    /// An oracle TTL type: delta (0) or block (1), defaulting to delta.
    OracleTtlType,
    /// AENS pointers. Version 2 allows raw `ba_` blobs as pointer targets.
    Pointers {
        /// Whether raw blob pointers are accepted (name update version 2).
        allow_raw: bool,
    },
    /// A nested transaction. `Some(tag)` pins what the nested transaction must be.
    Transaction(Option<Tag>),
    /// A pre-serialised state-tree entry, carried through opaquely.
    ///
    /// The entry schema itself belongs to the state-trees workstream; this crate
    /// round-trips the bytes so the channel decode-and-re-encode path is exact.
    Entry(EntryTag),
}

/// The state-tree entry tags this crate references. The full entry schema is a
/// separate workstream; only the tags that appear inside a *transaction* are here.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum EntryTag {
    /// A proof of inclusion, `TreesPoi` in the reference enum.
    TreesPoi = 60,
}

/// One schema entry: a tag at a serialised version, and its ordered fields.
#[derive(Debug, Clone, Copy)]
pub struct SchemaEntry {
    /// The transaction tag.
    pub tag: Tag,
    /// The serialised version this entry describes.
    pub version: u32,
    /// Whether this is the version used when the caller does not pin one.
    pub default_version: bool,
    /// The payload fields, in wire order.
    pub fields: &'static [(&'static str, FieldKind)],
}

const AK: &[Encoding] = &[Encoding::AccountAddress];
const AK_CT_NM: &[Encoding] = &[
    Encoding::AccountAddress,
    Encoding::ContractAddress,
    Encoding::Name,
];
const AK_NM: &[Encoding] = &[Encoding::AccountAddress, Encoding::Name];
const CT_NM: &[Encoding] = &[Encoding::ContractAddress, Encoding::Name];
const OK_NM: &[Encoding] = &[Encoding::OracleAddress, Encoding::Name];
const OK: &[Encoding] = &[Encoding::OracleAddress];
const CM: &[Encoding] = &[Encoding::Commitment];
const CH: &[Encoding] = &[Encoding::Channel];
const ANY_ID: &[Encoding] = &ID_ENCODINGS;

/// Every transaction schema entry, in the reference's declaration order.
pub const TX_SCHEMA: &[SchemaEntry] = &[
    SchemaEntry {
        tag: Tag::SignedTx,
        version: 1,
        default_version: true,
        fields: &[
            ("signatures", FieldKind::RawList),
            ("encodedTx", FieldKind::Transaction(None)),
        ],
    },
    SchemaEntry {
        tag: Tag::SpendTx,
        version: 1,
        default_version: true,
        fields: &[
            ("senderId", FieldKind::Address(AK)),
            ("recipientId", FieldKind::Address(AK_CT_NM)),
            ("amount", FieldKind::CoinAmount),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
            ("nonce", FieldKind::Nonce("senderId")),
            ("payload", FieldKind::EncodedOptional(Encoding::Bytearray)),
        ],
    },
    SchemaEntry {
        tag: Tag::NamePreclaimTx,
        version: 1,
        default_version: true,
        fields: &[
            ("accountId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("accountId")),
            ("commitmentId", FieldKind::Address(CM)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::NameClaimTx,
        version: 2,
        default_version: true,
        fields: &[
            ("accountId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("accountId")),
            ("name", FieldKind::Name),
            ("nameSalt", FieldKind::UintDefault(0)),
            ("nameFee", FieldKind::NameFee),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::NameUpdateTx,
        version: 1,
        default_version: true,
        fields: &[
            ("accountId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("accountId")),
            ("nameId", FieldKind::NameId),
            ("nameTtl", FieldKind::NameTtl),
            ("pointers", FieldKind::Pointers { allow_raw: false }),
            ("clientTtl", FieldKind::ShortUIntDefault(3600)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::NameUpdateTx,
        version: 2,
        default_version: false,
        fields: &[
            ("accountId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("accountId")),
            ("nameId", FieldKind::NameId),
            ("nameTtl", FieldKind::NameTtl),
            ("pointers", FieldKind::Pointers { allow_raw: true }),
            ("clientTtl", FieldKind::ShortUIntDefault(3600)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::NameTransferTx,
        version: 1,
        default_version: true,
        fields: &[
            ("accountId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("accountId")),
            ("nameId", FieldKind::NameId),
            ("recipientId", FieldKind::Address(AK_NM)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::NameRevokeTx,
        version: 1,
        default_version: true,
        fields: &[
            ("accountId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("accountId")),
            ("nameId", FieldKind::NameId),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::ContractCreateTx,
        version: 1,
        default_version: true,
        fields: &[
            ("ownerId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("ownerId")),
            ("code", FieldKind::Encoded(Encoding::ContractBytearray)),
            ("ctVersion", FieldKind::CtVersion),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
            ("deposit", FieldKind::Deposit),
            ("amount", FieldKind::CoinAmount),
            ("gasLimit", FieldKind::GasLimit),
            ("gasPrice", FieldKind::GasPrice),
            ("callData", FieldKind::Encoded(Encoding::ContractBytearray)),
        ],
    },
    SchemaEntry {
        tag: Tag::ContractCallTx,
        version: 1,
        default_version: true,
        fields: &[
            ("callerId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("callerId")),
            ("contractId", FieldKind::Address(CT_NM)),
            ("abiVersion", FieldKind::AbiVersion),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
            ("amount", FieldKind::CoinAmount),
            ("gasLimit", FieldKind::GasLimit),
            ("gasPrice", FieldKind::GasPrice),
            ("callData", FieldKind::Encoded(Encoding::ContractBytearray)),
        ],
    },
    SchemaEntry {
        tag: Tag::OracleRegisterTx,
        version: 1,
        default_version: true,
        fields: &[
            ("accountId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("accountId")),
            ("queryFormat", FieldKind::Str),
            ("responseFormat", FieldKind::Str),
            ("queryFee", FieldKind::CoinAmount),
            ("oracleTtlType", FieldKind::OracleTtlType),
            ("oracleTtlValue", FieldKind::ShortUIntDefault(500)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
            ("abiVersion", FieldKind::AbiVersion),
        ],
    },
    SchemaEntry {
        tag: Tag::OracleExtendTx,
        version: 1,
        default_version: true,
        fields: &[
            ("oracleId", FieldKind::Address(OK_NM)),
            ("nonce", FieldKind::Nonce("oracleId")),
            ("oracleTtlType", FieldKind::OracleTtlType),
            ("oracleTtlValue", FieldKind::ShortUIntDefault(500)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::OracleQueryTx,
        version: 1,
        default_version: true,
        fields: &[
            ("senderId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("senderId")),
            ("oracleId", FieldKind::Address(OK_NM)),
            ("query", FieldKind::Str),
            ("queryFee", FieldKind::QueryFee),
            ("queryTtlType", FieldKind::OracleTtlType),
            ("queryTtlValue", FieldKind::ShortUIntDefault(10)),
            ("responseTtlType", FieldKind::OracleTtlType),
            ("responseTtlValue", FieldKind::ShortUIntDefault(10)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::OracleRespondTx,
        version: 1,
        default_version: true,
        fields: &[
            ("oracleId", FieldKind::Address(OK)),
            ("nonce", FieldKind::Nonce("oracleId")),
            ("queryId", FieldKind::Encoded(Encoding::OracleQueryId)),
            ("response", FieldKind::Str),
            ("responseTtlType", FieldKind::OracleTtlType),
            ("responseTtlValue", FieldKind::ShortUIntDefault(10)),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelCreateTx,
        version: 2,
        default_version: true,
        fields: &[
            ("initiator", FieldKind::Address(AK)),
            ("initiatorAmount", FieldKind::Uint),
            ("responder", FieldKind::Address(AK)),
            ("responderAmount", FieldKind::Uint),
            ("channelReserve", FieldKind::Uint),
            ("lockPeriod", FieldKind::Uint),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("initiatorDelegateIds", FieldKind::AddressList(ANY_ID)),
            ("responderDelegateIds", FieldKind::AddressList(ANY_ID)),
            ("stateHash", FieldKind::Encoded(Encoding::State)),
            ("nonce", FieldKind::Nonce("initiator")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelCloseMutualTx,
        version: 1,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("fromId", FieldKind::Address(AK)),
            ("initiatorAmountFinal", FieldKind::Uint),
            ("responderAmountFinal", FieldKind::Uint),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelCloseSoloTx,
        version: 1,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("fromId", FieldKind::Address(AK)),
            ("payload", FieldKind::Encoded(Encoding::Transaction)),
            ("poi", FieldKind::Entry(EntryTag::TreesPoi)),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelSlashTx,
        version: 1,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("fromId", FieldKind::Address(AK)),
            ("payload", FieldKind::Encoded(Encoding::Transaction)),
            ("poi", FieldKind::Entry(EntryTag::TreesPoi)),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelDepositTx,
        version: 1,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("fromId", FieldKind::Address(AK)),
            ("amount", FieldKind::Uint),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("stateHash", FieldKind::Encoded(Encoding::State)),
            ("round", FieldKind::ShortUInt),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelWithdrawTx,
        version: 1,
        default_version: true,
        // `toId` holds the account, but the reference resolves the nonce from
        // `fromId` — a field this schema does not have. Transcribed as-is; a
        // caller must supply `nonce` explicitly. Flagged for the harness.
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("toId", FieldKind::Address(AK)),
            ("amount", FieldKind::Uint),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("stateHash", FieldKind::Encoded(Encoding::State)),
            ("round", FieldKind::ShortUInt),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelSettleTx,
        version: 1,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("fromId", FieldKind::Address(AK)),
            ("initiatorAmountFinal", FieldKind::Uint),
            ("responderAmountFinal", FieldKind::Uint),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelForceProgressTx,
        version: 1,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("fromId", FieldKind::Address(AK)),
            ("payload", FieldKind::Encoded(Encoding::Transaction)),
            ("round", FieldKind::ShortUInt),
            ("update", FieldKind::Encoded(Encoding::ContractBytearray)),
            ("stateHash", FieldKind::Encoded(Encoding::State)),
            ("offChainTrees", FieldKind::Encoded(Encoding::StateTrees)),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelOffChainTx,
        version: 2,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("round", FieldKind::ShortUInt),
            ("stateHash", FieldKind::Encoded(Encoding::State)),
        ],
    },
    SchemaEntry {
        tag: Tag::ChannelSnapshotSoloTx,
        version: 1,
        default_version: true,
        fields: &[
            ("channelId", FieldKind::Address(CH)),
            ("fromId", FieldKind::Address(AK)),
            ("payload", FieldKind::Encoded(Encoding::Transaction)),
            ("ttl", FieldKind::Ttl),
            ("fee", FieldKind::Fee),
            ("nonce", FieldKind::Nonce("fromId")),
        ],
    },
    SchemaEntry {
        tag: Tag::GaAttachTx,
        version: 1,
        default_version: true,
        fields: &[
            ("ownerId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("ownerId")),
            ("code", FieldKind::Encoded(Encoding::ContractBytearray)),
            ("authFun", FieldKind::Raw),
            ("ctVersion", FieldKind::CtVersion),
            ("fee", FieldKind::Fee),
            ("ttl", FieldKind::Ttl),
            ("gasLimit", FieldKind::GasLimit),
            ("gasPrice", FieldKind::GasPrice),
            ("callData", FieldKind::Encoded(Encoding::ContractBytearray)),
        ],
    },
    SchemaEntry {
        tag: Tag::GaMetaTx,
        version: 2,
        default_version: true,
        fields: &[
            ("gaId", FieldKind::Address(AK)),
            ("authData", FieldKind::Encoded(Encoding::ContractBytearray)),
            ("abiVersion", FieldKind::AbiVersion),
            ("fee", FieldKind::Fee),
            ("gasLimit", FieldKind::GasLimit),
            ("gasPrice", FieldKind::GasPrice),
            ("tx", FieldKind::Transaction(Some(Tag::SignedTx))),
        ],
    },
    SchemaEntry {
        tag: Tag::PayingForTx,
        version: 1,
        default_version: true,
        fields: &[
            ("payerId", FieldKind::Address(AK)),
            ("nonce", FieldKind::Nonce("payerId")),
            ("fee", FieldKind::Fee),
            ("tx", FieldKind::Transaction(Some(Tag::SignedTx))),
        ],
    },
];

/// Find the schema for a tag, at `version` if given and the default otherwise.
pub fn schema_for(tag: Tag, version: Option<u32>) -> Result<&'static SchemaEntry> {
    let mut any_for_tag = false;
    for entry in TX_SCHEMA {
        if entry.tag != tag {
            continue;
        }
        any_for_tag = true;
        match version {
            Some(v) if entry.version == v => return Ok(entry),
            None if entry.default_version => return Ok(entry),
            _ => {}
        }
    }
    let _ = any_for_tag;
    Err(Error::SchemaNotFound {
        tag: tag.as_u32(),
        version,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tx::tag::ALL_TAGS;
    use std::collections::BTreeSet;

    #[test]
    fn twenty_seven_entries_over_twenty_six_tags() {
        assert_eq!(TX_SCHEMA.len(), 27);
        let tags: BTreeSet<Tag> = TX_SCHEMA.iter().map(|e| e.tag).collect();
        assert_eq!(tags.len(), 26);
        // Only NameUpdateTx carries two serialised versions.
        let duplicated: Vec<Tag> = ALL_TAGS
            .into_iter()
            .filter(|t| TX_SCHEMA.iter().filter(|e| e.tag == *t).count() > 1)
            .collect();
        assert_eq!(duplicated, vec![Tag::NameUpdateTx]);
    }

    #[test]
    fn every_tag_has_exactly_one_default_version() {
        for tag in ALL_TAGS {
            let defaults = TX_SCHEMA
                .iter()
                .filter(|e| e.tag == tag && e.default_version)
                .count();
            assert_eq!(defaults, 1, "{tag} should have one default version");
            assert!(schema_for(tag, None).is_ok());
        }
    }

    #[test]
    fn version_lookup_is_exact() {
        assert_eq!(schema_for(Tag::NameUpdateTx, None).unwrap().version, 1);
        assert_eq!(schema_for(Tag::NameUpdateTx, Some(2)).unwrap().version, 2);
        assert!(schema_for(Tag::NameUpdateTx, Some(3)).is_err());
        assert!(schema_for(Tag::SpendTx, Some(2)).is_err());
    }

    #[test]
    fn field_names_are_unique_within_an_entry() {
        for entry in TX_SCHEMA {
            let names: BTreeSet<&str> = entry.fields.iter().map(|(n, _)| *n).collect();
            assert_eq!(names.len(), entry.fields.len(), "{} has a dup", entry.tag);
        }
    }

    #[test]
    fn the_table_covers_two_hundred_payload_fields() {
        // The scope measurement taken against the reference schema was 200
        // fields across the 27 entries, excluding each entry's `tag` and
        // `version`, which this table stores as struct members rather than rows.
        let payload_fields: usize = TX_SCHEMA.iter().map(|e| e.fields.len()).sum();
        assert_eq!(payload_fields, 200);
    }
}
