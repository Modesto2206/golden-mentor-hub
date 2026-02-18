import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, KeyRound, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Erro", description: "Senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
        return;
      }
      setDone(true);
      toast({ title: "Senha redefinida!", description: "Sua senha foi alterada com sucesso." });
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery && !done) {
    return (
      <div className="min-h-screen bg-background bg-pattern flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-primary/30 shadow-lg shadow-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Link inválido</CardTitle>
            <CardDescription>Este link de recuperação é inválido ou já expirou.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background bg-pattern flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-primary/30 shadow-lg shadow-primary/10">
          <CardHeader className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <CardTitle className="text-xl">Senha redefinida!</CardTitle>
            <CardDescription>Redirecionando para o dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-pattern flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary/30 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/20 w-fit">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-gold-gradient">Redefinir Senha</CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Repita a senha"
                className="pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <Button onClick={handleReset} className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Redefinir Senha"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
