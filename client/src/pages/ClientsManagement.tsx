/**
 * Clients Management Page
 * Phase 2A: Professional client management for consultants
 * FULLY INTEGRATED WITH tRPC MUTATIONS AND OPTIMISTIC UI UPDATES
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ClientsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    industry: "",
    notes: "",
  });

  // Fetch clients using tRPC
  const { data: clients = [], isLoading, refetch } = trpc.clients.list.useQuery();

  // Create client mutation with optimistic UI
  const createClientMutation = trpc.clients.create.useMutation({
    onMutate: async (newClient) => {
      // Cancel outgoing refetches
      await trpc.useUtils().clients.list.cancel();

      // Snapshot the previous value
      const previousClients = trpc.useUtils().clients.list.getData();

      // Optimistically update to the new value
      trpc.useUtils().clients.list.setData(undefined, (old) => [
        ...(old || []),
        { ...newClient, id: Date.now() } as any,
      ]);

      return { previousClients };
    },
    onError: (err, newClient, context) => {
      // Rollback on error
      if (context?.previousClients) {
        trpc.useUtils().clients.list.setData(undefined, context.previousClients);
      }
      alert("Failed to create client: " + err.message);
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Update client mutation with optimistic UI
  const updateClientMutation = trpc.clients.update.useMutation({
    onMutate: async (updatedClient) => {
      await trpc.useUtils().clients.list.cancel();
      const previousClients = trpc.useUtils().clients.list.getData();

      trpc.useUtils().clients.list.setData(undefined, (old) =>
        old?.map((c) => (c.id === updatedClient.id ? { ...c, ...updatedClient } : c))
      );

      return { previousClients };
    },
    onError: (err, updatedClient, context) => {
      if (context?.previousClients) {
        trpc.useUtils().clients.list.setData(undefined, context.previousClients);
      }
      alert("Failed to update client: " + err.message);
    },
    onSuccess: () => {
      refetch();
      setIsEditOpen(false);
      resetForm();
    },
  });

  // Delete client mutation with optimistic UI
  const deleteClientMutation = trpc.clients.delete.useMutation({
    onMutate: async (input: { id: number }) => {
      await trpc.useUtils().clients.list.cancel();
      const previousClients = trpc.useUtils().clients.list.getData();

      trpc.useUtils().clients.list.setData(undefined, (old) =>
        old?.filter((c) => c.id !== input.id)
      );

      return { previousClients };
    },
    onError: (err, clientId, context) => {
      if (context?.previousClients) {
        trpc.useUtils().clients.list.setData(undefined, context.previousClients);
      }
      alert("Failed to delete client: " + err.message);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [clients, searchQuery]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      companyName: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      industry: "",
      notes: "",
    });
    setEditingClientId(null);
  };

  const handleCreateClient = async () => {
    if (!formData.name.trim()) {
      alert("Client name is required");
      return;
    }

    await createClientMutation.mutateAsync({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      companyName: formData.companyName || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      province: formData.province || undefined,
      postalCode: formData.postalCode || undefined,
      industry: formData.industry || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleEditClient = (client: any) => {
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      companyName: client.companyName || "",
      address: client.address || "",
      city: client.city || "",
      province: client.province || "",
      postalCode: client.postalCode || "",
      industry: client.industry || "",
      notes: client.notes || "",
    });
    setEditingClientId(client.id);
    setIsEditOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!formData.name.trim()) {
      alert("Client name is required");
      return;
    }

    if (editingClientId !== null) {
      await updateClientMutation.mutateAsync({
        clientId: editingClientId,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        companyName: formData.companyName || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        province: formData.province || undefined,
        postalCode: formData.postalCode || undefined,
        industry: formData.industry || undefined,
        notes: formData.notes || undefined,
      });
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (confirm("Are you sure you want to delete this client?")) {
      await deleteClientMutation.mutateAsync({ clientId });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client contacts and information</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>Add a new client to your contact list</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1-403-555-0100"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="Acme Construction Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateClient}
                disabled={createClientMutation.isPending}
              >
                {createClientMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Client Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  placeholder="+1-403-555-0100"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company Name</Label>
              <Input
                id="edit-company"
                placeholder="Acme Construction Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleUpdateClient}
              disabled={updateClientMutation.isPending}
            >
              {updateClientMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Clients</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${filteredClients.length} client${filteredClients.length !== 1 ? "s" : ""} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No clients found</p>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create your first client
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.companyName || "-"}</TableCell>
                      <TableCell className="text-sm">{client.email || "-"}</TableCell>
                      <TableCell className="text-sm">{client.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClient(client)}
                            disabled={updateClientMutation.isPending}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteClient(client.id)}
                            disabled={deleteClientMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
  );
}
