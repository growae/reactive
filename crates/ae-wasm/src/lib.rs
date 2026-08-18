wit_bindgen::generate!({
    world: "spike",
    path: "wit",
});

use exports::growae::spike::core::{DecodeError, Frame, Guest};

struct Component;

impl Guest for Component {
    fn transform(input: Vec<u8>) -> Vec<u8> {
        ae_core::transform(&input)
    }

    fn decode(input: Vec<u8>) -> Result<Frame, DecodeError> {
        ae_core::decode(&input)
            .map(|f| Frame {
                len: f.len,
                checksum: f.checksum,
                payload: f.payload,
            })
            .map_err(|e| match e {
                ae_core::DecodeError::TooShort => DecodeError::TooShort,
                ae_core::DecodeError::ChecksumMismatch => DecodeError::ChecksumMismatch,
            })
    }
}

export!(Component);
