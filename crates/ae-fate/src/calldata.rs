//! Contract calldata.
//!
//! Calldata is not its own wire form: it is a two-element tuple of the function
//! id and a tuple of the arguments. The function id is the first four bytes of
//! the Blake2b hash of the function name, which is a hashing concern rather
//! than an encoding one and so is computed a layer above this crate; the same
//! goes for wrapping the result in the `cb_…` base64check envelope.

use crate::de::deserialize;
use crate::error::{Error, Result};
use crate::ser::serialize;
use crate::value::FateValue;

/// A decoded contract call.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Calldata {
    /// The function id — four bytes, in practice.
    pub function_id: Vec<u8>,
    /// The call arguments, in declaration order.
    pub arguments: Vec<FateValue>,
}

/// Encodes a call to `function_id` with `arguments`.
pub fn encode_calldata(function_id: &[u8], arguments: &[FateValue]) -> Result<Vec<u8>> {
    serialize(&FateValue::Tuple(vec![
        FateValue::String(function_id.to_vec()),
        FateValue::Tuple(arguments.to_vec()),
    ]))
}

/// Decodes calldata.
///
/// This recovers the argument *values*, not their Sophia types — an integer
/// argument and a `bytes` length are the same bytes on the wire. Mapping the
/// values back onto a contract's declared signature needs its interface.
pub fn decode_calldata(input: &[u8]) -> Result<Calldata> {
    let value = deserialize(input)?;
    let FateValue::Tuple(mut parts) = value else {
        return Err(Error::MalformedCalldata);
    };
    if parts.len() != 2 {
        return Err(Error::MalformedCalldata);
    }
    let arguments = match parts.pop() {
        Some(FateValue::Tuple(arguments)) => arguments,
        _ => return Err(Error::MalformedCalldata),
    };
    let function_id = match parts.pop() {
        Some(FateValue::String(id)) => id,
        _ => return Err(Error::MalformedCalldata),
    };
    Ok(Calldata {
        function_id,
        arguments,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_a_call() {
        let arguments = vec![FateValue::int(42i32), FateValue::string("hello")];
        let encoded = encode_calldata(&[0xb2, 0xba, 0x9d, 0x59], &arguments).expect("encodes");
        let decoded = decode_calldata(&encoded).expect("decodes");
        assert_eq!(decoded.function_id, vec![0xb2, 0xba, 0x9d, 0x59]);
        assert_eq!(decoded.arguments, arguments);
    }

    #[test]
    fn round_trips_a_call_with_no_arguments() {
        let encoded = encode_calldata(&[1, 2, 3, 4], &[]).expect("encodes");
        // Two element tuple: a four byte string, then the empty tuple.
        assert_eq!(encoded, vec![0x2b, 0b0001_0001, 1, 2, 3, 4, 0b0011_1111]);
        assert_eq!(decode_calldata(&encoded).unwrap().arguments, Vec::new());
    }

    #[test]
    fn rejects_bytes_that_are_not_calldata() {
        let not_calldata = serialize(&FateValue::int(1i32)).unwrap();
        assert_eq!(
            decode_calldata(&not_calldata),
            Err(Error::MalformedCalldata)
        );
    }
}
