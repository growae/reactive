/**
 * Retrieves and returns an action from the node client (if it exists), and falls
 * back to the tree-shakable action.
 *
 * Useful for extracting overridden actions from a node client (e.g., if a consumer
 * wants to override the `getBalance` implementation).
 */
export function getAction<
  client extends Record<string, unknown>,
  parameters,
  returnType,
>(
  client: client,
  actionFn: (_: any, parameters: parameters) => returnType,
  name: string,
): (parameters: parameters) => returnType {
  const action_implicit = client[actionFn.name]
  if (typeof action_implicit === 'function')
    return action_implicit as (params: parameters) => returnType

  const action_explicit = client[name]
  if (typeof action_explicit === 'function')
    return action_explicit as (params: parameters) => returnType

  return (params) => actionFn(client, params)
}
