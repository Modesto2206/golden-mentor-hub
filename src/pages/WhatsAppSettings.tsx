import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  useWhatsAppSession,
  useCreateWhatsAppSession,
  useDisconnectWhatsApp,
  useSaveEvolutionConfig,
  useCheckWhatsAppStatus,
  useRefreshQRCode,
} from "@/hooks/useWhatsApp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Wifi, WifiOff, QrCode, RefreshCw, Unplug, Info, Save, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WhatsAppSettings = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { data: session, isLoading } = useWhatsAppSession();
  const createSession = useCreateWhatsAppSession();
  const disconnect = useDisconnectWhatsApp();
  const saveConfig = useSaveEvolutionConfig();
  const checkStatus = useCheckWhatsAppStatus();
  const refreshQR = useRefreshQRCode();

  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (session) {
      setApiUrl(session.api_url || "");
      setApiKey(session.api_key || "");
    }
  }, [session]);

  // Auto-check status when connecting
  useEffect(() => {
    if (session?.status !== "connecting") return;
    const interval = setInterval(() => {
      checkStatus.mutate();
    }, 5000);
    return () => clearInterval(interval);
  }, [session?.status]);

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
  const hasConfig = !!(session?.api_url && session?.api_key);

  const handleSaveConfig = async () => {
    if (!apiUrl || !apiKey) {
      toast.error("Preencha a URL e API Key");
      return;
    }
    try {
      await saveConfig.mutateAsync({ apiUrl, apiKey });
      toast.success("Configuração salva! Conexão com Evolution API verificada.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar configuração");
    }
  };

  const handleConnect = async () => {
    try {
      const result = await createSession.mutateAsync();
      if (result?.qr_code) {
        toast.success("QR Code gerado! Escaneie com o WhatsApp.");
      } else {
        toast.info("Instância criada. Aguarde o QR Code...");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao conectar");
    }
  };

  const handleRefreshQR = async () => {
    try {
      const result = await refreshQR.mutateAsync();
      if (result?.qr_code) {
        toast.success("QR Code atualizado!");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar QR Code");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      toast.success("WhatsApp desconectado.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao desconectar");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-[#25D366]" />
          <div>
            <h1 className="text-2xl font-bold">Configurações WhatsApp</h1>
            <p className="text-muted-foreground">Conecte o WhatsApp via Evolution API.</p>
          </div>
        </div>

        {/* Evolution API Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Configuração da Evolution API
            </CardTitle>
            <CardDescription>
              Informe a URL e API Key do seu servidor Evolution API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">URL do Servidor</Label>
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://seu-servidor.com"
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Sua chave de API"
                disabled={isConnected}
              />
            </div>
            {!isConnected && (
              <Button
                onClick={handleSaveConfig}
                disabled={saveConfig.isPending || !apiUrl || !apiKey}
                className="gap-2"
              >
                {saveConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar e Testar Conexão
              </Button>
            )}
            {hasConfig && !isConnected && (
              <div className="flex items-center gap-2 text-sm text-[#25D366]">
                <CheckCircle className="w-4 h-4" />
                Servidor configurado com sucesso
              </div>
            )}
          </CardContent>
        </Card>

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
                : hasConfig
                  ? "Clique em 'Conectar WhatsApp' para gerar o QR Code."
                  : "Configure a Evolution API acima primeiro."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connecting - Show QR Code */}
            {isConnecting && (
              <div className="flex flex-col items-center gap-4 py-6">
                {session?.qr_code ? (
                  <div className="p-2 bg-white rounded-xl">
                    <img
                      src={session.qr_code.startsWith("data:") ? session.qr_code : `data:image/png;base64,${session.qr_code}`}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-secondary rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium">Escaneie o QR Code com o WhatsApp</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    WhatsApp → Dispositivos Vinculados → Vincular Dispositivo
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefreshQR} disabled={refreshQR.isPending}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", refreshQR.isPending && "animate-spin")} />
                    Atualizar QR Code
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => checkStatus.mutate()} disabled={checkStatus.isPending}>
                    {checkStatus.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
                    Verificar Status
                  </Button>
                </div>
              </div>
            )}

            {/* Disconnected */}
            {!isConnecting && !isConnected && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                  <WifiOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">WhatsApp não conectado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hasConfig ? "Clique para gerar o QR Code e conectar." : "Configure a Evolution API acima primeiro."}
                  </p>
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={createSession.isPending || !hasConfig}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2"
                >
                  {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  {createSession.isPending ? "Conectando..." : "Conectar WhatsApp"}
                </Button>
              </div>
            )}

            {/* Connected */}
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
                  onClick={handleDisconnect}
                  disabled={disconnect.isPending}
                  className="gap-2"
                >
                  {disconnect.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
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
              Como instalar o Evolution API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Contrate um VPS</p>
                  <p className="text-xs text-muted-foreground">
                    Recomendamos Hetzner, Contabo ou DigitalOcean (a partir de ~R$25/mês). Ubuntu 22.04 com mínimo 1GB RAM.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Instale com Docker (1 comando)</p>
                  <pre className="text-xs bg-secondary p-2 rounded mt-1 overflow-x-auto">
{`docker run -d --name evolution-api \\
  -p 8080:8080 \\
  -e AUTHENTICATION_API_KEY=SuaChaveAqui \\
  atendai/evolution-api:latest`}
                  </pre>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Configure acima</p>
                  <p className="text-xs text-muted-foreground">
                    Cole a URL do servidor (ex: http://seu-ip:8080) e a API Key que você definiu no passo 2.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Conecte e escaneie!</p>
                  <p className="text-xs text-muted-foreground">
                    Clique em "Conectar WhatsApp", escaneie o QR Code e pronto — mensagens serão enviadas e recebidas automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-xs">
                Enquanto não configurar o servidor, o chat funciona em modo manual — as mensagens são salvas no sistema mas não enviadas pelo WhatsApp.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default WhatsAppSettings;
