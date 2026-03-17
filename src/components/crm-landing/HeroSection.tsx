import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const logoFull = "/images/logo-credmais-full.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <header className="relative pt-20 pb-24 px-4 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center space-y-8 relative">
        <div className="flex justify-center">
          <img
            src={logoFull}
            alt="Cred+ CRM"
            width={160}
            height={160}
            fetchPriority="high"
            className="h-24 md:h-36 w-auto object-contain drop-shadow-[0_0_25px_hsl(44_100%_50%/0.4)]"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Plataforma CRM #1 para Crédito Consignado
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gold-gradient tracking-tight leading-[1.1]">
          Venda Mais.<br />
          Perca Menos.<br />
          Controle Tudo.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A plataforma que transforma sua operação comercial — do lead ao pagamento — 
          com funil visual, WhatsApp integrado e gestão completa do seu time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button
            size="lg"
            className="text-base px-10 py-7 font-bold gold-glow text-lg"
            onClick={() => navigate("/auth")}
          >
            Começar Agora — É Grátis
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-10 py-7 border-primary/30 hover:bg-primary/5"
            onClick={() => document.getElementById("modulos")?.scrollIntoView({ behavior: "smooth" })}
          >
            Conhecer a Plataforma
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/60 pt-2">
          <span>✓ Sem cartão de crédito</span>
          <span>✓ Setup em 2 minutos</span>
          <span>✓ Suporte via WhatsApp</span>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
