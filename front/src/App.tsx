import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/Clients";
import VehiclesPage from "@/pages/Vehicles";
import ProductsPage from "@/pages/Products";
import EmployeesPage from "@/pages/Employees";
import ServicesPage from "@/pages/Services";
import ServiceOrdersPage from "@/pages/ServiceOrders";
import ServiceOrderDetailPage from "@/pages/ServiceOrderDetail";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/veiculos" element={<VehiclesPage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/servicos" element={<ServicesPage />} />
            <Route
              path="/funcionarios"
              element={
                <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/os" element={<ServiceOrdersPage />} />
            <Route path="/os/:id" element={<ServiceOrderDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
