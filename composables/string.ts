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

/**
 * Parses Pact smart contract code into a structured readable format
 * @param input - Raw Pact code like "(free.radio02.close-send-receive "arg1" [...] [])"
 * @returns Structured format showing contract, method, and numbered parameters
 */
export function parsePactCode(input: string | any): string {
  if (!input || typeof input !== 'string') {
    return String(input || '');
  }

  const code = input.trim();
  
  // Remove outer parentheses if present
  const withoutParens = code.startsWith('(') && code.endsWith(')') ? 
    code.slice(1, -1).trim() : code;

  // Find the first space to separate function name from arguments
  const firstSpaceIndex = withoutParens.indexOf(' ');
  if (firstSpaceIndex === -1) {
    // No arguments, just function name
    const lastDotIndex = withoutParens.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return `Method: ${withoutParens}\n\nNo parameters`;
    }
    const contract = withoutParens.substring(0, lastDotIndex);
    const method = withoutParens.substring(lastDotIndex + 1);
    return `Contract: ${contract}\nMethod: ${method}\n\nNo parameters`;
  }

  const functionName = withoutParens.substring(0, firstSpaceIndex);
  const argsString = withoutParens.substring(firstSpaceIndex + 1).trim();

  // Split function name into contract and method
  const lastDotIndex = functionName.lastIndexOf('.');
  let contract = '';
  let method = functionName;
  
  if (lastDotIndex !== -1) {
    contract = functionName.substring(0, lastDotIndex);
    method = functionName.substring(lastDotIndex + 1);
  }

  // Parse arguments by splitting on spaces but respecting nested brackets/braces/quotes
  const args = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      current += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      current += char;
      continue;
    }
    
    if (!inString) {
      if (char === '[' || char === '{' || char === '(') {
        depth++;
      } else if (char === ']' || char === '}' || char === ')') {
        depth--;
      }
      
      if (char === ' ' && depth === 0) {
        if (current.trim()) {
          args.push(current.trim());
          current = '';
        }
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }

  // Helper function to recursively extract elements from arrays/objects
  const extractElements = (str: string): string[] => {
    const trimmed = str.trim();
    
    // Handle arrays [...]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const content = trimmed.slice(1, -1).trim();
      if (!content) return ['[]']; // Empty array
      
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const results: string[] = [];
          parsed.forEach(item => {
            const itemStr = typeof item === 'string' ? `"${item}"` : JSON.stringify(item);
            // Recursively extract elements from each item
            const subElements = extractElements(itemStr);
            results.push(...subElements);
          });
          return results;
        }
      } catch (e) {
        // If JSON parsing fails, return the original
        return [trimmed];
      }
    }
    
    // Handle objects {...}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const content = trimmed.slice(1, -1).trim();
      if (!content) return ['{}']; // Empty object
      
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          const results: string[] = [];
          Object.entries(parsed).forEach(([key, value]) => {
            const valueStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            const keyValuePair = `"${key}":${valueStr}`;
            // Recursively extract elements from the value if it's complex
            if (valueStr.startsWith('[') || valueStr.startsWith('{')) {
              const subElements = extractElements(valueStr);
              subElements.forEach(subElement => {
                results.push(`"${key}":${subElement}`);
              });
            } else {
              results.push(keyValuePair);
            }
          });
          return results;
        }
      } catch (e) {
        // If JSON parsing fails, try manual parsing for simple objects
        const pairs: string[] = [];
        let current = '';
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if (escapeNext) {
            current += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            current += char;
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            current += char;
            continue;
          }
          
          if (!inString) {
            if (char === '{' || char === '[') depth++;
            if (char === '}' || char === ']') depth--;
            
            if (char === ',' && depth === 0) {
              if (current.trim()) {
                pairs.push(current.trim());
                current = '';
              }
              continue;
            }
          }
          
          current += char;
        }
        
        if (current.trim()) {
          pairs.push(current.trim());
        }
        
        // Recursively process each pair
        const results: string[] = [];
        pairs.forEach(pair => {
          const subElements = extractElements(pair);
          results.push(...subElements);
        });
        
        return results.length > 0 ? results : [trimmed];
      }
    }
    
    // Not an array or object, return as-is
    return [trimmed];
  };

  // Build the structured output
  let result = '';
  if (contract) {
    result += `Contract: ${contract}\n\n`;
  }
  result += `Function: ${method}\n`;
  
  if (args.length === 0) {
    result += 'No parameters';
  } else {
    args.forEach((arg, index) => {
      const elements = extractElements(arg);
      elements.forEach(element => {
        result += `[${index}]:  ${element}\n`;
      });
    });
  }
  
  return result.trim();
}

/**
 * Formats JSON data with proper indentation for display
 * @param data - JSON data (object, array, or string)
 * @param indentSize - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string with proper indentation
 */
export function formatJsonPretty(data: any, indentSize: number = 2): string {
  if (!data) {
    return '';
  }

  try {
    // If it's already a string, try to parse it first
    let jsonData = data;
    if (typeof data === 'string') {
      try {
        jsonData = JSON.parse(data);
      } catch (e) {
        // If parsing fails, return the original string
        return data;
      }
    }

    // Format with proper indentation
    return JSON.stringify(jsonData, null, indentSize);
  } catch (error) {
    console.warn('Could not format JSON:', error);
    // If formatting fails, try to return a stringified version
    return typeof data === 'string' ? data : String(data);
  }
}
