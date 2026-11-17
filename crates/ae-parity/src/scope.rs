//! Which transactions the SDK-free JavaScript release builds through Rust.

use ae_core::tx::Tag;

/// How a consumer can reach a tag.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Reach {
    /// A named action builds the transaction or signs its envelope.
    NamedAction,
    /// Available through the generic Rust transaction builder.
    PublicSurfaceOnly,
}

/// Who serialises the transaction in the flow that actually runs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Origin {
    /// The client builds the bytes. Build parity is the test that matters.
    ClientBuilt,
    /// The node's channel state machine builds the bytes and pushes them over
    /// the WebSocket; the client decodes, signs and re-encodes. Round-trip
    /// parity is the test that matters, and a build vector is a convenience.
    NodeBuilt,
}

/// One row of the scope table.
#[derive(Debug, Clone, Copy)]
pub struct ScopeRow {
    /// The transaction tag.
    pub tag: Tag,
    /// How a consumer reaches it.
    pub reach: Reach,
    /// Who builds it in the flow that runs.
    pub origin: Origin,
}

/// Every tag, classified. Twenty-six rows, one per member of `ALL_TAGS`.
pub const SCOPE: [ScopeRow; 26] = {
    use Reach::{NamedAction, PublicSurfaceOnly};
    const fn client(tag: Tag, reach: Reach) -> ScopeRow {
        ScopeRow {
            tag,
            reach,
            origin: Origin::ClientBuilt,
        }
    }
    [
        client(Tag::SignedTx, NamedAction),
        client(Tag::SpendTx, NamedAction),
        client(Tag::OracleRegisterTx, PublicSurfaceOnly),
        client(Tag::OracleQueryTx, PublicSurfaceOnly),
        client(Tag::OracleRespondTx, PublicSurfaceOnly),
        client(Tag::OracleExtendTx, PublicSurfaceOnly),
        client(Tag::NameClaimTx, PublicSurfaceOnly),
        client(Tag::NamePreclaimTx, PublicSurfaceOnly),
        client(Tag::NameUpdateTx, PublicSurfaceOnly),
        client(Tag::NameRevokeTx, PublicSurfaceOnly),
        client(Tag::NameTransferTx, PublicSurfaceOnly),
        client(Tag::ContractCreateTx, PublicSurfaceOnly),
        client(Tag::ContractCallTx, PublicSurfaceOnly),
        client(Tag::ChannelCreateTx, PublicSurfaceOnly),
        client(Tag::ChannelDepositTx, PublicSurfaceOnly),
        client(Tag::ChannelWithdrawTx, PublicSurfaceOnly),
        client(Tag::ChannelCloseMutualTx, PublicSurfaceOnly),
        client(Tag::ChannelOffChainTx, PublicSurfaceOnly),
        client(Tag::ChannelCloseSoloTx, PublicSurfaceOnly),
        client(Tag::ChannelSlashTx, PublicSurfaceOnly),
        client(Tag::ChannelSettleTx, PublicSurfaceOnly),
        client(Tag::ChannelSnapshotSoloTx, PublicSurfaceOnly),
        client(Tag::ChannelForceProgressTx, PublicSurfaceOnly),
        client(Tag::GaAttachTx, PublicSurfaceOnly),
        client(Tag::GaMetaTx, PublicSurfaceOnly),
        client(Tag::PayingForTx, PublicSurfaceOnly),
    ]
};

/// The row for a tag. Total over `ALL_TAGS`, which a test pins.
pub fn row(tag: Tag) -> Option<ScopeRow> {
    SCOPE.into_iter().find(|row| row.tag == tag)
}

#[cfg(test)]
mod tests {
    use super::*;
    use ae_core::tx::ALL_TAGS;

    #[test]
    fn every_tag_is_classified_exactly_once() {
        for tag in ALL_TAGS {
            let matches = SCOPE.iter().filter(|row| row.tag == tag).count();
            assert_eq!(
                matches, 1,
                "{tag} appears {matches} times in the scope table"
            );
        }
        assert_eq!(SCOPE.len(), ALL_TAGS.len());
    }

    #[test]
    fn only_spends_and_signed_envelopes_have_named_build_paths() {
        let named: Vec<Tag> = SCOPE
            .iter()
            .filter(|row| row.reach == Reach::NamedAction)
            .map(|row| row.tag)
            .collect();
        assert_eq!(named, [Tag::SignedTx, Tag::SpendTx]);
        assert!(SCOPE.iter().all(|row| row.origin == Origin::ClientBuilt));
    }
}
