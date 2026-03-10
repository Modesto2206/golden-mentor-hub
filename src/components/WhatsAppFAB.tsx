import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { MessageCircle, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const formatPhone = (phone: string) => {
  const d = phone?.replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
};

const WhatsAppFAB = () => {
  const { companyId } = useAuth();
  const { currentProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-fab", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("clients" as any) as any)
        .select("id, full_name, phone, cpf")
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
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <>
      {/* Floating panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9999] w-80 max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-[#25D366] px-4 py-3 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm flex-1">WhatsApp — Clientes</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
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
          <ScrollArea className="flex-1 max-h-[50vh]">
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
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-8 right-8 z-[9999] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110",
          open
            ? "bg-muted text-muted-foreground"
            : "bg-[#25D366] text-white hover:bg-[#20bd5a]"
        )}
        title="WhatsApp — Clientes"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
            <path d="M16.004 2.667A13.26 13.26 0 0 0 2.667 15.89a13.16 13.16 0 0 0 1.795 6.65L2.667 29.333l7.04-1.844A13.28 13.28 0 0 0 16.004 29.2 13.27 13.27 0 0 0 29.333 15.89 13.27 13.27 0 0 0 16.004 2.667Zm0 24.27a11.01 11.01 0 0 1-5.61-1.532l-.402-.24-4.18 1.096 1.116-4.074-.263-.418a10.9 10.9 0 0 1-1.682-5.88 11.02 11.02 0 0 1 11.02-10.93 11.02 11.02 0 0 1 11.02 10.93 11.02 11.02 0 0 1-11.02 11.047Zm6.044-8.26c-.332-.166-1.964-.969-2.268-1.08-.305-.11-.527-.166-.749.167s-.858 1.08-1.053 1.302c-.194.221-.388.249-.72.083a9.07 9.07 0 0 1-2.675-1.65 10.02 10.02 0 0 1-1.85-2.302c-.194-.332-.02-.512.146-.678.15-.149.332-.388.498-.582.166-.194.221-.332.332-.554.11-.221.055-.415-.028-.582-.083-.166-.749-1.803-1.025-2.468-.27-.649-.545-.561-.749-.571l-.637-.011a1.22 1.22 0 0 0-.886.415c-.305.332-1.164 1.136-1.164 2.771s1.192 3.214 1.358 3.436c.166.221 2.345 3.58 5.682 5.02.794.343 1.413.548 1.897.701.797.253 1.523.217 2.096.132.64-.095 1.964-.803 2.24-1.578.278-.775.278-1.44.195-1.578-.083-.139-.305-.222-.637-.388Z" />
          </svg>
        )}
      </button>
    </>
  );
};

export default WhatsAppFAB;
