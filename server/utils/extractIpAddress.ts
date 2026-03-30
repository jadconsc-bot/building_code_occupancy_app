/**
 * Extract Real IP Address from Request Headers
 *
 * Handles all proxy scenarios to extract the real client IP address.
 * Used for audit trail recording in professional review workflows.
 *
 * Priority order:
 * 1. X-Forwarded-For (most common, first IP is client)
 * 2. CF-Connecting-IP (Cloudflare)
 * 3. X-Real-IP (nginx reverse proxy)
 * 4. X-Client-IP (generic)
 * 5. socket.remoteAddress (fallback)
 *
 * PD2.0 §7.1 — NEVER use placeholder IPs (0.0.0.0, 127.0.0.1) in audit trail
 */

import type { IncomingMessage } from "http";

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;

  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 validation (basic)
  const ipv6Regex = /^([\da-f]{0,4}:){2,7}[\da-f]{0,4}$/i;
  if (ipv6Regex.test(ip)) {
    return true;
  }

  return false;
}

/**
 * Extract the real client IP address from request headers.
 * Handles all common proxy configurations.
 */
export function extractIpAddress(req: IncomingMessage | undefined): string {
  if (!req) return "0.0.0.0";

  // Check X-Forwarded-For header (most common for proxies)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = typeof forwarded === "string" ? forwarded.split(",") : forwarded;
    const clientIp = ips[0]?.trim();
    if (clientIp && isValidIp(clientIp)) {
      return clientIp;
    }
  }

  // Check Cloudflare header
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (cfConnectingIp && typeof cfConnectingIp === "string") {
    if (isValidIp(cfConnectingIp)) {
      return cfConnectingIp;
    }
  }

  // Check X-Real-IP header (nginx)
  const xRealIp = req.headers["x-real-ip"];
  if (xRealIp && typeof xRealIp === "string") {
    if (isValidIp(xRealIp)) {
      return xRealIp;
    }
  }

  // Check X-Client-IP header (generic)
  const xClientIp = req.headers["x-client-ip"];
  if (xClientIp && typeof xClientIp === "string") {
    if (isValidIp(xClientIp)) {
      return xClientIp;
    }
  }

  // Fallback to socket remote address
  const socket = (req as any).socket;
  if (socket?.remoteAddress) {
    const remoteIp = socket.remoteAddress;
    if (isValidIp(remoteIp)) {
      return remoteIp;
    }
  }

  // Last resort fallback — log warning in audit trail
  return "0.0.0.0";
}

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(req: IncomingMessage | undefined): string {
  if (!req) return "unknown";
  const userAgent = req.headers["user-agent"];
  return typeof userAgent === "string" ? userAgent : "unknown";
}

/**
 * Extract all audit metadata from request (PD2.0 §7.1)
 */
export function extractAuditMetadata(req: IncomingMessage | undefined) {
  return {
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
    timestamp: new Date().toISOString(),
  };
}
