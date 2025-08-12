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
    
    // Check if this is a genesis transaction (unix timestamp 0)
    if (date.getTime() === 0) {
      return 'Genesis';
    }
    
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
      return `${hours} hrs ago`;
    }
    const days = Math.round(hours / 24);
    return `${days} days ago`;
  };

  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    const relativeTime = formatRelativeTime(dateString);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    const getValue = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;

    const month = getValue('month');
    const day = getValue('day');
    const year = getValue('year');
    const hour = getValue('hour');
    const minute = getValue('minute');
    const second = getValue('second');
    const dayPeriod = getValue('dayPeriod');

    const rearrangedDate = `${month}-${day}-${year}`;
    const time = `${hour}:${minute}:${second} ${dayPeriod}`;

    return `${relativeTime} (${rearrangedDate} ${time} +UTC)`;
  };


  const formatGasPrice = (price: number, precision: number = 8): string => {
    if (price === null || price === undefined) return '0';
    const feeStr = price.toFixed(precision);
    // Use regex to remove unnecessary trailing zeros
    return feeStr.replace(/(\.\d*[1-9])0+$/, '$1').replace(/\.0+$/, '.0');
  };

  const formatKda = (
    amount: number | string,
    maxDecimals: number = 12
  ): string => {
    if (amount === null || amount === undefined || amount === '') {
      return '0.0';
    }
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (Number.isNaN(numericAmount)) {
      return String(amount);
    }
    const fixed = numericAmount.toFixed(maxDecimals);
    // Remove trailing zeros but keep a single decimal place (e.g., 2 -> 2.0)
    return fixed.replace(/(\.\d*[1-9])0+$/, '$1').replace(/\.0+$/, '.0');
  };

  const removeTrailingZeros = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    const num = parseFloat(stringValue);
    if (isNaN(num)) {
      return stringValue;
    }
    return num.toString();
  };

  return {
    truncateAddress,
    formatRelativeTime,
    formatFullDate,
    formatGasPrice,
    formatKda,
    removeTrailingZeros,
  };
}; 