import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Palette, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  { label: "Dourado", value: "#FFBC00" },
  { label: "Azul", value: "#2563EB" },
  { label: "Verde", value: "#16A34A" },
  { label: "Roxo", value: "#7C3AED" },
  { label: "Vermelho", value: "#DC2626" },
  { label: "Rosa", value: "#DB2777" },
  { label: "Laranja", value: "#EA580C" },
  { label: "Ciano", value: "#0891B2" },
];

const CompanySettings = () => {
  const { isAdmin } = useAuth();
  const { settings, isLoading, upsertSettings, uploadLogo } = useCompanySettings();
  const { toast } = useToast();

  const [primaryColor, setPrimaryColor] = useState("#FFBC00");
  const [secondaryColor, setSecondaryColor] = useState("#1a1a2e");
  const [accentColor, setAccentColor] = useState("#FFBC00");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color || "#FFBC00");
      setSecondaryColor(settings.secondary_color || "#1a1a2e");
      setAccentColor(settings.accent_color || "#FFBC00");
      setLogoPreview(settings.logo_url);
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie uma imagem (PNG, JPG, SVG)", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      const url = await uploadLogo(file);
      setLogoPreview(url);
      await upsertSettings.mutateAsync({ logo_url: url });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    upsertSettings.mutate({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
    });
  };

  const handleReset = () => {
    setPrimaryColor("#FFBC00");
    setSecondaryColor("#1a1a2e");
    setAccentColor("#FFBC00");
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Personalização da Marca</h1>
          <p className="text-muted-foreground">Configure a identidade visual da sua empresa.</p>
        </div>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Logo da Empresa
            </CardTitle>
            <CardDescription>Substitua o logo padrão pelo da sua empresa (PNG, JPG ou SVG, máx. 2MB).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-muted-foreground text-sm text-center px-2">Nenhum logo</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button variant="outline" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : "Enviar Logo"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Cores da Marca
            </CardTitle>
            <CardDescription>Defina as cores que serão aplicadas em toda a plataforma para sua empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Cor Primária</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32 font-mono"
                  maxLength={7}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setPrimaryColor(c.value)}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.value,
                      borderColor: primaryColor === c.value ? "hsl(var(--foreground))" : "transparent",
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Cor Secundária</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-32 font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Cor de Destaque</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-32 font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg border border-border space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pré-visualização</p>
              <div className="flex gap-3 items-center">
                <div className="w-16 h-10 rounded" style={{ backgroundColor: primaryColor }} />
                <div className="w-16 h-10 rounded" style={{ backgroundColor: secondaryColor }} />
                <div className="w-16 h-10 rounded" style={{ backgroundColor: accentColor }} />
              </div>
              <Button style={{ backgroundColor: primaryColor, color: "#fff" }} className="mt-2">
                Botão Exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} disabled={upsertSettings.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {upsertSettings.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default CompanySettings;
