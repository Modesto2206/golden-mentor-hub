import { useState, useEffect, useMemo } from "react";
import { MessageCircle, X, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientContact {
  id: string;
  full_name: string;
  phone: string;
}

const DEFAULT_MESSAGE = "Olá, aqui é da nossa equipe. Estamos entrando em contato sobre seu atendimento.";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

const WhatsAppFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("clients")
      .select("id, full_name, phone")
      .not("phone", "is", null)
      .neq("phone", "")
      .eq("is_active", true)
      .order("full_name")
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) {
          setClients((data as ClientContact[]) || []);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [isOpen, user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [clients, search]);

  const openWhatsApp = (phone: string) => {
    const number = formatPhone(phone);
    const encoded = encodeURIComponent(DEFAULT_MESSAGE);
    window.open(`https://wa.me/${number}?text=${encoded}`, "_blank");
  };

  if (!user) return null;

  return (
    <>
      {/* Popup */}
      {isOpen && (
        <div className="fixed bottom-20 left-5 z-[9998] w-80 max-h-[420px] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 p-0"
              autoFocus
            />
          </div>
          <ScrollArea className="flex-1 max-h-[340px]">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {search ? "Nenhum cliente encontrado" : "Nenhum cliente com telefone"}
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => openWhatsApp(client.phone)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.full_name}</p>
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setIsOpen((o) => !o); setSearch(""); }}
        className={cn(
          "fixed bottom-5 left-5 z-[9999] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110",
          isOpen ? "bg-muted" : "bg-[#25D366]"
        )}
        title={isOpen ? "Fechar" : "WhatsApp - Contatos"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-muted-foreground" />
        ) : (
          <svg viewBox="0 0 48 48" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fff" d="M24 10.5c-7.456 0-13.5 6.044-13.5 13.5 0 2.382.618 4.709 1.794 6.762L10.5 37.5l6.93-1.818A13.43 13.43 0 0 0 24 37.5c7.456 0 13.5-6.044 13.5-13.5S31.456 10.5 24 10.5Zm6.642 19.296c-.282.792-1.632 1.518-2.25 1.614-.564.084-1.278.12-2.064-.132a18.9 18.9 0 0 1-1.866-.69c-3.288-1.416-5.436-4.728-5.598-4.95-.162-.216-1.338-1.782-1.338-3.396s.846-2.412 1.146-2.742c.3-.33.654-.414.87-.414h.63c.204 0 .474-.078.738.564.282.654.954 2.328 1.038 2.496.084.168.138.366.024.588-.108.222-.168.36-.33.552-.168.198-.348.438-.498.588-.168.168-.342.348-.144.684.192.33.858 1.416 1.842 2.292 1.266 1.128 2.334 1.476 2.664 1.644.336.168.528.138.726-.084.192-.222.834-.966 1.056-1.302.222-.33.45-.276.75-.168.3.114 1.914.9 2.244 1.068.33.168.546.246.63.384.084.144.084.792-.198 1.584-.006 0-.006-.006 0 0Z"/>
          </svg>
        )}
      </button>
    </>
  );
};

export default WhatsAppFAB;
