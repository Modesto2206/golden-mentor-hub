import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
}

const CategoryCard = ({ title, description, icon: Icon, link }: CategoryCardProps) => {
  const handleClick = () => {
    if (link && link !== "#") {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card 
      onClick={handleClick}
      className="group cursor-pointer bg-card border-gold-animated gold-glow-hover transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="p-4 rounded-full bg-secondary/50 group-hover:bg-primary/20 transition-colors duration-300">
          <Icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-300" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gold-gradient">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-primary/70 text-xs group-hover:text-primary transition-colors">
          <span>Clique para acessar</span>
          <svg 
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
