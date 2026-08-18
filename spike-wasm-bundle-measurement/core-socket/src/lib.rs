mod bindings;

use bindings::Guest;
use bindings::wasi::http::outgoing_handler;
use bindings::wasi::http::types::{Fields, Method, OutgoingBody, OutgoingRequest, Scheme};

struct Component;

// Throwaway stub: submits a byte payload to a hard-coded node endpoint and
// returns the raw response bytes. Not protocol-correct — it exists only to
// measure what "the core owns the socket" costs against the browser target.
impl Guest for Component {
    fn submit_transfer(payload: Vec<u8>) -> Result<Vec<u8>, String> {
        let headers = Fields::new();
        let request = OutgoingRequest::new(headers);
        request.set_method(&Method::Post).map_err(|_| "bad method".to_string())?;
        request.set_scheme(Some(&Scheme::Https)).map_err(|_| "bad scheme".to_string())?;
        request
            .set_authority(Some("testnet.aeternity.io"))
            .map_err(|_| "bad authority".to_string())?;
        request
            .set_path_with_query(Some("/v3/transactions"))
            .map_err(|_| "bad path".to_string())?;

        let body = request.body().map_err(|_| "no body".to_string())?;
        {
            let stream = body.write().map_err(|_| "no stream".to_string())?;
            stream.blocking_write_and_flush(&payload).map_err(|_| "write failed".to_string())?;
        }
        OutgoingBody::finish(body, None).map_err(|_| "finish failed".to_string())?;

        let future_response = outgoing_handler::handle(request, None)
            .map_err(|_| "handle failed".to_string())?;

        let pollable = future_response.subscribe();
        pollable.block();

        let response = future_response
            .get()
            .ok_or_else(|| "not ready".to_string())?
            .map_err(|_| "already taken".to_string())?
            .map_err(|_| "error code".to_string())?;

        let incoming_body = response.consume().map_err(|_| "no body".to_string())?;
        let stream = incoming_body.stream().map_err(|_| "no stream".to_string())?;
        let mut out = Vec::new();
        loop {
            match stream.blocking_read(4096) {
                Ok(chunk) if chunk.is_empty() => break,
                Ok(chunk) => out.extend_from_slice(&chunk),
                Err(_) => break,
            }
        }
        Ok(out)
    }
}

bindings::export!(Component with_types_in bindings);
