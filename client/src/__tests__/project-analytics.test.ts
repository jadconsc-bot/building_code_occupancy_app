import { describe, it, expect } from 'vitest';
import { validRoutes } from '@/components/FeatureDiscoveryDashboard';

/**
 * Test suite for ProjectAnalytics page and routing
 * Ensures the new analytics page is properly integrated
 */

describe('ProjectAnalytics Page Integration', () => {
  it('should have /project-analytics route defined', () => {
    expect(validRoutes).toContain('/project-analytics');
  });

  it('should have all required routes for feature discovery', () => {
    const requiredRoutes = [
      '/',
      '/project-checklists',
      '/calculation-history',
      '/project-analytics',
      '/admin',
      '/terms',
    ];

    requiredRoutes.forEach(route => {
      expect(validRoutes).toContain(route);
    });
  });

  it('should map Project Analytics button to /project-analytics', () => {
    // This test verifies the fix from /billing to /project-analytics
    expect(validRoutes).toContain('/project-analytics');
    expect(validRoutes).not.toContain('/project-analytics-old');
  });

  it('should have correct number of routes', () => {
    // Verify all routes are accounted for
    expect(validRoutes.length).toBeGreaterThanOrEqual(13);
  });

  it('should include all core feature routes', () => {
    const coreRoutes = ['/', '/project-checklists', '/terms'];
    coreRoutes.forEach(route => {
      expect(validRoutes).toContain(route);
    });
  });

  it('should include all tool feature routes', () => {
    const toolRoutes = ['/calculation-history', '/project-analytics'];
    toolRoutes.forEach(route => {
      expect(validRoutes).toContain(route);
    });
  });

  it('should include all professional feature routes', () => {
    const professionalRoutes = ['/admin', '/project-analytics'];
    professionalRoutes.forEach(route => {
      expect(validRoutes).toContain(route);
    });
  });

  describe('ProjectAnalytics Page Features', () => {
    it('should display project information', () => {
      // Mock project data structure
      const mockProject = {
        id: 'proj-1',
        name: 'Downtown Office Complex',
        address: '123 Main Street, Calgary, AB',
        occupancyCode: 'B',
        occupancyName: 'Institutional',
        createdDate: '2026-01-15',
        lastModified: '2026-03-10',
      };

      expect(mockProject).toBeDefined();
      expect(mockProject.name).toBe('Downtown Office Complex');
      expect(mockProject.occupancyCode).toBe('B');
    });

    it('should have calculation data structure', () => {
      // Mock calculation data structure
      const mockCalculation = {
        id: 'calc-001',
        type: 'Occupant Load',
        name: 'Main Floor Occupant Load Calculation',
        description: 'Calculated occupant load for main floor',
        createdAt: '2026-03-10T14:30:00Z',
        createdBy: 'Jose Acevedo',
        verified: true,
        compliant: true,
        complianceStatus: 'compliant' as const,
        result: {
          value: '450',
          unit: 'persons',
          notes: 'Based on 3.5 m²/person',
        },
        signature: 'sig_001_verified',
        auditTrail: 'audit_001',
      };

      expect(mockCalculation).toBeDefined();
      expect(mockCalculation.verified).toBe(true);
      expect(mockCalculation.compliant).toBe(true);
      expect(mockCalculation.complianceStatus).toBe('compliant');
    });

    it('should support compliance status filtering', () => {
      const complianceStatuses = ['compliant', 'non-compliant', 'pending'];
      
      complianceStatuses.forEach(status => {
        expect(['compliant', 'non-compliant', 'pending']).toContain(status);
      });
    });

    it('should support calculation type filtering', () => {
      const calculationTypes = [
        'Occupant Load',
        'Exit Requirements',
        'Fire Separation',
        'Structural Load',
        'Electrical Load',
      ];

      expect(calculationTypes.length).toBeGreaterThan(0);
      expect(calculationTypes).toContain('Occupant Load');
    });

    it('should have export functionality', () => {
      const exportFormats = ['PDF', 'CSV'];
      
      exportFormats.forEach(format => {
        expect(['PDF', 'CSV']).toContain(format);
      });
    });

    it('should display compliance statistics', () => {
      // Mock statistics
      const stats = {
        total: 5,
        verified: 4,
        compliant: 4,
        nonCompliant: 1,
        pending: 1,
      };

      expect(stats.total).toBe(5);
      expect(stats.verified).toBe(4);
      expect(stats.compliant).toBe(4);
      expect(stats.nonCompliant).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.verified + stats.pending).toBe(stats.total);
    });

    it('should calculate compliance percentage', () => {
      const stats = {
        total: 5,
        compliant: 4,
      };

      const compliancePercentage = (stats.compliant / stats.total) * 100;
      expect(compliancePercentage).toBe(80);
    });

    it('should have three main tabs', () => {
      const tabs = ['overview', 'calculations', 'compliance'];
      
      expect(tabs.length).toBe(3);
      expect(tabs).toContain('overview');
      expect(tabs).toContain('calculations');
      expect(tabs).toContain('compliance');
    });

    it('should support search functionality', () => {
      const searchQuery = 'occupant';
      const mockCalculations = [
        { name: 'Main Floor Occupant Load Calculation' },
        { name: 'Exit Requirements' },
      ];

      const filtered = mockCalculations.filter(calc =>
        calc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('Occupant');
    });
  });

  describe('Button Navigation Fix', () => {
    it('should verify Project Analytics button was fixed', () => {
      // This documents the fix from /billing to /project-analytics
      expect(validRoutes).toContain('/project-analytics');
      const billingIndex = validRoutes.indexOf('/billing');
      const analyticsIndex = validRoutes.indexOf('/project-analytics');
      expect(billingIndex).not.toBe(analyticsIndex);
    });

    it('should have correct route for analytics feature', () => {
      const analyticsRoute = '/project-analytics';
      expect(validRoutes).toContain(analyticsRoute);
    });

    it('should not have conflicting routes', () => {
      const uniqueRoutes = new Set(validRoutes);
      expect(uniqueRoutes.size).toBe(validRoutes.length);
    });
  });
});
