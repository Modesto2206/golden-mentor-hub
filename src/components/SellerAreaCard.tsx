import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface SellerAreaCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const SellerAreaCard = ({ title, description, icon: Icon }: SellerAreaCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/auth");
  };

  return (
    <Card 
      onClick={handleClick}
      className="group cursor-pointer bg-gradient-to-br from-card to-secondary/30 border-2 border-primary/60 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-2 hover:border-primary hover:shadow-xl hover:shadow-primary/30"
    >
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4 relative">
        {/* Badge de área restrita */}
        <Badge 
          variant="outline" 
          className="absolute -top-3 right-4 bg-primary/20 border-primary text-primary text-xs font-semibold px-3 py-1"
        >
          Área Restrita
        </Badge>

        <div className="p-4 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors duration-300 ring-2 ring-primary/40">
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

        <div className="flex items-center gap-2 text-primary text-xs font-medium group-hover:text-primary transition-colors">
          <span>Acessar área interna</span>
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

export default SellerAreaCard;
