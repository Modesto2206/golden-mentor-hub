import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, AlertTriangle } from "lucide-react";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  responsavel: string | null;
  plano: string | null;
  max_users: number;
  status: string;
}

interface Props {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompanyManagementDialog = ({ company, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    responsavel: "",
    plano: "basico",
    max_users: 2,
    status: "active",
  });

  // Sync form when company changes
  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "",
        cnpj: company.cnpj || "",
        email: company.email || "",
        phone: company.phone || "",
        responsavel: company.responsavel || "",
        plano: company.plano || "basico",
        max_users: company.max_users || 2,
        status: company.status || "active",
      });
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-company", {
        body: {
          action: "edit",
          company_id: company.id,
          name: form.name,
          cnpj: form.cnpj || undefined,
          email: form.email || null,
          phone: form.phone || null,
          responsavel: form.responsavel || null,
          plano: form.plano,
          max_users: form.max_users,
          status: form.status,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast({ title: "Empresa atualizada", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["super-admin-companies"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (hardDelete: boolean) => {
    if (!company) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-company", {
        body: {
          action: "delete",
          company_id: company.id,
          hard_delete: hardDelete,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      toast({ title: "Empresa removida", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["super-admin-companies"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Empresa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Responsável</Label>
            <Input value={form.responsavel} onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Plano</Label>
              <Select value={form.plano} onValueChange={(v) => {
                const limits: Record<string, number> = { basico: 2, profissional: 5, enterprise: 10 };
                setForm((f) => ({ ...f, plano: v, max_users: limits[v] || f.max_users }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Máx. Usuários</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.max_users}
                onChange={(e) => setForm((f) => ({ ...f, max_users: parseInt(e.target.value) || 2 }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="suspended">Suspensa</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center gap-2 sm:justify-between">
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isSubmitting}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Excluir Empresa
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>Exclusão suave (recomendado):</strong> Marca como cancelada, preserva todos os dados históricos.
                    <br /><br />
                    <strong>Exclusão permanente:</strong> Remove todos os dados. Só é possível se não houver registros financeiros.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(false)}>
                    Exclusão Suave
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={() => handleDelete(true)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Exclusão Permanente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyManagementDialog;
