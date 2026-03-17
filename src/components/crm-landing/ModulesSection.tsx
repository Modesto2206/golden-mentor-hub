import {
  Target, MessageSquare, BarChart3, FileText,
  Building2, DollarSign, Users, ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const modules = [
  {
    icon: Target,
    title: "Funil de Vendas Visual",
    desc: "Pipeline drag-and-drop com 7 etapas: Leads → Contato → Simulação → Proposta → Análise → Aprovado → Pago",
    highlight: true,
  },
  {
    icon: Users,
    title: "Gestão de Leads & Clientes",
    desc: "Cadastro, importação em massa, histórico completo, anexos e anotações internas centralizados.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    desc: "Converse com leads sem sair da plataforma. Agilidade no atendimento = mais fechamentos.",
  },
  {
    icon: BarChart3,
    title: "Dashboard & Metas",
    desc: "Faturamento em tempo real, ranking de vendedores, projeção de vendas e metas individuais.",
  },
  {
    icon: FileText,
    title: "Propostas com PDF",
    desc: "Crie, acompanhe e gere PDFs profissionais para envio direto aos clientes.",
  },
  {
    icon: Building2,
    title: "Bancos & Convênios",
    desc: "INSS, Forças Armadas, SIAPE, CLT e FGTS — configure produtos, taxas e prazos por banco.",
  },
  {
    icon: DollarSign,
    title: "Comissões Automáticas",
    desc: "Cálculo automático por faixa de produção com acompanhamento mensal por vendedor.",
  },
  {
    icon: ShieldCheck,
    title: "Controle & Segurança",
    desc: "Permissões por função, logs de auditoria e dados centralizados com acesso por empresa.",
  },
];

const ModulesSection = () => (
  <section id="modulos" className="px-4 py-20">
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold tracking-widest text-primary uppercase">Módulos</span>
        <h2 className="text-3xl md:text-4xl font-black text-gold-gradient leading-tight">
          Tudo Que Sua Operação Precisa — Em Um Só Lugar
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Cada módulo foi projetado para resolver um problema real do dia a dia comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {modules.map((mod, i) => (
          <Card
            key={i}
            className={`border-border/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${
              mod.highlight
                ? "gold-glow border-primary/40 bg-primary/5 lg:col-span-2 lg:row-span-1"
                : "bg-card/60 backdrop-blur-sm gold-glow-hover"
            }`}
          >
            <CardContent className="p-6 space-y-4 h-full flex flex-col">
              <div className={`p-3 rounded-xl w-fit ${mod.highlight ? "bg-primary/20" : "bg-primary/10"}`}>
                <mod.icon className={`w-6 h-6 text-primary ${mod.highlight ? "w-7 h-7" : ""}`} />
              </div>
              <h3 className={`font-bold text-foreground ${mod.highlight ? "text-xl" : "text-base"}`}>
                {mod.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{mod.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default ModulesSection;
