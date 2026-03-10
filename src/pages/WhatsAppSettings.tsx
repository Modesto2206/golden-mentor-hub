import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppSession, useCreateWhatsAppSession, useDisconnectWhatsApp } from "@/hooks/useWhatsApp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Wifi, WifiOff, QrCode, RefreshCw, Unplug, Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const WhatsAppSettings = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { data: session, isLoading } = useWhatsAppSession();
  const createSession = useCreateWhatsAppSession();
  const disconnect = useDisconnectWhatsApp();

  if (!isAdmin && !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </AppLayout>
    );
  }

  const status = session?.status || "disconnected";
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-[#25D366]" />
          <div>
            <h1 className="text-2xl font-bold">Configurações WhatsApp</h1>
            <p className="text-muted-foreground">Conecte o WhatsApp da sua empresa para atendimento.</p>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Status da Conexão
              </span>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={cn(
                  "gap-1",
                  isConnected ? "bg-[#25D366] text-white" : isConnecting ? "bg-yellow-500 text-white" : ""
                )}
              >
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isConnected ? "Conectado" : isConnecting ? "Conectando..." : "Desconectado"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {isConnected
                ? `Número conectado: ${session?.phone_number || "N/A"}`
                : "Escaneie o QR Code para conectar o WhatsApp da empresa."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnecting && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-48 h-48 bg-secondary rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">QR Code será exibido aqui</p>
                    <p className="text-[10px] text-muted-foreground mt-1">quando o servidor WhatsApp estiver conectado</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Aguardando conexão com Evolution API...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure o servidor Evolution API para gerar o QR Code real
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => createSession.mutate()} disabled={createSession.isPending}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", createSession.isPending && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            )}

            {!isConnecting && !isConnected && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                  <WifiOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">WhatsApp não conectado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em "Conectar" para iniciar o processo de conexão
                  </p>
                </div>
                <Button
                  onClick={() => createSession.mutate()}
                  disabled={createSession.isPending}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {createSession.isPending ? "Conectando..." : "Conectar WhatsApp"}
                </Button>
              </div>
            )}

            {isConnected && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                  <Wifi className="w-10 h-10 text-[#25D366]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#25D366]">WhatsApp conectado com sucesso!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Número: {session?.phone_number || "N/A"}
                  </p>
                  {session?.connected_at && (
                    <p className="text-xs text-muted-foreground">
                      Conectado desde: {new Date(session.connected_at).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                  className="gap-2"
                >
                  <Unplug className="w-4 h-4" />
                  Desconectar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Como conectar o WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Instale o servidor Evolution API</p>
                  <p className="text-xs text-muted-foreground">
                    Hospede o Evolution API em um servidor VPS (ex: Hetzner, DigitalOcean, Contabo — a partir de ~R$25/mês).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Configure a URL da API</p>
                  <p className="text-xs text-muted-foreground">
                    Informe a URL do seu servidor Evolution API nas configurações avançadas (em breve).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Escaneie o QR Code</p>
                  <p className="text-xs text-muted-foreground">
                    Abra o WhatsApp no celular → Dispositivos Vinculados → Vincular Dispositivo → Escaneie o QR Code.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Pronto!</p>
                  <p className="text-xs text-muted-foreground">
                    As mensagens serão recebidas e enviadas automaticamente pela plataforma.
                  </p>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-xs">
                Enquanto o servidor não estiver conectado, você pode usar o chat para organizar conversas e registrar mensagens manualmente.
                As mensagens enviadas serão salvas no banco de dados e sincronizadas quando o WhatsApp for conectado.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default WhatsAppSettings;
