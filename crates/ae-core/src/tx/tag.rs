//! The transaction tag — the first field of every serialised transaction.

use crate::error::{Error, Result};

/// Every transaction tag the node serialises, with its on-chain numeric value.
///
/// Mirrors `aeser_chain_objects.erl`. The numbers are protocol constants and are
/// not consecutive: `ChannelForceProgressTx` is 521, not 58.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
#[repr(u32)]
pub enum Tag {
    /// A transaction plus its signatures.
    SignedTx = 11,
    /// Transfer of AE between two accounts.
    SpendTx = 12,
    /// Register an oracle.
    OracleRegisterTx = 22,
    /// Ask a registered oracle a question.
    OracleQueryTx = 23,
    /// Answer an oracle query.
    OracleRespondTx = 24,
    /// Extend an oracle's TTL.
    OracleExtendTx = 25,
    /// Claim a preclaimed AENS name.
    NameClaimTx = 32,
    /// Commit to claiming an AENS name.
    NamePreclaimTx = 33,
    /// Update an AENS name's pointers and TTLs.
    NameUpdateTx = 34,
    /// Revoke an AENS name.
    NameRevokeTx = 35,
    /// Transfer an AENS name to another account.
    NameTransferTx = 36,
    /// Deploy a contract.
    ContractCreateTx = 42,
    /// Call a deployed contract.
    ContractCallTx = 43,
    /// Open a state channel.
    ChannelCreateTx = 50,
    /// Deposit into a state channel.
    ChannelDepositTx = 51,
    /// Withdraw from a state channel.
    ChannelWithdrawTx = 52,
    /// Close a state channel with both parties' agreement.
    ChannelCloseMutualTx = 53,
    /// Close a state channel unilaterally.
    ChannelCloseSoloTx = 54,
    /// Punish a counterparty who closed on an outdated state.
    ChannelSlashTx = 55,
    /// Settle a channel after the lock period.
    ChannelSettleTx = 56,
    /// An off-chain channel state update.
    ChannelOffChainTx = 57,
    /// Snapshot a channel's off-chain state on-chain.
    ChannelSnapshotSoloTx = 59,
    /// Force a contract call on-chain inside a channel.
    ChannelForceProgressTx = 521,
    /// Attach generalized-account authorisation to an account.
    GaAttachTx = 80,
    /// A generalized-account meta transaction wrapping an inner transaction.
    GaMetaTx = 81,
    /// Pay another account's transaction fee.
    PayingForTx = 82,
}

/// Every tag, in the order the reference enum declares them.
pub const ALL_TAGS: [Tag; 26] = [
    Tag::SignedTx,
    Tag::SpendTx,
    Tag::OracleRegisterTx,
    Tag::OracleQueryTx,
    Tag::OracleRespondTx,
    Tag::OracleExtendTx,
    Tag::NameClaimTx,
    Tag::NamePreclaimTx,
    Tag::NameUpdateTx,
    Tag::NameRevokeTx,
    Tag::NameTransferTx,
    Tag::ContractCreateTx,
    Tag::ContractCallTx,
    Tag::ChannelCreateTx,
    Tag::ChannelDepositTx,
    Tag::ChannelWithdrawTx,
    Tag::ChannelCloseMutualTx,
    Tag::ChannelCloseSoloTx,
    Tag::ChannelSlashTx,
    Tag::ChannelSettleTx,
    Tag::ChannelOffChainTx,
    Tag::ChannelSnapshotSoloTx,
    Tag::ChannelForceProgressTx,
    Tag::GaAttachTx,
    Tag::GaMetaTx,
    Tag::PayingForTx,
];

impl Tag {
    /// The on-chain numeric value.
    pub const fn as_u32(self) -> u32 {
        self as u32
    }

    /// Look a tag up by its on-chain numeric value.
    pub fn from_u32(value: u32) -> Result<Tag> {
        ALL_TAGS
            .into_iter()
            .find(|t| t.as_u32() == value)
            .ok_or(Error::SchemaNotFound {
                tag: value,
                version: None,
            })
    }

    /// Whether this is a state-channel transaction.
    ///
    /// These are built by the node and pushed to the client over the channel
    /// WebSocket; the client's job is to decode, sign and re-encode them. Build
    /// support exists here for completeness and for the differential harness,
    /// but the decode-and-re-encode path is the one that gets exercised.
    pub const fn is_channel(self) -> bool {
        matches!(
            self,
            Tag::ChannelCreateTx
                | Tag::ChannelDepositTx
                | Tag::ChannelWithdrawTx
                | Tag::ChannelCloseMutualTx
                | Tag::ChannelCloseSoloTx
                | Tag::ChannelSlashTx
                | Tag::ChannelSettleTx
                | Tag::ChannelOffChainTx
                | Tag::ChannelSnapshotSoloTx
                | Tag::ChannelForceProgressTx
        )
    }
}

impl core::fmt::Display for Tag {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(f, "{self:?}({})", self.as_u32())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tag_values_match_the_protocol() {
        assert_eq!(Tag::SignedTx.as_u32(), 11);
        assert_eq!(Tag::SpendTx.as_u32(), 12);
        assert_eq!(Tag::ChannelForceProgressTx.as_u32(), 521);
        assert_eq!(Tag::PayingForTx.as_u32(), 82);
        assert_eq!(ALL_TAGS.len(), 26);
    }

    #[test]
    fn round_trips_every_tag_through_its_number() {
        for tag in ALL_TAGS {
            assert_eq!(Tag::from_u32(tag.as_u32()).unwrap(), tag);
        }
        assert!(Tag::from_u32(999).is_err());
    }

    #[test]
    fn ten_tags_are_channel_tags() {
        assert_eq!(ALL_TAGS.iter().filter(|t| t.is_channel()).count(), 10);
    }
}
