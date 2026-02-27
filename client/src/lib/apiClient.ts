import { toast } from 'sonner';

export type ApiOptions = RequestInit & {
  skipErrorToast?: boolean;
  retries?: number;
};

/**
 * Unified API client wrapper that automatically handles:
 * - Authentication credentials
 * - Error handling and logging
 * - JSON parsing
 * - Toast notifications
 * - Retry logic
 */
export async function api<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    skipErrorToast = false,
    retries = 1,
    ...fetchOptions
  } = options;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(path, {
        credentials: 'include',
        headers: defaultHeaders,
        ...fetchOptions,
      });

      if (!response.ok) {
        const text = await response.text();
        const errorMessage = `API Error: ${response.status} ${response.statusText}`;
        
        // Log error details
        console.error('[API Error]', {
          path,
          status: response.status,
          statusText: response.statusText,
          body: text,
          attempt: attempt + 1,
          totalAttempts: retries + 1,
        });

        // Handle specific status codes
        if (response.status === 401) {
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Unauthorized. Redirecting to login...');
        }

        if (response.status === 403) {
          throw new Error('Forbidden. You do not have permission to access this resource.');
        }

        if (response.status === 404) {
          throw new Error('Resource not found.');
        }

        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }

        throw new Error(text || errorMessage);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as T;
      }

      // Log successful request
      console.debug('[API Success]', {
        path,
        status: response.status,
        attempt: attempt + 1,
      });

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        const errorMessage = lastError.message || 'An error occurred';

        // Show toast notification unless explicitly skipped
        if (!skipErrorToast) {
          toast.error(errorMessage, {
            description: 'Please try again or contact support if the problem persists.',
          });
        }

        console.error('[API Final Error]', {
          path,
          error: errorMessage,
          attempts: attempt + 1,
        });

        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      console.warn('[API Retry]', {
        path,
        attempt: attempt + 1,
        nextAttemptIn: delayMs,
        error: lastError.message,
      });
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown API error');
}

/**
 * Helper for GET requests
 */
export function apiGet<T = any>(
  path: string,
  options?: ApiOptions
): Promise<T> {
  return api<T>(path, { ...options, method: 'GET' });
}

/**
 * Helper for POST requests
 */
export function apiPost<T = any>(
  path: string,
  body?: any,
  options?: ApiOptions
): Promise<T> {
  return api<T>(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests
 */
export function apiPut<T = any>(
  path: string,
  body?: any,
  options?: ApiOptions
): Promise<T> {
  return api<T>(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PATCH requests
 */
export function apiPatch<T = any>(
  path: string,
  body?: any,
  options?: ApiOptions
): Promise<T> {
  return api<T>(path, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for DELETE requests
 */
export function apiDelete<T = any>(
  path: string,
  options?: ApiOptions
): Promise<T> {
  return api<T>(path, { ...options, method: 'DELETE' });
}
