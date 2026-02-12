import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, ArrowRight, Check, Search, Plus, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";

const steps = [
  { id: 1, label: "Dados do Cliente" },
  { id: 2, label: "Banco / Produto" },
  { id: 3, label: "Contratos Portabilidade" },
  { id: 4, label: "Simulação" },
  { id: 5, label: "Dados Bancários" },
  { id: 6, label: "Revisão" },
];

const modalityLabels: Record<string, string> = {
  margem_livre: "Margem Livre",
  portabilidade: "Portabilidade",
  port_refinanciamento: "Port. + Refinanciamento",
  cartao_consignado: "Cartão Consignado",
  fgts_antecipacao: "FGTS (Antecipação)",
  credito_trabalhador: "Crédito do Trabalhador",
};

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const NewProposal = () => {
  const navigate = useNavigate();
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [cpfSearch, setCpfSearch] = useState("");

  // Form state
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modality, setModality] = useState("");
  const [covenant, setCovenant] = useState("");
  const [requestedValue, setRequestedValue] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [portContracts, setPortContracts] = useState<any[]>([]);
  const [bankAgency, setBankAgency] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountType, setBankAccountType] = useState("corrente");
  const [pixKey, setPixKey] = useState("");
  const [observations, setObservations] = useState("");

  // Queries
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("clients" as any) as any).select("*").order("full_name");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["banks", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("banks" as any) as any).select("*, products(*)").eq("is_active", true).order("name");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const createProposal = useMutation({
    mutationFn: async (status: string) => {
      const { data, error } = await (supabase.from("proposals" as any) as any).insert({
        company_id: companyId!,
        client_id: selectedClient.id,
        bank_id: selectedBank?.id || null,
        product_id: selectedProduct?.id || null,
        seller_id: user!.id,
        modality: modality || null,
        covenant: covenant || null,
        requested_value: requestedValue ? parseFloat(requestedValue) : null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        term_months: termMonths ? parseInt(termMonths) : null,
        bank_agency: bankAgency || null,
        bank_account: bankAccount || null,
        bank_account_type: bankAccountType || null,
        pix_key: pixKey || null,
        observations: observations || null,
        internal_status: status as any,
      }).select().single();

      if (error) throw error;

      // Save portability contracts
      if (portContracts.length > 0 && data) {
        // @ts-ignore - new tables not in generated types yet
        const { error: pcError } = await (supabase.from("portability_contracts" as any) as any).insert(
          portContracts.map((pc) => ({
            proposal_id: data.id,
            original_bank: pc.original_bank,
            contract_number: pc.contract_number,
            outstanding_balance: pc.outstanding_balance ? parseFloat(pc.outstanding_balance) : null,
            installment_value: pc.installment_value ? parseFloat(pc.installment_value) : null,
            remaining_term: pc.remaining_term ? parseInt(pc.remaining_term) : null,
          }))
        );
        if (pcError) console.error("Error saving portability contracts:", pcError);
      }

      // Log status history
      if (data) {
        await (supabase.from("proposal_status_history" as any) as any).insert({
          proposal_id: data.id,
          new_status: status as any,
          changed_by: user!.id,
          notes: "Proposta criada",
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposta gravada com sucesso!" });
      navigate("/propostas");
    },
    onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const filteredClients = clients.filter((c: any) =>
    c.cpf.includes(cpfSearch.replace(/\D/g, "")) ||
    c.full_name.toLowerCase().includes(cpfSearch.toLowerCase())
  );

  const [newContract, setNewContract] = useState({
    original_bank: "", contract_number: "", outstanding_balance: "", installment_value: "", remaining_term: ""
  });

  const addContract = () => {
    if (!newContract.original_bank || !newContract.contract_number) return;
    setPortContracts([...portContracts, { ...newContract }]);
    setNewContract({ original_bank: "", contract_number: "", outstanding_balance: "", installment_value: "", remaining_term: "" });
  };

  const installmentCalc = requestedValue && termMonths && interestRate
    ? (parseFloat(requestedValue) * (parseFloat(interestRate) / 100)) / (1 - Math.pow(1 + parseFloat(interestRate) / 100, -parseInt(termMonths)))
    : 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/propostas")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gold-gradient">Nova Proposta</h1>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {steps.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                step === s.id ? "bg-primary text-primary-foreground" : 
                step > s.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-current">
                {step > s.id ? <Check className="w-3 h-3" /> : s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Client */}
        {step === 1 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
              <CardDescription>Busque pelo CPF ou nome do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={cpfSearch} onChange={(e) => setCpfSearch(e.target.value)} placeholder="Digite CPF ou nome..." className="pl-10" />
              </div>
              {cpfSearch && (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {filteredClients.map((c: any) => (
                    <div
                      key={c.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedClient?.id === c.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                      )}
                      onClick={() => setSelectedClient(c)}
                    >
                      <p className="font-medium text-sm">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">CPF: {c.cpf} • {c.phone || "Sem telefone"}</p>
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum cliente encontrado. <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/clientes")}>Cadastrar novo</Button>
                    </p>
                  )}
                </div>
              )}
              {selectedClient && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/30">
                  <p className="text-sm font-medium">Selecionado: {selectedClient.full_name}</p>
                  <p className="text-xs text-muted-foreground">CPF: {selectedClient.cpf}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Bank/Product */}
        {step === 2 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Seleção Banco / Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Convênio</Label>
                  <Select value={covenant} onValueChange={setCovenant}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSS">INSS</SelectItem>
                      <SelectItem value="SIAPE">SIAPE</SelectItem>
                      <SelectItem value="CLT">CLT</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modalidade</Label>
                  <Select value={modality} onValueChange={setModality}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(modalityLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Banco</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {banks.map((bank: any) => (
                    <div
                      key={bank.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer text-center transition-colors",
                        selectedBank?.id === bank.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                      )}
                      onClick={() => { setSelectedBank(bank); setSelectedProduct(null); }}
                    >
                      <p className="text-sm font-medium">{bank.name}</p>
                      <p className="text-xs text-muted-foreground">{bank.products?.length || 0} produtos</p>
                    </div>
                  ))}
                </div>
              </div>
              {selectedBank?.products?.length > 0 && (
                <div>
                  <Label>Produto</Label>
                  <div className="space-y-2 mt-2">
                    {selectedBank.products
                      .filter((p: any) => (!modality || p.modality === modality) && (!covenant || p.covenant === covenant))
                      .map((p: any) => (
                        <div
                          key={p.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedProduct?.id === p.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                          )}
                          onClick={() => setSelectedProduct(p)}
                        >
                          <p className="text-sm font-medium">{p.name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{modalityLabels[p.modality]}</Badge>
                            <Badge variant="outline" className="text-[10px]">{p.covenant}</Badge>
                            {p.min_rate && <Badge variant="outline" className="text-[10px]">Taxa: {p.min_rate}%–{p.max_rate}%</Badge>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Portability Contracts */}
        {step === 3 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Contratos de Portabilidade</CardTitle>
              <CardDescription>Adicione contratos existentes para portabilidade (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <Input placeholder="Banco original" value={newContract.original_bank} onChange={(e) => setNewContract({ ...newContract, original_bank: e.target.value })} />
                <Input placeholder="Nº contrato" value={newContract.contract_number} onChange={(e) => setNewContract({ ...newContract, contract_number: e.target.value })} />
                <Input placeholder="Saldo devedor" type="number" value={newContract.outstanding_balance} onChange={(e) => setNewContract({ ...newContract, outstanding_balance: e.target.value })} />
                <Input placeholder="Parcela" type="number" value={newContract.installment_value} onChange={(e) => setNewContract({ ...newContract, installment_value: e.target.value })} />
                <Button onClick={addContract} disabled={!newContract.original_bank || !newContract.contract_number}>
                  <Plus className="w-4 h-4 mr-1" />Adicionar
                </Button>
              </div>
              {portContracts.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banco</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portContracts.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{c.original_bank}</TableCell>
                        <TableCell>{c.contract_number}</TableCell>
                        <TableCell>{c.outstanding_balance ? formatCurrency(parseFloat(c.outstanding_balance)) : "—"}</TableCell>
                        <TableCell>{c.installment_value ? formatCurrency(parseFloat(c.installment_value)) : "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setPortContracts(portContracts.filter((_, j) => j !== i))}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Simulation */}
        {step === 4 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Valor Solicitado (R$)</Label>
                  <Input type="number" value={requestedValue} onChange={(e) => setRequestedValue(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label>Prazo (meses)</Label>
                  <Input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} placeholder="84" />
                </div>
                <div>
                  <Label>Taxa de Juros (%)</Label>
                  <Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="1.80" />
                </div>
              </div>
              {installmentCalc > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm text-muted-foreground">Parcela estimada:</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(installmentCalc)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Bank Data */}
        {step === 5 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Dados Bancários - Liberação do Crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Agência</Label>
                  <Input value={bankAgency} onChange={(e) => setBankAgency(e.target.value)} placeholder="0001" />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="12345-6" />
                </div>
                <div>
                  <Label>Tipo de Conta</Label>
                  <Select value={bankAccountType} onValueChange={setBankAccountType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Chave PIX (opcional)</Label>
                  <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, email, telefone..." />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Revisão da Proposta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedClient?.full_name || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">CPF</p>
                  <p className="font-medium">{selectedClient?.cpf || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">Banco</p>
                  <p className="font-medium">{selectedBank?.name || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">Modalidade</p>
                  <p className="font-medium">{modalityLabels[modality] || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">Valor Solicitado</p>
                  <p className="font-medium">{requestedValue ? formatCurrency(parseFloat(requestedValue)) : "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">Prazo</p>
                  <p className="font-medium">{termMonths ? `${termMonths} meses` : "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">Taxa</p>
                  <p className="font-medium">{interestRate ? `${interestRate}%` : "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">Parcela Estimada</p>
                  <p className="font-medium text-primary">{installmentCalc > 0 ? formatCurrency(installmentCalc) : "—"}</p>
                </div>
              </div>
              {portContracts.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Contratos de Portabilidade: {portContracts.length}</p>
                </div>
              )}
              <div>
                <Label>Observações</Label>
                <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} placeholder="Informações adicionais..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate("/propostas")} disabled={createProposal.isPending}>
            <ArrowLeft className="w-4 h-4 mr-2" />{step === 1 ? "Cancelar" : "Voltar"}
          </Button>
          <div className="flex gap-2">
            {step === 6 && (
              <>
                <Button variant="outline" onClick={() => createProposal.mutate("rascunho")} disabled={!selectedClient || createProposal.isPending}>
                  Gravar Proposta
                </Button>
                <Button onClick={() => createProposal.mutate("enviada_analise")} disabled={!selectedClient || createProposal.isPending}>
                  <Check className="w-4 h-4 mr-2" />Enviar para Análise
                </Button>
              </>
            )}
            {step < 6 && (
              <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !selectedClient}>
                Próximo<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NewProposal;
