import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, AlertCircle, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';

export default function SharedWithMe() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch shared projects
  const { data: sharedProjects, isLoading, error } = trpc.collaboration.listSharedWithMe.useQuery();

  // Fetch collaboration stats
  const { data: stats } = trpc.collaboration.getStats.useQuery();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please log in to view shared projects.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter projects based on search
  const filteredProjects = sharedProjects?.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.occupancyCode.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared with Me</h1>
          <p className="text-muted-foreground mt-2">
            Projects shared by your team members
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Projects Owned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projectsOwned}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Projects you created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Shared by Me</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projectsSharedByMe}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active shares you created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Shared with Me</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projectsSharedWithMe}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Projects you have access to
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by project name or occupancy code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shared Projects</CardTitle>
            <CardDescription>
              {filteredProjects.length} of {sharedProjects?.length || 0} projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>Failed to load shared projects. Please try again.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No projects match your search.' : 'No projects shared with you yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Occupancy Code</TableHead>
                      <TableHead>Shared By</TableHead>
                      <TableHead>Shared Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.occupancyCode}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{project.sharedByName}</p>
                            <p className="text-xs text-muted-foreground">
                              {project.sharedByEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(project.sharedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              project.status === 'active'
                                ? 'default'
                                : project.status === 'completed'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${project.overallProgress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {project.overallProgress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/project-analytics?projectId=${project.id}`)}
                            className="gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
