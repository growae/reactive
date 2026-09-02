//! The FATE value model.

use crate::error::{Error, Result};
use crate::int::FateInt;
use crate::tag;
use crate::types::FateType;

/// The address-shaped object types.
///
/// `bytes` is an object type on the wire too, but it carries a string rather
/// than an RLP-encoded address, so it is modelled separately as
/// [`FateValue::Bytes`].
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum AddressKind {
    /// `ak_…` — an account.
    Account,
    /// `ct_…` — a contract.
    Contract,
    /// `ok_…` — an oracle.
    Oracle,
    /// `oq_…` — an oracle query.
    OracleQuery,
    /// `ch_…` — a state channel.
    Channel,
}

impl AddressKind {
    /// The object type byte that follows the `OBJECT` tag.
    pub fn object_type(self) -> u8 {
        match self {
            AddressKind::Account => tag::OTYPE_ADDRESS,
            AddressKind::Contract => tag::OTYPE_CONTRACT,
            AddressKind::Oracle => tag::OTYPE_ORACLE,
            AddressKind::OracleQuery => tag::OTYPE_ORACLE_QUERY,
            AddressKind::Channel => tag::OTYPE_CHANNEL,
        }
    }

    /// The address kind for an object type byte, if it names one.
    pub fn from_object_type(object_type: u8) -> Option<Self> {
        match object_type {
            tag::OTYPE_ADDRESS => Some(AddressKind::Account),
            tag::OTYPE_CONTRACT => Some(AddressKind::Contract),
            tag::OTYPE_ORACLE => Some(AddressKind::Oracle),
            tag::OTYPE_ORACLE_QUERY => Some(AddressKind::OracleQuery),
            tag::OTYPE_CHANNEL => Some(AddressKind::Channel),
            _ => None,
        }
    }

    /// The protocol's ordering position for this kind, which is not the same
    /// as the object type byte.
    pub(crate) fn ordinal(self) -> u8 {
        match self {
            AddressKind::Account => 2,
            AddressKind::Channel => 3,
            AddressKind::Contract => 4,
            AddressKind::Oracle => 5,
            AddressKind::OracleQuery => 13,
        }
    }
}

/// A FATE map, held in the protocol's canonical key order.
///
/// The order is not an implementation detail: the *node's* decoder rejects a
/// map whose entries arrive in any other order, so a map that is merely
/// *correct* as a mapping is still unserialisable if it is unsorted. The
/// JavaScript library is the lenient one here and checks no order on read, so
/// agreeing with it is not the same as being accepted by a chain; see
/// `tests/divergence.rs`. Entries
/// are therefore canonicalised on construction, and the only way to build one
/// is through [`FateMap::new`], which also enforces the protocol's rule that a
/// map may not be used as a key.
#[derive(Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct FateMap {
    entries: Vec<(FateValue, FateValue)>,
}

impl FateMap {
    /// Builds a map, sorting into canonical key order.
    ///
    /// Later entries win over earlier ones with the same key, matching the
    /// reference implementation. Fails when a key contains a map.
    pub fn new(entries: impl IntoIterator<Item = (FateValue, FateValue)>) -> Result<Self> {
        let entries: Vec<(FateValue, FateValue)> = entries.into_iter().collect();
        for (key, _) in &entries {
            if key.contains_map() {
                return Err(Error::MapAsMapKey);
            }
        }
        let mut deduplicated: Vec<(FateValue, FateValue)> = Vec::with_capacity(entries.len());
        for (key, value) in entries.into_iter().rev() {
            if !deduplicated.iter().any(|(seen, _)| seen == &key) {
                deduplicated.push((key, value));
            }
        }
        deduplicated.sort_by(|(a, _), (b, _)| a.cmp(b));
        Ok(Self {
            entries: deduplicated,
        })
    }

    /// The entries, in canonical key order.
    pub fn entries(&self) -> &[(FateValue, FateValue)] {
        &self.entries
    }

    /// The number of entries.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// True when the map has no entries.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Looks a key up.
    pub fn get(&self, key: &FateValue) -> Option<&FateValue> {
        self.entries
            .binary_search_by(|(candidate, _)| candidate.cmp(key))
            .ok()
            .map(|index| &self.entries[index].1)
    }
}

/// A FATE variant: a sum-type value carrying the arity of every constructor,
/// the selected constructor's tag, and its payload.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct FateVariant {
    arities: Vec<u8>,
    tag: u8,
    values: Vec<FateValue>,
}

impl FateVariant {
    /// Builds a variant, checking the tag against the arity list.
    pub fn new(arities: Vec<u8>, tag: u8, values: Vec<FateValue>) -> Result<Self> {
        let arity = arities
            .get(usize::from(tag))
            .copied()
            .ok_or(Error::VariantTagOutOfRange {
                tag,
                arities: arities.len(),
            })?;
        if usize::from(arity) != values.len() {
            return Err(Error::VariantArityMismatch {
                tag,
                expected: arity,
                found: values.len(),
            });
        }
        Ok(Self {
            arities,
            tag,
            values,
        })
    }

    /// The arity of every constructor, in declaration order.
    pub fn arities(&self) -> &[u8] {
        &self.arities
    }

    /// The selected constructor.
    pub fn tag(&self) -> u8 {
        self.tag
    }

    /// The selected constructor's payload.
    pub fn values(&self) -> &[FateValue] {
        &self.values
    }
}

/// A FATE value.
///
/// The variants map one to one onto the wire format rather than onto Sophia's
/// surface types: a Sophia `record` is a [`FateValue::Tuple`], a `set` is a
/// [`FateValue::Map`] with unit values, and `string` and unsized byte arrays
/// share [`FateValue::String`]. Recovering the Sophia type needs the contract's
/// interface, which is a layer above this one.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
#[non_exhaustive]
pub enum FateValue {
    /// Arbitrary-precision integer.
    Int(FateInt),
    /// Boolean.
    Bool(bool),
    /// Bit field. Negative values denote an infinite run of ones.
    Bits(FateInt),
    /// A string or unsized byte array. Not required to be valid UTF-8.
    String(Vec<u8>),
    /// A sized byte string.
    Bytes(Vec<u8>),
    /// An address-shaped object.
    Address(AddressKind, Vec<u8>),
    /// A tuple. The empty tuple is FATE unit.
    Tuple(Vec<FateValue>),
    /// A list.
    List(Vec<FateValue>),
    /// A map, in canonical key order.
    Map(FateMap),
    /// A reference to a map held in contract store rather than inline.
    StoreMap(FateInt),
    /// A variant.
    Variant(FateVariant),
    /// Compiled contract code.
    ContractBytearray(Vec<u8>),
    /// A type, as a value.
    Typerep(FateType),
}

impl FateValue {
    /// FATE unit — the empty tuple.
    pub fn unit() -> Self {
        FateValue::Tuple(Vec::new())
    }

    /// An integer.
    pub fn int(value: impl Into<FateInt>) -> Self {
        FateValue::Int(value.into())
    }

    /// A string, from its UTF-8 bytes.
    pub fn string(value: impl AsRef<str>) -> Self {
        FateValue::String(value.as_ref().as_bytes().to_vec())
    }

    /// An account address.
    pub fn account(bytes: impl Into<Vec<u8>>) -> Self {
        FateValue::Address(AddressKind::Account, bytes.into())
    }

    /// A contract address.
    pub fn contract(bytes: impl Into<Vec<u8>>) -> Self {
        FateValue::Address(AddressKind::Contract, bytes.into())
    }

    /// A map, from any iterable of pairs.
    pub fn map(entries: impl IntoIterator<Item = (FateValue, FateValue)>) -> Result<Self> {
        Ok(FateValue::Map(FateMap::new(entries)?))
    }

    /// A set, which FATE represents as a map to unit.
    pub fn set(members: impl IntoIterator<Item = FateValue>) -> Result<Self> {
        Self::map(members.into_iter().map(|member| (member, Self::unit())))
    }

    /// A variant.
    pub fn variant(arities: Vec<u8>, tag: u8, values: Vec<FateValue>) -> Result<Self> {
        Ok(FateValue::Variant(FateVariant::new(arities, tag, values)?))
    }

    /// `None`, as the compiler encodes it.
    pub fn none() -> Self {
        FateValue::Variant(FateVariant::new(vec![0, 1], 0, Vec::new()).expect("well formed"))
    }

    /// `Some(value)`, as the compiler encodes it.
    pub fn some(value: FateValue) -> Self {
        FateValue::Variant(FateVariant::new(vec![0, 1], 1, vec![value]).expect("well formed"))
    }

    /// True when this value is, or contains, a map — which disqualifies it as
    /// a map key.
    fn contains_map(&self) -> bool {
        match self {
            FateValue::Map(_) | FateValue::StoreMap(_) => true,
            FateValue::Tuple(items) | FateValue::List(items) => {
                items.iter().any(FateValue::contains_map)
            }
            FateValue::Variant(variant) => variant.values().iter().any(FateValue::contains_map),
            _ => false,
        }
    }
}
