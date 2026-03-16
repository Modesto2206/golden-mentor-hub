import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface ImportRow {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  source?: string;
  city?: string;
  state?: string;
  notes?: string;
}

interface ParsedRow extends ImportRow {
  _rowNum: number;
  _errors: string[];
  _valid: boolean;
}

const HEADER_ALIASES: [string[], keyof ImportRow][] = [
  [["nome", "nome_completo", "full_name", "nome completo", "cliente", "name"], "name"],
  [["cpf", "cpf_cliente", "documento"], "cpf"],
  [["telefone", "phone", "celular", "tel", "fone", "whatsapp"], "phone"],
  [["email", "e-mail", "e_mail"], "email"],
  [["origem", "source", "fonte", "canal"], "source"],
  [["cidade", "city", "municipio", "município"], "city"],
  [["uf", "estado", "state"], "state"],
  [["observacoes", "observações", "notas", "notes", "obs"], "notes"],
];

function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function mapHeader(raw: string): keyof ImportRow | null {
  const norm = normalizeHeader(raw);
  for (const [aliases, field] of HEADER_ALIASES) {
    for (const alias of aliases) {
      if (normalizeHeader(alias) === norm) return field;
    }
  }
  for (const [aliases, field] of HEADER_ALIASES) {
    for (const alias of aliases) {
      if (norm.includes(normalizeHeader(alias)) || normalizeHeader(alias).includes(norm)) return field;
    }
  }
  return null;
}

function cleanPhone(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 11);
}

function cleanCPF(v: string): string {
  return (v || "").replace(/\D/g, "").padStart(11, "0").slice(0, 11);
}

function validateRow(row: ImportRow, rowNum: number): ParsedRow {
  const errors: string[] = [];
  if (!row.name || row.name.trim().length < 2) errors.push("Nome inválido");
  return { ...row, _rowNum: rowNum, _errors: errors, _valid: errors.length === 0 };
}

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadImportDialog = ({ open, onOpenChange }: LeadImportDialogProps) => {
  const { companyId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState({ success: 0, errors: 0 });

  const reset = useCallback(() => {
    setStep("upload");
    setRows([]);
    setFileName("");
    setImportResult({ success: 0, errors: 0 });
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

      if (jsonRows.length === 0) {
        toast({ variant: "destructive", title: "Arquivo vazio" });
        return;
      }

      const rawHeaders = Object.keys(jsonRows[0]);
      const colMap: Record<string, keyof ImportRow> = {};
      for (const h of rawHeaders) {
        const mapped = mapHeader(h);
        if (mapped) colMap[h] = mapped;
      }

      if (!Object.values(colMap).includes("name")) {
        toast({ variant: "destructive", title: "Coluna 'Nome' não encontrada", description: "A planilha precisa ter pelo menos a coluna 'Nome'." });
        return;
      }

      const parsed: ParsedRow[] = jsonRows.map((raw, i) => {
        const row: ImportRow = { name: "" };
        for (const [rawKey, field] of Object.entries(colMap)) {
          const val = String(raw[rawKey] || "").trim();
          if (field === "phone") {
            (row as any)[field] = cleanPhone(val);
          } else if (field === "cpf") {
            (row as any)[field] = cleanCPF(val);
          } else {
            (row as any)[field] = val;
          }
        }
        return validateRow(row, i + 2);
      });

      setRows(parsed);
      setStep("preview");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao ler arquivo", description: e.message });
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    if (!companyId || !user) return;
    const validRows = rows.filter((r) => r._valid);
    if (validRows.length === 0) return;

    setStep("importing");
    let success = 0;
    let errors = 0;
    const CHUNK = 50;

    for (let i = 0; i < validRows.length; i += CHUNK) {
      const chunk = validRows.slice(i, i + CHUNK).map((r) => ({
        name: r.name.trim(),
        cpf: r.cpf || null,
        phone: r.phone || null,
        email: r.email || null,
        source: r.source || "importacao",
        city: r.city || null,
        state: r.state || null,
        notes: r.notes || null,
        company_id: companyId,
        created_by: user.id,
        pipeline_stage: "lead",
      }));

      const { data, error } = await (supabase.from("leads" as any) as any)
        .insert(chunk)
        .select("id");

      if (error) {
        for (const item of chunk) {
          const { error: singleErr } = await (supabase.from("leads" as any) as any).insert(item);
          if (singleErr) errors++;
          else success++;
        }
      } else {
        success += (data as any[]).length;
      }
    }

    setImportResult({ success, errors });
    setStep("done");
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }, [rows, companyId, user, queryClient]);

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.filter((r) => !r._valid).length;

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nome", "CPF", "Telefone", "Email", "Origem", "Cidade", "UF", "Observações"],
      ["João da Silva", "123.456.789-09", "(11) 99999-0000", "joao@email.com", "indicacao", "São Paulo", "SP", "Lead VIP"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "modelo_importacao_leads.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Leads
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie um arquivo <strong>CSV</strong> ou <strong>Excel (.xlsx)</strong>. A coluna obrigatória é <strong>Nome</strong>.
            </p>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Clique ou arraste o arquivo aqui</p>
              <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx, .xls</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar modelo de planilha
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Arquivo: <strong>{fileName}</strong> — {rows.length} registros</p>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> {validCount} válidos</Badge>
                {invalidCount > 0 && <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> {invalidCount} com erros</Badge>}
              </div>
            </div>
            <div className="max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r) => (
                    <TableRow key={r._rowNum} className={r._valid ? "" : "bg-destructive/5"}>
                      <TableCell className="text-xs text-muted-foreground">{r._rowNum}</TableCell>
                      <TableCell className="font-medium text-sm">{r.name || "—"}</TableCell>
                      <TableCell className="text-sm">{r.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{r.source || "—"}</TableCell>
                      <TableCell>
                        {r._valid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <span className="text-xs text-destructive">{r._errors.join(", ")}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 100 && <p className="text-xs text-muted-foreground p-2 text-center">Mostrando 100 de {rows.length}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>Importar {validCount} leads</Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importando leads, aguarde...</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold">{importResult.success} leads importados!</p>
              {importResult.errors > 0 && <p className="text-sm text-destructive mt-1">{importResult.errors} registros com erro</p>}
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadImportDialog;
