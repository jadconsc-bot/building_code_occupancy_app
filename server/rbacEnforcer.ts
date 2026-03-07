/**
 * RBAC Enforcer
 * 
 * Role-Based Access Control enforcement
 * Provides granular permissions for different user roles:
 * - Architect: Full access, can create and modify calculations
 * - Consultant: Can view and create calculations, limited modification
 * - Reviewer: Read-only access, can approve/reject
 * - Authority: Administrative access, can manage rules and users
 */

type UserRole = 'admin' | 'architect' | 'consultant' | 'reviewer' | 'user';

interface Permission {
  resource: string;
  action: string;
  allowed: boolean;
}

interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

/**
 * RBAC Enforcer
 * Manages role-based access control
 */
export class RBACEnforcer {
  private rolePermissions: Map<UserRole, Permission[]> = new Map();

  constructor() {
    this.initializeRoles();
  }

  /**
   * Initialize role-based permissions
   */
  private initializeRoles(): void {
    // Admin - Full access
    this.rolePermissions.set('admin', [
      { resource: 'calculations', action: 'create', allowed: true },
      { resource: 'calculations', action: 'read', allowed: true },
      { resource: 'calculations', action: 'update', allowed: true },
      { resource: 'calculations', action: 'delete', allowed: true },
      { resource: 'rules', action: 'create', allowed: true },
      { resource: 'rules', action: 'read', allowed: true },
      { resource: 'rules', action: 'update', allowed: true },
      { resource: 'rules', action: 'delete', allowed: true },
      { resource: 'users', action: 'manage', allowed: true },
      { resource: 'audit', action: 'read', allowed: true },
      { resource: 'reports', action: 'generate', allowed: true },
    ]);

    // Architect - Can create and modify calculations
    this.rolePermissions.set('architect', [
      { resource: 'calculations', action: 'create', allowed: true },
      { resource: 'calculations', action: 'read', allowed: true },
      { resource: 'calculations', action: 'update', allowed: true },
      { resource: 'calculations', action: 'delete', allowed: false },
      { resource: 'rules', action: 'read', allowed: true },
      { resource: 'rules', action: 'update', allowed: false },
      { resource: 'audit', action: 'read', allowed: true },
      { resource: 'reports', action: 'generate', allowed: true },
    ]);

    // Consultant - Can view and create calculations, limited modification
    this.rolePermissions.set('consultant', [
      { resource: 'calculations', action: 'create', allowed: true },
      { resource: 'calculations', action: 'read', allowed: true },
      { resource: 'calculations', action: 'update', allowed: true },
      { resource: 'calculations', action: 'delete', allowed: false },
      { resource: 'rules', action: 'read', allowed: true },
      { resource: 'audit', action: 'read', allowed: false },
      { resource: 'reports', action: 'generate', allowed: true },
    ]);

    // Reviewer - Read-only, can approve/reject
    this.rolePermissions.set('reviewer', [
      { resource: 'calculations', action: 'read', allowed: true },
      { resource: 'calculations', action: 'approve', allowed: true },
      { resource: 'calculations', action: 'reject', allowed: true },
      { resource: 'rules', action: 'read', allowed: true },
      { resource: 'audit', action: 'read', allowed: true },
      { resource: 'reports', action: 'generate', allowed: false },
    ]);

    // User - Basic access
    this.rolePermissions.set('user', [
      { resource: 'calculations', action: 'read', allowed: true },
      { resource: 'rules', action: 'read', allowed: true },
    ]);
  }

  /**
   * Check if user has permission
   */
  hasPermission(role: UserRole, resource: string, action: string): boolean {
    const permissions = this.rolePermissions.get(role);

    if (!permissions) {
      return false;
    }

    const permission = permissions.find(
      p => p.resource === resource && p.action === action
    );

    return permission?.allowed || false;
  }

  /**
   * Enforce permission check
   * Throws error if permission denied
   */
  enforcePermission(role: UserRole, resource: string, action: string): void {
    if (!this.hasPermission(role, resource, action)) {
      throw new Error(
        `Access denied: ${role} cannot ${action} ${resource}`
      );
    }
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return this.rolePermissions.get(role) || [];
  }

  /**
   * Check if user can perform calculation
   */
  canPerformCalculation(role: UserRole, action: 'create' | 'modify' | 'view'): boolean {
    const actionMap = {
      create: 'create',
      modify: 'update',
      view: 'read',
    };

    return this.hasPermission(role, 'calculations', actionMap[action]);
  }

  /**
   * Check if user can manage rules
   */
  canManageRules(role: UserRole): boolean {
    return this.hasPermission(role, 'rules', 'update');
  }

  /**
   * Check if user can view audit logs
   */
  canViewAudit(role: UserRole): boolean {
    return this.hasPermission(role, 'audit', 'read');
  }

  /**
   * Check if user can approve calculations
   */
  canApproveCalculations(role: UserRole): boolean {
    return this.hasPermission(role, 'calculations', 'approve');
  }

  /**
   * Check if user can generate reports
   */
  canGenerateReports(role: UserRole): boolean {
    return this.hasPermission(role, 'reports', 'generate');
  }

  /**
   * Create RBAC audit entry
   */
  createAuditEntry(
    userId: number,
    userName: string,
    role: UserRole,
    resource: string,
    action: string,
    allowed: boolean,
    details: Record<string, any>
  ): {
    timestamp: Date;
    userId: number;
    userName: string;
    role: string;
    resource: string;
    action: string;
    allowed: boolean;
    details: Record<string, any>;
  } {
    return {
      timestamp: new Date(),
      userId,
      userName,
      role,
      resource,
      action,
      allowed,
      details,
    };
  }

  /**
   * Get role hierarchy
   */
  getRoleHierarchy(): Record<UserRole, number> {
    return {
      admin: 5,
      architect: 4,
      consultant: 3,
      reviewer: 2,
      user: 1,
    };
  }

  /**
   * Check if user role is higher than minimum required
   */
  isRoleHighEnough(userRole: UserRole, minimumRole: UserRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    return (hierarchy[userRole] || 0) >= (hierarchy[minimumRole] || 0);
  }
}

export default RBACEnforcer;
