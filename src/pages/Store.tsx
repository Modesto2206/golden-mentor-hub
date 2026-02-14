import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import AppLayout from "@/components/AppLayout";

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const num = parseInt(digits || "0", 10) / 100;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseCurrencyToNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return parseInt(digits || "0", 10) / 100;
};

const productSchema = z.object({
  name: z.string().min(2, "Nome do produto é obrigatório").max(200),
  price: z.string().min(1, "Valor é obrigatório"),
});

type ProductFormData = z.infer<typeof productSchema>;

const StorePage = () => {
  const { companyId, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "R$ 0,00" },
  });

  const editForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "R$ 0,00" },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["store_products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const createProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await (supabase.from("store_products" as any) as any).insert({
        name: data.name,
        price: parseCurrencyToNumber(data.price),
        company_id: companyId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store_products"] });
      toast({ title: "Produto adicionado!" });
      setAddOpen(false);
      form.reset({ name: "", price: "R$ 0,00" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const { error } = await (supabase.from("store_products" as any) as any)
        .update({ name: data.name, price: parseCurrencyToNumber(data.price) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store_products"] });
      toast({ title: "Produto atualizado!" });
      setEditProduct(null);
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("store_products" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store_products"] });
      toast({ title: "Produto excluído!" });
      setDeleteId(null);
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">Loja</h1>
            <p className="text-sm text-muted-foreground">{products.length} produtos cadastrados</p>
          </div>
          {isAdmin && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Adicionar Produto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Produto</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => createProduct.mutate(d))} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto *</FormLabel>
                        <FormControl><Input {...field} placeholder="Nome do produto" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="R$ 0,00"
                            onChange={(e) => field.onChange(formatCurrencyInput(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createProduct.isPending}>
                      {createProduct.isPending ? "Salvando..." : "Adicionar Produto"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-muted-foreground">Carregando...</p>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    {isAdmin && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-primary font-semibold">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => {
                                setEditProduct(p);
                                editForm.reset({
                                  name: p.name,
                                  price: formatCurrencyInput(String(Math.round(p.price * 100))),
                                });
                              }}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((d) => updateProduct.mutate({ id: editProduct.id, data: d }))} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(formatCurrencyInput(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditProduct(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateProduct.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteProduct.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default StorePage;
