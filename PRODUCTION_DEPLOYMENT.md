# Production Deployment Guide

## Pre-Deployment Checklist

### Environment Variables
- [ ] Set `NODE_ENV=production`
- [ ] Configure `OAUTH_SERVER_URL` for production OAuth provider
- [ ] Set `JWT_SECRET` to strong random value (min 32 characters)
- [ ] Configure `DATABASE_URL` for production database
- [ ] Set `VITE_OAUTH_PORTAL_URL` for production OAuth portal
- [ ] Set `VITE_APP_ID` for production OAuth app
- [ ] Configure `VITE_ANALYTICS_ENDPOINT` for analytics tracking
- [ ] Set `VITE_ANALYTICS_WEBSITE_ID` for analytics

### Security Hardening
- [ ] Enable HTTPS/TLS for all endpoints
- [ ] Configure CORS properly (whitelist allowed origins)
- [ ] Set secure cookie flags (HttpOnly, Secure, SameSite=Strict)
- [ ] Enable rate limiting on all public endpoints
- [ ] Configure CSRF protection
- [ ] Set up request deduplication
- [ ] Enable security headers (CSP, X-Frame-Options, etc.)

### Database
- [ ] Run database migrations: `pnpm db:push`
- [ ] Create all required indexes (see `server/_core/database-indexes.sql`)
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Enable query logging and monitoring
- [ ] Test database failover/recovery

### Performance
- [ ] Enable caching layer (Redis or in-memory)
- [ ] Configure CDN for static assets
- [ ] Set up compression (gzip, brotli)
- [ ] Enable HTTP/2
- [ ] Configure connection pooling
- [ ] Set up monitoring and alerting

### Monitoring & Logging
- [ ] Set up centralized logging (ELK, CloudWatch, etc.)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up performance monitoring (New Relic, DataDog, etc.)
- [ ] Create dashboards for key metrics
- [ ] Set up alerts for critical errors
- [ ] Enable audit logging

### Testing
- [ ] Run full test suite: `pnpm test`
- [ ] Run integration tests
- [ ] Load test critical endpoints
- [ ] Security audit/penetration testing
- [ ] Accessibility testing
- [ ] Cross-browser testing

## Deployment Steps

### 1. Build for Production
```bash
pnpm build
```

### 2. Run Database Migrations
```bash
pnpm db:push
```

### 3. Create Database Indexes
```bash
# Execute the SQL in server/_core/database-indexes.sql
# Example with MySQL:
mysql -u user -p database < server/_core/database-indexes.sql
```

### 4. Start Production Server
```bash
NODE_ENV=production node dist/server/_core/index.js
```

### 5. Verify Deployment
```bash
# Check health endpoint
curl https://your-domain.com/health

# Verify OAuth flow
# Test login at https://your-domain.com

# Check monitoring dashboard
# Verify all metrics are being collected
```

## Post-Deployment

### Monitoring
- [ ] Monitor error rates and response times
- [ ] Check database performance
- [ ] Verify OAuth flow is working
- [ ] Monitor rate limits
- [ ] Check cache hit rates

### Optimization
- [ ] Analyze slow queries
- [ ] Optimize database indexes if needed
- [ ] Fine-tune cache TTLs
- [ ] Adjust rate limits based on usage
- [ ] Monitor and optimize resource usage

### Maintenance
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up security updates
- [ ] Monitor for vulnerabilities
- [ ] Plan for scaling

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy, AWS ALB)
- Configure session persistence (sticky sessions or Redis)
- Use distributed cache (Redis)
- Use managed database (RDS, Cloud SQL)

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching
- Use CDN for static assets

### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling (PgBouncer, ProxySQL)
- Sharding for very large datasets
- Archive old data

## Disaster Recovery

### Backup Strategy
- Daily automated backups
- Weekly full backups
- Monthly archival backups
- Test restore procedures regularly

### Recovery Procedures
- Document RTO (Recovery Time Objective)
- Document RPO (Recovery Point Objective)
- Test failover procedures
- Maintain runbooks for common issues

### High Availability
- Multi-region deployment
- Database replication
- Load balancing
- Health checks and auto-recovery

## Security Checklist

### Application Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Authentication/authorization checks
- [ ] Encryption of sensitive data
- [ ] Secure password hashing

### Infrastructure Security
- [ ] Firewall rules
- [ ] VPC/network isolation
- [ ] SSL/TLS certificates
- [ ] DDoS protection
- [ ] Web Application Firewall (WAF)
- [ ] Security group rules
- [ ] IAM roles and permissions

### Monitoring & Incident Response
- [ ] Security event logging
- [ ] Intrusion detection
- [ ] Vulnerability scanning
- [ ] Incident response plan
- [ ] Security team contacts
- [ ] Escalation procedures

## Performance Targets

- Page load time: < 2 seconds
- API response time: < 500ms (p95)
- Database query time: < 100ms (p95)
- Error rate: < 0.1%
- Uptime: > 99.9%

## Rollback Procedure

If deployment fails:

1. Identify the issue
2. Stop the production server
3. Revert to previous version
4. Restart the server
5. Verify functionality
6. Investigate root cause
7. Fix and re-deploy

## Support & Escalation

- On-call engineer: [Contact Info]
- Escalation: [Manager Contact]
- Status page: [URL]
- Incident channel: [Slack/Teams]
