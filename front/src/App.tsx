import { useState } from "react";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import ClientsPage from "@/pages/Clients";
import VehiclesPage from "@/pages/Vehicles";
import ProductsPage from "@/pages/Products";
import EmployeesPage from "@/pages/Employees";
import ServiceOrdersPage from "@/pages/ServiceOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar, type Page } from "@/components/layout/Sidebar";

function App() {
  const { accessToken, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!accessToken) {
    return <Login />;
  }

  function renderPage() {
    switch (currentPage) {
      case "clientes":
        return <ClientsPage />;
      case "os":
        return <ServiceOrdersPage />;
      case "veiculos":
        return <VehiclesPage />;
      case "produtos":
        return <ProductsPage />;
      case "funcionarios":
        return <EmployeesPage />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;
