//! The core under test. Pure computation, no I/O, no async, no key material.
//!
//! Deliberately not an aeternity function — the binding boundary is what is
//! being measured, not the protocol.

/// Bytes in, bytes out. Frames the input with a big-endian u32 length prefix
/// and appends a FNV-1a-32 checksum of the payload.
pub fn transform(input: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(input.len() + 8);
    out.extend_from_slice(&(input.len() as u32).to_be_bytes());
    out.extend_from_slice(input);
    out.extend_from_slice(&fnv1a32(input).to_be_bytes());
    out
}

/// A decoded frame. A non-primitive type, deliberately — this is where
/// binding cost actually lives.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Frame {
    pub len: u32,
    pub checksum: u32,
    pub payload: Vec<u8>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DecodeError {
    TooShort,
    ChecksumMismatch,
}

/// The inverse of [`transform`]. Fallible, so every binding has to carry an
/// error channel as well as a record.
pub fn decode(input: &[u8]) -> Result<Frame, DecodeError> {
    if input.len() < 8 {
        return Err(DecodeError::TooShort);
    }
    let len = u32::from_be_bytes([input[0], input[1], input[2], input[3]]);
    let end = 4 + len as usize;
    if input.len() != end + 4 {
        return Err(DecodeError::TooShort);
    }
    let payload = input[4..end].to_vec();
    let checksum = u32::from_be_bytes([input[end], input[end + 1], input[end + 2], input[end + 3]]);
    if fnv1a32(&payload) != checksum {
        return Err(DecodeError::ChecksumMismatch);
    }
    Ok(Frame {
        len,
        checksum,
        payload,
    })
}

fn fnv1a32(bytes: &[u8]) -> u32 {
    let mut hash: u32 = 0x811c_9dc5;
    for b in bytes {
        hash ^= *b as u32;
        hash = hash.wrapping_mul(0x0100_0193);
    }
    hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frames_and_checksums() {
        assert_eq!(
            transform(&[0xde, 0xad, 0xbe, 0xef]),
            vec![0, 0, 0, 4, 0xde, 0xad, 0xbe, 0xef, 0x04, 0x5d, 0x4b, 0xb3]
        );
    }

    #[test]
    fn handles_empty() {
        assert_eq!(transform(&[]), vec![0, 0, 0, 0, 0x81, 0x1c, 0x9d, 0xc5]);
    }

    #[test]
    fn decodes_what_it_transformed() {
        let framed = transform(&[0xde, 0xad, 0xbe, 0xef]);
        assert_eq!(
            decode(&framed),
            Ok(Frame {
                len: 4,
                checksum: 0x045d_4bb3,
                payload: vec![0xde, 0xad, 0xbe, 0xef],
            })
        );
    }

    #[test]
    fn rejects_short_and_corrupt() {
        assert_eq!(decode(&[0, 0, 0]), Err(DecodeError::TooShort));
        let mut framed = transform(&[1, 2, 3]);
        framed[4] ^= 0xff;
        assert_eq!(decode(&framed), Err(DecodeError::ChecksumMismatch));
    }
}
