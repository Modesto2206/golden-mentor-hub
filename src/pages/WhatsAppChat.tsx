import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppConversations, useWhatsAppMessages, useSendWhatsAppMessage, useWhatsAppSession } from "@/hooks/useWhatsApp";
import { useProfiles } from "@/hooks/useProfiles";
import { MessageCircle, Send, Search, Phone, User, Wifi, WifiOff, Plus, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import NewConversationDialog from "@/components/whatsapp/NewConversationDialog";

const formatPhone = (phone: string) => {
  const d = phone?.replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
};

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

const WhatsAppChat = () => {
  const { companyId } = useAuth();
  const { data: session } = useWhatsAppSession();
  const { data: conversations = [] } = useWhatsAppConversations();
  const { currentProfile } = useProfiles();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showNewConv, setShowNewConv] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useWhatsAppMessages(selectedPhone);
  const sendMessage = useSendWhatsAppMessage();

  const selectedConv = conversations.find((c) => c.phone === selectedPhone);

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.client_name?.toLowerCase().includes(q) ||
      c.phone.includes(search.replace(/\D/g, ""))
    );
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedPhone) return;
    sendMessage.mutate({
      phone: selectedPhone,
      messageText: messageInput.trim(),
      clientId: selectedConv?.client_id,
      clientName: selectedConv?.client_name,
    });
    setMessageInput("");
  };

  const handleSelectConversation = (phone: string) => {
    setSelectedPhone(phone);
    setShowMobileList(false);
  };

  const isConnected = session?.status === "connected";

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
            <h1 className="text-xl font-bold">WhatsApp — Atendimento</h1>
            <Badge variant={isConnected ? "default" : "secondary"} className={cn(
              "gap-1",
              isConnected ? "bg-[#25D366] text-white" : ""
            )}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? "Conectado" : session?.status === "connecting" ? "Conectando..." : "Desconectado"}
            </Badge>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowNewConv(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Conversa</span>
          </Button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex border border-border rounded-xl overflow-hidden bg-card min-h-0">
          {/* Conversation List */}
          <div className={cn(
            "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card",
            !showMobileList && "hidden md:flex"
          )}>
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar conversa..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma conversa encontrada</p>
                  <p className="text-xs mt-1">Inicie uma nova conversa</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.phone)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        selectedPhone === conv.phone
                          ? "bg-primary/10"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#25D366]">
                          {getInitials(conv.client_name || conv.phone)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {conv.client_name || formatPhone(conv.phone)}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message || "Sem mensagens"}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="ml-2 w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] flex items-center justify-center shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0",
            showMobileList && "hidden md:flex"
          )}>
            {selectedPhone ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    onClick={() => setShowMobileList(true)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#25D366]">
                      {getInitials(selectedConv?.client_name || selectedPhone)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedConv?.client_name || formatPhone(selectedPhone)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPhone(selectedPhone)}
                    </p>
                  </div>
                  {selectedConv?.client_id && (
                    <Badge variant="outline" className="gap-1 shrink-0">
                      <User className="w-3 h-3" />
                      Vinculado
                    </Badge>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {messages.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-12">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-xs mt-1">
                          {isConnected
                            ? "Envie uma mensagem para iniciar a conversa"
                            : "Conecte o WhatsApp nas configurações para enviar mensagens reais"}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.sender_type === "seller" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                              msg.sender_type === "seller"
                                ? "bg-[#DCF8C6] dark:bg-[#025C4C] text-foreground rounded-br-md"
                                : "bg-secondary text-foreground rounded-bl-md"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                            <p className={cn(
                              "text-[10px] mt-1 text-right",
                              msg.sender_type === "seller"
                                ? "text-muted-foreground/70"
                                : "text-muted-foreground"
                            )}>
                              {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="px-4 py-3 border-t border-border bg-card">
                  <div className="flex items-center gap-2 max-w-2xl mx-auto">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={isConnected ? "Digite uma mensagem..." : "WhatsApp não conectado — mensagens serão salvas localmente"}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageInput.trim() || sendMessage.isPending}
                      size="icon"
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <div className="w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-10 h-10 text-[#25D366]/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">WhatsApp Atendimento</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Selecione uma conversa ou inicie uma nova para começar o atendimento.
                  </p>
                  {!isConnected && (
                    <p className="text-xs text-muted-foreground mt-3 bg-secondary/50 px-3 py-2 rounded-lg inline-block">
                      ⚠️ WhatsApp não conectado — acesse Configurações → WhatsApp para conectar
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewConversationDialog
        open={showNewConv}
        onOpenChange={setShowNewConv}
        onSelect={(phone, name, clientId) => {
          setSelectedPhone(phone);
          setShowMobileList(false);
          setShowNewConv(false);
        }}
      />
    </AppLayout>
  );
};

export default WhatsAppChat;
