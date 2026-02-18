import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const isValidCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(cpf[10]);
};

export const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const clientSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200),
  cpf: z.string().min(14, "CPF inválido").refine((v) => isValidCPF(v.replace(/\D/g, "")), "CPF inválido"),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória"),
  phone: z.string().min(14, "Telefone inválido (DDD + número)"),
  gender: z.string().optional(),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  address_city: z.string().max(100).optional(),
  address_state: z.string().max(2).optional(),
  internal_notes: z.string().max(1000).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => void;
  isPending: boolean;
  defaultValues?: Partial<ClientFormData>;
  title: string;
  submitLabel: string;
}

const ClientFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultValues,
  title,
  submitLabel,
}: ClientFormDialogProps) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: "",
      cpf: "",
      phone: "",
      email: "",
      internal_notes: "",
      birth_date: "",
      gender: "",
      address_city: "",
      address_state: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        full_name: "",
        cpf: "",
        phone: "",
        email: "",
        internal_notes: "",
        birth_date: "",
        gender: "",
        address_city: "",
        address_state: "",
        ...defaultValues,
      });
    } else if (open && !defaultValues) {
      form.reset({
        full_name: "",
        cpf: "",
        phone: "",
        email: "",
        internal_notes: "",
        birth_date: "",
        gender: "",
        address_city: "",
        address_state: "",
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl><Input {...field} placeholder="Nome completo" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cpf" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="000.000.000-00"
                      onChange={(e) => field.onChange(formatCPF(e.target.value))}
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="birth_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento *</FormLabel>
                  <FormControl><Input {...field} type="date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="(00) 00000-0000"
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      maxLength={15}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="email@exemplo.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address_state" render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <FormControl><Input {...field} placeholder="SP" maxLength={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="internal_notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações Internas</FormLabel>
                <FormControl><Textarea {...field} rows={2} placeholder="Notas internas..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Salvando..." : submitLabel}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormDialog;
