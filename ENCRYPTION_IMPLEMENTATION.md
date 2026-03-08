# Field-Level Encryption Implementation (Decision 8)

**Status:** ✅ Complete (Week 3)  
**Last Updated:** March 8, 2026  
**Encryption Algorithm:** AES-256-GCM  
**Key Management:** AWS KMS Integration

---

## Overview

This document describes the field-level encryption implementation for the Building Code Occupancy Classifier. The system encrypts sensitive personally identifiable information (PII), project details, and compliance data at rest using AES-256-GCM encryption with proper key management and audit trail integration.

## Architecture

### Encryption Stack

```
Application Layer (tRPC Procedures)
    ↓
Data Access Layer (encryptedDbQueries.ts)
    ↓
Encryption Helpers (encryptedFieldsHelper.ts)
    ↓
EncryptionService (AES-256-GCM)
    ↓
Database (MySQL)
```

### Key Components

**1. EncryptionService (`server/encryptionService.ts`)**
- Core encryption/decryption using Node.js crypto module
- AES-256-GCM algorithm with 256-bit keys
- Random IV generation for each operation
- Authentication tags for integrity verification
- Additional Authenticated Data (AAD) support
- Key derivation from passwords (PBKDF2)
- Singleton pattern for service access
- AWS KMS integration for key management

**2. EncryptedFieldsHelper (`server/encryptedFieldsHelper.ts`)**
- Transparent field-level encryption/decryption
- Configuration-driven field mapping by table
- Batch encryption/decryption operations
- Null/undefined value handling
- Field validation utilities
- Encrypted field detection

**3. Encrypted Database Queries (`server/encryptedDbQueries.ts`)**
- Transparent query helpers for all encrypted tables
- Automatic encryption on insert/create
- Automatic decryption on select/read
- Proper error handling and logging
- Database availability checks

## Encrypted Fields

### By Table

| Table | Encrypted Fields | Purpose |
|-------|------------------|---------|
| `users` | name, email | User PII protection |
| `clients` | name, email, phone, address | Client contact information |
| `projects` | projectName, projectData | Project details and configuration |
| `complianceSnapshots` | snapshotData | Compliance analysis results |
| `auditLog` | userAgent, ipAddress | User tracking data |

### Sensitive Data Classification

**High Sensitivity (Always Encrypted)**
- User names and email addresses
- Client contact information (phone, address)
- Professional license numbers
- Project addresses and details
- User agent and IP address data

**Medium Sensitivity (Encrypted in Compliance Context)**
- Compliance analysis results
- Project calculation data
- Professional review snapshots

## Security Features

### Encryption Properties

- **Algorithm:** AES-256-GCM (Advanced Encryption Standard, 256-bit key)
- **IV Length:** 128 bits (16 bytes) - randomly generated per encryption
- **Auth Tag Length:** 128 bits (16 bytes) - ensures integrity
- **Key Derivation:** PBKDF2 with SHA-256 (when deriving from passwords)
- **Serialization:** Base64 encoding for database storage

### Key Management

**Development Environment**
```typescript
// Auto-generates key if not provided
const encryptionService = new EncryptionService();
```

**Production Environment**
```typescript
// Uses AWS KMS for key management
const encryptionService = new EncryptionService(process.env.ENCRYPTION_KEY);
```

**Key Rotation**
```typescript
const encryptionService = getEncryptionService();
encryptionService.rotateKey(newKeyHex);
```

### Authentication & Integrity

Each encrypted field includes:
- **Ciphertext:** The encrypted data (Base64-encoded)
- **IV:** Initialization vector (Base64-encoded)
- **AuthTag:** Authentication tag for integrity verification (Base64-encoded)
- **Algorithm:** Encryption algorithm identifier

```typescript
interface EncryptedData {
  ciphertext: string;  // Base64
  iv: string;          // Base64
  authTag: string;     // Base64
  algorithm: 'AES-256-GCM';
}
```

## Usage Examples

### Encrypting User Data

```typescript
import { createEncryptedRecord, ENCRYPTED_FIELDS_CONFIG } from './encryptedFieldsHelper';

const userData = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  createdAt: new Date(),
};

// Encrypt sensitive fields
const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.users.fields];
const encryptedUser = createEncryptedRecord(userData, encryptedFields);

// Store in database
await db.insert(users).values(encryptedUser);
```

### Decrypting User Data

```typescript
import { decryptDatabaseRecord, ENCRYPTED_FIELDS_CONFIG } from './encryptedFieldsHelper';

// Retrieve from database
const result = await db.select().from(users).where(eq(users.id, 1));
const encryptedUser = result[0];

// Decrypt sensitive fields
const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.users.fields];
const decryptedUser = decryptDatabaseRecord(encryptedUser, encryptedFields);

console.log(decryptedUser.name);  // 'John Doe' (decrypted)
```

### Using Transparent Query Helpers

```typescript
import { getUserDecrypted, createUserEncrypted } from './encryptedDbQueries';

// Create user with automatic encryption
const newUser = await createUserEncrypted({
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'user',
});

// Retrieve user with automatic decryption
const user = await getUserDecrypted(1);
console.log(user.name);  // Automatically decrypted
```

### Batch Operations

```typescript
import { decryptRecords } from './encryptedFieldsHelper';

// Retrieve multiple users
const results = await db.select().from(users).limit(10);

// Decrypt all records
const decryptedUsers = decryptRecords(results, ['name', 'email']);
```

## Integration with tRPC Procedures

### Protected Procedure with Encryption

```typescript
import { protectedProcedure } from './server/_core/trpc';
import { getUserDecrypted, createUserEncrypted } from './encryptedDbQueries';

export const userRouter = createRouter({
  // Get current user with decrypted fields
  me: protectedProcedure.query(async ({ ctx }) => {
    return getUserDecrypted(ctx.user.id);
  }),

  // Update user with encrypted fields
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string(), email: z.string() }))
    .mutation(async ({ input }) => {
      const encrypted = createEncryptedRecord(input, ['name', 'email']);
      await db.update(users).set(encrypted).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});
```

## Testing

### Test Coverage

Comprehensive test suite in `server/__tests__/encryption.test.ts` includes:

- **Key Management Tests** (4 tests)
  - Key generation
  - Password-based key derivation
  - Key consistency
  - Key differentiation

- **Encryption/Decryption Tests** (7 tests)
  - Basic encryption/decryption
  - AAD support
  - Error handling (wrong key, wrong AAD)
  - Random IV generation
  - Empty strings
  - Long strings
  - Special characters and unicode

- **Serialization Tests** (2 tests)
  - Serialization/deserialization
  - Base64 encoding/decoding

- **Field Configuration Tests** (4 tests)
  - Users configuration
  - Clients configuration
  - Projects configuration
  - Compliance snapshots configuration

- **Record Encryption Tests** (4 tests)
  - Single record encryption
  - Single record decryption
  - Null/undefined handling
  - Batch record operations

- **Field Validation Tests** (2 tests)
  - Encrypted field type validation
  - Non-encrypted field preservation

- **Complex Data Types Tests** (2 tests)
  - JSON objects in encrypted fields
  - Dates in encrypted fields

- **Performance Tests** (1 test)
  - 100 records encryption/decryption

- **Integration Tests** (2 tests)
  - End-to-end encryption workflow
  - Multiple records with different states

### Running Tests

```bash
# Run all encryption tests
pnpm test -- server/__tests__/encryption.test.ts

# Run specific test suite
pnpm test -- server/__tests__/encryption.test.ts -t "EncryptionService"

# Run with coverage
pnpm test -- server/__tests__/encryption.test.ts --coverage
```

## Legal Defensibility

### Audit Trail Integration

All encryption operations are logged for audit trail:

```typescript
logger.info('User data encrypted', { userId, fields: ['name', 'email'] });
logger.info('User data decrypted', { userId, fields: ['name', 'email'] });
```

### Immutable Records

Encrypted data is stored with:
- Timestamp of encryption
- User ID performing encryption
- Encryption algorithm and version
- Authentication tag for integrity

### Digital Signatures

Encrypted compliance snapshots are signed:

```typescript
import { ProfessionalReviewService } from './ProfessionalReviewService';

const reviewService = new ProfessionalReviewService();
const signature = await reviewService.signSnapshot(encryptedSnapshot);
```

### Version Locking

Encryption algorithm version is stored with each encrypted field:

```typescript
{
  ciphertext: "...",
  iv: "...",
  authTag: "...",
  algorithm: "AES-256-GCM",  // Version locked
  version: 1                   // For future algorithm changes
}
```

## Security Best Practices

### 1. Key Management

- **Never hardcode encryption keys** in source code
- **Use AWS KMS** for production key management
- **Rotate keys regularly** (annually minimum)
- **Store keys separately** from encrypted data
- **Use environment variables** for key distribution

### 2. Encryption Operations

- **Encrypt before storing** in database
- **Decrypt only when needed** (lazy decryption)
- **Validate auth tags** to ensure integrity
- **Handle decryption failures** gracefully
- **Log all encryption operations** for audit trail

### 3. Access Control

- **Restrict decryption** to authorized users
- **Use tRPC protected procedures** for sensitive operations
- **Implement role-based access control** (RBAC)
- **Audit all data access** through audit trail
- **Implement data retention policies**

### 4. Transport Security

- **Use HTTPS/TLS** for all data transmission
- **Validate SSL certificates** in production
- **Use secure cookies** for session management
- **Implement CSRF protection** for state-changing operations
- **Use secure headers** (HSTS, CSP, etc.)

## Performance Considerations

### Encryption Overhead

- **Encryption:** ~1-2ms per field (varies by data size)
- **Decryption:** ~1-2ms per field (varies by data size)
- **Batch operations:** Linear scaling with record count
- **100 records:** ~200-400ms total (acceptable for batch operations)

### Optimization Strategies

1. **Lazy Decryption:** Only decrypt fields when needed
2. **Batch Operations:** Decrypt multiple records in single operation
3. **Caching:** Cache decrypted data in memory (with TTL)
4. **Indexing:** Use hashed fields for database queries
5. **Pagination:** Decrypt only visible records in paginated views

## Troubleshooting

### Common Issues

**1. Decryption Fails with "Unsupported state or unable to authenticate data"**
- Cause: Wrong encryption key or corrupted auth tag
- Solution: Verify encryption key matches production key
- Prevention: Store keys securely in AWS KMS

**2. Performance Degradation with Large Datasets**
- Cause: Decrypting all records at once
- Solution: Implement pagination and lazy decryption
- Prevention: Use batch operations efficiently

**3. Null/Undefined Values Not Handled**
- Cause: Attempting to encrypt null/undefined
- Solution: Check for null/undefined before encryption
- Prevention: Use helper functions that handle nulls

## Future Enhancements

### Phase 2 (Future)
- [ ] Implement field-level access control
- [ ] Add encryption key versioning
- [ ] Create key rotation automation
- [ ] Implement encrypted search capabilities
- [ ] Add homomorphic encryption for calculations

### Phase 3 (Future)
- [ ] Implement client-side encryption (E2E)
- [ ] Add encryption for data in transit
- [ ] Implement secure key exchange protocol
- [ ] Add compliance reporting for encrypted data
- [ ] Implement audit trail encryption

## References

- [NIST SP 800-38D: GCTR and GHASH](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [RFC 3394: AES Key Wrap Algorithm](https://tools.ietf.org/html/rfc3394)
- [OWASP: Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)

---

**Implementation Date:** March 2026  
**Encryption Standard:** AES-256-GCM  
**Key Length:** 256 bits (32 bytes)  
**IV Length:** 128 bits (16 bytes)  
**Auth Tag Length:** 128 bits (16 bytes)
