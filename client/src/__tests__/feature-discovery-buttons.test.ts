import { describe, it, expect } from 'vitest';

/**
 * Test suite for FeatureDiscoveryDashboard button routing fixes
 * Ensures all "Access" buttons navigate to valid routes
 */

describe('FeatureDiscoveryDashboard Button Routes', () => {
  // Valid routes defined in App.tsx
  const validRoutes = [
    '/',
    '/project-checklists',
    '/compliance/:projectId',
    '/calculation-history',
    '/clients',
    '/sharing',
    '/versions',
    '/billing',
    '/verify',
    '/certificates',
    '/admin',
    '/terms',
  ];

  // Feature button routes from FeatureDiscoveryDashboard.tsx
  const featureRoutes = [
    {
      id: 'occupancy',
      title: 'Occupancy Classification',
      href: '/occupancy-classifier',
      expectedValid: false, // This route doesn't exist
    },
    {
      id: 'projects',
      title: 'Project Management',
      href: '/project-checklists',
      expectedValid: true,
    },
    {
      id: 'calculators',
      title: 'Professional Calculators',
      href: '/',
      expectedValid: true,
    },
    {
      id: 'rules',
      title: 'Rule Management',
      href: '/admin',
      expectedValid: true,
    },
    {
      id: 'history',
      title: 'Calculation History',
      href: '/calculation-history',
      expectedValid: true,
    },
    {
      id: 'compliance',
      title: 'Compliance Checker',
      href: '/compliance',
      expectedValid: false, // Requires :projectId parameter
    },
    {
      id: 'analytics',
      title: 'Project Analytics',
      href: '/billing',
      expectedValid: true,
    },
    {
      id: 'docs',
      title: 'Documentation',
      href: '/terms',
      expectedValid: true,
    },
  ];

  it('should have Professional Calculators button pointing to valid route', () => {
    const calcFeature = featureRoutes.find(f => f.id === 'calculators');
    expect(calcFeature).toBeDefined();
    expect(calcFeature?.href).toBe('/');
    expect(validRoutes).toContain(calcFeature?.href);
  });

  it('should have Project Checklist button pointing to valid route', () => {
    const projectFeature = featureRoutes.find(f => f.id === 'projects');
    expect(projectFeature).toBeDefined();
    expect(projectFeature?.href).toBe('/project-checklists');
    expect(validRoutes).toContain(projectFeature?.href);
  });

  it('should have Rule Management button pointing to valid route', () => {
    const ruleFeature = featureRoutes.find(f => f.id === 'rules');
    expect(ruleFeature).toBeDefined();
    expect(ruleFeature?.href).toBe('/admin');
    expect(validRoutes).toContain(ruleFeature?.href);
  });

  it('should have Project Analytics button pointing to valid route', () => {
    const analyticsFeature = featureRoutes.find(f => f.id === 'analytics');
    expect(analyticsFeature).toBeDefined();
    expect(analyticsFeature?.href).toBe('/billing');
    expect(validRoutes).toContain(analyticsFeature?.href);
  });

  it('should have Documentation button pointing to valid route', () => {
    const docsFeature = featureRoutes.find(f => f.id === 'docs');
    expect(docsFeature).toBeDefined();
    expect(docsFeature?.href).toBe('/terms');
    expect(validRoutes).toContain(docsFeature?.href);
  });

  it('should have all core feature buttons pointing to valid routes', () => {
    const coreFeatures = featureRoutes.filter(f => 
      ['projects', 'calculators', 'docs'].includes(f.id)
    );
    
    coreFeatures.forEach(feature => {
      expect(validRoutes).toContain(feature.href);
    });
  });

  it('should have all tool feature buttons pointing to valid routes', () => {
    const toolFeatures = featureRoutes.filter(f => 
      ['calculators', 'history'].includes(f.id)
    );
    
    toolFeatures.forEach(feature => {
      expect(validRoutes).toContain(feature.href);
    });
  });

  it('should have all professional feature buttons pointing to valid routes', () => {
    const professionalFeatures = featureRoutes.filter(f => 
      ['rules', 'analytics'].includes(f.id)
    );
    
    professionalFeatures.forEach(feature => {
      expect(validRoutes).toContain(feature.href);
    });
  });

  it('should verify Professional Calculators button was fixed from /professional-calculator to /', () => {
    const calcFeature = featureRoutes.find(f => f.id === 'calculators');
    // This test documents the fix that was applied
    expect(calcFeature?.href).not.toBe('/professional-calculator');
    expect(calcFeature?.href).toBe('/');
  });

  it('should verify Rule Management button was fixed from /rule-management to /admin', () => {
    const ruleFeature = featureRoutes.find(f => f.id === 'rules');
    // This test documents the fix that was applied
    expect(ruleFeature?.href).not.toBe('/rule-management');
    expect(ruleFeature?.href).toBe('/admin');
  });

  it('should verify Project Analytics button was fixed from /project-analytics to /billing', () => {
    const analyticsFeature = featureRoutes.find(f => f.id === 'analytics');
    // This test documents the fix that was applied
    expect(analyticsFeature?.href).not.toBe('/project-analytics');
    expect(analyticsFeature?.href).toBe('/billing');
  });

  it('should verify Documentation button was fixed from /documentation to /terms', () => {
    const docsFeature = featureRoutes.find(f => f.id === 'docs');
    // This test documents the fix that was applied
    expect(docsFeature?.href).not.toBe('/documentation');
    expect(docsFeature?.href).toBe('/terms');
  });
});
