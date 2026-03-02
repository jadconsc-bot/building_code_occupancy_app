/**
 * Integration Tests
 * Test complete workflows and feature interactions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from '../db';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { UserRepository } from '../repositories/UserRepository';
import { SubscriptionService } from '../services/SubscriptionService';
import { MonetizationService } from '../services/MonetizationService';

describe('Integration Tests', () => {
  let projectRepo: ProjectRepository;
  let userRepo: UserRepository;
  let subscriptionService: SubscriptionService;
  let monetizationService: MonetizationService;

  beforeEach(() => {
    projectRepo = new ProjectRepository();
    userRepo = new UserRepository();
    subscriptionService = new SubscriptionService();
    monetizationService = new MonetizationService();
  });

  describe('User Workflow', () => {
    it('should create user and retrieve it', async () => {
      const user = await userRepo.createUser({
        openId: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(user).toBeDefined();
      expect(user?.openId).toBe('test-user-123');
      expect(user?.email).toBe('test@example.com');
    });

    it('should get user by openId', async () => {
      const created = await userRepo.createUser({
        openId: 'test-user-456',
        email: 'test2@example.com',
        name: 'Test User 2',
      });

      const retrieved = await userRepo.getUser('test-user-456');
      expect(retrieved?.openId).toBe(created?.openId);
    });

    it('should update user profile', async () => {
      const created = await userRepo.createUser({
        openId: 'test-user-789',
        email: 'test3@example.com',
        name: 'Test User 3',
      });

      if (created) {
        const updated = await userRepo.updateUser({
          id: created.id,
          name: 'Updated Name',
        });

        expect(updated?.name).toBe('Updated Name');
      }
    });
  });

  describe('Project Workflow', () => {
    it('should create project for user', async () => {
      const user = await userRepo.createUser({
        openId: 'project-test-1',
        email: 'project@example.com',
        name: 'Project Test User',
      });

      if (user) {
        const project = await projectRepo.createProject({
          userId: user.id,
          name: 'Test Project',
          description: 'Test Description',
          occupancyCode: 'A-1',
          buildingType: 'Residential',
        });

        expect(project).toBeDefined();
        expect(project?.name).toBe('Test Project');
        expect(project?.userId).toBe(user.id);
      }
    });

    it('should get user projects', async () => {
      const user = await userRepo.createUser({
        openId: 'project-test-2',
        email: 'project2@example.com',
        name: 'Project Test User 2',
      });

      if (user) {
        await projectRepo.createProject({
          userId: user.id,
          name: 'Project 1',
          occupancyCode: 'A-2',
        });

        await projectRepo.createProject({
          userId: user.id,
          name: 'Project 2',
          occupancyCode: 'B-1',
        });

        const projects = await projectRepo.getUserProjects(user.id);
        expect(projects.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should update project', async () => {
      const user = await userRepo.createUser({
        openId: 'project-test-3',
        email: 'project3@example.com',
        name: 'Project Test User 3',
      });

      if (user) {
        const project = await projectRepo.createProject({
          userId: user.id,
          name: 'Original Name',
          occupancyCode: 'A-3',
        });

        if (project) {
          const updated = await projectRepo.updateProject({
            id: project.id,
            userId: user.id,
            name: 'Updated Name',
          });

          expect(updated?.name).toBe('Updated Name');
        }
      }
    });

    it('should delete project', async () => {
      const user = await userRepo.createUser({
        openId: 'project-test-4',
        email: 'project4@example.com',
        name: 'Project Test User 4',
      });

      if (user) {
        const project = await projectRepo.createProject({
          userId: user.id,
          name: 'To Delete',
          occupancyCode: 'A-4',
        });

        if (project) {
          await projectRepo.deleteProject(project.id, user.id);
          const retrieved = await projectRepo.getProject(project.id, user.id);
          expect(retrieved).toBeUndefined();
        }
      }
    });
  });

  describe('Subscription Workflow', () => {
    it('should get default free subscription', async () => {
      const subscription = await subscriptionService.getSubscription(99999);
      expect(subscription.tier).toBe('free');
      expect(subscription.monthlyLimit).toBe(10);
    });

    it('should create subscription', async () => {
      const result = await subscriptionService.createSubscription({
        userId: 99998,
        tier: 'pro',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('active');
    });

    it('should upgrade subscription', async () => {
      const result = await subscriptionService.upgradeSubscription(99997, 'pro');
      expect(result).toBeDefined();
      expect(result.status).toBe('active');
    });

    it('should cancel subscription', async () => {
      const result = await subscriptionService.cancelSubscription(99996);
      expect(result.success).toBe(true);
    });
  });

  describe('Usage Tracking Workflow', () => {
    it('should track usage operation', async () => {
      await monetizationService.trackUsage({
        userId: 99995,
        operation: 'plan_analysis',
        cost: 0.05,
      });

      const info = await monetizationService.getSubscriptionInfo(99995);
      expect(info).toBeDefined();
    });

    it('should calculate monthly spending', async () => {
      const spending = await monetizationService.getMonthlySpending(99994);
      expect(typeof spending).toBe('number');
      expect(spending).toBeGreaterThanOrEqual(0);
    });

    it('should get usage breakdown', async () => {
      const breakdown = await monetizationService.getUsageBreakdown(99993);
      expect(typeof breakdown).toBe('object');
    });
  });

  describe('Authorization Checks', () => {
    it('should prevent unauthorized project access', async () => {
      const user1 = await userRepo.createUser({
        openId: 'auth-test-1',
        email: 'auth1@example.com',
        name: 'Auth Test 1',
      });

      const user2 = await userRepo.createUser({
        openId: 'auth-test-2',
        email: 'auth2@example.com',
        name: 'Auth Test 2',
      });

      if (user1 && user2) {
        const project = await projectRepo.createProject({
          userId: user1.id,
          name: 'Private Project',
          occupancyCode: 'A-5',
        });

        if (project) {
          const retrieved = await projectRepo.getProject(project.id, user2.id);
          expect(retrieved).toBeUndefined();
        }
      }
    });

    it('should prevent unauthorized project update', async () => {
      const user1 = await userRepo.createUser({
        openId: 'auth-test-3',
        email: 'auth3@example.com',
        name: 'Auth Test 3',
      });

      const user2 = await userRepo.createUser({
        openId: 'auth-test-4',
        email: 'auth4@example.com',
        name: 'Auth Test 4',
      });

      if (user1 && user2) {
        const project = await projectRepo.createProject({
          userId: user1.id,
          name: 'Private Project',
          occupancyCode: 'A-6',
        });

        if (project) {
          // User 2 tries to update user 1's project
          const updated = await projectRepo.updateProject({
            id: project.id,
            userId: user2.id,
            name: 'Hacked Name',
          });

          expect(updated).toBeUndefined();
        }
      }
    });
  });

  afterEach(() => {
    // Cleanup if needed
  });
});
