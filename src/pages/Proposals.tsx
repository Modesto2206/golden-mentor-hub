import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, Download, Trash2, Edit, Send
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/AppLayout";

const internalStatusLabels: Record<string, string> = {
  em_analise: "Em Análise",
  pendente_formalizacao: "Pendente",
  aprovada: "Aprovado",
};

const internalStatusOptions = [
  { value: "em_analise", label: "Em Análise" },
  { value: "pendente_formalizacao", label: "Pendente" },
  { value: "aprovada", label: "Aprovado" },
];

const bankStatusLabels: Record<string, string> = {
  nao_enviado: "Não Enviado",
  recebido: "Recebido",
  pendente_documentos: "Pend. Documentos",
  pendente_assinatura: "Pend. Assinatura",
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  pago: "Pago",
};

const statusColors: Record<string, string> = {
  em_analise: "bg-amber-600/10 text-amber-600",
  pendente_formalizacao: "bg-orange-500/10 text-orange-500",
  aprovada: "bg-green-500/10 text-green-500",
};

const modalityLabels: Record<string, string> = {
  margem_livre: "Margem Livre",
  portabilidade: "Portabilidade",
  port_refinanciamento: "Port. + Refin.",
  cartao_consignado: "Cartão Consig.",
  fgts_antecipacao: "FGTS",
  credito_trabalhador: "Créd. Trab.",
};

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ProposalsPage = () => {
  const navigate = useNavigate();
  const { companyId, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankStatusFilter, setBankStatusFilter] = useState("all");
  const [editProposal, setEditProposal] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("proposals" as any) as any)
        .select("*, clients(full_name, cpf), banks(name, possui_api)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from("proposals" as any) as any)
        .update({ internal_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposta atualizada!" });
      setEditProposal(null);
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("proposals" as any) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposta excluída!" });
      setDeleteId(null);
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const sendToFacta = useMutation({
    mutationFn: async (proposalId: string) => {
      const { data, error } = await supabase.functions.invoke("enviar-proposta-facta", {
        body: { proposalId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao enviar para Facta");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposta enviada para Facta!", description: `Protocolo: ${data.protocolo || "—"}` });
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro ao enviar", description: e.message }),
  });

  const filtered = proposals.filter((p: any) => {
    const matchSearch = !search ||
      p.clients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.clients?.cpf?.includes(search.replace(/\D/g, "")) ||
      p.external_proposal_id?.includes(search);
    const matchStatus = statusFilter === "all" || p.internal_status === statusFilter;
    const matchBankStatus = bankStatusFilter === "all" || p.bank_status === bankStatusFilter;
    return matchSearch && matchStatus && matchBankStatus;
  });

  const totalValue = proposals.reduce((s: number, p: any) => s + (p.released_value || p.requested_value || 0), 0);
  const totalProposals = proposals.length;
  const approvedCount = proposals.filter((p: any) => p.internal_status === "aprovada").length;

  const canEditProposal = (p: any) => isAdmin || p.seller_id === user?.id;
  const canDeleteProposal = () => isAdmin;
  const isFactaBank = (p: any) => p.banks?.possui_api === true && p.banks?.name?.toLowerCase().includes("facta");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gold-gradient">Propostas</h1>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => navigate("/propostas/nova")}>
              <Plus className="w-4 h-4 mr-2" />Nova Proposta
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />Exportar
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total de Propostas</p>
              <p className="text-xl font-bold">{totalProposals}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Aprovadas</p>
              <p className="text-xl font-bold text-green-500">{approvedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar CPF, nome ou nº proposta..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status Interno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {internalStatusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bankStatusFilter} onValueChange={setBankStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status Banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(bankStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Proposals Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Nenhuma proposta encontrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status Interno</TableHead>
                    <TableHead>Status Banco</TableHead>
                    <TableHead className="hidden md:table-cell">Protocolo</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.clients?.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {modalityLabels[p.modality] || p.modality || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.banks?.name || "—"}</TableCell>
                      <TableCell>{formatCurrency(p.released_value || p.requested_value || 0)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusColors[p.internal_status] || "bg-muted text-muted-foreground"}`}>
                          {internalStatusLabels[p.internal_status] || p.internal_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {bankStatusLabels[p.bank_status] || p.bank_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono">
                        {p.protocolo_banco || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canEditProposal(p) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { setEditProposal(p); setEditStatus(p.internal_status); }}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {canDeleteProposal() && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {isFactaBank(p) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary"
                              title="Enviar para Facta"
                              disabled={sendToFacta.isPending}
                              onClick={() => sendToFacta.mutate(p.id)}>
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={!!editProposal} onOpenChange={() => setEditProposal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <p className="text-sm font-medium">{editProposal?.clients?.full_name}</p>
            </div>
            <div>
              <Label>Status Interno</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {internalStatusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editProposal?.protocolo_banco && (
              <div>
                <Label>Protocolo Banco</Label>
                <p className="text-sm font-mono">{editProposal.protocolo_banco}</p>
              </div>
            )}
            {editProposal?.erro_banco && (
              <div>
                <Label>Último Erro</Label>
                <p className="text-sm text-destructive">{editProposal.erro_banco}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProposal(null)}>Cancelar</Button>
            <Button onClick={() => updateProposal.mutate({ id: editProposal.id, status: editStatus })}
              disabled={updateProposal.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A proposta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteProposal.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ProposalsPage;
