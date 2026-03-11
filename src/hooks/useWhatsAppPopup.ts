import { useCallback, useRef, useState } from "react";

const WHATSAPP_URL = "https://web.whatsapp.com";
const POPUP_WIDTH = 480;
const POPUP_HEIGHT = 700;

export function useWhatsAppPopup() {
  const popupRef = useRef<Window | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPopup = useCallback((phone?: string) => {
    // If popup already open and not closed, focus it
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      setIsOpen(true);
      return;
    }

    const url = phone
      ? `https://wa.me/${phone}`
      : WHATSAPP_URL;

    // Position popup on the right side of the screen
    const left = window.screen.width - POPUP_WIDTH - 20;
    const top = Math.max(0, (window.screen.height - POPUP_HEIGHT) / 2);

    const features = [
      `width=${POPUP_WIDTH}`,
      `height=${POPUP_HEIGHT}`,
      `left=${left}`,
      `top=${top}`,
      "menubar=no",
      "toolbar=no",
      "location=yes",
      "status=no",
      "resizable=yes",
      "scrollbars=yes",
    ].join(",");

    popupRef.current = window.open(url, "whatsapp_popup", features);
    setIsOpen(true);

    // Monitor popup close
    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setIsOpen(false);
        popupRef.current = null;
        clearInterval(interval);
      }
    }, 500);
  }, []);

  const closePopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setIsOpen(false);
  }, []);

  return { openPopup, closePopup, isOpen };
}
