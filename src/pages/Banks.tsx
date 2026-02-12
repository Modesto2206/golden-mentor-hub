import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Landmark, Plus, Grid3X3, List, SlidersHorizontal,
  Edit, Trash2, ToggleLeft, ToggleRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";

const modalityLabels: Record<string, string> = {
  margem_livre: "Margem Livre",
  portabilidade: "Portabilidade",
  port_refinanciamento: "Port. + Refinanciamento",
  cartao_consignado: "Cartão Consignado",
  fgts_antecipacao: "FGTS (Antecipação)",
  credito_trabalhador: "Crédito do Trabalhador",
};

const filterChips = [
  { label: "Todos", value: "all" },
  { label: "Margem", value: "margem_livre" },
  { label: "Portabilidade", value: "portabilidade" },
  { label: "Port c/ Refin", value: "port_refinanciamento" },
  { label: "Cartão", value: "cartao_consignado" },
  { label: "FGTS", value: "fgts_antecipacao" },
  { label: "CLT", value: "credito_trabalhador" },
];

const BanksPage = () => {
  const { isAdmin, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "priority" | "recent">("name");
  const [addOpen, setAddOpen] = useState(false);
  const [newBank, setNewBank] = useState({ name: "", code: "" });

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["banks", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("banks" as any) as any)
        .select("*, products(*)")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const createBank = useMutation({
    mutationFn: async (bankData: { name: string; code: string }) => {
      const { error } = await (supabase.from("banks" as any) as any).insert({
        ...bankData,
        company_id: companyId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast({ title: "Banco adicionado com sucesso!" });
      setAddOpen(false);
      setNewBank({ name: "", code: "" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const filtered = banks
    .filter((b: any) => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || 
        b.products?.some((p: any) => p.modality === filter);
      return matchSearch && matchFilter;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "priority") return (b.priority || 0) - (a.priority || 0);
      if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.name.localeCompare(b.name);
    });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">Bancos Disponíveis</h1>
            <p className="text-sm text-muted-foreground">{banks.length} bancos cadastrados</p>
          </div>
          {isAdmin && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Novo Banco</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Banco</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Banco</Label>
                    <Input value={newBank.name} onChange={(e) => setNewBank({ ...newBank, name: e.target.value })} placeholder="Ex: Banco do Brasil" />
                  </div>
                  <div>
                    <Label>Código</Label>
                    <Input value={newBank.code} onChange={(e) => setNewBank({ ...newBank, code: e.target.value })} placeholder="Ex: 001" />
                  </div>
                  <Button onClick={() => createBank.mutate(newBank)} disabled={!newBank.name || createBank.isPending} className="w-full">
                    {createBank.isPending ? "Salvando..." : "Adicionar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar banco..." className="pl-10" />
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-44">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Ordem Alfabética</SelectItem>
                <SelectItem value="priority">Prioridade</SelectItem>
                <SelectItem value="recent">Mais Recente</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <Badge
                key={chip.value}
                variant={filter === chip.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter(chip.value)}
              >
                {chip.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Banks Grid/List */}
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum banco encontrado</CardContent></Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((bank: any) => (
              <Card key={bank.id} className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{bank.name}</CardTitle>
                      {bank.code && <CardDescription className="text-xs">Código: {bank.code}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {bank.products?.slice(0, 3).map((p: any) => (
                      <Badge key={p.id} variant="outline" className="text-[10px]">
                        {modalityLabels[p.modality] || p.modality}
                      </Badge>
                    ))}
                    {bank.products?.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">+{bank.products.length - 3}</Badge>
                    )}
                  </div>
                  {!bank.products?.length && (
                    <p className="text-xs text-muted-foreground">Sem produtos cadastrados</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((bank: any) => (
              <Card key={bank.id} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Landmark className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{bank.name}</p>
                      {bank.code && <p className="text-xs text-muted-foreground">Código: {bank.code}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{bank.products?.length || 0} produtos</Badge>
                    <Badge variant={bank.is_active ? "default" : "secondary"} className="text-xs">
                      {bank.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BanksPage;
