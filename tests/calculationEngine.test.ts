import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { CalculationEngine } from '../server/calculationEngine';

const engine = new CalculationEngine();
const sampleInputs = { area: 120, occupancyType: 'A2', sprinklers: true };
const sampleOutputs = { occupantLoad: 80, exitWidth: 1.2 };
const userId = 42;
const timestamp = 1700000000000;
const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });

describe('CalculationEngine signature round-trip', () => {
  it('verifySignature returns true for the original inputs/outputs', () => {
    const signature = engine.signCalculation(sampleInputs, sampleOutputs, userId, timestamp, keys.privateKey);
    expect(engine.verifySignature(sampleInputs, sampleOutputs, userId, timestamp, signature, keys.publicKey)).toBe(true);
  });
  it('verifySignature returns false when outputs are tampered', () => {
    const signature = engine.signCalculation(sampleInputs, sampleOutputs, userId, timestamp, keys.privateKey);
    expect(engine.verifySignature(sampleInputs, { ...sampleOutputs, occupantLoad: 999 }, userId, timestamp, signature, keys.publicKey)).toBe(false);
  });
  it('verifySignature returns false when inputs are tampered', () => {
    const signature = engine.signCalculation(sampleInputs, sampleOutputs, userId, timestamp, keys.privateKey);
    expect(engine.verifySignature({ ...sampleInputs, area: 9999 }, sampleOutputs, userId, timestamp, signature, keys.publicKey)).toBe(false);
  });
  it('verifySignature returns false for a corrupt signature', () => {
    expect(engine.verifySignature(sampleInputs, sampleOutputs, userId, timestamp, 'abc123nocolon', keys.publicKey)).toBe(false);
  });
});
