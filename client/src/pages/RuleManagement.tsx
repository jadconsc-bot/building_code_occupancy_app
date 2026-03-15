import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

// Simple toast notification helper
const useToast = () => ({
  toast: (props: any) => {
    console.log('Notification:', props.title, '-', props.description);
    // Could integrate with a toast library here
  },
});

export default function RuleManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const [showCustomRuleDialog, setShowCustomRuleDialog] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');
  const [newRuleKeywords, setNewRuleKeywords] = useState('');

  // tRPC queries
  const { data: jurisdictions = [] } = trpc.rules.getJurisdictions.useQuery();
  const { data: categories = [] } = trpc.rules.getCategories.useQuery();
  const { data: searchResults = [] } = trpc.rules.search.useQuery({
    query: searchQuery,
    jurisdiction: selectedJurisdiction || undefined,
    category: selectedCategory || undefined,
    limit: 100,
  });

  // tRPC mutations
  const applyRuleMutation = trpc.rules.applyRule.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Rule applied successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createCustomRuleMutation = trpc.rules.createCustomRule.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Custom rule created successfully',
      });
      setShowCustomRuleDialog(false);
      setNewRuleName('');
      setNewRuleDescription('');
      setNewRuleCategory('');
      setNewRuleKeywords('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter rules
  const filteredRules = useMemo(() => {
    return (searchResults || []).filter((rule: any) => {
      const matchesSearch = !searchQuery || 
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.keywords?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesJurisdiction = !selectedJurisdiction || rule.jurisdiction === selectedJurisdiction;
      const matchesCategory = !selectedCategory || rule.category === selectedCategory;
      
      return matchesSearch && matchesJurisdiction && matchesCategory;
    });
  }, [searchResults, searchQuery, selectedJurisdiction, selectedCategory]);

  const handleApplyRule = (ruleId: number) => {
    applyRuleMutation.mutate({ ruleId });
  };

  const handleCreateCustomRule = () => {
    if (!newRuleName || !newRuleDescription || !newRuleCategory) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createCustomRuleMutation.mutate({
      name: newRuleName,
      description: newRuleDescription,
      category: newRuleCategory,
      keywords: newRuleKeywords,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Rule Management</h1>
            <p className="text-muted-foreground">
              Search, apply, and manage building code rules for your projects
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rules by name, description, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Jurisdiction</Label>
                  <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Jurisdictions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Jurisdictions</SelectItem>
                      {jurisdictions.map((j: string) => (
                        <SelectItem key={j} value={j}>
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((c: string) => (
                        <SelectItem key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => setShowCustomRuleDialog(true)}
                    className="gap-2 w-full"
                  >
                    <Plus className="h-4 w-4" />
                    New Custom Rule
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No rules found. Try adjusting your filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredRules.map((rule: any) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{rule.name}</h3>
                        <Badge variant="outline">{rule.category}</Badge>
                        <Badge variant="secondary">{rule.jurisdiction}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                      {rule.nbcReference && (
                        <p className="text-xs text-muted-foreground">
                          <strong>NBC Reference:</strong> {rule.nbcReference}
                        </p>
                      )}
                      {rule.keywords && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>Keywords:</strong> {rule.keywords}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplyRule(rule.id)}
                        disabled={applyRuleMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-6 text-sm text-muted-foreground">
          Showing {filteredRules.length} of {searchResults.length} rules
        </div>
      </div>

      {/* New Custom Rule Dialog */}
      <Dialog open={showCustomRuleDialog} onOpenChange={setShowCustomRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Rule</DialogTitle>
            <DialogDescription>
              Create a custom rule for your organization with full audit trail
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-name">Rule Name *</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Maximum Occupant Load"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="rule-description">Description *</Label>
              <Textarea
                id="rule-description"
                placeholder="Detailed description of the rule..."
                value={newRuleDescription}
                onChange={(e) => setNewRuleDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="rule-category">Category *</Label>
              <Select value={newRuleCategory} onValueChange={setNewRuleCategory}>
                <SelectTrigger id="rule-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: string) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rule-keywords">Keywords (optional)</Label>
              <Input
                id="rule-keywords"
                placeholder="e.g., occupancy, load, capacity"
                value={newRuleKeywords}
                onChange={(e) => setNewRuleKeywords(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomRuleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomRule}
              disabled={createCustomRuleMutation.isPending}
            >
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
