import { describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import { CalculationEngine } from '../calculationEngine';
import { DigitalCertificateManager } from '../digitalCertificateManager';

describe('CalculationEngine RSA signatures', () => {
  const keys = () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  it('signs and verifies, while detecting tampering and wrong keys', () => {
    const a = keys(); const b = keys(); const engine = new CalculationEngine(); const inputs = { width: 4 }; const outputs = { result: 8 }; const timestamp = 1700000000000;
    const signature = engine.signCalculation(inputs, outputs, 42, timestamp, a.privateKey);
    expect(engine.verifySignature(inputs, outputs, 42, timestamp, signature, a.publicKey)).toBe(true);
    expect(engine.verifySignature({ width: 5 }, outputs, 42, timestamp, signature, a.publicKey)).toBe(false);
    expect(engine.verifySignature(inputs, { result: 9 }, 42, timestamp, signature, a.publicKey)).toBe(false);
    expect(engine.verifySignature(inputs, outputs, 42, timestamp, 'garbage', a.publicKey)).toBe(false);
    expect(engine.verifySignature(inputs, outputs, 42, timestamp, signature, b.publicKey)).toBe(false);
  });
});

describe('DigitalCertificateManager.getOrCreateActiveCertificate', () => {
  it('reuses an active certificate and generated keys sign and verify', async () => {
    const manager = new DigitalCertificateManager();
    const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    const generated = { id: 'cert-1', name: 'calculation-signing', fingerprint: 'fp', publicKey: pair.publicKey, privateKey: pair.privateKey, issuer: 'CodeComply', subject: 'calculation-signing', validFrom: new Date(), validUntil: new Date(Date.now() + 86400000), active: true };
    const getActive = vi.spyOn(manager, 'getActiveCertificate').mockResolvedValueOnce(null).mockResolvedValueOnce(generated);
    const generate = vi.spyOn(manager, 'generateCertificate').mockResolvedValue(generated);
    const first = await manager.getOrCreateActiveCertificate(); const second = await manager.getOrCreateActiveCertificate();
    expect(first.id).toBe(second.id); expect(generate).toHaveBeenCalledTimes(1); expect(getActive).toHaveBeenCalledTimes(2);
    const signer = crypto.createSign('RSA-SHA256'); signer.update('certificate-key-test'); signer.end(); const sig = signer.sign(first.privateKey, 'hex');
    const verifier = crypto.createVerify('RSA-SHA256'); verifier.update('certificate-key-test'); verifier.end(); expect(verifier.verify(first.publicKey, sig, 'hex')).toBe(true);
  });
});
