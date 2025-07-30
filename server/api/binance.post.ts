import {H3Event} from 'h3';

// Define multiple endpoint configurations for different regions/restrictions
const ENDPOINT_CONFIGS = [
  {
    name: 'data.binance.com',
    baseUrl: 'https://data.binance.com/api/v3',
    description: 'Unrestricted read-only endpoint'
  },
  {
    name: 'api.binance.us', 
    baseUrl: 'https://api.binance.us/api/v3',
    description: 'US-specific endpoint'
  },
  {
    name: 'api.binance.com',
    baseUrl: 'https://api.binance.com/api/v3', 
    description: 'Global endpoint (may be restricted)'
  }
];

const getApiPath = (action: string): string => {
  switch (action) {
    case 'getKadenaPrice':
      return 'ticker/price';
    case 'getKadenaTickerData':
      return 'ticker/24hr';
    case 'getKadenaCandlestickData':
      return 'klines';
    default:
      throw new Error('Invalid action');
  }
};

const buildUrl = (baseUrl: string, path: string, params: Record<string, any>): string => {
  const query = new URLSearchParams(params).toString();
  return `${baseUrl}/${path}?${query}`;
};

const makeRequest = async (url: string, timeout: number = 10000): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Explorer/1.0)',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid content type. Expected JSON, got: ${contentType}. Response: ${text.substring(0, 200)}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Empty response body');
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError: any) {
      throw new Error(`JSON parse error: ${parseError.message}. Response: ${text.substring(0, 200)}`);
    }
    
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

const tryEndpointWithRetry = async (
  baseUrl: string, 
  path: string, 
  params: Record<string, any>,
  maxRetries: number = 2
): Promise<{data: any, endpoint: string}> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = buildUrl(baseUrl, path, params);
      console.log(`Attempting ${baseUrl} (attempt ${attempt}/${maxRetries}): ${url}`);
      
      const data = await makeRequest(url, 8000 + (attempt * 2000)); // Increasing timeout
      
      console.log(`Success with ${baseUrl}:`, data);
      return { data, endpoint: baseUrl };
      
    } catch (error: any) {
      lastError = error;
      console.log(`Failed ${baseUrl} attempt ${attempt}:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
};

export default defineEventHandler(async (event: H3Event) => {
  try {
    const {action, params} = await readBody(event);
    
    if (!action || !params) {
      return {
        error: 'Missing required parameters: action and params'
      };
    }

    const path = getApiPath(action);
    const errors: Array<{endpoint: string, error: string}> = [];
    
    // Try each endpoint configuration in order
    for (const config of ENDPOINT_CONFIGS) {
      try {
        const result = await tryEndpointWithRetry(config.baseUrl, path, params);
        
        // Validate the response structure based on action
        if (action === 'getKadenaPrice' && (!result.data.price || !result.data.symbol)) {
          throw new Error('Invalid price response structure');
        }
        if (action === 'getKadenaTickerData' && (!result.data.symbol || result.data.priceChange === undefined)) {
          throw new Error('Invalid ticker response structure');
        }
        if (action === 'getKadenaCandlestickData' && !Array.isArray(result.data)) {
          throw new Error('Invalid candlestick response structure');
        }
        
        return {
          data: result.data,
          meta: {
            endpoint: result.endpoint,
            action: action,
            timestamp: Date.now()
          }
        };
        
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        errors.push({
          endpoint: config.name,
          error: errorMsg
        });
        
        console.log(`Failed with ${config.name}:`, errorMsg);
        
        // If this is a 451 error, continue to next endpoint
        if (errorMsg.includes('451') || errorMsg.includes('restricted location')) {
          continue;
        }
        
        // If this is a JSON parsing error, continue to next endpoint  
        if (errorMsg.includes('JSON parse') || errorMsg.includes('Unexpected end of JSON')) {
          continue;
        }
        
        // For other errors, also continue but log them
        continue;
      }
    }
    
    // If all endpoints failed, return comprehensive error info
    return {
      error: 'All Binance API endpoints failed',
      details: {
        action: action,
        params: params,
        attempts: errors,
        suggestion: 'This might be due to regional restrictions or temporary API issues. Please try again later.'
      }
    };
    
  } catch (error: any) {
    console.error('Binance API handler error:', error);
    return {
      error: 'Internal server error',
      details: error.message
    };
  }
}); 