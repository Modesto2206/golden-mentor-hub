const modalityLabels: Record<string, string> = {
  margem_livre: "Margem Livre",
  portabilidade: "Portabilidade",
  port_refinanciamento: "Port. + Refinanciamento",
  cartao_consignado: "Cartão Consignado",
  fgts_antecipacao: "FGTS (Antecipação)",
  credito_trabalhador: "Crédito do Trabalhador",
};

const internalStatusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  pre_cadastrada: "Pré-Cadastrada",
  cadastrada: "Cadastrada",
  enviada_analise: "Enviada p/ Análise",
  em_analise: "Em Análise",
  pendente_formalizacao: "Pend. Formalização",
  pendente_assinatura: "Pend. Assinatura",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
  paga_liberada: "Paga / Liberada",
};

const bankStatusLabels: Record<string, string> = {
  nao_enviado: "Não Enviado",
  recebido: "Recebido",
  pendente_documentos: "Pend. Documentos",
  pendente_assinatura: "Pend. Assinatura",
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  pago: "Pago",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface ProposalData {
  id: string;
  clients?: { full_name?: string; cpf?: string; phone?: string; email?: string };
  banks?: { name?: string };
  modality?: string;
  covenant?: string;
  requested_value?: number;
  released_value?: number;
  approved_value?: number;
  interest_rate?: number;
  term_months?: number;
  installment_value?: number;
  internal_status?: string;
  bank_status?: string;
  protocolo_banco?: string;
  external_proposal_id?: string;
  observations?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: string;
  pix_key?: string;
  created_at?: string;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:8px 12px;font-weight:600;color:#555;width:40%;border-bottom:1px solid #eee">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${value}</td></tr>`;
}

export function generateProposalPDF(proposal: ProposalData) {
  const p = proposal;
  const clientName = p.clients?.full_name || "—";
  const date = p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta - ${clientName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #222; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d4a017; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; color: #1a1a2e; }
  .header .meta { text-align: right; font-size: 12px; color: #666; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #d4a017; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .status-approved { background: #d1fae5; color: #065f46; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Proposta de Crédito</h1>
      <p style="font-size:12px;color:#888;margin-top:4px">ID: ${p.id?.slice(0, 8)}...</p>
    </div>
    <div class="meta">
      <p><strong>Data:</strong> ${date}</p>
      ${p.protocolo_banco ? `<p><strong>Protocolo:</strong> ${p.protocolo_banco}</p>` : ""}
      ${p.external_proposal_id ? `<p><strong>Nº Proposta:</strong> ${p.external_proposal_id}</p>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Cliente</div>
    <table>
      ${row("Nome", clientName)}
      ${row("CPF", p.clients?.cpf || "—")}
      ${p.clients?.phone ? row("Telefone", p.clients.phone) : ""}
      ${p.clients?.email ? row("E-mail", p.clients.email) : ""}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Detalhes da Proposta</div>
    <table>
      ${row("Banco", p.banks?.name || "—")}
      ${row("Modalidade", modalityLabels[p.modality || ""] || p.modality || "—")}
      ${p.covenant ? row("Convênio", p.covenant) : ""}
      ${row("Valor Solicitado", p.requested_value ? formatCurrency(p.requested_value) : "—")}
      ${p.approved_value ? row("Valor Aprovado", formatCurrency(p.approved_value)) : ""}
      ${p.released_value ? row("Valor Liberado", formatCurrency(p.released_value)) : ""}
      ${p.interest_rate ? row("Taxa de Juros", `${p.interest_rate}% a.m.`) : ""}
      ${p.term_months ? row("Prazo", `${p.term_months} meses`) : ""}
      ${p.installment_value ? row("Parcela", formatCurrency(p.installment_value)) : ""}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Status</div>
    <table>
      ${row("Status Interno", internalStatusLabels[p.internal_status || ""] || p.internal_status || "—")}
      ${row("Status Banco", bankStatusLabels[p.bank_status || ""] || p.bank_status || "—")}
    </table>
  </div>

  ${p.bank_agency || p.bank_account || p.pix_key ? `
  <div class="section">
    <div class="section-title">Dados Bancários para Liberação</div>
    <table>
      ${p.bank_agency ? row("Agência", p.bank_agency) : ""}
      ${p.bank_account ? row("Conta", p.bank_account) : ""}
      ${p.bank_account_type ? row("Tipo", p.bank_account_type === "corrente" ? "Conta Corrente" : "Poupança") : ""}
      ${p.pix_key ? row("Chave PIX", p.pix_key) : ""}
    </table>
  </div>` : ""}

  ${p.observations ? `
  <div class="section">
    <div class="section-title">Observações</div>
    <p style="font-size:13px;padding:8px 12px;background:#f9f9f9;border-radius:6px">${p.observations}</p>
  </div>` : ""}

  <div class="footer">
    Documento gerado automaticamente em ${new Date().toLocaleString("pt-BR")} • CredMais CRM
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}
