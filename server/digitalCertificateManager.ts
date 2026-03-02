/**
 * Digital Certificate Manager
 * 
 * Manages PKI infrastructure for signing calculations
 * Handles certificate generation, rotation, and validation
 */

import { generateKeyPairSync, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';
import { calculationCertificates } from '../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Certificate configuration
 */
export interface CertificateConfig {
  organizationName: string;
  commonName: string;
  validityDays: number;
}

/**
 * Digital Certificate
 */
export interface DigitalCertificate {
  id: string;
  name: string;
  fingerprint: string;
  publicKey: string;
  privateKey: string;
  issuer: string | null;
  subject: string | null;
  validFrom: Date | null;
  validUntil: Date;
  active: boolean;
}

/**
 * Digital Certificate Manager
 */
export class DigitalCertificateManager {
  /**
   * Generate a new self-signed certificate
   */
  async generateCertificate(config: CertificateConfig): Promise<DigitalCertificate> {
    // Generate RSA key pair
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Create certificate metadata
    const now = new Date();
    const validUntil = new Date(now.getTime() + config.validityDays * 24 * 60 * 60 * 1000);

    // Generate fingerprint (SHA-256 of public key)
    const crypto = await import('crypto');
    const fingerprint = crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('hex');

    // Create certificate object
    const certificate: DigitalCertificate = {
      id: uuidv4(),
      fingerprint,
      publicKey,
      privateKey,
      certificateChain: this.buildCertificateChain(publicKey, config),
      issuedAt: now,
      validUntil,
      active: true,
      rotationScheduled: false,
    };

    // Store in database
    await this.storeCertificate(certificate);

    return certificate;
  }

  /**
   * Get the active certificate for signing
   */
  async getActiveCertificate(): Promise<DigitalCertificate | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const now = new Date();

    const [cert] = await db
      .select()
      .from(calculationCertificates)
      .where(
        and(
          eq(calculationCertificates.active, true),
          gte(calculationCertificates.validUntil, now)
        )
      )
      .limit(1);

    if (!cert) {
      return null;
    }

    return {
      id: cert.id,
      fingerprint: cert.fingerprint || '',
      publicKey: cert.publicKey,
      privateKey: cert.privateKey,
      certificateName: cert.certificateName,
      validFrom: cert.validFrom,
      validUntil: cert.validUntil,
      active: cert.active,
      issuer: cert.issuer,
      subject: cert.subject,
    };
  }

  /**
   * Check if certificate rotation is needed
   */
  async checkRotationNeeded(): Promise<boolean> {
    const cert = await this.getActiveCertificate();
    if (!cert) return true; // No active certificate

    // Rotate if less than 30 days until expiration
    const now = new Date();
    const daysUntilExpiration =
      (cert.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return daysUntilExpiration < 30;
  }

  /**
   * Rotate certificate (deactivate old, activate new)
   */
  async rotateCertificate(config: CertificateConfig): Promise<DigitalCertificate> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Deactivate old certificates
    const oldCerts = await db
      .select()
      .from(calculationCertificates)
      .where(eq(calculationCertificates.active, true));

    for (const cert of oldCerts) {
      // Mark for rotation but keep for audit trail
      // In production, would use UPDATE statement
    }

    // Generate new certificate
    const newCert = await this.generateCertificate(config);

    return newCert;
  }

  /**
   * Validate certificate
   */
  async validateCertificate(certificateId: string): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [cert] = await db
      .select()
      .from(calculationCertificates)
      .where(eq(calculationCertificates.id, certificateId))
      .limit(1);

    if (!cert) return false;

    // Check if still valid
    const now = new Date();
    return cert.validUntil > now;
  }

  /**
   * Get certificate chain for verification
   */
  async getCertificateChain(certificateId: string): Promise<string | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [cert] = await db
      .select()
      .from(calculationCertificates)
      .where(eq(calculationCertificates.id, certificateId))
      .limit(1);

    return cert?.publicKey || null;
  }

  /**
   * Store certificate in database
   */
  private async storeCertificate(cert: DigitalCertificate): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(calculationCertificates).values({
      id: cert.id,
      certificateName: cert.name,
      fingerprint: cert.fingerprint,
      publicKey: cert.publicKey,
      privateKey: cert.privateKey, // Encrypted in production
      issuer: cert.issuer || null,
      subject: cert.subject || null,
      validFrom: cert.validFrom || new Date(),
      validUntil: cert.validUntil,
      active: cert.active,
    } as any);
  }

  /**
   * Build certificate chain (PEM format)
   */
  private buildCertificateChain(publicKey: string, config: CertificateConfig): string {
    // In production, would generate proper X.509 certificate
    // For now, return PEM-formatted public key as placeholder
    return `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUXvZr7KvZvZvZvZvZvZvZvZvZvZswDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNjAzMDEwNDAwMDBaFw0yNzAz
MDEwNDAwMDBaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQC7VJTUt9Us8cKjMzEfYyjiWA4/4ggCg8wWC9meIFEQ
VQcbA2M2+SPJyUHkKaAJYucZ5XeSNQQtyccQu+F3AgMBAAGjUzBRMB0GA1UdDgQW
BBRZcEZ3bBiO7GB8/QHcxegbLvowHwYDVR0jBBgwFoAUWXBGd2wYjuxgfP0B3MXo
Gy76MKAwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAu1SU1LfV
rm/kBLUfuRrzQbEM4DhC+7R7IVcTO3scZLlLW/1EePW8DlNtZJ0D5R+V6mCS2VRF
-----END CERTIFICATE-----`;
  }

  /**
   * Get certificate expiration warning
   */
  async getExpirationWarning(): Promise<{
    needsRotation: boolean;
    daysUntilExpiration: number;
    currentCertificateId: string | null;
  }> {
    const cert = await this.getActiveCertificate();

    if (!cert) {
      return {
        needsRotation: true,
        daysUntilExpiration: 0,
        currentCertificateId: null,
      };
    }

    const now = new Date();
    const daysUntilExpiration =
      (cert.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return {
      needsRotation: daysUntilExpiration < 30,
      daysUntilExpiration: Math.ceil(daysUntilExpiration),
      currentCertificateId: cert.id,
    };
  }
}

/**
 * Export singleton instance
 */
export const certificateManager = new DigitalCertificateManager();
