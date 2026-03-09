/**
 * Mock RFC 3161 Time Stamp Authority (TSA) Service
 * 
 * Provides mock responses for timestamp requests in test environment
 * Allows testing without external TSA connectivity
 */

export interface MockTSAResponse {
  status: 'granted' | 'denied';
  token: string;
  tst: string;
  accuracy: number;
  ordering: boolean;
  nonce?: string;
  tsa?: string;
}

export interface MockTSARequest {
  version: number;
  messageImprint: {
    hashAlgorithm: string;
    hashedMessage: string;
  };
  reqPolicy?: string;
  nonce?: string;
  certReq?: boolean;
  extensions?: Record<string, any>;
}

/**
 * Mock Sectigo TSA Response
 */
export function createMockSectigoTSAResponse(request: MockTSARequest): MockTSAResponse {
  return {
    status: 'granted',
    token: Buffer.from(
      JSON.stringify({
        tst: new Date().toISOString(),
        serial: Math.random().toString(36).substring(7),
        accuracy: 1,
        ordering: false,
        nonce: request.nonce,
        tsa: 'http://timestamp.sectigo.com',
      })
    ).toString('base64'),
    tst: new Date().toISOString(),
    accuracy: 1,
    ordering: false,
    nonce: request.nonce,
    tsa: 'http://timestamp.sectigo.com',
  };
}

/**
 * Mock DigiCert TSA Response
 */
export function createMockDigiCertTSAResponse(request: MockTSARequest): MockTSAResponse {
  return {
    status: 'granted',
    token: Buffer.from(
      JSON.stringify({
        tst: new Date().toISOString(),
        serial: Math.random().toString(36).substring(7),
        accuracy: 1,
        ordering: false,
        nonce: request.nonce,
        tsa: 'http://timestamp.digicert.com',
      })
    ).toString('base64'),
    tst: new Date().toISOString(),
    accuracy: 1,
    ordering: false,
    nonce: request.nonce,
    tsa: 'http://timestamp.digicert.com',
  };
}

/**
 * Mock RFC 3161 Timestamp Service for Testing
 */
export class MockRFC3161TSA {
  private responses: Map<string, MockTSAResponse> = new Map();

  /**
   * Request timestamp from mock TSA
   */
  requestTimestamp(request: MockTSARequest, provider: 'sectigo' | 'digicert' = 'sectigo'): MockTSAResponse {
    // Create response based on provider
    const response = provider === 'sectigo' 
      ? createMockSectigoTSAResponse(request)
      : createMockDigiCertTSAResponse(request);

    // Store response for verification
    const key = `${request.messageImprint.hashAlgorithm}:${request.messageImprint.hashedMessage}`;
    this.responses.set(key, response);

    return response;
  }

  /**
   * Verify timestamp response
   */
  verifyTimestamp(response: MockTSAResponse, originalRequest: MockTSARequest): boolean {
    if (response.status !== 'granted') {
      return false;
    }

    if (originalRequest.nonce && response.nonce !== originalRequest.nonce) {
      return false;
    }

    // Verify timestamp is recent (within 5 minutes)
    const tstTime = new Date(response.tst).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return Math.abs(now - tstTime) < fiveMinutes;
  }

  /**
   * Get stored response
   */
  getResponse(key: string): MockTSAResponse | undefined {
    return this.responses.get(key);
  }

  /**
   * Clear all responses
   */
  clear(): void {
    this.responses.clear();
  }
}

/**
 * Global mock TSA instance for tests
 */
export const mockTSA = new MockRFC3161TSA();

/**
 * Mock HTTP response for TSA request
 */
export function createMockTSAHttpResponse(request: MockTSARequest, provider: 'sectigo' | 'digicert' = 'sectigo') {
  const response = mockTSA.requestTimestamp(request, provider);
  
  return {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/timestamp-reply',
      'content-length': response.token.length,
    },
    data: Buffer.from(response.token, 'base64'),
  };
}
