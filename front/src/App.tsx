import Dashboard from "@/pages/Dashboard"
import Login from "@/pages/Login"
import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return accessToken ? (
    <>
    <ThemeToggle />
      <Dashboard />
    </>
    ) : (
    <>  
      <ThemeToggle />
      <Login />
    </>
  );
}

export default App;