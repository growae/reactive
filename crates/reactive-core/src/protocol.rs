//! Protocol-version-keyed constants.
//!
//! Everything version-sensitive is a lookup keyed by [`ConsensusProtocolVersion`],
//! never a bare constant. There is exactly one protocol live today — the
//! reference SDK's enum has one member too, because it drops old protocols on
//! major bumps — but a fork changes several of these numbers at once, and a
//! hardcoded constant is the thing that costs a rewrite when it lands.

use crate::tx::Tag;

/// A consensus protocol version.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum ConsensusProtocolVersion {
    /// Ceres, protocol 6 — the live protocol.
    #[default]
    Ceres,
}

impl ConsensusProtocolVersion {
    /// The on-chain protocol number.
    pub const fn as_u32(self) -> u32 {
        match self {
            ConsensusProtocolVersion::Ceres => 6,
        }
    }
}

/// The kind of call an abi version is being selected for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CallKind {
    /// `ContractCreateTx` and `GaAttachTx`.
    ContractCreate,
    /// `ContractCallTx` and `GaMetaTx`.
    ContractCall,
    /// Oracle transactions.
    OracleCall,
}

impl CallKind {
    /// Which call kind a tag's `abiVersion` field is selected for.
    pub(crate) const fn for_tag(tag: Tag) -> CallKind {
        match tag {
            Tag::ContractCallTx | Tag::GaMetaTx => CallKind::ContractCall,
            _ => CallKind::OracleCall,
        }
    }
}

/// The VM versions the protocol has shipped. The fork history, written down.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum VmVersion {
    /// No VM.
    NoVm = 0,
    /// Sophia on the AEVM.
    Sophia = 1,
    /// Sophia, Minerva improvements.
    SophiaImprovementsMinerva = 3,
    /// Sophia, Fortuna improvements.
    SophiaImprovementsFortuna = 4,
    /// FATE.
    Fate = 5,
    /// Sophia, Lima improvements.
    SophiaImprovementsLima = 6,
    /// FATE 2.
    Fate2 = 7,
    /// FATE 3.
    Fate3 = 8,
}

/// The ABI versions the protocol has shipped.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum AbiVersion {
    /// No ABI — an oracle transaction that carries no contract call.
    NoAbi = 0,
    /// The AEVM Sophia ABI.
    Sophia = 1,
    /// The FATE ABI.
    Fate = 3,
}

/// The defaults a protocol version supplies for fields the caller can omit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProtocolParams {
    /// The VM version a `ContractCreateTx`/`GaAttachTx` defaults to.
    pub contract_create_vm: VmVersion,
    /// The ABI version a `ContractCreateTx`/`GaAttachTx` defaults to.
    pub contract_create_abi: AbiVersion,
    /// The ABI version a `ContractCallTx`/`GaMetaTx` defaults to.
    pub contract_call_abi: AbiVersion,
    /// The ABI version an oracle transaction defaults to.
    pub oracle_call_abi: AbiVersion,
    /// The minimum gas price, in aettos.
    ///
    /// The rest of the fee and gas model — base gas, per-byte gas, the per-tag
    /// multipliers — belongs to the fee/gas workstream and extends this struct
    /// rather than living somewhere else.
    pub min_gas_price: u64,
}

/// The parameters for a protocol version.
pub const fn params(version: ConsensusProtocolVersion) -> ProtocolParams {
    match version {
        ConsensusProtocolVersion::Ceres => ProtocolParams {
            contract_create_vm: VmVersion::Fate3,
            contract_create_abi: AbiVersion::Fate,
            contract_call_abi: AbiVersion::Fate,
            oracle_call_abi: AbiVersion::NoAbi,
            min_gas_price: 1_000_000_000,
        },
    }
}

impl ProtocolParams {
    /// The default abi version for a call kind under this protocol.
    pub const fn abi_version(&self, kind: CallKind) -> AbiVersion {
        match kind {
            CallKind::ContractCreate => self.contract_create_abi,
            CallKind::ContractCall => self.contract_call_abi,
            CallKind::OracleCall => self.oracle_call_abi,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ceres_defaults_match_the_reference_table() {
        let p = params(ConsensusProtocolVersion::Ceres);
        assert_eq!(ConsensusProtocolVersion::Ceres.as_u32(), 6);
        assert_eq!(p.contract_create_vm as u8, 8);
        assert_eq!(p.contract_create_abi as u8, 3);
        assert_eq!(p.contract_call_abi as u8, 3);
        // An oracle register carries abi 0 unless the caller asks for a typed oracle.
        assert_eq!(p.oracle_call_abi as u8, 0);
        assert_eq!(p.min_gas_price, 1_000_000_000);
    }

    #[test]
    fn call_kind_follows_the_tag() {
        assert_eq!(
            CallKind::for_tag(Tag::ContractCallTx),
            CallKind::ContractCall
        );
        assert_eq!(CallKind::for_tag(Tag::GaMetaTx), CallKind::ContractCall);
        assert_eq!(
            CallKind::for_tag(Tag::OracleRegisterTx),
            CallKind::OracleCall
        );
    }
}
