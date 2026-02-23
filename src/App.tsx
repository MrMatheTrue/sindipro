import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CondominioDetails from "./pages/CondominioDetails";
import Obrigacoes from "./pages/Obrigacoes";
import Documentos from "./pages/Documentos";
import CheckIn from "./pages/CheckIn";
import Equipe from "./pages/Equipe";
import Configuracoes from "./pages/Configuracoes";
import Onboarding from "./pages/Onboarding";
import IAChat from "./pages/IAChat";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/condominios/:id" element={<CondominioDetails />} />
              <Route path="/condominios/:id/obrigacoes" element={<Obrigacoes />} />
              <Route path="/condominios/:id/documentos" element={<Documentos />} />
              <Route path="/condominios/:id/checkin" element={<CheckIn />} />
              <Route path="/condominios/:id/equipe" element={<Equipe />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/ia" element={<IAChat />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
