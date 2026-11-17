/** Load the Rust protocol component only when an action needs wire operations. */
export async function loadProtocol() {
  const protocol = await import('#ae-protocol')
  await protocol.$init
  return protocol
}
