import { 
  Target, Users, BarChart3, MessageSquare, ArrowRight, 
  CheckCircle2, XCircle, Zap, Eye, MousePointerClick, 
  TrendingUp, Clock, Shield, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const logoFull = "/images/logo-credmais-full.png";

const painPoints = [
  { icon: XCircle, text: "Leads chegam e se perdem em anotações soltas e planilhas desatualizadas" },
  { icon: XCircle, text: "Você não sabe em qual etapa cada cliente está — e perde o timing da venda" },
  { icon: XCircle, text: "Sua equipe trabalha no escuro, sem visão clara do funil de vendas" },
  { icon: XCircle, text: "Oportunidades de faturamento escapam todos os dias por falta de controle" },
];

const benefits = [
  {
    icon: Target,
    title: "Zero Leads Perdidos",
    description: "Cada lead é capturado, organizado e acompanhado do primeiro contato até o fechamento. Nada mais escapa.",
  },
  {
    icon: Eye,
    title: "Visão Total do Funil",
    description: "Saiba exatamente onde cada negociação está. Arraste e solte entre etapas com um clique.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    description: "Fale com seus leads sem sair da plataforma. Velocidade no atendimento = mais fechamentos.",
  },
  {
    icon: TrendingUp,
    title: "Aumente sua Conversão",
    description: "Com processos organizados, sua taxa de conversão cresce naturalmente. Mais controle = mais vendas.",
  },
  {
    icon: Clock,
    title: "Economia de Tempo",
    description: "Interface rápida e intuitiva. Sua equipe gasta menos tempo com burocracia e mais tempo vendendo.",
  },
  {
    icon: Shield,
    title: "Controle e Segurança",
    description: "Dados centralizados, acesso por equipe, histórico completo. Tudo sob seu controle total.",
  },
];

const funnelSteps = [
  { label: "Leads", color: "bg-primary/20 text-primary" },
  { label: "Contato", color: "bg-primary/30 text-primary" },
  { label: "Simulação", color: "bg-primary/40 text-primary-foreground" },
  { label: "Proposta Enviada", color: "bg-primary/60 text-primary-foreground" },
  { label: "Em Análise", color: "bg-primary/70 text-primary-foreground" },
  { label: "Aprovado", color: "bg-primary/85 text-primary-foreground" },
  { label: "Pago", color: "bg-primary text-primary-foreground" },
];

const CRMLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dashboard bg-pattern">
      {/* Hero Section */}
      <header className="pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center">
            <img
              src={logoFull}
              alt="Cred+ CRM"
              width={128}
              height={128}
              fetchPriority="high"
              className="h-20 md:h-28 w-auto object-contain drop-shadow-[0_0_15px_hsl(44_100%_50%/0.3)]"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gold-gradient tracking-tight leading-tight">
              Pare de Perder Vendas.<br />
              Assuma o Controle Total do Seu Funil.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A plataforma CRM que transforma leads desorganizados em vendas fechadas — 
              com funil visual, WhatsApp integrado e gestão completa do seu time comercial.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-base px-8 py-6 font-bold gold-glow"
              onClick={() => navigate("/auth")}
            >
              Começar Agora — É Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 py-6"
              onClick={() => {
                document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver Como Funciona
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60">
            Sem cartão de crédito • Setup em 2 minutos • Suporte humanizado
          </p>
        </div>
      </header>

      {/* Pain Points Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-gold-gradient">
              Sua Empresa Está Perdendo Dinheiro — E Você Talvez Nem Saiba
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Se você se identifica com alguma dessas situações, está deixando faturamento na mesa todos os dias:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {painPoints.map((point, i) => (
              <Card key={i} className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-5 flex items-start gap-3">
                  <point.icon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{point.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-gold-gradient">
              Tudo Que Você Precisa Para Vender Mais — Em Um Só Lugar
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cada funcionalidade foi pensada para resolver um problema real do seu dia a dia comercial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <Card key={i} className="border-border/50 gold-glow-hover transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-full bg-primary/10 w-fit">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-gold-gradient">
              Simples de Usar. Poderoso nos Resultados.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Seu funil de vendas organizado visualmente — arraste e solte para mover cada lead entre as etapas:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {funnelSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-3 py-2 rounded-lg text-xs md:text-sm font-semibold ${step.color}`}>
                  {step.label}
                </span>
                {i < funnelSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden md:block" />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {[
              {
                step: "01",
                icon: Users,
                title: "Cadastre Seus Leads",
                desc: "Importe ou cadastre leads manualmente. Todos centralizados em um só lugar.",
              },
              {
                step: "02",
                icon: MousePointerClick,
                title: "Gerencie o Funil",
                desc: "Arraste cada lead entre as etapas. Visualize todo o seu pipeline em tempo real.",
              },
              {
                step: "03",
                icon: Zap,
                title: "Feche Mais Vendas",
                desc: "Com WhatsApp integrado e controle total, sua equipe converte mais e mais rápido.",
              },
            ].map((item, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-3">
                  <span className="text-3xl font-black text-primary/30">{item.step}</span>
                  <div className="flex justify-center">
                    <div className="p-3 rounded-full bg-primary/10">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border-primary/30 gold-glow bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-6 h-6 text-primary fill-primary" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-lg md:text-xl text-foreground italic leading-relaxed">
                "Antes eu perdia leads toda semana. Hoje tenho visão total do meu funil e minha equipe 
                sabe exatamente o que fazer. Nosso faturamento cresceu 40% em 3 meses."
              </blockquote>
              <p className="text-sm text-muted-foreground font-semibold">
                — Gestor Comercial, Empresa de Crédito Consignado
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-2xl md:text-4xl font-extrabold text-gold-gradient leading-tight">
            Cada Dia Sem Controle é Dinheiro Perdido.<br />
            Comece Agora.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Enquanto você espera, seus concorrentes já estão organizando o funil deles. 
            Não perca mais nenhuma oportunidade.
          </p>

          <div className="space-y-4">
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 font-bold gold-glow"
              onClick={() => navigate("/auth")}
            >
              Quero Vender Mais — Criar Minha Conta
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Pronto em 2 minutos
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Suporte via WhatsApp
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-8 text-center border-t border-border/30 pt-8">
        <img
          src={logoFull}
          alt="Cred+"
          className="h-10 w-auto object-contain mx-auto mb-3 opacity-60"
        />
        <p className="text-muted-foreground/50 text-sm">
          © {new Date().getFullYear()} Cred+ • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
};

export default CRMLanding;
