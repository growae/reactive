#!/usr/bin/env python3
"""Rebuild vectors/chain.json from the aeternity middleware.

The counterpart to generate-vectors.mjs. That one asks `@aeternity/aepp-sdk`
what it would build; this one asks the chain what it already accepted. Both
corpora are needed: the SDK cannot tell us whether a node agrees with it, and the
chain cannot tell us what the SDK would have produced for a transaction nobody
has ever sent.

    python3 harvest-chain.py > vectors/chain.json

Needs network access and nothing else — no node, no key, no SDK. Every field it
writes is public chain data.

The diff after a re-harvest is the record of what the chain started doing
differently. Read it rather than committing it blind: a tag that stops appearing
means the corpus stopped covering it, and `chain.rs` will say so.
"""

import json
import sys
import time
import urllib.request

# One entry per transaction type the middleware indexes. `channel_offchain` is
# absent deliberately: it is never mined on its own, only ever wrapped inside a
# channel transaction's payload, and it is covered that way.
TYPES = [
    "spend",
    "oracle_register", "oracle_query", "oracle_response", "oracle_extend",
    "name_preclaim", "name_claim", "name_update", "name_transfer", "name_revoke",
    "contract_create", "contract_call",
    "ga_attach", "ga_meta", "paying_for",
    "channel_create", "channel_deposit", "channel_withdraw",
    "channel_close_mutual", "channel_close_solo", "channel_slash",
    "channel_settle", "channel_snapshot_solo", "channel_force_progress",
]

NETWORKS = {
    "ae_uat": "https://testnet.aeternity.io",
    "ae_mainnet": "https://mainnet.aeternity.io",
}

# Per type per network. Four is enough to catch a per-signer difference — a
# channel transaction carries one signature from each party, and the two parties
# do not always sign the same payload — without making the corpus large enough
# to be a burden in the repository.
PER_TYPE = 4

# The node's decoded transaction carries middleware enrichment (`aexn_type`,
# decoded contract `arguments`, call results) that is not part of the protocol.
# Only the fields that correspond to a serialised transaction field are kept, so
# the corpus does not go stale when the middleware adds a column.
KEEP = {
    "type", "version",
    "amount", "fee", "nonce", "ttl", "gas", "gas_price", "deposit",
    "abi_version", "vm_version",
    "name", "name_fee", "name_salt", "name_id", "commitment_id", "pointers",
    "query_fee", "query_id", "oracle_ttl", "query_ttl", "response_ttl",
    "sender_id", "recipient_id", "account_id", "caller_id", "contract_id",
    "owner_id", "oracle_id", "payer_id", "from_id", "to_id",
    "initiator_id", "responder_id", "ga_id", "auth_fun",
    "channel_id", "initiator_amount", "responder_amount", "channel_reserve",
    "lock_period", "round", "state_hash", "offchain_trees", "payload",
}


def get(url, attempts=3):
    """A transport failure is not an empty result — retry before believing it."""
    error = None
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                return json.load(response)
        except Exception as caught:  # noqa: BLE001 - report and retry, whatever it is
            error = caught
            time.sleep(2)
    raise SystemExit(f"giving up on {url}: {error}")


def protocol_table(base):
    """`[(effective_at_height, version)]`, ascending."""
    protocols = get(f"{base}/v3/status")["protocols"]
    return sorted((p["effective_at_height"], p["version"]) for p in protocols)


def protocol_at(table, height):
    version = table[0][1]
    for effective_at, candidate in table:
        if height >= effective_at:
            version = candidate
    return version


def main():
    cases = []
    for network_id, base in NETWORKS.items():
        table = protocol_table(base)
        for kind in TYPES:
            url = f"{base}/mdw/v3/transactions?type={kind}&limit={PER_TYPE}&direction=backward"
            rows = get(url).get("data") or []
            if not rows:
                print(f"warning: no {kind} on {network_id}", file=sys.stderr)
            for row in rows:
                cases.append({
                    "networkId": network_id,
                    "source": kind,
                    "height": row["block_height"],
                    "protocol": protocol_at(table, row["block_height"]),
                    "hash": row["hash"],
                    # A GaMetaTx carries no top-level signature: the authorisation
                    # is in its auth data, and the middleware omits the field.
                    "signatures": row.get("signatures") or [],
                    "signedTx": row["encoded_tx"],
                    "node": {
                        k: v for k, v in row["tx"].items()
                        if k in KEEP and v is not None
                    },
                })
            print(f"{network_id} {kind}: {len(rows)}", file=sys.stderr)

    cases.sort(key=lambda case: (case["networkId"], case["source"], case["hash"]))
    json.dump(
        {
            "source": "aeternity middleware v3, mainnet and testnet",
            "cases": cases,
        },
        sys.stdout,
        indent=1,
    )
    sys.stdout.write("\n")
    print(f"{len(cases)} cases", file=sys.stderr)


if __name__ == "__main__":
    main()
