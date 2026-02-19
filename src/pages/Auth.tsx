import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
const authHero = "/images/auth-hero.png";
import logoFull from "@/assets/logo-credmais-full.png";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});


const adminAuthSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

type LoginFormData = z.infer<typeof loginSchema>;

type AdminAuthFormData = z.infer<typeof adminAuthSchema>;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "admin_auth" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, signIn, isLoading: authLoading } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });


  const adminAuthForm = useForm<AdminAuthFormData>({
    resolver: zodResolver(adminAuthSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        let message = "Erro ao fazer login. Verifique suas credenciais.";
        if (error.message.includes("Invalid login credentials")) {
          message = "Email ou senha incorretos.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Por favor, confirme seu email antes de fazer login.";
        }
        toast({ variant: "destructive", title: "Erro no login", description: message });
        return;
      }
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", loggedUser.id).maybeSingle();
        if (profile?.company_id) {
          const { data: company } = await supabase.from("companies").select("is_active").eq("id", profile.company_id).maybeSingle();
          if (company && !company.is_active) {
            await supabase.auth.signOut();
            toast({ variant: "destructive", title: "Empresa suspensa", description: "Empresa suspensa. Entre em contato com o suporte." });
            setIsLoading(false);
            return;
          }
        }
      }
      toast({ title: "Login realizado!", description: "Bem-vindo à plataforma." });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Digite seu email." });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
        return;
      }
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir sua senha." });
      setMode("login");
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  const onAdminAuth = async (data: AdminAuthFormData) => {
    setIsLoading(true);
    try {
      // Sign in as admin to verify
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast({ variant: "destructive", title: "Erro na autenticação", description: "Credenciais inválidas." });
        return;
      }

      // Check if user has super admin role
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível verificar o usuário." });
        await supabase.auth.signOut();
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", adminUser.id)
        .maybeSingle();

      const userRole = roleData?.role;
      if (userRole !== "raiz" && userRole !== "admin_global") {
        toast({ variant: "destructive", title: "Acesso negado", description: "Apenas Super Administradores podem criar contas." });
        await supabase.auth.signOut();
        return;
      }

      // Admin verified - redirect to company creation page
      toast({ title: "Acesso autorizado", description: "Você será redirecionado para criar a empresa." });
      navigate("/criar-empresa", { replace: true });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMode("login");
    supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <img src={logoFull} alt="Cred+ Consignado" className="h-[7.5rem] sm:h-36 lg:h-[10.5rem] w-auto max-w-[90%] object-contain" />
          </div>

          {mode === "forgot" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Recuperar senha</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Digite seu email para receber o link de recuperação
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Digite seu email"
                      className="pl-10 h-12 border-border"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button onClick={onForgotPassword} className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setMode("login")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Escolha como deseja entrar na sua conta
                </p>
              </div>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} type="email" placeholder="Digite seu email" className="pl-10 h-12 border-border" disabled={isLoading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Senha</FormLabel>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline font-medium"
                            onClick={() => {
                              setForgotEmail(loginForm.getValues("email"));
                              setMode("forgot");
                            }}
                          >
                            Esqueci minha senha
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} type="password" placeholder="••••••••" className="pl-10 h-12 border-border" disabled={isLoading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium border-border"
                onClick={() => setMode("admin_auth")}
              >
                Criar uma conta
              </Button>
            </div>
          )}

          {mode === "admin_auth" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Autenticação Administrativa</h1>
                  <p className="text-muted-foreground text-sm">
                    Faça login com sua conta de Super Admin para criar uma nova conta
                  </p>
                </div>
              </div>
              <Form {...adminAuthForm}>
                <form onSubmit={adminAuthForm.handleSubmit(onAdminAuth)} className="space-y-4">
                  <FormField
                    control={adminAuthForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Super Admin</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} type="email" placeholder="Email do administrador" className="pl-10 h-12 border-border" disabled={isLoading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adminAuthForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Super Admin</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} type="password" placeholder="••••••••" className="pl-10 h-12 border-border" disabled={isLoading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? "Verificando..." : "Verificar e Continuar"}
                  </Button>
                </form>
              </Form>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </div>
          )}


        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 z-10" />
        <img
          src={authHero}
          alt="Parceria e confiança"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 right-12 z-20">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <p className="text-lg font-semibold text-foreground">
              "A plataforma que simplifica o crédito consignado para sua equipe."
            </p>
            <p className="text-sm text-muted-foreground mt-2">Cred+ Consignado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
