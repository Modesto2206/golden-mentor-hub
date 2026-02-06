import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, DollarSign, Percent } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreateSaleData, CovenantType } from "@/hooks/useSales";

const covenantTypes: CovenantType[] = ["INSS", "Forças Armadas", "SIAPE", "CLT", "FGTS", "Outros"];

const saleSchema = z.object({
  client_name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(200),
  covenant_type: z.enum(["INSS", "Forças Armadas", "SIAPE", "CLT", "FGTS", "Outros"]),
  released_value: z.coerce.number().positive("Valor deve ser maior que zero"),
  commission_percentage: z.coerce.number().min(0, "Porcentagem deve ser positiva").max(100, "Máximo 100%"),
  sale_date: z.date(),
  observations: z.string().max(1000).optional(),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SalesFormProps {
  onSubmit: (data: CreateSaleData) => void;
  isSubmitting?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const SalesForm = ({ onSubmit, isSubmitting }: SalesFormProps) => {
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      client_name: "",
      released_value: 0,
      commission_percentage: Number((data.commission_percentage / 100).toFixed(4)),
      sale_date: new Date(),
      observations: "",
    },
  });

  const watchValue = form.watch("released_value");
  const watchPercentage = form.watch("commission_percentage");

  const calculatedCommission = (watchValue || 0) * ((watchPercentage || 0) / 100);

  const handleSubmit = (data: SaleFormData) => {
    const saleData: CreateSaleData = {
      client_name: data.client_name,
      covenant_type: data.covenant_type,
      released_value: data.released_value,
      commission_percentage: Number((data.commission_percentage / 100).toFixed(4)),
      sale_date: format(data.sale_date, "yyyy-MM-dd"),
      observations: data.observations || undefined,
    };
    onSubmit(saleData);
    form.reset();
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-gold-gradient">Registrar Nova Venda</CardTitle>
        <CardDescription>Preencha os dados da venda realizada</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome completo do cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="covenant_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Convênio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o convênio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {covenantTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="released_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Liberado (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="number" step="0.01" min="0" placeholder="0,00" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentagem de Comissão (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="5.00"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Venda</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Commission Preview */}
              <div className="flex flex-col justify-end">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm text-muted-foreground">Comissão calculada:</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(calculatedCommission)}</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Informações adicionais sobre a venda..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Registrar Venda"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SalesForm;
