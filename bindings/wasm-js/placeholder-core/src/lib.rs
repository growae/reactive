mod bindings;

use bindings::Guest;

struct Component;

impl Guest for Component {
    fn ping() -> String {
        "pong".to_string()
    }
}

bindings::export!(Component with_types_in bindings);
