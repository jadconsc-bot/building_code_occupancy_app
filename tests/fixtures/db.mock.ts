import { vi } from 'vitest';

/**
 * Mock database fixtures for TEST-SUITE-001
 * Provides test data for database-dependent tests without requiring actual DB connection
 */

export const mockStepCodeTiers = [
  // BC Housing 2017 Metrics - Zone 4
  { id: 1, step: 1, zone: 4, tediTarget: 45, teuiTarget: 65 },
  { id: 2, step: 2, zone: 4, tediTarget: 40, teuiTarget: 60 },
  { id: 3, step: 3, zone: 4, tediTarget: 25, teuiTarget: 50 },
  { id: 4, step: 4, zone: 4, tediTarget: 15, teuiTarget: 15 },
  { id: 5, step: 5, zone: 4, tediTarget: 15, teuiTarget: 15 },
  // Zone 5
  { id: 6, step: 1, zone: 5, tediTarget: 60, teuiTarget: 75 },
  { id: 7, step: 2, zone: 5, tediTarget: 50, teuiTarget: 70 },
  { id: 8, step: 3, zone: 5, tediTarget: 40, teuiTarget: 60 },
  { id: 9, step: 4, zone: 5, tediTarget: 15, teuiTarget: 15 },
  { id: 10, step: 5, zone: 5, tediTarget: 15, teuiTarget: 15 },
];

export const mockJurisdictionProfiles = [
  {
    id: 1,
    municipality: 'Vancouver',
    province: 'BC',
    stepCodeAdopted: true,
    climateZone: 4,
    hdd: 3000,
    seismicRisk: 'high',
  },
  {
    id: 2,
    municipality: 'Calgary',
    province: 'AB',
    stepCodeAdopted: false,
    climateZone: 6,
    hdd: 4500,
    seismicRisk: 'low',
  },
  {
    id: 3,
    municipality: 'Edmonton',
    province: 'AB',
    stepCodeAdopted: false,
    climateZone: 6,
    hdd: 4800,
    seismicRisk: 'low',
  },
  {
    id: 4,
    municipality: 'Victoria',
    province: 'BC',
    stepCodeAdopted: true,
    climateZone: 4,
    hdd: 2800,
    seismicRisk: 'medium',
  },
  {
    id: 5,
    municipality: 'Kelowna',
    province: 'BC',
    stepCodeAdopted: true,
    climateZone: 5,
    hdd: 3500,
    seismicRisk: 'low',
  },
];

export const mockUsers = [
  {
    id: 1,
    openId: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date(),
    lastSignedIn: new Date(),
  },
];

export const mockAuditRecords = [
  {
    id: 1,
    userId: 'user-123',
    action: 'compliance_check',
    resource: 'stepCodeAnalyses',
    resourceId: 'analysis-1',
    changes: JSON.stringify({ tediModelled: 35 }),
    timestamp: new Date(),
    signature: 'mock-signature-1',
  },
];

/**
 * Mock database module for Vitest
 */
export const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
  run: vi.fn().mockResolvedValue([]),
  all: vi.fn().mockResolvedValue([]),
  get: vi.fn().mockResolvedValue(null),
  
  // Query helpers
  getStepCodeTiers: vi.fn().mockResolvedValue(mockStepCodeTiers),
  getJurisdictionProfiles: vi.fn().mockResolvedValue(mockJurisdictionProfiles),
  getUserByOpenId: vi.fn().mockResolvedValue(mockUsers[0]),
  upsertUser: vi.fn().mockResolvedValue(mockUsers[0]),
  getAuditRecords: vi.fn().mockResolvedValue(mockAuditRecords),
};

/**
 * Setup database mocking for tests
 */
export function setupDbMocks() {
  return {
    stepCodeTiers: mockStepCodeTiers,
    jurisdictionProfiles: mockJurisdictionProfiles,
    users: mockUsers,
    auditRecords: mockAuditRecords,
  };
}
