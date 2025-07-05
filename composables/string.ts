export const shortenAddress = (
  address: string,
  startChars = 6,
  endChars = 4
): string => {
  if (!address) {
    return ''
  }

  if (!address.includes('k:') && address.length <= 20) {
    return address
  }

  return `${address.slice(0, startChars)}...${address.slice(
    -endChars
  )}`
}

export const shortenString = (
  string: string,
  startChars = 6,
  endChars = 4
): string => {
  if (!string) {
    return ''
  }

  return `${string.slice(0, startChars)}...${string.slice(
    -endChars
  )}`
}
