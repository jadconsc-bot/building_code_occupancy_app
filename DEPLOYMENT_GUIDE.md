# Deployment & Operations Guide

**Version**: 1.0  
**Last Updated**: March 2, 2026  
**Status**: Production Ready (with caveats)

---

## 📋 Pre-Deployment Checklist

### Environment Configuration
- [ ] All environment variables configured (see `.env.example`)
- [ ] Database migrations completed (`pnpm db:push`)
- [ ] Database backups configured
- [ ] Redis cache configured (if using caching)
- [ ] S3 storage configured for file uploads

### Security
- [ ] HTTPS enforced on all endpoints
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] JWT secret is strong (32+ characters)
- [ ] Session cookie maxAge set to 30 days
- [ ] CSRF protection enabled

### Testing
- [ ] All unit tests passing (`pnpm test`)
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] OAuth flow tested end-to-end

### Monitoring
- [ ] Error logging configured
- [ ] Performance monitoring enabled
- [ ] Health check endpoint working
- [ ] Alerting configured

---

## 🚀 Deployment Steps

### 1. Prepare Environment

```bash
# Install dependencies
pnpm install

# Build application
pnpm build

# Run tests
pnpm test

# Check environment
node scripts/diagnose-login.mjs
```

### 2. Configure Environment Variables

Create `.env` file with all required variables:

```env
# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your_app_id

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# Database
DATABASE_URL=mysql://user:password@host:3306/dbname

# Owner
OWNER_OPEN_ID=owner_id
OWNER_NAME=Owner Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key

# Roboflow — floor plan room segmentation
# Get private API key from app.roboflow.com/settings/api
# Workspace: jose-acevedo  Model: codecomply/7
# Workflow:  detect-count-and-visualize (instance segmentation + count + annotated image)
ROBOFLOW_API_KEY=your_roboflow_private_api_key

# Environment
NODE_ENV=production
```

#### Roboflow integration notes

The `ROBOFLOW_API_KEY` is required. The integration calls two workflows:

| Workflow | Purpose | Service file |
|---|---|---|
| `floorplan-segmentation-1781153513487` | Legacy polygon extraction (Sprint 0) | `server/services/roboflowSegmentationService.ts` |
| `detect-count-and-visualize` | Room detection + count + annotated image | `server/services/detectCountVisualizeService.ts` |

Smoke test (requires `ROBOFLOW_API_KEY` in env):
```bash
DOTENV_CONFIG_PATH=.env.local npx tsx server/scripts/smokeDetectCountVisualize.ts --save
# Writes annotated PNG to /tmp/dcv_annotated.jpg
```

Accuracy baseline (after analyses have run):
```bash
DOTENV_CONFIG_PATH=.env.local npx tsx server/scripts/accuracyReport.ts
```

### 3. Database Setup

```bash
# Generate migrations
pnpm db:push

# Verify database connection
node scripts/diagnose-login.mjs

# Create indexes
pnpm db:execute "CREATE INDEX idx_projects_user_id ON projects(user_id);"
pnpm db:execute "CREATE INDEX idx_users_openid ON users(openId);"
```

### 4. Start Application

```bash
# Development
pnpm dev

# Production
pnpm build
NODE_ENV=production node dist/server.js

# With PM2
pm2 start dist/server.js --name "codecomply"
```

### 5. Verify Deployment

```bash
# Check health
curl https://your-domain.com/health

# Check OAuth
curl https://your-domain.com/api/oauth/callback

# Check tRPC
curl https://your-domain.com/api/trpc/auth.me
```

---

## 📊 Monitoring & Maintenance

### Health Checks

Monitor these endpoints:
- `GET /health` - Application health
- `GET /api/trpc/auth.me` - Auth system health
- `GET /api/trpc/subscription.getCurrent` - Subscription system health

### Key Metrics to Monitor

1. **API Response Time**
   - Target: < 200ms (p95)
   - Alert: > 500ms

2. **Error Rate**
   - Target: < 0.1%
   - Alert: > 1%

3. **Database Connections**
   - Target: < 50% of pool
   - Alert: > 80% of pool

4. **Rate Limit Hits**
   - Monitor for DDoS patterns
   - Alert: > 100 hits/minute from single IP

### Log Monitoring

Monitor these log patterns:

```
[tRPC] - Track all API calls
[Auth] - Track authentication events
[Error] - Track all errors
[Security] - Track security events
[Env] - Track environment validation
```

### Database Maintenance

```bash
# Weekly: Analyze tables
ANALYZE TABLE projects;
ANALYZE TABLE users;
ANALYZE TABLE subscriptions;

# Monthly: Optimize tables
OPTIMIZE TABLE projects;
OPTIMIZE TABLE users;
OPTIMIZE TABLE subscriptions;

# Quarterly: Backup
mysqldump -u user -p database > backup-$(date +%Y%m%d).sql
```

---

## 🔒 Security Operations

### Regular Security Tasks

**Weekly:**
- Review error logs for suspicious patterns
- Check rate limit logs for attacks
- Verify all security headers present

**Monthly:**
- Rotate JWT secret (if needed)
- Review user access logs
- Audit admin actions

**Quarterly:**
- Security audit
- Dependency updates
- Penetration testing

### Incident Response

**If Rate Limiting Triggered:**
```bash
# Check logs
tail -f logs/security.log | grep "rate_limit"

# Identify attacker IP
grep "rate_limit" logs/security.log | awk '{print $3}' | sort | uniq -c

# Block IP (if needed)
# Add to firewall/WAF
```

**If Database Connection Fails:**
```bash
# Check connection
node scripts/diagnose-login.mjs

# Verify credentials
echo $DATABASE_URL

# Test connection
mysql -u user -p -h host dbname -e "SELECT 1;"
```

**If OAuth Fails:**
```bash
# Check OAuth logs
tail -f logs/oauth.log

# Verify redirect URI registered
# Check VITE_APP_ID and VITE_OAUTH_PORTAL_URL

# Test OAuth flow manually
curl "https://oauth.manus.im/authorize?client_id=..."
```

---

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Setup**
   - Use sticky sessions for tRPC
   - Configure health checks
   - Set connection timeout to 30s

2. **Database Scaling**
   - Add read replicas for queries
   - Use connection pooling (min: 5, max: 20)
   - Monitor query performance

3. **Cache Layer**
   - Add Redis for session storage
   - Cache subscription info (TTL: 1 hour)
   - Cache user projects (TTL: 5 minutes)

### Performance Optimization

```typescript
// Enable query caching
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Add indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_usage_metrics_user_id ON usageMetrics(userId);
```

---

## 🛠️ Troubleshooting

### Common Issues

**Issue: "Database connection failed"**
```bash
# Solution:
1. Check DATABASE_URL format
2. Verify database is running
3. Check network connectivity
4. Verify credentials
5. Run: node scripts/diagnose-login.mjs
```

**Issue: "OAuth callback fails"**
```bash
# Solution:
1. Verify VITE_APP_ID is correct
2. Check redirect URI is registered
3. Verify VITE_OAUTH_PORTAL_URL
4. Check OAuth server is reachable
5. Review OAuth logs
```

**Issue: "Rate limiting too strict"**
```bash
# Solution:
1. Adjust limits in server/_core/security.ts
2. Increase for specific operations
3. Whitelist trusted IPs
4. Implement per-user limits
```

**Issue: "High memory usage"**
```bash
# Solution:
1. Check for memory leaks
2. Reduce cache TTL
3. Implement pagination
4. Monitor with: node --inspect
```

---

## 📞 Support & Escalation

### Internal Support
- **Security Issues**: Contact security@company.com
- **Database Issues**: Contact dba@company.com
- **Performance Issues**: Contact devops@company.com

### External Support
- **Manus Platform**: https://help.manus.im
- **OAuth Issues**: OAuth provider support
- **Database Support**: MySQL/TiDB support

---

## 📝 Runbooks

### Daily Checks
```bash
#!/bin/bash
# Check health
curl -s https://your-domain.com/health | jq .

# Check error rate
tail -100 logs/error.log | wc -l

# Check database
mysql -e "SELECT COUNT(*) FROM users;"
```

### Weekly Maintenance
```bash
#!/bin/bash
# Backup database
mysqldump -u user -p database > backups/backup-$(date +%Y%m%d).sql

# Analyze tables
mysql -e "ANALYZE TABLE projects; ANALYZE TABLE users;"

# Review logs
grep "ERROR" logs/error.log | tail -20
```

### Monthly Review
```bash
# Review metrics
# - API response times
# - Error rates
# - Database performance
# - Rate limit hits

# Update dependencies
pnpm update

# Run security audit
pnpm audit
```

---

## 🎯 Performance Targets

| Metric | Target | Alert |
|--------|--------|-------|
| API Response Time (p95) | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| Database Connection Pool | < 50% | > 80% |
| Cache Hit Rate | > 80% | < 60% |
| Uptime | > 99.9% | < 99% |

---

## 📚 Additional Resources

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API_DOCS.md)
- [Security Best Practices](./SECURITY.md)
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [Login Flow Documentation](./LOGIN_FLOW_DOCUMENTATION.md)

---

**Last Updated**: March 2, 2026  
**Next Review**: March 9, 2026
