import { describe, it, expect } from 'vitest';
import { CalculationEngine } from '../server/calculationEngine';

const engine = new CalculationEngine();

const sampleInputs = { area: 120, occupancyType: 'A2', sprinklers: true };
const sampleOutputs = { occupantLoad: 80, exitWidth: 1.2 };
const userId = 42;

describe('CalculationEngine signature round-trip', () => {
  it('verifySignature returns true for the original inputs/outputs', () => {
    const signature = engine.signCalculation(sampleInputs, sampleOutputs, userId);
    expect(engine.verifySignature(sampleInputs, sampleOutputs, userId, signature)).toBe(true);
  });

  it('verifySignature returns false when outputs are tampered', () => {
    const signature = engine.signCalculation(sampleInputs, sampleOutputs, userId);
    const tamperedOutputs = { ...sampleOutputs, occupantLoad: 999 };
    expect(engine.verifySignature(sampleInputs, tamperedOutputs, userId, signature)).toBe(false);
  });

  it('verifySignature returns false when inputs are tampered', () => {
    const signature = engine.signCalculation(sampleInputs, sampleOutputs, userId);
    const tamperedInputs = { ...sampleInputs, area: 9999 };
    expect(engine.verifySignature(tamperedInputs, sampleOutputs, userId, signature)).toBe(false);
  });

  it('verifySignature returns false for a corrupt/legacy signature without timestamp prefix', () => {
    expect(engine.verifySignature(sampleInputs, sampleOutputs, userId, 'abc123nocolon')).toBe(false);
  });

  it('signature format encodes timestamp (no schema column needed)', () => {
    const before = Date.now();
    const signature = engine.signCalculation(sampleInputs, sampleOutputs, userId);
    const after = Date.now();
    const timestamp = parseInt(signature.split(':')[0], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
