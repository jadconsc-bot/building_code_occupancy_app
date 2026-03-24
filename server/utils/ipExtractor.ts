/**
 * Extract real IP address from request
 * Handles proxied requests (AWS, Cloudflare, etc.)
 */
export function extractIpAddress(req: any): string {
  // Try x-forwarded-for (proxy header)
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    return (forwardedFor as string).split(',')[0].trim();
  }

  // Try x-real-ip (nginx proxy)
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return realIp as string;
  }

  // Try socket remote address
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress as string;
  }

  // Try req.ip (Express)
  if (req.ip) {
    return req.ip as string;
  }

  // Fallback
  return 'unknown';
}
