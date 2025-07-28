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

/**
 * Safely unescapes a JSON string for display purposes
 * Handles cases where the string might be double-encoded or contain escape sequences
 * @param input - The input string that might contain escape sequences
 * @returns Clean, unescaped string ready for display
 */
export function unescapeCodeString(input: string | any): string {
  if (!input || typeof input !== 'string') {
    return String(input || '');
  }

  try {
    // If it's a JSON string, parse it first
    if (input.startsWith('"') && input.endsWith('"')) {
      return JSON.parse(input);
    }
    
    // Handle common escape sequences manually
    return input
      .replace(/\\"/g, '"')           // Unescape quotes
      .replace(/\\\\/g, '\\')         // Unescape backslashes
      .replace(/\\n/g, '\n')          // Unescape newlines
      .replace(/\\r/g, '\r')          // Unescape carriage returns
      .replace(/\\t/g, '\t')          // Unescape tabs
      .replace(/\\b/g, '\b')          // Unescape backspace
      .replace(/\\f/g, '\f');         // Unescape form feed
  } catch (error) {
    console.warn('Could not unescape string:', error);
    return input;
  }
}

/**
 * Enhanced JSON parser that handles multiple levels of escaping
 * @param input - JSON string that might be escaped
 * @returns Parsed object or original input if parsing fails
 */
export function parseJsonSafely(input: any): any {
  if (!input) return '';
  
  try {
    // If it's already an object, return it
    if (typeof input === 'object') {
      return input;
    }
    
    // Try to parse as JSON
    return JSON.parse(input);
  } catch (error) {
    console.warn('Could not parse JSON safely:', error);
    return input;
  }
}
