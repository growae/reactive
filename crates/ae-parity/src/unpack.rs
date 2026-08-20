//! Decoding `tx_` strings to a comparable field map, for the on-node exercise.
//!
//! The builder half of clause 6 compares two implementations' encodings of *one*
//! transaction. Deciding whether they were even given the same transaction means
//! decoding the node's bytes and comparing them field by field to what was sent —
//! and that decision is made by code rather than by anyone writing "quirk" in a
//! table.
//!
//! It lives here rather than in `node-exercise.mjs` for one reason: decoding a
//! transaction needs the tag schema, and a second copy of that schema written in
//! JavaScript would be a mirror of 27 entries and 200 fields that drifts the
//! first time one of them changes — the exact mirror tax this workspace already
//! carries three of. The script shells out to this instead, so the classification
//! uses the decoder the corpus already proves against the reference.

use ae_core::tx::{unpack_tx, TxParams, Value};
use serde_json::{json, Value as Json};

/// Decode each `tx_` string to `{tag, version, fields}`, or to why it could not
/// be decoded. The order of the output matches the order of the input.
pub fn unpack_all(encoded: &[String]) -> Json {
    Json::Array(
        encoded
            .iter()
            .map(|tx| match unpack_tx(tx) {
                Ok(params) => json!({
                    "tx": tx,
                    "ok": true,
                    "tag": format!("{:?}", params.tag()),
                    "version": params.version(),
                    "fields": fields(&params),
                }),
                Err(error) => json!({
                    "tx": tx,
                    "ok": false,
                    "error": error.to_string(),
                }),
            })
            .collect(),
    )
}

/// Every field, rendered to a string that compares equal exactly when the values
/// do. A rendering rather than structured json because the only question asked of
/// it is "are these two the same field value", and the answer has to be readable
/// in a failure message naming the field.
fn fields(params: &TxParams) -> Json {
    Json::Object(
        params
            .fields()
            .iter()
            .map(|(name, value)| (name.clone(), Json::String(render(value))))
            .collect(),
    )
}

fn render(value: &Value) -> String {
    match value {
        Value::Uint(number) => number.to_string(),
        Value::Text(text) => format!("text:{text}"),
        Value::Encoded(encoded) => encoded.clone(),
        Value::Bytes(bytes) => {
            let hex: String = bytes.iter().map(|byte| format!("{byte:02x}")).collect();
            format!("bytes:{hex}")
        }
        Value::List(items) => {
            let rendered: Vec<String> = items.iter().map(render).collect();
            format!("[{}]", rendered.join(","))
        }
        // Order is part of the value: a pointer list in a different order is a
        // different transaction, which is the whole reason this module exists.
        Value::Pointers(pointers) => {
            let rendered: Vec<String> = pointers
                .iter()
                .map(|pointer| format!("{}={}", pointer.key, pointer.id))
                .collect();
            format!("[{}]", rendered.join(","))
        }
        Value::CtVersion {
            vm_version,
            abi_version,
        } => format!("vm{vm_version}/abi{abi_version}"),
        Value::Tx(inner) => format!(
            "tx({:?} v{:?} {})",
            inner.tag(),
            inner.version(),
            render_fields(inner)
        ),
    }
}

fn render_fields(params: &TxParams) -> String {
    let rendered: Vec<String> = params
        .fields()
        .iter()
        .map(|(name, value)| format!("{name}={}", render(value)))
        .collect();
    format!("{{{}}}", rendered.join(","))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::corpus;

    #[test]
    fn every_corpus_vector_decodes_to_a_field_map() {
        let encoded: Vec<String> = corpus::transactions()
            .iter()
            .map(|case| case.tx.clone())
            .collect();
        let decoded = unpack_all(&encoded);
        let rows = decoded.as_array().expect("an array");
        assert_eq!(rows.len(), encoded.len());
        for row in rows {
            assert_eq!(row["ok"], true, "{} did not decode", row["tx"]);
            assert!(row["fields"].is_object());
        }
    }

    /// The property the whole classification rests on: identical bytes render to
    /// identical field maps, and a reordered pointer list does not.
    #[test]
    fn the_rendering_separates_pointer_orders() {
        let corpus = corpus::transactions();
        let case = corpus
            .iter()
            .find(|case| case.name == "name update v1, explicit ttls and several pointers")
            .expect("the multi-pointer vector");
        let params = unpack_tx(&case.tx).expect("decodes");
        let forwards = render(params.get("pointers").expect("pointers"));

        let Value::Pointers(mut pointers) = params.get("pointers").expect("pointers").clone()
        else {
            panic!("pointers is a pointer list")
        };
        pointers.reverse();
        let backwards = render(&Value::Pointers(pointers));

        assert_ne!(forwards, backwards);
    }

    /// The other side of the classification: two decodes of the same bytes give
    /// the same field map, so "the field maps are equal" is a reachable state and
    /// `differs` — same transaction, different bytes — means what it says rather
    /// than being unreachable by construction.
    #[test]
    fn the_same_transaction_renders_to_the_same_field_map_twice() {
        let corpus = corpus::transactions();
        let encoded: Vec<String> = corpus
            .iter()
            .flat_map(|case| [case.tx.clone(), case.tx.clone()])
            .collect();
        let decoded = unpack_all(&encoded);
        let rows = decoded.as_array().expect("an array");
        for pair in rows.chunks(2) {
            assert_eq!(pair[0]["fields"], pair[1]["fields"]);
            assert_eq!(pair[0]["tag"], pair[1]["tag"]);
            assert_eq!(pair[0]["version"], pair[1]["version"]);
        }
    }

    /// And that two different transactions of the same tag do not, so a field
    /// comparison can actually separate them.
    #[test]
    fn two_different_transactions_of_one_tag_render_differently() {
        let corpus = corpus::transactions();
        let spends: Vec<String> = corpus
            .iter()
            .filter(|case| case.name.starts_with("spend, "))
            .map(|case| case.tx.clone())
            .collect();
        assert!(spends.len() >= 2);
        let decoded = unpack_all(&spends);
        let rows = decoded.as_array().expect("an array");
        assert_ne!(rows[0]["fields"], rows[1]["fields"]);
    }

    #[test]
    fn a_string_that_is_not_a_transaction_reports_why() {
        let decoded = unpack_all(&["tx_not_a_transaction".to_string()]);
        assert_eq!(decoded[0]["ok"], false);
        assert!(decoded[0]["error"].is_string());
    }
}
