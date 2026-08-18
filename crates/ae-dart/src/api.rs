pub fn transform(input: Vec<u8>) -> Vec<u8> {
    ae_core::transform(&input)
}

pub struct Frame {
    pub len: u32,
    pub checksum: u32,
    pub payload: Vec<u8>,
}

pub enum DecodeError {
    TooShort,
    ChecksumMismatch,
}

pub fn decode(input: Vec<u8>) -> Result<Frame, DecodeError> {
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
