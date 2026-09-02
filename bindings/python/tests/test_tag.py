"""The `Tag` IntEnum mirrors `ae_core::tx::Tag` by hand — pure Python, no
FFI. This pins it against the values `ae-core`'s own tests pin against, so
the two drift loudly instead of silently.
"""

import ae_core as core


def test_tag_values_match_the_protocol():
    assert core.Tag.SIGNED_TX == 11
    assert core.Tag.SPEND_TX == 12
    assert core.Tag.CHANNEL_FORCE_PROGRESS_TX == 521
    assert core.Tag.PAYING_FOR_TX == 82
    assert len(core.Tag) == 26


def test_tag_is_a_plain_int_where_txparams_expects_one():
    params = core.TxParams(core.Tag.SPEND_TX)
    assert params.tag == core.Tag.SPEND_TX
    assert params.tag == 12
