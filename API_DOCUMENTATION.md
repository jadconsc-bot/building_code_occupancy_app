# API Documentation

**Version**: 1.0  
**Last Updated**: March 2, 2026  
**Base URL**: `/api/trpc`

---

## Authentication

All protected endpoints require an authenticated user session via OAuth.

### Session Management
- Sessions are stored in HTTP-only cookies
- Session timeout: 30 days
- Automatic refresh on activity

### Error Responses

All errors follow the tRPC error format:

```json
{
  "error": {
    "code": "UNAUTHORIZED|FORBIDDEN|NOT_FOUND|BAD_REQUEST|INTERNAL_SERVER_ERROR|TOO_MANY_REQUESTS",
    "message": "Human-readable error message"
  }
}
```

---

## Endpoints

### Auth Router (`auth.*`)

#### `auth.me` (Query)
Get current authenticated user.

**Authentication**: Required  
**Rate Limit**: 100/15min

**Response**:
```typescript
{
  id: number;
  openId: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```typescript
const user = await trpc.auth.me.useQuery();
```

#### `auth.logout` (Mutation)
Logout current user.

**Authentication**: Required  
**Rate Limit**: 100/15min

**Response**:
```typescript
{ success: boolean }
```

**Example**:
```typescript
const logout = trpc.auth.logout.useMutation();
await logout.mutateAsync();
```

---

### Project Router (`projects.*`)

#### `projects.list` (Query)
Get all projects for current user.

**Authentication**: Required  
**Rate Limit**: 100/15min

**Response**:
```typescript
Array<{
  id: number;
  userId: number;
  name: string;
  description: string | null;
  occupancyCode: string | null;
  buildingType: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Example**:
```typescript
const projects = await trpc.projects.list.useQuery();
```

#### `projects.get` (Query)
Get a single project.

**Authentication**: Required  
**Input**:
```typescript
{ id: number }
```

**Response**: Single project object (see list response)

**Example**:
```typescript
const project = await trpc.projects.get.useQuery({ id: 1 });
```

#### `projects.create` (Mutation)
Create a new project.

**Authentication**: Required  
**Input**:
```typescript
{
  name: string;           // 1-255 chars
  description?: string;
  occupancyCode?: string;
  buildingType?: string;
}
```

**Response**: Created project object

**Example**:
```typescript
const create = trpc.projects.create.useMutation();
const project = await create.mutateAsync({
  name: "Downtown Office Building",
  occupancyCode: "D",
  buildingType: "Commercial"
});
```

#### `projects.update` (Mutation)
Update a project.

**Authentication**: Required  
**Input**:
```typescript
{
  id: number;
  name?: string;
  description?: string;
  occupancyCode?: string;
  buildingType?: string;
}
```

**Response**: Updated project object

#### `projects.delete` (Mutation)
Delete a project.

**Authentication**: Required  
**Input**: `{ id: number }`

**Response**: `{ success: boolean }`

#### `projects.stats` (Query)
Get project statistics.

**Authentication**: Required  
**Input**: `{ id: number }`

**Response**:
```typescript
{
  totalResults: number;
  totalChecklistItems: number;
  completedChecklistItems: number;
  completionPercentage: number;
}
```

---

### Compliance Router (`compliance.*`)

#### `compliance.analyzePlan` (Mutation)
Analyze a building plan for code compliance.

**Authentication**: Required  
**Rate Limit**: 10/hour per user  
**Cost**: $0.50 per analysis

**Input**:
```typescript
{
  planDescription: string;  // 10-5000 chars
  occupancyType: string;
  buildingType?: string;
  province?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  infractions: Array<{
    code: string;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    requirement: string;
    remediation: string;
  }>;
  summary: string;
  error?: string;
}
```

**Example**:
```typescript
const analyze = trpc.compliance.analyzePlan.useMutation();
const result = await analyze.mutateAsync({
  planDescription: "2-story residential building...",
  occupancyCode: "C"
});
```

#### `compliance.analyzeDrawing` (Mutation)
Analyze a building drawing for code compliance.

**Authentication**: Required  
**Rate Limit**: 10/hour per user  
**Cost**: $0.75 per analysis

**Input**:
```typescript
{
  imageUrl: string;  // Valid URL
  occupancyType: string;
  analysisType: 'structural' | 'egress' | 'fire-safety' | 'accessibility';
}
```

**Response**:
```typescript
{
  success: boolean;
  findings: Array<{
    location: string;
    issue: string;
    severity: 'critical' | 'major' | 'minor';
    code_reference: string;
    remediation: string;
  }>;
  summary: string;
  error?: string;
}
```

---

### Subscription Router (`subscription.*`)

#### `subscription.getCurrent` (Query)
Get current subscription info.

**Authentication**: Required  
**Rate Limit**: 100/15min

**Response**:
```typescript
{
  userId: number;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'suspended';
  monthlyPrice: number;      // in cents
  monthlyLimit: number;      // operations per month
  features: string[];
  description: string;
}
```

#### `subscription.getPlans` (Query)
Get all available subscription plans.

**Authentication**: Not required  
**Rate Limit**: 100/15min

**Response**:
```typescript
Array<{
  tier: 'free' | 'pro' | 'enterprise';
  monthlyPrice: number;
  monthlyLimit: number;
  features: string[];
  description: string;
}>
```

#### `subscription.upgrade` (Mutation)
Upgrade to a higher tier.

**Authentication**: Required  
**Input**: `{ tier: 'pro' | 'enterprise' }`

**Response**: Updated subscription object

#### `subscription.downgrade` (Mutation)
Downgrade to a lower tier.

**Authentication**: Required  
**Input**: `{ tier: 'free' | 'pro' }`

**Response**: Updated subscription object

#### `subscription.cancel` (Mutation)
Cancel subscription.

**Authentication**: Required  
**Response**: `{ success: boolean }`

#### `subscription.getUsage` (Query)
Get usage statistics.

**Authentication**: Required  
**Response**:
```typescript
{
  subscriptionInfo: {
    monthlyLimit: number;
    monthlyUsage: number;
    remainingQuota: number;
  };
  monthlySpending: string;  // in dollars
  usageBreakdown: Record<string, {
    count: number;
    cost: number;
  }>;
}
```

#### `subscription.checkQuota` (Query)
Check if user has quota for an operation.

**Authentication**: Required  
**Input**: `{ operation: string }`

**Response**:
```typescript
{
  hasQuota: boolean;
  remainingQuota: number;
  monthlyLimit: number;
  monthlyUsage: number;
}
```

---

## Rate Limiting

Rate limits are enforced per user/IP:

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 | 15 minutes |
| LLM Operations | 10 | 1 hour |
| Auth Operations | 5 | 1 minute |

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1646256000
```

**When Limit Exceeded**:
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Please try again later."
  }
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| UNAUTHORIZED | 401 | User not authenticated |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| BAD_REQUEST | 400 | Invalid input |
| CONFLICT | 409 | Resource already exists |
| TOO_MANY_REQUESTS | 429 | Rate limit exceeded |
| INTERNAL_SERVER_ERROR | 500 | Server error |

---

## Subscription Tiers

### Free
- **Price**: $0/month
- **Operations/month**: 10
- **Features**:
  - Basic occupancy classification
  - Limited plan analysis
  - Community support

### Pro
- **Price**: $29.99/month
- **Operations/month**: 500
- **Features**:
  - Unlimited occupancy classification
  - Advanced plan analysis
  - Drawing analysis
  - Report generation
  - Email support

### Enterprise
- **Price**: $99.99/month
- **Operations/month**: 10,000
- **Features**:
  - Everything in Pro
  - Unlimited operations
  - Priority support
  - Custom integrations
  - Dedicated account manager
  - API access

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters**:
```typescript
{
  limit?: number;   // default: 10, max: 100
  offset?: number;  // default: 0
}
```

**Response**:
```typescript
{
  items: Array<T>;
  total: number;
  limit: number;
  offset: number;
}
```

---

## Filtering & Sorting

Supported query parameters vary by endpoint. Check individual endpoint documentation.

**Example**:
```typescript
// Get projects sorted by creation date
trpc.projects.list.useQuery({
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

---

## Webhooks

Webhooks are not currently supported. Check back for updates.

---

## SDK Usage

### JavaScript/TypeScript

```typescript
import { trpc } from '@/lib/trpc';

// Query
const user = await trpc.auth.me.useQuery();

// Mutation
const logout = trpc.auth.logout.useMutation();
await logout.mutateAsync();

// With loading state
const { data, isLoading, error } = trpc.projects.list.useQuery();
```

### Error Handling

```typescript
try {
  await trpc.projects.create.mutateAsync({ name: 'Project' });
} catch (error) {
  if (error instanceof TRPCClientError) {
    console.error(error.data.code, error.message);
  }
}
```

---

## Changelog

### v1.0 (March 2, 2026)
- Initial API release
- Auth, Projects, Compliance, Subscription routers
- Rate limiting
- Error handling

---

## Support

For API questions and issues:
- **Documentation**: https://help.manus.im
- **Status Page**: https://status.manus.im
- **Support Email**: support@manus.im

---

**Last Updated**: March 2, 2026  
**Next Review**: March 9, 2026
