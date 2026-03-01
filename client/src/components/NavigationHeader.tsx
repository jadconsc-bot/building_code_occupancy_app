/**
 * Navigation Header Component
 * 
 * Professional navigation bar that displays all available features and tools
 * Provides quick access to:
 * - Occupancy Classification
 * - Project Management
 * - Rule Management
 * - Calculation History
 * - Professional Tools
 * - Settings
 */

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
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
  Building2,
  Calculator,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  FolderOpen,
  Shield,
  History,
  BookOpen,
  Zap,
} from 'lucide-react';
import { getLoginUrl } from '@/const';

export function NavigationHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      label: 'Occupancy Classifier',
      icon: Building2,
      href: '/',
      description: 'Classify building occupancy types',
    },
    {
      label: 'Projects',
      icon: FolderOpen,
      href: '/project-checklists',
      description: 'Create and manage projects',
    },
    {
      label: 'Calculators',
      icon: Calculator,
      href: '/',
      description: 'Access all calculation tools',
    },
    {
      label: 'Rule Management',
      icon: Shield,
      href: '/rule-management',
      description: 'Professional rule editor',
    },
    {
      label: 'Calculation History',
      icon: History,
      href: '/calculation-history',
      description: 'View past calculations',
    },
    {
      label: 'Documentation',
      icon: BookOpen,
      href: '/',
      description: 'User guide and help',
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/">
          <a className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded font-bold">
              AB
            </div>
            <span className="hidden sm:inline">CodeComply</span>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {features.slice(0, 4).map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <a className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                {feature.label}
              </a>
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Features Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Zap className="w-4 h-4 mr-2" />
                Tools
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Professional Tools</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.href} href={feature.href}>
                    <a className="w-full">
                      <DropdownMenuItem className="cursor-pointer">
                        <Icon className="w-4 h-4 mr-2" />
                        <div>
                          <div className="font-medium">{feature.label}</div>
                          <div className="text-xs text-muted-foreground">{feature.description}</div>
                        </div>
                      </DropdownMenuItem>
                    </a>
                  </Link>
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
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
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
            <Button
              size="sm"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Login
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/50 backdrop-blur">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href}>
                  <a
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div>{feature.label}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </div>
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
