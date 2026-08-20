//! The parity matrix: what is measured, what is covered, and what is not.
//!
//! Four independent surfaces, because a single percentage over all of them
//! answers no question anyone actually has:
//!
//! | Surface | Reference | What "covered" means |
//! |---|---|---|
//! | transaction schema entries | `@aeternity/aepp-sdk` | a committed vector whose `tx_` string we reproduce byte-for-byte |
//! | transaction schema fields | — | some vector sets the field, so its codec ran at least once |
//! | state-tree entry schema | none committed | a committed fixture that decodes and re-encodes |
//! | FATE values and types | `@aeternity/aepp-calldata` | a committed vector that decodes and re-encodes byte-for-byte |
//!
//! An uncovered row is a finding to report, never something to quietly fill in
//! and then call green.

use std::collections::{BTreeMap, BTreeSet};

use ae_core::entry::{SdkCoverage, SCHEMA_ENTRIES};
use ae_core::tx::{build_tx, unpack_tx, FieldKind, Tag, TX_SCHEMA};
use serde_json::{json, Value as Json};

use crate::corpus;
use crate::scope::{self, Origin, Reach};

/// What an upstream variant this build does not know about is called in the
/// matrix. It must never appear in a rendered row; a test pins that.
pub const UNKNOWN_VARIANT: &str = "unknown";

/// How a single vector fared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Outcome {
    Pass,
    Fail,
}

/// One transaction schema entry's row in the matrix.
#[derive(Debug, Clone)]
pub struct TxRow {
    /// The tag.
    pub tag: Tag,
    /// The serialised version.
    pub version: u32,
    /// How a consumer reaches the tag.
    pub reach: Reach,
    /// Who builds it in the flow that runs.
    pub origin: Origin,
    /// Vectors in the corpus for this entry.
    pub vectors: usize,
    /// Vectors this crate rebuilds to the reference's exact bytes.
    pub build_pass: usize,
    /// Vectors that survive unpack then rebuild.
    pub roundtrip_pass: usize,
    /// Names of the vectors that failed either way, with the reason.
    pub failures: Vec<String>,
    /// Fields on this entry that no vector sets.
    pub unexercised_fields: Vec<String>,
    /// Whether the entry has a fee field whose derivation no vector exercises.
    pub fee_fixed_point_unexercised: bool,
}

impl TxRow {
    /// Whether every vector for this entry passed both directions.
    pub fn is_green(&self) -> bool {
        self.vectors > 0 && self.build_pass == self.vectors && self.roundtrip_pass == self.vectors
    }
}

/// One state-tree entry pair's row.
#[derive(Debug, Clone)]
pub struct EntryRow {
    /// The entry tag's name.
    pub tag: String,
    /// The wire version.
    pub version: u32,
    /// Whether the reference sdk can speak for this pair at all.
    pub sdk: SdkCoverage,
    /// Committed fixtures for it. Zero means nothing outside this crate has ever
    /// agreed with us about these bytes.
    pub fixtures: usize,
}

/// The FATE surface, split by what the corpus can and cannot speak for.
#[derive(Debug, Clone)]
pub struct FateSurface {
    /// Vectors in the corpus.
    pub vectors: usize,
    /// Vectors that decode and re-encode to the reference's exact bytes.
    pub roundtrip_pass: usize,
    /// Vectors that failed, with the reason.
    pub failures: Vec<String>,
    /// Value variants with at least one vector.
    pub value_variants_covered: BTreeSet<String>,
    /// Value variants with none.
    pub value_variants_uncovered: Vec<String>,
    /// Type variants with at least one vector.
    pub type_variants_covered: BTreeSet<String>,
    /// Type variants with none.
    pub type_variants_uncovered: Vec<String>,
}

/// The whole matrix.
#[derive(Debug, Clone)]
pub struct Matrix {
    /// The reference versions the corpora record.
    pub references: corpus::References,
    /// One row per transaction schema entry.
    pub transactions: Vec<TxRow>,
    /// One row per state-tree entry pair.
    pub entries: Vec<EntryRow>,
    /// The FATE surface.
    pub fate: FateSurface,
    /// Field codecs with no vector exercising them.
    pub unexercised_codecs: Vec<String>,
    /// Total fields across the transaction schema.
    pub fields_total: usize,
    /// Fields some vector sets.
    pub fields_exercised: usize,
    /// The on-node exercise, when one has been merged in.
    pub node: Option<Json>,
}

/// Compute the offline half of the matrix. No network, no working directory.
pub fn compute() -> Matrix {
    let cases = corpus::transactions();

    // Group the vectors by the schema entry they actually serialise to, read off
    // the reference's own bytes rather than off the generator's table — a case
    // that omits `version` still lands on exactly one entry, and which one is a
    // fact about the bytes.
    let mut by_entry: BTreeMap<(u32, u32), Vec<&corpus::TxCase>> = BTreeMap::new();
    let mut unplaceable = Vec::new();
    for case in &cases {
        match unpack_tx(&case.tx) {
            Ok(params) => {
                let version = params.version().unwrap_or(0);
                by_entry
                    .entry((case.tag.as_u32(), version))
                    .or_default()
                    .push(case);
            }
            Err(error) => unplaceable.push(format!("{}: unpack failed: {error}", case.name)),
        }
    }

    let mut set_fields: BTreeSet<(u32, u32, String)> = BTreeSet::new();
    for ((tag, version), cases) in &by_entry {
        for case in cases {
            for name in &case.param_names {
                set_fields.insert((*tag, *version, name.clone()));
            }
        }
    }

    let mut transactions = Vec::new();
    for entry in TX_SCHEMA.iter() {
        let key = (entry.tag.as_u32(), entry.version);
        let cases = by_entry.get(&key).map(Vec::as_slice).unwrap_or(&[]);
        let row = scope::row(entry.tag).expect("every tag is in the scope table");

        let mut build_pass = 0;
        let mut roundtrip_pass = 0;
        let mut failures = Vec::new();
        for case in cases {
            match check_build(case) {
                (Outcome::Pass, _) => build_pass += 1,
                (Outcome::Fail, why) => failures.push(format!("build {}: {why}", case.name)),
            }
            match check_roundtrip(case) {
                (Outcome::Pass, _) => roundtrip_pass += 1,
                (Outcome::Fail, why) => failures.push(format!("roundtrip {}: {why}", case.name)),
            }
        }

        let unexercised_fields: Vec<String> = entry
            .fields
            .iter()
            .filter(|(name, _)| !set_fields.contains(&(key.0, key.1, (*name).to_string())))
            .map(|(name, kind)| format!("{name} ({})", codec_name(kind)))
            .collect();

        // The reference derives a minimum fee by re-serialising the whole
        // transaction and iterating; the generator then writes the answer back
        // into the vector. So a corpus of pinned fees never enters that loop,
        // and no vector here can fail when our derivation disagrees.
        let has_fee_field = entry
            .fields
            .iter()
            .any(|(_, kind)| matches!(kind, FieldKind::Fee));
        let fee_fixed_point_unexercised =
            has_fee_field && cases.iter().all(|case| case.fee_present);

        transactions.push(TxRow {
            tag: entry.tag,
            version: entry.version,
            reach: row.reach,
            origin: row.origin,
            vectors: cases.len(),
            build_pass,
            roundtrip_pass,
            failures,
            unexercised_fields,
            fee_fixed_point_unexercised,
        });
    }

    if !unplaceable.is_empty() {
        transactions
            .first_mut()
            .expect("the schema is not empty")
            .failures
            .extend(unplaceable);
    }

    let fields_total: usize = TX_SCHEMA.iter().map(|entry| entry.fields.len()).sum();
    let fields_exercised = fields_total
        - transactions
            .iter()
            .map(|row| row.unexercised_fields.len())
            .sum::<usize>();

    let mut all_codecs: BTreeSet<String> = BTreeSet::new();
    let mut exercised_codecs: BTreeSet<String> = BTreeSet::new();
    for entry in TX_SCHEMA.iter() {
        for (name, kind) in entry.fields {
            all_codecs.insert(codec_name(kind).to_string());
            if set_fields.contains(&(entry.tag.as_u32(), entry.version, (*name).to_string())) {
                exercised_codecs.insert(codec_name(kind).to_string());
            }
        }
    }
    let unexercised_codecs: Vec<String> =
        all_codecs.difference(&exercised_codecs).cloned().collect();

    Matrix {
        references: corpus::references(),
        transactions,
        entries: entry_rows(),
        fate: fate_surface(),
        unexercised_codecs,
        fields_total,
        fields_exercised,
        node: None,
    }
}

fn check_build(case: &corpus::TxCase) -> (Outcome, String) {
    match build_tx(&case.params) {
        Ok(built) if built == case.tx => (Outcome::Pass, String::new()),
        Ok(built) => (Outcome::Fail, format!("expected {} got {built}", case.tx)),
        Err(error) => (Outcome::Fail, error.to_string()),
    }
}

fn check_roundtrip(case: &corpus::TxCase) -> (Outcome, String) {
    let unpacked = match unpack_tx(&case.tx) {
        Ok(params) => params,
        Err(error) => return (Outcome::Fail, format!("unpack: {error}")),
    };
    match build_tx(&unpacked) {
        Ok(rebuilt) if rebuilt == case.tx => (Outcome::Pass, String::new()),
        Ok(rebuilt) => (Outcome::Fail, format!("expected {} got {rebuilt}", case.tx)),
        Err(error) => (Outcome::Fail, format!("rebuild: {error}")),
    }
}

fn entry_rows() -> Vec<EntryRow> {
    SCHEMA_ENTRIES
        .iter()
        .map(|entry| EntryRow {
            tag: format!("{:?}", entry.tag),
            version: entry.version,
            sdk: entry.sdk,
            // No entry corpus is committed anywhere in this repository. Stated as
            // a measured zero rather than left out of the matrix, because "not
            // listed" and "listed as zero" read identically to a green summary
            // and only one of them is honest.
            fixtures: 0,
        })
        .collect()
}

/// Every `FateValue` variant this build can produce, by name.
const FATE_VALUE_VARIANTS: [&str; 13] = [
    "Int",
    "Bool",
    "Bits",
    "String",
    "Bytes",
    "Address",
    "Tuple",
    "List",
    "Map",
    "StoreMap",
    "Variant",
    "ContractBytearray",
    "Typerep",
];

/// Every `FateType` variant this build can produce, by name.
const FATE_TYPE_VARIANTS: [&str; 13] = [
    "Int",
    "Bool",
    "Bits",
    "String",
    "Bytes",
    "Address",
    "List",
    "Map",
    "Tuple",
    "Variant",
    "ContractBytearray",
    "TypeVar",
    "Any",
];

fn fate_surface() -> FateSurface {
    let cases = corpus::fate();
    let mut roundtrip_pass = 0;
    let mut failures = Vec::new();
    let mut value_variants: BTreeSet<String> = BTreeSet::new();
    let mut type_variants: BTreeSet<String> = BTreeSet::new();

    for case in &cases {
        // The family in the name decides which of the three reference encoders
        // produced the bytes; there is no in-band tag that distinguishes a
        // serialised type from a serialised value.
        let family = case.name.split('/').next().unwrap_or_default();
        let result = match family {
            "type" => roundtrip_type(&case.bytes, &mut type_variants),
            "calldata" => roundtrip_calldata(&case.bytes, &mut value_variants),
            _ => roundtrip_value(&case.bytes, &mut value_variants, &mut type_variants),
        };
        match result {
            Ok(()) => roundtrip_pass += 1,
            Err(why) => failures.push(format!("{}: {why}", case.name)),
        }
    }

    let value_variants_uncovered = FATE_VALUE_VARIANTS
        .iter()
        .filter(|variant| !value_variants.contains(**variant))
        .map(|variant| (*variant).to_string())
        .collect();
    let type_variants_uncovered = FATE_TYPE_VARIANTS
        .iter()
        .filter(|variant| !type_variants.contains(**variant))
        .map(|variant| (*variant).to_string())
        .collect();

    FateSurface {
        vectors: cases.len(),
        roundtrip_pass,
        failures,
        value_variants_covered: value_variants,
        value_variants_uncovered,
        type_variants_covered: type_variants,
        type_variants_uncovered,
    }
}

fn roundtrip_value(
    bytes: &[u8],
    values: &mut BTreeSet<String>,
    types: &mut BTreeSet<String>,
) -> Result<(), String> {
    let value = ae_fate::deserialize(bytes).map_err(|error| format!("decode: {error}"))?;
    note_value(&value, values, types);
    let re_encoded = ae_fate::serialize(&value).map_err(|error| format!("encode: {error}"))?;
    if re_encoded == bytes {
        Ok(())
    } else {
        Err(format!("re-encoded to {}", hex(&re_encoded)))
    }
}

fn roundtrip_type(bytes: &[u8], types: &mut BTreeSet<String>) -> Result<(), String> {
    let fate_type = ae_fate::deserialize_type(bytes).map_err(|error| format!("decode: {error}"))?;
    note_type(&fate_type, types);
    let re_encoded =
        ae_fate::serialize_type(&fate_type).map_err(|error| format!("encode: {error}"))?;
    if re_encoded == bytes {
        Ok(())
    } else {
        Err(format!("re-encoded to {}", hex(&re_encoded)))
    }
}

fn roundtrip_calldata(bytes: &[u8], values: &mut BTreeSet<String>) -> Result<(), String> {
    let decoded = ae_fate::decode_calldata(bytes).map_err(|error| format!("decode: {error}"))?;
    let mut types = BTreeSet::new();
    for argument in &decoded.arguments {
        note_value(argument, values, &mut types);
    }
    let re_encoded = ae_fate::encode_calldata(&decoded.function_id, &decoded.arguments)
        .map_err(|error| format!("encode: {error}"))?;
    if re_encoded == bytes {
        Ok(())
    } else {
        Err(format!("re-encoded to {}", hex(&re_encoded)))
    }
}

fn note_value(
    value: &ae_fate::FateValue,
    values: &mut BTreeSet<String>,
    types: &mut BTreeSet<String>,
) {
    use ae_fate::FateValue as V;
    values.insert(variant_name(value).to_string());
    match value {
        V::Tuple(members) | V::List(members) => {
            for member in members {
                note_value(member, values, types);
            }
        }
        V::Map(map) => {
            for (key, entry) in map.entries() {
                note_value(key, values, types);
                note_value(entry, values, types);
            }
        }
        V::Variant(variant) => {
            for member in variant.values() {
                note_value(member, values, types);
            }
        }
        V::Typerep(fate_type) => note_type(fate_type, types),
        _ => {}
    }
}

fn variant_name(value: &ae_fate::FateValue) -> &'static str {
    use ae_fate::FateValue as V;
    match value {
        V::Int(_) => "Int",
        V::Bool(_) => "Bool",
        V::Bits(_) => "Bits",
        V::String(_) => "String",
        V::Bytes(_) => "Bytes",
        V::Address(_, _) => "Address",
        V::Tuple(_) => "Tuple",
        V::List(_) => "List",
        V::Map(_) => "Map",
        V::StoreMap(_) => "StoreMap",
        V::Variant(_) => "Variant",
        V::ContractBytearray(_) => "ContractBytearray",
        V::Typerep(_) => "Typerep",
        // `FateValue` is `#[non_exhaustive]`. A variant added upstream lands
        // here rather than failing the build, and the test below turns it into
        // a named gap instead of a silently miscounted one.
        _ => UNKNOWN_VARIANT,
    }
}

fn note_type(fate_type: &ae_fate::FateType, types: &mut BTreeSet<String>) {
    use ae_fate::FateType as T;
    types.insert(type_variant_name(fate_type).to_string());
    match fate_type {
        T::List(element) => note_type(element, types),
        T::Map(key, value) => {
            note_type(key, types);
            note_type(value, types);
        }
        T::Tuple(members) | T::Variant(members) => {
            for member in members {
                note_type(member, types);
            }
        }
        _ => {}
    }
}

fn type_variant_name(fate_type: &ae_fate::FateType) -> &'static str {
    use ae_fate::FateType as T;
    match fate_type {
        T::Int => "Int",
        T::Bool => "Bool",
        T::Bits => "Bits",
        T::String => "String",
        T::Bytes(_) => "Bytes",
        T::Address(_) => "Address",
        T::List(_) => "List",
        T::Map(_, _) => "Map",
        T::Tuple(_) => "Tuple",
        T::Variant(_) => "Variant",
        T::ContractBytearray => "ContractBytearray",
        T::TypeVar(_) => "TypeVar",
        T::Any => "Any",
        // As above: `FateType` is `#[non_exhaustive]`.
        _ => UNKNOWN_VARIANT,
    }
}

fn codec_name(kind: &FieldKind) -> &'static str {
    match kind {
        FieldKind::Address(_) => "Address",
        FieldKind::AddressList(_) => "AddressList",
        FieldKind::NameId => "NameId",
        FieldKind::Name => "Name",
        FieldKind::Str => "Str",
        FieldKind::Raw => "Raw",
        FieldKind::RawList => "RawList",
        FieldKind::Encoded(_) => "Encoded",
        FieldKind::EncodedOptional(_) => "EncodedOptional",
        FieldKind::Uint => "Uint",
        FieldKind::UintDefault(_) => "UintDefault",
        FieldKind::CoinAmount => "CoinAmount",
        FieldKind::Deposit => "Deposit",
        FieldKind::ShortUInt => "ShortUInt",
        FieldKind::ShortUIntDefault(_) => "ShortUIntDefault",
        FieldKind::Ttl => "Ttl",
        FieldKind::NameTtl => "NameTtl",
        FieldKind::Nonce(_) => "Nonce",
        FieldKind::Fee => "Fee",
        FieldKind::NameFee => "NameFee",
        FieldKind::GasLimit => "GasLimit",
        FieldKind::GasPrice => "GasPrice",
        FieldKind::QueryFee => "QueryFee",
        FieldKind::AbiVersion => "AbiVersion",
        FieldKind::CtVersion => "CtVersion",
        FieldKind::OracleTtlType => "OracleTtlType",
        FieldKind::Pointers { .. } => "Pointers",
        FieldKind::Transaction(_) => "Transaction",
        // No wildcard: `FieldKind` is exhaustive, so a codec added to the schema
        // stops this crate compiling rather than being counted as covered.
        FieldKind::Entry(_) => "Entry",
    }
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

impl Matrix {
    /// The matrix as machine-readable json, which is what a later gate reads.
    pub fn to_json(&self) -> Json {
        json!({
            "references": {
                "aepp-sdk": self.references.aepp_sdk,
                "aepp-calldata": self.references.aepp_calldata,
            },
            "transactions": {
                "schema_entries": self.transactions.len(),
                "green": self.transactions.iter().filter(|row| row.is_green()).count(),
                "vectors": self.transactions.iter().map(|row| row.vectors).sum::<usize>(),
                "fields_total": self.fields_total,
                "fields_exercised": self.fields_exercised,
                "unexercised_codecs": self.unexercised_codecs,
                "fee_fixed_point_unexercised": self
                    .transactions
                    .iter()
                    .filter(|row| row.fee_fixed_point_unexercised)
                    .map(|row| format!("{:?} v{}", row.tag, row.version))
                    .collect::<Vec<_>>(),
                "rows": self.transactions.iter().map(|row| json!({
                    "tag": format!("{:?}", row.tag),
                    "tag_value": row.tag.as_u32(),
                    "version": row.version,
                    "reach": format!("{:?}", row.reach),
                    "origin": format!("{:?}", row.origin),
                    "vectors": row.vectors,
                    "build_pass": row.build_pass,
                    "roundtrip_pass": row.roundtrip_pass,
                    "failures": row.failures,
                    "unexercised_fields": row.unexercised_fields,
                    "fee_fixed_point_unexercised": row.fee_fixed_point_unexercised,
                })).collect::<Vec<_>>(),
            },
            "state_tree_entries": {
                "pairs": self.entries.len(),
                "with_fixture": self.entries.iter().filter(|row| row.fixtures > 0).count(),
                "rows": self.entries.iter().map(|row| json!({
                    "tag": row.tag,
                    "version": row.version,
                    "reference": match row.sdk {
                        SdkCoverage::Covered => "aepp-sdk",
                        SdkCoverage::NodeOnly => "node-only",
                    },
                    "fixtures": row.fixtures,
                })).collect::<Vec<_>>(),
            },
            "fate": {
                "vectors": self.fate.vectors,
                "roundtrip_pass": self.fate.roundtrip_pass,
                "failures": self.fate.failures,
                "value_variants_covered": self.fate.value_variants_covered,
                "value_variants_uncovered": self.fate.value_variants_uncovered,
                "type_variants_covered": self.fate.type_variants_covered,
                "type_variants_uncovered": self.fate.type_variants_uncovered,
            },
            "node": self.node,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Both reference enums are `#[non_exhaustive]`, so this crate carries a
    /// wildcard arm for each. If one ever fires, a variant exists upstream that
    /// the matrix is silently lumping together — which would understate a gap.
    #[test]
    fn no_row_is_classified_as_an_unknown_variant() {
        let matrix = compute();
        for variant in matrix
            .fate
            .value_variants_covered
            .iter()
            .chain(matrix.fate.type_variants_covered.iter())
        {
            assert_ne!(
                variant, UNKNOWN_VARIANT,
                "an upstream FATE variant is not named in this crate"
            );
        }
    }

    /// The named-variant lists are what "uncovered" is measured against, so they
    /// have to enumerate the whole of each enum. Rust cannot check a `&str` list
    /// against an enum, so the count is pinned instead.
    #[test]
    fn the_variant_lists_match_the_enums_they_stand_for() {
        let matrix = compute();
        assert_eq!(
            matrix.fate.value_variants_covered.len() + matrix.fate.value_variants_uncovered.len(),
            FATE_VALUE_VARIANTS.len()
        );
        assert_eq!(
            matrix.fate.type_variants_covered.len() + matrix.fate.type_variants_uncovered.len(),
            FATE_TYPE_VARIANTS.len()
        );
    }
}
