import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBillingStatus } from "@/hooks/useBillingStatus";

const BillingAlert = () => {
  const { isBlocked, latestOverdue } = useBillingStatus();

  if (!isBlocked) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="font-bold">Empresa com pagamento em atraso</AlertTitle>
      <AlertDescription>
        Operações críticas estão bloqueadas até a regularização do pagamento.
        {latestOverdue && (
          <span className="block mt-1 text-xs opacity-80">
            Vencimento: {new Date(latestOverdue.due_date).toLocaleDateString("pt-BR")} — 
            Valor: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(latestOverdue.amount))}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default BillingAlert;
