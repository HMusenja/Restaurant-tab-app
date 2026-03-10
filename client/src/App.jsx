import { SnackbarProvider } from "./contexts/SnackbarContext";

import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    

    <SnackbarProvider>
      <AppRoutes />
    </SnackbarProvider>
  );
}
