//! The fee and gas model.
//!
//! Every function here takes a [`ConsensusProtocolVersion`] and reads its
//! constants from [`ProtocolParams`]. None of them close over a hardcoded
//! number, so a fork is a new row in `protocol.rs` rather than an edit here.
//!
//! # The fixed point
//!
//! A transaction's minimum fee depends on its serialised size, and its
//! serialised size depends on the fee it carries — a larger fee is a longer
//! integer. The reference implementation resolves this by re-serialising the
//! whole transaction with the fee computed so far and iterating until the fee
//! stops moving. [`calculate_min_fee`] does the same, but takes the
//! re-serialisation as a [`RebuildTx`] callback rather than owning it, because
//! transaction serialisation belongs to a different module.

use crate::error::{Error, Result};
use crate::protocol::{params, AbiVersion, ConsensusProtocolVersion, ProtocolParams};
use crate::tx::schema::{schema_for, SchemaEntry};
use crate::tx::{
    abi_version_byte, build_rlp, nested_tx_bytes, BuildOptions, FieldKind, Overrides, Tag,
    TxParams, Value,
};
use num_bigint::BigUint;

/// What the gas formula needs to know about a serialised transaction.
///
/// Produced by [`RebuildTx::rebuild_with_fee`]; consumed by [`transaction_gas`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TxGasInputs {
    /// Which transaction this is.
    pub tag: Tag,
    /// The serialised length of the transaction, in bytes.
    pub size: usize,
    /// For oracle transactions, the ttl being paid for, in key blocks. One
    /// otherwise; the field is ignored for every other tag.
    pub relative_ttl: u64,
    /// For `GaMetaTx` and `PayingForTx`, the serialised length of the wrapped
    /// transaction. Zero otherwise; the inner transaction pays for its own bytes.
    pub inner_tx_size: usize,
    /// The transaction's `abiVersion`, where it has one.
    ///
    /// A `ContractCallTx` is charged 12× the base gas under the FATE ABI and 30×
    /// under any other — see [`transaction_base_gas`]. `None` means the caller
    /// did not say, and is charged the 30× rate: a fee below the minimum is
    /// rejected by the node as `too_low_fee`, and a fee above it is accepted, so
    /// the unknown case takes the answer that cannot be wrong in the direction
    /// that fails.
    pub abi_version: Option<AbiVersion>,
}

impl TxGasInputs {
    /// The common case: a transaction that is neither an oracle, nor a wrapper,
    /// nor a contract call.
    ///
    /// Leaves `abi_version` unset. For a `ContractCallTx` that is deliberate and
    /// not a gap — see the field's own documentation before "fixing" it to FATE.
    pub const fn new(tag: Tag, size: usize) -> Self {
        Self {
            tag,
            size,
            relative_ttl: 1,
            inner_tx_size: 0,
            abi_version: None,
        }
    }
}

/// Re-serialise a transaction with a candidate fee.
///
/// The seam between the fee model and transaction serialisation. An
/// implementation writes `fee` into the transaction, serialises it, and reports
/// what came out — it must not itself consult the fee model, or the fixed point
/// below will not converge.
pub trait RebuildTx {
    /// Serialise the transaction carrying `fee` aettos and report its shape.
    fn rebuild_with_fee(&mut self, fee: u128) -> Result<TxGasInputs>;
}

/// The per-tag multiplier on the base gas, as a rational.
///
/// `PayingForTx` pays a fifth of the base gas, so this cannot be an integer.
/// Returned as `(numerator, denominator)` and applied before the division so
/// nothing rounds twice.
///
/// `ContractCallTx` is the one tag whose multiplier depends on its ABI. The
/// node's `aec_governance:tx_base_gas/3` carries an ABI-keyed clause for four
/// tags, but three of them — `ContractCreateTx`, `GaAttachTx`, `GaMetaTx` —
/// answer `5×` on every arm, so only this one varies in practice.
const fn base_gas_factor(tag: Tag, abi_version: Option<AbiVersion>) -> (u64, u64) {
    match tag {
        Tag::ChannelForceProgressTx => (30, 1),
        Tag::ChannelOffChainTx => (0, 1),
        Tag::ContractCreateTx => (5, 1),
        Tag::ContractCallTx => match abi_version {
            Some(AbiVersion::Fate) => (12, 1),
            // The node's own fallthrough is `_ -> 30 * TX_BASE_GAS`, and it
            // covers the AEVM ABI, an ABI it does not recognise, and — here —
            // a caller who did not say.
            _ => (30, 1),
        },
        Tag::GaAttachTx => (5, 1),
        Tag::GaMetaTx => (5, 1),
        Tag::PayingForTx => (1, 5),
        _ => (1, 1),
    }
}

/// The base gas a transaction is charged, before its size.
///
/// Takes the whole [`TxGasInputs`] rather than a tag, because a `ContractCallTx`
/// is priced by its ABI as well: `12×` the base gas under FATE, `30×` under the
/// AEVM ABI, under an ABI the node does not recognise, and under
/// [`TxGasInputs::abi_version`] left unset.
pub fn transaction_base_gas(version: ConsensusProtocolVersion, inputs: TxGasInputs) -> u64 {
    let params: ProtocolParams = params(version);
    let (numerator, denominator) = base_gas_factor(inputs.tag, inputs.abi_version);
    params.base_gas * numerator / denominator
}

/// The size- and ttl-dependent part of a transaction's gas.
pub fn transaction_size_gas(version: ConsensusProtocolVersion, inputs: TxGasInputs) -> u64 {
    let params = params(version);
    let size = inputs.size as u64;
    match inputs.tag {
        Tag::OracleRegisterTx | Tag::OracleExtendTx | Tag::OracleQueryTx | Tag::OracleRespondTx => {
            // Oracles pay for the state they keep alive: a flat charge per
            // ttl, prorated over the key blocks in a year.
            let blocks_per_year = (60 * 24 * 365) / params.key_block_interval_minutes;
            let ttl_gas = div_ceil(
                params.oracle_state_gas_per_ttl * inputs.relative_ttl,
                blocks_per_year,
            );
            size * params.gas_per_byte + ttl_gas
        }
        // A wrapper pays only for its own bytes; the wrapped transaction is
        // charged separately.
        Tag::GaMetaTx | Tag::PayingForTx => {
            size.saturating_sub(inputs.inner_tx_size as u64) * params.gas_per_byte
        }
        _ => size * params.gas_per_byte,
    }
}

/// Total gas for a serialised transaction.
pub fn transaction_gas(version: ConsensusProtocolVersion, inputs: TxGasInputs) -> u64 {
    transaction_base_gas(version, inputs) + transaction_size_gas(version, inputs)
}

/// The fee that gas costs at the protocol's minimum gas price, in aettos.
pub fn fee_for_gas(version: ConsensusProtocolVersion, gas: u64) -> u128 {
    u128::from(params(version).min_gas_price) * u128::from(gas)
}

/// The smallest fee a transaction may carry, in aettos.
///
/// Iterates the size/fee fixed point described in the module docs. Converges in
/// a handful of rounds because each round can only lengthen the fee field, and
/// the fee field is bounded; the loop is nonetheless capped so a `RebuildTx`
/// implementation that reports a size unrelated to the fee it was handed
/// returns an error rather than hanging.
pub fn calculate_min_fee<R: RebuildTx + ?Sized>(
    version: ConsensusProtocolVersion,
    rebuild: &mut R,
) -> Result<u128> {
    const MAX_ROUNDS: usize = 64;
    let mut fee: u128 = 0;
    for _ in 0..MAX_ROUNDS {
        let inputs = rebuild.rebuild_with_fee(fee)?;
        let next = fee_for_gas(version, transaction_gas(version, inputs));
        if next == fee {
            return Ok(fee);
        }
        fee = next;
    }
    Err(Error::FieldValue {
        field: "fee",
        reason: format!("no fixed point after {MAX_ROUNDS} rounds"),
    })
}

/// The smallest fee, in aettos, that `params` may carry.
///
/// The join between the fee model and transaction serialisation. Everything
/// [`TxGasInputs`] needs is read off the transaction being priced, so no caller
/// assembles it and none can forget a field — which is the point, because the
/// fields are not equally visible and the invisible ones fail expensively.
///
/// [`calculate_min_fee`] and [`RebuildTx`] are unchanged and stay public. A
/// caller who has to drive the fixed point themselves — one holding a block
/// height for an absolute oracle ttl, say — still can.
///
/// # The ABI comes off the wire, not off the params map
///
/// `abi_version` resolves to the byte [`crate::tx::build_tx`] *will serialise*.
/// A `ContractCallTx` built without an explicit `abiVersion` is not sent without
/// one: the protocol's default goes on the wire, and on Ceres that is FATE, abi
/// `3`, which the node prices at `12×` the base gas. Reading the params map
/// would answer "the caller did not say", take the `30×` arm, and overcharge
/// 2.5× for an ABI this crate itself chose — this function's own defect, in the
/// place it was moved to stop it happening in a binding.
///
/// `None` therefore survives only where the wire carries a number this crate has
/// no name for, which is exactly where the node's own fallthrough is `30×` too.
/// The dear arm is for an ABI nobody can name, not for one we picked.
///
/// # Errors
///
/// - **`gasLimit` absent** on a contract transaction. Its encoded length is part
///   of the size this fixed point converges on, so there is no default that does
///   not price a transaction nobody is going to send. Choose the gas first.
/// - **An oracle ttl given as an absolute block height.** Turning it into the
///   relative ttl the gas formula charges for needs the current height, which is
///   a node lookup this crate deliberately does not do. Convert it yourself and
///   drive [`calculate_min_fee`].
pub fn minimum_transaction_fee(
    version: ConsensusProtocolVersion,
    params: &TxParams,
) -> Result<u128> {
    let entry = schema_for(params.tag(), params.version())?;
    let options = BuildOptions {
        protocol: version,
        fee_model: None,
    };
    let mut rebuild = JoinedTx {
        tag: entry.tag,
        relative_ttl: relative_ttl_of(entry, params)?,
        inner_tx_size: inner_tx_size_of(entry, params, &options)?,
        abi_version: abi_version_of(entry, params, version)?,
        params,
        options,
    };
    calculate_min_fee(version, &mut rebuild)
}

/// The [`RebuildTx`] every binding would otherwise write for itself.
struct JoinedTx<'a> {
    params: &'a TxParams,
    options: BuildOptions<'a>,
    tag: Tag,
    relative_ttl: u64,
    inner_tx_size: usize,
    abi_version: Option<AbiVersion>,
}

impl RebuildTx for JoinedTx<'_> {
    fn rebuild_with_fee(&mut self, fee: u128) -> Result<TxGasInputs> {
        // The candidate goes in as an override rather than into the params, so
        // the caller's transaction is never mutated and `FieldKind::Fee` short
        // circuits before it can ask a fee model for the number we are deriving.
        let bytes = build_rlp(
            self.params,
            &self.options,
            &Overrides {
                fee: Some(BigUint::from(fee)),
                gas_limit: None,
            },
        )?;
        Ok(TxGasInputs {
            tag: self.tag,
            size: bytes.len(),
            relative_ttl: self.relative_ttl,
            inner_tx_size: self.inner_tx_size,
            abi_version: self.abi_version,
        })
    }
}

/// The ABI the transaction will be serialised as, named where this crate has a
/// name for it.
///
/// Resolved through [`crate::tx::codec::abi_version_byte`], so the byte priced
/// here and the byte written to the wire cannot disagree. See this module's
/// [`minimum_transaction_fee`] docs for why that matters more than it looks.
///
/// The `ctVersion` fallback is read from the params map rather than resolved,
/// and that is safe rather than sloppy: the two tags carrying `ctVersion` —
/// `ContractCreateTx` and `GaAttachTx` — answer `5×` on every ABI arm, which
/// `no_other_tag_is_priced_by_its_abi` pins. `ContractCallTx` is the only tag
/// whose multiplier moves with its ABI, and it carries `abiVersion`.
fn abi_version_of(
    entry: &SchemaEntry,
    params: &TxParams,
    version: ConsensusProtocolVersion,
) -> Result<Option<AbiVersion>> {
    let carries_abi_version = entry
        .fields
        .iter()
        .any(|(name, kind)| *name == "abiVersion" && matches!(kind, FieldKind::AbiVersion));
    let byte = if carries_abi_version {
        abi_version_byte("abiVersion", params.get("abiVersion"), entry.tag, version)?
    } else {
        match params.get("ctVersion") {
            Some(Value::CtVersion { abi_version, .. }) => *abi_version,
            _ => return Ok(None),
        }
    };
    Ok(match byte {
        0 => Some(AbiVersion::NoAbi),
        1 => Some(AbiVersion::Sophia),
        3 => Some(AbiVersion::Fate),
        // A number this crate has no name for. The node's own answer for an ABI
        // it does not recognise is the 30x arm, and so is ours.
        _ => None,
    })
}

/// The ttl an oracle transaction is charged for, in key blocks.
///
/// One for every other tag, where the field is ignored. The values come from the
/// schema's own defaults when the caller omitted them, for the same reason the
/// ABI does: the wire will carry them.
fn relative_ttl_of(entry: &SchemaEntry, params: &TxParams) -> Result<u64> {
    let (type_key, value_key) = match entry.tag {
        Tag::OracleRegisterTx | Tag::OracleExtendTx => ("oracleTtlType", "oracleTtlValue"),
        Tag::OracleQueryTx => ("queryTtlType", "queryTtlValue"),
        Tag::OracleRespondTx => ("responseTtlType", "responseTtlValue"),
        _ => return Ok(1),
    };
    // `FieldKind::OracleTtlType` serialises an absent type as 0, delta.
    if params.get(type_key).and_then(Value::as_u64).unwrap_or(0) != 0 {
        return Err(Error::FieldValue {
            field: type_key,
            reason: "an absolute (block) ttl cannot be priced without the current height; \
                     convert it to a delta, or drive calculate_min_fee yourself"
                .into(),
        });
    }
    params
        .get(value_key)
        .and_then(Value::as_u64)
        .or_else(|| schema_default(entry, value_key))
        .ok_or(Error::MissingField(value_key))
}

/// The serialised length of the wrapped transaction, for the two tags that carry
/// one; zero for every other, which pays for all of its own bytes.
fn inner_tx_size_of(
    entry: &SchemaEntry,
    params: &TxParams,
    options: &BuildOptions<'_>,
) -> Result<usize> {
    if !matches!(entry.tag, Tag::GaMetaTx | Tag::PayingForTx) {
        return Ok(0);
    }
    let wrapped = entry
        .fields
        .iter()
        .find_map(|(name, kind)| match kind {
            FieldKind::Transaction(expected) => Some((*name, expected)),
            _ => None,
        })
        .ok_or(Error::MissingField("tx"))?;
    Ok(nested_tx_bytes(wrapped.0, params.get(wrapped.0), wrapped.1, options)?.len())
}

/// The value the schema will serialise for a short-uint field the caller omitted.
///
/// Read out of the schema rather than repeated here, so a changed default moves
/// the fee with it.
fn schema_default(entry: &SchemaEntry, name: &str) -> Option<u64> {
    entry.fields.iter().find_map(|(field, kind)| match kind {
        FieldKind::ShortUIntDefault(default) | FieldKind::UintDefault(default)
            if *field == name =>
        {
            Some(*default)
        }
        _ => None,
    })
}

/// The minimum AENS fee for a name whose label is `label_length` characters.
///
/// `label_length` is the punycode length of the name without its `.chain`
/// suffix. Turning a unicode name into that number is string handling and sits
/// above this crate.
pub fn minimum_name_fee(version: ConsensusProtocolVersion, label_length: usize) -> u128 {
    let params = params(version);
    let index = label_length.clamp(1, params.name_max_length_fee);
    NAME_BID_RANGES[index - 1] * params.name_fee_multiplier
}

/// The smallest bid that raises an AENS auction currently standing at `current_fee`.
pub fn minimum_bid_fee(version: ConsensusProtocolVersion, current_fee: u128) -> u128 {
    let percent = u128::from(params(version).name_bid_increment_percent);
    // Ceiling division: a bid one aetto short of the increment is not a bid.
    div_ceil_u128(current_fee * (100 + percent), 100)
}

/// The height an AENS auction for a name of this label length ends at, if the
/// winning bid is made at `claim_height`.
///
/// Zero extra blocks means the name is not auctioned and the claim is immediate.
pub fn auction_end_height(
    _version: ConsensusProtocolVersion,
    label_length: usize,
    claim_height: u64,
) -> u64 {
    let extra = match label_length {
        0..=4 => 2400,
        5..=8 => 960,
        9..=12 => 480,
        _ => 0,
    };
    claim_height + extra
}

/// Whether a name of this label length goes to auction rather than being claimed outright.
pub fn is_auction_name(_version: ConsensusProtocolVersion, label_length: usize) -> bool {
    label_length < 13
}

/// The per-length AENS bid ranges, indexed by `label_length - 1`.
///
/// A Fibonacci run from 31 characters down to 1; multiplied by
/// [`ConsensusParams::name_fee_multiplier`] to reach aettos.
const NAME_BID_RANGES: [u128; 31] = [
    5_702_887, 3_524_578, 2_178_309, 1_346_269, 832_040, 514_229, 317_811, 196_418, 121_393,
    75_025, 46_368, 28_657, 17_711, 10_946, 6_765, 4_181, 2_584, 1_597, 987, 610, 377, 233, 144,
    89, 55, 34, 21, 13, 8, 5, 3,
];

fn div_ceil(numerator: u64, denominator: u64) -> u64 {
    numerator.div_ceil(denominator)
}

fn div_ceil_u128(numerator: u128, denominator: u128) -> u128 {
    numerator.div_ceil(denominator)
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::encoding::{encode, Encoding};

    const CERES: ConsensusProtocolVersion = ConsensusProtocolVersion::Ceres;

    /// The base gas for a tag whose multiplier does not depend on its ABI.
    fn base_gas(tag: Tag) -> u64 {
        transaction_base_gas(CERES, TxGasInputs::new(tag, 0))
    }

    /// The base gas for a contract call under a given ABI.
    fn call_base_gas(abi_version: Option<AbiVersion>) -> u64 {
        transaction_base_gas(
            CERES,
            TxGasInputs {
                abi_version,
                ..TxGasInputs::new(Tag::ContractCallTx, 0)
            },
        )
    }

    #[test]
    fn base_gas_matches_the_published_per_tag_multipliers() {
        assert_eq!(base_gas(Tag::SpendTx), 15_000);
        assert_eq!(base_gas(Tag::ChannelForceProgressTx), 30 * 15_000);
        assert_eq!(base_gas(Tag::ChannelOffChainTx), 0);
        assert_eq!(base_gas(Tag::ContractCreateTx), 5 * 15_000);
        assert_eq!(base_gas(Tag::GaAttachTx), 5 * 15_000);
        assert_eq!(base_gas(Tag::GaMetaTx), 5 * 15_000);
        // A fifth of the base gas, and it must not round to zero or to 15000.
        assert_eq!(base_gas(Tag::PayingForTx), 3_000);
    }

    /// `aec_governance:tx_base_gas/3`:
    ///
    /// ```erlang
    /// tx_base_gas(contract_call_tx, _Protocol, ABI) ->
    ///     case ABI of
    ///         ?ABI_FATE_SOPHIA_1 -> 12 * ?TX_BASE_GAS;
    ///         ?ABI_AEVM_SOPHIA_1 -> 30 * ?TX_BASE_GAS;
    ///         _                  -> 30 * ?TX_BASE_GAS      %% Max gas
    ///     end;
    /// ```
    #[test]
    fn a_contract_call_is_priced_by_its_abi_and_defaults_to_the_dearer_arm() {
        assert_eq!(call_base_gas(Some(AbiVersion::Fate)), 12 * 15_000);
        assert_eq!(call_base_gas(Some(AbiVersion::Sophia)), 30 * 15_000);
        assert_eq!(call_base_gas(Some(AbiVersion::NoAbi)), 30 * 15_000);
        // A caller who did not say is charged the rate that cannot be rejected.
        assert_eq!(call_base_gas(None), 30 * 15_000);
        // And `new` is that caller: it must not quietly pick FATE.
        assert_eq!(base_gas(Tag::ContractCallTx), 30 * 15_000);
    }

    /// The node keys three more tags on the ABI and answers the same on every
    /// arm, so nothing here may vary with it.
    #[test]
    fn no_other_tag_is_priced_by_its_abi() {
        for tag in [Tag::ContractCreateTx, Tag::GaAttachTx, Tag::GaMetaTx] {
            let flat = base_gas(tag);
            assert_eq!(flat, 5 * 15_000, "{tag}");
            for abi in [AbiVersion::Fate, AbiVersion::Sophia, AbiVersion::NoAbi] {
                let inputs = TxGasInputs {
                    abi_version: Some(abi),
                    ..TxGasInputs::new(tag, 0)
                };
                assert_eq!(transaction_base_gas(CERES, inputs), flat, "{tag} {abi:?}");
            }
        }
    }

    #[test]
    fn oracle_gas_charges_for_the_ttl_it_holds() {
        // The reference example: a 10-byte OracleRespondTx with a ttl of 12.
        let inputs = TxGasInputs {
            relative_ttl: 12,
            ..TxGasInputs::new(Tag::OracleRespondTx, 10)
        };
        let blocks_per_year: u64 = (60 * 24 * 365) / 3;
        let expected = 10 * 20 + (32_000 * 12u64).div_ceil(blocks_per_year);
        assert_eq!(transaction_size_gas(CERES, inputs), expected);
        // The ttl charge rounds up: one key block still costs a whole gas unit.
        let one = TxGasInputs {
            relative_ttl: 1,
            ..inputs
        };
        assert_eq!(transaction_size_gas(CERES, one), 10 * 20 + 1);
    }

    #[test]
    fn a_wrapper_pays_only_for_its_own_bytes() {
        let inputs = TxGasInputs {
            inner_tx_size: 200,
            ..TxGasInputs::new(Tag::PayingForTx, 300)
        };
        assert_eq!(transaction_size_gas(CERES, inputs), 100 * 20);
        // And a plain transaction of the same size pays for all of them.
        let plain = TxGasInputs::new(Tag::SpendTx, 300);
        assert_eq!(transaction_size_gas(CERES, plain), 300 * 20);
    }

    #[test]
    fn a_spend_transaction_costs_its_base_gas_plus_its_bytes() {
        let inputs = TxGasInputs::new(Tag::SpendTx, 100);
        assert_eq!(transaction_gas(CERES, inputs), 15_000 + 2_000);
        assert_eq!(
            fee_for_gas(CERES, transaction_gas(CERES, inputs)),
            17_000 * 1_000_000_000
        );
    }

    /// A rebuilder whose serialised size grows with the length of the fee it is
    /// handed — which is exactly why the fixed point exists.
    struct GrowingTx {
        tag: Tag,
        base_size: usize,
        rounds: usize,
    }

    impl RebuildTx for GrowingTx {
        fn rebuild_with_fee(&mut self, fee: u128) -> Result<TxGasInputs> {
            self.rounds += 1;
            let fee_bytes = crate::bytes::u128_to_bytes(fee).len();
            Ok(TxGasInputs::new(self.tag, self.base_size + fee_bytes))
        }
    }

    #[test]
    fn the_minimum_fee_reaches_a_fixed_point() {
        let mut tx = GrowingTx {
            tag: Tag::SpendTx,
            base_size: 100,
            rounds: 0,
        };
        let fee = calculate_min_fee(CERES, &mut tx).unwrap();

        // The fee is stable: feeding it back in reproduces itself.
        let inputs = tx.rebuild_with_fee(fee).unwrap();
        assert_eq!(fee_for_gas(CERES, transaction_gas(CERES, inputs)), fee);
        // A fee near 1.7e13 aettos needs 6 bytes, so the size settles at 106.
        assert_eq!(inputs.size, 106);
        assert_eq!(fee, (15_000 + 106 * 20) as u128 * 1_000_000_000);
        // It converges in a few rounds, not dozens.
        assert!(tx.rounds <= 5, "took {} rounds", tx.rounds);
    }

    /// A rebuilder that reports a size unrelated to the fee, so the loop cannot settle.
    struct Oscillating(u64);

    impl RebuildTx for Oscillating {
        fn rebuild_with_fee(&mut self, _fee: u128) -> Result<TxGasInputs> {
            self.0 += 1;
            Ok(TxGasInputs::new(Tag::SpendTx, 100 + self.0 as usize))
        }
    }

    #[test]
    fn a_non_converging_rebuilder_errors_rather_than_hangs() {
        assert!(calculate_min_fee(CERES, &mut Oscillating(0)).is_err());
    }

    // -----------------------------------------------------------------------
    // The join: `minimum_transaction_fee`
    //
    // The chain corpus cannot reach any of the cases below. Every mined
    // transaction carries `abiVersion` explicitly, so the wire and the params
    // map agree on all 161 of them and the defaulted case — the ordinary one for
    // anyone building a contract call — never appears. These are constructed for
    // that reason, and they assert the node's numbers rather than the crate's.
    // -----------------------------------------------------------------------

    fn account(byte: u8) -> String {
        encode(&[byte; 32], Encoding::AccountAddress).unwrap()
    }

    fn contract_call(abi_version: Option<u64>) -> TxParams {
        let mut params = TxParams::new(Tag::ContractCallTx)
            .with("callerId", account(1).as_str())
            .with(
                "contractId",
                encode(&[2; 32], Encoding::ContractAddress)
                    .unwrap()
                    .as_str(),
            )
            .with("nonce", 1u64)
            .with("amount", 0u64)
            .with("gasLimit", 100_000u64)
            .with(
                "callData",
                encode(&[7; 16], Encoding::ContractBytearray)
                    .unwrap()
                    .as_str(),
            );
        if let Some(abi_version) = abi_version {
            params.set("abiVersion", abi_version);
        }
        params
    }

    fn spend() -> TxParams {
        TxParams::new(Tag::SpendTx)
            .with("senderId", account(1).as_str())
            .with("recipientId", account(2).as_str())
            .with("amount", 1_000u64)
            .with("nonce", 1u64)
    }

    /// The transaction as it will actually go on the wire, carrying `fee`.
    fn wire(params: &TxParams, fee: u128) -> TxParams {
        let mut params = params.clone();
        params.set("fee", Value::uint_str(&fee.to_string()).unwrap());
        let bytes = crate::tx::build_tx_rlp(&params, &BuildOptions::default()).unwrap();
        crate::tx::unpack_tx_rlp(&bytes).unwrap()
    }

    fn wire_size(params: &TxParams, fee: u128) -> usize {
        let mut params = params.clone();
        params.set("fee", Value::uint_str(&fee.to_string()).unwrap());
        crate::tx::build_tx_rlp(&params, &BuildOptions::default())
            .unwrap()
            .len()
    }

    /// What a transaction of `size` bytes costs at `multiplier ×` the base gas.
    fn priced_at(multiplier: u64, size: usize) -> u128 {
        u128::from(multiplier * 15_000 + size as u64 * 20) * 1_000_000_000
    }

    /// The case the corpus cannot show and a binding meets on its first contract
    /// call: no `abiVersion` given, so `codec` writes the protocol's default and
    /// the transaction goes out as a FATE call. Pricing it from the params map
    /// would answer "nobody said" and charge the `30×` arm — 2.5× the base gas,
    /// for an ABI this crate itself chose.
    #[test]
    fn a_contract_call_that_defaults_its_abi_is_priced_as_the_fate_call_it_is_serialised_as() {
        let params = contract_call(None);
        let fee = minimum_transaction_fee(CERES, &params).unwrap();
        let size = wire_size(&params, fee);

        // The pair is the assertion. Either half alone passes against a bug.
        assert_eq!(
            wire(&params, fee).get("abiVersion").and_then(Value::as_u64),
            Some(3),
            "the wire carries FATE"
        );
        assert_eq!(fee, priced_at(12, size), "and the fee is the FATE fee");

        // What reading the params map would have charged for those same bytes.
        assert!(priced_at(30, size) > fee);
    }

    #[test]
    fn a_contract_call_at_the_aevm_abi_is_priced_at_the_dearer_arm() {
        let params = contract_call(Some(1));
        let fee = minimum_transaction_fee(CERES, &params).unwrap();
        let size = wire_size(&params, fee);

        assert_eq!(
            wire(&params, fee).get("abiVersion").and_then(Value::as_u64),
            Some(1)
        );
        assert_eq!(fee, priced_at(30, size));
    }

    /// An ABI the crate has no name for is charged the way the node charges one
    /// it does not recognise: the `_ -> 30 * TX_BASE_GAS` arm. This is the only
    /// case in which the join answers `None` — never "the params map was silent".
    #[test]
    fn a_contract_call_at_an_abi_this_crate_cannot_name_is_priced_at_the_dearer_arm() {
        let params = contract_call(Some(99));
        let fee = minimum_transaction_fee(CERES, &params).unwrap();
        let size = wire_size(&params, fee);

        assert_eq!(
            wire(&params, fee).get("abiVersion").and_then(Value::as_u64),
            Some(99),
            "the unrecognised value reaches the wire unchanged"
        );
        assert_eq!(fee, priced_at(30, size));
    }

    /// The join is the bridge every binding would have written, so it must agree
    /// with one written correctly by hand.
    #[test]
    fn the_join_agrees_with_a_hand_driven_rebuild() {
        struct ByHand<'a>(&'a TxParams);
        impl RebuildTx for ByHand<'_> {
            fn rebuild_with_fee(&mut self, fee: u128) -> Result<TxGasInputs> {
                let mut params = self.0.clone();
                params.set("fee", Value::uint_str(&fee.to_string())?);
                let bytes = crate::tx::build_tx_rlp(&params, &BuildOptions::default())?;
                Ok(TxGasInputs {
                    abi_version: Some(AbiVersion::Fate),
                    ..TxGasInputs::new(params.tag(), bytes.len())
                })
            }
        }

        for params in [spend(), contract_call(Some(3))] {
            let joined = minimum_transaction_fee(CERES, &params).unwrap();
            let by_hand = calculate_min_fee(CERES, &mut ByHand(&params)).unwrap();
            assert_eq!(joined, by_hand, "{:?}", params.tag());
        }
    }

    #[test]
    fn a_contract_call_without_a_gas_limit_names_the_model_that_owns_it() {
        let mut params = contract_call(Some(3));
        assert!(minimum_transaction_fee(CERES, &params).is_ok());

        // The gas limit's own encoded length is part of the size the fixed point
        // converges on, so there is no default that prices a real transaction.
        params = TxParams::new(Tag::ContractCallTx);
        for (key, value) in contract_call(Some(3)).fields() {
            if key != "gasLimit" {
                params.set(key.as_str(), value.clone());
            }
        }
        assert!(matches!(
            minimum_transaction_fee(CERES, &params),
            Err(Error::ModelRequired {
                field: "gasLimit",
                ..
            })
        ));
    }

    /// A `block` ttl is absolute, and the gas formula charges for the relative
    /// one. Recovering it needs the current height, which is a node lookup this
    /// crate does not do — so it is refused rather than guessed at, and the seam
    /// stays open for a caller who holds the height.
    #[test]
    fn an_absolute_oracle_ttl_is_refused_rather_than_guessed_at() {
        let register = |ttl_type: u64| {
            TxParams::new(Tag::OracleRegisterTx)
                .with("accountId", account(1).as_str())
                .with("nonce", 1u64)
                .with("queryFormat", "string")
                .with("responseFormat", "string")
                .with("queryFee", 0u64)
                .with("oracleTtlType", ttl_type)
                .with("oracleTtlValue", 1_000_000u64)
        };
        assert!(minimum_transaction_fee(CERES, &register(0)).is_ok());
        assert!(matches!(
            minimum_transaction_fee(CERES, &register(1)),
            Err(Error::FieldValue {
                field: "oracleTtlType",
                ..
            })
        ));
    }

    /// An omitted oracle ttl is not absent from the wire either — the schema's
    /// own default is serialised, and the gas has to be charged against that.
    #[test]
    fn an_omitted_oracle_ttl_is_priced_at_the_schemas_own_default() {
        let base = TxParams::new(Tag::OracleRegisterTx)
            .with("accountId", account(1).as_str())
            .with("nonce", 1u64)
            .with("queryFormat", "string")
            .with("responseFormat", "string")
            .with("queryFee", 0u64);
        let omitted = minimum_transaction_fee(CERES, &base).unwrap();
        // `("oracleTtlValue", FieldKind::ShortUIntDefault(500))`, read from the
        // schema rather than repeated in the fee model.
        let explicit =
            minimum_transaction_fee(CERES, &base.clone().with("oracleTtlValue", 500u64)).unwrap();
        assert_eq!(omitted, explicit);

        // And the ttl genuinely reaches the gas formula.
        let longer =
            minimum_transaction_fee(CERES, &base.with("oracleTtlValue", 50_000u64)).unwrap();
        assert!(longer > omitted);
    }

    /// A wrapper pays for its own bytes only, so the join has to measure the
    /// wrapped transaction the same way `codec` serialises it.
    #[test]
    fn a_wrapper_is_not_charged_for_the_bytes_it_wraps() {
        let inner = crate::tx::build_tx(&spend().with("fee", 16_660_000_000_000u64)).unwrap();
        let signed = TxParams::new(Tag::SignedTx)
            .with("signatures", Value::List(vec![Value::Bytes(vec![0; 64])]))
            .with("encodedTx", Value::Encoded(inner));
        let paying_for = TxParams::new(Tag::PayingForTx)
            .with("payerId", account(3).as_str())
            .with("nonce", 1u64)
            .with("tx", Value::Tx(Box::new(signed)));

        let fee = minimum_transaction_fee(CERES, &paying_for).unwrap();
        let size = wire_size(&paying_for, fee);
        let inner_size = match wire(&paying_for, fee).get("tx") {
            Some(Value::Tx(wrapped)) => crate::tx::build_tx_rlp(wrapped, &BuildOptions::default())
                .unwrap()
                .len(),
            _ => panic!("a PayingForTx carries a nested transaction"),
        };

        // A fifth of the base gas — 3000, not 15000 — and the wrapped bytes
        // charged to the inner transaction rather than to this one.
        assert!(inner_size > 0);
        assert_eq!(
            fee,
            u128::from(3_000 + (size - inner_size) as u64 * 20) * 1_000_000_000
        );
        // Charging the wrapper for them too would be this, and it is not the answer.
        assert!(u128::from(3_000 + size as u64 * 20) * 1_000_000_000 > fee);
    }

    #[test]
    fn name_fees_follow_the_published_length_table() {
        // 1e14 aettos per unit of the bid range.
        assert_eq!(minimum_name_fee(CERES, 1), 5_702_887 * 100_000_000_000_000);
        assert_eq!(minimum_name_fee(CERES, 13), 17_711 * 100_000_000_000_000);
        assert_eq!(minimum_name_fee(CERES, 31), 3 * 100_000_000_000_000);
        // Longer than 31 characters is charged the same as 31.
        assert_eq!(minimum_name_fee(CERES, 100), minimum_name_fee(CERES, 31));
    }

    #[test]
    fn a_bid_must_clear_five_percent_and_rounds_up() {
        assert_eq!(minimum_bid_fee(CERES, 1_000), 1_050);
        // 1 aetto * 1.05 rounds up to 2, never down to 1.
        assert_eq!(minimum_bid_fee(CERES, 1), 2);
        assert!(minimum_bid_fee(CERES, 999) > 999);
    }

    #[test]
    fn short_names_go_to_auction_and_long_ones_do_not() {
        assert!(is_auction_name(CERES, 12));
        assert!(!is_auction_name(CERES, 13));
        assert_eq!(auction_end_height(CERES, 4, 1_000), 3_400);
        assert_eq!(auction_end_height(CERES, 8, 1_000), 1_960);
        assert_eq!(auction_end_height(CERES, 12, 1_000), 1_480);
        assert_eq!(auction_end_height(CERES, 13, 1_000), 1_000);
    }
}
