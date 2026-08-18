//! Consensus constants, keyed by protocol version.
//!
//! `ConsensusProtocolVersion` has exactly one member today. Every constant here
//! is still reached through [`ConsensusProtocolVersion::params`] rather than
//! exported as a bare `const`, because the next fork adds a row to a table
//! instead of rewriting every call site.

use crate::error::{Error, Result};

/// A consensus protocol version.
///
/// Wire values are the protocol's own; `Ceres` is 6.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[non_exhaustive]
pub enum ConsensusProtocolVersion {
    /// The Ceres protocol, live since 2024.
    Ceres = 6,
}

impl ConsensusProtocolVersion {
    /// The version currently on mainnet.
    pub const LATEST: Self = Self::Ceres;

    /// Read a version off the wire.
    pub fn from_wire(version: u64) -> Result<Self> {
        match version {
            6 => Ok(Self::Ceres),
            other => Err(Error::UnknownEnumValue {
                field: "consensus protocol version",
                value: other,
            }),
        }
    }

    /// The consensus parameters for this version.
    pub const fn params(self) -> &'static ConsensusParams {
        match self {
            Self::Ceres => &CERES,
        }
    }
}

/// The consensus constants the fee and gas model is built from.
///
/// One value of this struct per protocol version; see [`ConsensusProtocolVersion::params`].
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub struct ConsensusParams {
    /// Gas charged for every transaction before any per-tag multiplier.
    pub base_gas: u64,
    /// Gas charged per serialised byte.
    pub gas_per_byte: u64,
    /// The lowest gas price a transaction may carry, in aettos.
    pub min_gas_price: u128,
    /// Target key block interval, in minutes. Divides the oracle ttl gas.
    pub key_block_interval_minutes: u64,
    /// Numerator of the oracle state-holding gas charge.
    pub oracle_state_gas_per_ttl: u64,
    /// AENS name fee multiplier, applied to the per-length bid range.
    pub name_fee_multiplier: u128,
    /// The minimum bid increment on an AENS auction, as a percentage.
    pub name_bid_increment_percent: u64,
    /// The longest name label that still attracts a length-scaled fee.
    pub name_max_length_fee: usize,
}

/// Ceres, protocol version 6.
static CERES: ConsensusParams = ConsensusParams {
    base_gas: 15_000,
    gas_per_byte: 20,
    min_gas_price: 1_000_000_000,
    key_block_interval_minutes: 3,
    oracle_state_gas_per_ttl: 32_000,
    name_fee_multiplier: 100_000_000_000_000,
    name_bid_increment_percent: 5,
    name_max_length_fee: 31,
};

/// A transaction tag.
///
/// Wire values are fixed by the protocol. Defined here rather than in the
/// transaction-serialisation module because the fee model is keyed by tag and
/// the two must not disagree about the numbers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[non_exhaustive]
pub enum Tag {
    /// A transaction wrapped in its signatures.
    SignedTx = 11,
    /// A coin transfer.
    SpendTx = 12,
    /// Register an oracle.
    OracleRegisterTx = 22,
    /// Ask an oracle a question.
    OracleQueryTx = 23,
    /// Answer an oracle query.
    OracleRespondTx = 24,
    /// Extend an oracle's ttl.
    OracleExtendTx = 25,
    /// Claim a preclaimed name.
    NameClaimTx = 32,
    /// Commit to a name claim.
    NamePreclaimTx = 33,
    /// Update a name's pointers or ttl.
    NameUpdateTx = 34,
    /// Revoke a name.
    NameRevokeTx = 35,
    /// Transfer a name to another account.
    NameTransferTx = 36,
    /// Deploy a contract.
    ContractCreateTx = 42,
    /// Call a contract.
    ContractCallTx = 43,
    /// Open a state channel.
    ChannelCreateTx = 50,
    /// Top a channel up.
    ChannelDepositTx = 51,
    /// Withdraw from a channel.
    ChannelWithdrawTx = 52,
    /// Force an off-chain contract call on chain.
    ChannelForceProgressTx = 521,
    /// Close a channel by agreement.
    ChannelCloseMutualTx = 53,
    /// Close a channel unilaterally.
    ChannelCloseSoloTx = 54,
    /// Punish a stale unilateral close.
    ChannelSlashTx = 55,
    /// Settle a closed channel.
    ChannelSettleTx = 56,
    /// An off-chain channel state.
    ChannelOffChainTx = 57,
    /// Anchor an off-chain state on chain.
    ChannelSnapshotSoloTx = 59,
    /// Attach a generalized-account authorisation contract.
    GaAttachTx = 80,
    /// Wrap a transaction in a generalized-account authorisation.
    GaMetaTx = 81,
    /// Pay another account's fee.
    PayingForTx = 82,
}

impl Tag {
    /// Read a tag off the wire.
    pub fn from_wire(tag: u64) -> Result<Self> {
        Ok(match tag {
            11 => Self::SignedTx,
            12 => Self::SpendTx,
            22 => Self::OracleRegisterTx,
            23 => Self::OracleQueryTx,
            24 => Self::OracleRespondTx,
            25 => Self::OracleExtendTx,
            32 => Self::NameClaimTx,
            33 => Self::NamePreclaimTx,
            34 => Self::NameUpdateTx,
            35 => Self::NameRevokeTx,
            36 => Self::NameTransferTx,
            42 => Self::ContractCreateTx,
            43 => Self::ContractCallTx,
            50 => Self::ChannelCreateTx,
            51 => Self::ChannelDepositTx,
            52 => Self::ChannelWithdrawTx,
            521 => Self::ChannelForceProgressTx,
            53 => Self::ChannelCloseMutualTx,
            54 => Self::ChannelCloseSoloTx,
            55 => Self::ChannelSlashTx,
            56 => Self::ChannelSettleTx,
            57 => Self::ChannelOffChainTx,
            59 => Self::ChannelSnapshotSoloTx,
            80 => Self::GaAttachTx,
            81 => Self::GaMetaTx,
            82 => Self::PayingForTx,
            other => {
                return Err(Error::UnknownEnumValue {
                    field: "transaction tag",
                    value: other,
                })
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_tag_round_trips_through_its_wire_value() {
        let tags = [
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
            Tag::ChannelForceProgressTx,
            Tag::ChannelCloseMutualTx,
            Tag::ChannelCloseSoloTx,
            Tag::ChannelSlashTx,
            Tag::ChannelSettleTx,
            Tag::ChannelOffChainTx,
            Tag::ChannelSnapshotSoloTx,
            Tag::GaAttachTx,
            Tag::GaMetaTx,
            Tag::PayingForTx,
        ];
        assert_eq!(tags.len(), 26);
        for tag in tags {
            assert_eq!(Tag::from_wire(tag as u64).unwrap(), tag);
        }
        assert!(Tag::from_wire(58).is_err());
    }

    #[test]
    fn ceres_carries_the_published_consensus_constants() {
        let params = ConsensusProtocolVersion::Ceres.params();
        assert_eq!(params.base_gas, 15_000);
        assert_eq!(params.gas_per_byte, 20);
        assert_eq!(params.min_gas_price, 1_000_000_000);
        assert_eq!(
            ConsensusProtocolVersion::from_wire(6).unwrap(),
            ConsensusProtocolVersion::Ceres
        );
        assert!(ConsensusProtocolVersion::from_wire(5).is_err());
    }
}
