import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function CertificateManagement() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user's certificates
  const { data: certificates, isLoading: certificatesLoading } = trpc.certification.listCertificates.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Management</CardTitle>
            <CardDescription>Please log in to manage your certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need to be authenticated to access certificate management features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Certificate Management</h1>
        <p className="text-muted-foreground">Manage, generate, export, and verify your compliance certificates</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">
            <FileText className="w-4 h-4 mr-2" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Plus className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileText className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="verify">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Verify
          </TabsTrigger>
        </TabsList>

        {/* Certificate List Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Certificates</CardTitle>
              <CardDescription>View and manage all your compliance certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    className="w-full pl-9 pr-4 py-2 border border-input rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {certificatesLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading certificates...</p>
                </div>
              ) : certificates && certificates.certificates && certificates.certificates.length > 0 ? (
                <div className="space-y-4">
                  {certificates.certificates.map((cert: any) => (
                    <div
                      key={cert.certificateId}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{cert.certificateId}</h3>
                          <Badge variant={cert.complianceStatus === "compliant" ? "default" : "secondary"}>
                            {cert.complianceStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Generated {new Date(cert.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Export
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No certificates yet. Create one to get started.</p>
                  <Button
                    className="mt-4"
                    onClick={() => setActiveTab("generate")}
                  >
                    Generate Certificate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Certificate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Certificate</CardTitle>
              <CardDescription>Create a new compliance certificate from your project data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Certificate generation form will be implemented here</p>
                <p className="text-sm text-muted-foreground">This component will integrate with the generateCertificate tRPC procedure</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Certificate Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Certificates</CardTitle>
              <CardDescription>Export certificates in PDF, JSON, or CSV format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Certificate export form will be implemented here</p>
                <p className="text-sm text-muted-foreground">Supports PDF, JSON, and CSV export formats</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verify Certificate Tab */}
        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verify Certificate</CardTitle>
              <CardDescription>Verify the authenticity and integrity of a certificate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Certificate verification form will be implemented here</p>
                <p className="text-sm text-muted-foreground">Public verification available without authentication</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
