import { MessageCircle, X } from "lucide-react";
import { useWhatsAppPopup } from "@/hooks/useWhatsAppPopup";
import { cn } from "@/lib/utils";

const WhatsAppFAB = () => {
  const { openPopup, closePopup, isOpen } = useWhatsAppPopup();

  return (
    <button
      onClick={() => (isOpen ? closePopup() : openPopup())}
      className={cn(
        "fixed bottom-8 right-8 z-[9999] transition-all duration-200 hover:scale-110",
      )}
      title={isOpen ? "Fechar WhatsApp" : "Abrir WhatsApp Web"}
    >
      {isOpen ? (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shadow-lg">
          <X className="w-5 h-5 text-muted-foreground" />
        </div>
      ) : (
        <svg viewBox="0 0 48 48" className="w-12 h-12 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="#25D366"/>
          <path fill="#fff" d="M24 10.5c-7.456 0-13.5 6.044-13.5 13.5 0 2.382.618 4.709 1.794 6.762L10.5 37.5l6.93-1.818A13.43 13.43 0 0 0 24 37.5c7.456 0 13.5-6.044 13.5-13.5S31.456 10.5 24 10.5Zm6.642 19.296c-.282.792-1.632 1.518-2.25 1.614-.564.084-1.278.12-2.064-.132a18.9 18.9 0 0 1-1.866-.69c-3.288-1.416-5.436-4.728-5.598-4.95-.162-.216-1.338-1.782-1.338-3.396s.846-2.412 1.146-2.742c.3-.33.654-.414.87-.414h.63c.204 0 .474-.078.738.564.282.654.954 2.328 1.038 2.496.084.168.138.366.024.588-.108.222-.168.36-.33.552-.168.198-.348.438-.498.588-.168.168-.342.348-.144.684.192.33.858 1.416 1.842 2.292 1.266 1.128 2.334 1.476 2.664 1.644.336.168.528.138.726-.084.192-.222.834-.966 1.056-1.302.222-.33.45-.276.75-.168.3.114 1.914.9 2.244 1.068.33.168.546.246.63.384.084.144.084.792-.198 1.584-.006 0-.006-.006 0 0Z"/>
        </svg>
      )}
    </button>
  );
};

export default WhatsAppFAB;
