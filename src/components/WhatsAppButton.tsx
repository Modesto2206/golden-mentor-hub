import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppPopup } from "@/hooks/useWhatsAppPopup";

const WhatsAppButton = () => {
  const { openPopup } = useWhatsAppPopup();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10 hover:text-[#25D366]"
      onClick={() => openPopup()}
    >
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline">WhatsApp</span>
    </Button>
  );
};

export default WhatsAppButton;
