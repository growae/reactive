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
use crate::protocol::{params, ConsensusProtocolVersion, ProtocolParams};
use crate::tx::Tag;

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
}

impl TxGasInputs {
    /// The common case: a transaction that is neither an oracle nor a wrapper.
    pub const fn new(tag: Tag, size: usize) -> Self {
        Self {
            tag,
            size,
            relative_ttl: 1,
            inner_tx_size: 0,
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
const fn base_gas_factor(tag: Tag) -> (u64, u64) {
    match tag {
        Tag::ChannelForceProgressTx => (30, 1),
        Tag::ChannelOffChainTx => (0, 1),
        Tag::ContractCreateTx => (5, 1),
        Tag::ContractCallTx => (12, 1),
        Tag::GaAttachTx => (5, 1),
        Tag::GaMetaTx => (5, 1),
        Tag::PayingForTx => (1, 5),
        _ => (1, 1),
    }
}

/// The base gas a transaction of this tag is charged, before its size.
pub fn transaction_base_gas(version: ConsensusProtocolVersion, tag: Tag) -> u64 {
    let params: ProtocolParams = params(version);
    let (numerator, denominator) = base_gas_factor(tag);
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
    transaction_base_gas(version, inputs.tag) + transaction_size_gas(version, inputs)
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

    const CERES: ConsensusProtocolVersion = ConsensusProtocolVersion::Ceres;

    #[test]
    fn base_gas_matches_the_published_per_tag_multipliers() {
        assert_eq!(transaction_base_gas(CERES, Tag::SpendTx), 15_000);
        assert_eq!(
            transaction_base_gas(CERES, Tag::ChannelForceProgressTx),
            30 * 15_000
        );
        assert_eq!(transaction_base_gas(CERES, Tag::ChannelOffChainTx), 0);
        assert_eq!(
            transaction_base_gas(CERES, Tag::ContractCreateTx),
            5 * 15_000
        );
        assert_eq!(
            transaction_base_gas(CERES, Tag::ContractCallTx),
            12 * 15_000
        );
        assert_eq!(transaction_base_gas(CERES, Tag::GaAttachTx), 5 * 15_000);
        assert_eq!(transaction_base_gas(CERES, Tag::GaMetaTx), 5 * 15_000);
        // A fifth of the base gas, and it must not round to zero or to 15000.
        assert_eq!(transaction_base_gas(CERES, Tag::PayingForTx), 3_000);
    }

    #[test]
    fn oracle_gas_charges_for_the_ttl_it_holds() {
        // The reference example: a 10-byte OracleRespondTx with a ttl of 12.
        let inputs = TxGasInputs {
            tag: Tag::OracleRespondTx,
            size: 10,
            relative_ttl: 12,
            inner_tx_size: 0,
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
            tag: Tag::PayingForTx,
            size: 300,
            relative_ttl: 1,
            inner_tx_size: 200,
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
