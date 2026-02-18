import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, UserPlus, Mail, Lock, ArrowLeft, User, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

const registerSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }).max(200),
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
  confirm_password: z.string().min(6, { message: "Confirme sua senha" }).max(100),
}).refine((data) => data.password === data.confirm_password, {
  message: "As senhas não coincidem",
  path: ["confirm_password"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, signIn, isLoading: authLoading } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", confirm_password: "" },
  });

  // Redirect when auth is fully loaded with role
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

      // Check if user's company is suspended
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("user_id", loggedUser.id)
          .maybeSingle();
        if (profile?.company_id) {
          const { data: company } = await supabase
            .from("companies")
            .select("is_active")
            .eq("id", profile.company_id)
            .maybeSingle();
          if (company && !company.is_active) {
            await supabase.auth.signOut();
            toast({ variant: "destructive", title: "Empresa suspensa", description: "Empresa suspensa. Entre em contato com o suporte." });
            setIsLoading(false);
            return;
          }
        }
      }

      toast({ title: "Login realizado!", description: "Bem-vindo à plataforma." });
      // Don't navigate here - let the useEffect handle it after AuthContext loads role
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
      setShowForgotPassword(false);
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Check if email already exists by trying to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
          toast({
            variant: "destructive",
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Faça login.",
          });
          setActiveTab("login");
          loginForm.setValue("email", data.email);
          return;
        }
        toast({ variant: "destructive", title: "Erro no cadastro", description: signUpError.message });
        return;
      }

      // If user was returned but identities is empty, email already exists
      if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        toast({
          variant: "destructive",
          title: "Email já cadastrado",
          description: "Este email já possui uma conta. Faça login.",
        });
        setActiveTab("login");
        loginForm.setValue("email", data.email);
        return;
      }

      // Auto login after successful signup
      if (signUpData.session) {
        toast({ title: "Cadastro realizado!", description: "Bem-vindo à plataforma." });
        // Don't navigate here - let the useEffect handle it after AuthContext provisions and loads role
      } else {
        // Email confirmation required
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar sua conta antes de fazer login.",
        });
        setActiveTab("login");
        loginForm.setValue("email", data.email);
      }
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Painel
        </Button>

        <Card className="border-primary/30 shadow-lg shadow-primary/10">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto p-3 rounded-full bg-primary/20 w-fit">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-gold-gradient">Cred+ Plataforma</CardTitle>
            <CardDescription>
              Acesse sua conta ou cadastre-se para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {showForgotPassword ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <KeyRound className="w-8 h-8 text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Digite seu email para receber o link de recuperação
                      </p>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button onClick={onForgotPassword} className="w-full" disabled={isLoading}>
                      {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar ao login
                    </Button>
                  </div>
                ) : (
                  <>
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
                                  <Input {...field} type="email" placeholder="seu@email.com" className="pl-10" disabled={isLoading} />
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
                                <Button
                                  type="button"
                                  variant="link"
                                  className="text-xs text-primary p-0 h-auto"
                                  onClick={() => {
                                    setForgotEmail(loginForm.getValues("email"));
                                    setShowForgotPassword(true);
                                  }}
                                >
                                  Esqueci minha senha
                                </Button>
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input {...field} type="password" placeholder="••••••••" className="pl-10" disabled={isLoading} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Entrando..." : "Entrar"}
                        </Button>
                      </form>
                    </Form>
                  </>
                )}
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input {...field} placeholder="Seu nome completo" className="pl-10" disabled={isLoading} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input {...field} type="email" placeholder="seu@email.com" className="pl-10" disabled={isLoading} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input {...field} type="password" placeholder="Mínimo 6 caracteres" className="pl-10" disabled={isLoading} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input {...field} type="password" placeholder="Repita a senha" className="pl-10" disabled={isLoading} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Cadastrando..." : "Criar Conta"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-muted-foreground/70 mt-4">
              Ao se cadastrar, você concorda com nossos termos de uso
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
