import { unknownToken, staticTokens } from '~/constants/tokens'

export const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const integer = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
})

export const transformRawBalances = ({
  prices,
  allBalances,
}: any) => {
  if (!allBalances) {
    return []
  }

  const balancesObj = allBalances.nodes
    .sort((a: any, b: any) => a.chainId - b.chainId)
    .reduce((prev: any, current: any) => {
      const {
        balance,
        module = '',
      } = current || {}

      const formatedModule = current.module === 'coin' ? 'kadena' : current.module

      const metadata = staticTokens.find(({ module }) => current.module === module)  || unknownToken

      const etl = prices?.find(({ id }: any) => formatedModule.includes(id))

      if (!prev[module]) {
        prev[module] = {
          module,
          metadata,
          symbol: metadata?.symbol,
          balance: 0,
          balances: [],

          ...etl,
        }
      }

      prev[module].balance = prev[module].balance + Number(balance)

      prev[module].balances.push({
        ...etl,
        ...current,
        value: '-',
      })

      return prev
    }, {})

  return Object.values(balancesObj).sort((a: any, b: any) => {
    return (b.current_price || 0) - (a.current_price || 0)
  })
}

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

  // Integer-safe decimal helpers (for 12-decimal KDA amounts/fees)
  const toScaledBigInt = (value: any, scale: number): bigint => {
    const s = String(value);
    if (s.trim() === '') return 0n;
    const negative = s.startsWith('-');
    const unsigned = negative ? s.slice(1) : s;
    const [intPartRaw, fracRaw = ''] = unsigned.split('.');
    const intPart = intPartRaw.replace(/^0+/, '') || '0';
    const fracPadded = (fracRaw + '0'.repeat(scale)).slice(0, scale);
    let bi = (BigInt(intPart) * (10n ** BigInt(scale))) + BigInt(fracPadded || '0');
    if (negative) bi = -bi;
    return bi;
  };

  const formatScaledBigInt = (amount: bigint, scale: number): string => {
    const negative = amount < 0n;
    let abs = negative ? -amount : amount;
    const base = 10n ** BigInt(scale);
    const intPart = (abs / base).toString();
    const fracPart = (abs % base).toString().padStart(scale, '0');
    return `${negative ? '-' : ''}${intPart}.${fracPart}`;
  };

  const trimTrailingZerosDecimal = (value: string): string => {
    if (!value.includes('.')) return value;
    return value.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
  };

  const formatKdaFee = (
    gas: number | string | bigint | null | undefined,
    rawGasPrice: number | string | null | undefined,
    options?: { decimals?: number; trimTrailingZeros?: boolean }
  ): string => {
    const decimals = options?.decimals ?? 12;
    const trim = options?.trimTrailingZeros ?? true;
    if (!gas || !rawGasPrice) return `0.${'0'.repeat(decimals)}`;
    try {
      const gasBig = typeof gas === 'bigint' ? gas : BigInt(gas);
      const priceScaled = toScaledBigInt(rawGasPrice, decimals);
      const feeScaled = gasBig * priceScaled;
      const formatted = formatScaledBigInt(feeScaled, decimals);
      return trim ? trimTrailingZerosDecimal(formatted) : formatted;
    } catch (_e) {
      return `0.${'0'.repeat(decimals)}`;
    }
  };

  // Format numeric amounts with a maximum number of decimals.
  // If the original value has more decimals than allowed, append an ellipsis.
  // Thousands separators are preserved for the integer part.
  const formatAmountWithEllipsis = (
    input: string | number,
    maxDecimals: number = 6,
  ): string => {
    try {
      let s = typeof input === 'number' ? String(input) : String(input || '0');
      s = s.replace(/,/g, '');
      const match = s.match(/^(\d+)(?:\.(\d+))?$/);
      const clamp = (str: string, n: number) => (n >= 0 ? str.slice(0, n) : str);

      if (!match) {
        const n = Number(input);
        if (!Number.isFinite(n)) return String(input);
        const [intStr, fracStr = ''] = String(n).split('.');
        const needsEllipsis = fracStr.length > maxDecimals;
        const truncated = clamp(fracStr, maxDecimals);
        const integerFormatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.trunc(n));
        return integerFormatted + (truncated ? `.${truncated}` : '') + (needsEllipsis ? '...' : '');
      }

      const intPart = match[1];
      const fracPart = match[2] || '';
      const needsEllipsis = fracPart.length > maxDecimals;
      const truncated = clamp(fracPart, maxDecimals);
      const integerFormatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(intPart));
      return integerFormatted + (truncated ? `.${truncated}` : '') + (needsEllipsis ? '...' : '');
    } catch {
      return String(input);
    }
  };

  // --- Derived formatters used by transaction page ---
  const formatKadenaPriceDisplay = (price: number | string | null | undefined): string | null => {
    if (price == null) return null;
    const n = typeof price === 'number' ? price : parseFloat(String(price));
    if (!Number.isFinite(n)) return null;
    return `$${n.toFixed(4)} / KDA`;
  };

  // Format Pact method strings for table display (hyphens -> spaces, Title Case).
  const formatTransactionMethod = (val?: string): string => {
    if (!val || val === '-') return 'Transaction'
    const replaced = String(val).replace(/-/g, ' ')
    const titleCased = replaced.replace(/\b([a-zA-Z])/g, (m) => m.toUpperCase())
    return titleCased.length > 15 ? titleCased.slice(0, 15) + '...' : titleCased
  }

  // Full method text for tooltip (Title Case, no trimming)
  const formatTransactionMethodFull = (val?: string): string => {
    if (!val || val === '-') return 'Transaction'
    const replaced = String(val).replace(/-/g, ' ')
    return replaced.replace(/\b([a-zA-Z])/g, (m) => m.toUpperCase())
  }

  const formatGasLimitUsage = (
    gasUsed: number | string | null | undefined,
    gasLimit: number | string | null | undefined,
  ): string => {
    if (gasUsed == null || gasLimit == null) return '-';
    const usedNum = parseInt(String(gasUsed));
    const limitNum = parseInt(String(gasLimit));
    if (!Number.isFinite(usedNum) || !Number.isFinite(limitNum)) return '-';
    if (usedNum === 0 && limitNum === 0) return '0 | 0';
    const percentage = ((usedNum / limitNum) * 100).toFixed(2);
    const formattedUsed = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(usedNum);
    const formattedLimit = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(limitNum);
    return `${formattedLimit} | ${formattedUsed} (${percentage}%)`;
  };

  // Conditionally truncate only long/hash-like addresses
  const smartTruncateAddress = (address: string, start: number = 10, end: number = 10, hashSize: number = 25): string => {
    if (!address) return address;
    const isHashFormat = address.startsWith('k:') || address.length > hashSize;
    return isHashFormat ? truncateAddress(address, start, end) : address;
  };

  // Calculate USD value for KDA transfers (UI helper)
  const calculateKdaUsdValue = (amount: string, isKda: boolean, kadenaPrice: number | string | null) => {
    if (!isKda || !kadenaPrice || !amount) return null
    
    const numericAmount = parseFloat(amount)
    const priceValue = parseFloat(kadenaPrice.toString())
    const usdValue = numericAmount * priceValue
    
    return usdValue.toFixed(6)
  }

  return {
    truncateAddress,
    formatRelativeTime,
    formatFullDate,
    formatGasPrice,
    formatKda,
    removeTrailingZeros,
    formatKdaFee,
    formatAmountWithEllipsis,
    formatKadenaPriceDisplay,
    formatGasLimitUsage,
    smartTruncateAddress,
    calculateKdaUsdValue,
    formatTransactionMethod,
    formatTransactionMethodFull,
  };
}; 