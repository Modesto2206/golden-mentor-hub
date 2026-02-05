import { Shield, Users, Building2, Briefcase, Wallet, BarChart3 } from "lucide-react";
import CategoryCard from "@/components/CategoryCard";
import SellerAreaCard from "@/components/SellerAreaCard";

// Configuração das categorias - Atualize os links conforme necessário
const categories = [
  {
    id: 1,
    title: "INSS",
    description: "Aposentados e pensionistas do Instituto Nacional do Seguro Social",
    icon: Shield,
    link: "#", // Substitua pelo link do Drive
  },
  {
    id: 2,
    title: "Forças Armadas",
    description: "Militares ativos e inativos das Forças Armadas Brasileiras",
    icon: Users,
    link: "#", // Substitua pelo link do Drive
  },
  {
    id: 3,
    title: "SIAPE",
    description: "Servidores públicos federais vinculados ao sistema SIAPE",
    icon: Building2,
    link: "#", // Substitua pelo link do Drive
  },
  {
    id: 4,
    title: "CLT",
    description: "Trabalhadores com carteira assinada e vínculos empregatícios",
    icon: Briefcase,
    link: "#", // Substitua pelo link do Drive
  },
  {
    id: 5,
    title: "FGTS",
    description: "Antecipação do saque-aniversário do Fundo de Garantia",
    icon: Wallet,
    link: "#", // Substitua pelo link do Drive
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-pattern">
      {/* Header */}
      <header className="pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gold-gradient tracking-tight">
            Painel do Mentor
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Organização estratégica das aulas de Crédito Consignado
          </p>
          
          {/* Linha decorativa */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
            <div className="w-2 h-2 rounded-full bg-primary gold-glow" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>
      </header>

      {/* Grid de Categorias */}
      <main className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                description={category.description}
                icon={category.icon}
                link={category.link}
              />
            ))}
            {/* Card Área do Vendedor - Destaque especial */}
            <SellerAreaCard
              title="Área do Vendedor"
              description="Acesso exclusivo para vendedores e gestão comercial"
              icon={BarChart3}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 text-center">
        <p className="text-muted-foreground/50 text-sm">
          Acesso exclusivo • Área do Mentor
        </p>
      </footer>
    </div>
  );
};

export default Index;
