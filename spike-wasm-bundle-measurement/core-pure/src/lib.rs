mod bindings;

use bindings::Guest;

struct Component;

// Minimal RLP-style length-prefixed encoding. Not protocol-correct —
// this is a throwaway stub to measure WASM component overhead, not a
// real transaction encoder.
fn encode_field(field: &[u8], out: &mut Vec<u8>) {
    out.push(field.len() as u8);
    out.extend_from_slice(field);
}

impl Guest for Component {
    fn encode_transfer(sender: Vec<u8>, recipient: Vec<u8>, amount: u64, nonce: u64) -> Vec<u8> {
        let mut out = Vec::new();
        encode_field(&sender, &mut out);
        encode_field(&recipient, &mut out);
        encode_field(&amount.to_be_bytes(), &mut out);
        encode_field(&nonce.to_be_bytes(), &mut out);
        out
    }
}

bindings::export!(Component with_types_in bindings);
