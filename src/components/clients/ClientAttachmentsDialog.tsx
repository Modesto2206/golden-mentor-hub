import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Trash2, FileText, Image, File, Loader2, Download } from "lucide-react";

interface ClientAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

const FILE_ICONS: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "image/jpeg": Image,
  "image/png": Image,
  "image/webp": Image,
  "image/gif": Image,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ClientAttachmentsDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
}: ClientAttachmentsDialogProps) => {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["client-attachments", clientId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("client_attachments" as any) as any)
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: open && !!clientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachment: any) => {
      // Delete from storage
      await supabase.storage.from("client-attachments").remove([attachment.file_path]);
      // Delete from table
      const { error } = await (supabase.from("client_attachments" as any) as any)
        .delete()
        .eq("id", attachment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-attachments", clientId] });
      toast({ title: "Arquivo removido" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao remover arquivo" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !user || !companyId) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const filePath = `${companyId}/${clientId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("client-attachments")
          .upload(filePath, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { error: dbError } = await (supabase.from("client_attachments" as any) as any)
          .insert({
            client_id: clientId,
            company_id: companyId,
            uploaded_by: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
          });

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ["client-attachments", clientId] });
      toast({ title: `${files.length} arquivo(s) enviado(s)` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (attachment: any) => {
    const { data, error } = await supabase.storage
      .from("client-attachments")
      .createSignedUrl(attachment.file_path, 60);

    if (error || !data?.signedUrl) {
      toast({ variant: "destructive", title: "Erro ao gerar link" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Anexos — {clientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? "Enviando..." : "Enviar Arquivo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          <ScrollArea className="max-h-[340px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : attachments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum anexo encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {attachments.map((att: any) => {
                  const IconComponent = FILE_ICONS[att.file_type] || File;
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30"
                    >
                      <IconComponent className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {att.file_size ? formatFileSize(att.file_size) : ""} ·{" "}
                          {new Date(att.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={() => handleDownload(att)}
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(att)}
                        disabled={deleteMutation.isPending}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAttachmentsDialog;
