const AETTOS_PER_AE = BigInt('1000000000000000000')

export function toAettos(ae: string | number): bigint {
  const str = typeof ae === 'number' ? ae.toString() : ae
  const parts = str.split('.')

  if (parts.length === 1) {
    return BigInt(parts[0]!) * AETTOS_PER_AE
  }

  const whole = BigInt(parts[0]!) * AETTOS_PER_AE
  const decimalStr = parts[1]!.padEnd(18, '0').slice(0, 18)
  return whole + BigInt(decimalStr)
}

export function toAe(aettos: string | number | bigint): string {
  const value = BigInt(aettos)
  const negative = value < 0n
  const abs = negative ? -value : value

  const whole = abs / AETTOS_PER_AE
  const remainder = abs % AETTOS_PER_AE

  if (remainder === 0n) {
    return `${negative ? '-' : ''}${whole}`
  }

  const remainderStr = remainder.toString().padStart(18, '0').replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}.${remainderStr}`
}

export function formatAmount(
  amount: string | number | bigint,
  options?: { denomination?: 'ae' | 'aettos'; decimals?: number },
): string {
  const { denomination = 'aettos', decimals } = options ?? {}

  let aeValue: string
  if (denomination === 'ae') {
    aeValue = typeof amount === 'string' ? amount : amount.toString()
  } else {
    aeValue = toAe(amount)
  }

  if (decimals != null) {
    const parts = aeValue.split('.')
    if (decimals === 0) return parts[0]!

    const decimalPart = (parts[1] ?? '').padEnd(decimals, '0').slice(0, decimals)
    return `${parts[0]}.${decimalPart}`
  }

  return aeValue
}
