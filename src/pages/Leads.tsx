import { useState } from "react";
import { Upload, Users, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import ClientImportDialog from "@/components/clients/ClientImportDialog";

const LeadsPage = () => {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">Leads</h1>
            <p className="text-sm text-muted-foreground">Importe e gerencie seus leads em massa</p>
          </div>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Planilha
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Importação em Massa
              </CardTitle>
              <CardDescription>
                Envie um arquivo CSV ou Excel (.xlsx) com os dados dos leads para cadastrá-los automaticamente como clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Como funciona
              </CardTitle>
              <CardDescription>
                Passo a passo para importar seus leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">1.</strong> Prepare sua planilha com as colunas <strong className="text-foreground">Nome</strong> e <strong className="text-foreground">CPF</strong> (obrigatórios).</p>
              <p><strong className="text-foreground">2.</strong> Campos opcionais: Telefone, Data de Nascimento, Email, Convênio, Modalidade, Cidade, UF, Observações.</p>
              <p><strong className="text-foreground">3.</strong> Clique em "Importar Planilha" e envie o arquivo.</p>
              <p><strong className="text-foreground">4.</strong> Revise os dados na pré-visualização e confirme a importação.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </AppLayout>
  );
};

export default LeadsPage;
