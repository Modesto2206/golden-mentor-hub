import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { MessageCircle, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formatPhone = (phone: string) => {
  const d = phone?.replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
};

const WhatsAppButton = () => {
  const { companyId } = useAuth();
  const { currentProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-whatsapp", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("clients" as any) as any)
        .select("id, full_name, phone, cpf")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data as { id: string; full_name: string; phone: string | null; cpf: string }[];
    },
    enabled: !!companyId && open,
  });

  const filtered = clients.filter((c) => {
    if (!search) return !!c.phone;
    return (
      !!c.phone &&
      (c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.cpf?.includes(search.replace(/\D/g, "")))
    );
  });

  const openWhatsApp = (phone: string, clientName: string) => {
    const digits = phone.replace(/\D/g, "");
    const sellerName = currentProfile?.full_name || "Vendedor";
    const message = encodeURIComponent(
      `Olá ${clientName}! Aqui é ${sellerName}, da Cred+. Tudo bem?`
    );
    window.open(`https://wa.me/55${digits}?text=${message}`, "_blank");
  };

  const getInitials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10 hover:text-[#25D366]">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="bg-[#25D366] px-4 py-3 flex items-center gap-3 rounded-t-md">
          <MessageCircle className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm flex-1">WhatsApp — Clientes</span>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Client list */}
        <ScrollArea className="max-h-[300px]">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {clients.length === 0 ? "Carregando..." : "Nenhum cliente com telefone encontrado"}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => openWhatsApp(client.phone!, client.full_name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
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
      </PopoverContent>
    </Popover>
  );
};

export default WhatsAppButton;
