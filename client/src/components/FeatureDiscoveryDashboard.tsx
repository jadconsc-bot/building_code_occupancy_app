/**
 * Feature Discovery Dashboard
 * 
 * Displays all available features and tools in an organized, discoverable way
 * Shows feature cards with descriptions, icons, and quick access buttons
 * Helps users understand what capabilities are available
 */

import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Calculator,
  FileText,
  Shield,
  History,
  BookOpen,
  FolderOpen,
  Zap,
  TrendingUp,
  Lock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: 'core' | 'professional' | 'tools';
  badge?: string;
  isNew?: boolean;
}

const features: Feature[] = [
  {
    id: 'occupancy',
    title: 'Occupancy Classification',
    description: 'Classify building occupancy types according to NBC 2025 standards. Search and filter through all occupancy groups.',
    icon: <Building2 className="w-6 h-6" />,
    href: '/',
    category: 'core',
  },
  {
    id: 'projects',
    title: 'Project Management',
    description: 'Create and manage building projects. Track compliance requirements and project checklists.',
    icon: <FolderOpen className="w-6 h-6" />,
    href: '/project-checklists',
    category: 'core',
    isNew: true,
  },
  {
    id: 'calculators',
    title: 'Professional Calculators',
    description: 'Access 34+ specialized calculators for structural, plumbing, electrical, and accessibility calculations.',
    icon: <Calculator className="w-6 h-6" />,
    href: '/',
    category: 'tools',
    badge: '34+ Tools',
  },
  {
    id: 'rules',
    title: 'Rule Management',
    description: 'Professional rule editor with digital signatures, audit trails, and admin authorization. For authorized users only.',
    icon: <Shield className="w-6 h-6" />,
    href: '/rule-management',
    category: 'professional',
    badge: 'Admin Only',
  },
  {
    id: 'history',
    title: 'Calculation History',
    description: 'View all your past calculations with cryptographic signatures, verification status, and export options.',
    icon: <History className="w-6 h-6" />,
    href: '/calculation-history',
    category: 'tools',
    isNew: true,
  },
  {
    id: 'compliance',
    title: 'Compliance Checker',
    description: 'Verify building plans against NBC 2025 requirements. Identify code infractions and get recommendations.',
    icon: <CheckCircle2 className="w-6 h-6" />,
    href: '/',
    category: 'tools',
  },
  {
    id: 'analytics',
    title: 'Project Analytics',
    description: 'Track project metrics, compliance status, and calculation trends. Generate professional reports.',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/',
    category: 'professional',
  },
  {
    id: 'docs',
    title: 'Documentation',
    description: 'User guide, tutorials, and help articles. Learn how to use all features effectively.',
    icon: <BookOpen className="w-6 h-6" />,
    href: '/',
    category: 'core',
  },
];

export function FeatureDiscoveryDashboard() {
  const coreFeatures = features.filter((f) => f.category === 'core');
  const toolFeatures = features.filter((f) => f.category === 'tools');
  const professionalFeatures = features.filter((f) => f.category === 'professional');

  const FeatureCard = ({ feature }: { feature: Feature }) => (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">{feature.icon}</div>
            <div>
              <CardTitle className="text-base">{feature.title}</CardTitle>
              {feature.isNew && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                  New
                </span>
              )}
            </div>
          </div>
          {feature.badge && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
              {feature.badge}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <CardDescription className="text-sm mb-4 flex-1">{feature.description}</CardDescription>
        <Link href={feature.href}>
          <Button variant="outline" size="sm" className="w-full">
            Access <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Core Features */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Essential Features</h2>
          <p className="text-muted-foreground">Core tools for building code compliance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreFeatures.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* Professional Tools */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Professional Tools</h2>
          <p className="text-muted-foreground">Advanced features for consultants and administrators</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionalFeatures.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* Calculation Tools */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Calculation Tools</h2>
          <p className="text-muted-foreground">Specialized calculators for design and compliance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolFeatures.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
        <h3 className="text-lg font-semibold mb-4">Platform Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-3xl font-bold text-primary">42</div>
            <div className="text-sm text-muted-foreground">Occupancy Types</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">34+</div>
            <div className="text-sm text-muted-foreground">Calculators</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">NBC 2025</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">∞</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
        </div>
      </section>
    </div>
  );
}
