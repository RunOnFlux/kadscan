export const useFormat = () => {
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

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds} secs ago`;
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} mins ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} hours ago`;
    }
    const days = Math.round(hours / 24);
    return `${days} days ago`;
  };

  const formatGasPrice = (price: number, precision: number = 8): string => {
    if (price === null || price === undefined) return '0';
    const feeStr = price.toFixed(precision);
    // Use regex to remove unnecessary trailing zeros
    return feeStr.replace(/(\.\d*[1-9])0+$/, '$1').replace(/\.0+$/, '.0');
  };

  return {
    truncateAddress,
    formatRelativeTime,
    formatGasPrice,
  };
}; 