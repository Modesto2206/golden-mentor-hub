import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import WhatsAppFAB from "@/components/WhatsAppFAB";
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
const WhatsAppPanel = lazy(() => import("./pages/WhatsAppPanel"));
const LeadsPage = lazy(() => import("./pages/Leads"));
const PipelinePage = lazy(() => import("./pages/Pipeline"));

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

// Wrapper to add error boundary per route
const SafeRoute = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="credmais-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<SafeRoute><Index /></SafeRoute>} />
                  <Route path="/auth" element={<SafeRoute><Auth /></SafeRoute>} />
                  <Route path="/reset-password" element={<SafeRoute><ResetPassword /></SafeRoute>} />
                  <Route path="/criar-empresa" element={<SafeRoute><CreateCompany /></SafeRoute>} />
                  <Route path="/dashboard" element={<SafeRoute><Dashboard /></SafeRoute>} />
                  <Route path="/bancos" element={<SafeRoute><BanksPage /></SafeRoute>} />
                  <Route path="/clientes" element={<SafeRoute><ClientsPage /></SafeRoute>} />
                  <Route path="/propostas" element={<SafeRoute><ProposalsPage /></SafeRoute>} />
                  <Route path="/propostas/nova" element={<SafeRoute><NewProposal /></SafeRoute>} />
                  <Route path="/loja" element={<SafeRoute><StorePage /></SafeRoute>} />
                  <Route path="/relatorio" element={<SafeRoute><FinancialReport /></SafeRoute>} />
                  <Route path="/super-admin" element={<SafeRoute><SuperAdminDashboard /></SafeRoute>} />
                  <Route path="/configuracoes" element={<SafeRoute><CompanySettingsPage /></SafeRoute>} />
                  <Route path="/whatsapp" element={<SafeRoute><WhatsAppPanel /></SafeRoute>} />
                  <Route path="/leads" element={<SafeRoute><LeadsPage /></SafeRoute>} />
                  <Route path="/pipeline" element={<SafeRoute><PipelinePage /></SafeRoute>} />
                  <Route path="*" element={<SafeRoute><NotFound /></SafeRoute>} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
          <WhatsAppFAB />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
