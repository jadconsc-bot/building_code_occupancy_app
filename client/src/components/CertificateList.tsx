import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock 
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CertificateListProps {
  onSelectCertificate?: (certificateId: string) => void;
  onExport?: (certificateId: string) => void;
}

export function CertificateList({ onSelectCertificate, onExport }: CertificateListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(0);

  // Fetch certificates
  const { data: certificatesData, isLoading } = trpc.certification.listCertificates.useQuery({
    limit: 10,
    offset: page * 10,
  });

  // Delete mutation
  const deleteMutation = trpc.certification.deleteCertificate.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      trpc.useUtils().certification.listCertificates.invalidate();
    },
  });

  const certificates = certificatesData?.certificates || [];
  const total = certificatesData?.total || 0;
  const totalPages = Math.ceil(total / 10);

  // Filter certificates
  const filteredCertificates = certificates.filter((cert: any) => {
    const matchesSearch = 
      cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cert.projectName && cert.projectName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || cert.complianceStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort certificates
  const sortedCertificates = [...filteredCertificates].sort((a: any, b: any) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      case "oldest":
        return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
      case "name":
        return (a.projectName || "").localeCompare(b.projectName || "");
      default:
        return 0;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "non-compliant":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "needs-review":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificates</CardTitle>
        <CardDescription>Manage and view your compliance certificates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="non-compliant">Non-Compliant</SelectItem>
              <SelectItem value="needs-review">Needs Review</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Certificate List */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading certificates...</p>
          </div>
        ) : sortedCertificates.length > 0 ? (
          <div className="space-y-2">
            {sortedCertificates.map((cert: any) => (
              <div
                key={cert.certificateId}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-muted rounded">
                    {getStatusIcon(cert.complianceStatus)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{cert.projectName || "Untitled"}</h4>
                      <Badge variant={cert.complianceStatus === "compliant" ? "default" : "secondary"}>
                        {cert.complianceStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cert.certificateId} • {new Date(cert.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectCertificate?.(cert.certificateId)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExport?.(cert.certificateId)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ certificateId: cert.certificateId, reason: "User deletion" })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No certificates found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
