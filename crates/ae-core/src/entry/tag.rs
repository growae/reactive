//! Entry tags.

use crate::error::{Error, Result};

/// The tag that says what a chain state entry is.
///
/// Wire values come from the protocol's object tag table. Tags the node defines
/// but never puts in a state tree — key blocks, micro blocks, proof of fraud,
/// and the transaction tags, which are [`crate::protocol::Tag`]'s job — are not
/// here.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[non_exhaustive]
pub enum EntryTag {
    /// An account.
    Account = 10,
    /// A registered oracle.
    Oracle = 20,
    /// An AENS name.
    Name = 30,
    /// A deployed contract.
    Contract = 40,
    /// The record of one contract call.
    ContractCall = 41,
    /// A state channel.
    Channel = 58,
    /// A proof of inclusion over the state trees.
    TreesPoi = 60,
    /// A whole state tree snapshot.
    StateTrees = 62,
    /// A Merkle-Patricia tree flattened to its leaves.
    Mtree = 63,
    /// One leaf of such a tree.
    MtreeValue = 64,
    /// Off-chain channel update: move funds.
    ChannelOffChainUpdateTransfer = 570,
    /// Off-chain channel update: add funds.
    ChannelOffChainUpdateDeposit = 571,
    /// Off-chain channel update: remove funds.
    ChannelOffChainUpdateWithdraw = 572,
    /// Off-chain channel update: deploy a contract.
    ChannelOffChainUpdateCreateContract = 573,
    /// Off-chain channel update: call a contract.
    ChannelOffChainUpdateCallContract = 574,
    /// The contracts subtree.
    ContractsMtree = 621,
    /// The contract calls subtree.
    CallsMtree = 622,
    /// The channels subtree.
    ChannelsMtree = 623,
    /// The names subtree.
    NameserviceMtree = 624,
    /// The oracles subtree.
    OraclesMtree = 625,
    /// The accounts subtree.
    AccountsMtree = 626,
    /// What a generalized account's authorisation function signs over.
    GaMetaTxAuthData = 810,
}

impl EntryTag {
    /// Read a tag off the wire.
    pub fn from_wire(tag: u64) -> Result<Self> {
        Ok(match tag {
            10 => Self::Account,
            20 => Self::Oracle,
            30 => Self::Name,
            40 => Self::Contract,
            41 => Self::ContractCall,
            58 => Self::Channel,
            60 => Self::TreesPoi,
            62 => Self::StateTrees,
            63 => Self::Mtree,
            64 => Self::MtreeValue,
            570 => Self::ChannelOffChainUpdateTransfer,
            571 => Self::ChannelOffChainUpdateDeposit,
            572 => Self::ChannelOffChainUpdateWithdraw,
            573 => Self::ChannelOffChainUpdateCreateContract,
            574 => Self::ChannelOffChainUpdateCallContract,
            621 => Self::ContractsMtree,
            622 => Self::CallsMtree,
            623 => Self::ChannelsMtree,
            624 => Self::NameserviceMtree,
            625 => Self::OraclesMtree,
            626 => Self::AccountsMtree,
            810 => Self::GaMetaTxAuthData,
            other => {
                return Err(Error::SchemaNotFound {
                    tag: u32::try_from(other).unwrap_or(u32::MAX),
                    version: None,
                })
            }
        })
    }

    /// The versions this build implements for the tag, lowest first.
    pub const fn versions(self) -> &'static [u32] {
        match self {
            Self::Account => &[1, 2, 3],
            Self::ContractCall => &[2, 3],
            Self::Channel => &[3],
            Self::StateTrees => &[0],
            _ => &[1],
        }
    }
}

/// Whether the reference JavaScript sdk implements a given schema entry.
///
/// The harness reads this rather than keeping its own list. A second copy of
/// this table living in the harness is a copy that goes stale the first time
/// `@aeternity/aepp-sdk` ships a version.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SdkCoverage {
    /// Both implementations encode this pair, so the harness may assert
    /// byte-identical output in both directions.
    Covered,
    /// Only the node emits it. The sdk is **not** an oracle here — assert
    /// against node-derived fixtures, and never score its absence as a core
    /// failure.
    NodeOnly,
}

/// One schema entry: a tag, a version, and who can speak for it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchemaEntry {
    /// The entry tag.
    pub tag: EntryTag,
    /// The wire version.
    pub version: u32,
    /// Whether `@aeternity/aepp-sdk` 14.1.1 implements this pair.
    pub sdk: SdkCoverage,
}

/// Every schema entry this crate implements, with its sdk coverage.
///
/// 25 pairs: the reference sdk's 23, plus `Account` v3 and `ContractCall` v3,
/// which the node emits and the sdk does not implement.
pub const SCHEMA_ENTRIES: [SchemaEntry; 25] = {
    use EntryTag as T;
    use SdkCoverage::{Covered, NodeOnly};
    const fn e(tag: EntryTag, version: u32, sdk: SdkCoverage) -> SchemaEntry {
        SchemaEntry { tag, version, sdk }
    }
    [
        e(T::Account, 1, Covered),
        e(T::Account, 2, Covered),
        // Emitted for any account with flags set and no authorisation contract.
        e(T::Account, 3, NodeOnly),
        e(T::Oracle, 1, Covered),
        e(T::Name, 1, Covered),
        e(T::Contract, 1, Covered),
        e(T::ContractCall, 2, Covered),
        // Emitted for a call made through a name rather than an address.
        e(T::ContractCall, 3, NodeOnly),
        e(T::Channel, 3, Covered),
        e(T::TreesPoi, 1, Covered),
        e(T::StateTrees, 0, Covered),
        e(T::Mtree, 1, Covered),
        e(T::MtreeValue, 1, Covered),
        e(T::ChannelOffChainUpdateTransfer, 1, Covered),
        e(T::ChannelOffChainUpdateDeposit, 1, Covered),
        e(T::ChannelOffChainUpdateWithdraw, 1, Covered),
        e(T::ChannelOffChainUpdateCreateContract, 1, Covered),
        e(T::ChannelOffChainUpdateCallContract, 1, Covered),
        e(T::ContractsMtree, 1, Covered),
        e(T::CallsMtree, 1, Covered),
        e(T::ChannelsMtree, 1, Covered),
        e(T::NameserviceMtree, 1, Covered),
        e(T::OraclesMtree, 1, Covered),
        e(T::AccountsMtree, 1, Covered),
        e(T::GaMetaTxAuthData, 1, Covered),
    ]
};

/// The coverage of one pair, or `None` if this crate does not implement it.
pub fn sdk_coverage(tag: EntryTag, version: u32) -> Option<SdkCoverage> {
    let mut index = 0;
    while index < SCHEMA_ENTRIES.len() {
        let entry = SCHEMA_ENTRIES[index];
        if entry.tag as u32 == tag as u32 && entry.version == version {
            return Some(entry.sdk);
        }
        index += 1;
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Every tag, so a new one cannot be added without this list noticing.
    pub const ALL: &[EntryTag] = &[
        EntryTag::Account,
        EntryTag::Oracle,
        EntryTag::Name,
        EntryTag::Contract,
        EntryTag::ContractCall,
        EntryTag::Channel,
        EntryTag::TreesPoi,
        EntryTag::StateTrees,
        EntryTag::Mtree,
        EntryTag::MtreeValue,
        EntryTag::ChannelOffChainUpdateTransfer,
        EntryTag::ChannelOffChainUpdateDeposit,
        EntryTag::ChannelOffChainUpdateWithdraw,
        EntryTag::ChannelOffChainUpdateCreateContract,
        EntryTag::ChannelOffChainUpdateCallContract,
        EntryTag::ContractsMtree,
        EntryTag::CallsMtree,
        EntryTag::ChannelsMtree,
        EntryTag::NameserviceMtree,
        EntryTag::OraclesMtree,
        EntryTag::AccountsMtree,
        EntryTag::GaMetaTxAuthData,
    ];

    #[test]
    fn every_tag_round_trips_through_its_wire_value() {
        for tag in ALL {
            assert_eq!(EntryTag::from_wire(*tag as u64).unwrap(), *tag);
        }
        // 22 tags over 23 schema entries: `Account` carries three versions and
        // `ContractCall` two, so the schema count and the tag count differ.
        assert_eq!(ALL.len(), 22);
        let schema_entries: usize = ALL.iter().map(|tag| tag.versions().len()).sum();
        assert_eq!(schema_entries, 25);
    }

    #[test]
    fn the_coverage_table_and_the_version_lists_agree() {
        // Neither can drift without the other noticing.
        let from_versions: Vec<(EntryTag, u32)> = ALL
            .iter()
            .flat_map(|tag| tag.versions().iter().map(move |v| (*tag, *v)))
            .collect();
        let from_table: Vec<(EntryTag, u32)> = SCHEMA_ENTRIES
            .iter()
            .map(|entry| (entry.tag, entry.version))
            .collect();
        let mut a = from_versions.clone();
        let mut b = from_table.clone();
        a.sort();
        b.sort();
        assert_eq!(a, b);
        assert_eq!(SCHEMA_ENTRIES.len(), 25);
    }

    #[test]
    fn exactly_two_pairs_are_beyond_the_reference_sdk() {
        let node_only: Vec<(EntryTag, u32)> = SCHEMA_ENTRIES
            .iter()
            .filter(|entry| entry.sdk == SdkCoverage::NodeOnly)
            .map(|entry| (entry.tag, entry.version))
            .collect();
        assert_eq!(
            node_only,
            vec![(EntryTag::Account, 3), (EntryTag::ContractCall, 3)]
        );
        // 23 is the reference sdk's own schema count.
        assert_eq!(SCHEMA_ENTRIES.len() - node_only.len(), 23);

        assert_eq!(
            sdk_coverage(EntryTag::Account, 1),
            Some(SdkCoverage::Covered)
        );
        assert_eq!(
            sdk_coverage(EntryTag::Account, 3),
            Some(SdkCoverage::NodeOnly)
        );
        assert_eq!(sdk_coverage(EntryTag::Account, 4), None);
    }

    #[test]
    fn rejects_tags_the_state_trees_never_hold() {
        // A transaction tag, not an entry tag.
        assert!(EntryTag::from_wire(12).is_err());
        // Key block.
        assert!(EntryTag::from_wire(100).is_err());
        // Oracle query and name commitment: defined by the protocol, not
        // implemented here, and it must fail loudly rather than be mistaken for
        // something adjacent.
        assert!(EntryTag::from_wire(21).is_err());
        assert!(EntryTag::from_wire(31).is_err());
    }
}
