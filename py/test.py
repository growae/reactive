import sys

import ae_py

data = bytes([0xDE, 0xAD, 0xBE, 0xEF])
expected = "de ad be ef"

framed = ae_py.transform(data)
print("transform:", framed.hex(" "))
if framed.hex(" ") != "00 00 00 04 de ad be ef 04 5d 4b b3":
    print("FAIL transform")
    sys.exit(1)

frame = ae_py.decode(framed)
print("decode   :", {"len": frame.len, "checksum": hex(frame.checksum), "payload": bytes(frame.payload).hex(" ")})
if frame.len != 4 or frame.checksum != 0x045D4BB3 or bytes(frame.payload).hex(" ") != expected:
    print("FAIL decode")
    sys.exit(1)

threw = None
try:
    ae_py.decode(bytes([0, 0, 0]))
except ae_py.DecodeError as e:
    threw = e
print("error    :", threw)
if threw is None:
    print("FAIL: short input should have raised")
    sys.exit(1)

print("PASS: Python <- PyO3 native, both signatures + error channel")
