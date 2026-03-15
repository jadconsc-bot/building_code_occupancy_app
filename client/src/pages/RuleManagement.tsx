import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

interface Rule {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'active' | 'inactive';
  jurisdiction: string;
  createdDate: string;
  lastModified: string;
}

const SAMPLE_RULES: Rule[] = [
  {
    id: '1',
    name: 'Occupancy Load Calculation',
    category: 'Occupancy',
    description: 'Rules for calculating occupancy load based on building type',
    status: 'active',
    jurisdiction: 'National',
    createdDate: '2025-01-15',
    lastModified: '2025-03-10',
  },
  {
    id: '2',
    name: 'Fire Separation Requirements',
    category: 'Fire Safety',
    description: 'Minimum fire separation distances between buildings',
    status: 'active',
    jurisdiction: 'National',
    createdDate: '2025-01-20',
    lastModified: '2025-02-28',
  },
  {
    id: '3',
    name: 'Electrical Load Calculation',
    category: 'Electrical',
    description: 'Service load calculation methods for residential buildings',
    status: 'active',
    jurisdiction: 'National',
    createdDate: '2025-02-01',
    lastModified: '2025-03-05',
  },
];

export default function RuleManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>(SAMPLE_RULES);

  const filteredRules = rules.filter((rule) => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || rule.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(rules.map((r) => r.category)));

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      setRules(rules.filter((r) => r.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setRules(rules.map((r) =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r
    ));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rule Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage building code rules for your organization
          </p>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rules found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredRules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{rule.name}</h3>
                        <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                          {rule.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : null}
                          {rule.status}
                        </Badge>
                        <Badge variant="outline">{rule.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Jurisdiction: {rule.jurisdiction}</span>
                        <span>Created: {rule.createdDate}</span>
                        <span>Modified: {rule.lastModified}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(rule.id)}
                      >
                        {rule.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rules.filter((r) => r.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
