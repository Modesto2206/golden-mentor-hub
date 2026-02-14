import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Mail, Lock, ArrowLeft, Building2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

type LoginFormData = z.infer<typeof loginSchema>;

const addCompanySchema = z.object({
  company_name: z.string().min(2, "Nome da empresa é obrigatório").max(200),
  cnpj: z.string().min(14, "CNPJ é obrigatório").max(18),
  company_email: z.string().email("Email inválido").max(255),
  company_phone: z.string().min(10, "Telefone é obrigatório").max(20),
  responsavel: z.string().min(2, "Nome do responsável é obrigatório").max(200),
  plano: z.string().min(1, "Plano é obrigatório").max(100),
  admin_email: z.string().email("Email inválido").max(255),
  admin_password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(100),
  admin_name: z.string().min(2, "Nome do admin é obrigatório").max(200),
});

type AddCompanyFormData = z.infer<typeof addCompanySchema>;

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [addCompanyAuth, setAddCompanyAuth] = useState<{ email: string; password: string } | null>(null);
  const [authStep, setAuthStep] = useState<"auth" | "form">("auth");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, signIn, isLoading: authLoading } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const companyForm = useForm<AddCompanyFormData>({
    resolver: zodResolver(addCompanySchema),
    defaultValues: { company_name: "", cnpj: "", company_email: "", company_phone: "", responsavel: "", plano: "basico", admin_email: "", admin_password: "", admin_name: "" },
  });

  const authForm = useForm<{ email: string; password: string }>({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  // Fetch companies for selection
  const fetchCompanies = async () => {
    const { data, error } = await supabase.from("companies").select("id, name, is_active").order("name");
    if (!error && data) {
      setCompanies(data);
    }
  };

  // Realtime subscription for companies
  useEffect(() => {
    fetchCompanies();
    const channel = supabase
      .channel("companies-auth")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        fetchCompanies();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Block if selected company is suspended
      if (selectedCompany && !selectedCompany.is_active) {
        toast({ variant: "destructive", title: "Empresa suspensa", description: "Empresa suspensa. Entre em contato com o suporte." });
        setIsLoading(false);
        return;
      }

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

      // After login, check if user's company is suspended
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
      navigate("/dashboard");
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate super_admin before allowing company creation
  const handleAuthForAddCompany = async (data: { email: string; password: string }) => {
    setIsAuthenticating(true);
    try {
      // Temporarily sign in to validate
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw new Error("Credenciais inválidas.");

      // Check if user is super_admin (raiz or admin_global)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!roleData || !["raiz", "admin_global"].includes(roleData.role)) {
        await supabase.auth.signOut();
        throw new Error("Apenas o Super Admin pode criar empresas.");
      }

      setAddCompanyAuth({ email: data.email, password: data.password });
      setAuthStep("form");
      toast({ title: "Autenticado!", description: "Preencha os dados da nova empresa." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCreateCompany = async (data: AddCompanyFormData) => {
    setIsAuthenticating(true);
    try {
      // Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: data.company_name,
          cnpj: data.cnpj?.replace(/\D/g, "") || null,
          email: data.company_email || null,
          phone: data.company_phone?.replace(/\D/g, "") || null,
          responsavel: data.responsavel || null,
          plano: data.plano || "basico",
        } as any)
        .select()
        .single();
      if (companyError) throw companyError;

      // Create admin user via edge function
      const { data: result, error: fnError } = await supabase.functions.invoke("add-user", {
        body: {
          email: data.admin_email,
          password: data.admin_password,
          full_name: data.admin_name,
          role: "administrador",
          company_id: company.id,
        },
      });

      if (fnError) throw fnError;
      if (result && !result.success) throw new Error(result.error);

      toast({ title: "Empresa criada!", description: `${data.company_name} está pronta para uso.` });
      setShowAddCompany(false);
      setAuthStep("auth");
      setAddCompanyAuth(null);
      companyForm.reset();
      authForm.reset();
      fetchCompanies();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsAuthenticating(false);
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

        {/* Selected Company Badge */}
        {selectedCompany && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{selectedCompany.name}</span>
            <Badge variant={selectedCompany.is_active ? "default" : "secondary"} className="text-xs ml-auto">
              {selectedCompany.is_active ? "Ativo" : "Suspenso"}
            </Badge>
          </div>
        )}

        <Card className="border-primary/30 shadow-lg shadow-primary/10">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto p-3 rounded-full bg-primary/20 w-fit">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-gold-gradient">Área do Vendedor</CardTitle>
            <CardDescription>
              Acesso exclusivo para vendedores e gestão comercial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Selection Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setShowCompanyList(true)}
              >
                <Building2 className="w-4 h-4" />
                Selecionar Empresa
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => { setShowAddCompany(true); setAuthStep("auth"); }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Empresa
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
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
            <p className="text-center text-xs text-muted-foreground/70">
              Acesso restrito a usuários autorizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company Selection Dialog */}
      <Dialog open={showCompanyList} onOpenChange={setShowCompanyList}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selecionar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa cadastrada</p>
            ) : (
              companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCompany(c); setShowCompanyList(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left
                    ${selectedCompany?.id === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.is_active ? "default" : "secondary"} className="text-xs">
                      {c.is_active ? "Ativo" : "Suspenso"}
                    </Badge>
                    {selectedCompany?.id === c.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Company Dialog */}
      <Dialog open={showAddCompany} onOpenChange={(open) => {
        setShowAddCompany(open);
        if (!open) { setAuthStep("auth"); setAddCompanyAuth(null); authForm.reset(); companyForm.reset(); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{authStep === "auth" ? "Autenticação Necessária" : "Nova Empresa"}</DialogTitle>
          </DialogHeader>

          {authStep === "auth" ? (
            <form onSubmit={authForm.handleSubmit(handleAuthForAddCompany)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apenas o Super Admin pode criar novas empresas. Informe suas credenciais.
              </p>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="super@admin.com"
                  {...authForm.register("email", { required: true })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...authForm.register("password", { required: true })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddCompany(false)}>Cancelar</Button>
                <Button type="submit" disabled={isAuthenticating}>
                  {isAuthenticating ? "Verificando..." : "Verificar"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(handleCreateCompany)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <FormField control={companyForm.control} name="company_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl><Input {...field} placeholder="Nome da empresa" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={companyForm.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl><Input {...field} placeholder="00.000.000/0000-00" maxLength={18} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={companyForm.control} name="company_email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email da Empresa *</FormLabel>
                      <FormControl><Input {...field} type="email" placeholder="empresa@email.com" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={companyForm.control} name="company_phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl><Input {...field} placeholder="(00) 00000-0000" maxLength={15} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={companyForm.control} name="responsavel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável *</FormLabel>
                    <FormControl><Input {...field} placeholder="Nome do responsável" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={companyForm.control} name="plano" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano *</FormLabel>
                    <FormControl><Input {...field} placeholder="Ex: básico, premium" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Administrador da Empresa</p>
                  <div className="space-y-4">
                    <FormField control={companyForm.control} name="admin_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Administrador *</FormLabel>
                        <FormControl><Input {...field} placeholder="Nome completo" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={companyForm.control} name="admin_email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Administrador *</FormLabel>
                        <FormControl><Input {...field} type="email" placeholder="admin@empresa.com" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={companyForm.control} name="admin_password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Administrador *</FormLabel>
                        <FormControl><Input {...field} type="password" placeholder="Mínimo 8 caracteres" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setAuthStep("auth"); setAddCompanyAuth(null); }}>Voltar</Button>
                  <Button type="submit" disabled={isAuthenticating}>
                    {isAuthenticating ? "Criando..." : "Criar Empresa"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
