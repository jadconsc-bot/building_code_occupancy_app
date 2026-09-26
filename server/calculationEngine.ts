/** Core calculation execution and RSA signing helpers. */
import crypto from 'crypto';

export class CalculationEngine {
  signCalculation(inputs: Record<string, any>, outputs: Record<string, any>, userId: number, timestamp: number, privateKeyPem: string): string {
    const data = JSON.stringify({ inputs, outputs, userId, timestamp });
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(data); signer.end();
    return signer.sign(privateKeyPem, 'hex');
  }

  verifySignature(inputs: Record<string, any>, outputs: Record<string, any>, userId: number, timestamp: number, signatureHex: string, publicKeyPem: string): boolean {
    const data = JSON.stringify({ inputs, outputs, userId, timestamp });
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data); verifier.end();
    try { return verifier.verify(publicKeyPem, signatureHex, 'hex'); } catch { return false; }
  }

  generateTrace(calculatorType: string, inputs: Record<string, any>, outputs: Record<string, any>): Array<{ step: number; description: string; value: any }> {
    return [
      { step: 1, description: `Initialized ${calculatorType} calculator`, value: calculatorType },
      { step: 2, description: 'Received inputs', value: inputs },
      { step: 3, description: 'Executed calculation logic', value: 'calculation-executed' },
      { step: 4, description: 'Generated outputs', value: outputs },
    ];
  }

  createRecord(calculatorType: string, inputs: Record<string, any>, outputs: Record<string, any>, userId: number, projectId: string | number, nbcVersion: string, privateKeyPem: string) {
    const timestamp = Date.now();
    const signature = this.signCalculation(inputs, outputs, userId, timestamp, privateKeyPem);
    return { id: crypto.randomUUID(), calculatorType, inputs, outputs, signature, trace: this.generateTrace(calculatorType, inputs, outputs), userId, projectId, nbcVersion, timestamp: new Date(timestamp), createdAt: new Date(timestamp), immutable: true };
  }
}
export default CalculationEngine;
