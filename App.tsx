import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Dashboard from "./pages/dashboard";
import Vendas from "./pages/vendas";
import Produtos from "./pages/produtos";
import Clientes from "./pages/clientes";
import ContasReceber from "./pages/contas-receber";
import ContasPagar from "./pages/contas-pagar";
import FluxoCaixa from "./pages/fluxo-caixa";
import Relatorios from "./pages/relatorios";
import Auth from "./pages/auth";
import NotFound from "./pages/NotFound";

const App = () => (
  <ReactQueryProvider>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendas"
              element={
                <ProtectedRoute>
                  <Vendas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos"
              element={
                <ProtectedRoute>
                  <Produtos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contas-receber"
              element={
                <ProtectedRoute>
                  <ContasReceber />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contas-pagar"
              element={
                <ProtectedRoute>
                  <ContasPagar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fluxo-caixa"
              element={
                <ProtectedRoute>
                  <FluxoCaixa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </ReactQueryProvider>
);

export default App;

