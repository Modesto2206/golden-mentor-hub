import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Trash2, CheckCircle, XCircle, Clock, User, Edit, Eye, Download, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SaleStatus } from "@/hooks/useSales";
import { SaleWithProfile } from "@/hooks/useSalesWithProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EditSaleDialog from "./EditSaleDialog";

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

// Generate last 12 months options
const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i);
    options.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ptBR }),
      start: startOfMonth(date),
      end: endOfMonth(date),
    });
  }
  return options;
};

const SalesTable = ({ sales, sellers = [], onUpdateStatus, onDelete, isLoading }: SalesTableProps) => {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailSale, setDetailSale] = useState<SaleWithProfile | null>(null);
  const [editSale, setEditSale] = useState<SaleWithProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "all">("all");
  const [covenantFilter, setCovenantFilter] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [exportOpen, setExportOpen] = useState(false);

  const filteredSales = sales.filter((sale) => {
    if (statusFilter !== "all" && sale.status !== statusFilter) return false;
    if (covenantFilter !== "all" && sale.covenant_type !== covenantFilter) return false;
    if (sellerFilter !== "all" && sale.seller_id !== sellerFilter) return false;
    return true;
  });

  const covenantTypes = [...new Set(sales.map((s) => s.covenant_type))];
  const monthOptions = getMonthOptions();

  const canManageSale = (sale: SaleWithProfile) => {
    return isAdmin || isSuperAdmin || sale.seller_id === user?.id;
  };

  const exportMonth = (monthValue: string) => {
    const option = monthOptions.find((m) => m.value === monthValue);
    if (!option) return;

    const monthSales = filteredSales.filter((sale) => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= option.start && saleDate <= option.end;
    });

    if (monthSales.length === 0) {
      toast({ variant: "destructive", title: "Sem dados", description: `Nenhuma venda encontrada em ${option.label}.` });
      return;
    }

    // Sort by date
    monthSales.sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());

    // Summary stats
    const totalValue = monthSales.reduce((s, v) => s + Number(v.released_value), 0);
    const totalCommission = monthSales.reduce((s, v) => s + Number(v.commission_value || 0), 0);
    const paidCount = monthSales.filter((s) => s.status === "pago").length;
    const pendingCount = monthSales.filter((s) => s.status === "em_andamento").length;
    const canceledCount = monthSales.filter((s) => s.status === "cancelado").length;

    const sep = ";"; // semicolon for better Google Sheets compatibility in pt-BR
    const lines: string[] = [];

    // Header section
    lines.push(`RELATÓRIO DE VENDAS - ${option.label.toUpperCase()}`);
    lines.push("");
    lines.push(`Data de Exportação${sep}${format(new Date(), "dd/MM/yyyy HH:mm")}`);
    lines.push(`Total de Vendas${sep}${monthSales.length}`);
    lines.push(`Pagas${sep}${paidCount}`);
    lines.push(`Em Andamento${sep}${pendingCount}`);
    lines.push(`Canceladas${sep}${canceledCount}`);
    lines.push(`Valor Total Liberado${sep}${formatCurrency(totalValue)}`);
    lines.push(`Total Comissões${sep}${formatCurrency(totalCommission)}`);
    lines.push("");

    // Data header
    lines.push(
      ["#", "Data", "Cliente", "Vendedor", "Convênio", "Tipo Operação", "Instituição", "Valor Liberado (R$)", "Comissão (%)", "Comissão (R$)", "Status", "Observações"]
        .join(sep)
    );

    // Data rows
    monthSales.forEach((s, i) => {
      lines.push(
        [
          (i + 1).toString(),
          format(new Date(s.sale_date), "dd/MM/yyyy"),
          `"${s.client_name}"`,
          `"${s.seller_name || "—"}"`,
          s.covenant_type,
          s.operation_type || "—",
          `"${s.financial_institution || "—"}"`,
          Number(s.released_value).toFixed(2).replace(".", ","),
          (Number(s.commission_percentage) * 100).toFixed(2).replace(".", ",") + "%",
          Number(s.commission_value || 0).toFixed(2).replace(".", ","),
          statusConfig[s.status].label,
          `"${(s.observations || "").replace(/"/g, '""')}"`,
        ].join(sep)
      );
    });

    // Footer totals
    lines.push("");
    lines.push(
      ["", "", "", "", "", "", "TOTAL",
        totalValue.toFixed(2).replace(".", ","),
        "",
        totalCommission.toFixed(2).replace(".", ","),
        "", ""].join(sep)
    );

    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas_${monthValue}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exportado!", description: `${monthSales.length} vendas de ${option.label} exportadas.` });
    setExportOpen(false);
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
              {/* Export with month selection */}
              <Popover open={exportOpen} onOpenChange={setExportOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    Exportar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">Selecione o mês</p>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {monthOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => exportMonth(opt.value)}
                        className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors capitalize"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

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
                              {canManage && (
                                <DropdownMenuItem onClick={() => setEditSale(sale)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar Venda
                                </DropdownMenuItem>
                              )}
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

      <EditSaleDialog sale={editSale} open={!!editSale} onOpenChange={(o) => !o && setEditSale(null)} />

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
