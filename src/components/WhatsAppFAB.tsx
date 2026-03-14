import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MessageCircle, X, Search, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
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

const FAB_SIZE = 48;
const STORAGE_KEY = "whatsapp-fab-position";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function getSavedPosition(): { x: number; y: number } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

const WhatsAppFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showScrollDown, setShowScrollDown] = useState(false);
  const { user, companyId, isLoading: isAuthLoading, isVendedor, isSuperAdmin } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const userName = user?.user_metadata?.full_name || "consultor";

  // Drag state
  const savedPos = getSavedPosition();
  const [position, setPosition] = useState({
    x: savedPos?.x ?? 20,
    y: savedPos?.y ?? (typeof window !== "undefined" ? window.innerHeight - FAB_SIZE - 20 : 700),
  });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMoved = useRef(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Fetch clients
  useEffect(() => {
    if (!isOpen || !user || isAuthLoading) return;
    let cancelled = false;
    setLoading(true);

    const loadClients = async () => {
      try {
        let query = supabase
          .from("clients")
          .select("id, full_name, phone")
          .not("phone", "is", null)
          .neq("phone", "")
          .eq("is_active", true)
          .order("full_name")
          .limit(200);

        if (!isSuperAdmin && companyId) {
          query = query.eq("company_id", companyId);
        }

        if (isVendedor && !isSuperAdmin && user) {
          query = query.eq("created_by", user.id);
        }

        const { data, error } = await query;
        if (cancelled) return;
        if (error) {
          console.error("Erro ao buscar clientes do WhatsApp FAB:", error);
          setClients([]);
        } else {
          setClients((data as ClientContact[]) || []);
        }
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadClients();
    return () => { cancelled = true; };
  }, [isOpen, user, companyId, isAuthLoading, isVendedor]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [clients, search]);

  const openWhatsApp = (clientName: string, phone: string) => {
    const number = formatPhone(phone);
    const message = `Olá ${clientName}, sou o consultor ${userName} da Cred+ Consignado, Tudo bem?`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Scroll indicator logic
  const getViewport = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return null;
    return el.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
  }, []);

  const checkScroll = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;
    setShowScrollDown(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 40);
  }, [getViewport]);

  const scrollDown = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;
    viewport.scrollBy({ top: 200, behavior: "smooth" });
  }, [getViewport]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      checkScroll();
      const viewport = getViewport();
      if (viewport) {
        viewport.addEventListener("scroll", checkScroll);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      const viewport = getViewport();
      if (viewport) {
        viewport.removeEventListener("scroll", checkScroll);
      }
    };
  }, [isOpen, filtered, checkScroll, getViewport]);

  // Drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    setPosition({
      x: clamp(dragStart.current.posX + dx, 0, window.innerWidth - FAB_SIZE),
      y: clamp(dragStart.current.posY + dy, 0, window.innerHeight - FAB_SIZE),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      setPosition((pos) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
        return pos;
      });
    }
  }, []);

  const handleFabClick = useCallback(() => {
    if (!hasMoved.current) {
      setIsOpen((o) => !o);
      setSearch("");
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition((pos) => ({
        x: clamp(pos.x, 0, window.innerWidth - FAB_SIZE),
        y: clamp(pos.y, 0, window.innerHeight - FAB_SIZE),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!user) return null;

  const popupBelow = position.y < 440;
  const popupLeft = position.x < window.innerWidth / 2;

  return (
    <>
      {isOpen && (
        <div
          className="fixed z-[9998] w-80 max-h-[420px] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{
            left: popupLeft ? position.x : undefined,
            right: popupLeft ? undefined : window.innerWidth - position.x - FAB_SIZE,
            top: popupBelow ? position.y + FAB_SIZE + 8 : undefined,
            bottom: popupBelow ? undefined : window.innerHeight - position.y + 8,
          }}
        >
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
          <div className="relative flex-1">
            <ScrollArea ref={scrollRef} className="max-h-[340px]" onScrollCapture={checkScroll}>
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
                      onClick={() => openWhatsApp(client.full_name, client.phone)}
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
            {showScrollDown && (
              <button
                onClick={scrollDown}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:opacity-90 transition-opacity animate-bounce"
                title="Rolar para baixo"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <button
        ref={fabRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleFabClick}
        className={cn(
          "fixed z-[9999] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-shadow duration-200 hover:shadow-xl select-none touch-none cursor-grab active:cursor-grabbing",
          isOpen ? "bg-muted" : "bg-[#25D366]"
        )}
        style={{ left: position.x, top: position.y }}
        title={isOpen ? "Fechar" : "WhatsApp - Contatos"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-muted-foreground pointer-events-none" />
        ) : (
          <svg viewBox="0 0 48 48" className="w-7 h-7 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fff" d="M24 10.5c-7.456 0-13.5 6.044-13.5 13.5 0 2.382.618 4.709 1.794 6.762L10.5 37.5l6.93-1.818A13.43 13.43 0 0 0 24 37.5c7.456 0 13.5-6.044 13.5-13.5S31.456 10.5 24 10.5Zm6.642 19.296c-.282.792-1.632 1.518-2.25 1.614-.564.084-1.278.12-2.064-.132a18.9 18.9 0 0 1-1.866-.69c-3.288-1.416-5.436-4.728-5.598-4.95-.162-.216-1.338-1.782-1.338-3.396s.846-2.412 1.146-2.742c.3-.33.654-.414.87-.414h.63c.204 0 .474-.078.738.564.282.654.954 2.328 1.038 2.496.084.168.138.366.024.588-.108.222-.168.36-.33.552-.168.198-.348.438-.498.588-.168.168-.342.348-.144.684.192.33.858 1.416 1.842 2.292 1.266 1.128 2.334 1.476 2.664 1.644.336.168.528.138.726-.084.192-.222.834-.966 1.056-1.302.222-.33.45-.276.75-.168.3.114 1.914.9 2.244 1.068.33.168.546.246.63.384.084.144.084.792-.198 1.584-.006 0-.006-.006 0 0Z"/>
          </svg>
        )}
      </button>
    </>
  );
};

export default WhatsAppFAB;
