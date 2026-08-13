/**
 * Navigation Header Component
 * Role-based navigation with upgrade prompts for locked features.
 */

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  FileText,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  FolderOpen,
  Shield,
  History,
  Zap,
  FileImage,
  Lock,
  Users,
  Share2,
  GitBranch,
  CreditCard,
  Hammer,
  Plug,
  HelpCircle,
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

type UserRole = 'free' | 'home_user' | 'basic' | 'professional' | 'rule_editor' | 'admin';

const ROLE_RANK: Record<UserRole, number> = {
  free:         0,
  home_user:    1,
  basic:        2,
  professional: 3,
  rule_editor:  4,
  admin:        5,
};

function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

interface NavFeature {
  label: string;
  icon: any;
  href: string;
  description: string;
  requiredRole: UserRole;
  upgradeMessage?: string;
  primaryNav?: boolean;
  adminOnly?: boolean;
}

const NAV_FEATURES: NavFeature[] = [
  {
    label: 'Occupancy Classifier',
    icon: Building2,
    href: '/occupancy-classifier',
    description: 'Classify building occupancy types',
    requiredRole: 'free',
    primaryNav: true,
  },
  {
    label: 'Projects',
    icon: FolderOpen,
    href: '/',
    description: 'Create and manage projects',
    requiredRole: 'basic',
    upgradeMessage: 'Upgrade to Basic to manage projects',
    primaryNav: true,
  },
  {
    label: 'Compliance Engine',
    icon: Shield,
    href: '/compliance',
    description: 'Deterministic code compliance analysis',
    requiredRole: 'basic',
    upgradeMessage: 'Upgrade to Basic to access the Compliance Engine',
    primaryNav: true,
  },
  {
    label: 'Drawing Analyzer',
    icon: FileImage,
    href: '/drawing-analyzer',
    description: 'AI-powered drawing compliance check',
    requiredRole: 'basic',
    upgradeMessage: 'Upgrade to Basic to use the Drawing Analyzer',
    primaryNav: true,
  },
  {
    label: 'Calculation History',
    icon: History,
    href: '/calculation-history',
    description: 'View past calculations',
    requiredRole: 'basic',
    upgradeMessage: 'Upgrade to Basic to view calculation history',
    primaryNav: false,
  },
  {
    label: 'Project Sharing',
    icon: Share2,
    href: '/sharing',
    description: 'Share projects with reviewers',
    requiredRole: 'professional',
    upgradeMessage: 'Upgrade to Professional to share projects',
    primaryNav: false,
  },
  {
    label: 'Rule Management',
    icon: Shield,
    href: '/rule-management',
    description: 'Professional rule editor',
    requiredRole: 'rule_editor',
    upgradeMessage: 'Rule editing requires special authorization from an admin',
    primaryNav: false,
  },
  {
    label: 'Billing',
    icon: CreditCard,
    href: '/billing',
    description: 'Manage subscription and invoices',
    requiredRole: 'basic',
    upgradeMessage: 'Upgrade to access billing',
    primaryNav: false,
  },
  {
    label: 'Contractor Tools',
    icon: Hammer,
    href: '/contractor',
    description: 'Job site calculators',
    requiredRole: 'free',
    primaryNav: false,
  },
  {
    label: 'Integrations',
    icon: Plug,
    href: '/integrations',
    description: 'Connect external platforms',
    requiredRole: 'professional',
    upgradeMessage: 'Upgrade to Professional to access Integrations',
    primaryNav: false,
  },
  {
    label: 'Home Report',
    icon: Home,
    href: '/home',
    description: 'Get a $29 permit compliance report',
    requiredRole: 'free',
    primaryNav: false,
  },
  {
    label: 'My Reports',
    icon: FileText,
    href: '/home/reports',
    description: 'View your Home compliance reports',
    requiredRole: 'home_user',
    primaryNav: false,
  },
  {
    label: 'Clients',
    icon: Users,
    href: '/clients',
    description: 'Manage client contacts',
    requiredRole: 'professional',
    primaryNav: false,
  },
  {
    label: 'Versions',
    icon: GitBranch,
    href: '/versions',
    description: 'Track calculation versions',
    requiredRole: 'admin',
    adminOnly: true,
    primaryNav: false,
  },
  {
    label: 'Admin',
    icon: Shield,
    href: '/admin',
    description: 'Admin dashboard',
    requiredRole: 'admin',
    adminOnly: true,
    primaryNav: false,
  },
];

export function NavigationHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRole: UserRole = (user?.role as UserRole) ?? 'free';

  const pendingCountQuery = trpc.complianceMonitor.getPendingCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
  const pendingCount = pendingCountQuery.data?.count ?? 0;

  const canAccess = (feature: NavFeature) => hasRole(userRole, feature.requiredRole);

  // Primary nav items (max 4, visible in top bar)
  const primaryFeatures = NAV_FEATURES.filter(f => f.primaryNav && !f.adminOnly);

  // Tools dropdown — all features visible to this role + locked ones with upgrade message
  // Admin-only features only show to admins
  const toolsFeatures = NAV_FEATURES.filter(f =>
    !f.adminOnly || userRole === 'admin'
  );

  const handleNavClick = (feature: NavFeature) => {
    if (!canAccess(feature)) return;
    navigate(feature.href);
    setMobileMenuOpen(false);
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full bg-[#1B3A6B] text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <div
            className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-[#E07B39] text-white flex items-center justify-center rounded font-bold text-xs">
              {userRole === 'admin' ? 'AB' : userRole === 'professional' ? 'PR' : userRole === 'basic' ? 'BS' : 'CC'}
            </div>
            <span className="hidden sm:inline text-white">CodeComply</span>
          </div>

          {/* Desktop Primary Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryFeatures.map((feature) => {
              const accessible = canAccess(feature);
              const showBadge = feature.href === '/compliance' && pendingCount > 0;
              const item = (
                <button
                  key={feature.href}
                  onClick={() => accessible && navigate(feature.href)}
                  className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    accessible
                      ? 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
                      : 'text-white/30 cursor-not-allowed'
                  }`}
                >
                  {!accessible && <Lock className="w-3 h-3" />}
                  {feature.label}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </button>
              );

              if (!accessible && feature.upgradeMessage) {
                return (
                  <Tooltip key={feature.href}>
                    <TooltipTrigger asChild>{item}</TooltipTrigger>
                    <TooltipContent>
                      <p>{feature.upgradeMessage}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return item;
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white"
                  onClick={() => navigate('/documentation')}
                  aria-label="Open user guide"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>User Guide</TooltipContent>
            </Tooltip>

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex text-white border-white/30 hover:bg-white/10 bg-transparent">
                  <Zap className="w-4 h-4 mr-2" />
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Features</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {toolsFeatures.map((feature) => {
                  const Icon = feature.icon;
                  const accessible = canAccess(feature);
                  return (
                    <DropdownMenuItem
                      key={feature.href}
                      className={accessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                      onClick={() => accessible && navigate(feature.href)}
                      disabled={!accessible}
                    >
                      {accessible
                        ? <Icon className="w-4 h-4 mr-2" />
                        : <Lock className="w-4 h-4 mr-2 text-muted-foreground" />
                      }
                      <div className="flex-1">
                        <div className="font-medium">{feature.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {accessible ? feature.description : feature.upgradeMessage}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center rounded-full text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm text-white">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <span>{user.email}</span>
                      {(user as any).isFoundingMember && (
                        <span className="bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                          FOUNDING
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize font-normal mt-0.5">
                      {userRole === 'rule_editor' ? 'Rule Editor' : userRole.charAt(0).toUpperCase() + userRole.slice(1)} Plan
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  {hasRole(userRole, 'basic') && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate('/billing')}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing
                    </DropdownMenuItem>
                  )}
                  {userRole === 'admin' && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate('/admin')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => openSignIn()}>
                Login
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-[#1B3A6B]">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
              {toolsFeatures.map((feature) => {
                const Icon = feature.icon;
                const accessible = canAccess(feature);
                return (
                  <button
                    key={feature.href}
                    onClick={() => handleNavClick(feature)}
                    disabled={!accessible}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left w-full ${
                      accessible
                        ? 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer'
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {accessible
                      ? <Icon className="w-4 h-4 flex-shrink-0" />
                      : <Lock className="w-4 h-4 flex-shrink-0" />
                    }
                    <div>
                      <div>{feature.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {accessible ? feature.description : feature.upgradeMessage}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>
    </TooltipProvider>
  );
}
