import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Trash2, CheckCircle, XCircle, Clock, User, Edit, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SaleStatus } from "@/hooks/useSales";
import { SaleWithProfile } from "@/hooks/useSalesWithProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SalesTableProps {
  sales: SaleWithProfile[];
  sellers?: { id: string; name: string }[];
  onUpdateStatus: (id: string, status: SaleStatus) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const statusConfig: Record<SaleStatus, { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  em_andamento: { label: "Em Andamento", variant: "secondary", icon: Clock },
  pago: { label: "Pago", variant: "default", icon: CheckCircle },
  cancelado: { label: "Cancelado", variant: "destructive", icon: XCircle },
};

const SalesTable = ({ sales, sellers = [], onUpdateStatus, onDelete, isLoading }: SalesTableProps) => {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailSale, setDetailSale] = useState<SaleWithProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "all">("all");
  const [covenantFilter, setCovenantFilter] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<string>("all");

  const filteredSales = sales.filter((sale) => {
    if (statusFilter !== "all" && sale.status !== statusFilter) return false;
    if (covenantFilter !== "all" && sale.covenant_type !== covenantFilter) return false;
    if (sellerFilter !== "all" && sale.seller_id !== sellerFilter) return false;
    return true;
  });

  const covenantTypes = [...new Set(sales.map((s) => s.covenant_type))];

  const canManageSale = (sale: SaleWithProfile) => {
    return isAdmin || isSuperAdmin || sale.seller_id === user?.id;
  };

  const exportToCSV = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const monthSales = filteredSales.filter((sale) => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= lastMonth && saleDate <= lastMonthEnd;
    });

    if (monthSales.length === 0) {
      toast({ variant: "destructive", title: "Sem dados", description: "Nenhuma venda encontrada no mês anterior." });
      return;
    }

    const headers = ["Cliente", "Vendedor", "Valor Liberado", "Comissão (%)", "Comissão (R$)", "Convênio", "Operação", "Instituição", "Status", "Data"];
    const rows = monthSales.map((s) => [
      s.client_name,
      s.seller_name || "—",
      Number(s.released_value).toFixed(2),
      (Number(s.commission_percentage) * 100).toFixed(2),
      Number(s.commission_value).toFixed(2),
      s.covenant_type,
      s.operation_type || "—",
      s.financial_institution || "—",
      statusConfig[s.status].label,
      format(new Date(s.sale_date), "dd/MM/yyyy"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas_${format(lastMonth, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exportado!", description: `${monthSales.length} vendas exportadas com sucesso.` });
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>
                {filteredSales.length} venda{filteredSales.length !== 1 ? "s" : ""} encontrada{filteredSales.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-1" /> Exportar Mês
              </Button>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as SaleStatus | "all")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={covenantFilter} onValueChange={setCovenantFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Convênio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Convênios</SelectItem>
                  {covenantTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && sellers.length > 0 && (
                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Vendedores</SelectItem>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  {isAdmin && <TableHead>Vendedor</TableHead>}
                  <TableHead>Convênio</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => {
                    const StatusIcon = statusConfig[sale.status].icon;
                    const canManage = canManageSale(sale);
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{sale.client_name}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{sale.seller_name}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline">{sale.covenant_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {sale.operation_type ? (
                            <Badge variant="outline" className="border-primary/30 text-primary">
                              {sale.operation_type}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{sale.financial_institution || "—"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(sale.released_value))}
                        </TableCell>
                        <TableCell className="text-right text-primary font-medium">
                          {formatCurrency(Number(sale.commission_value))}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({(Number(sale.commission_percentage) * 100).toFixed(2)}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[sale.status].variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[sale.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailSale(sale)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              {canManage && sale.status === "em_andamento" && (
                                <DropdownMenuItem onClick={() => onUpdateStatus(sale.id, "pago")}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                              )}
                              {canManage && sale.status === "em_andamento" && (
                                <DropdownMenuItem onClick={() => onUpdateStatus(sale.id, "cancelado")}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              {canManage && (isAdmin || isSuperAdmin) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteId(sale.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={!!detailSale} onOpenChange={() => setDetailSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {detailSale && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Cliente:</span> <strong>{detailSale.client_name}</strong></div>
                <div><span className="text-muted-foreground">Vendedor:</span> <strong>{detailSale.seller_name}</strong></div>
                <div><span className="text-muted-foreground">Data:</span> <strong>{format(new Date(detailSale.sale_date), "dd/MM/yyyy")}</strong></div>
                <div><span className="text-muted-foreground">Convênio:</span> <strong>{detailSale.covenant_type}</strong></div>
                <div><span className="text-muted-foreground">Operação:</span> <strong>{detailSale.operation_type || "—"}</strong></div>
                <div><span className="text-muted-foreground">Instituição:</span> <strong>{detailSale.financial_institution || "—"}</strong></div>
                <div><span className="text-muted-foreground">Valor Liberado:</span> <strong>{formatCurrency(Number(detailSale.released_value))}</strong></div>
                <div><span className="text-muted-foreground">Comissão:</span> <strong>{formatCurrency(Number(detailSale.commission_value))} ({(Number(detailSale.commission_percentage) * 100).toFixed(2)}%)</strong></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusConfig[detailSale.status].variant}>{statusConfig[detailSale.status].label}</Badge></div>
              </div>
              {detailSale.observations && (
                <div><span className="text-muted-foreground">Observações:</span><p className="mt-1">{detailSale.observations}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SalesTable;