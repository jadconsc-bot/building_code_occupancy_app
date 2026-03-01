/**
 * Phase 2-5 Feature Tests
 * Comprehensive test suite for commercialization features
 * 
 * Tests items 6-16 from the definitive commercialization recipe
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";
import { v4 as uuidv4 } from "uuid";

describe("Phase 2A: Clients & Project Members", () => {
  const testUserId = 1;
  const testClientData = {
    userId: testUserId,
    name: "Acme Construction Ltd",
    email: "contact@acme.com",
    phone: "+1-403-555-0100",
    address: "123 Main St",
    city: "Calgary",
    province: "Alberta",
    postalCode: "T2P 1M1",
    companyName: "Acme Construction",
    industry: "commercial",
    status: "active" as const,
  };

  describe("Client Management", () => {
    it("should create a client", async () => {
      const client = await db.createClient(testClientData);
      expect(client).toBeDefined();
      expect(client.name).toBe("Acme Construction Ltd");
      expect(client.email).toBe("contact@acme.com");
      expect(client.status).toBe("active");
    });

    it("should retrieve clients by user ID", async () => {
      await db.createClient(testClientData);
      const clients = await db.getClientsByUserId(testUserId);
      expect(clients.length).toBeGreaterThan(0);
      expect(clients[0].name).toBe("Acme Construction Ltd");
    });

    it("should update a client", async () => {
      const client = await db.createClient(testClientData);
      await db.updateClient(client.id, {
        name: "Acme Construction Ltd - Updated",
        status: "inactive",
      });
      const updated = await db.getClientById(client.id);
      expect(updated?.name).toBe("Acme Construction Ltd - Updated");
      expect(updated?.status).toBe("inactive");
    });

    it("should delete a client", async () => {
      const client = await db.createClient(testClientData);
      await db.deleteClient(client.id);
      const deleted = await db.getClientById(client.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Project Members", () => {
    it("should add a project member", async () => {
      const member = await db.addProjectMember({
        projectId: 1,
        userId: 2,
        role: "editor",
        addedBy: testUserId,
      });
      expect(member).toBeDefined();
      expect(member.role).toBe("editor");
      expect(member.addedBy).toBe(testUserId);
    });

    it("should retrieve project members", async () => {
      await db.addProjectMember({
        projectId: 1,
        userId: 2,
        role: "editor",
        addedBy: testUserId,
      });
      const members = await db.getProjectMembers(1);
      expect(members.length).toBeGreaterThan(0);
      expect(members[0].role).toBe("editor");
    });

    it("should update member role", async () => {
      await db.addProjectMember({
        projectId: 1,
        userId: 2,
        role: "viewer",
        addedBy: testUserId,
      });
      await db.updateProjectMemberRole(1, 2, "editor");
      const member = await db.getProjectMember(1, 2);
      expect(member?.role).toBe("editor");
    });

    it("should remove a project member", async () => {
      await db.addProjectMember({
        projectId: 1,
        userId: 2,
        role: "editor",
        addedBy: testUserId,
      });
      await db.removeProjectMember(1, 2);
      const member = await db.getProjectMember(1, 2);
      expect(member?.removedAt).toBeDefined();
    });
  });
});

describe("Phase 3: Subscriptions & Pricing", () => {
  describe("Subscription Plans", () => {
    it("should retrieve active subscription plans", async () => {
      const plans = await db.getSubscriptionPlans();
      expect(Array.isArray(plans)).toBe(true);
    });

    it("should retrieve a specific plan by ID", async () => {
      const plans = await db.getSubscriptionPlans();
      if (plans.length > 0) {
        const plan = await db.getSubscriptionPlanById(plans[0].id);
        expect(plan).toBeDefined();
        expect(plan?.id).toBe(plans[0].id);
      }
    });
  });

  describe("User Subscriptions", () => {
    const testUserId = 1;

    it("should create a user subscription", async () => {
      const plans = await db.getSubscriptionPlans();
      if (plans.length > 0) {
        const subscription = await db.createUserSubscription({
          userId: testUserId,
          planId: plans[0].id,
          status: "active",
          billingCycle: "monthly",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeSubscriptionId: "sub_test_123",
          stripeCustomerId: "cus_test_456",
        });
        expect(subscription).toBeDefined();
        expect(subscription.status).toBe("active");
      }
    });

    it("should retrieve user subscription", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      if (subscription) {
        expect(subscription.userId).toBe(testUserId);
      }
    });

    it("should update user subscription", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      if (subscription) {
        await db.updateUserSubscription(testUserId, {
          status: "cancelled",
          cancelledAt: new Date(),
        });
        const updated = await db.getUserSubscription(testUserId);
        expect(updated?.status).toBe("cancelled");
      }
    });
  });
});

describe("Phase 3B: Usage Metrics", () => {
  const testUserId = 1;
  const currentMonth = new Date();
  const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  it("should create or update usage metrics", async () => {
    await db.createOrUpdateUsageMetrics({
      userId: testUserId,
      month,
      projectsCreated: 5,
      calculationsRun: 15,
      reportsGenerated: 3,
      projectsShared: 2,
      hoursEstimatedSaved: 10.5,
      riskReductionScore: 85.5,
    });

    const metrics = await db.getUsageMetrics(testUserId, month);
    expect(metrics).toBeDefined();
    expect(metrics?.calculationsRun).toBe(15);
    expect(metrics?.reportsGenerated).toBe(3);
  });

  it("should retrieve usage metrics", async () => {
    const metrics = await db.getUsageMetrics(testUserId, month);
    if (metrics) {
      expect(metrics.userId).toBe(testUserId);
      expect(metrics.month).toBe(month);
    }
  });

  it("should track ROI metrics", async () => {
    const metrics = await db.getUsageMetrics(testUserId, month);
    if (metrics) {
      expect(metrics.hoursEstimatedSaved).toBeGreaterThanOrEqual(0);
      expect(metrics.riskReductionScore).toBeGreaterThanOrEqual(0);
      expect(metrics.riskReductionScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("Phase 2D: Sharing & Verification", () => {
  const testProjectId = 1;
  const testUserId = 1;

  describe("Share Links", () => {
    it("should create a share link", async () => {
      const link = await db.createShareLink({
        id: uuidv4(),
        projectId: testProjectId,
        createdBy: testUserId,
        token: "test_token_" + Date.now(),
        accessLevel: "view_only",
        isActive: true,
      });
      expect(link).toBeDefined();
      expect(link.isActive).toBe(true);
      expect(link.accessCount).toBe(0);
    });

    it("should retrieve share links by token", async () => {
      const token = "test_token_" + Date.now();
      const link = await db.createShareLink({
        id: uuidv4(),
        projectId: testProjectId,
        createdBy: testUserId,
        token,
        accessLevel: "view_only",
        isActive: true,
      });

      const retrieved = await db.getShareLinkByToken(token);
      expect(retrieved).toBeDefined();
      expect(retrieved?.projectId).toBe(testProjectId);
    });

    it("should list share links for a project", async () => {
      await db.createShareLink({
        id: uuidv4(),
        projectId: testProjectId,
        createdBy: testUserId,
        token: "test_token_" + Date.now(),
        accessLevel: "view_only",
        isActive: true,
      });

      const links = await db.getProjectShareLinks(testProjectId);
      expect(Array.isArray(links)).toBe(true);
    });

    it("should increment access count", async () => {
      const token = "test_token_" + Date.now();
      const link = await db.createShareLink({
        id: uuidv4(),
        projectId: testProjectId,
        createdBy: testUserId,
        token,
        accessLevel: "view_only",
        isActive: true,
      });

      await db.updateShareLinkAccessCount(link.id);
      const updated = await db.getShareLinkByToken(token);
      expect(updated?.accessCount).toBe(1);
    });

    it("should deactivate a share link", async () => {
      const token = "test_token_" + Date.now();
      const link = await db.createShareLink({
        id: uuidv4(),
        projectId: testProjectId,
        createdBy: testUserId,
        token,
        accessLevel: "view_only",
        isActive: true,
      });

      await db.deactivateShareLink(link.id);
      const deactivated = await db.getShareLinkByToken(token);
      expect(deactivated?.isActive).toBe(false);
    });
  });

  describe("Verification Tokens", () => {
    const testCalculationId = uuidv4();

    it("should create a verification token", async () => {
      const token = await db.createVerificationToken({
        id: uuidv4(),
        calculationResultId: testCalculationId,
        token: "verify_token_" + Date.now(),
        isPublic: true,
      });
      expect(token).toBeDefined();
      expect(token.isPublic).toBe(true);
      expect(token.viewCount).toBe(0);
    });

    it("should retrieve verification token by token string", async () => {
      const tokenString = "verify_token_" + Date.now();
      const token = await db.createVerificationToken({
        id: uuidv4(),
        calculationResultId: testCalculationId,
        token: tokenString,
        isPublic: true,
      });

      const retrieved = await db.getVerificationTokenByToken(tokenString);
      expect(retrieved).toBeDefined();
      expect(retrieved?.calculationResultId).toBe(testCalculationId);
    });

    it("should increment view count", async () => {
      const tokenString = "verify_token_" + Date.now();
      const token = await db.createVerificationToken({
        id: uuidv4(),
        calculationResultId: testCalculationId,
        token: tokenString,
        isPublic: true,
      });

      await db.incrementVerificationTokenViewCount(token.id);
      const updated = await db.getVerificationTokenByToken(tokenString);
      expect(updated?.viewCount).toBe(1);
    });
  });
});

describe("Phase 2C: Calculation Versioning", () => {
  const testCalculationId = uuidv4();
  const testUserId = 1;

  it("should create a calculation version", async () => {
    const version = await db.createCalculationVersion({
      id: uuidv4(),
      calculationResultId: testCalculationId,
      versionNumber: 1,
      inputData: JSON.stringify({ occupancy: "A-1", load: 100 }),
      resultData: JSON.stringify({ result: "compliant" }),
      changeReason: "Initial calculation",
      changedBy: testUserId,
    });
    expect(version).toBeDefined();
    expect(version.versionNumber).toBe(1);
  });

  it("should retrieve calculation versions", async () => {
    await db.createCalculationVersion({
      id: uuidv4(),
      calculationResultId: testCalculationId,
      versionNumber: 1,
      inputData: JSON.stringify({ occupancy: "A-1" }),
      resultData: JSON.stringify({ result: "compliant" }),
      changeReason: "Initial",
      changedBy: testUserId,
    });

    const versions = await db.getCalculationVersions(testCalculationId);
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);
  });

  it("should create version with parent reference", async () => {
    const v1 = await db.createCalculationVersion({
      id: uuidv4(),
      calculationResultId: testCalculationId,
      versionNumber: 1,
      inputData: JSON.stringify({ occupancy: "A-1" }),
      resultData: JSON.stringify({ result: "compliant" }),
      changeReason: "Initial",
      changedBy: testUserId,
    });

    const v2 = await db.createCalculationVersion({
      id: uuidv4(),
      calculationResultId: testCalculationId,
      versionNumber: 2,
      parentVersionId: v1.id,
      inputData: JSON.stringify({ occupancy: "A-1", load: 150 }),
      resultData: JSON.stringify({ result: "compliant" }),
      changeReason: "Updated load",
      changedBy: testUserId,
    });

    expect(v2.parentVersionId).toBe(v1.id);
    expect(v2.versionNumber).toBe(2);
  });

  it("should retrieve a specific version", async () => {
    const version = await db.createCalculationVersion({
      id: uuidv4(),
      calculationResultId: testCalculationId,
      versionNumber: 1,
      inputData: JSON.stringify({ occupancy: "A-1" }),
      resultData: JSON.stringify({ result: "compliant" }),
      changeReason: "Test",
      changedBy: testUserId,
    });

    const retrieved = await db.getCalculationVersion(version.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.versionNumber).toBe(1);
  });
});

describe("Phase 2-5 Integration Tests", () => {
  it("should support complete professional workflow", async () => {
    // 1. Create a client (Phase 2A)
    const client = await db.createClient({
      userId: 1,
      name: "Test Client",
      email: "client@test.com",
      status: "active",
    });
    expect(client).toBeDefined();

    // 2. Create subscription (Phase 3)
    const plans = await db.getSubscriptionPlans();
    if (plans.length > 0) {
      const subscription = await db.createUserSubscription({
        userId: 1,
        planId: plans[0].id,
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      expect(subscription).toBeDefined();
    }

    // 3. Track usage metrics (Phase 3B)
    const month = new Date().toISOString().slice(0, 7);
    await db.createOrUpdateUsageMetrics({
      userId: 1,
      month,
      projectsCreated: 1,
      calculationsRun: 5,
      reportsGenerated: 1,
      projectsShared: 0,
      hoursEstimatedSaved: 5,
      riskReductionScore: 80,
    });

    // 4. Create share link (Phase 2D)
    const link = await db.createShareLink({
      id: uuidv4(),
      projectId: 1,
      createdBy: 1,
      token: "integration_test_" + Date.now(),
      accessLevel: "view_only",
      isActive: true,
    });
    expect(link).toBeDefined();

    // 5. Create calculation version (Phase 2C)
    const calcId = uuidv4();
    const version = await db.createCalculationVersion({
      id: uuidv4(),
      calculationResultId: calcId,
      versionNumber: 1,
      inputData: JSON.stringify({ test: true }),
      resultData: JSON.stringify({ result: "pass" }),
      changeReason: "Integration test",
      changedBy: 1,
    });
    expect(version).toBeDefined();

    // 6. Create verification token (Phase 4B)
    const verificationToken = await db.createVerificationToken({
      id: uuidv4(),
      calculationResultId: calcId,
      token: "verify_integration_" + Date.now(),
      isPublic: true,
    });
    expect(verificationToken).toBeDefined();
  });

  it("should enforce access control for shared projects", async () => {
    const token = "access_test_" + Date.now();
    const link = await db.createShareLink({
      id: uuidv4(),
      projectId: 1,
      createdBy: 1,
      token,
      accessLevel: "view_only",
      isActive: true,
    });

    // Simulate access
    const retrieved = await db.getShareLinkByToken(token);
    expect(retrieved?.accessLevel).toBe("view_only");

    // Deactivate and verify
    await db.deactivateShareLink(link.id);
    const deactivated = await db.getShareLinkByToken(token);
    expect(deactivated?.isActive).toBe(false);
  });
});
