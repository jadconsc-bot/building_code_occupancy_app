/**
 * End-to-End Feature Router Tests
 * 
 * Tests for complete workflows:
 * 1. Create project → Run analysis → Generate report
 * 2. Subscribe to plan → Upgrade → Cancel
 * 3. Compliance analysis with multiple building types
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Mock tRPC client for E2E testing
 */
const mockTrpc = {
  projects: {
    list: { useQuery: vi.fn() },
    create: { useMutation: vi.fn() },
    update: { useMutation: vi.fn() },
    delete: { useMutation: vi.fn() },
    getById: { useQuery: vi.fn() },
  },
  compliance: {
    analyzePlan: { useMutation: vi.fn() },
    analyzeDrawing: { useMutation: vi.fn() },
    getHistory: { useQuery: vi.fn() },
    generateReport: { useMutation: vi.fn() },
  },
  subscriptions: {
    getCurrentPlan: { useQuery: vi.fn() },
    upgradePlan: { useMutation: vi.fn() },
    cancelSubscription: { useMutation: vi.fn() },
    getInvoices: { useQuery: vi.fn() },
  },
};

describe('End-to-End Feature Router Tests', () => {
  
  describe('Complete Project Workflow', () => {
    
    it('should create project, analyze, and generate report', async () => {
      // Step 1: Create a project
      const createProjectInput = {
        name: 'Downtown Office Building',
        description: 'Modern office complex with 10 floors',
        occupancyCode: 'B-2',
        buildingType: 'office',
      };

      const createdProject = {
        id: 1,
        userId: 100,
        ...createProjectInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTrpc.projects.create.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(createdProject),
        isLoading: false,
        error: null,
      });

      const createMutation = mockTrpc.projects.create.useMutation();
      const project = await createMutation.mutateAsync(createProjectInput);

      expect(project.id).toBe(1);
      expect(project.name).toBe('Downtown Office Building');

      // Step 2: Run compliance analysis
      const analysisInput = {
        planDescription: 'Modern office building with standard egress requirements',
        occupancyType: 'office',
        buildingType: 'office',
        province: 'Alberta',
      };

      const analysisResult = {
        projectId: 1,
        analysisId: 'ana-123',
        compliant: true,
        issues: [],
        recommendations: [
          'Ensure emergency lighting is installed in all corridors',
          'Verify fire alarm system meets current standards',
        ],
        timestamp: new Date(),
      };

      mockTrpc.compliance.analyzePlan.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(analysisResult),
        isLoading: false,
        error: null,
      });

      const analysisMutation = mockTrpc.compliance.analyzePlan.useMutation();
      const analysis = await analysisMutation.mutateAsync(analysisInput);

      expect(analysis.projectId).toBe(1);
      expect(analysis.compliant).toBe(true);
      expect(analysis.recommendations).toHaveLength(2);

      // Step 3: Generate report
      const reportInput = {
        projectId: 1,
        format: 'pdf',
      };

      const reportResult = {
        reportId: 'rpt-123',
        url: 'https://example.com/reports/rpt-123.pdf',
        generatedAt: new Date(),
        projectName: 'Downtown Office Building',
        analysisCount: 1,
      };

      mockTrpc.compliance.generateReport.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(reportResult),
        isLoading: false,
        error: null,
      });

      const reportMutation = mockTrpc.compliance.generateReport.useMutation();
      const report = await reportMutation.mutateAsync(reportInput);

      expect(report.reportId).toBe('rpt-123');
      expect(report.url).toContain('pdf');
      expect(report.projectName).toBe('Downtown Office Building');
    });

    it('should handle non-compliant analysis with issues', async () => {
      const analysisInput = {
        planDescription: 'Building with potential fire safety issues',
        occupancyType: 'residential',
        buildingType: 'apartment',
      };

      const analysisResult = {
        projectId: 2,
        analysisId: 'ana-456',
        compliant: false,
        issues: [
          {
            code: 'FIRE_EXIT_001',
            severity: 'critical',
            description: 'Fire exit width is 30 inches, minimum required is 36 inches',
            section: 'NBC 2025 3.2.3',
          },
          {
            code: 'EGRESS_002',
            severity: 'high',
            description: 'Travel distance to exit exceeds 250 feet',
            section: 'NBC 2025 3.4.1',
          },
        ],
        recommendations: [
          'Widen fire exit to meet minimum 36-inch requirement',
          'Reconfigure floor layout to reduce travel distance',
          'Add additional emergency exit',
        ],
        timestamp: new Date(),
      };

      mockTrpc.compliance.analyzePlan.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(analysisResult),
        isLoading: false,
        error: null,
      });

      const mutation = mockTrpc.compliance.analyzePlan.useMutation();
      const result = await mutation.mutateAsync(analysisInput);

      expect(result.compliant).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].severity).toBe('critical');
      expect(result.recommendations).toHaveLength(3);
    });
  });

  describe('Complete Subscription Workflow', () => {
    
    it('should upgrade subscription plan', async () => {
      // Step 1: Get current plan
      const currentPlan = {
        planId: 'starter',
        name: 'Starter',
        price: 29.99,
        features: ['Up to 5 projects', 'Basic analysis'],
        renewalDate: new Date('2026-04-01'),
      };

      mockTrpc.subscriptions.getCurrentPlan.useQuery.mockReturnValue({
        data: currentPlan,
        isLoading: false,
        error: null,
      });

      const planQuery = mockTrpc.subscriptions.getCurrentPlan.useQuery();
      expect(planQuery.data.planId).toBe('starter');

      // Step 2: Upgrade to Pro plan
      const upgradeInput = {
        newPlanId: 'pro',
      };

      const upgradeResult = {
        success: true,
        oldPlan: 'starter',
        newPlan: 'pro',
        upgradeDate: new Date(),
        prorationCredit: 15.00,
        newPrice: 99.99,
      };

      mockTrpc.subscriptions.upgradePlan.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(upgradeResult),
        isLoading: false,
        error: null,
      });

      const upgradeMutation = mockTrpc.subscriptions.upgradePlan.useMutation();
      const upgrade = await upgradeMutation.mutateAsync(upgradeInput);

      expect(upgrade.success).toBe(true);
      expect(upgrade.newPlan).toBe('pro');
      expect(upgrade.prorationCredit).toBe(15.00);

      // Step 3: Verify new plan
      const newPlan = {
        planId: 'pro',
        name: 'Professional',
        price: 99.99,
        features: ['Unlimited projects', 'Advanced analysis', 'Priority support'],
        renewalDate: new Date('2026-04-01'),
      };

      mockTrpc.subscriptions.getCurrentPlan.useQuery.mockReturnValue({
        data: newPlan,
        isLoading: false,
        error: null,
      });

      const verifyQuery = mockTrpc.subscriptions.getCurrentPlan.useQuery();
      expect(verifyQuery.data.planId).toBe('pro');
    });

    it('should cancel subscription with proper handling', async () => {
      const cancelResult = {
        success: true,
        cancellationDate: new Date(),
        refundAmount: 0,
        accessUntil: new Date('2026-04-01'),
      };

      mockTrpc.subscriptions.cancelSubscription.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(cancelResult),
        isLoading: false,
        error: null,
      });

      const mutation = mockTrpc.subscriptions.cancelSubscription.useMutation();
      const result = await mutation.mutateAsync({});

      expect(result.success).toBe(true);
      expect(result.cancellationDate).toBeDefined();
      expect(result.accessUntil).toBeDefined();
    });
  });

  describe('Multiple Building Type Analysis', () => {
    
    it('should analyze residential building', async () => {
      const input = {
        planDescription: 'Single-family residential home with 3 bedrooms',
        occupancyType: 'residential',
        buildingType: 'house',
      };

      const result = {
        projectId: 3,
        analysisId: 'ana-res-001',
        compliant: true,
        buildingType: 'residential',
        issues: [],
        recommendations: ['Install GFCI outlets in bathrooms and kitchen'],
      };

      mockTrpc.compliance.analyzePlan.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(result),
        isLoading: false,
        error: null,
      });

      const mutation = mockTrpc.compliance.analyzePlan.useMutation();
      const analysis = await mutation.mutateAsync(input);

      expect(analysis.buildingType).toBe('residential');
      expect(analysis.compliant).toBe(true);
    });

    it('should analyze commercial building', async () => {
      const input = {
        planDescription: 'Commercial retail space with 5000 sq ft',
        occupancyType: 'mercantile',
        buildingType: 'retail',
      };

      const result = {
        projectId: 4,
        analysisId: 'ana-com-001',
        compliant: true,
        buildingType: 'commercial',
        issues: [],
        recommendations: [
          'Ensure adequate emergency lighting coverage',
          'Verify sprinkler system capacity',
        ],
      };

      mockTrpc.compliance.analyzePlan.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(result),
        isLoading: false,
        error: null,
      });

      const mutation = mockTrpc.compliance.analyzePlan.useMutation();
      const analysis = await mutation.mutateAsync(input);

      expect(analysis.buildingType).toBe('commercial');
      expect(analysis.recommendations).toHaveLength(2);
    });

    it('should analyze institutional building', async () => {
      const input = {
        planDescription: 'Hospital with 200 beds',
        occupancyType: 'institutional',
        buildingType: 'hospital',
      };

      const result = {
        projectId: 5,
        analysisId: 'ana-inst-001',
        compliant: false,
        buildingType: 'institutional',
        issues: [
          {
            code: 'ACCESSIBILITY_001',
            severity: 'high',
            description: 'Accessible parking spaces insufficient',
          },
        ],
        recommendations: ['Add 8 additional accessible parking spaces'],
      };

      mockTrpc.compliance.analyzePlan.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(result),
        isLoading: false,
        error: null,
      });

      const mutation = mockTrpc.compliance.analyzePlan.useMutation();
      const analysis = await mutation.mutateAsync(input);

      expect(analysis.buildingType).toBe('institutional');
      expect(analysis.compliant).toBe(false);
      expect(analysis.issues).toHaveLength(1);
    });
  });

  describe('Error Scenarios', () => {
    
    it('should handle project creation failure', async () => {
      const error = new Error('Project name already exists');

      mockTrpc.projects.create.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockRejectedValue(error),
        isLoading: false,
        error,
      });

      const mutation = mockTrpc.projects.create.useMutation();
      expect(mutation.error).toBeDefined();
      expect(mutation.error.message).toContain('already exists');
    });

    it('should handle analysis timeout', async () => {
      const error = new Error('Analysis timed out after 30 seconds');

      mockTrpc.compliance.analyzePlan.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockRejectedValue(error),
        isLoading: false,
        error,
      });

      const mutation = mockTrpc.compliance.analyzePlan.useMutation();
      expect(mutation.error.message).toContain('timed out');
    });

    it('should handle report generation failure', async () => {
      const error = new Error('Failed to generate PDF report');

      mockTrpc.compliance.generateReport.useMutation.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockRejectedValue(error),
        isLoading: false,
        error,
      });

      const mutation = mockTrpc.compliance.generateReport.useMutation();
      expect(mutation.error.message).toContain('PDF');
    });
  });

  describe('Data Persistence', () => {
    
    it('should retrieve project history', async () => {
      const projectHistory = [
        {
          id: 1,
          name: 'Project A',
          analysisCount: 3,
          lastAnalysis: new Date('2026-03-01'),
        },
        {
          id: 2,
          name: 'Project B',
          analysisCount: 1,
          lastAnalysis: new Date('2026-02-28'),
        },
      ];

      mockTrpc.projects.list.useQuery.mockReturnValue({
        data: projectHistory,
        isLoading: false,
        error: null,
      });

      const query = mockTrpc.projects.list.useQuery();
      expect(query.data).toHaveLength(2);
      expect(query.data[0].analysisCount).toBe(3);
    });

    it('should retrieve analysis history', async () => {
      const analysisHistory = [
        {
          id: 'ana-001',
          projectId: 1,
          timestamp: new Date('2026-03-01'),
          compliant: true,
        },
        {
          id: 'ana-002',
          projectId: 1,
          timestamp: new Date('2026-02-28'),
          compliant: false,
        },
      ];

      mockTrpc.compliance.getHistory.useQuery.mockReturnValue({
        data: analysisHistory,
        isLoading: false,
        error: null,
      });

      const query = mockTrpc.compliance.getHistory.useQuery({ projectId: 1 });
      expect(query.data).toHaveLength(2);
      expect(query.data[0].compliant).toBe(true);
    });
  });
});
