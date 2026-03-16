import { useState, useMemo } from "react";
import { Upload, UserRoundSearch, FileSpreadsheet, Search, ArrowRightLeft, Trash2, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/AppLayout";
import LeadImportDialog from "@/components/leads/LeadImportDialog";
import { useLeads, PIPELINE_STAGES } from "@/hooks/useLeads";

const LeadsPage = () => {
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDeleteImported, setConfirmDeleteImported] = useState(false);
  const { leads, isLoading, convertToClient, isConverting, deleteLead, deleteImportedLeads, isDeletingImported, importedCount } = useLeads();

  const filteredLeads = useMemo(() => {
    if (!search) return leads;
    const s = search.toLowerCase();
    return leads.filter((l) =>
      l.name.toLowerCase().includes(s) ||
      (l.cpf || "").includes(s) ||
      (l.phone || "").includes(s) ||
      (l.email || "").toLowerCase().includes(s)
    );
  }, [leads, search]);

  const stageLabel = (key: string) => PIPELINE_STAGES.find((s) => s.key === key)?.label || key;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">Leads</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus leads e importe em massa</p>
          </div>
          <div className="flex gap-2">
            {importedCount > 0 && (
              <Button variant="destructive" onClick={() => setConfirmDeleteImported(true)} disabled={isDeletingImported}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Importados ({importedCount})
              </Button>
            )}
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Planilha
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Novos (Lead)</p>
              <p className="text-2xl font-bold">{leads.filter((l) => l.pipeline_stage === "lead").length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Em Negociação</p>
              <p className="text-2xl font-bold">{leads.filter((l) => !["lead", "paid"].includes(l.pipeline_stage) && !l.converted_to_client).length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Convertidos</p>
              <p className="text-2xl font-bold">{leads.filter((l) => l.converted_to_client).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF, telefone ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-sm">{lead.phone || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{lead.cpf || "—"}</TableCell>
                      <TableCell className="text-sm">{lead.source || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{stageLabel(lead.pipeline_stage)}</Badge>
                      </TableCell>
                      <TableCell>
                        {lead.converted_to_client ? (
                          <Badge variant="outline" className="text-xs text-green-600">Convertido</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {!lead.converted_to_client && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={isConverting} onClick={() => convertToClient(lead)}>
                              <ArrowRightLeft className="w-3 h-3 mr-1" />
                              Converter
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteLead(lead.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LeadImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={confirmDeleteImported} onOpenChange={setConfirmDeleteImported}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Excluir todos os leads importados?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover permanentemente <strong>{importedCount}</strong> leads que foram adicionados via importação de planilha. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteImportedLeads()}
            >
              Sim, excluir todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default LeadsPage;
