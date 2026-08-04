/**
 * Structured API error class for consistent error handling
 */
export class APIError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly details: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Validates that a value is not null or undefined
 */
function validateRequired<T>(value: T | null | undefined, fieldName: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Required field missing: ${fieldName}`);
  }
}

/**
 * API Client configuration
 */
interface APIClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Fetch options with timeout support
 */
interface FetchOptions extends RequestInit {
  timeout?: number;
  params?: Record<string, string | number | boolean>;
}

/**
 * Generic API Client with built-in validation, timeouts, and error handling
 */
export class APIClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: APIClientConfig) {
    validateRequired(config.baseURL, 'config.baseURL');
    validateRequired(config.apiKey, 'config.apiKey');

    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 10000; // 10 seconds default
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  /**
   * Makes a GET request with automatic retry and timeout handling
   */
  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * Makes a POST request with automatic retry and timeout handling
   */
  async post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Core request handler with retry logic and timeout
   */
  private async request<T>(method: string, endpoint: string, options?: FetchOptions): Promise<T> {
    let lastError: APIError | Error | null = null;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      attempt++;

      try {
        const response = await this.fetchWithTimeout(method, endpoint, options);

        if (response.ok) {
          const data = await response.json();
          return this.validate<T>(data);
        }

        // Handle error responses
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = this.extractErrorMessage(errorData);

        lastError = new APIError(
          response.status,
          this.extractErrorCode(errorData),
          errorData,
          `API Error ${response.status}: ${errorMessage}`,
        );

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw lastError;
        }

        // For server errors or rate limiting, consider retrying
        if (attempt >= this.maxRetries) {
          throw lastError;
        }

        // Extract retry delay from headers if available
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = this.calculateBackoffDelay(attempt, retryAfter);

        console.warn(
          `[APIClient] Request failed (${response.status}), retrying in ${delayMs}ms (attempt ${attempt}/${this.maxRetries})`,
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        // If it's an APIError or other expected error, check if we should retry
        if (error instanceof APIError) {
          lastError = error;
          if (attempt >= this.maxRetries || (error.status >= 400 && error.status < 500)) {
            throw error;
          }

          const delayMs = this.calculateBackoffDelay(attempt, null);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // For timeout or network errors, retry
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`Request timeout after ${this.timeout}ms`);
          if (attempt >= this.maxRetries) {
            throw lastError;
          }

          const delayMs = this.calculateBackoffDelay(attempt, null);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Unexpected error
        throw error;
      }
    }

    throw lastError || new Error('Unexpected request failure');
  }

  /**
   * Fetches with timeout support using AbortController
   */
  private async fetchWithTimeout(
    method: string,
    endpoint: string,
    options?: FetchOptions,
  ): Promise<Response> {
    const url = this.buildURL(endpoint, options?.params);
    const timeoutMs = options?.timeout ?? this.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-cg-api-key': this.apiKey,
          ...options?.headers,
        },
        body: options?.body,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Builds the full URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseURL}/${endpoint.replace(/^\//, '')}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Calculates exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number, retryAfter: string | null): number {
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (!Number.isNaN(seconds)) {
        return seconds * 1000;
      }
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return this.retryDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Extracts error message from API response
   */
  private extractErrorMessage(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (typeof obj.error === 'string') return obj.error;
      if (typeof obj.message === 'string') return obj.message;
      if (typeof obj.status === 'string') return obj.status;
    }

    return 'Unknown error';
  }

  /**
   * Extracts error code from API response
   */
  private extractErrorCode(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (typeof obj.code === 'string') return obj.code;
      if (typeof obj.error_code === 'string') return obj.error_code;
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Validates the response data structure
   */
  private validate<T>(data: unknown): T {
    // For now, do basic type checking
    // In production, use a schema validation library like Zod
    if (data === undefined || data === null) {
      throw new Error('Response data is null or undefined');
    }

    return data as T;
  }
}
