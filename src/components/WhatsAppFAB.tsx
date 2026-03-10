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
        className="fixed bottom-8 right-8 z-[9999] transition-all duration-200 hover:scale-110"
        title="WhatsApp — Clientes"
      >
        {open ? (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shadow-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </div>
        ) : (
          <svg viewBox="0 0 48 48" className="w-12 h-12 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill="#25D366"/>
            <path fill="#fff" d="M24 10.5c-7.456 0-13.5 6.044-13.5 13.5 0 2.382.618 4.709 1.794 6.762L10.5 37.5l6.93-1.818A13.43 13.43 0 0 0 24 37.5c7.456 0 13.5-6.044 13.5-13.5S31.456 10.5 24 10.5Zm6.642 19.296c-.282.792-1.632 1.518-2.25 1.614-.564.084-1.278.12-2.064-.132a18.9 18.9 0 0 1-1.866-.69c-3.288-1.416-5.436-4.728-5.598-4.95-.162-.216-1.338-1.782-1.338-3.396s.846-2.412 1.146-2.742c.3-.33.654-.414.87-.414h.63c.204 0 .474-.078.738.564.282.654.954 2.328 1.038 2.496.084.168.138.366.024.588-.108.222-.168.36-.33.552-.168.198-.348.438-.498.588-.168.168-.342.348-.144.684.192.33.858 1.416 1.842 2.292 1.266 1.128 2.334 1.476 2.664 1.644.336.168.528.138.726-.084.192-.222.834-.966 1.056-1.302.222-.33.45-.276.75-.168.3.114 1.914.9 2.244 1.068.33.168.546.246.63.384.084.144.084.792-.198 1.584-.006 0-.006-.006 0 0Z"/>
          </svg>
        )}
      </button>
    </>
  );
};

export default WhatsAppFAB;
