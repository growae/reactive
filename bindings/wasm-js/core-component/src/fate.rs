use super::{
    bindings::exports::growae::core_harness::{fate, typed_data},
    Component,
};
use ae_core::{
    encoding::{self, Encoding},
    hash::blake2b_256,
    keys::{PublicKey, SecretKey, Signature},
};
use ae_fate::{AddressKind, FateValue};

type Result<T> = std::result::Result<T, String>;
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
fn decode(bytes: &[u8]) -> Result<FateValue> {
    ae_fate::deserialize(bytes).map_err(err)
}
fn encode(value: &FateValue) -> Result<Vec<u8>> {
    ae_fate::serialize(value).map_err(err)
}
fn children(items: Vec<Vec<u8>>) -> Result<Vec<FateValue>> {
    items.iter().map(|b| decode(b)).collect()
}
fn encoded(items: &[FateValue]) -> Result<Vec<Vec<u8>>> {
    items.iter().map(encode).collect()
}
fn address(value: &str) -> Result<FateValue> {
    let (kind, bytes) = encoding::decode_any(value).map_err(err)?;
    let kind = match kind {
        Encoding::AccountAddress => AddressKind::Account,
        Encoding::ContractAddress => AddressKind::Contract,
        Encoding::OracleAddress => AddressKind::Oracle,
        Encoding::OracleQueryId => AddressKind::OracleQuery,
        Encoding::Channel => AddressKind::Channel,
        _ => return Err("expected a FATE address".into()),
    };
    Ok(FateValue::Address(kind, bytes))
}

impl fate::Guest for Component {
    fn encode_value(input: fate::Value) -> Result<Vec<u8>> {
        use fate::Value as V;
        let value = match input {
            V::Integer(s) => FateValue::Int(s.parse().map_err(err)?),
            V::Bits(s) => FateValue::Bits(s.parse().map_err(err)?),
            V::Boolean(b) => FateValue::Bool(b),
            V::StringBytes(b) => FateValue::String(b),
            V::SizedBytes(b) => FateValue::Bytes(b),
            V::Address(s) => address(&s)?,
            V::TupleValues(v) => FateValue::Tuple(children(v)?),
            V::ListValues(v) => FateValue::List(children(v)?),
            V::Pairs(p) => FateValue::map(
                p.iter()
                    .map(|(k, v)| Ok((decode(k)?, decode(v)?)))
                    .collect::<Result<Vec<_>>>()?,
            )
            .map_err(err)?,
            V::Tagged(v) => {
                FateValue::variant(v.arities, v.index, children(v.values)?).map_err(err)?
            }
            V::Raw(b) => decode(&b)?,
        };
        encode(&value)
    }
    fn decode_value(input: Vec<u8>) -> Result<fate::Value> {
        use fate::Value as V;
        Ok(match decode(&input)? {
            FateValue::Int(n) => V::Integer(n.to_string()),
            FateValue::Bits(n) => V::Bits(n.to_string()),
            FateValue::Bool(b) => V::Boolean(b),
            FateValue::String(b) => V::StringBytes(b),
            FateValue::Bytes(b) => V::SizedBytes(b),
            FateValue::Address(kind, b) => V::Address(
                encoding::encode(
                    &b,
                    match kind {
                        AddressKind::Account => Encoding::AccountAddress,
                        AddressKind::Contract => Encoding::ContractAddress,
                        AddressKind::Oracle => Encoding::OracleAddress,
                        AddressKind::OracleQuery => Encoding::OracleQueryId,
                        AddressKind::Channel => Encoding::Channel,
                    },
                )
                .map_err(err)?,
            ),
            FateValue::Tuple(v) => V::TupleValues(encoded(&v)?),
            FateValue::List(v) => V::ListValues(encoded(&v)?),
            FateValue::Map(m) => V::Pairs(
                m.entries()
                    .iter()
                    .map(|(k, v)| Ok((encode(k)?, encode(v)?)))
                    .collect::<Result<Vec<_>>>()?,
            ),
            FateValue::Variant(v) => V::Tagged(fate::VariantValue {
                arities: v.arities().to_vec(),
                index: v.tag(),
                values: encoded(v.values())?,
            }),
            _ => V::Raw(input),
        })
    }
    fn encode_calldata(name: String, arguments: Vec<Vec<u8>>) -> Result<String> {
        let id = blake2b_256(name.as_bytes());
        let bytes = ae_fate::encode_calldata(&id[..4], &children(arguments)?).map_err(err)?;
        encoding::encode(&bytes, Encoding::ContractBytearray).map_err(err)
    }
}

fn digest(data: &str, aci: &str, domain: typed_data::Domain) -> Result<[u8; 32]> {
    let contract = domain
        .contract_address
        .map(|id| {
            let (kind, bytes) = encoding::decode_any(&id).map_err(err)?;
            if kind != Encoding::ContractAddress {
                return Err("expected ct_ domain address".to_string());
            }
            Ok(FateValue::contract(bytes))
        })
        .transpose()?;
    let version = domain
        .version
        .map(|s| s.parse().map(FateValue::Int).map_err(err))
        .transpose()?;
    let fields = [
        domain.name.map(FateValue::string),
        version,
        domain.network_id.map(FateValue::string),
        contract,
    ];
    let domain = FateValue::Tuple(
        fields
            .into_iter()
            .map(|v| v.map_or_else(FateValue::none, FateValue::some))
            .collect(),
    );
    let (kind, value) = encoding::decode_any(data).map_err(err)?;
    if kind != Encoding::ContractBytearray {
        return Err("expected cb_ typed data".into());
    }
    let mut payload = vec![b"aeternity Signed Message:\n".len() as u8, 0];
    payload.extend(blake2b_256(&encode(&domain)?));
    payload.extend(blake2b_256(aci.as_bytes()));
    payload.extend(blake2b_256(&value));
    Ok(blake2b_256(&payload))
}

impl typed_data::Guest for Component {
    fn sign(
        secret: String,
        data: String,
        canonical_aci: String,
        domain: typed_data::Domain,
    ) -> Result<String> {
        let key = SecretKey::from_encoded(&secret).map_err(err)?;
        key.sign_raw(&digest(&data, &canonical_aci, domain)?)
            .to_encoded()
            .map_err(err)
    }
    fn verify(
        address: String,
        signature: String,
        data: String,
        canonical_aci: String,
        domain: typed_data::Domain,
    ) -> Result<bool> {
        let key = PublicKey::from_address(&address).map_err(err)?;
        let signature = Signature::from_encoded(&signature).map_err(err)?;
        Ok(key.verify(&digest(&data, &canonical_aci, domain)?, &signature))
    }
}
