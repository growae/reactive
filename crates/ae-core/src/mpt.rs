//! The Merkle-Patricia state tree, and proofs of inclusion over it.
//!
//! A node returns a *partial* tree: the root hash plus exactly the nodes on the
//! path to the values being proved. That is what a proof of inclusion is — the
//! proof and the tree share one representation, and verifying a proof is
//! rehashing every node it carries and checking each one is filed under its own
//! hash.
//!
//! [`MerklePatriciaTree::from_rlp`] does that rehashing on the way in, so a
//! tree that exists has already been checked. A tree missing nodes below its
//! root is not an error — that is the normal shape of a proof — but it is
//! reported by [`MerklePatriciaTree::is_complete`], and a lookup that walks off
//! the proved path returns `None` rather than claiming absence.

use std::collections::BTreeMap;

use crate::error::{Error, Result};
use crate::substrate::hash::blake2b_256;
use crate::substrate::rlp::Item;

/// What a two- or seventeen-item node turned out to be.
#[derive(Debug, Clone, PartialEq, Eq)]
enum Node<'a> {
    /// Sixteen child hashes plus an optional value at this exact key.
    Branch { value: Option<&'a [u8]> },
    /// A shared path prefix and the hash of the node it leads to.
    Extension { path: Vec<u8>, next: &'a [u8] },
    /// The remainder of a key and its value.
    Leaf { path: Vec<u8>, value: &'a [u8] },
}

/// A Merkle-Patricia tree, whole or partial.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MerklePatriciaTree {
    root_hash: [u8; 32],
    nodes: BTreeMap<[u8; 32], Vec<Vec<u8>>>,
    complete: bool,
}

impl MerklePatriciaTree {
    /// Read the wire form: `[root_hash, [[node_hash, [node_item, …]], …]]`.
    ///
    /// Every node is rehashed and checked against the hash it is filed under, so
    /// a tampered proof is rejected here rather than silently answering lookups.
    pub fn from_rlp(item: &Item) -> Result<Self> {
        let parts = item.as_list()?;
        let [root, nodes] = parts else {
            return Err(Error::MerkleNodeArity(parts.len()));
        };
        let root_hash: [u8; 32] =
            root.as_bytes()?
                .try_into()
                .map_err(|_| Error::PayloadLength {
                    expected: 32,
                    got: root.as_bytes().map(<[u8]>::len).unwrap_or(0),
                })?;

        let mut map: BTreeMap<[u8; 32], Vec<Vec<u8>>> = BTreeMap::new();
        for node in nodes.as_list()? {
            let pair = node.as_list()?;
            let [hash, items] = pair else {
                return Err(Error::MerkleNodeArity(pair.len()));
            };
            let hash: [u8; 32] = hash
                .as_bytes()?
                .try_into()
                .map_err(|_| Error::MerkleHashMismatch)?;
            let items = items.as_list()?;
            // A node's hash covers its rlp encoding, so re-encoding is how the
            // proof is checked.
            if blake2b_256(&Item::List(items.to_vec()).encode()) != hash {
                return Err(Error::MerkleHashMismatch);
            }
            let items = items
                .iter()
                .map(|i| i.as_bytes().map(<[u8]>::to_vec))
                .collect::<Result<Vec<_>>>()?;
            map.insert(hash, items);
        }

        let mut tree = Self {
            root_hash,
            nodes: map,
            complete: true,
        };

        if !tree.nodes.contains_key(&tree.root_hash) {
            // An empty subtree carries a root hash and nothing else. Anything
            // else missing its root is a proof we cannot walk at all.
            if !tree.nodes.is_empty() {
                return Err(Error::MerkleNodeMissing("root"));
            }
            tree.complete = false;
            return Ok(tree);
        }

        for items in tree.nodes.values() {
            match parse_node(items)? {
                Node::Branch { .. } => {
                    for child in items.iter().take(16).filter(|c| !c.is_empty()) {
                        if to_hash(child).is_none_or(|h| !tree.nodes.contains_key(&h)) {
                            tree.complete = false;
                        }
                    }
                }
                Node::Extension { next, .. } => {
                    // An extension's target is not optional: without it the
                    // extension proves nothing at all.
                    if to_hash(next).is_none_or(|h| !tree.nodes.contains_key(&h)) {
                        return Err(Error::MerkleNodeMissing("extension target"));
                    }
                }
                Node::Leaf { .. } => {}
            }
        }
        Ok(tree)
    }

    /// The wire form.
    pub fn to_rlp(&self) -> Item {
        Item::List(vec![
            Item::Bytes(self.root_hash.to_vec()),
            Item::List(
                self.nodes
                    .iter()
                    .map(|(hash, items)| {
                        Item::List(vec![
                            Item::Bytes(hash.to_vec()),
                            Item::List(items.iter().map(|i| Item::Bytes(i.clone())).collect()),
                        ])
                    })
                    .collect(),
            ),
        ])
    }

    /// The tree's root hash. Two trees prove statements about the same state
    /// exactly when these match.
    pub const fn root_hash(&self) -> &[u8; 32] {
        &self.root_hash
    }

    /// Whether every node the tree references is present.
    ///
    /// False for a proof of inclusion, which carries only the path to the values
    /// it proves. That is not an error.
    pub const fn is_complete(&self) -> bool {
        self.complete
    }

    /// How many nodes the proof carries.
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    /// Look a key up.
    ///
    /// `None` means either "not in this tree" or "not on the part of the tree
    /// this proof carries" — check [`Self::is_complete`] to tell those apart.
    pub fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>> {
        let mut path = nibbles(key);
        let mut cursor = self.root_hash;
        loop {
            let Some(items) = self.nodes.get(&cursor) else {
                if self.complete {
                    return Err(Error::MerkleNodeMissing("complete tree lost a node"));
                }
                return Ok(None);
            };
            match parse_node(items)? {
                Node::Branch { value } => {
                    if path.is_empty() {
                        return Ok(value.map(<[u8]>::to_vec));
                    }
                    let child = &items[usize::from(path[0])];
                    if child.is_empty() {
                        return Ok(None);
                    }
                    let Some(hash) = to_hash(child) else {
                        return Ok(None);
                    };
                    cursor = hash;
                    path.remove(0);
                }
                Node::Extension { path: prefix, next } => {
                    if !path.starts_with(&prefix) {
                        return Ok(None);
                    }
                    let Some(hash) = to_hash(next) else {
                        return Ok(None);
                    };
                    cursor = hash;
                    path.drain(..prefix.len());
                }
                Node::Leaf { path: rest, value } => {
                    return Ok((rest == path).then(|| value.to_vec()));
                }
            }
        }
    }

    /// Every key/value pair the tree carries, in key order.
    ///
    /// On a partial tree this is every pair the proof proves, not the whole
    /// state — the missing branches are simply not walked.
    pub fn entries(&self) -> Result<Vec<(Vec<u8>, Vec<u8>)>> {
        let mut out = Vec::new();
        self.walk(self.root_hash, Vec::new(), &mut out)?;
        out.sort();
        Ok(out)
    }

    fn walk(
        &self,
        cursor: [u8; 32],
        prefix: Vec<u8>,
        out: &mut Vec<(Vec<u8>, Vec<u8>)>,
    ) -> Result<()> {
        let Some(items) = self.nodes.get(&cursor) else {
            if self.complete {
                return Err(Error::MerkleNodeMissing("complete tree lost a node"));
            }
            return Ok(());
        };
        match parse_node(items)? {
            Node::Branch { value } => {
                for (index, child) in items.iter().take(16).enumerate() {
                    if child.is_empty() {
                        continue;
                    }
                    if let Some(hash) = to_hash(child) {
                        let mut next = prefix.clone();
                        next.push(index as u8);
                        self.walk(hash, next, out)?;
                    }
                }
                if let Some(value) = value {
                    push_entry(&prefix, value, out);
                }
            }
            Node::Extension { path, next } => {
                if let Some(hash) = to_hash(next) {
                    let mut child_prefix = prefix.clone();
                    child_prefix.extend_from_slice(&path);
                    self.walk(hash, child_prefix, out)?;
                }
            }
            Node::Leaf { path, value } => {
                let mut key = prefix.clone();
                key.extend_from_slice(&path);
                push_entry(&key, value, out);
            }
        }
        Ok(())
    }
}

/// A key that ends on an odd nibble cannot be a byte string, so it is not one of
/// ours — the contract store keeps such keys in the same tree.
fn push_entry(nibbles: &[u8], value: &[u8], out: &mut Vec<(Vec<u8>, Vec<u8>)>) {
    if let Some(key) = unnibbles(nibbles) {
        out.push((key, value.to_vec()));
    }
}

fn parse_node(items: &[Vec<u8>]) -> Result<Node<'_>> {
    match items.len() {
        17 => Ok(Node::Branch {
            value: (!items[16].is_empty()).then_some(items[16].as_slice()),
        }),
        2 => {
            let header = *items[0].first().ok_or(Error::MerkleNodeArity(2))?;
            let flag = header >> 4;
            if flag > 3 {
                return Err(Error::MerklePathNibble(flag));
            }
            // Even-length paths (flags 0 and 2) waste the header's low nibble;
            // odd-length paths (1 and 3) carry their first nibble in it.
            let skip = usize::from(flag % 2 == 0) + 1;
            let path = nibbles(&items[0])[skip..].to_vec();
            if flag <= 1 {
                Ok(Node::Extension {
                    path,
                    next: items[1].as_slice(),
                })
            } else {
                Ok(Node::Leaf {
                    path,
                    value: items[1].as_slice(),
                })
            }
        }
        other => Err(Error::MerkleNodeArity(other)),
    }
}

fn to_hash(bytes: &[u8]) -> Option<[u8; 32]> {
    bytes.try_into().ok()
}

/// Split bytes into 4-bit nibbles, high nibble first.
fn nibbles(bytes: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(byte >> 4);
        out.push(byte & 0x0f);
    }
    out
}

/// Rejoin nibbles into bytes, or `None` if there is an odd one out.
fn unnibbles(nibbles: &[u8]) -> Option<Vec<u8>> {
    if nibbles.len() % 2 != 0 {
        return None;
    }
    Some(
        nibbles
            .chunks_exact(2)
            .map(|pair| (pair[0] << 4) | pair[1])
            .collect(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a node's wire pair, filed under its own hash.
    fn node(items: Vec<Vec<u8>>) -> ([u8; 32], Item) {
        let list = Item::List(items.iter().map(|i| Item::Bytes(i.clone())).collect());
        let hash = blake2b_256(&list.encode());
        (hash, Item::List(vec![Item::Bytes(hash.to_vec()), list]))
    }

    /// A leaf whose path is the whole key: header nibble 2 (leaf, even) or 3 (odd).
    fn leaf(key: &[u8], value: &[u8]) -> ([u8; 32], Item) {
        let mut path = vec![0x20];
        path.extend_from_slice(key);
        node(vec![path, value.to_vec()])
    }

    fn tree(root: [u8; 32], nodes: Vec<Item>) -> MerklePatriciaTree {
        MerklePatriciaTree::from_rlp(&Item::List(vec![
            Item::Bytes(root.to_vec()),
            Item::List(nodes),
        ]))
        .unwrap()
    }

    #[test]
    fn a_single_leaf_tree_answers_its_own_key_and_nothing_else() {
        let (hash, item) = leaf(&[0xab, 0xcd], b"value");
        let tree = tree(hash, vec![item]);
        assert!(tree.is_complete());
        assert_eq!(tree.get(&[0xab, 0xcd]).unwrap(), Some(b"value".to_vec()));
        assert_eq!(tree.get(&[0xab, 0xce]).unwrap(), None);
        assert_eq!(
            tree.entries().unwrap(),
            vec![(vec![0xab, 0xcd], b"value".to_vec())]
        );
    }

    /// A leaf whose path is three nibbles, spelled with the odd-length header.
    ///
    /// Sitting one nibble below a branch, that makes a whole four-nibble — two
    /// byte — key.
    fn odd_leaf(value: &[u8]) -> ([u8; 32], Item) {
        node(vec![vec![0x3a, 0xbc], value.to_vec()])
    }

    #[test]
    fn a_branch_routes_by_the_first_nibble() {
        let (a_hash, a) = odd_leaf(b"a");
        let (b_hash, b) = odd_leaf(b"b");
        let mut branch_items = vec![Vec::new(); 17];
        branch_items[1] = a_hash.to_vec();
        branch_items[2] = b_hash.to_vec();
        let (root, branch) = node(branch_items);

        let tree = tree(root, vec![branch, a, b]);
        assert!(tree.is_complete());
        // Nibbles 1 | a,b,c and 2 | a,b,c.
        assert_eq!(tree.get(&[0x1a, 0xbc]).unwrap(), Some(b"a".to_vec()));
        assert_eq!(tree.get(&[0x2a, 0xbc]).unwrap(), Some(b"b".to_vec()));
        // An empty branch slot is a proved absence.
        assert_eq!(tree.get(&[0x3a, 0xbc]).unwrap(), None);
        // The right slot, the wrong tail.
        assert_eq!(tree.get(&[0x1a, 0xbd]).unwrap(), None);
        assert_eq!(
            tree.entries().unwrap(),
            vec![
                (vec![0x1a, 0xbc], b"a".to_vec()),
                (vec![0x2a, 0xbc], b"b".to_vec()),
            ]
        );
    }

    #[test]
    fn an_extension_shares_a_prefix_between_two_leaves() {
        // Both keys start with the nibbles a,a and diverge at the third.
        let (leaf_a_hash, leaf_a) = odd_leaf(b"a");
        let (leaf_b_hash, leaf_b) = odd_leaf(b"b");
        let mut branch_items = vec![Vec::new(); 17];
        branch_items[0x1] = leaf_a_hash.to_vec();
        branch_items[0x2] = leaf_b_hash.to_vec();
        let (branch_hash, branch) = node(branch_items);
        // Extension over nibbles a,a — even length, so header nibble 0.
        let (root, extension) = node(vec![vec![0x00, 0xaa], branch_hash.to_vec()]);

        let tree = tree(root, vec![extension, branch, leaf_a, leaf_b]);
        assert!(tree.is_complete());
        assert_eq!(tree.node_count(), 4);
        // a,a | 1 | a,b,c and a,a | 2 | a,b,c.
        assert_eq!(tree.get(&[0xaa, 0x1a, 0xbc]).unwrap(), Some(b"a".to_vec()));
        assert_eq!(tree.get(&[0xaa, 0x2a, 0xbc]).unwrap(), Some(b"b".to_vec()));
        // A key that does not share the extension's prefix stops there.
        assert_eq!(tree.get(&[0xab, 0x1a, 0xbc]).unwrap(), None);
        assert_eq!(tree.entries().unwrap().len(), 2);
    }

    #[test]
    fn an_odd_length_leaf_path_carries_its_first_nibble_in_the_header() {
        // Header 0x3f = leaf, odd, first path nibble f. Full key nibbles: f,a,b.
        let (leaf_hash, leaf_item) = node(vec![vec![0x3f, 0xab], b"odd".to_vec()]);
        let mut branch_items = vec![Vec::new(); 17];
        branch_items[0x1] = leaf_hash.to_vec();
        let (root, branch) = node(branch_items);
        let tree = tree(root, vec![branch, leaf_item]);
        // Key nibbles 1,f,a,b → bytes 0x1f 0xab.
        assert_eq!(tree.get(&[0x1f, 0xab]).unwrap(), Some(b"odd".to_vec()));
        assert_eq!(
            tree.entries().unwrap(),
            vec![(vec![0x1f, 0xab], b"odd".to_vec())]
        );
    }

    #[test]
    fn a_tampered_node_is_rejected_rather_than_answered() {
        let (hash, item) = leaf(&[0xab, 0xcd], b"value");
        // File a different node's items under the honest node's hash.
        let forged = Item::List(vec![
            Item::Bytes(hash.to_vec()),
            Item::List(vec![
                Item::Bytes(vec![0x20, 0xab, 0xcd]),
                Item::Bytes(b"tampered".to_vec()),
            ]),
        ]);
        let result = MerklePatriciaTree::from_rlp(&Item::List(vec![
            Item::Bytes(hash.to_vec()),
            Item::List(vec![forged]),
        ]));
        assert_eq!(result.unwrap_err(), Error::MerkleHashMismatch);
        // The honest one still verifies.
        assert!(MerklePatriciaTree::from_rlp(&Item::List(vec![
            Item::Bytes(hash.to_vec()),
            Item::List(vec![item]),
        ]))
        .is_ok());
    }

    #[test]
    fn a_proof_missing_a_branch_is_partial_not_broken() {
        let (present_hash, present) = odd_leaf(b"here");
        let mut branch_items = vec![Vec::new(); 17];
        branch_items[1] = present_hash.to_vec();
        branch_items[2] = [0x99u8; 32].to_vec(); // referenced, not supplied
        let (root, branch) = node(branch_items);

        let tree = tree(root, vec![branch, present]);
        assert!(!tree.is_complete());
        assert_eq!(tree.get(&[0x1a, 0xbc]).unwrap(), Some(b"here".to_vec()));
        // Walking into the missing branch says "unknown", not "absent by proof" —
        // the two are told apart by `is_complete`, not by the return value.
        assert_eq!(tree.get(&[0x2a, 0xbc]).unwrap(), None);
        assert_eq!(
            tree.entries().unwrap(),
            vec![(vec![0x1a, 0xbc], b"here".to_vec())]
        );
    }

    #[test]
    fn an_empty_subtree_carries_only_its_root_hash() {
        let tree = tree([0x11u8; 32], Vec::new());
        assert!(!tree.is_complete());
        assert_eq!(tree.node_count(), 0);
        assert_eq!(tree.entries().unwrap(), Vec::new());
        assert_eq!(tree.get(&[0x00]).unwrap(), None);
    }

    #[test]
    fn a_root_hash_with_unrelated_nodes_is_an_unwalkable_proof() {
        let (_, orphan) = leaf(&[0x01], b"orphan");
        let result = MerklePatriciaTree::from_rlp(&Item::List(vec![
            Item::Bytes(vec![0x42; 32]),
            Item::List(vec![orphan]),
        ]));
        assert_eq!(result.unwrap_err(), Error::MerkleNodeMissing("root"));
    }

    #[test]
    fn an_extension_pointing_nowhere_is_rejected() {
        let (root, extension) = node(vec![vec![0x00, 0xaa], vec![0x77; 32]]);
        let result = MerklePatriciaTree::from_rlp(&Item::List(vec![
            Item::Bytes(root.to_vec()),
            Item::List(vec![extension]),
        ]));
        assert_eq!(
            result.unwrap_err(),
            Error::MerkleNodeMissing("extension target")
        );
    }

    #[test]
    fn rejects_a_path_header_nibble_above_three() {
        let (root, bad) = node(vec![vec![0x40, 0xab], b"v".to_vec()]);
        let result = MerklePatriciaTree::from_rlp(&Item::List(vec![
            Item::Bytes(root.to_vec()),
            Item::List(vec![bad]),
        ]));
        assert_eq!(result.unwrap_err(), Error::MerklePathNibble(4));
    }

    #[test]
    fn the_wire_form_round_trips() {
        let (hash, item) = leaf(&[0xab, 0xcd], b"value");
        let original = tree(hash, vec![item]);
        let reparsed = MerklePatriciaTree::from_rlp(&original.to_rlp()).unwrap();
        assert_eq!(reparsed, original);
        assert_eq!(reparsed.to_rlp().encode(), original.to_rlp().encode());
    }
}
