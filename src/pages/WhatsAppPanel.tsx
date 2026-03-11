import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, ExternalLink, RefreshCw, Smartphone, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";

const WHATSAPP_URL = "https://web.whatsapp.com";
const POPUP_WIDTH = 1000;
const POPUP_HEIGHT = 700;

const WhatsAppPanel = () => {
  const popupRef = useRef<Window | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openWhatsApp = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      setIsConnected(true);
      return;
    }

    const left = Math.max(0, (window.screen.width - POPUP_WIDTH) / 2);
    const top = Math.max(0, (window.screen.height - POPUP_HEIGHT) / 2);

    const features = [
      `width=${POPUP_WIDTH}`,
      `height=${POPUP_HEIGHT}`,
      `left=${left}`,
      `top=${top}`,
      "menubar=no",
      "toolbar=no",
      "location=yes",
      "status=no",
      "resizable=yes",
      "scrollbars=yes",
    ].join(",");

    popupRef.current = window.open(WHATSAPP_URL, "whatsapp_integrated", features);
    setIsConnected(true);

    // Monitor popup close
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (popupRef.current?.closed) {
        setIsConnected(false);
        popupRef.current = null;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#25D366]/10">
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Web</h1>
              <p className="text-sm text-muted-foreground">
                Atendimento integrado via WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="flex items-center gap-1.5 text-sm text-[#25D366] font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Conectado
              </span>
            )}
            <Button
              onClick={openWhatsApp}
              className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
            >
              {isConnected ? (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Focar WhatsApp
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Abrir WhatsApp
                </>
              )}
            </Button>
          </div>
        </div>

        {!isConnected ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                  <svg viewBox="0 0 48 48" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#25D366"/>
                    <path fill="#fff" d="M24 10.5c-7.456 0-13.5 6.044-13.5 13.5 0 2.382.618 4.709 1.794 6.762L10.5 37.5l6.93-1.818A13.43 13.43 0 0 0 24 37.5c7.456 0 13.5-6.044 13.5-13.5S31.456 10.5 24 10.5Zm6.642 19.296c-.282.792-1.632 1.518-2.25 1.614-.564.084-1.278.12-2.064-.132a18.9 18.9 0 0 1-1.866-.69c-3.288-1.416-5.436-4.728-5.598-4.95-.162-.216-1.338-1.782-1.338-3.396s.846-2.412 1.146-2.742c.3-.33.654-.414.87-.414h.63c.204 0 .474-.078.738.564.282.654.954 2.328 1.038 2.496.084.168.138.366.024.588-.108.222-.168.36-.33.552-.168.198-.348.438-.498.588-.168.168-.342.348-.144.684.192.33.858 1.416 1.842 2.292 1.266 1.128 2.334 1.476 2.664 1.644.336.168.528.138.726-.084.192-.222.834-.966 1.056-1.302.222-.33.45-.276.75-.168.3.114 1.914.9 2.244 1.068.33.168.546.246.63.384.084.144.084.792-.198 1.584-.006 0-.006-.006 0 0Z"/>
                  </svg>
                </div>
              </div>

              <div className="text-center space-y-2 max-w-md">
                <h2 className="text-xl font-semibold">Iniciar Atendimento</h2>
                <p className="text-muted-foreground">
                  Clique no botão abaixo para abrir o WhatsApp Web em uma janela dedicada. 
                  Você poderá continuar usando a plataforma normalmente enquanto atende seus clientes.
                </p>
              </div>

              <Button 
                onClick={openWhatsApp} 
                size="lg" 
                className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
              >
                <MessageCircle className="w-5 h-5" />
                Abrir WhatsApp Web
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mt-4">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <QrCode className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-center text-muted-foreground">Escaneie o QR Code na primeira vez</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-center text-muted-foreground">Sessão mantida automaticamente</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-center text-muted-foreground">Use junto com a plataforma</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="w-8 h-8 text-[#25D366]" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold">WhatsApp Web está aberto</h2>
                <p className="text-sm text-muted-foreground">
                  A janela do WhatsApp está ativa. Clique em "Focar WhatsApp" para trazê-la para frente.
                </p>
              </div>
              <Button variant="outline" onClick={openWhatsApp} className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Focar janela do WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default WhatsAppPanel;
