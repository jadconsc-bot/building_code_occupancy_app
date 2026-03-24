/**
 * IP Address Extraction Utility
 *
 * Extracts real client IP from request headers, handling various proxy scenarios.
 * Used for audit trail logging to ensure legal defensibility.
 *
 * Supports:
 * - Direct connections (socket.remoteAddress)
 * - AWS/Heroku (X-Forwarded-For)
 * - Cloudflare (CF-Connecting-IP, True-Client-IP)
 * - Nginx (X-Real-IP)
 */

/**
 * Extract real client IP from request
 * Handles proxies (AWS, Cloudflare, Nginx, etc.)
 *
 * @param req - Express request object
 * @returns Client IP address or 'unknown'
 */
export function extractClientIp(req: any): string {
  // Try x-forwarded-for (most common for proxies)
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    // x-forwarded-for can be "client-ip, proxy1-ip, proxy2-ip"
    // We want the first (original client)
    const clientIp = xForwardedFor.split(',')[0].trim();
    if (isValidIp(clientIp)) {
      return clientIp;
    }
  }

  // Try cf-connecting-ip (Cloudflare)
  const cfConnectingIp = req.headers?.['cf-connecting-ip'];
  if (cfConnectingIp && isValidIp(cfConnectingIp)) {
    return cfConnectingIp;
  }

  // Try x-real-ip (Nginx)
  const xRealIp = req.headers?.['x-real-ip'];
  if (xRealIp && isValidIp(xRealIp)) {
    return xRealIp;
  }

  // Try true-client-ip (Cloudflare fallback)
  const trueClientIp = req.headers?.['true-client-ip'];
  if (trueClientIp && isValidIp(trueClientIp)) {
    return trueClientIp;
  }

  // Try socket remote address (direct connection)
  if (req.socket?.remoteAddress) {
    const remoteAddr = req.socket.remoteAddress;
    if (isValidIp(remoteAddr)) {
      return remoteAddr;
    }
  }

  // Try req.ip (Express middleware)
  if (req.ip && isValidIp(req.ip)) {
    return req.ip;
  }

  // Last resort fallback
  return 'unknown';
}

/**
 * Validate IP is real (not obviously fake)
 *
 * @param ip - IP address string
 * @returns true if valid IPv4 or IPv6
 */
export function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown' || typeof ip !== 'string') {
    return false;
  }

  // Check if looks like IPv4
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // Check if looks like IPv6
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Pattern.test(ip)) {
    return true;
  }

  return false;
}

/**
 * Extract user agent from request
 *
 * @param req - Express request object
 * @returns User agent string or 'unknown'
 */
export function extractUserAgent(req: any): string {
  const userAgent = req.headers?.['user-agent'];
  return userAgent || 'unknown';
}

/**
 * Extract timestamp from request (server-side, not client-side)
 * Ensures audit trail has server-verified timestamps
 *
 * @returns Current timestamp in UTC
 */
export function extractTimestamp(): Date {
  return new Date();
}
