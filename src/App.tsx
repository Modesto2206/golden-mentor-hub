import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BanksPage = lazy(() => import("./pages/Banks"));
const ClientsPage = lazy(() => import("./pages/Clients"));
const ProposalsPage = lazy(() => import("./pages/Proposals"));
const NewProposal = lazy(() => import("./pages/NewProposal"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StorePage = lazy(() => import("./pages/Store"));
const CompanySettingsPage = lazy(() => import("./pages/CompanySettings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CreateCompany = lazy(() => import("./pages/CreateCompany"));
const FinancialReport = lazy(() => import("./pages/FinancialReport"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="credmais-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/criar-empresa" element={<CreateCompany />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/bancos" element={<BanksPage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/propostas" element={<ProposalsPage />} />
                <Route path="/propostas/nova" element={<NewProposal />} />
                <Route path="/loja" element={<StorePage />} />
                <Route path="/relatorio" element={<FinancialReport />} />
                <Route path="/super-admin" element={<SuperAdminDashboard />} />
                <Route path="/configuracoes" element={<CompanySettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
