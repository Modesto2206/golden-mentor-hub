import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSendWhatsAppMessage } from "@/hooks/useWhatsApp";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, UserPlus } from "lucide-react";

const formatPhone = (phone: string) => {
  const d = phone?.replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
};

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (phone: string, name: string, clientId?: string) => void;
}

const NewConversationDialog = ({ open, onOpenChange, onSelect }: Props) => {
  const { companyId, isAdmin, isSuperAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [customPhone, setCustomPhone] = useState("");

  const isAdminOrSuper = isAdmin || isSuperAdmin;

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-whatsapp-new", companyId, isAdminOrSuper, user?.id],
    queryFn: async () => {
      let query = (supabase.from("clients" as any) as any)
        .select("id, full_name, phone, cpf, created_by")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("full_name");

      if (!isAdminOrSuper && user?.id) {
        query = query.eq("created_by", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as { id: string; full_name: string; phone: string | null; cpf: string }[];
    },
    enabled: !!companyId && open && !!user,
  });

  const filtered = clients.filter((c) => {
    if (!search) return !!c.phone;
    const q = search.toLowerCase();
    return !!c.phone && (
      c.full_name.toLowerCase().includes(q) ||
      c.cpf?.includes(search.replace(/\D/g, "")) ||
      c.phone?.includes(search.replace(/\D/g, ""))
    );
  });

  const handleCustomPhone = () => {
    const digits = customPhone.replace(/\D/g, "");
    if (digits.length >= 10) {
      onSelect(digits, formatPhone(digits));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome, CPF ou telefone..."
            className="pl-9"
          />
        </div>

        {/* Custom phone */}
        <div className="flex gap-2">
          <Input
            value={customPhone}
            onChange={(e) => setCustomPhone(e.target.value)}
            placeholder="Ou digite um número: (99) 99999-9999"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCustomPhone}
            disabled={customPhone.replace(/\D/g, "").length < 10}
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Client list */}
        <ScrollArea className="max-h-[300px]">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhum cliente com telefone encontrado
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => onSelect(client.phone!.replace(/\D/g, ""), client.full_name, client.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-secondary/50 transition-colors text-left rounded"
                >
                  <div className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#25D366]">
                      {getInitials(client.full_name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.full_name}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(client.phone!)}</p>
                  </div>
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
