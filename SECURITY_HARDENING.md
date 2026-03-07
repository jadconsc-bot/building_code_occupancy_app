# Security Hardening Guide

## Overview

This document outlines security best practices and hardening measures for the CodeComply application.

## Authentication Security

### OAuth Implementation
The application uses Manus OAuth for authentication. Key security features include:

- Secure token exchange with PKCE support
- Session-based authentication with JWT
- HttpOnly cookies to prevent XSS attacks
- Automatic token refresh and rotation
- Logout functionality with session invalidation

### Password Security
- Passwords are never stored (OAuth-based)
- Session tokens are signed with JWT_SECRET
- JWT_SECRET must be at least 32 characters
- Tokens expire after 30 days
- Refresh tokens are rotated on each use

### Multi-Factor Authentication (Future)
- Plan to implement TOTP-based MFA
- Email verification for account recovery
- Device fingerprinting for anomaly detection

## Authorization & Access Control

### Role-Based Access Control (RBAC)
- User roles: `admin`, `user`
- Admin-only procedures use `adminProcedure`
- Protected procedures use `protectedProcedure`
- Public procedures use `publicProcedure`

### Project Access Control
- Users can only access their own projects
- Sharing is controlled via explicit share links
- Share links have expiration dates
- Revocation is immediate

### Data Isolation
- Database queries filter by `userId`
- No cross-user data access
- Audit logs track all access
- Sensitive data is encrypted

## Input Validation & Sanitization

### Server-Side Validation
- All inputs validated with Zod schemas
- Type-safe validation at tRPC layer
- Reject unexpected fields
- Validate data ranges and formats

### SQL Injection Prevention
- Use parameterized queries (Drizzle ORM)
- Never concatenate user input into SQL
- Validate all database inputs
- Use prepared statements

### XSS Prevention
- Output encoding in React components
- Content Security Policy (CSP) headers
- Sanitize user-generated content
- Use dangerously HTML only when necessary

### CSRF Protection
- CSRF tokens for state-changing operations
- SameSite cookie attribute set to Strict
- Origin validation on API requests
- Double-submit cookie pattern

## Rate Limiting & DDoS Protection

### Rate Limits
- LLM operations: 10 per hour per user
- API calls: 100 per 15 minutes per user
- Login attempts: 5 per 15 minutes per IP
- File uploads: 20 per hour per user
- Report generation: 5 per hour per user

### Implementation
- In-memory rate limiter with TTL
- Per-user and per-IP tracking
- Configurable limits per operation
- Automatic cleanup of expired entries

### DDoS Mitigation
- Use CDN with DDoS protection
- Configure Web Application Firewall (WAF)
- Implement request deduplication
- Monitor for traffic anomalies

## Data Protection

### Encryption at Rest
- Database: Use TLS for connections
- Sensitive fields: Encrypt before storage
- Backups: Encrypt all backup files
- Logs: Redact sensitive information

### Encryption in Transit
- HTTPS/TLS for all connections
- Minimum TLS 1.2
- Strong cipher suites
- Certificate pinning (optional)

### Data Retention
- User data: Keep for account lifetime + 30 days
- Audit logs: Keep for 1 year
- Backups: Keep for 90 days
- Deleted data: Securely wipe

## Session Management

### Cookie Security
- HttpOnly flag: Prevents JavaScript access
- Secure flag: HTTPS only
- SameSite: Strict (prevents CSRF)
- Domain: Specific to application
- Path: Restricted to /api

### Session Timeout
- Idle timeout: 30 minutes
- Absolute timeout: 30 days
- Refresh token rotation: On each use
- Logout: Immediate session invalidation

### Session Fixation Prevention
- Regenerate session ID on login
- Invalidate old sessions
- Bind session to IP address (optional)
- Detect concurrent sessions

## Error Handling & Logging

### Error Messages
- Generic messages to users (no details)
- Detailed logs for developers
- No sensitive data in error messages
- No stack traces in production

### Logging
- Log all authentication attempts
- Log all authorization failures
- Log all data access
- Log all system errors
- Secure log storage

### Monitoring
- Real-time error alerts
- Anomaly detection
- Failed login tracking
- Unusual access patterns

## API Security

### Request Validation
- Validate all input parameters
- Check request size limits
- Validate content types
- Reject unknown fields

### Response Security
- Never expose internal errors
- Redact sensitive data
- Use appropriate HTTP status codes
- Include security headers

### API Rate Limiting
- Per-user rate limits
- Per-IP rate limits
- Burst protection
- Graceful degradation

## Third-Party Security

### Dependencies
- Regular security updates
- Vulnerability scanning (npm audit)
- Dependency pinning
- Review before updating

### OAuth Provider
- Trust Manus OAuth security
- Validate tokens on every request
- Handle token expiration
- Implement token refresh

### External APIs
- Validate SSL certificates
- Use API keys securely
- Implement request signing
- Monitor for suspicious activity

## Infrastructure Security

### Server Configuration
- Disable unnecessary services
- Enable firewall
- Configure security groups
- Use VPN for admin access

### Database Security
- Restrict network access
- Use strong passwords
- Enable encryption
- Regular backups
- Monitor access logs

### Secrets Management
- Never commit secrets to git
- Use environment variables
- Rotate secrets regularly
- Audit secret access
- Use secrets manager (AWS Secrets Manager, etc.)

## Compliance & Auditing

### Audit Logging
- Log all user actions
- Log all data access
- Log all system changes
- Immutable audit logs
- Regular audit log review

### Data Privacy
- GDPR compliance
- Privacy policy
- Consent management
- Data export functionality
- Right to be forgotten

### Security Audits
- Regular penetration testing
- Code security reviews
- Dependency audits
- Infrastructure audits
- Compliance audits

## Incident Response

### Incident Plan
- Incident detection
- Incident classification
- Response procedures
- Communication plan
- Post-incident review

### Security Contacts
- Security team lead: [Contact]
- Incident commander: [Contact]
- External contacts: [Contact]
- Escalation procedures: [Defined]

## Security Checklist

Before deployment, verify:

- [ ] All dependencies updated
- [ ] No hardcoded secrets
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] Error handling secure
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backups tested
- [ ] Incident plan ready
- [ ] Team trained

## Regular Security Tasks

- Weekly: Review error logs
- Monthly: Security updates
- Quarterly: Penetration testing
- Annually: Full security audit
- Continuously: Monitor for vulnerabilities
