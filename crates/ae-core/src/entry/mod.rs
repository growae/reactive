//! Chain state entries: the objects that live in the state trees.
//!
//! Every entry serialises as `rlp([tag, version] ++ fields)`. The tag says what
//! the object is; the version says which field list it uses.
//!
//! # Which implementation this follows
//!
//! **The node, and the serialisation spec that documents it — not the reference
//! JavaScript sdk.** They disagree in two places, both verified against
//! `aeternity/aeternity` `master` on 2026-08-18 rather than recalled:
//!
//! | Entry | Node emits | `@aeternity/aepp-sdk` 14.1.1 handles |
//! |---|---|---|
//! | `Account` | v1, v2 **and v3** (`aec_accounts.erl:148-152`) | v1 and v2 only |
//! | `ContractCall` | v2 **and v3** (`aect_call.erl:46-47`) | v2 only |
//!
//! Neither v3 is hypothetical. `aec_accounts:serialize/1` picks v3 for any
//! account with a non-zero `flags` and no authorisation contract — a plain
//! non-payable account — and `aect_call` picks v3 for any call made through a
//! name rather than a contract address. An implementation that follows the sdk
//! here fails to decode real chain data, and it fails by throwing on a live
//! account rather than by disagreeing about a byte.
//!
//! So this module implements the union. That is a superset of the sdk's
//! behaviour, which means the differential harness still holds: every input the
//! sdk can encode, this encodes identically, and the versions it cannot encode
//! are simply outside the comparison. Where the harness needs the sdk to be the
//! oracle, restrict its generated cases to v1/v2 accounts and v2 calls — do not
//! restrict this crate to match, because the chain does not.
//!
//! One smaller divergence, same direction: the spec writes a contract call log
//! entry's address as `id()`, while `aect_call.erl`'s template says `binary`.
//! The node wins; the address is 32 raw bytes with no tag byte.

use crate::bytes;
use crate::error::{Error, Result};
use crate::id::Id;
use crate::mpt::MerklePatriciaTree;
use crate::rlp::{self, Item};

mod tag;
pub use tag::{sdk_coverage, EntryTag, SchemaEntry, SdkCoverage, SCHEMA_ENTRIES};

/// A chain state entry.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub enum Entry {
    /// An account.
    Account(Account),
    /// An AENS name.
    Name(Name),
    /// A deployed contract.
    Contract(Contract),
    /// The record of one contract call.
    ContractCall(ContractCall),
    /// A registered oracle.
    Oracle(Oracle),
    /// A state channel.
    Channel(Channel),
    /// One off-chain channel update.
    ChannelOffChainUpdate(ChannelOffChainUpdate),
    /// A proof of inclusion over the six state subtrees.
    TreesPoi(TreesPoi),
    /// A whole state tree snapshot.
    StateTrees(StateTrees),
    /// One subtree, wrapped in the tag that says which one it is.
    SubTree(SubTree),
    /// A flat serialisation of a Merkle-Patricia tree's leaves.
    Mtree(Mtree),
    /// One key/value pair out of a Merkle-Patricia tree.
    MtreeValue(MtreeValue),
    /// The data a generalized account's authorisation function signs over.
    GaMetaTxAuthData(GaMetaTxAuthData),
}

/// An account.
///
/// The three wire versions are one type here: the version is chosen on the way
/// out by [`Account::version`], following `aec_accounts:serialize/1`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Account {
    /// Account flags. Bit 0 marks the account non-payable.
    pub flags: u64,
    /// The next nonce this account may spend.
    pub nonce: u64,
    /// Balance in aettos.
    pub balance: u128,
    /// Set when the account's spending is authorised by a contract.
    pub generalized: Option<GeneralizedAccount>,
}

/// The authorisation contract of a generalized account.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GeneralizedAccount {
    /// The authorisation contract.
    pub contract: Id,
    /// The name of the authorisation function, as compiled bytes.
    pub auth_fun: Vec<u8>,
}

/// Bit 0 of the account flags.
const FLAG_NON_PAYABLE: u64 = 1;

impl Account {
    /// The wire version this account serialises as.
    ///
    /// v2 whenever an authorisation contract is present, whatever the flags say;
    /// v1 for a plain account with no flags; v3 otherwise.
    pub const fn version(&self) -> u32 {
        if self.generalized.is_some() {
            2
        } else if self.flags == 0 {
            1
        } else {
            3
        }
    }

    /// Whether the account can receive a plain transfer.
    pub const fn is_payable(&self) -> bool {
        self.flags & FLAG_NON_PAYABLE == 0
    }
}

/// An AENS name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Name {
    /// The account that owns the name.
    pub owner: Id,
    /// The height the name expires at.
    pub expires_by: u64,
    /// The name's status, as raw bytes.
    pub status: Vec<u8>,
    /// How long a client should cache a resolution, in blocks.
    pub client_ttl: u64,
    /// What the name resolves to.
    pub pointers: Vec<Pointer>,
}

/// One AENS pointer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Pointer {
    /// The pointer key, e.g. `account_pubkey`.
    pub key: Vec<u8>,
    /// What it points at.
    pub id: Id,
}

/// A packed VM and ABI version pair.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CtVersion {
    /// The virtual machine version.
    pub vm: u16,
    /// The calling convention version.
    pub abi: u16,
}

impl CtVersion {
    /// Pack into the single integer the wire carries.
    pub const fn to_packed(self) -> u32 {
        ((self.vm as u32) << 16) | self.abi as u32
    }

    /// Unpack from the wire integer.
    pub const fn from_packed(packed: u32) -> Self {
        Self {
            vm: (packed >> 16) as u16,
            abi: (packed & 0xffff) as u16,
        }
    }
}

/// A deployed contract.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Contract {
    /// The account that deployed it.
    pub owner: Id,
    /// Which VM and ABI it runs under.
    pub ct_version: CtVersion,
    /// The compiled code.
    pub code: Vec<u8>,
    /// Always empty; the field exists for historical reasons.
    pub log: Vec<u8>,
    /// Whether the contract is callable.
    pub active: bool,
    /// Accounts that referred to this contract.
    pub referrers: Vec<Id>,
    /// The deposit locked at deployment, in aettos.
    pub deposit: u128,
}

/// What a call returned.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CallReturnType {
    /// Completed.
    Ok = 0,
    /// Failed.
    Error = 1,
    /// Reverted, undoing its own state changes.
    Revert = 2,
}

impl CallReturnType {
    fn from_wire(value: u64) -> Result<Self> {
        Ok(match value {
            0 => Self::Ok,
            1 => Self::Error,
            2 => Self::Revert,
            other => {
                return Err(Error::FieldValue {
                    field: "returnType",
                    reason: format!("{other} is not one of ok, error, revert"),
                })
            }
        })
    }
}

/// One log line emitted by a contract call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CallLog {
    /// The contract that emitted it, as 32 raw bytes.
    ///
    /// Not an `id()`: the node's own template says `binary`, and the spec's
    /// `id()` is the documentation being wrong about the implementation.
    pub address: Vec<u8>,
    /// The indexed topics.
    pub topics: Vec<Vec<u8>>,
    /// The unindexed payload.
    pub data: Vec<u8>,
}

/// The record of one contract call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContractCall {
    /// Who called.
    pub caller: Id,
    /// The caller's nonce at the time.
    pub caller_nonce: u64,
    /// The height the call ran at.
    pub height: u64,
    /// The contract called.
    pub contract: Id,
    /// Set when the call went through a name rather than an address; selects v3.
    pub ct_call_id: Option<Vec<u8>>,
    /// The gas price paid, in aettos.
    pub gas_price: u128,
    /// Gas actually burned.
    pub gas_used: u64,
    /// The encoded return value.
    pub return_value: Vec<u8>,
    /// How the call ended.
    pub return_type: CallReturnType,
    /// What it logged.
    pub log: Vec<CallLog>,
}

impl ContractCall {
    /// The wire version this call serialises as.
    pub const fn version(&self) -> u32 {
        if self.ct_call_id.is_some() {
            3
        } else {
            2
        }
    }
}

/// A registered oracle.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Oracle {
    /// The account behind the oracle.
    pub owner: Id,
    /// The format queries must take.
    pub query_format: Vec<u8>,
    /// The format responses take.
    pub response_format: Vec<u8>,
    /// What a query costs, in aettos.
    pub query_fee: u128,
    /// The height the registration expires at.
    pub expires: u64,
    /// The calling convention queries use.
    pub abi_version: u16,
}

/// A state channel.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Channel {
    /// The account that opened the channel.
    pub initiator: Id,
    /// The other party.
    pub responder: Id,
    /// Total locked in the channel.
    pub channel_amount: u128,
    /// The initiator's share.
    pub initiator_amount: u128,
    /// The responder's share.
    pub responder_amount: u128,
    /// The minimum either party must keep.
    pub channel_reserve: u128,
    /// Accounts the initiator delegates dispute handling to.
    pub initiator_delegate_ids: Vec<Id>,
    /// Accounts the responder delegates dispute handling to.
    pub responder_delegate_ids: Vec<Id>,
    /// The hash of the current off-chain state.
    pub state_hash: Vec<u8>,
    /// The current round.
    pub round: u64,
    /// The round a solo close was started at.
    pub solo_round: u128,
    /// How long a dispute stays open, in blocks.
    pub lock_period: u128,
    /// The height a running dispute unlocks at.
    pub locked_until: u128,
    /// The initiator's authorisation data, for generalized accounts.
    pub initiator_auth: Vec<u8>,
    /// The responder's authorisation data, for generalized accounts.
    pub responder_auth: Vec<u8>,
}

/// One off-chain channel update.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub enum ChannelOffChainUpdate {
    /// Move funds between the two parties.
    Transfer {
        /// Payer.
        from: Id,
        /// Payee.
        to: Id,
        /// Amount in aettos.
        amount: u128,
    },
    /// Add funds to a party's share.
    Deposit {
        /// Depositor.
        from: Id,
        /// Amount in aettos.
        amount: u128,
    },
    /// Remove funds from a party's share.
    Withdraw {
        /// Withdrawer.
        from: Id,
        /// Amount in aettos.
        amount: u128,
    },
    /// Deploy a contract inside the channel.
    CreateContract {
        /// The deploying party.
        owner: Id,
        /// VM and ABI versions.
        ct_version: CtVersion,
        /// Compiled code.
        code: Vec<u8>,
        /// Deposit in aettos.
        deposit: u128,
        /// Constructor arguments.
        call_data: Vec<u8>,
    },
    /// Call a contract inside the channel.
    CallContract {
        /// The calling party.
        caller: Id,
        /// The contract called.
        contract: Id,
        /// Calling convention.
        abi_version: u16,
        /// Value attached, in aettos.
        amount: u128,
        /// Encoded arguments.
        call_data: Vec<u8>,
        /// The call stack, as raw bytes.
        call_stack: Vec<u8>,
        /// Gas price in aettos.
        gas_price: u128,
        /// Gas limit.
        gas_limit: u64,
    },
}

impl ChannelOffChainUpdate {
    /// Which entry tag this update serialises under.
    pub const fn tag(&self) -> EntryTag {
        match self {
            Self::Transfer { .. } => EntryTag::ChannelOffChainUpdateTransfer,
            Self::Deposit { .. } => EntryTag::ChannelOffChainUpdateDeposit,
            Self::Withdraw { .. } => EntryTag::ChannelOffChainUpdateWithdraw,
            Self::CreateContract { .. } => EntryTag::ChannelOffChainUpdateCreateContract,
            Self::CallContract { .. } => EntryTag::ChannelOffChainUpdateCallContract,
        }
    }
}

/// A proof of inclusion over the six state subtrees.
///
/// Each subtree is present only if the proof says anything about it.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TreesPoi {
    /// Accounts.
    pub accounts: Option<MerklePatriciaTree>,
    /// Contract calls.
    pub calls: Option<MerklePatriciaTree>,
    /// State channels.
    pub channels: Option<MerklePatriciaTree>,
    /// Contracts.
    pub contracts: Option<MerklePatriciaTree>,
    /// Names.
    pub ns: Option<MerklePatriciaTree>,
    /// Oracles.
    pub oracles: Option<MerklePatriciaTree>,
}

/// One key/value pair from a Merkle-Patricia tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MtreeValue {
    /// The tree key — an address, a name hash, a call id.
    pub key: Vec<u8>,
    /// The serialised entry stored under it.
    pub value: Vec<u8>,
}

impl MtreeValue {
    /// Decode the entry this leaf holds.
    pub fn decode_value(&self) -> Result<Entry> {
        Entry::decode(&self.value)
    }
}

/// A Merkle-Patricia tree flattened to its leaves.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Mtree {
    /// The leaves.
    pub values: Vec<MtreeValue>,
}

/// Which of the six state subtrees a [`SubTree`] holds.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SubTreeKind {
    /// Contracts.
    Contracts,
    /// Contract calls.
    Calls,
    /// State channels.
    Channels,
    /// Names.
    Nameservice,
    /// Oracles.
    Oracles,
    /// Accounts.
    Accounts,
}

impl SubTreeKind {
    /// The entry tag that wraps this subtree.
    pub const fn tag(self) -> EntryTag {
        match self {
            Self::Contracts => EntryTag::ContractsMtree,
            Self::Calls => EntryTag::CallsMtree,
            Self::Channels => EntryTag::ChannelsMtree,
            Self::Nameservice => EntryTag::NameserviceMtree,
            Self::Oracles => EntryTag::OraclesMtree,
            Self::Accounts => EntryTag::AccountsMtree,
        }
    }

    const fn from_tag(tag: EntryTag) -> Option<Self> {
        Some(match tag {
            EntryTag::ContractsMtree => Self::Contracts,
            EntryTag::CallsMtree => Self::Calls,
            EntryTag::ChannelsMtree => Self::Channels,
            EntryTag::NameserviceMtree => Self::Nameservice,
            EntryTag::OraclesMtree => Self::Oracles,
            EntryTag::AccountsMtree => Self::Accounts,
            _ => return None,
        })
    }
}

/// One state subtree, tagged with which one it is.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SubTree {
    /// Which subtree.
    pub kind: SubTreeKind,
    /// Its leaves.
    pub tree: Mtree,
}

/// A whole state tree snapshot.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct StateTrees {
    /// Contracts.
    pub contracts: Mtree,
    /// Contract calls.
    pub calls: Mtree,
    /// State channels.
    pub channels: Mtree,
    /// Names.
    pub ns: Mtree,
    /// Oracles.
    pub oracles: Mtree,
    /// Accounts.
    pub accounts: Mtree,
}

/// What a generalized account's authorisation function signs over.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GaMetaTxAuthData {
    /// The fee of the wrapping transaction, in aettos.
    pub fee: u128,
    /// Its gas price, in aettos.
    pub gas_price: u128,
    /// The hash of the wrapped transaction.
    pub tx_hash: Vec<u8>,
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

fn int(value: u128) -> Item {
    Item::Bytes(bytes::u128_to_bytes(value))
}

fn bin(value: &[u8]) -> Item {
    Item::Bytes(value.to_vec())
}

fn boolean(value: bool) -> Item {
    Item::Bytes(vec![u8::from(value)])
}

fn id_item(value: Id) -> Item {
    Item::Bytes(value.to_bytes())
}

fn ids(values: &[Id]) -> Item {
    Item::List(values.iter().map(|i| id_item(*i)).collect())
}

fn read_bool(item: &Item) -> Result<bool> {
    match item.as_bytes()? {
        [0] => Ok(false),
        [1] => Ok(true),
        other => Err(Error::FieldValue {
            field: "bool",
            reason: format!("{other:?} is neither <<0>> nor <<1>>"),
        }),
    }
}

fn read_id(item: &Item) -> Result<Id> {
    Id::from_bytes(item.as_bytes()?)
}

fn read_ids(item: &Item) -> Result<Vec<Id>> {
    item.as_list()?.iter().map(read_id).collect()
}

fn read_u64(item: &Item) -> Result<u64> {
    bytes::bytes_to_u64(item.as_bytes()?)
}

fn read_u128(item: &Item) -> Result<u128> {
    bytes::bytes_to_u128(item.as_bytes()?)
}

fn read_u16(item: &Item) -> Result<u16> {
    u16::try_from(read_u64(item)?).map_err(|_| Error::FieldValue {
        field: "int",
        reason: "wider than 16 bits".into(),
    })
}

fn read_bytes(item: &Item) -> Result<Vec<u8>> {
    item.as_bytes().map(<[u8]>::to_vec)
}

/// Split an entry's rlp into its tag, version and fields.
fn split(input: &[u8]) -> Result<(EntryTag, u32, Vec<Item>)> {
    let decoded = rlp::decode(input)?;
    let items = decoded.as_list()?;
    let [tag, version, fields @ ..] = items else {
        return Err(Error::Rlp("entry has no tag and version".into()));
    };
    let tag = EntryTag::from_wire(bytes::bytes_to_u64(tag.as_bytes()?)?)?;
    let version = u32::try_from(bytes::bytes_to_u64(version.as_bytes()?)?).map_err(|_| {
        Error::FieldValue {
            field: "vsn",
            reason: "wider than 32 bits".into(),
        }
    })?;
    Ok((tag, version, fields.to_vec()))
}

/// Assemble an entry's rlp from its tag, version and fields.
fn join(tag: EntryTag, version: u32, fields: Vec<Item>) -> Vec<u8> {
    let mut items = Vec::with_capacity(fields.len() + 2);
    items.push(int(u128::from(tag as u32)));
    items.push(int(u128::from(version)));
    items.extend(fields);
    rlp::encode(&Item::List(items))
}

fn expect_arity(_tag: EntryTag, fields: &[Item], expected: usize) -> Result<()> {
    if fields.len() == expected {
        Ok(())
    } else {
        Err(Error::RecordLength {
            expected,
            actual: fields.len(),
        })
    }
}

fn unknown_version(tag: EntryTag, version: u32) -> Error {
    Error::SchemaNotFound {
        tag: tag as u32,
        version: Some(version),
    }
}

/// A subtree field of `StateTrees`: raw bytes holding a wrapped subtree entry.
fn read_subtree(item: &Item, kind: SubTreeKind) -> Result<Mtree> {
    let bytes = item.as_bytes()?;
    match Entry::decode(bytes)? {
        Entry::SubTree(sub) if sub.kind == kind => Ok(sub.tree),
        other => Err(Error::UnexpectedTag {
            expected: kind.tag() as u32,
            actual: other.tag() as u32,
        }),
    }
}

// ---------------------------------------------------------------------------
// Encoding and decoding
// ---------------------------------------------------------------------------

impl Entry {
    /// The tag this entry serialises under.
    pub const fn tag(&self) -> EntryTag {
        match self {
            Self::Account(_) => EntryTag::Account,
            Self::Name(_) => EntryTag::Name,
            Self::Contract(_) => EntryTag::Contract,
            Self::ContractCall(_) => EntryTag::ContractCall,
            Self::Oracle(_) => EntryTag::Oracle,
            Self::Channel(_) => EntryTag::Channel,
            Self::ChannelOffChainUpdate(update) => update.tag(),
            Self::TreesPoi(_) => EntryTag::TreesPoi,
            Self::StateTrees(_) => EntryTag::StateTrees,
            Self::SubTree(sub) => sub.kind.tag(),
            Self::Mtree(_) => EntryTag::Mtree,
            Self::MtreeValue(_) => EntryTag::MtreeValue,
            Self::GaMetaTxAuthData(_) => EntryTag::GaMetaTxAuthData,
        }
    }

    /// The wire version this entry serialises under.
    pub const fn version(&self) -> u32 {
        match self {
            Self::Account(account) => account.version(),
            Self::ContractCall(call) => call.version(),
            Self::Channel(_) => 3,
            // The one entry the protocol numbers from zero.
            Self::StateTrees(_) => 0,
            _ => 1,
        }
    }

    /// Serialise to bytes.
    pub fn encode(&self) -> Vec<u8> {
        let fields = match self {
            Self::Account(account) => match account.version() {
                1 => vec![int(u128::from(account.nonce)), int(account.balance)],
                2 => {
                    let ga = account
                        .generalized
                        .as_ref()
                        .expect("version 2 is chosen only when the contract is present");
                    vec![
                        int(u128::from(account.flags)),
                        int(u128::from(account.nonce)),
                        int(account.balance),
                        id_item(ga.contract),
                        bin(&ga.auth_fun),
                    ]
                }
                _ => vec![
                    int(u128::from(account.flags)),
                    int(u128::from(account.nonce)),
                    int(account.balance),
                ],
            },
            Self::Name(name) => vec![
                id_item(name.owner),
                int(u128::from(name.expires_by)),
                bin(&name.status),
                int(u128::from(name.client_ttl)),
                Item::List(
                    name.pointers
                        .iter()
                        .map(|p| Item::List(vec![bin(&p.key), id_item(p.id)]))
                        .collect(),
                ),
            ],
            Self::Contract(contract) => vec![
                id_item(contract.owner),
                int(u128::from(contract.ct_version.to_packed())),
                bin(&contract.code),
                bin(&contract.log),
                boolean(contract.active),
                ids(&contract.referrers),
                int(contract.deposit),
            ],
            Self::ContractCall(call) => {
                let mut fields = vec![
                    id_item(call.caller),
                    int(u128::from(call.caller_nonce)),
                    int(u128::from(call.height)),
                    id_item(call.contract),
                ];
                if let Some(ct_call_id) = &call.ct_call_id {
                    fields.push(bin(ct_call_id));
                }
                fields.extend([
                    int(call.gas_price),
                    int(u128::from(call.gas_used)),
                    bin(&call.return_value),
                    int(call.return_type as u128),
                    Item::List(
                        call.log
                            .iter()
                            .map(|entry| {
                                Item::List(vec![
                                    bin(&entry.address),
                                    Item::List(entry.topics.iter().map(|t| bin(t)).collect()),
                                    bin(&entry.data),
                                ])
                            })
                            .collect(),
                    ),
                ]);
                fields
            }
            Self::Oracle(oracle) => vec![
                id_item(oracle.owner),
                bin(&oracle.query_format),
                bin(&oracle.response_format),
                int(oracle.query_fee),
                int(u128::from(oracle.expires)),
                int(u128::from(oracle.abi_version)),
            ],
            Self::Channel(channel) => vec![
                id_item(channel.initiator),
                id_item(channel.responder),
                int(channel.channel_amount),
                int(channel.initiator_amount),
                int(channel.responder_amount),
                int(channel.channel_reserve),
                ids(&channel.initiator_delegate_ids),
                ids(&channel.responder_delegate_ids),
                bin(&channel.state_hash),
                int(u128::from(channel.round)),
                int(channel.solo_round),
                int(channel.lock_period),
                int(channel.locked_until),
                bin(&channel.initiator_auth),
                bin(&channel.responder_auth),
            ],
            Self::ChannelOffChainUpdate(update) => match update {
                ChannelOffChainUpdate::Transfer { from, to, amount } => {
                    vec![id_item(*from), id_item(*to), int(*amount)]
                }
                ChannelOffChainUpdate::Deposit { from, amount }
                | ChannelOffChainUpdate::Withdraw { from, amount } => {
                    vec![id_item(*from), int(*amount)]
                }
                ChannelOffChainUpdate::CreateContract {
                    owner,
                    ct_version,
                    code,
                    deposit,
                    call_data,
                } => vec![
                    id_item(*owner),
                    int(u128::from(ct_version.to_packed())),
                    bin(code),
                    int(*deposit),
                    bin(call_data),
                ],
                ChannelOffChainUpdate::CallContract {
                    caller,
                    contract,
                    abi_version,
                    amount,
                    call_data,
                    call_stack,
                    gas_price,
                    gas_limit,
                } => vec![
                    id_item(*caller),
                    id_item(*contract),
                    int(u128::from(*abi_version)),
                    int(*amount),
                    bin(call_data),
                    bin(call_stack),
                    int(*gas_price),
                    int(u128::from(*gas_limit)),
                ],
            },
            Self::TreesPoi(poi) => [
                &poi.accounts,
                &poi.calls,
                &poi.channels,
                &poi.contracts,
                &poi.ns,
                &poi.oracles,
            ]
            .into_iter()
            .map(|subtree| match subtree {
                Some(tree) => Item::List(vec![tree.to_rlp()]),
                None => Item::List(Vec::new()),
            })
            .collect(),
            Self::StateTrees(trees) => [
                (SubTreeKind::Contracts, &trees.contracts),
                (SubTreeKind::Calls, &trees.calls),
                (SubTreeKind::Channels, &trees.channels),
                (SubTreeKind::Nameservice, &trees.ns),
                (SubTreeKind::Oracles, &trees.oracles),
                (SubTreeKind::Accounts, &trees.accounts),
            ]
            .into_iter()
            .map(|(kind, tree)| {
                Item::Bytes(
                    Self::SubTree(SubTree {
                        kind,
                        tree: tree.clone(),
                    })
                    .encode(),
                )
            })
            .collect(),
            Self::SubTree(sub) => {
                vec![Item::Bytes(Self::Mtree(sub.tree.clone()).encode())]
            }
            Self::Mtree(tree) => vec![Item::List(
                tree.values
                    .iter()
                    .map(|value| Item::Bytes(Self::MtreeValue(value.clone()).encode()))
                    .collect(),
            )],
            Self::MtreeValue(value) => vec![bin(&value.key), bin(&value.value)],
            Self::GaMetaTxAuthData(auth) => {
                vec![int(auth.fee), int(auth.gas_price), bin(&auth.tx_hash)]
            }
        };
        join(self.tag(), self.version(), fields)
    }

    /// Parse an entry from bytes.
    pub fn decode(bytes: &[u8]) -> Result<Self> {
        let (tag, version, fields) = split(bytes)?;
        Ok(match tag {
            EntryTag::Account => Self::Account(match version {
                1 => {
                    expect_arity(tag, &fields, 2)?;
                    Account {
                        flags: 0,
                        nonce: read_u64(&fields[0])?,
                        balance: read_u128(&fields[1])?,
                        generalized: None,
                    }
                }
                2 => {
                    expect_arity(tag, &fields, 5)?;
                    Account {
                        flags: read_u64(&fields[0])?,
                        nonce: read_u64(&fields[1])?,
                        balance: read_u128(&fields[2])?,
                        generalized: Some(GeneralizedAccount {
                            contract: read_id(&fields[3])?,
                            auth_fun: read_bytes(&fields[4])?,
                        }),
                    }
                }
                3 => {
                    expect_arity(tag, &fields, 3)?;
                    Account {
                        flags: read_u64(&fields[0])?,
                        nonce: read_u64(&fields[1])?,
                        balance: read_u128(&fields[2])?,
                        generalized: None,
                    }
                }
                other => return Err(unknown_version(tag, other)),
            }),
            EntryTag::Name => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 5)?;
                Self::Name(Name {
                    owner: read_id(&fields[0])?,
                    expires_by: read_u64(&fields[1])?,
                    status: read_bytes(&fields[2])?,
                    client_ttl: read_u64(&fields[3])?,
                    pointers: fields[4]
                        .as_list()?
                        .iter()
                        .map(|pointer| {
                            let pair = pointer.as_list()?;
                            let [key, id] = pair else {
                                return Err(Error::RecordLength {
                                    expected: 2,
                                    actual: pair.len(),
                                });
                            };
                            Ok(Pointer {
                                key: read_bytes(key)?,
                                id: read_id(id)?,
                            })
                        })
                        .collect::<Result<Vec<_>>>()?,
                })
            }
            EntryTag::Contract => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 7)?;
                Self::Contract(Contract {
                    owner: read_id(&fields[0])?,
                    ct_version: CtVersion::from_packed(
                        u32::try_from(read_u64(&fields[1])?).map_err(|_| Error::FieldValue {
                            field: "ctVersion",
                            reason: "wider than 32 bits".into(),
                        })?,
                    ),
                    code: read_bytes(&fields[2])?,
                    log: read_bytes(&fields[3])?,
                    active: read_bool(&fields[4])?,
                    referrers: read_ids(&fields[5])?,
                    deposit: read_u128(&fields[6])?,
                })
            }
            EntryTag::ContractCall => {
                let named = match version {
                    2 => false,
                    3 => true,
                    other => return Err(unknown_version(tag, other)),
                };
                expect_arity(tag, &fields, if named { 10 } else { 9 })?;
                let mut cursor = 4;
                let ct_call_id = if named {
                    cursor += 1;
                    Some(read_bytes(&fields[4])?)
                } else {
                    None
                };
                Self::ContractCall(ContractCall {
                    caller: read_id(&fields[0])?,
                    caller_nonce: read_u64(&fields[1])?,
                    height: read_u64(&fields[2])?,
                    contract: read_id(&fields[3])?,
                    ct_call_id,
                    gas_price: read_u128(&fields[cursor])?,
                    gas_used: read_u64(&fields[cursor + 1])?,
                    return_value: read_bytes(&fields[cursor + 2])?,
                    return_type: CallReturnType::from_wire(read_u64(&fields[cursor + 3])?)?,
                    log: fields[cursor + 4]
                        .as_list()?
                        .iter()
                        .map(|line| {
                            let parts = line.as_list()?;
                            let [address, topics, data] = parts else {
                                return Err(Error::RecordLength {
                                    expected: 3,
                                    actual: parts.len(),
                                });
                            };
                            Ok(CallLog {
                                address: read_bytes(address)?,
                                topics: topics
                                    .as_list()?
                                    .iter()
                                    .map(read_bytes)
                                    .collect::<Result<Vec<_>>>()?,
                                data: read_bytes(data)?,
                            })
                        })
                        .collect::<Result<Vec<_>>>()?,
                })
            }
            EntryTag::Oracle => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 6)?;
                Self::Oracle(Oracle {
                    owner: read_id(&fields[0])?,
                    query_format: read_bytes(&fields[1])?,
                    response_format: read_bytes(&fields[2])?,
                    query_fee: read_u128(&fields[3])?,
                    expires: read_u64(&fields[4])?,
                    abi_version: read_u16(&fields[5])?,
                })
            }
            EntryTag::Channel => {
                if version != 3 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 15)?;
                Self::Channel(Channel {
                    initiator: read_id(&fields[0])?,
                    responder: read_id(&fields[1])?,
                    channel_amount: read_u128(&fields[2])?,
                    initiator_amount: read_u128(&fields[3])?,
                    responder_amount: read_u128(&fields[4])?,
                    channel_reserve: read_u128(&fields[5])?,
                    initiator_delegate_ids: read_ids(&fields[6])?,
                    responder_delegate_ids: read_ids(&fields[7])?,
                    state_hash: read_bytes(&fields[8])?,
                    round: read_u64(&fields[9])?,
                    solo_round: read_u128(&fields[10])?,
                    lock_period: read_u128(&fields[11])?,
                    locked_until: read_u128(&fields[12])?,
                    initiator_auth: read_bytes(&fields[13])?,
                    responder_auth: read_bytes(&fields[14])?,
                })
            }
            EntryTag::ChannelOffChainUpdateTransfer => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 3)?;
                Self::ChannelOffChainUpdate(ChannelOffChainUpdate::Transfer {
                    from: read_id(&fields[0])?,
                    to: read_id(&fields[1])?,
                    amount: read_u128(&fields[2])?,
                })
            }
            EntryTag::ChannelOffChainUpdateDeposit | EntryTag::ChannelOffChainUpdateWithdraw => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 2)?;
                let from = read_id(&fields[0])?;
                let amount = read_u128(&fields[1])?;
                Self::ChannelOffChainUpdate(if tag == EntryTag::ChannelOffChainUpdateDeposit {
                    ChannelOffChainUpdate::Deposit { from, amount }
                } else {
                    ChannelOffChainUpdate::Withdraw { from, amount }
                })
            }
            EntryTag::ChannelOffChainUpdateCreateContract => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 5)?;
                Self::ChannelOffChainUpdate(ChannelOffChainUpdate::CreateContract {
                    owner: read_id(&fields[0])?,
                    ct_version: CtVersion::from_packed(
                        u32::try_from(read_u64(&fields[1])?).map_err(|_| Error::FieldValue {
                            field: "ctVersion",
                            reason: "wider than 32 bits".into(),
                        })?,
                    ),
                    code: read_bytes(&fields[2])?,
                    deposit: read_u128(&fields[3])?,
                    call_data: read_bytes(&fields[4])?,
                })
            }
            EntryTag::ChannelOffChainUpdateCallContract => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 8)?;
                Self::ChannelOffChainUpdate(ChannelOffChainUpdate::CallContract {
                    caller: read_id(&fields[0])?,
                    contract: read_id(&fields[1])?,
                    abi_version: read_u16(&fields[2])?,
                    amount: read_u128(&fields[3])?,
                    call_data: read_bytes(&fields[4])?,
                    call_stack: read_bytes(&fields[5])?,
                    gas_price: read_u128(&fields[6])?,
                    gas_limit: read_u64(&fields[7])?,
                })
            }
            EntryTag::TreesPoi => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 6)?;
                let mut subtrees = Vec::with_capacity(6);
                for field in &fields {
                    let list = field.as_list()?;
                    subtrees.push(match list {
                        [] => None,
                        [tree] => Some(MerklePatriciaTree::from_rlp(tree)?),
                        other => {
                            return Err(Error::RecordLength {
                                expected: 1,
                                actual: other.len(),
                            })
                        }
                    });
                }
                let mut subtrees = subtrees.into_iter();
                Self::TreesPoi(TreesPoi {
                    accounts: subtrees.next().flatten(),
                    calls: subtrees.next().flatten(),
                    channels: subtrees.next().flatten(),
                    contracts: subtrees.next().flatten(),
                    ns: subtrees.next().flatten(),
                    oracles: subtrees.next().flatten(),
                })
            }
            EntryTag::StateTrees => {
                if version != 0 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 6)?;
                Self::StateTrees(StateTrees {
                    contracts: read_subtree(&fields[0], SubTreeKind::Contracts)?,
                    calls: read_subtree(&fields[1], SubTreeKind::Calls)?,
                    channels: read_subtree(&fields[2], SubTreeKind::Channels)?,
                    ns: read_subtree(&fields[3], SubTreeKind::Nameservice)?,
                    oracles: read_subtree(&fields[4], SubTreeKind::Oracles)?,
                    accounts: read_subtree(&fields[5], SubTreeKind::Accounts)?,
                })
            }
            EntryTag::ContractsMtree
            | EntryTag::CallsMtree
            | EntryTag::ChannelsMtree
            | EntryTag::NameserviceMtree
            | EntryTag::OraclesMtree
            | EntryTag::AccountsMtree => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 1)?;
                let kind = SubTreeKind::from_tag(tag).ok_or(Error::SchemaNotFound {
                    tag: tag as u32,
                    version: None,
                })?;
                let inner = Self::decode(fields[0].as_bytes()?)?;
                let Self::Mtree(tree) = inner else {
                    return Err(Error::UnexpectedTag {
                        expected: EntryTag::Mtree as u32,
                        actual: inner.tag() as u32,
                    });
                };
                Self::SubTree(SubTree { kind, tree })
            }
            EntryTag::Mtree => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 1)?;
                let mut values = Vec::new();
                for item in fields[0].as_list()? {
                    let inner = Self::decode(item.as_bytes()?)?;
                    let Self::MtreeValue(value) = inner else {
                        return Err(Error::UnexpectedTag {
                            expected: EntryTag::MtreeValue as u32,
                            actual: inner.tag() as u32,
                        });
                    };
                    values.push(value);
                }
                Self::Mtree(Mtree { values })
            }
            EntryTag::MtreeValue => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 2)?;
                Self::MtreeValue(MtreeValue {
                    key: read_bytes(&fields[0])?,
                    value: read_bytes(&fields[1])?,
                })
            }
            EntryTag::GaMetaTxAuthData => {
                if version != 1 {
                    return Err(unknown_version(tag, version));
                }
                expect_arity(tag, &fields, 3)?;
                Self::GaMetaTxAuthData(GaMetaTxAuthData {
                    fee: read_u128(&fields[0])?,
                    gas_price: read_u128(&fields[1])?,
                    tx_hash: read_bytes(&fields[2])?,
                })
            }
        })
    }
}

#[cfg(test)]
mod tests;
