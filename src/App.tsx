import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { DspProvider } from "@/context/DspContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

import SignIn from "./pages/SignIn";
import SelectDsp from "./pages/SelectDsp";
import Dashboard from "./pages/Dashboard";
import Module from "./pages/Module";
import SavedReports from "./pages/SavedReports";
import SubmitRequest from "./pages/SubmitRequest";
import AccountSettings from "./pages/AccountSettings";
import AdminUsers from "./pages/AdminUsers";
import AdminRoles from "./pages/AdminRoles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DspProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/sign-in" replace />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/select-dsp" element={<ProtectedRoute><SelectDsp /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="m/:groupCode/:moduleCode" element={<Module />} />
                  <Route path="saved-reports" element={<SavedReports />} />
                  <Route path="submit-request" element={<SubmitRequest />} />
                  <Route path="account" element={<AccountSettings />} />
                  <Route path="admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
                  <Route path="admin/roles" element={<ProtectedRoute requireAdmin><AdminRoles /></ProtectedRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DspProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
