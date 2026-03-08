/**
 * CSV Export Utility for Audit Trail Data
 * Converts audit trail records to CSV format for download
 */

export interface AuditRecord {
  id: string;
  projectId: string;
  action: string;
  timestamp: string | Date;
  engineerName: string;
  engineerEmail: string;
  licenseNumber: string;
  details: Record<string, unknown>;
  hash?: string;
  verified?: boolean;
}

export interface SignatureRecord {
  id: string;
  auditId: string;
  engineerName: string;
  timestamp: string | Date;
  signatureType: string;
  verified: boolean;
}

export interface ModificationRecord {
  id: string;
  auditId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  timestamp: string | Date;
  modifiedBy: string;
}

/**
 * Convert audit records to CSV format
 */
export function auditRecordsToCSV(records: AuditRecord[]): string {
  if (records.length === 0) {
    return 'No audit records available';
  }

  const headers = [
    'ID',
    'Project ID',
    'Action',
    'Timestamp',
    'Engineer Name',
    'Engineer Email',
    'License Number',
    'Details',
    'Hash',
    'Verified'
  ];

  const rows = records.map(record => [
    escapeCSVField(record.id),
    escapeCSVField(record.projectId),
    escapeCSVField(record.action),
    escapeCSVField(formatDate(record.timestamp)),
    escapeCSVField(record.engineerName),
    escapeCSVField(record.engineerEmail),
    escapeCSVField(record.licenseNumber),
    escapeCSVField(JSON.stringify(record.details)),
    escapeCSVField(record.hash || ''),
    record.verified ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Convert signature records to CSV format
 */
export function signatureRecordsToCSV(records: SignatureRecord[]): string {
  if (records.length === 0) {
    return 'No signature records available';
  }

  const headers = [
    'ID',
    'Audit ID',
    'Engineer Name',
    'Timestamp',
    'Signature Type',
    'Verified'
  ];

  const rows = records.map(record => [
    escapeCSVField(record.id),
    escapeCSVField(record.auditId),
    escapeCSVField(record.engineerName),
    escapeCSVField(formatDate(record.timestamp)),
    escapeCSVField(record.signatureType),
    record.verified ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Convert modification records to CSV format
 */
export function modificationRecordsToCSV(records: ModificationRecord[]): string {
  if (records.length === 0) {
    return 'No modification records available';
  }

  const headers = [
    'ID',
    'Audit ID',
    'Field Name',
    'Old Value',
    'New Value',
    'Timestamp',
    'Modified By'
  ];

  const rows = records.map(record => [
    escapeCSVField(record.id),
    escapeCSVField(record.auditId),
    escapeCSVField(record.fieldName),
    escapeCSVField(record.oldValue),
    escapeCSVField(record.newValue),
    escapeCSVField(formatDate(record.timestamp)),
    escapeCSVField(record.modifiedBy)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Escape CSV field values to handle commas, quotes, and newlines
 */
function escapeCSVField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Format date for CSV output
 */
function formatDate(date: string | Date): string {
  if (typeof date === 'string') {
    return date;
  }

  if (date instanceof Date) {
    return date.toISOString();
  }

  return String(date);
}

/**
 * Download CSV file to user's computer
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Generate comprehensive audit trail CSV report
 */
export function generateAuditTrailReport(
  auditRecords: AuditRecord[],
  signatureRecords: SignatureRecord[],
  modificationRecords: ModificationRecord[],
  projectName: string
): string {
  const timestamp = new Date().toISOString();
  const separator = '\n' + '='.repeat(80) + '\n';

  const report = [
    `AUDIT TRAIL REPORT - ${projectName}`,
    `Generated: ${timestamp}`,
    separator,
    'AUDIT LOGS',
    separator,
    auditRecordsToCSV(auditRecords),
    separator,
    'DIGITAL SIGNATURES',
    separator,
    signatureRecordsToCSV(signatureRecords),
    separator,
    'MODIFICATIONS',
    separator,
    modificationRecordsToCSV(modificationRecords)
  ].join('\n');

  return report;
}
