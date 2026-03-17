import { XCircle, TrendingDown, Clock, AlertTriangle } from "lucide-react";

const painPoints = [
  { icon: XCircle, text: "Leads chegam e se perdem em anotações soltas e planilhas desatualizadas" },
  { icon: TrendingDown, text: "Você não sabe em qual etapa cada cliente está — e perde o timing da venda" },
  { icon: AlertTriangle, text: "Sua equipe trabalha no escuro, sem visão clara do funil de vendas" },
  { icon: Clock, text: "Oportunidades de faturamento escapam todos os dias por falta de controle" },
];

const PainPointsSection = () => (
  <section className="px-4 py-20">
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold tracking-widest text-destructive uppercase">O Problema</span>
        <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
          Sua Empresa Está <span className="text-destructive">Perdendo Dinheiro</span> — E Você Talvez Nem Saiba
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Se você se identifica com alguma dessas situações, está deixando faturamento na mesa todos os dias:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {painPoints.map((point, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-5 rounded-xl border border-destructive/15 bg-destructive/5 backdrop-blur-sm"
          >
            <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
              <point.icon className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">{point.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PainPointsSection;
