import { vi } from 'vitest';

/**
 * Vitest setup file for mocking database in test environment
 * Prevents "Cannot read properties of null" errors when db is not initialized
 */

// Mock the database module before any tests run
vi.mock('./server/db', () => {
  // Mock Drizzle query builder with chainable methods
  const mockQueryBuilder = {
    select: vi.fn(function() { return this; }),
    from: vi.fn(function(table) { 
      // Return mock data based on table
      if (table?._ === 'stepCodeTiers') {
        return { ...this, _table: 'stepCodeTiers', execute: vi.fn().mockResolvedValue(mockStepCodeTiers) };
      }
      if (table?._ === 'jurisdictionProfiles') {
        return { ...this, _table: 'jurisdictionProfiles', execute: vi.fn().mockResolvedValue(mockJurisdictionProfiles) };
      }
      return this;
    }),
    where: vi.fn(function() { return this; }),
    limit: vi.fn(function() { return this; }),
    offset: vi.fn(function() { return this; }),
    orderBy: vi.fn(function() { return this; }),
    insert: vi.fn(function() { return this; }),
    values: vi.fn(function(data) { 
      return { ...this, _values: data, execute: vi.fn().mockResolvedValue([{ insertId: 1 }]) };
    }),
    update: vi.fn(function() { return this; }),
    set: vi.fn(function() { return this; }),
    delete: vi.fn(function() { return this; }),
    execute: vi.fn().mockResolvedValue([]),
    run: vi.fn().mockResolvedValue([]),
    all: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
  };

  // Mock seed data
  // BC Housing 2017 Metrics Report - Official Values
  const mockStepCodeTiers = [
    // Zone 4
    { id: 1, step: 1, zone: '4', climateZone: '4', buildingType: 'part9_single_family', tier: '1', tediTarget: 45.00, teuiTarget: 65.00, airtightnessMax: 5.00 },
    { id: 2, step: 2, zone: '4', climateZone: '4', buildingType: 'part9_single_family', tier: '2', tediTarget: 40.00, teuiTarget: 60.00, airtightnessMax: 3.50 },
    { id: 3, step: 3, zone: '4', climateZone: '4', buildingType: 'part9_single_family', tier: '3', tediTarget: 25.00, teuiTarget: 50.00, airtightnessMax: 2.50 },
    { id: 4, step: 4, zone: '4', climateZone: '4', buildingType: 'part9_single_family', tier: '4', tediTarget: 15.00, teuiTarget: 15.00, airtightnessMax: 1.50 },
    { id: 5, step: 5, zone: '4', climateZone: '4', buildingType: 'part9_single_family', tier: '5', tediTarget: 15.00, teuiTarget: 15.00, airtightnessMax: 1.50 },
    // Zone 5
    { id: 6, step: 1, zone: '5', climateZone: '5', buildingType: 'part9_single_family', tier: '1', tediTarget: 60.00, teuiTarget: 75.00, airtightnessMax: 5.00 },
    { id: 7, step: 2, zone: '5', climateZone: '5', buildingType: 'part9_single_family', tier: '2', tediTarget: 50.00, teuiTarget: 70.00, airtightnessMax: 3.50 },
    { id: 8, step: 3, zone: '5', climateZone: '5', buildingType: 'part9_single_family', tier: '3', tediTarget: 40.00, teuiTarget: 60.00, airtightnessMax: 2.50 },
    { id: 9, step: 4, zone: '5', climateZone: '5', buildingType: 'part9_single_family', tier: '4', tediTarget: 15.00, teuiTarget: 15.00, airtightnessMax: 1.50 },
    { id: 10, step: 5, zone: '5', climateZone: '5', buildingType: 'part9_single_family', tier: '5', tediTarget: 15.00, teuiTarget: 15.00, airtightnessMax: 1.50 },
  ];

  const mockJurisdictionProfiles = [
    { id: 1, municipality: 'Vancouver', province: 'BC', stepCodeAdopted: true, climateZone: '4', hdd: 3000, seismicRisk: 'high', createdAt: new Date() },
    { id: 2, municipality: 'Calgary', province: 'AB', stepCodeAdopted: false, climateZone: '6', hdd: 4500, seismicRisk: 'low', createdAt: new Date() },
    { id: 3, municipality: 'Edmonton', province: 'AB', stepCodeAdopted: false, climateZone: '6', hdd: 4800, seismicRisk: 'low', createdAt: new Date() },
    { id: 4, municipality: 'Victoria', province: 'BC', stepCodeAdopted: true, climateZone: '4', hdd: 2800, seismicRisk: 'medium', createdAt: new Date() },
    { id: 5, municipality: 'Kelowna', province: 'BC', stepCodeAdopted: true, climateZone: '5', hdd: 3500, seismicRisk: 'low', createdAt: new Date() },
  ];

  const mockStepCodeAnalyses = [
    { id: 1, userId: 'user-1', projectId: 'proj-1', jurisdiction: 'Vancouver', tier: 3, tediModelled: 35.5, immutable: true, signature: 'sig-1', createdAt: new Date() },
    { id: 2, userId: 'user-1', projectId: 'proj-2', jurisdiction: 'Calgary', tier: 1, tediModelled: 50.0, immutable: true, signature: 'sig-2', createdAt: new Date() },
  ];

  const mockUITranslations = [
    { id: 1, key: 'calculator_title', en: 'Step Code Calculator', fr: 'Calculatrice du Code Étape' },
    { id: 2, key: 'report_header', en: 'Compliance Report', fr: 'Rapport de Conformité' },
    { id: 3, key: 'occupancy_label', en: 'Occupancy Type', fr: 'Type d\'Occupation' },
    { id: 4, key: 'error_message', en: 'An error occurred', fr: 'Une erreur s\'est produite' },
  ];

  // Mock users for auth tests
  const mockUsers = [
    { id: 1, openId: 'user-1', name: 'Test User', email: 'test@example.com', role: 'user', createdAt: new Date(), lastSignedIn: new Date() },
  ];

  return {
    db: mockQueryBuilder,
    getDb: vi.fn().mockResolvedValue(mockQueryBuilder),
    upsertUser: vi.fn().mockResolvedValue(undefined),
    getUserByOpenId: vi.fn().mockResolvedValue(mockUsers[0]),
    getStepCodeTiers: vi.fn().mockResolvedValue(mockStepCodeTiers),
    getJurisdictionProfiles: vi.fn().mockResolvedValue(mockJurisdictionProfiles),
    getStepCodeAnalyses: vi.fn().mockResolvedValue(mockStepCodeAnalyses),
    getUITranslations: vi.fn().mockResolvedValue(mockUITranslations),
    // Export seed data for test access
    mockStepCodeTiers,
    mockJurisdictionProfiles,
    mockStepCodeAnalyses,
    mockUITranslations,
    mockUsers,
  };
});

console.log('[Vitest Setup] Database mocking initialized with BC Housing 2017 metrics');
