import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Target, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const goalSchema = z.object({
  target_value: z.coerce.number().positive("Valor deve ser maior que zero"),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface MonthlyGoalModalProps {
  currentGoal: number;
}

const MonthlyGoalModal = ({ currentGoal }: MonthlyGoalModalProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      target_value: currentGoal,
    },
  });

  useEffect(() => {
    form.setValue("target_value", currentGoal);
  }, [currentGoal, form]);

  const handleSubmit = async (data: GoalFormData) => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Try to update existing goal, or insert new one
      const { data: existing } = await supabase
        .from("monthly_goals")
        .select("id")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("monthly_goals")
          .update({ target_value: data.target_value })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("monthly_goals")
          .insert({ month, year, target_value: data.target_value });

        if (error) throw error;
      }

      toast({
        title: "Meta atualizada!",
        description: `A meta mensal foi definida para R$ ${data.target_value.toLocaleString("pt-BR")}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["monthly-goal"] });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar meta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Definir Meta Mensal
          </DialogTitle>
          <DialogDescription>
            Altere o valor da meta de vendas para o mês atual.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="target_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Meta (R$)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="20000.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Meta"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyGoalModal;
