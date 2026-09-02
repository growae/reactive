//! Which transaction tags this library actually exposes, and who builds them.
//!
//! Two independent questions, and conflating them is what makes a coverage
//! number misleading:
//!
//! - **Reachability** — can a consumer of `@growae/reactive` cause this tag to
//!   be serialised at all? That decides whether an encoding defect in it can
//!   reach a user.
//! - **Origin** — is the transaction built on the client, or built by the node
//!   and pushed to the client to sign? That decides which *test* proves the tag,
//!   because for a node-built tag there is nothing for us to build: the exercised
//!   path is decode, sign, re-encode.
//!
//! The table below was transcribed from a survey of `packages/core/src` and
//! `packages/connectors/src` and re-checked against the tree at the head this
//! crate was written on. It is deliberately a hand-maintained table with a test
//! that pins its shape, not a grep: a grep over a TypeScript tree that mostly
//! reaches these tags *through* the reference sdk's own classes silently reports
//! six tags where the real answer is twenty-six.

use ae_core::tx::Tag;

/// How a consumer can reach a tag.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Reach {
    /// A named action in `packages/core` reaches it — `spend()`, `claimName()`,
    /// `openChannel()` and so on, whether it serialises the tag itself or hands
    /// the job to a reference-sdk class.
    NamedAction,
    /// No named action reaches it, but `buildTransaction()` takes
    /// `tag: Tag` plus `[key: string]: any` and forwards to the reference
    /// builder, so it is in the published surface regardless.
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
///
/// Twenty-one rows are [`Reach::NamedAction`]; the five that are not are all
/// channel tags with no named action in `packages/core/src/actions/channel`.
/// Ten rows are [`Origin::NodeBuilt`] — every channel tag, which is the set
/// `Tag::is_channel` returns.
pub const SCOPE: [ScopeRow; 26] = {
    use Origin::{ClientBuilt, NodeBuilt};
    use Reach::{NamedAction, PublicSurfaceOnly};
    const fn r(tag: Tag, reach: Reach, origin: Origin) -> ScopeRow {
        ScopeRow { tag, reach, origin }
    }
    [
        // Every signed transaction leaving the library carries this wrapper.
        r(Tag::SignedTx, NamedAction, ClientBuilt),
        r(Tag::SpendTx, NamedAction, ClientBuilt),
        r(Tag::OracleRegisterTx, NamedAction, ClientBuilt),
        r(Tag::OracleQueryTx, NamedAction, ClientBuilt),
        r(Tag::OracleRespondTx, NamedAction, ClientBuilt),
        r(Tag::OracleExtendTx, NamedAction, ClientBuilt),
        r(Tag::NameClaimTx, NamedAction, ClientBuilt),
        r(Tag::NamePreclaimTx, NamedAction, ClientBuilt),
        r(Tag::NameUpdateTx, NamedAction, ClientBuilt),
        r(Tag::NameRevokeTx, NamedAction, ClientBuilt),
        r(Tag::NameTransferTx, NamedAction, ClientBuilt),
        r(Tag::ContractCreateTx, NamedAction, ClientBuilt),
        r(Tag::ContractCallTx, NamedAction, ClientBuilt),
        // The five channel tags a named action reaches. The action opens or
        // moves the channel; the node's state machine still produces the bytes.
        r(Tag::ChannelCreateTx, NamedAction, NodeBuilt),
        r(Tag::ChannelDepositTx, NamedAction, NodeBuilt),
        r(Tag::ChannelWithdrawTx, NamedAction, NodeBuilt),
        r(Tag::ChannelCloseMutualTx, NamedAction, NodeBuilt),
        r(Tag::ChannelOffChainTx, NamedAction, NodeBuilt),
        // The five with no named action, reachable only through the generic
        // builder that takes any tag.
        r(Tag::ChannelCloseSoloTx, PublicSurfaceOnly, NodeBuilt),
        r(Tag::ChannelSlashTx, PublicSurfaceOnly, NodeBuilt),
        r(Tag::ChannelSettleTx, PublicSurfaceOnly, NodeBuilt),
        r(Tag::ChannelSnapshotSoloTx, PublicSurfaceOnly, NodeBuilt),
        r(Tag::ChannelForceProgressTx, PublicSurfaceOnly, NodeBuilt),
        r(Tag::GaAttachTx, NamedAction, ClientBuilt),
        r(Tag::GaMetaTx, NamedAction, ClientBuilt),
        r(Tag::PayingForTx, NamedAction, ClientBuilt),
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
    fn twenty_one_tags_are_reachable_through_a_named_action() {
        let named = SCOPE
            .iter()
            .filter(|row| row.reach == Reach::NamedAction)
            .count();
        assert_eq!(named, 21);
    }

    /// The scope survey this table came from described the node-built set as
    /// nine tags. It is ten, and `Tag::is_channel` is the shipped definition:
    /// the survey's own list of five channel tags reached by a named action plus
    /// five reached only through the generic builder sums to ten, not nine.
    /// Pinned here so the corrected number cannot quietly slide back.
    #[test]
    fn ten_tags_are_node_built_and_they_are_exactly_the_channel_tags() {
        let node_built: Vec<Tag> = SCOPE
            .iter()
            .filter(|row| row.origin == Origin::NodeBuilt)
            .map(|row| row.tag)
            .collect();
        assert_eq!(node_built.len(), 10);
        for tag in &node_built {
            assert!(
                tag.is_channel(),
                "{tag} is node-built but not a channel tag"
            );
        }
        assert_eq!(
            node_built.len(),
            ALL_TAGS.iter().filter(|tag| tag.is_channel()).count()
        );
    }
}
