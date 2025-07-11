export const useString = () => {
  const truncateAddress = (
    address: string,
    startLength: number = 6,
    endLength: number = 4
  ): string => {
    if (!address || address.length <= startLength + endLength) {
      return address;
    }
    const start = address.substring(0, startLength);
    const end = address.substring(address.length - endLength);
    return `${start}...${end}`;
  };

  return { truncateAddress };
}; 