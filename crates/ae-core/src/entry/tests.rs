use super::*;
use crate::substrate::hash::blake2b_256;
use crate::substrate::id::IdTag;

fn account_id(byte: u8) -> Id {
    Id::new(IdTag::Account, [byte; 32])
}

fn contract_id(byte: u8) -> Id {
    Id::new(IdTag::Contract, [byte; 32])
}

/// Encode, decode, and check we got the same value and the same bytes back.
fn round_trip(entry: &Entry) -> Entry {
    let bytes = entry.encode();
    let decoded = Entry::decode(&bytes).expect("decodes");
    assert_eq!(&decoded, entry, "value survived the round trip");
    assert_eq!(decoded.encode(), bytes, "bytes survived the round trip");
    decoded
}

/// The tag and version an entry's bytes actually carry, read back off the wire.
fn tag_and_version(entry: &Entry) -> (u64, u64) {
    let bytes = entry.encode();
    let items = Item::decode(&bytes).unwrap();
    let items = items.as_list().unwrap();
    (
        rlp::read_u64(items[0].as_bytes().unwrap()).unwrap(),
        rlp::read_u64(items[1].as_bytes().unwrap()).unwrap(),
    )
}

// ---------------------------------------------------------------------------
// Account: the three-version divergence this row had to decide
// ---------------------------------------------------------------------------

#[test]
fn a_plain_account_serialises_as_version_1() {
    let account = Account {
        flags: 0,
        nonce: 7,
        balance: 1_000_000_000_000_000_000,
        generalized: None,
    };
    let entry = Entry::Account(account.clone());
    assert_eq!(tag_and_version(&entry), (10, 1));
    round_trip(&entry);
    assert!(account.is_payable());
}

#[test]
fn a_generalized_account_serialises_as_version_2_whatever_its_flags_say() {
    for flags in [0, 1] {
        let entry = Entry::Account(Account {
            flags,
            nonce: 1,
            balance: 42,
            generalized: Some(GeneralizedAccount {
                contract: contract_id(2),
                auth_fun: vec![0xab, 0xcd],
            }),
        });
        assert_eq!(tag_and_version(&entry), (10, 2));
        round_trip(&entry);
    }
}

#[test]
fn a_non_payable_account_serialises_as_version_3() {
    // The version the reference sdk does not implement, and the reason this
    // module follows the node instead: `aec_accounts:serialize/1` picks v3 for
    // an account with flags and no authorisation contract, and such accounts
    // are on chain.
    let account = Account {
        flags: 1,
        nonce: 3,
        balance: 5,
        generalized: None,
    };
    let entry = Entry::Account(account.clone());
    assert_eq!(tag_and_version(&entry), (10, 3));
    round_trip(&entry);
    assert!(!account.is_payable());
}

#[test]
fn all_three_account_versions_decode() {
    for version in [1u32, 2, 3] {
        let fields = match version {
            1 => vec![int(9), int(100)],
            2 => vec![
                int(0),
                int(9),
                int(100),
                id_item(contract_id(1)),
                bin(&[0x01]),
            ],
            _ => vec![int(1), int(9), int(100)],
        };
        let bytes = join(EntryTag::Account, version, fields);
        let Entry::Account(account) = Entry::decode(&bytes).unwrap() else {
            panic!("expected an account");
        };
        assert_eq!(account.nonce, 9);
        assert_eq!(account.balance, 100);
        assert_eq!(account.version(), version);
    }
}

#[test]
fn an_unknown_account_version_is_refused_rather_than_guessed() {
    let bytes = join(EntryTag::Account, 4, vec![int(0), int(1), int(2)]);
    assert_eq!(
        Entry::decode(&bytes).unwrap_err(),
        Error::UnknownEntryVersion {
            tag: 10,
            version: 4
        }
    );
}

#[test]
fn an_account_with_the_wrong_field_count_is_refused() {
    let bytes = join(EntryTag::Account, 1, vec![int(1)]);
    assert_eq!(
        Entry::decode(&bytes).unwrap_err(),
        Error::EntryArity {
            tag: 10,
            expected: 2,
            got: 1
        }
    );
}

#[test]
fn a_zero_balance_account_spells_zero_as_one_byte() {
    let entry = Entry::Account(Account::default());
    let bytes = entry.encode();
    let items = Item::decode(&bytes).unwrap();
    let items = items.as_list().unwrap();
    // tag 10, version 1, nonce 0, balance 0 — the last two are 0x00, not 0x80.
    assert_eq!(items[2].as_bytes().unwrap(), &[0x00]);
    assert_eq!(items[3].as_bytes().unwrap(), &[0x00]);
    round_trip(&entry);
}

// ---------------------------------------------------------------------------
// ContractCall: the second divergence
// ---------------------------------------------------------------------------

fn call(ct_call_id: Option<Vec<u8>>) -> ContractCall {
    ContractCall {
        caller: account_id(1),
        caller_nonce: 12,
        height: 340_000,
        contract: contract_id(2),
        ct_call_id,
        gas_price: 1_000_000_000,
        gas_used: 21_000,
        return_value: vec![0xde, 0xad],
        return_type: CallReturnType::Ok,
        log: vec![CallLog {
            address: vec![3u8; 32],
            topics: vec![vec![1u8; 32], vec![2u8; 32]],
            data: vec![0xbe, 0xef],
        }],
    }
}

#[test]
fn a_plain_call_serialises_as_version_2_and_a_named_call_as_version_3() {
    let plain = Entry::ContractCall(call(None));
    assert_eq!(tag_and_version(&plain), (41, 2));
    round_trip(&plain);

    let named = Entry::ContractCall(call(Some(vec![9u8; 32])));
    assert_eq!(tag_and_version(&named), (41, 3));
    round_trip(&named);

    // v3 is exactly v2 plus one field, in the fifth position.
    let plain_fields = Item::decode(&plain.encode()).unwrap();
    let named_fields = Item::decode(&named.encode()).unwrap();
    assert_eq!(plain_fields.as_list().unwrap().len() + 1, named_fields.as_list().unwrap().len());
}

#[test]
fn every_call_return_type_round_trips() {
    for return_type in [
        CallReturnType::Ok,
        CallReturnType::Error,
        CallReturnType::Revert,
    ] {
        let entry = Entry::ContractCall(ContractCall {
            return_type,
            ..call(None)
        });
        round_trip(&entry);
    }
    // Anything else is refused rather than mapped to Ok.
    let mut fields = match Item::decode(&Entry::ContractCall(call(None)).encode()).unwrap() {
        Item::List(items) => items,
        Item::Bytes(_) => unreachable!(),
    };
    fields[10] = int(3);
    let bytes = Item::List(fields).encode();
    assert!(matches!(
        Entry::decode(&bytes),
        Err(Error::UnknownEnumValue { .. })
    ));
}

#[test]
fn a_call_log_carries_a_raw_address_not_an_id() {
    // The node's template says `binary`, so the address is 32 bytes with no
    // leading tag byte — one byte shorter than an id() would be.
    let entry = Entry::ContractCall(call(None));
    let decoded = round_trip(&entry);
    let Entry::ContractCall(decoded) = decoded else {
        panic!("expected a call");
    };
    assert_eq!(decoded.log[0].address.len(), 32);
    assert_eq!(decoded.log[0].topics.len(), 2);
}

// ---------------------------------------------------------------------------
// The rest of the entry set
// ---------------------------------------------------------------------------

#[test]
fn a_name_round_trips_with_its_pointers() {
    let entry = Entry::Name(Name {
        owner: account_id(1),
        expires_by: 500_000,
        status: Vec::new(),
        client_ttl: 84_600,
        pointers: vec![
            Pointer {
                key: b"account_pubkey".to_vec(),
                id: account_id(2),
            },
            Pointer {
                key: b"oracle_pubkey".to_vec(),
                id: Id::new(IdTag::Oracle, [3; 32]),
            },
        ],
    });
    assert_eq!(tag_and_version(&entry), (30, 1));
    round_trip(&entry);

    // And with none at all.
    let entry = Entry::Name(Name {
        owner: account_id(1),
        expires_by: 1,
        status: Vec::new(),
        client_ttl: 0,
        pointers: Vec::new(),
    });
    round_trip(&entry);
}

#[test]
fn a_contract_round_trips_and_packs_its_vm_and_abi_versions() {
    let entry = Entry::Contract(Contract {
        owner: account_id(1),
        ct_version: CtVersion { vm: 8, abi: 3 },
        code: vec![0xca, 0xfe],
        log: Vec::new(),
        active: true,
        referrers: vec![account_id(2), account_id(3)],
        deposit: 0,
    });
    assert_eq!(tag_and_version(&entry), (40, 1));
    round_trip(&entry);

    // Fate3 over the Fate abi packs to the three bytes [8, 0, 3].
    let packed = CtVersion { vm: 8, abi: 3 }.to_packed();
    assert_eq!(rlp::encode_int_field(u128::from(packed)), vec![8, 0, 3]);
    assert_eq!(CtVersion::from_packed(packed), CtVersion { vm: 8, abi: 3 });
}

#[test]
fn an_inactive_contract_differs_from_an_active_one_by_one_byte() {
    let base = Contract {
        owner: account_id(1),
        ct_version: CtVersion { vm: 8, abi: 3 },
        code: vec![0xca],
        log: Vec::new(),
        active: true,
        referrers: Vec::new(),
        deposit: 7,
    };
    let active = Entry::Contract(base.clone()).encode();
    let inactive = Entry::Contract(Contract {
        active: false,
        ..base
    })
    .encode();
    assert_eq!(active.len(), inactive.len());
    assert_ne!(active, inactive);
}

#[test]
fn an_oracle_round_trips() {
    let entry = Entry::Oracle(Oracle {
        owner: account_id(1),
        query_format: b"string".to_vec(),
        response_format: b"int".to_vec(),
        query_fee: 30_000_000_000_000,
        expires: 600_000,
        abi_version: 3,
    });
    assert_eq!(tag_and_version(&entry), (20, 1));
    round_trip(&entry);
}

#[test]
fn a_channel_round_trips() {
    let entry = Entry::Channel(Channel {
        initiator: account_id(1),
        responder: account_id(2),
        channel_amount: 20,
        initiator_amount: 10,
        responder_amount: 10,
        channel_reserve: 2,
        initiator_delegate_ids: vec![account_id(3)],
        responder_delegate_ids: Vec::new(),
        state_hash: vec![4u8; 32],
        round: 5,
        solo_round: 0,
        lock_period: 10,
        locked_until: 0,
        initiator_auth: Vec::new(),
        responder_auth: Vec::new(),
    });
    assert_eq!(tag_and_version(&entry), (58, 3));
    round_trip(&entry);
}

#[test]
fn every_off_chain_update_round_trips_under_its_own_tag() {
    let updates = [
        (
            ChannelOffChainUpdate::Transfer {
                from: account_id(1),
                to: account_id(2),
                amount: 5,
            },
            570,
        ),
        (
            ChannelOffChainUpdate::Deposit {
                from: account_id(1),
                amount: 5,
            },
            571,
        ),
        (
            ChannelOffChainUpdate::Withdraw {
                from: account_id(1),
                amount: 5,
            },
            572,
        ),
        (
            ChannelOffChainUpdate::CreateContract {
                owner: account_id(1),
                ct_version: CtVersion { vm: 8, abi: 3 },
                code: vec![0x01],
                deposit: 0,
                call_data: vec![0x02],
            },
            573,
        ),
        (
            ChannelOffChainUpdate::CallContract {
                caller: account_id(1),
                contract: contract_id(2),
                abi_version: 3,
                amount: 0,
                call_data: vec![0x03],
                call_stack: Vec::new(),
                gas_price: 1_000_000_000,
                gas_limit: 100_000,
            },
            574,
        ),
    ];
    for (update, tag) in updates {
        let entry = Entry::ChannelOffChainUpdate(update);
        assert_eq!(tag_and_version(&entry), (tag, 1));
        round_trip(&entry);
    }
}

#[test]
fn deposit_and_withdraw_share_a_shape_but_not_a_tag() {
    let deposit = Entry::ChannelOffChainUpdate(ChannelOffChainUpdate::Deposit {
        from: account_id(1),
        amount: 5,
    });
    let withdraw = Entry::ChannelOffChainUpdate(ChannelOffChainUpdate::Withdraw {
        from: account_id(1),
        amount: 5,
    });
    assert_ne!(deposit.encode(), withdraw.encode());
    assert_eq!(deposit.encode().len(), withdraw.encode().len());
    assert_ne!(round_trip(&deposit), round_trip(&withdraw));
}

#[test]
fn the_auth_data_a_generalized_account_signs_round_trips() {
    let entry = Entry::GaMetaTxAuthData(GaMetaTxAuthData {
        fee: 17_000_000_000_000,
        gas_price: 1_000_000_000,
        tx_hash: vec![7u8; 32],
    });
    assert_eq!(tag_and_version(&entry), (810, 1));
    round_trip(&entry);
}

// ---------------------------------------------------------------------------
// The tree entries
// ---------------------------------------------------------------------------

fn sample_account_leaf(byte: u8) -> MtreeValue {
    MtreeValue {
        key: vec![byte; 32],
        value: Entry::Account(Account {
            flags: 0,
            nonce: u64::from(byte),
            balance: 1_000,
            generalized: None,
        })
        .encode(),
    }
}

#[test]
fn an_mtree_value_carries_an_entry_that_decodes_on_its_own() {
    let leaf = sample_account_leaf(1);
    let entry = Entry::MtreeValue(leaf.clone());
    assert_eq!(tag_and_version(&entry), (64, 1));
    round_trip(&entry);

    let Entry::Account(account) = leaf.decode_value().unwrap() else {
        panic!("expected an account");
    };
    assert_eq!(account.nonce, 1);
}

#[test]
fn an_mtree_round_trips_its_leaves() {
    let entry = Entry::Mtree(Mtree {
        values: vec![sample_account_leaf(1), sample_account_leaf(2)],
    });
    assert_eq!(tag_and_version(&entry), (63, 1));
    round_trip(&entry);

    // And an empty one.
    round_trip(&Entry::Mtree(Mtree::default()));
}

#[test]
fn every_subtree_wrapper_round_trips_under_its_own_tag() {
    let kinds = [
        (SubTreeKind::Contracts, 621),
        (SubTreeKind::Calls, 622),
        (SubTreeKind::Channels, 623),
        (SubTreeKind::Nameservice, 624),
        (SubTreeKind::Oracles, 625),
        (SubTreeKind::Accounts, 626),
    ];
    for (kind, tag) in kinds {
        let entry = Entry::SubTree(SubTree {
            kind,
            tree: Mtree {
                values: vec![sample_account_leaf(1)],
            },
        });
        assert_eq!(tag_and_version(&entry), (tag, 1));
        round_trip(&entry);
    }
}

#[test]
fn state_trees_nest_six_subtrees_and_round_trip() {
    let entry = Entry::StateTrees(StateTrees {
        accounts: Mtree {
            values: vec![sample_account_leaf(1), sample_account_leaf(2)],
        },
        ..StateTrees::default()
    });
    // The one entry the protocol versions from zero.
    assert_eq!(tag_and_version(&entry), (62, 0));
    let decoded = round_trip(&entry);
    let Entry::StateTrees(trees) = decoded else {
        panic!("expected state trees");
    };
    assert_eq!(trees.accounts.values.len(), 2);
    assert!(trees.oracles.values.is_empty());
}

#[test]
fn state_trees_reject_a_subtree_filed_under_the_wrong_tag() {
    // Swap the accounts subtree for an oracles one; the field position and the
    // wrapper tag then disagree, which must not be silently accepted.
    let wrong = Entry::SubTree(SubTree {
        kind: SubTreeKind::Oracles,
        tree: Mtree::default(),
    })
    .encode();
    let right = |kind| Item::Bytes(Entry::SubTree(SubTree { kind, tree: Mtree::default() }).encode());
    let bytes = join(
        EntryTag::StateTrees,
        0,
        vec![
            right(SubTreeKind::Contracts),
            right(SubTreeKind::Calls),
            right(SubTreeKind::Channels),
            right(SubTreeKind::Nameservice),
            right(SubTreeKind::Oracles),
            Item::Bytes(wrong),
        ],
    );
    assert!(Entry::decode(&bytes).is_err());
}

#[test]
fn a_proof_of_inclusion_round_trips_with_only_the_subtrees_it_proves() {
    // One leaf node, filed under its own hash, is the smallest real proof.
    let items = vec![vec![0x20, 0xab, 0xcd], b"value".to_vec()];
    let list = Item::List(items.iter().map(|i| Item::Bytes(i.clone())).collect());
    let hash = blake2b_256(&list.encode());
    let tree = MerklePatriciaTree::from_rlp(&Item::List(vec![
        Item::Bytes(hash.to_vec()),
        Item::List(vec![Item::List(vec![Item::Bytes(hash.to_vec()), list])]),
    ]))
    .unwrap();

    let entry = Entry::TreesPoi(TreesPoi {
        accounts: Some(tree),
        ..TreesPoi::default()
    });
    assert_eq!(tag_and_version(&entry), (60, 1));
    let decoded = round_trip(&entry);
    let Entry::TreesPoi(poi) = decoded else {
        panic!("expected a poi");
    };
    let accounts = poi.accounts.expect("the accounts subtree was proved");
    assert_eq!(accounts.get(&[0xab, 0xcd]).unwrap(), Some(b"value".to_vec()));
    // An unproved subtree is absent, not empty-but-present.
    assert!(poi.oracles.is_none());
}

#[test]
fn an_empty_proof_of_inclusion_round_trips() {
    let entry = Entry::TreesPoi(TreesPoi::default());
    let bytes = entry.encode();
    round_trip(&entry);
    // Six empty lists, so the whole thing is tiny.
    assert!(bytes.len() < 16, "got {} bytes", bytes.len());
}

// ---------------------------------------------------------------------------
// Cross-cutting
// ---------------------------------------------------------------------------

#[test]
fn an_unknown_tag_is_refused() {
    let bytes = join_raw(999, 1, vec![int(1)]);
    assert_eq!(Entry::decode(&bytes).unwrap_err(), Error::UnknownEntryTag(999));
}

/// `join` for a tag this build does not have a variant for.
fn join_raw(tag: u32, version: u32, fields: Vec<Item>) -> Vec<u8> {
    let mut items = vec![int(u128::from(tag)), int(u128::from(version))];
    items.extend(fields);
    Item::List(items).encode()
}

#[test]
fn truncated_and_malformed_input_is_refused_rather_than_half_read() {
    let bytes = Entry::Account(Account::default()).encode();
    for cut in 1..bytes.len() {
        // Every proper prefix is either invalid rlp or the wrong arity; none
        // may decode to an account.
        assert!(Entry::decode(&bytes[..cut]).is_err(), "prefix of {cut} decoded");
    }
    assert!(Entry::decode(&[]).is_err());
    // A byte string where a list belongs.
    assert!(Entry::decode(&Item::Bytes(vec![1, 2, 3]).encode()).is_err());
}

#[test]
fn an_id_field_with_an_unknown_tag_byte_is_refused() {
    let mut bad = account_id(1).to_bytes();
    bad[0] = 9;
    let bytes = join(
        EntryTag::Oracle,
        1,
        vec![
            Item::Bytes(bad),
            bin(b"string"),
            bin(b"int"),
            int(0),
            int(1),
            int(3),
        ],
    );
    assert_eq!(Entry::decode(&bytes).unwrap_err(), Error::UnknownIdTag(9));
}

#[test]
fn a_non_minimal_integer_field_is_refused() {
    // Nonce encoded as 0x00 0x09 rather than 0x09.
    let bytes = join(
        EntryTag::Account,
        1,
        vec![Item::Bytes(vec![0x00, 0x09]), int(100)],
    );
    assert!(matches!(
        Entry::decode(&bytes),
        Err(Error::IntegerRange(_))
    ));
}

#[test]
fn every_implemented_tag_and_version_pair_is_reachable() {
    // The schema count this row is answerable for: 22 tags, 25 tag/version
    // pairs — the reference sdk's 23 plus Account v3 and ContractCall v3.
    let pairs: Vec<(EntryTag, u32)> = [
        (EntryTag::Account, 1),
        (EntryTag::Account, 2),
        (EntryTag::Account, 3),
        (EntryTag::Oracle, 1),
        (EntryTag::Name, 1),
        (EntryTag::Contract, 1),
        (EntryTag::ContractCall, 2),
        (EntryTag::ContractCall, 3),
        (EntryTag::Channel, 3),
        (EntryTag::TreesPoi, 1),
        (EntryTag::StateTrees, 0),
        (EntryTag::Mtree, 1),
        (EntryTag::MtreeValue, 1),
        (EntryTag::ChannelOffChainUpdateTransfer, 1),
        (EntryTag::ChannelOffChainUpdateDeposit, 1),
        (EntryTag::ChannelOffChainUpdateWithdraw, 1),
        (EntryTag::ChannelOffChainUpdateCreateContract, 1),
        (EntryTag::ChannelOffChainUpdateCallContract, 1),
        (EntryTag::ContractsMtree, 1),
        (EntryTag::CallsMtree, 1),
        (EntryTag::ChannelsMtree, 1),
        (EntryTag::NameserviceMtree, 1),
        (EntryTag::OraclesMtree, 1),
        (EntryTag::AccountsMtree, 1),
        (EntryTag::GaMetaTxAuthData, 1),
    ]
    .to_vec();
    assert_eq!(pairs.len(), 25);
    for (tag, version) in pairs {
        assert!(
            tag.versions().contains(&version),
            "{tag:?} v{version} is not declared"
        );
    }
}
