import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Search, FileText, Download, Settings, Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";

const internalStatusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  pre_cadastrada: "Pré-Cadastrada",
  cadastrada: "Cadastrada",
  enviada_analise: "Enviada p/ Análise",
  em_analise: "Em Análise",
  pendente_formalizacao: "Pend. Formalização",
  pendente_assinatura: "Pend. Assinatura",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
  paga_liberada: "Paga/Liberada",
};

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
  rascunho: "bg-muted text-muted-foreground",
  pre_cadastrada: "bg-blue-500/10 text-blue-500",
  cadastrada: "bg-blue-600/10 text-blue-600",
  enviada_analise: "bg-amber-500/10 text-amber-500",
  em_analise: "bg-amber-600/10 text-amber-600",
  pendente_formalizacao: "bg-orange-500/10 text-orange-500",
  pendente_assinatura: "bg-orange-600/10 text-orange-600",
  aprovada: "bg-green-500/10 text-green-500",
  reprovada: "bg-destructive/10 text-destructive",
  cancelada: "bg-destructive/20 text-destructive",
  paga_liberada: "bg-green-600/10 text-green-600",
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
  const { companyId } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankStatusFilter, setBankStatusFilter] = useState("all");

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("proposals" as any) as any)
        .select("*, clients(full_name, cpf), banks(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
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

  // Dashboard cards
  const totalValue = proposals.reduce((s: number, p: any) => s + (p.released_value || p.requested_value || 0), 0);
  const totalProposals = proposals.length;
  const approvedCount = proposals.filter((p: any) => ["aprovada", "paga_liberada"].includes(p.internal_status)).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Buttons */}
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
              <p className="text-xs text-muted-foreground">Aprovadas / Pagas</p>
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
              {Object.entries(internalStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
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
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/30">
                      <TableCell className="font-medium">{p.clients?.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {modalityLabels[p.modality] || p.modality || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.banks?.name || "—"}</TableCell>
                      <TableCell>{formatCurrency(p.released_value || p.requested_value || 0)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusColors[p.internal_status] || ""}`}>
                          {internalStatusLabels[p.internal_status] || p.internal_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {bankStatusLabels[p.bank_status] || p.bank_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProposalsPage;
