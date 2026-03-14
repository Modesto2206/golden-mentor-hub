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
  full_name: string;
  cpf: string;
  phone?: string;
  birth_date?: string;
  email?: string;
  gender?: string;
  address_city?: string;
  address_state?: string;
  convenio?: string;
  modalidade?: string;
  internal_notes?: string;
}

interface ParsedRow extends ImportRow {
  _rowNum: number;
  _errors: string[];
  _valid: boolean;
}

const HEADER_MAP: Record<string, keyof ImportRow> = {};
const HEADER_ALIASES: [string[], keyof ImportRow][] = [
  [["nome", "nome_completo", "full_name", "nome completo", "cliente"], "full_name"],
  [["cpf", "cpf_cliente", "documento"], "cpf"],
  [["telefone", "phone", "celular", "tel", "fone", "whatsapp"], "phone"],
  [["nascimento", "data_nascimento", "birth_date", "data de nascimento", "dt_nascimento", "dt nascimento"], "birth_date"],
  [["email", "e-mail", "e_mail"], "email"],
  [["sexo", "genero", "gênero", "gender"], "gender"],
  [["cidade", "city", "address_city", "municipio", "município"], "address_city"],
  [["uf", "estado", "state", "address_state"], "address_state"],
  [["convenio", "convênio", "covenant"], "convenio"],
  [["modalidade", "modality", "tipo_operacao"], "modalidade"],
  [["observacoes", "observações", "notas", "notes", "internal_notes", "obs"], "internal_notes"],
];

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function mapHeader(raw: string): keyof ImportRow | null {
  const norm = normalizeHeader(raw);
  for (const [aliases, field] of HEADER_ALIASES) {
    for (const alias of aliases) {
      if (normalizeHeader(alias) === norm) return field;
    }
  }
  // partial match
  for (const [aliases, field] of HEADER_ALIASES) {
    for (const alias of aliases) {
      if (norm.includes(normalizeHeader(alias)) || normalizeHeader(alias).includes(norm)) return field;
    }
  }
  return null;
}

function cleanCPF(v: string): string {
  return (v || "").replace(/\D/g, "").padStart(11, "0").slice(0, 11);
}

function cleanPhone(v: string): string {
  return (v || "").replace(/\D/g, "").slice(0, 11);
}

function parseDate(v: string): string | undefined {
  if (!v) return undefined;
  // Try dd/mm/yyyy
  const brMatch = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try yyyy-mm-dd
  const isoMatch = v.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Excel serial number
  const num = Number(v);
  if (!isNaN(num) && num > 10000 && num < 100000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  return undefined;
}

function mapGender(v: string): string | undefined {
  if (!v) return undefined;
  const l = v.toLowerCase().trim();
  if (["m", "masculino", "male"].includes(l)) return "M";
  if (["f", "feminino", "female"].includes(l)) return "F";
  if (["o", "outro", "other"].includes(l)) return "O";
  return undefined;
}

function validateRow(row: ImportRow, rowNum: number): ParsedRow {
  const errors: string[] = [];
  if (!row.full_name || row.full_name.trim().length < 3) errors.push("Nome inválido");
  const cpfDigits = cleanCPF(row.cpf);
  if (cpfDigits.length !== 11 || /^(\d)\1+$/.test(cpfDigits)) errors.push("CPF inválido");
  return { ...row, cpf: cpfDigits, _rowNum: rowNum, _errors: errors, _valid: errors.length === 0 };
}

interface ClientImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientImportDialog = ({ open, onOpenChange }: ClientImportDialogProps) => {
  const { companyId, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });

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
        toast({ variant: "destructive", title: "Arquivo vazio", description: "A planilha não contém dados." });
        return;
      }

      // Build column mapping from headers
      const rawHeaders = Object.keys(jsonRows[0]);
      const colMap: Record<string, keyof ImportRow> = {};
      for (const h of rawHeaders) {
        const mapped = mapHeader(h);
        if (mapped) colMap[h] = mapped;
      }

      if (!colMap || !Object.values(colMap).includes("full_name") || !Object.values(colMap).includes("cpf")) {
        toast({ variant: "destructive", title: "Colunas não encontradas", description: "A planilha precisa ter pelo menos as colunas 'Nome' e 'CPF'." });
        return;
      }

      const parsed: ParsedRow[] = jsonRows.map((raw, i) => {
        const row: ImportRow = {
          full_name: "",
          cpf: "",
        };
        for (const [rawKey, field] of Object.entries(colMap)) {
          const val = String(raw[rawKey] || "").trim();
          if (field === "birth_date") {
            (row as any)[field] = parseDate(val) || "";
          } else if (field === "gender") {
            (row as any)[field] = mapGender(val) || "";
          } else if (field === "phone") {
            (row as any)[field] = cleanPhone(val);
          } else if (field === "cpf") {
            (row as any)[field] = val;
          } else {
            (row as any)[field] = val;
          }
        }
        return validateRow(row, i + 2); // +2 for header row + 0-index
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

    // Batch insert in chunks of 50
    const CHUNK = 50;
    for (let i = 0; i < validRows.length; i += CHUNK) {
      const chunk = validRows.slice(i, i + CHUNK).map((r) => ({
        full_name: r.full_name.trim(),
        cpf: cleanCPF(r.cpf),
        phone: r.phone ? cleanPhone(r.phone) : null,
        birth_date: r.birth_date || null,
        email: r.email || null,
        gender: r.gender || null,
        address_city: r.address_city || null,
        address_state: r.address_state || null,
        convenio: r.convenio || null,
        modalidade: r.modalidade || null,
        internal_notes: r.internal_notes || null,
        company_id: companyId,
        created_by: user.id,
      }));

      const { data, error } = await (supabase.from("clients" as any) as any)
        .insert(chunk)
        .select("id");

      if (error) {
        // Fallback: insert one by one
        for (const item of chunk) {
          const { error: singleErr } = await (supabase.from("clients" as any) as any).insert(item);
          if (singleErr) errors++;
          else success++;
        }
      } else {
        success += (data as any[]).length;
      }
    }

    setImportResult({ success, errors });
    setStep("done");
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  }, [rows, companyId, user, queryClient]);

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.filter((r) => !r._valid).length;

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nome Completo", "CPF", "Telefone", "Data Nascimento", "Email", "Sexo", "Cidade", "UF", "Convênio", "Modalidade", "Observações"],
      ["João da Silva", "123.456.789-09", "(11) 99999-0000", "15/03/1985", "joao@email.com", "M", "São Paulo", "SP", "INSS", "margem_livre", "Cliente VIP"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo_importacao_clientes.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Clientes
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie um arquivo <strong>CSV</strong> ou <strong>Excel (.xlsx)</strong> com os dados dos clientes.
              As colunas obrigatórias são <strong>Nome</strong> e <strong>CPF</strong>.
            </p>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Clique ou arraste o arquivo aqui</p>
              <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx, .xls</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar modelo de planilha
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Arquivo: <strong>{fileName}</strong> — {rows.length} registros encontrados
              </p>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> {validCount} válidos</Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> {invalidCount} com erros</Badge>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r) => (
                    <TableRow key={r._rowNum} className={r._valid ? "" : "bg-destructive/5"}>
                      <TableCell className="text-xs text-muted-foreground">{r._rowNum}</TableCell>
                      <TableCell className="font-medium text-sm">{r.full_name || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.cpf || "—"}</TableCell>
                      <TableCell className="text-sm">{r.phone || "—"}</TableCell>
                      <TableCell>
                        {r._valid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-destructive">{r._errors.join(", ")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 100 && (
                <p className="text-xs text-muted-foreground p-2 text-center">Mostrando 100 de {rows.length} registros</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} clientes
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importando clientes, aguarde...</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold">{importResult.success} clientes importados!</p>
              {importResult.errors > 0 && (
                <p className="text-sm text-destructive mt-1">{importResult.errors} registros com erro (CPF duplicado, etc.)</p>
              )}
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientImportDialog;
