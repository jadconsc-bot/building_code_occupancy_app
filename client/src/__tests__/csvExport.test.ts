import { describe, it, expect } from 'vitest';
import {
  auditRecordsToCSV,
  signatureRecordsToCSV,
  modificationRecordsToCSV,
  generateAuditTrailReport,
  type AuditRecord,
  type SignatureRecord,
  type ModificationRecord
} from '@/lib/csvExport';

describe('CSV Export Utility', () => {
  describe('auditRecordsToCSV', () => {
    it('should convert empty array to message', () => {
      const result = auditRecordsToCSV([]);
      expect(result).toBe('No audit records available');
    });

    it('should convert single audit record to CSV', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: { occupancy: 'B1', status: 'COMPLIANT' },
          hash: 'abc123',
          verified: true
        }
      ];

      const result = auditRecordsToCSV(records);
      
      expect(result).toContain('ID,Project ID,Action,Timestamp');
      expect(result).toContain('1,proj-1,COMPLIANCE_CHECK');
      expect(result).toContain('John Smith');
      expect(result).toContain('john@example.com');
      expect(result).toContain('PE-12345');
      expect(result).toContain('Yes');
    });

    it('should handle multiple audit records', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: { occupancy: 'B1' },
          verified: true
        },
        {
          id: '2',
          projectId: 'proj-2',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-09T00:00:00Z',
          engineerName: 'Jane Doe',
          engineerEmail: 'jane@example.com',
          licenseNumber: 'PE-67890',
          details: { occupancy: 'A2' },
          verified: false
        }
      ];

      const result = auditRecordsToCSV(records);
      const lines = result.split('\n');

      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(result).toContain('1,proj-1');
      expect(result).toContain('2,proj-2');
    });

    it('should handle special characters in fields', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: { note: 'Contains comma, and quotes' },
          verified: true
        }
      ];

      const result = auditRecordsToCSV(records);

      expect(result).toContain('John Smith');
      expect(result).toContain('john@example.com');
    });

    it('should handle null and undefined values', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: {},
          hash: undefined,
          verified: true
        }
      ];

      const result = auditRecordsToCSV(records);

      expect(result).not.toContain('undefined');
      expect(result).toContain('1,proj-1');
    });
  });

  describe('signatureRecordsToCSV', () => {
    it('should convert empty array to message', () => {
      const result = signatureRecordsToCSV([]);
      expect(result).toBe('No signature records available');
    });

    it('should convert signature records to CSV', () => {
      const records: SignatureRecord[] = [
        {
          id: 'sig-1',
          auditId: 'audit-1',
          engineerName: 'John Smith',
          timestamp: '2026-03-08T00:00:00Z',
          signatureType: 'APPROVAL',
          verified: true
        }
      ];

      const result = signatureRecordsToCSV(records);

      expect(result).toContain('ID,Audit ID,Engineer Name');
      expect(result).toContain('sig-1,audit-1');
      expect(result).toContain('APPROVAL');
      expect(result).toContain('Yes');
    });
  });

  describe('modificationRecordsToCSV', () => {
    it('should convert empty array to message', () => {
      const result = modificationRecordsToCSV([]);
      expect(result).toBe('No modification records available');
    });

    it('should convert modification records to CSV', () => {
      const records: ModificationRecord[] = [
        {
          id: 'mod-1',
          auditId: 'audit-1',
          fieldName: 'occupancy',
          oldValue: 'B1',
          newValue: 'B2',
          timestamp: '2026-03-08T00:00:00Z',
          modifiedBy: 'John Smith'
        }
      ];

      const result = modificationRecordsToCSV(records);

      expect(result).toContain('ID,Audit ID,Field Name');
      expect(result).toContain('mod-1,audit-1');
      expect(result).toContain('occupancy');
      expect(result).toContain('B1');
      expect(result).toContain('B2');
    });
  });

  describe('generateAuditTrailReport', () => {
    it('should generate comprehensive report', () => {
      const auditRecords: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: {},
          verified: true
        }
      ];

      const signatureRecords: SignatureRecord[] = [
        {
          id: 'sig-1',
          auditId: 'audit-1',
          engineerName: 'John Smith',
          timestamp: '2026-03-08T00:00:00Z',
          signatureType: 'APPROVAL',
          verified: true
        }
      ];

      const modificationRecords: ModificationRecord[] = [
        {
          id: 'mod-1',
          auditId: 'audit-1',
          fieldName: 'occupancy',
          oldValue: 'B1',
          newValue: 'B2',
          timestamp: '2026-03-08T00:00:00Z',
          modifiedBy: 'John Smith'
        }
      ];

      const result = generateAuditTrailReport(
        auditRecords,
        signatureRecords,
        modificationRecords,
        'Test Project'
      );

      expect(result).toContain('AUDIT TRAIL REPORT - Test Project');
      expect(result).toContain('AUDIT LOGS');
      expect(result).toContain('DIGITAL SIGNATURES');
      expect(result).toContain('MODIFICATIONS');
      expect(result).toContain('Generated:');
    });
  });

  describe('CSV Special Cases', () => {
    it('should handle boolean values correctly', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: {},
          verified: true
        },
        {
          id: '2',
          projectId: 'proj-2',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'Jane Doe',
          engineerEmail: 'jane@example.com',
          licenseNumber: 'PE-67890',
          details: {},
          verified: false
        }
      ];

      const result = auditRecordsToCSV(records);

      expect(result).toContain('Yes');
      expect(result).toContain('No');
    });

    it('should handle Date objects', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: new Date('2026-03-08T00:00:00Z'),
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: {},
          verified: true
        }
      ];

      const result = auditRecordsToCSV(records);

      expect(result).toContain('2026-03');
      expect(result).toContain('John Smith');
    });

    it('should create valid CSV format with headers', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: { test: 'value' },
          verified: true
        }
      ];

      const result = auditRecordsToCSV(records);
      const lines = result.split('\n');

      expect(lines[0]).toContain('ID');
      expect(lines[0]).toContain('Project ID');
      expect(lines[0]).toContain('Action');
      expect(lines[0]).toContain('Timestamp');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should handle JSON details correctly', () => {
      const records: AuditRecord[] = [
        {
          id: '1',
          projectId: 'proj-1',
          action: 'COMPLIANCE_CHECK',
          timestamp: '2026-03-08T00:00:00Z',
          engineerName: 'John Smith',
          engineerEmail: 'john@example.com',
          licenseNumber: 'PE-12345',
          details: { occupancy: 'B1', rules: 45, passed: 42 },
          verified: true
        }
      ];

      const result = auditRecordsToCSV(records);

      expect(result).toContain('occupancy');
      expect(result).toContain('B1');
    });
  });
});
