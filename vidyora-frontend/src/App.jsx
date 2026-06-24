import { AuthProvider } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";
import { AcademicYearProvider } from "./context/AcademicYearContext";
import { ToastProvider } from "./components/ui";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TenantProvider>
          <AcademicYearProvider>
            <AppRoutes />
          </AcademicYearProvider>
        </TenantProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;