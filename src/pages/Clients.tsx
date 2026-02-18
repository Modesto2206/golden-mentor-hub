import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, MessageCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import AppLayout from "@/components/AppLayout";
import ClientFormDialog, { formatPhone, formatCPF, type ClientFormData } from "@/components/clients/ClientFormDialog";

const ClientsPage = () => {
  const { companyId, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("clients" as any) as any)
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const createClient = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const { error } = await (supabase.from("clients" as any) as any).insert({
        full_name: data.full_name,
        cpf: data.cpf.replace(/\D/g, ""),
        company_id: companyId!,
        created_by: user?.id || null,
        email: data.email || null,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        phone: data.phone.replace(/\D/g, "") || null,
        address_city: data.address_city || null,
        address_state: data.address_state || null,
        internal_notes: data.internal_notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente cadastrado com sucesso!" });
      setAddOpen(false);
    },
    onError: (e: any) => {
      const msg = e.message.includes("duplicate") ? "CPF já cadastrado nesta empresa" : e.message;
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });

  const updateClient = useMutation({
    mutationFn: async (data: ClientFormData & { id: string }) => {
      const { id, ...rest } = data;
      const { error } = await (supabase.from("clients" as any) as any)
        .update({
          full_name: rest.full_name,
          cpf: rest.cpf.replace(/\D/g, ""),
          email: rest.email || null,
          birth_date: rest.birth_date || null,
          gender: rest.gender || null,
          phone: rest.phone.replace(/\D/g, "") || null,
          address_city: rest.address_city || null,
          address_state: rest.address_state || null,
          internal_notes: rest.internal_notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente atualizado com sucesso!" });
      setEditOpen(false);
      setEditingClient(null);
    },
    onError: (e: any) => {
      const msg = e.message.includes("duplicate") ? "CPF já cadastrado nesta empresa" : e.message;
      toast({ variant: "destructive", title: "Erro", description: msg });
    },
  });

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setEditOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    setDeletingId(clientId);
    try {
      const { error } = await (supabase.from("clients" as any) as any)
        .delete()
        .eq("id", clientId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente excluído com sucesso" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao excluir cliente", description: e.message });
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const getEditDefaults = (client: any): Partial<ClientFormData> => ({
    full_name: client.full_name || "",
    cpf: formatCPF(client.cpf || ""),
    birth_date: client.birth_date || "",
    phone: client.phone ? formatPhone(client.phone) : "",
    email: client.email || "",
    gender: client.gender || "",
    address_city: client.address_city || "",
    address_state: client.address_state || "",
    internal_notes: client.internal_notes || "",
  });

  // Search logic
  const searchDigits = search.replace(/\D/g, "");
  const isSearchingCPF = searchDigits.length > 0;

  const filtered = clients.filter((c: any) => {
    if (!search) return true;
    if (isSearchingCPF) return c.cpf === searchDigits;
    return c.full_name.toLowerCase().includes(search.toLowerCase());
  });

  const maskCPF = (cpf: string) => {
    if (!cpf || cpf.length < 11) return cpf;
    return `${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)}`;
  };

  const getWhatsAppLink = (phone: string) => {
    const digits = phone?.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/55${digits}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">Clientes</h1>
            <p className="text-sm text-muted-foreground">{clients.length} clientes cadastrados</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou CPF exato..." className="pl-10" />
        </div>
        {isSearchingCPF && filtered.length === 0 && search.length > 0 && (
          <p className="text-sm text-muted-foreground">Cliente não encontrado</p>
        )}

        {/* Clients Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 && !isSearchingCPF ? (
              <p className="p-6 text-center text-muted-foreground">Nenhum cliente encontrado</p>
            ) : filtered.length === 0 ? null : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="hidden md:table-cell">Nascimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client: any) => {
                    const waLink = getWhatsAppLink(client.phone);
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.full_name}</TableCell>
                        <TableCell className="font-mono text-xs">{maskCPF(client.cpf)}</TableCell>
                        <TableCell>{client.phone ? formatPhone(client.phone) : "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {client.birth_date ? new Date(client.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.is_active ? "default" : "secondary"} className="text-xs">
                            {client.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => handleEdit(client)} title="Editar">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {waLink && (
                              <Button variant="ghost" size="sm" asChild className="text-green-500 hover:text-green-600 p-1 h-auto">
                                <a href={waLink} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                            {(isAdmin || client.created_by === user?.id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirmId(client.id)}
                                disabled={deletingId === client.id}
                                title="Excluir cliente"
                              >
                                {deletingId === client.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Client Dialog */}
      <ClientFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(d) => createClient.mutate(d)}
        isPending={createClient.isPending}
        title="Cadastrar Cliente"
        submitLabel="Cadastrar Cliente"
      />

      {/* Edit Client Dialog */}
      <ClientFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingClient(null);
        }}
        onSubmit={(d) => editingClient && updateClient.mutate({ ...d, id: editingClient.id })}
        isPending={updateClient.isPending}
        defaultValues={editingClient ? getEditDefaults(editingClient) : undefined}
        title="Editar Cliente"
        submitLabel="Salvar Alterações"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação é permanente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ClientsPage;
