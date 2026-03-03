import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaleWithProfile } from "@/hooks/useSalesWithProfiles";
import { SaleStatus, CovenantType, OperationType } from "@/hooks/useSales";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const editSchema = z.object({
  client_name: z.string().min(1, "Nome obrigatório"),
  released_value: z.coerce.number().positive("Valor deve ser positivo"),
  commission_percentage: z.coerce.number().min(0).max(1, "Máximo 100%"),
  sale_date: z.string().min(1, "Data obrigatória"),
  status: z.enum(["em_andamento", "pago", "cancelado"]),
  covenant_type: z.enum(["INSS", "Forças Armadas", "SIAPE", "CLT", "FGTS", "Outros"]),
  operation_type: z.enum(["Novo", "Refinanciamento", "Compra de Dívida", "Saque FGTS", "Portabilidade"]).optional().nullable(),
  financial_institution: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditSaleDialogProps {
  sale: SaleWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditSaleDialog = ({ sale, open, onOpenChange }: EditSaleDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (sale && open) {
      form.reset({
        client_name: sale.client_name,
        released_value: Number(sale.released_value),
        commission_percentage: Number(sale.commission_percentage),
        sale_date: sale.sale_date,
        status: sale.status,
        covenant_type: sale.covenant_type as CovenantType,
        operation_type: sale.operation_type as OperationType | null,
        financial_institution: sale.financial_institution,
        observations: sale.observations,
      });
    }
  }, [sale, open, form]);

  const handleSubmit = async (data: EditFormData) => {
    if (!sale) return;
    setIsSubmitting(true);
    try {
      const oldData = {
        client_name: sale.client_name,
        released_value: sale.released_value,
        commission_percentage: sale.commission_percentage,
        status: sale.status,
        sale_date: sale.sale_date,
      };

      const { error } = await supabase
        .from("sales")
        .update({
          client_name: data.client_name,
          released_value: data.released_value,
          commission_percentage: data.commission_percentage,
          sale_date: data.sale_date,
          status: data.status as SaleStatus,
          covenant_type: data.covenant_type as CovenantType,
          operation_type: data.operation_type as OperationType | null,
          financial_institution: data.financial_institution || null,
          observations: data.observations || null,
        })
        .eq("id", sale.id);

      if (error) throw error;

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        action: "update",
        resource: "sales",
        resource_id: sale.id,
        old_data: oldData,
        new_data: data,
      });

      queryClient.invalidateQueries({ queryKey: ["sales-with-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["company-goal"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-goal"] });

      toast({ title: "Venda atualizada!", description: "Alterações salvas com sucesso." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao editar venda", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Venda</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="client_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="released_value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Liberado (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="commission_percentage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão (%)</FormLabel>
                  <FormControl><Input type="number" step="0.001" max="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sale_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="covenant_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Convênio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="INSS">INSS</SelectItem>
                      <SelectItem value="Forças Armadas">Forças Armadas</SelectItem>
                      <SelectItem value="SIAPE">SIAPE</SelectItem>
                      <SelectItem value="CLT">CLT</SelectItem>
                      <SelectItem value="FGTS">FGTS</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="operation_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Operação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Refinanciamento">Refinanciamento</SelectItem>
                      <SelectItem value="Compra de Dívida">Compra de Dívida</SelectItem>
                      <SelectItem value="Saque FGTS">Saque FGTS</SelectItem>
                      <SelectItem value="Portabilidade">Portabilidade</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="financial_institution" render={({ field }) => (
              <FormItem>
                <FormLabel>Instituição Financeira</FormLabel>
                <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="observations" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSaleDialog;
